import {chromium} from 'playwright-core';

// A frame-polled game needs to see the button held across a render tick.
const GAME_PRESS_MS = 100;

// The visible tab keeps the camera. This browser only renders the selected game
// and receives pointer coordinates relative to its own, isolated viewport.
export async function renderGame({url, profile, viewport, signal, onFrame, onEnded}, prepareContext) {
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
    // Open the official game as a first-party page so its anonymous profile survives relaunches.
    await page.goto(url, {waitUntil:'domcontentloaded'});
    const cdp = await context.newCDPSession(page);
    let receivedFrame = false;
    cdp.on('Page.screencastFrame', ({data,sessionId}) => {
      receivedFrame = true;
      onFrame(data);
      void cdp.send('Page.screencastFrameAck', {sessionId}).catch(() => {});
    });
    await cdp.send('Page.startScreencast', {format:'jpeg',quality:75,everyNthFrame:1});
    // A static menu may already be painted when the screencast subscribes.
    if (!receivedFrame) {
      const initial = await page.screenshot({type:'jpeg',quality:75});
      if (!receivedFrame) onFrame(initial.toString('base64'));
    }
    let previousInput = Promise.resolve();
    let pendingMove;
    function input(point) {
      // Replace only adjacent, unsent gaze samples. A click or leave separates them.
      if (point.type === 'move' && pendingMove) {
        pendingMove.point = point;
        return pendingMove.done;
      }
      const queued = {point};
      pendingMove = point.type === 'move' ? queued : null;
      queued.done = previousInput.then(() => {
        if (pendingMove === queued) pendingMove = null;
        const {type,x,y} = queued.point;
        if (type === 'leave') return page.mouse.move(-1,-1);
        const px = x * (viewport.width - 1);
        const py = y * (viewport.height - 1);
        if (type === 'click') return page.mouse.click(px,py,{delay:GAME_PRESS_MS});
        return page.mouse.move(px,py);
      });
      previousInput = queued.done.catch(() => {});
      return queued.done;
    }
    return {close, input};
  } catch (error) {
    await close();
    throw error;
  }
}
