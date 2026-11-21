import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import bytes from './soporte.stl';
const canvas=document.querySelector('canvas'),scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,1,2000);
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio));
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.minDistance=135;controls.maxDistance=800;
function group(p){const g=new T.Group();p.add(g);return g}
const model=group(scene);model.rotation.x=-Math.PI/2;
function mesh(p,g,c,xyz,opts={}){const m=new T.Mesh(g,new T.MeshStandardMaterial({color:c,...opts}));p.add(m);m.position.set(...xyz);return m}
function block(p,w,h,d,c,x,y,z,r=0,opt){return mesh(p,r?new RoundedBoxGeometry(w,h,d,3,r):new T.BoxGeometry(w,h,d),c,[x,y,z],opt)}
function cord(p,pts){mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v))),28,1.2,8,false),0x303b3b,[0,0,0])}
const g=new STLLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));mesh(model,g,0xcdd7cc,[0,0,0]);
const hw=group(model),panel=group(hw);panel.position.set(0,-28,3);panel.rotation.x=77*Math.PI/180;
block(panel,164.9,101,2,0x236657,0,68,5,1);
block(panel,164.28,99.17,4,0x242d31,0,68,8,1.4);
for(const x of [-78.45,78.45])for(const y of [10.52,125.48]){
 block(panel,8,17,1.6,0x236657,x,y<60?y+4:y-4,4.8,1);
 const bolt=mesh(panel,new T.CylinderGeometry(2.5,2.5,1.2,20),0xabb8bd,[x,y,6.3]);bolt.rotation.x=Math.PI/2;
}
const screen=document.createElement('canvas');screen.width=1024;screen.height=600;const ctx=screen.getContext('2d');
ctx.fillStyle='#192f32';ctx.fillRect(0,0,1024,600);ctx.fillStyle='#eef3e7';ctx.font='bold 43px sans-serif';ctx.fillText('Toki',46,64);
['Sí','No','Agua','Ayuda'].forEach((t,i)=>{let x=40+(i%2)*480,y=100+Math.floor(i/2)*240;ctx.fillStyle=['#c5eadb','#ffdabd','#c4ddf2','#f2e7ab'][i];ctx.beginPath();ctx.roundRect(x,y,455,212,18);ctx.fill();ctx.fillStyle='#1d3635';ctx.font='bold 68px sans-serif';ctx.fillText(t,x+38,y+126)});
const tex=new T.CanvasTexture(screen);tex.colorSpace=T.SRGBColorSpace;
const display=new T.Mesh(new T.PlaneGeometry(154.21,85.92),new T.MeshBasicMaterial({map:tex}));panel.add(display);display.position.set(0,68,10.1);
block(panel,33,16,5,0x242c2e,0,142,3,1);block(panel,33,6,14,0x242c2e,0,148,-1,2);block(panel,33,13,4,0x242c2e,0,141,-7,1);
block(panel,62,20,21,0x293335,0,157,1,7);const lens=mesh(panel,new T.CylinderGeometry(7,7,2.5,36),0x11212a,[0,157,12]);lens.rotation.x=Math.PI/2;
const pi=group(hw);pi.position.set(0,49,7);block(pi,92.6,63.4,32.5,0xc0d4d6,0,0,16.25,2.5,{transparent:true,opacity:.27,depthWrite:false});
block(pi,85,56,1.6,0x307758,0,0,6,1);
for(const y of [-17,0,17])block(pi,18,14,14,0x9ca9a9,35,y,14,1);
block(pi,17,17,5,0x727d7e,-5,-4,10,1);
block(pi,30,30,4,0x273231,-8,-2,27,2);
const fan=mesh(pi,new T.CylinderGeometry(12,12,2,36),0x58635e,[-8,-2,30]);fan.rotation.x=Math.PI/2;
for(let i=0;i<4;i++)block(pi,22,1.3,1,0x222d2c,-8,-2,31.4).rotation.z=i*Math.PI/4;
cord(hw,[[0,6,151],[6,20,142],[6,27,65],[44,39,35],[48,46,20]]);
cord(hw,[[-84,-2,92],[-95,2,88],[-91,19,40],[-53,23,19],[-29,17,18]]);
scene.add(new T.HemisphereLight(0xfffcf2,0x929f99,2.1));const light=new T.DirectionalLight(0xfff5e2,2.4);light.position.set(-150,250,160);scene.add(light);
let current='front';
function view(v){current=v;hw.visible=v!=='support';const k=Math.max(1,1.3/camera.aspect);camera.position.set(...(v==='back'?[208*k,209*k,-327*k]:v==='support'?[192*k,198*k,-310*k]:[125*k,137*k,305*k]));controls.target.set(0,75,-10);controls.update();document.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)))}
function resize(){let w=canvas.parentNode.clientWidth,h=canvas.parentNode.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();view(current)}
new ResizeObserver(resize).observe(canvas.parentNode);document.querySelectorAll('button').forEach(b=>b.onclick=()=>view(b.dataset.view));resize();renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
