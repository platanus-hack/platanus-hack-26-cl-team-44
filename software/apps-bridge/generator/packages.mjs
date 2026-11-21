import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,renameSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createRssAdapter,downloadRss,inspectRssFeed,parseRssFeed} from '../adapters/rss-reader.mjs';
import {publicFetch,publicFeedURL} from './public-fetch.mjs';
import {generateRecipe} from './codex.mjs';

const fault=(message,status=400)=>Object.assign(new Error(message),{status});
const hash=value=>createHash('sha256').update(value).digest('hex');
const exactKeys=(value,keys)=>value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).sort().join(',')===[...keys].sort().join(',');
export const readerId=url=>'reader-'+hash(url).slice(0,16);
export function validateRecipe(recipe,request) {
  if(!exactKeys(recipe,['schemaVersion','kind','name','sourceUrl','capabilities','unsupportedTasks','reason']) || recipe.schemaVersion!==1 ||
    !['rss-reader','unsupported'].includes(recipe.kind) || recipe.name!==request.name || recipe.sourceUrl!==request.sourceUrl ||
    typeof recipe.reason!=='string' || recipe.reason.length>1000 || !Array.isArray(recipe.unsupportedTasks) || recipe.unsupportedTasks.some(x=>typeof x!=='string'||x.length>600) ||
    !Array.isArray(recipe.capabilities) || recipe.capabilities.some(x=>!['list','read'].includes(x)))throw fault('El generador devolvió una adaptación no válida. Reintenta.',502);
  if(recipe.kind==='unsupported' || recipe.unsupportedTasks.length) return false;
  if([...recipe.capabilities].sort().join(',')!=='list,read')throw fault('La adaptación no cubre las funciones de lectura.',502);
  return true;
}
export function validateSpec(spec) {
  if(!exactKeys(spec,['schemaVersion','type','id','name','version','feedUrl','channelTitle','articleHosts','articlePathPrefix']) || spec.schemaVersion!==1 || spec.type!=='rss-reader' ||
    typeof spec.name!=='string' || !spec.name.trim() || spec.name.length>160 || typeof spec.channelTitle!=='string' || !spec.channelTitle || spec.channelTitle.length>300 ||
    !/^1\.0\.\d{1,16}$/.test(spec.version) || !Array.isArray(spec.articleHosts) || spec.articleHosts.length!==1 || spec.articlePathPrefix!=='/')throw fault('El paquete de lectura no es válido.');
  const url=publicFeedURL(spec.feedUrl);
  if(url.href!==spec.feedUrl || spec.id!==readerId(spec.feedUrl) || spec.articleHosts[0]!==url.hostname)throw fault('La fuente del paquete no coincide con la comprobada.');
  return spec;
}
export function packageAdapter(spec,options){const adapter=createRssAdapter(validateSpec(spec),options);adapter.manifest.generated=true;return adapter;}
export function createPackageStore(stateDir) {
  const dir=join(stateDir,'packages');mkdirSync(dir,{recursive:true,mode:0o700});const indexPath=join(dir,'index.json');
  let index={};try{index=JSON.parse(readFileSync(indexPath,'utf8'));if(!index||Array.isArray(index)||typeof index!=='object')throw Error();}catch(e){if(e.code!=='ENOENT')throw fault('No se pudo leer el registro de paquetes. Conserva el archivo antes de repararlo.',500);}
  function load(){const packages=[],errors=[];for(const [id,entry] of Object.entries(index)){
    try{
      if(!/^reader-[a-f0-9]{16}$/.test(id)|| !/^[a-f0-9]{64}$/.test(entry.active))throw Error();
      const raw=readFileSync(join(dir,entry.active+'.json'),'utf8');if(hash(raw)!==entry.active)throw Error();
      const pkg=JSON.parse(raw);validateSpec(pkg.spec);if(pkg.spec.id!==id)throw Error();packages.push(pkg);
    }catch{errors.push({id,message:'El paquete guardado no superó la validación. Vuelve a prepararlo.'});}
  }return {packages,errors};}
  function install(pkg){
    validateSpec(pkg.spec);const raw=JSON.stringify(pkg,null,2),digest=hash(raw),file=join(dir,digest+'.json');
    if(!existsSync(file))writeFileSync(file,raw,{mode:0o600,flag:'wx'});
    const next={...index,[pkg.spec.id]:{active:digest,previous:index[pkg.spec.id]?.active||null}};
    const tmp=indexPath+'.tmp';writeFileSync(tmp,JSON.stringify(next,null,2),{mode:0o600});renameSync(tmp,indexPath);index=next;
    return {digest,version:pkg.spec.version};
  }
  return {load,install};
}
export function createReaderBuilder({generate=generateRecipe,fetcher=publicFetch}={}) {
  // Serialize expensive generation. Waiting jobs remain cancellable and never spawn another CLI.
  let tail=Promise.resolve();
  return function build(request,ctx){
    const task=tail.catch(()=>{}).then(async()=>{
      const {signal,report}=ctx;signal.throwIfAborted();
      const url=publicFeedURL(request.sourceUrl);
      report({stage:0,buildStep:'source',message:'Comprobando la fuente pública…'});
      const xml=await downloadRss({feedUrl:url.href},fetcher,signal),metadata=inspectRssFeed(xml);
      const spec={schemaVersion:1,type:'rss-reader',id:readerId(url.href),name:request.name,version:`1.0.${Date.now()}`,feedUrl:url.href,channelTitle:metadata.channelTitle,articleHosts:[url.hostname],articlePathPrefix:'/'};
      const observed=parseRssFeed(xml,spec);
      report({stage:1,buildStep:'generate',message:'Construyendo la adaptación de lectura…'});
      let result;
      try{result=await generate({name:request.name,sourceUrl:url.href,tasks:request.tasks,observed:{channelTitle:metadata.channelTitle,itemCount:observed.items.length,capabilities:['list','read']}},{signal});}
      catch(e){signal.throwIfAborted();throw fault('No se pudo generar la adaptación. Comprueba Codex y su sesión en el equipo; después reintenta.',502);}
      signal.throwIfAborted();
      if(!validateRecipe(result.recipe,{...request,sourceUrl:url.href}))return {unsupported:true,message:'Esta fuente permite leer titulares y extractos. Las demás tareas necesitan otra adaptación.',unsupportedTasks:result.recipe.unsupportedTasks};
      validateSpec(spec);
      report({stage:2,buildStep:'validate',message:'Interfaz preparada. Comprobando elegir y leer una noticia…'});
      const adapter=packageAdapter(spec,{fetcher}),evidence={};
      const testContext={signal,evidence:key=>{evidence[key]=new Date().toISOString();}};
      await adapter.prepare({signal,report:()=>{}});
      const list=await adapter.execute('list',{},testContext);
      const read=await adapter.execute('read',{articleId:list.items[0].id},testContext);
      if(!list.items.length||!read.article?.pages?.length||!evidence.list||!evidence.read)throw fault('La adaptación no superó la prueba funcional.',502);
      signal.throwIfAborted();
      report({stage:3,buildStep:'install',message:'Funciones comprobadas. Guardando la adaptación…'});
      return {adapter,pkg:{spec,provenance:{engine:result.provenance?.engine||'unknown',skill:'adapt-app',...(result.provenance?.skillSha256?{skillSha256:result.provenance.skillSha256}:{})},validatedAt:new Date().toISOString(),evidence},evidence};
    });
    tail=task;return task;
  };
}
