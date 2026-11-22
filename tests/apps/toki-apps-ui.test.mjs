// Servicios (toki-apps.js) sin navegador: DOM mínimo y API simulada.
// Comprueba que elegir una app la abre sin pasos intermedios, las miniaturas de noticias y el aviso de Spotify.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../software/toki-os/toki-apps.js', import.meta.url), 'utf8');
const adapters = [
  {id:'spotify',name:'Spotify',interface:{entry:'player'},auth:{type:'local-browser-session'},requiredEvidence:[]},
  {id:'biobio',name:'BioBioChile',interface:{entry:'news'},auth:{type:'none'},requiredEvidence:['list','read']},
  {id:'youtube',name:'YouTube',interface:{entry:'videos'},auth:{type:'none'},requiredEvidence:['list']},
];
const news = [
  {id:'a'.repeat(24),title:'Titular con foto',image:'https://media.biobiochile.cl/wp-content/uploads/2026/11/a-750x400.png',publishedAt:new Date().toISOString()},
  {id:'b'.repeat(24),title:'Titular sin foto',image:null},
  {id:'c'.repeat(24),title:'Titular con imagen rara',image:'javascript:alert(1)'},
];

function load({jobs = [], search = '', prepare = 'needs_test'} = {}) {
  const calls = [];
  const state = {jobs: structuredClone(jobs)};
  const reply = data => ({ok:true,status:200,json:async()=>data});
  const fetch = async (url, options = {}) => {
    const path = url.replace('http://localhost:8790', '');
    calls.push(path);
    if (path === '/api/session') return reply({token:'t'});
    if (path === '/api/jobs' && options.method === 'GET') return reply({jobs:state.jobs});
    if (path === '/api/adapters') return reply({adapters});
    if (path === '/api/jobs') {
      const body = JSON.parse(options.body);
      const job = {id:'00000000-0000-0000-0000-000000000001',app:body.name==='BioBioChile'?'biobio':'youtube',name:body.name,status:'preparing',stage:1,evidence:{}};
      state.jobs = [job, ...state.jobs];
      setTimeout(() => { job.status = prepare; job.message = prepare === 'error' ? 'No se pudieron cargar las noticias.' : ''; }, 50);
      return reply({job});
    }
    const retry = path.match(/^\/api\/jobs\/(.+)\/retry$/);
    if (retry) { const job = state.jobs.find(j => j.id === retry[1]); job.status = 'preparing'; setTimeout(() => { job.status = prepare; }, 50); return reply({job}); }
    if (path === '/api/apps/biobio/actions/list') return reply({source:'BioBioChile',items:news});
    if (path === '/api/apps/youtube/actions/list') return reply({items:[{id:'v1',label:'Paisajes',thumbnail:'https://i.ytimg.com/vi/v1/mqdefault.jpg'}]});
    if (path.startsWith('/api/apps/')) return {ok:false,status:409,json:async()=>({error:'Prepara esta adaptación antes de usar sus controles.'})};
    throw Error('Ruta no simulada: ' + path);
  };
  const root = {innerHTML:'',isConnected:true,classList:{add(){},toggle(){}},addEventListener(){},removeEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]};
  const window = {};
  const context = vm.createContext({window,fetch,location:{port:'8790',origin:'http://localhost:8790',search},document:{hidden:false,activeElement:null},
    AbortSignal,URLSearchParams,setTimeout,clearTimeout,setInterval,clearInterval,Intl,Date,JSON,Promise,Error,Map,Set,Math,Number,String,Array,Object,RegExp});
  vm.runInContext(source, context);
  const app = window.TokiApps.mount(root, {motion:true});
  const press = (action, value = '') => app.act({disabled:false,dataset:{appAction:action,value}});
  const until = async (check, label) => { for (let i = 0; i < 100; i++) { if (check()) return; await new Promise(r => setTimeout(r, 30)); } assert.fail(label + '\n' + root.innerHTML); };
  return {app, root, calls, state, press, until};
}

