/* Apps uses the shell's native-button gaze/muscle controller. */
(() => {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titles = {preparing:'Preparando',queued:'En espera',needs_connection:'Falta conectar la cuenta',needs_test:'Pendiente de prueba',needs_adapter:'Aún no disponible',ready:'Lista para abrir',cancelled:'Preparación cancelada',error:'No se pudo preparar',interrupted:'Preparación interrumpida'};
  const phaseLabels = ['Encontrar conexión', 'Preparar interfaz', 'Conectar cuenta', 'Comprobar funciones', 'Revisar contigo'];
  const groups = ['ABCDE', 'FGHIJ', 'KLMNÑ', 'OPQRS', 'TUVWXYZ', '0123456789'];
  const servicesPerPage = 6;
  const usable = job => ['needs_connection','needs_test','ready'].includes(job?.status);
  const failedJob = job => ['cancelled','error','interrupted'].includes(job?.status);
  const safeImage = url => typeof url === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : '';
  function brandLogo(id, sourceUrl = '') {
    if (/^https:\/\/(?:www\.)?cooperativa\.cl\//i.test(sourceUrl)) id = 'cooperativa';
    if(!['spotify','whatsapp','youtube','biobio','rappi','mercadolibre','cooperativa'].includes(id))return '<span aria-hidden="true">▤</span>';
    return `<img class="service-logo logo-${id}" src="brands/${id}.svg" alt="" draggable="false">`;
  }
  const catalog = [
    {id:'spotify',name:'Spotify',category:'Música',intent:'Escuchar música',tasks:'Buscar canciones, elegir, reproducir y pausar.',description:'Elegir música, escuchar y pausar.'},
    {id:'whatsapp',name:'WhatsApp',category:'Mensajes',intent:'Hablar con alguien',tasks:'Elegir un contacto, leer y enviar mensajes con confirmación.',description:'Elegir un contacto y enviar mensajes.'},
    {id:'youtube',name:'YouTube',category:'Videos',intent:'Ver videos',tasks:'Elegir videos, reproducir y pausar.',description:'Elegir videos, reproducir y pausar.'},
    {id:'biobio',name:'BioBioChile',category:'Noticias',intent:'Leer noticias',tasks:'Elegir titulares de BioBioChile y leer extractos RSS por páginas.',description:'Elegir titulares y leer sus extractos por partes.'},
    {id:'rappi',name:'Rappi',category:'Comida',intent:'Elegir comida',tasks:'Elegir comida, revisar el pedido y confirmar antes de comprar.',description:'Elegir comida y revisar antes de pedir.'},
    {id:'mercadolibre',name:'Mercado Libre Chile',category:'Compras',intent:'Buscar productos',tasks:'Elegir productos, revisar precio y confirmar antes de comprar.',description:'Elegir productos y revisar antes de comprar.'}
  ];
  const music = [['Música chilena','Los Jaivas'],['Para relajarme','música relajante'],['Clásicos','clásicos en español'],['Algo alegre','cumbia chilena']];
  let active;
  class Apps {
    constructor(root, options = {}) {
      active?.destroy(); active=this;
      Object.assign(this,{root,options,jobs:[],view:'store',id:null,selected:'spotify',catalogPage:0,busy:false,error:'',query:'',group:'',field:'query',tracks:[],page:0,browser:'chrome',token:'',online:false,paused:false,functional:false,personal:false,epoch:0,destroyed:false});
      this.videoItems=[];this.videoSelection=null;this.videoController=null;this.videoModule=null;this.adapters=[];this.newsItems=[];this.newsPage=0;this.article=null;this.articlePage=0;
      this.food={categories:[],stores:[],items:[],page:0,selection:null,options:[],group:0,cart:null,status:null};
      this.playbackRevision = 0;
      this.readingPlayback = false;
      this.admin=new URLSearchParams(location.search).get('appsAdmin')==='1';
      this.base=location.port==='8000'?'http://127.0.0.1:8790':location.origin;
      root.classList.add('toki-apps'); root.classList.toggle('ta-admin',this.admin);
      this.click=e=>{const el=e.target.closest('[data-app-action]');if(el&&!options.motion){e.preventDefault();void this.act(el);}};
      this.input=e=>{if(e.target.dataset.appField)this[e.target.dataset.appField]=e.target.value;};
      root.addEventListener('click',this.click);root.addEventListener('input',this.input);
      this.render();void this.sync();
      this.playbackTimer = setInterval(() => { if (!document.hidden) void this.refreshPlayback(); }, 5000);
      this.timer=setInterval(()=>{if(!root.isConnected)this.destroy();else if(!document.hidden&&!this.busy)void this.sync();},2500);
    }
    destroy(){this.videoController?.destroy();this.videoController=null;this.destroyed=true;this.epoch++;clearInterval(this.timer);clearInterval(this.playbackTimer);this.root.removeEventListener('click',this.click);this.root.removeEventListener('input',this.input);}
    async api(path,body){
      if(!this.token){const r=await fetch(this.base+'/api/session',{signal:AbortSignal.timeout(4000)});if(!r.ok)throw Error('No se pudo conectar con el servicio local.');this.token=(await r.json()).token;}
      const r=await fetch(this.base+path,{method:body===undefined?'GET':'POST',headers:{'x-toki-token':this.token,...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(45000)});
      if(r.status===401)this.token='';const data=await r.json();if(!r.ok)throw Error(data.error||'La operación no se completó.');return data;
    }
    async sync(){
      try{
        const [{jobs}, manifest]=await Promise.all([this.api('/api/jobs'),this.api('/api/adapters')]);
        const changed=JSON.stringify(jobs)!==JSON.stringify(this.jobs)||!this.online||JSON.stringify(manifest.adapters)!==JSON.stringify(this.adapters);
        this.jobs=jobs;if(manifest)this.adapters=manifest.adapters;this.online=true;
        if(this.view==='video-player'&&(!['needs_test','ready'].includes(this.job?.status)||this.videoSelection?.generation!==this.job?.generation)){this.view='progress';this.epoch++;}
        if(this.maybeOpen())return;
        if(changed&&!this.busy)this.render();
      }catch{if(this.online){this.online=false;this.render();}}
    }
    get adapter(){return this.adapters.find(a=>a.id===(this.job?.app||this.selected));}
    async appAction(action,payload={}) {
      const id=this.job?.app||this.selected;
      return this.api(`/api/apps/${id}/actions/${action}`,{jobId:this.id,...payload});
    }
    async openAdapter(){
      const entry=this.adapter?.interface.entry;
      if(entry==='food'){this.view='food';this.epoch++;this.render();await this.foodAction('status');return;}
      if(entry==='videos'){this.view='videos';this.epoch++;this.render();await this.loadVideos();return;}
      if(entry==='player'){this.view='player';this.epoch++;this.render();void this.refreshPlayback();return;}
      if(entry==='news'){this.view='news';this.epoch++;this.newsPage=0;this.article=null;this.newsItems=[];this.newsInfo=null;this.render();await this.loadNews();}
    }
    // Sin pasos intermedios: elegir una app la abre; si hace falta prepararla, se prepara sola y luego se abre.
    needsLogin(job){const a=this.adapter;return job?.status==='needs_connection'&&a?.interface.entry!=='food'&&a?.auth.type!=='none';}
    maybeOpen(){
      const j=this.job;
      if(!this.autoOpen||this.view!=='progress'||!this.adapter||!usable(j)||this.needsLogin(j))return false;
      this.autoOpen=false;void this.openAdapter();return true;
    }
    async waitForJob(epoch,until){
      for(let i=0;i<150&&this.epoch===epoch&&!this.destroyed;i++){
        await new Promise(r=>setTimeout(r,400));
        if(this.epoch!==epoch||this.destroyed)return;
        try{const before=JSON.stringify(this.job);this.jobs=(await this.api('/api/jobs')).jobs;this.online=true;if(this.epoch!==epoch)return;if(JSON.stringify(this.job)!==before&&!until())this.render();}catch{}
        if(until())return;
      }
    }
    async openApp(value){
      this.selected=value;const epoch=++this.epoch;let j=this.existing(this.preset);this.id=j?.id||null;this.error='';
      if(!j&&!this.adapter){this.view='detail';this.render();return;}
      this.view='progress';this.autoOpen=true;
      if(this.maybeOpen())return;
      this.render();
      if(j?.status==='needs_adapter'||(usable(j)&&this.needsLogin(j))){this.autoOpen=false;return;}
      this.openingEpoch=epoch;
      try{
        if(!j){const a=this.preset;j=(await this.api('/api/jobs',{name:a.name,tasks:a.tasks,...(a.sourceUrl?{sourceUrl:a.sourceUrl}:{})})).job;if(this.epoch!==epoch)return;this.id=j.id;this.jobs=[j,...this.jobs.filter(x=>x.id!==j.id)];}
        else if(failedJob(j)){await this.api(`/api/jobs/${j.id}/retry`,{});}
        if(this.epoch!==epoch)return;
        await this.waitForJob(epoch,()=>!['queued','preparing'].includes(this.job?.status));
      }catch(e){if(this.epoch===epoch)this.error=/fetch|Network|timeout|abort/i.test(e.message)?'No respondió el servicio. Vuelve a intentarlo.':e.message;}
      finally{if(this.epoch===epoch){this.openingEpoch=null;if(!this.maybeOpen())this.render();}}
    }
    foodPrice(value){return typeof value==='number'&&Number.isFinite(value)?new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(value):'Por confirmar';}
    foodPager(items,perPage=3){return `<div class="food-pages">${this.btn('food-prev','← Anteriores',{disabled:!this.food.page})}<span>${items.length?`${this.food.page+1} / ${Math.ceil(items.length/perPage)}`:''}</span>${this.btn('food-next','Más →',{disabled:(this.food.page+1)*perPage>=items.length})}</div>`;}
    foodView(){
      const f=this.food,photo=url=>url?`<img src="${esc(url)}" alt="" draggable="false">`:'',cards=(items,action,label)=>`<div class="food-list">${items.slice(f.page*3,f.page*3+3).map(item=>this.btn(action,photo(item.image)+label(item),{value:item.id,className:'food-card',disabled:item.available===false})).join('')}${!items.length?'<p>No hay resultados disponibles. Vuelve y elige otra categoría.</p>':''}</div>`;
      if(this.view==='food-stores')return this.header('Elige un restaurante',esc(f.category))+cards(f.stores,'food-store',s=>`<span><strong>${esc(s.name)}</strong><small>${esc(s.eta)}</small></span>`)+this.foodPager(f.stores);
      if(this.view==='food-products')return this.header(esc(f.store?.name),'Productos encontrados · precios por confirmar al pedir')+cards(f.items,'food-product',p=>`<span><strong>${esc(p.name)}</strong><small>${this.foodPrice(p.price)}</small></span>`)+this.foodPager(f.items);
      if(this.view==='food-product'){
        const selection=f.selection,p=selection.product;
        return this.header('Tu elección',esc(selection.store.name))+`<div class="food-selection">${photo(p.image)}<div><h2>${esc(p.name)}</h2><p>${this.foodPrice(p.price)}</p><p>${selection.canAdd?'Una unidad · todavía no estás comprando.':'Puedes elegir opciones. Falta conectar la cuenta para el carrito.'}</p></div></div><div class="food-actions">${selection.groups.length?this.btn('food-options','Elegir opciones',{className:'ta-primary'}):selection.canAdd?this.btn('food-add','Añadir al carrito',{className:'ta-primary'}):this.btn('food-check','Comprobar conexión')}${this.btn('food-cart','Ver carrito')}</div>`;
      }
      if(this.view==='food-options'){
        const group=f.selection.groups[f.group],count=group.items.filter(t=>f.options.includes(t.id)).length;
        return this.header(esc(group.name),`Elige entre ${group.min} y ${group.max} · seleccionadas: ${count}`)+`<div class="food-list food-options-list">${group.items.slice(f.page*2,f.page*2+2).map(item=>this.btn('food-option',`<span><strong>${f.options.includes(item.id)?'✓ ':''}${esc(item.name)}</strong><small>${this.foodPrice(item.price)}</small></span>`,{value:item.id,className:'food-card '+(f.options.includes(item.id)?'ta-selected':''),disabled:!item.available||(!f.options.includes(item.id)&&count>=group.max)})).join('')}</div>`+this.foodPager(group.items,2)+this.btn('food-options-next',f.group+1<f.selection.groups.length?'Siguiente opción':f.selection.canAdd?'Añadir al carrito':'Revisar elección',{disabled:count<group.min||count>group.max,className:'ta-primary'});
      }
      if(this.view==='food-cart'){
        const items=(f.cart?.stores||[]).flatMap(s=>s.items),cart=f.cart;
        return this.header('Tu carrito','No se ha realizado ninguna compra')+`<div class="food-list">${items.slice(f.page*3,f.page*3+3).map(p=>`<div class="food-card food-cart-item"><strong>${esc(p.name)}</strong><span>${esc(p.quantity)} × ${this.foodPrice(p.price)}</span></div>`).join('')}${items.length?'':'<p>Tu carrito está vacío.</p>'}</div>`+this.foodPager(items)+`<p class="food-note">Productos: ${this.foodPrice(cart?.productsTotal)} · Envío: ${this.foodPrice(cart?.shippingTotal)}. Compra y pago aún pendientes de habilitar.</p><div class="food-actions">${this.btn('food-cart','Actualizar carrito')}${this.btn('food-quote','Revisar importes',{disabled:!items.length})}</div>`;
      }
      return this.header('¿Qué te gustaría comer?',esc(f.status?.locationLabel||'Rappi Chile'))+`<div class="ta-control-grid">${(f.status?.categories||[]).map(c=>this.btn('food-search',esc(c.name),{value:c.id})).join('')}</div><div class="food-actions">${this.btn('food-cart','Ver carrito',{disabled:!f.status?.connected})}${this.btn('food-check',f.status?.connected?'Comprobar dirección':'Comprobar conexión')}</div><p class="food-note">${f.status?.connected?'Cuenta conectada.':'Puedes explorar; la cuenta se conecta desde la configuración del equipo.'} Compra y pago aún pendientes.</p>`;
    }
    async foodAction(action,payload={},next){
      if(this.busy)return;const epoch=this.epoch;this.busy=true;this.error='';this.render();
      try{
        const result=await this.appAction(action,payload);
        if(this.epoch!==epoch||this.destroyed)return;
        const f=this.food;f.page=0;
        if(action==='status'){f.status=result;if(this.view==='food-product'&&result.connected){f.selection=null;this.view='food';this.error='Cuenta conectada. Vuelve a elegir la comida con tu dirección.';}}
        if(action==='search'){f.stores=result.stores;f.category=result.category;}
        if(action==='products'){f.items=result.items;f.store=result.store;}
        if(action==='select'){f.selection=result;f.options=[];f.group=0;}
        if(['add','cart','quote'].includes(action)){f.cart=result;if(result.notice)this.error=result.notice;}
        if(action==='connect')this.error=result.state==='connected'?'Cuenta conectada. Comprueba la conexión.':result.state==='error'?'No se pudo abrir Chrome. Reintenta la conexión.':'Inicia sesión en la ventana oficial de Rappi Chile.';
        if(action==='disconnect'){f.status=null;f.selection=null;f.cart=null;this.error='Sesión local desconectada.';}
        if(next)this.view=next;
        const data=await this.api('/api/jobs');this.jobs=data.jobs;
      }catch(e){if(this.epoch===epoch)this.error=e.message;}
      finally{this.busy=false;if(!this.destroyed)this.render();}
    }
    async foodEvent(action,value){
      const f=this.food;
      if(action==='food-connect')return this.foodAction('connect');
      if(action==='food-disconnect')return this.foodAction('disconnect');
      if(action==='food-check')return this.foodAction('status');
      if(action==='food-search')return this.foodAction('search',{category:value},'food-stores');
      if(action==='food-store')return this.foodAction('products',{storeId:Number(value)},'food-products');
      if(action==='food-product')return this.foodAction('select',{storeId:f.store.id,productId:Number(value)},'food-product');
      if(action==='food-cart')return this.foodAction('cart',{},'food-cart');
      if(action==='food-quote')return this.foodAction('quote',{},'food-cart');
      if(action==='food-options'){this.view='food-options';f.page=0;this.epoch++;this.render();return;}
      if(action==='food-prev'||action==='food-next'){f.page+=action==='food-next'?1:-1;this.epoch++;this.render();return;}
      if(action==='food-option'){const id=Number(value);f.options=f.options.includes(id)?f.options.filter(v=>v!==id):[...f.options,id];this.render();return;}
      if(action==='food-options-next'&&f.group+1<f.selection.groups.length){f.group++;f.page=0;this.epoch++;this.render();return;}
      if(action==='food-options-next'&&!f.selection.canAdd){this.view='food-product';this.epoch++;this.error='Elección preparada. Falta conectar la cuenta para añadir al carrito.';this.render();return;}
      if(action==='food-add'||action==='food-options-next')return this.foodAction('add',{ticket:f.selection.ticket,options:f.options},'food-cart');
    }
    async loadVideos(){
      if(this.busy)return;const epoch=this.epoch;this.busy=true;this.error='';this.render();
      try{const [data,module]=await Promise.all([this.appAction('list'),import('./toki-video.js')]);if(this.epoch===epoch&&!this.destroyed){this.videoItems=data.items;this.videoModule=module;}}
      catch(e){if(this.epoch===epoch)this.error=e.message;}
      finally{this.busy=false;if(this.epoch===epoch)this.render();}
    }
    videos(){
      const cards=this.videoItems.map(video=>this.btn('choose-video',
        `<img src="${esc(video.thumbnail)}" alt="" draggable="false"><strong>${esc(video.label)}</strong>`,
        {value:video.id,className:'video-card'})).join('');
      const empty=this.busy?'<div class="ta-center"><p role="status">Cargando videos…</p></div>':`<div class="ta-center"><p>No se pudieron mostrar los videos.</p>${this.btn('reload-videos','Reintentar',{className:'ta-primary'})}</div>`;
      return this.header('Videos','YouTube · Chile Travel')+(cards?`<div class="video-choices">${cards}</div>`:empty);
    }
    videoPlayer(){return `<section class="ta-video-player"><h2>${esc(this.videoSelection?.video.label||'YouTube')}</h2><div class="ta-video-frame"><div id="toki-video-frame"></div></div><p class="ta-video-status" role="status">Conectando con YouTube…</p><div class="ta-video-controls">${this.btn('video-toggle','Reproducir',{disabled:true})}${this.btn('retry-video','Reintentar video')}</div></section>`;}
    mountVideo(){
      if(this.view!=='video-player'||this.videoController||!this.videoSelection||!this.videoModule)return;
      const {ticket,video}=this.videoSelection,jobId=this.id;let pending=Promise.resolve(),lastState=null;
      const current=()=>!this.destroyed&&this.view==='video-player'&&this.videoSelection?.ticket===ticket;
      const transport=()=>this.root.querySelector('[data-app-action="video-toggle"]');
      this.videoController=this.videoModule.mountVideo(this.root.querySelector('#toki-video-frame'),{videoId:video.id,
        onReady:(ready=true)=>{if(current())transport().disabled=!ready;},
        onMessage:(text,error)=>{if(!current())return;const el=this.root.querySelector('.ta-video-status');el.textContent=text;el.classList.toggle('has-error',!!error);transport().textContent=this.videoController?.state===1?'Pausar':'Reproducir';},
        onState:state=>{if(!current())return;transport().textContent=state===1?'Pausar':'Reproducir';if(lastState===state)return;lastState=state;
          pending=pending.catch(()=>{}).then(()=>this.api('/api/apps/youtube/actions/observe',{jobId,ticket,videoId:video.id,state})).catch(()=>{if(current()){this.error='No se pudo guardar la comprobación. Vuelve a elegir el video.';this.render();}});
        }
      });
    }
    async loadNews(){
      if(this.busy)return;
      const epoch=this.epoch;this.busy=true;this.error='';this.render();
      try{const result=await this.appAction('list');if(this.epoch===epoch&&!this.destroyed){this.newsItems=result.items;this.newsInfo=result;this.newsPage=0;}}
      catch(e){if(this.epoch===epoch)this.error=e.message;}
      finally{this.busy=false;if(this.epoch===epoch)this.render();}
    }
    news(){
      const info=this.newsInfo,stamp=info?.publishedAt?new Date(info.publishedAt).toLocaleString('es-CL',{dateStyle:'short',timeStyle:'short'}):'';
      const label=info?.stale?'La fuente está atrasada':stamp?'Fuente actualizada: '+stamp:'Titulares y extractos del medio';
      return this.header('Noticias',`${esc(info?.source||this.adapter?.name||this.preset.name)} · ${label}`)+`<div class="news-list">${this.newsItems.slice(this.newsPage*2,this.newsPage*2+2).map(item=>this.btn('read-news',`<span class="news-text"><strong>${esc(item.title)}</strong><small>${item.publishedAt?new Date(item.publishedAt).toLocaleDateString('es-CL'):''}</small></span>${safeImage(item.image)?`<img class="news-thumb" src="${esc(item.image)}" alt="" draggable="false">`:''}`,{value:item.id,className:'news-card'+(safeImage(item.image)?' has-thumb':'')})).join('')}${!this.newsItems.length?`<div class="ta-center"><p>${this.busy?'Cargando noticias…':'No hay noticias cargadas.'}</p>${this.btn('reload-news','Volver a cargar')}</div>`:''}</div><div class="news-pagebar">${this.btn('news-prev','← Anteriores',{disabled:!this.newsPage})}<span>${this.newsItems.length?`${this.newsPage+1} de ${Math.ceil(this.newsItems.length/2)}`:''}</span>${this.btn('news-next','Más noticias →',{disabled:(this.newsPage+1)*2>=this.newsItems.length})}</div>`;
    }
    reading(){
      if(!this.article)return this.news();
      const titlePages=this.article.titlePages||[this.article.title],pages=[...titlePages,...this.article.pages],isTitle=this.articlePage<titlePages.length;
      return this.header(isTitle?'Titular':'Extracto de la noticia',esc(this.article.source||this.adapter?.name||'Noticias')+' · '+(this.article.publishedAt?new Date(this.article.publishedAt).toLocaleDateString('es-CL'):''))+`<article class="news-reading"><p>${esc(pages[this.articlePage])}</p></article><div class="news-pagebar">${this.btn('article-prev','← Anterior',{disabled:this.articlePage===0})}<span>${this.articlePage+1} de ${pages.length}</span>${this.btn('article-next','Continuar →',{disabled:this.articlePage+1>=pages.length})}</div>`;
    }
    get job(){return this.jobs.find(j=>j.id===this.id);}
    get catalog(){
      const extra=new Map();
      for(const m of this.adapters.filter(a=>a.generated))extra.set(m.name,{id:m.id,name:m.name,sourceUrl:m.source});
      for(const j of this.jobs.filter(j=>j.sourceUrl&&j.status!=='cancelled'))if(!extra.has(j.name))extra.set(j.name,{id:j.app==='custom'?'request-'+j.id:j.app,name:j.name,sourceUrl:j.sourceUrl});
      const services = this.admin ? catalog : catalog.filter(service => service.id !== 'whatsapp');
      return [...services,...[...extra.values()].map(a=>({...a,category:'Noticias',intent:'Leer titulares',tasks:'Elegir titulares y leer extractos RSS por páginas.',description:'Elegir titulares y leer sus extractos por partes.'}))];
    }
    get catalogLabel(){ return window.TOKI_OS_SHELL ? 'Apps' : 'servicios'; }
    get preset(){return this.catalog.find(a=>a.id===this.selected)||this.catalog.find(a=>a.name===this.job?.name)||catalog[0];}
    existing(a){return this.jobs.find(j=>j.name===a.name&&!['cancelled'].includes(j.status));}
    btn(action,label,o={}){
      const available=['home','back','store','catalog-prev','catalog-next','input-pause'];
      const disabled=(this.busy&&!available.includes(action))||o.disabled;
      return `<button type="button" class="ta-button ${o.className||''}" data-app-action="${action}" data-value="${esc(o.value||'')}" data-act="apps:${action}" ${disabled?'disabled':'data-t'}>${label}</button>`;
    }
    header(title,sub){return `<div class="ta-heading"><h1>${title}</h1><p>${sub}</p></div>`;}
    nav(){
      if(this.view.startsWith('food'))return `<nav class="ta-nav" aria-label="Navegación de comida">${this.btn('back','← Volver')}<span></span>${this.btn('store','Ver '+this.catalogLabel)}</nav>`;
      if(this.view==='video-player')return `<nav class="ta-nav ta-video-nav" aria-label="Navegación de videos">${this.btn('back','← Videos')}${this.btn('store','Ver '+this.catalogLabel)}</nav>`;
      if(this.view==='videos')return `<nav class="ta-nav ta-video-nav" aria-label="Navegación de videos">${this.btn('store','← Volver a '+this.catalogLabel)}</nav>`;
      if(this.view==='news')return `<nav class="ta-nav spotify-nav" aria-label="Navegación de noticias">${this.btn('store','← Volver a '+this.catalogLabel)}</nav>`;
      if (this.view === 'store') {
        const home = this.options.shellHome ? '' : this.btn('home', 'Inicio');
        const pages = Math.ceil(this.catalog.length / servicesPerPage);
        if (pages <= 1) return home ? `<nav class="ta-nav" aria-label="Navegación">${home}</nav>` : '';
        const previous = this.catalogPage > 0 ? this.btn('catalog-prev','← Anterior') : '';
        const next = this.catalogPage + 1 < pages ? this.btn('catalog-next','Siguiente →') : '';
        return `<nav class="ta-nav ta-pagination" aria-label="Páginas de ${this.catalogLabel}">${home}${previous}<span>Página ${this.catalogPage+1} de ${pages}</span>${next}</nav>`;
      }
      if (this.view === 'player' && !this.admin && (this.options.shellHome || this.spotifyBlocked())) return '';
      if (this.view === 'player' && !this.admin) return `<nav class="ta-nav spotify-nav" aria-label="Navegación de ${this.catalogLabel}">${this.btn('store','← Volver a '+this.catalogLabel)}</nav>`;
      return `<nav class="ta-nav" aria-label="Navegación de ${this.catalogLabel}">${this.btn('back','← Volver')}<span></span>${this.btn('store','Ver '+this.catalogLabel)}</nav>`;
    }
    back(){
      if(this.view==='store'){
        if(this.catalogPage===0)return false;
        this.catalogPage--;
      }
      else if(this.view==='food-stores')this.view='food';
      else if(this.view==='food-products'){this.view='food-stores';this.food.page=0;}
      else if(this.view==='food-product'||this.view==='food-options'){this.view='food-products';this.food.page=0;}
      else if(this.view==='food-cart')this.view='food';
      else if(this.view==='food')this.view='store';
      else if(this.view==='video-player')this.view='videos';
      else if(this.view==='reading')this.view='news';
      else if(this.view==='news')this.view='store';
      else if(this.view==='results')this.view='music';
      else if(this.view==='music')this.view='player';
      else if(this.view==='player')this.view=this.admin?'progress':'store';
      else this.view='store';
      this.epoch++;this.error='';this.render();return true;
    }
    store() {
      const start = this.catalogPage * servicesPerPage;
      const cards = this.catalog.slice(start, start + servicesPerPage).map(app => {
        const job = this.existing(app);
        const available = this.adapters.some(a => a.id === app.id) || usable(job);
        const status = this.admin ? (job ? titles[job.status] : available ? 'Disponible para probar' : 'Adaptación por preparar')
          : available ? app.category : 'Aún no disponible';
        return this.btn('preset', `<span class="ta-app-icon" aria-hidden="true">${brandLogo(app.id, app.sourceUrl)}</span>
          <strong>${esc(app.intent)}</strong><span class="ta-brand">${esc(app.name)}</span><small>${esc(status)}</small>`,
          {value:app.id, className:`ta-app-card ta-${esc(app.id)}`});
      });
      return `<div class="ta-catalog" role="group" aria-label="Catálogo de ${this.catalogLabel}">${cards.join('')}</div>`;
    }
    detail(){const a=this.preset,j=this.existing(a);return this.header(esc(a.name),esc(a.description))+`<div class="ta-center"><span class="ta-detail-symbol" aria-hidden="true">${brandLogo(a.id, a.sourceUrl)}</span><p>${a.id==='spotify'?'Puedes controlar Spotify en este computador. Elegir canciones requiere conectar tu cuenta.':a.id==='rappi'?'Explora comida real en Santiago. Para preparar el carrito, conecta tu cuenta y dirección. La compra todavía está pendiente.':a.id==='youtube'?'Elige entre videos de Chile Travel y controla reproducción y pausa. La disponibilidad depende de YouTube.':this.adapter?.auth.type==='none'?'Esta app se puede preparar sin cuenta. Leerás titulares y extractos del medio.':'Esta adaptación todavía no está disponible. Puedes pedir que la preparemos.'}</p>${this.btn(j?'job':'prepare',j?'Ver mi app':`Preparar ${esc(a.name)}`,{value:j?.id,className:'ta-primary',disabled:!j&&!this.online})}</div>`;}
    progress(){
      if(this.admin)return this.adminProgress();
      const j=this.job,a=this.preset,name=esc(j?.name||a.name),logo=`<span class="ta-detail-symbol" aria-hidden="true">${brandLogo(this.adapter?.id||a.id,a.sourceUrl)}</span>`;
      const panel=(sub,text,actions='')=>this.header(name,sub)+`<div class="ta-center">${logo}<p role="status">${text}</p>${actions}</div>`;
      if(j?.status==='needs_adapter')return panel('Aún no disponible','Esta app todavía no está lista. El equipo debe prepararla.');
      if(usable(j)&&this.needsLogin(j))return panel('Falta conectar la cuenta','Para usar esta app hay que conectar la cuenta. Pídeselo a tu acompañante.');
      if(this.openingEpoch!==this.epoch&&(failedJob(j)||(!j&&this.error)))return panel('No se pudo abrir',`No se pudo preparar ${name}. Revisa la conexión a Internet y vuelve a intentarlo.`,this.btn('retry','Reintentar',{className:'ta-primary',disabled:!this.online&&!!j}));
      return panel(j&&!usable(j)?'Preparando…':'Abriendo…',`Abriendo ${name}…`);
    }
    spotifyProblem(j){
      if(['queued','preparing'].includes(j.status)||this.openingEpoch===this.epoch)return null;
      if(/conector/i.test(j.message||''))return 'Falta instalar el conector de Spotify en este computador. Pídeselo a tu acompañante.';
      if(/Spotify\.app/i.test(j.message||''))return 'Falta instalar la app de Spotify en este computador. Pídeselo a tu acompañante.';
      if(j.status==='needs_adapter')return 'Spotify todavía no está disponible en este computador. Pídeselo a tu acompañante.';
      return 'No se pudo preparar Spotify. Vuelve a intentarlo.';
    }
    spotifyBlocked(){const j=this.job;return !this.admin&&this.view==='player'&&!!j&&(['error','needs_adapter','interrupted','cancelled','queued','preparing'].includes(j.status)||this.openingEpoch===this.epoch);}
    spotifyUnavailable(){
      const j=this.job,problem=this.spotifyProblem(j);
      return `<section class="sp-unavailable" aria-label="Spotify">
        <div class="sp-brand">${brandLogo('spotify')}<strong>Spotify</strong></div>
        <p class="sp-problem" role="status">${problem?esc(problem):'Preparando Spotify…'}</p>
        <div class="ta-actions">${problem?this.btn('spotify-retry','Reintentar',{className:'ta-primary'}):''}${this.btn('store','Ver '+this.catalogLabel)}</div>
      </section>`;
    }
    async retrySpotify(){
      const j=this.job;if(!j)return this.openSpotify();
      const epoch=this.epoch;this.openingEpoch=epoch;this.error='';this.render();
      try{await this.api(`/api/jobs/${j.id}/retry`,{});if(this.epoch===epoch)await this.waitForJob(epoch,()=>!['queued','preparing'].includes(this.job?.status));}
      catch(e){if(this.epoch===epoch)this.error=/fetch|Network|timeout|abort/i.test(e.message)?'No respondió el servicio. Vuelve a intentarlo.':e.message;}
      finally{if(this.epoch===epoch){this.openingEpoch=null;this.render();if(!this.spotifyBlocked())void this.refreshPlayback();}}
    }
    player(){
      if(this.admin)return this.adminPlayer();
      if(this.spotifyBlocked())return this.spotifyUnavailable();
      const canSearch = ['ready','needs_test'].includes(this.job?.status);
      return `<section class="sp-player" aria-label="Reproductor Spotify">
        <div class="sp-brand">${brandLogo('spotify')}<strong>Spotify</strong></div>
        <div class="sp-record">
          <div class="sp-cover"><span aria-hidden="true">♫</span><img data-cover alt="" hidden></div>
          <div class="sp-meta">
            <p data-playing></p>
            <h2 data-song></h2><p data-artist></p><p data-album></p>
            <div class="sp-time" data-time hidden><progress aria-label="Progreso de la canción"></progress><div><span data-elapsed></span><span data-duration></span></div></div>
          </div>
        </div>
        <div class="sp-controls">${this.btn('transport','Reproducir',{className:'sp-transport'})}${this.btn('next','Siguiente canción')}${canSearch?this.btn('music','Elegir música'):''}</div>
      </section>`;
    }
    async openSpotify() {
      const epoch = ++this.epoch;
      this.selected = 'spotify';
      this.id = this.existing(this.preset)?.id || null;
      this.view = 'player';
      this.playback = null;
      this.playbackUnavailable = false;
      this.render();
      if (!this.id) {
        try {
          const {job} = await this.api('/api/jobs', {name:this.preset.name, tasks:this.preset.tasks});
          if (this.destroyed || this.epoch !== epoch) return;
          this.id = job.id;
          await this.sync();
        } catch {
          if (this.destroyed || this.epoch !== epoch) return;
        }
      }
      if (this.epoch === epoch) void this.refreshPlayback();
    }
    async refreshPlayback() {
      if (this.admin || this.view !== 'player' || !this.id || this.destroyed || this.busy || this.readingPlayback) return;
      const epoch = this.epoch, revision = this.playbackRevision;
      const current = () => !this.destroyed && this.view === 'player' && this.epoch === epoch && revision === this.playbackRevision;
      this.readingPlayback = true;
      try {
        const state = await this.appAction('status');
        if (current()) {
          this.playback = state;
          this.playbackUnavailable = false;
        }
      } catch {
        if (current()) { this.playbackUnavailable = true; this.playback = null; }
      } finally {
        this.readingPlayback = false;
        if (current()) this.paintPlayback();
      }
    }
    paintPlayback() {
      const panel = this.root.querySelector('.sp-player');
      if (!panel) return;
      const state = this.playback, track = state?.item;
      const set = (key, text) => {
        const el = panel.querySelector(`[data-${key}]`);
        if (el.textContent !== text) el.textContent = text;
      };
      set('playing', state ? (state.is_playing ? 'Reproduciendo' : 'En pausa') : 'Conectando con Spotify');
      set('song', track?.name || (this.playbackUnavailable ? 'Esperando a Spotify' : state ? 'Sin canción seleccionada' : 'Buscando tu música…'));
      const artists = (track?.artists || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean);
      set('artist', artists.join(', '));
      set('album', typeof track?.album === 'string' ? track.album : track?.album?.name || '');
      const cover = panel.querySelector('[data-cover]');
      const url = track?.artwork;
      if (url && /^https:\/\/i\.scdn\.co\/image\/[a-z0-9]+$/i.test(url)) {
        if (cover.getAttribute('src') !== url) {
          cover.hidden = true;
          cover.onload = () => { cover.hidden = false; };
          cover.onerror = () => { cover.hidden = true; };
          cover.src = url;
        }
      } else { cover.hidden = true; cover.removeAttribute('src'); }
      const duration = Number(track?.duration_ms) || 0;
      const elapsed = Math.max(0,Math.min(duration,Number(state?.progress_ms) || 0));
      const time = ms => Math.floor(ms/60000) + ':' + String(Math.floor(ms/1000)%60).padStart(2,'0');
      panel.querySelector('[data-time]').hidden = !duration;
      const bar = panel.querySelector('progress');
      bar.max = duration || 1; bar.value = elapsed;
      set('elapsed',time(elapsed)); set('duration',time(duration));
      const toggle = panel.querySelector('[data-app-action="transport"]');
      const label = state?.is_playing ? 'Pausar' : 'Reproducir';
      if (toggle.textContent !== label) toggle.textContent = label;
      toggle.classList.toggle('is-playing',!!state?.is_playing);
      for (const button of panel.querySelectorAll('[data-app-action="transport"],[data-app-action="next"]')) button.disabled = this.busy || !state;
    }
    music(){
      if(this.job?.status==='needs_connection')return this.header('Elegir música','Falta conectar tu cuenta de Spotify.')+'<div class="ta-center"><p>La conexión se prepara una sola vez desde la configuración del equipo. Puedes volver y usar reproducir o pausar.</p></div>';
      return this.header('¿Qué te apetece escuchar?','Elige una opción.')+`<div class="ta-control-grid ta-fill">${music.map(([name,q])=>this.btn('music-search',name,{value:q})).join('')}</div>`;
    }
    results(){const tracks=this.tracks.slice(this.page*3,this.page*3+3);return this.header('Elige una canción',this.query)+`<div class="ta-results">${tracks.map(t=>this.btn('play-track',`<strong>${esc(t.name)}</strong><small>${esc(t.artists)}</small>`,{value:t.uri,className:'ta-track'})).join('')}${!tracks.length?'<p>No encontramos canciones. Vuelve y elige otra opción.</p>':''}</div><div class="ta-result-nav">${this.btn('page',this.page?'← Anteriores':'Más canciones →',{disabled:this.tracks.length<=3})}</div>`;}
    keyboard(field){this.field=field;const keys=this.group?[...this.group].map(c=>this.btn('key',esc(c),{value:c})):groups.map(g=>this.btn('group',g,{value:g}));return `<div class="ta-keyboard">${keys.join('')}${this.group?this.btn('groups','← Grupos'):''}${this.btn('key','Espacio',{value:' '})}${this.btn('delete','Borrar')}</div>`;}
    adminProgress() {
      const j = this.job; if (!j) return this.store();
      const stage = j.stage || 0;
      let next = '';
      if (j.status === 'needs_connection' && j.app==='spotify') next = `<div class="ta-connect"><h2>Conecta tu cuenta</h2><p>Abre Spotify Web e inicia sesión. Después elige ese navegador para usar su sesión de Spotify en este computador.</p><a class="ta-link" href="https://open.spotify.com" target="_blank" rel="noopener noreferrer">Abrir Spotify Web ↗</a><div class="ta-actions">${['chrome','safari','firefox'].map(b=>this.btn('browser',b[0].toUpperCase()+b.slice(1),{value:b,className:this.browser===b?'ta-selected':''})).join('')}</div>${this.btn('connect','Usar mi sesión de Spotify',{className:'ta-primary'})}<p class="ta-note">macOS puede pedir acceso al llavero. La sesión se guarda localmente; el generador no recibe tu contraseña.</p>${this.btn('player','Ver controles locales',{className:'ta-quiet'})}</div>`;
      if (['needs_test','ready'].includes(j.status)) next = this.btn('open-adapter',j.status==='ready'?'Abrir app →':'Probar adaptación →',{className:'ta-primary'}) + (j.app!=='spotify'?this.adminReview():'');
      if(j.app==='rappi'&&['needs_connection','needs_test','ready'].includes(j.status))next=this.btn('open-adapter','Explorar comida',{className:'ta-primary'})+this.btn('food-connect','Conectar Rappi Chile')+this.btn('food-check','Comprobar sesión')+this.btn('food-disconnect','Desconectar Rappi')+'<p>La sesión se guarda solo en este computador. Compra y pago pendientes de verificación.</p>';
      if (j.status === 'needs_adapter') next = `<div class="ta-connect"><h2>Solicitud en manos del equipo</h2><p>La búsqueda está hecha. Falta comprobar una integración y construir la interfaz.</p>${(j.candidates||[]).map(c=>`<p><a class="ta-link" href="${/^https:\/\/github\.com\//.test(c.url)?esc(c.url):'#'}" target="_blank" rel="noopener noreferrer">${esc(c.name)} ↗</a></p>`).join('')}</div>`;
      return this.header(esc(j.name), titles[j.status] || 'Preparación') + `<div class="ta-progress-panel"><div class="ta-progress-caption"><strong>${stage} de 5 etapas completadas</strong><span>${j.status === 'preparing' ? 'Trabajando…' : 'Tu avance está guardado'}</span></div><div class="ta-progress" role="progressbar" aria-label="Preparación de la adaptación" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${stage}" aria-valuetext="${stage} de 5 etapas completadas"><span style="width:${stage*20}%"></span></div><ol class="ta-steps">${phaseLabels.map((label,i)=>`<li class="${i<stage?'done':i===stage?'current':''}"><span>${i<stage?'✓':String(i+1).padStart(2,'0')}</span>${label}</li>`).join('')}</ol><p class="ta-stage-message" role="status">${esc(j.message)}</p>${next}<div class="ta-actions">${['cancelled','error','interrupted'].includes(j.status) ? this.btn('retry','Reintentar',{className:'ta-primary'}) : j.status !== 'ready' ? this.btn('cancel','Cancelar preparación',{className:'ta-quiet'}) : ''}${this.btn('home','Volver al inicio',{className:'ta-quiet'})}</div></div>`;
    }
    adminReview(){
      const j=this.job,m=this.adapter;if(!j||!m||j.status!=='needs_test')return '';
      return `<section class="ta-review"><h2>Revisión de ${esc(m.name)}</h2><p>Acciones comprobadas: ${m.requiredEvidence.map(k=>`${j.evidence[k]?'✓':'○'} ${esc(k)}`).join(' · ')}</p>${this.btn('functional',(this.functional?'☑':'☐')+' El equipo comprobó las funciones')}${this.btn('personal',(this.personal?'☑':'☐')+' La persona completó las tareas con su control')}${this.btn('review','Habilitar app',{disabled:!this.functional||!this.personal||!m.requiredEvidence.every(k=>j.evidence[k])})}</section>`;
    }
    adminPlayer() {
      const j = this.job;
      const tracks = this.tracks.slice(this.page * 3, this.page * 3 + 3);
      return this.header('Elige qué escuchar.', 'La reproducción usa Spotify en este computador.', 'progress') + `<div class="ta-player"><div class="ta-search"><label for="ta-query">Canción o artista</label><div class="ta-search-row"><input id="ta-query" data-app-field="query" maxlength="160" placeholder="Escribe aquí…" value="${esc(this.query)}">${this.btn('search','Buscar',{className:'ta-primary'})}</div>${this.keyboard('query')}</div><div class="ta-results">${tracks.map(t=>this.btn('play-track',`<span class="ta-track-icon">♫</span><span><strong>${esc(t.name)}</strong><small>${esc(t.artists)}</small></span><span>▷</span>`,{value:t.uri,className:'ta-track'})).join('')}${this.searched&&!this.tracks.length?'<p>No hay resultados para esa búsqueda.</p>':''}${this.tracks.length>3?this.btn('page',this.page?'← Anteriores':'Más canciones →'):''}</div><div class="ta-now"><span class="ta-now-dot ${this.playback?.is_playing?'playing':''}"></span><div><small>AHORA EN SPOTIFY</small><strong>${esc(this.playback?.item?.name || 'Consulta qué está sonando')}</strong><p>${this.playback ? (this.playback.is_playing?'Reproduciendo':'En pausa') : 'Estado sin consultar'}</p></div></div><div class="ta-actions">${this.btn('resume','▷ Reproducir',{className:'ta-primary'})}${this.btn('pause','Ⅱ Pausar')}${this.btn('status','Consultar estado')}</div>${j?.status==='needs_test'?`<div class="ta-review"><h2>Antes de habilitar</h2><p>Prueba buscar, reproducir y pausar con la persona que lo usará.</p><p class="ta-evidence">${['search','play','pause'].map((k,i)=>`${j.evidence[k]?'✓':'○'} ${['Búsqueda','Reproducción','Pausa'][i]}`).join(' · ')}</p>${this.btn('functional',(this.functional?'☑':'☐')+' El equipo comprobó las funciones')}${this.btn('personal',(this.personal?'☑':'☐')+' La persona completó las tareas con su control')}${this.btn('review','Habilitar en Mis apps',{className:'ta-primary',disabled:!this.functional||!this.personal||!['search','play','pause'].every(k=>j.evidence[k])})}</div>`:''}<div class="ta-actions">${this.btn('progress','Ver preparación',{className:'ta-quiet'})}${this.btn('disconnect','Desconectar sesión',{className:'ta-quiet'})}</div></div>`;
    }
    render(){
      if(this.destroyed||!this.root.isConnected)return;
      if(this.view==='video-player'&&this.videoController&&this.root.querySelector('.ta-video-player')){this.root.querySelector('.ta-feedback').textContent=this.busy?'Un momento…':this.error||(!this.online?'Sin conexión con la preparación local.':'');return;}
      this.videoController?.destroy();this.videoController=null;
      this.root.classList.toggle('ta-store', this.view === 'store');
      this.catalogPage = Math.max(0, Math.min(this.catalogPage, Math.ceil(this.catalog.length / servicesPerPage) - 1));
      const focus=document.activeElement?.dataset;this.options.beforePaint?.();
      const content=this.view.startsWith('food')?this.foodView():({store:()=>this.store(),detail:()=>this.detail(),progress:()=>this.progress(),player:()=>this.player(),music:()=>this.music(),results:()=>this.results(),news:()=>this.news(),reading:()=>this.reading(),videos:()=>this.videos(),'video-player':()=>this.videoPlayer()}[this.view]||(()=>this.store()))();
      this.root.innerHTML=`<div class="ta-screen">${content}</div><div class="ta-feedback" role="status" aria-live="polite">${this.busy?'Un momento…':esc(this.error)||(!this.online?'Sin conexión con la preparación local.':'')}</div>${this.nav()}`;
      for(const img of this.root.querySelectorAll('img.news-thumb'))img.addEventListener('error',()=>{img.closest('.news-card')?.classList.remove('has-thumb');img.remove();},{once:true});
      this.paintPlayback();this.mountVideo();
      this.options.afterPaint?.(this.root,this);
      if (['catalog-prev','catalog-next'].includes(focus?.appAction)) {
        const nextFocus = this.root.querySelector(`[data-app-action="${focus.appAction}"]`) || this.root.querySelector('.ta-app-card');
        nextFocus?.focus({preventScroll:true});
      } else if(focus?.appAction)[...this.root.querySelectorAll('[data-app-action]')].find(el=>el.dataset.appAction===focus.appAction&&el.dataset.value===focus.value)?.focus({preventScroll:true});
    }
    async act(el){
      if(el.disabled||this.destroyed)return;
      let action=el.dataset.appAction;
      const value=el.dataset.value;
      if (action === 'transport') action = this.playback?.is_playing ? 'pause' : 'resume';
      if(this.busy&&!['home','back','store','catalog-prev','catalog-next'].includes(action))return;
      this.error='';
      if(action==='home')return this.options.home?.();
      if(action==='back'){if(!this.back())this.options.home?.();return;}
      if(['store','catalog-prev','catalog-next'].includes(action)){this.epoch++;this.view='store';if(action!=='store')this.catalogPage += action==='catalog-next' ? 1 : -1;this.render();return;}
      if(action==='preset'&&!this.admin)return value==='spotify'?this.openSpotify():this.openApp(value);
      if(action==='retry'&&!this.admin)return this.openApp(this.selected);
      if(action==='spotify-retry')return this.retrySpotify();
      if(action==='preset'){this.selected=value;const j=this.existing(this.preset);this.id=j?.id||null;this.view=j?'progress':'detail';this.epoch++;if(j?.status==='ready')return this.openAdapter();this.render();return;}
      if(action==='job'){this.id=value;if(this.job?.status==='ready')return this.openAdapter();this.view='progress';this.render();return;}
      if(['progress','player','music'].includes(action)){this.view=action;this.epoch++;this.render();return;}
      if(action==='open-adapter')return this.openAdapter();
      if(action.startsWith('food-'))return this.foodEvent(action,value);
      if(action==='video-toggle'){this.videoController?.toggle();return;}
      if(action==='reload-videos')return this.loadVideos();
      if(action==='reload-news')return this.loadNews();
      if(action==='news-prev'||action==='news-next'){this.newsPage+=action==='news-next'?1:-1;this.render();return;}
      if(action==='article-prev'||action==='article-next'){this.articlePage+=action==='article-next'?1:-1;this.render();return;}
      if(action==='browser'){this.browser=value;this.render();return;}
      if(action==='group'||action==='groups'){this.group=action==='group'?value:'';this.render();return;}
      if(action==='key'||action==='delete'){this[this.field]=(action==='delete'?this[this.field].slice(0,-1):this[this.field]+value).slice(0,160);this.group='';this.render();return;}
      if(action==='page'){this.page=this.page?0:1;this.render();return;}
      if(action==='functional'||action==='personal'){this[action]=!this[action];this.render();return;}
      this.playbackRevision++;this.busy=true;const epoch=this.epoch,jobId=this.id;this.render();
      try{
        let next;
        if(action==='prepare'){
          const a=this.preset;const {job}=await this.api('/api/jobs',{name:a.name,tasks:a.tasks,...(a.sourceUrl?{sourceUrl:a.sourceUrl}:{})});if(this.epoch===epoch){this.id=job.id;next='progress';}
        }else if(['cancel','retry','review'].includes(action)){
          await this.api(`/api/jobs/${jobId}/${action}`,{functional:this.functional,personal:this.personal});next='progress';
        }else if(action==='choose-video'||action==='retry-video'){
          const selection=await this.appAction('select',{videoId:action==='retry-video'?this.videoSelection?.video.id:value});
          if(this.epoch===epoch){this.videoController?.destroy();this.videoController=null;this.videoSelection=selection;next='video-player';}
        }else if(action==='read-news'){
          const result=await this.appAction('read',{articleId:value});
          if(this.epoch===epoch){this.article=result.article;this.articlePage=0;next='reading';}
        }else{
          if(action==='music-search')this.query=value;
          const actions={'play-track':'play',resume:'play','music-search':'search'};
          const result=await this.appAction(actions[action]||action,{query:this.query,browser:this.browser,...(action==='play-track'?{uri:value}:{})});
          if(this.epoch===epoch){
            if(action==='search'||action==='music-search'){this.tracks=result.tracks;this.page=0;this.searched=true;if(!this.admin)next='results';}
            else if(['status','play-track','resume','pause','next'].includes(action)){this.playback=result;if(action==='play-track'&&!this.admin)next='player';}
            else if(action==='connect')next='player';
            else if(action==='disconnect'){next='progress';this.tracks=[];this.playback=null;}
          }
        }
        const data=await this.api('/api/jobs');this.jobs=data.jobs;this.online=true;
        if(next&&this.epoch===epoch)this.view=next;
      }catch(e){if(this.epoch===epoch)this.error=/fetch|Network|timeout|abort/i.test(e.message)?'No respondió el servicio. Vuelve a intentarlo.':e.message;}
      finally{this.busy=false;this.render();}
    }
  }
  window.TokiApps={mount:(root,options)=>new Apps(root,options),get active(){return active;},brandLogo,catalog};
})();
