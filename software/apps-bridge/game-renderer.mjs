import {chromium} from 'playwright-core';

// The visible tab keeps the camera. This browser only renders the selected game
// and receives pointer coordinates relative to its own, isolated viewport.
export async function renderGame({url, origin, profile, viewport, signal, onFrame, onEnded}, prepareContext) {
  const context = await chromium.launchPersistentContext(profile, {
    channel:'chrome', headless:true, chromiumSandbox:true, viewport, timeout:12000,
    ignoreDefaultArgs:['--mute-audio'], acceptDownloads:false
  });
  const close = () => context.close().catch(() => {});
  signal.addEventListener('abort', close, {once:true});
  try {
    signal.throwIfAborted();
    const page = context.pages()[0] || await context.newPage();
    context.on('page', popup => { if (popup !== page) void popup.close().catch(() => {}); });
    context.once('close', onEnded);
    page.once('crash', onEnded);
    await prepareContext?.(context);
    const shell = origin + '/toki-game-surface';
    // Keep the original service in its own origin, framed under Toki as in mouse mode.
    // The one-pixel gutter lets us remove hover as soon as tracking is lost.
    await page.route(shell, route => route.fulfill({contentType:'text/html', body:
      '<meta name="viewport" content="width=device-width, initial-scale=1"><style>*{margin:0}body{background:#171923}iframe{position:fixed;inset:1px;width:calc(100% - 2px);height:calc(100% - 2px);border:0}</style>'+
      '<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock" allow="autoplay; fullscreen; gamepad" src="'+url+'"></iframe>'}));
    await page.goto(shell, {waitUntil:'domcontentloaded'});
    const cdp = await context.newCDPSession(page);
    cdp.on('Page.screencastFrame', ({data,sessionId}) => {
      onFrame(data);
      void cdp.send('Page.screencastFrameAck', {sessionId}).catch(() => {});
    });
    await cdp.send('Page.startScreencast', {format:'jpeg',quality:75,everyNthFrame:2});
    return {
      close,
      async input({type,x,y}) {
        if (type === 'leave') return page.mouse.move(0,0);
        const px = 1 + x * (viewport.width - 3);
        const py = 1 + y * (viewport.height - 3);
        if (type === 'click') return page.mouse.click(px,py);
        return page.mouse.move(px,py);
      }
    };
  } catch (error) {
    await close();
    throw error;
  }
}