test('choosing BioBioChile prepares it on its own and opens the news with thumbnails', async t => {
  const {app, root, calls, press, until} = load();
  t.after(() => app.destroy());
  await until(() => app.online, 'sincroniza');
  const opening = press('preset', 'biobio');
  assert.match(root.innerHTML, /Abriendo BioBioChile…/);
  assert.doesNotMatch(root.innerHTML, /etapas|Probar app|Preparar BioBioChile/);
  await opening;
  await until(() => app.view === 'news' && root.innerHTML.includes('news-card'), 'abre las noticias');
  assert.ok(calls.includes('/api/jobs'), 'pide la preparación sola');
  assert.match(root.innerHTML, /<img class="news-thumb" src="https:\/\/media\.biobiochile\.cl\/wp-content\/uploads\/2026\/11\/a-750x400\.png"/);
  assert.equal((root.innerHTML.match(/news-thumb/g) || []).length, 1, 'solo la noticia con foto https lleva miniatura');
  assert.equal((root.innerHTML.match(/class="ta-button news-card"/g) || []).length, 1, 'la noticia sin foto queda como tarjeta de texto');
  assert.match(root.innerHTML, /Volver a servicios/);
});

test('YouTube with a usable job opens straight to the videos', async t => {
  const {app, calls, press, until} = load({jobs:[{id:'y1',app:'youtube',name:'YouTube',status:'needs_test',stage:3,evidence:{}}]});
  t.after(() => app.destroy());
  await until(() => app.online, 'sincroniza');
  await press('preset', 'youtube');
  // El vm no resuelve import('./toki-video.js'); basta con ver que entra a Videos y pide la lista.
  assert.equal(app.view, 'videos');
  await until(() => calls.includes('/api/apps/youtube/actions/list'), 'pide los videos al entrar');
});

test('a failed preparation shows a clear message and Reintentar, never stages', async t => {
  const {app, root, calls, press, until} = load({prepare:'error'});
  t.after(() => app.destroy());
  await until(() => app.online, 'sincroniza');
  await press('preset', 'biobio');
  await until(() => root.innerHTML.includes('No se pudo abrir'), 'muestra el error');
  assert.match(root.innerHTML, /data-app-action="retry"[^>]*>Reintentar/);
  assert.match(root.innerHTML, /Ver servicios/);
  assert.doesNotMatch(root.innerHTML, /etapas/);
  await press('retry');
  assert.ok(calls.some(c => /\/retry$/.test(c)), 'Reintentar vuelve a pedir la preparación');
});

test('Spotify without its connector explains why, offers Reintentar and an exit', async t => {
  const message = 'El conector de Spotify todavía no está instalado en este computador.';
  const {app, root, calls, press, until} = load({jobs:[{id:'s1',app:'spotify',name:'Spotify',status:'error',stage:0,evidence:{},message}]});
  t.after(() => app.destroy());
  await until(() => app.online, 'sincroniza');
  await press('preset', 'spotify');
  assert.match(root.innerHTML, /Falta instalar el conector de Spotify en este computador\. Pídeselo a tu acompañante\./);
  assert.doesNotMatch(root.innerHTML, /Conectando con Spotify|Buscando tu música/);
  assert.match(root.innerHTML, /data-app-action="spotify-retry"[^>]*>Reintentar/);
  assert.match(root.innerHTML, /data-app-action="store"[^>]*>Ver servicios/);
  await press('spotify-retry');
  assert.ok(calls.includes('/api/jobs/s1/retry'));
});

test('admin mode keeps the preparation stages for the team', async t => {
  const {app, root, press, until} = load({search:'?appsAdmin=1',jobs:[{id:'b1',app:'biobio',name:'BioBioChile',status:'needs_test',stage:3,evidence:{},message:'Falta probar.'}]});
  t.after(() => app.destroy());
  await until(() => app.online, 'sincroniza');
  await press('preset', 'biobio');
  assert.match(root.innerHTML, /3 de 5 etapas completadas/);
  assert.match(root.innerHTML, /Probar adaptación/);
});
