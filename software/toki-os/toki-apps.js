/* Apps uses the shell's native-button gaze/muscle controller. */
(() => {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titles = {preparing:'Preparando',queued:'En espera',needs_connection:'Falta conectar la cuenta',needs_test:'Pendiente de prueba',needs_adapter:'Aún no disponible',ready:'Lista para abrir',cancelled:'Preparación cancelada',error:'No se pudo preparar',interrupted:'Preparación interrumpida'};
  const phaseLabels = ['Encontrar conexión', 'Preparar interfaz', 'Conectar cuenta', 'Comprobar funciones', 'Revisar contigo'];
  const groups = ['ABCDE', 'FGHIJ', 'KLMNÑ', 'OPQRS', 'TUVWXYZ', '0123456789'];
  const servicesPerPage = 6;
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
      this.adapters=[];this.newsItems=[];this.newsPage=0;this.article=null;this.articlePage=0;
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
    destroy(){this.destroyed=true;this.epoch++;clearInterval(this.timer);clearInterval(this.playbackTimer);this.root.removeEventListener('click',this.click);this.root.removeEventListener('input',this.input);}
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
      if(entry==='player'){this.view='player';this.epoch++;this.render();void this.refreshPlayback();return;}
      if(entry==='news'){this.view='news';this.epoch++;this.newsPage=0;this.article=null;this.newsItems=[];this.newsInfo=null;this.render();await this.loadNews();}
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
      return this.header('Noticias',`${esc(info?.source||this.adapter?.name||this.preset.name)} · ${label}`)+`<div class="news-list">${this.newsItems.slice(this.newsPage*2,this.newsPage*2+2).map(item=>this.btn('read-news',`<strong>${esc(item.title)}</strong><small>${item.publishedAt?new Date(item.publishedAt).toLocaleDateString('es-CL'):''}</small>`,{value:item.id,className:'news-card'})).join('')}${!this.newsItems.length?`<div class="ta-center"><p>${this.busy?'Cargando noticias…':'No hay noticias cargadas.'}</p>${this.btn('reload-news','Volver a cargar')}</div>`:''}</div><div class="news-pagebar">${this.btn('news-prev','← Anteriores',{disabled:!this.newsPage})}<span>${this.newsItems.length?`${this.newsPage+1} de ${Math.ceil(this.newsItems.length/2)}`:''}</span>${this.btn('news-next','Más noticias →',{disabled:(this.newsPage+1)*2>=this.newsItems.length})}</div>`;
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
    get preset(){return this.catalog.find(a=>a.id===this.selected)||this.catalog.find(a=>a.name===this.job?.name)||catalog[0];}
    existing(a){return this.jobs.find(j=>j.name===a.name&&!['cancelled'].includes(j.status));}
    btn(action,label,o={}){
      const available=['home','back','store','catalog-prev','catalog-next','input-pause'];
      const disabled=(this.busy&&!available.includes(action))||o.disabled;
      return `<button type="button" class="ta-button ${o.className||''}" data-app-action="${action}" data-value="${esc(o.value||'')}" data-act="apps:${action}" ${disabled?'disabled':'data-t'}>${label}</button>`;
    }
    header(title,sub){return `<div class="ta-heading"><h1>${title}</h1><p>${sub}</p></div>`;}
    nav(){
      if(this.view==='news')return `<nav class="ta-nav spotify-nav" aria-label="Navegación de noticias">${this.btn('store','← Volver a servicios')}</nav>`;
      if (this.view === 'store') {
        const home = this.options.shellHome ? '' : this.btn('home', 'Inicio');
        const pages = Math.ceil(this.catalog.length / servicesPerPage);
        if (pages <= 1) return home ? `<nav class="ta-nav" aria-label="Navegación">${home}</nav>` : '';
        const previous = this.catalogPage > 0 ? this.btn('catalog-prev','← Anterior') : '';
        const next = this.catalogPage + 1 < pages ? this.btn('catalog-next','Siguiente →') : '';
        return `<nav class="ta-nav ta-pagination" aria-label="Páginas de servicios">${home}${previous}<span>Página ${this.catalogPage+1} de ${pages}</span>${next}</nav>`;
      }
      if (this.view === 'player' && !this.admin && this.options.shellHome) return '';
      if (this.view === 'player' && !this.admin) return `<nav class="ta-nav spotify-nav" aria-label="Navegación de servicios">${this.btn('store','← Volver a servicios')}</nav>`;
      return `<nav class="ta-nav" aria-label="Navegación de servicios">${this.btn('back','← Volver')}<span></span>${this.btn('store','Ver servicios')}</nav>`;
    }
    back(){
      if(this.view==='store'){
        if(this.catalogPage===0)return false;
        this.catalogPage--;
      }
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
        const status = job ? titles[job.status] : this.adapters.some(a => a.id === app.id) ? 'Disponible para probar' : 'Adaptación por preparar';
        return this.btn('preset', `<span class="ta-app-icon" aria-hidden="true">${brandLogo(app.id, app.sourceUrl)}</span>
          <strong>${esc(app.intent)}</strong><span class="ta-brand">${esc(app.name)}</span><small>${esc(status)}</small>`,
          {value:app.id, className:`ta-app-card ta-${esc(app.id)}`});
      });
      return `<div class="ta-catalog" role="group" aria-label="Servicios">${cards.join('')}</div>`;
    }
    detail(){const a=this.preset,j=this.existing(a);return this.header(esc(a.name),esc(a.description))+`<div class="ta-center"><span class="ta-detail-symbol" aria-hidden="true">${brandLogo(a.id, a.sourceUrl)}</span><p>${a.id==='spotify'?'Puedes controlar Spotify en este computador. Elegir canciones requiere conectar tu cuenta.':this.adapter?.auth.type==='none'?'Esta app se puede preparar sin cuenta. Leerás titulares y extractos del medio.':'Esta adaptación todavía no está disponible. Puedes pedir que la preparemos.'}</p>${this.btn(j?'job':'prepare',j?'Ver mi app':`Preparar ${esc(a.name)}`,{value:j?.id,className:'ta-primary',disabled:!j&&!this.online})}</div>`;}
    progress(){
      if(this.admin)return this.adminProgress();
      const j=this.job;if(!j)return this.store();const stage=j.stage||0;
      const messages={needs_connection:'Falta conectar tu cuenta para elegir canciones. Los controles locales se pueden probar.',needs_test:'Falta probar esta adaptación contigo antes de marcarla lista.',needs_adapter:'Tu solicitud quedó guardada. El equipo todavía debe preparar esta app.',preparing:'Puedes volver a tus apps. La preparación sigue en segundo plano.',queued:'Tu solicitud está guardada.',ready:'Tu app está lista.',cancelled:'Puedes prepararla de nuevo cuando quieras.',error:'Puedes volver a intentarlo.',interrupted:'Puedes continuar la preparación.'};
      const canPlay=this.adapter&&['needs_connection','needs_test','ready'].includes(j.status);
      return this.header(esc(j.name),titles[j.status]||'Preparando')+`<div class="ta-center"><p class="ta-progress-caption">${stage} de 5 etapas completadas</p><div class="ta-progress" role="progressbar" aria-label="Preparación de la adaptación" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${stage}" aria-valuetext="${stage} de 5 etapas completadas"><span style="width:${stage*20}%"></span></div><p>${messages[j.status]||'Tu avance está guardado.'}</p><div class="ta-actions">${canPlay?this.btn('open-adapter',j.status==='ready'?'Abrir app':'Probar app',{className:'ta-primary'}):''}${['cancelled','error','interrupted'].includes(j.status)?this.btn('retry','Volver a preparar',{disabled:!this.online}):j.status!=='ready'?this.btn('cancel','Cancelar preparación'):''}</div></div>`;
    }
    player(){
      if(this.admin)return this.adminPlayer();
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
      if (j.status === 'needs_connection') next = `<div class="ta-connect"><h2>Conecta tu cuenta</h2><p>Abre Spotify Web e inicia sesión. Después elige ese navegador para usar su sesión de Spotify en este computador.</p><a class="ta-link" href="https://open.spotify.com" target="_blank" rel="noopener noreferrer">Abrir Spotify Web ↗</a><div class="ta-actions">${['chrome','safari','firefox'].map(b=>this.btn('browser',b[0].toUpperCase()+b.slice(1),{value:b,className:this.browser===b?'ta-selected':''})).join('')}</div>${this.btn('connect','Usar mi sesión de Spotify',{className:'ta-primary'})}<p class="ta-note">macOS puede pedir acceso al llavero. La sesión se guarda localmente; el generador no recibe tu contraseña.</p>${this.btn('player','Ver controles locales',{className:'ta-quiet'})}</div>`;
      if (['needs_test','ready'].includes(j.status)) next = this.btn('open-adapter',j.status==='ready'?'Abrir app →':'Probar adaptación →',{className:'ta-primary'}) + (j.app!=='spotify'?this.adminReview():'');
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
      this.root.classList.toggle('ta-store', this.view === 'store');
      this.catalogPage = Math.max(0, Math.min(this.catalogPage, Math.ceil(this.catalog.length / servicesPerPage) - 1));
      const focus=document.activeElement?.dataset;this.options.beforePaint?.();
      const content=({store:()=>this.store(),detail:()=>this.detail(),progress:()=>this.progress(),player:()=>this.player(),music:()=>this.music(),results:()=>this.results(),news:()=>this.news(),reading:()=>this.reading()}[this.view]||(()=>this.store()))();
      this.root.innerHTML=`<div class="ta-screen">${content}</div><div class="ta-feedback" role="status" aria-live="polite">${this.busy?'Un momento…':esc(this.error)||(!this.online?'Sin conexión con la preparación local.':'')}</div>${this.nav()}`;
      this.paintPlayback();
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
      if(action==='preset'){if(value==='spotify'&&!this.admin)return this.openSpotify();this.selected=value;const j=this.existing(this.preset);this.id=j?.id||null;this.view=j?'progress':'detail';this.epoch++;if(j?.status==='ready')return this.openAdapter();this.render();return;}
      if(action==='job'){this.id=value;if(this.job?.status==='ready')return this.openAdapter();this.view='progress';this.render();return;}
      if(['progress','player','music'].includes(action)){this.view=action;this.epoch++;this.render();return;}
      if(action==='open-adapter')return this.openAdapter();
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
