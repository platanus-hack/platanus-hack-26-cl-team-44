#!/usr/bin/env node
// Assisted setup on the team's computer. Patients choose cards and never enter feed URLs.
import {parseArgs} from 'node:util';
const {values}=parseArgs({options:{name:{type:'string'},feed:{type:'string'},tasks:{type:'string'},port:{type:'string',default:'8790'}}});
if(!values.name||!values.feed){console.error('Uso: node prepare-reader.mjs --name Cooperativa --feed https://…');process.exit(1);}
if(!/^\d{1,5}$/.test(values.port)||Number(values.port)<1||Number(values.port)>65535)throw Error('Puerto no válido.');
const base=`http://127.0.0.1:${values.port}`;
const response=await fetch(base+'/api/session');if(!response.ok)throw Error('Inicia primero el servicio Apps.');
const {token}=await response.json();
async function api(path,body){const r=await fetch(base+path,{headers:{'x-toki-token':token,...(body?{'content-type':'application/json'}:{})},method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});const data=await r.json();if(!r.ok)throw Error(data.error);return data;}
const {job}=await api('/api/jobs',{name:values.name,sourceUrl:values.feed,tasks:values.tasks||'Elegir titulares y leer extractos RSS por páginas.'});
let previous='';
for(let i=0;i<600;i++){
  const {jobs}=await api('/api/jobs'),current=jobs.find(j=>j.id===job.id);
  if(!current)throw Error('Solicitud no encontrada.');
  const line=`${current.stage}/5 · ${current.message}`;
  if(line!==previous){console.log(line);previous=line;}
  if(!['queued','preparing'].includes(current.status)){
    console.log(`Abrir Servicios: ${base}/?start=apps`);
    console.log(`Estado: ${current.status}. La prueba personal no se completa automáticamente.`);
    process.exitCode=['needs_test','ready'].includes(current.status)?0:1;break;
  }
  if(i===599)throw Error('La preparación sigue en segundo plano. Consulta Servicios.');
  await new Promise(resolve=>setTimeout(resolve,1000));
}
