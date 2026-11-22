import { gazeCalibrationPoints, gazeValidationPoints, gazeValidation } from './gaze-calibration.js';
import { createMyoWareHandoff } from './os-myoware.js';

const MP='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const W = window.MYO;
const $ = selector => document.querySelector(selector);
const { CFG, myowareConfirming } = W;
const {
  trackerOnly, tabletComposer, requestedMethod, guidedSetup,
  iphonePointing, setMyoWareConfirmation, receiveMyoWare,
  pressSrc, releaseSrc, cancelGestures, hasMyoWareSignal, isCameraBrowHeld,
  clearFocus, setGazeLost, island, log, renderSettings, renderStatus, isCareWheelOpen,
} = W.webcamHost;

Object.assign(W, createMyoWareHandoff({
  fromMonitor: new URLSearchParams(location.search).has('myoware'),
  trackerOnly, tabletComposer,
  getMode: () => CFG.mode,
  pointingWithIPhone: iphonePointing,
  setConfirmation: setMyoWareConfirmation,
  receiveInput: receiveMyoWare,
  isConfirming: myowareConfirming,
  notify: island,
  useMouse() {
    window.IPHONE?.deactivate();
    if (window.NOSE?.on || window.NOSE?.starting) window.NOSE.stop();
    setMyoWareConfirmation(true);
    $('#calib').classList.remove('on');
    renderStatus();
  },
  calibrateWithSavedGaze() {
    if (window.CAL && !window.CAL.running) return window.CAL.useSaved('gaze', true);
  },
}));

/* filtro One Euro: suaviza el temblor sin agregar retraso cuando la cabeza se mueve rápido */
class OneEuro{ constructor(minCut=1.2,beta=.015,dCut=1){Object.assign(this,{minCut,beta,dCut,x:null,dx:0,t:null})}
  a(c,dt){const r=2*Math.PI*c*dt;return r/(r+1)}
  f(x,t){ if(this.x===null){this.x=x;this.t=t;return x} const dt=Math.max(1e-3,(t-this.t)/1000); this.t=t;
    const dx=(x-this.x)/dt; this.dx+=this.a(this.dCut,dt)*(dx-this.dx);
    const c=this.minCut+this.beta*Math.abs(this.dx); this.x+=this.a(c,dt)*(x-this.x); return this.x } }

/* ===================== Mirada (iris) =====================
   Estado del arte aplicado (ver reports/Calibración eye tracking por webcam.md):
   · features: iris relativo a las comisuras, rotado al eje del ojo (quita el roll) y normalizado por el ancho del ojo; ambos ojos + pose de cabeza
   · calibración 5×3, descartando 700 ms por punto y parpadeos · regresión ridge cuadrática estandarizada
   · validación con puntos no vistos · mediana 5 + One Euro · histéresis en el foco
   · deriva: corrección implícita con cada selección confirmada (con tope) + recentrado de 1 punto
   · requisito físico: iris ≥ 12 px en la imagen (si no, acercar la cámara) */
const GAZE_KEY='woki.gaze.v1';
const useWebGaze = new URLSearchParams(location.search).get('gazeEngine') !== 'ridge';
let gazeWeb, webSupport;
function loadWebGaze(){
  if(!useWebGaze) return null;
  return webSupport ??= import('./gaze-web-profile.js').then(mod=>{
    gazeWeb=mod.createGazeWebProfile({
      enabled:true,
      onFailure(cause){ clearFocus(); log(`mirada: respaldo MediaPipe · ${cause.message}`); },
    });
    return mod;
  }).catch(()=>null);
}
addEventListener('pagehide',()=>gazeWeb?.stop());
function solve(A,b){ const n=A.length, M=A.map((r,i)=>[...r,b[i]]);
  for(let c=0;c<n;c++){ let p=c; for(let r=c+1;r<n;r++) if(Math.abs(M[r][c])>Math.abs(M[p][c])) p=r; [M[c],M[p]]=[M[p],M[c]];
    const d=M[c][c]||1e-12; for(let k=c;k<=n;k++) M[c][k]/=d;
    for(let r=0;r<n;r++) if(r!==c){ const f=M[r][c]; for(let k=c;k<=n;k++) M[r][k]-=f*M[c][k]; } }
  return M.map(r=>r[n]); }
const GAZE = window.GAZE = {
  model:null, cur:null, raws:[], recent:[], offset:{x:0,y:0}, fx:new OneEuro(.8,.004), fy:new OneEuro(.8,.004),
  irisPx:0, headWarnT:0, headOffT:0,
  get webActive(){ return gazeWeb?.active ?? false; },
  hasPoint(now){ return this.webActive ? !!gazeWeb.point(now) : !!this.model && !!this.cur && !this.cur.blink && now-this.cur.t<200; },
  blocksPointer(now){ return this.webActive ? !this.hasPoint(now) : !this.model; },
  rawPoint(now){
    if(this.webActive) return gazeWeb.point(now);
    const c=this.cur;
    return c && !c.blink && now-c.t<200 ? this.predictRaw(c.vec) : null;
  },
  vec(h,v,hx,hy){ return [h,v,hx,hy,h*h,v*v,h*v]; },
  update(f,r,hx,hy,now,video){
    const vw=video.videoWidth||640, vh=video.videoHeight||480, P=i=>({x:f[i].x*vw,y:f[i].y*vh});
    const eye=(o,i,iris,up,lo)=>{ const A=P(o),B=P(i),I=P(iris),U=P(up),D=P(lo);
      const ax=B.x-A.x, ay=B.y-A.y, w=Math.hypot(ax,ay)||1, ux=ax/w, uy=ay/w, mx=(A.x+B.x)/2, my=(A.y+B.y)/2, vx=I.x-mx, vy=I.y-my;
      return {h:(vx*ux+vy*uy)/w, v:(-vx*uy+vy*ux)/w, open:Math.hypot(U.x-D.x,U.y-D.y)/w}; };
    const e1=eye(33,133,468,159,145), e2=eye(362,263,473,386,374);
    const ir=Math.hypot(P(469).x-P(471).x,P(469).y-P(471).y), ir2=Math.hypot(P(474).x-P(476).x,P(474).y-P(476).y);
    this.irisPx=this.irisPx*.9+((ir+ir2)/2)*.1;
    let blink=false;
    if(r.faceBlendshapes && r.faceBlendshapes[0]){ const c=r.faceBlendshapes[0].categories; const g=n=>(c.find(x=>x.categoryName===n)||{}).score||0;
      blink = g('eyeBlinkLeft')>.45 || g('eyeBlinkRight')>.45; }
    const open=(e1.open+e2.open)/2;
    if(this.model && open<this.model.openBase*.55) blink=true;
    this.cur={vec:this.vec((e1.h+e2.h)/2,(e1.v+e2.v)/2,hx,hy), open, blink, hx, hy, t:now};
    const q=this.irisPx<12?'⚠️ acércate a la cámara':'✓';
    const info=$('#gazeInfo'); if(info) info.textContent=`iris ${this.irisPx.toFixed(0)} px ${q}${blink?' · parpadeo':''}`;
  },
  predictRaw(vec){ const m=this.model; if(!m) return null;
    const z=vec.map((x,i)=>(x-m.mu[i])/m.sd[i]);
    return {x:z.reduce((s,x,i)=>s+x*m.wx[i],m.ymx), y:z.reduce((s,x,i)=>s+x*m.wy[i],m.ymy)}; },
  point(now,stable=true){
    if(this.webActive){
      const p=stable?gazeWeb.stablePoint(now):gazeWeb.point(now); if(!p) return null;
      return {x:Math.min(1,Math.max(0,p.x+this.offset.x)),y:Math.min(1,Math.max(0,p.y+this.offset.y))};
    }
    const c=this.cur; if(!c || !this.model) return null;
    if(c.blink) return this.last||null;                                       // en parpadeo se mantiene el último punto
    const p=this.predictRaw(c.vec); if(!p) return null;
    this.raws.push(p); if(this.raws.length>5) this.raws.shift();
    this.recent.push({...p,t:now}); this.recent=this.recent.filter(q=>now-q.t<900);
    const med=k=>[...this.raws].map(q=>q[k]).sort((a,b)=>a-b)[Math.floor(this.raws.length/2)];
    let x=med('x')+this.offset.x, y=med('y')+this.offset.y;
    x=this.fx.f(x*1920,now)/1920; y=this.fy.f(y*1080,now)/1080;              // One Euro en px del lienzo
    // aviso si la cabeza se alejó mucho de donde se calibró
    const m=this.model; if(Math.abs(c.hx-m.h0.x)>.09||Math.abs(c.hy-m.h0.y)>.09){ if(!this.headOffT) this.headOffT=now;
      if(now-this.headOffT>3000 && now-this.headWarnT>20000){ this.headWarnT=now; island('↺','Te moviste: mira al centro y aprieta V para recentrar',true,3500); } } else this.headOffT=0;
    this.last={x:Math.min(1,Math.max(0,x)),y:Math.min(1,Math.max(0,y))}; return this.last;
  },
  fit(rows){
    const lam=1e-2, d=rows[0].x.length, n=rows.length;
    const mu=Array(d).fill(0), sd=Array(d).fill(0);
    rows.forEach(r=>r.x.forEach((v,i)=>mu[i]+=v/n)); rows.forEach(r=>r.x.forEach((v,i)=>sd[i]+=(v-mu[i])**2/n)); for(let i=0;i<d;i++) sd[i]=Math.sqrt(sd[i])||1;
    const Z=rows.map(r=>r.x.map((v,i)=>(v-mu[i])/sd[i]));
    const ymx=rows.reduce((s,r)=>s+r.y.x,0)/n, ymy=rows.reduce((s,r)=>s+r.y.y,0)/n;
    const XtX=Array.from({length:d},(_,i)=>Array.from({length:d},(_,j)=>Z.reduce((s,z)=>s+z[i]*z[j],0)+(i===j?lam*n:0)));
    const Xty=k=>Array.from({length:d},(_,i)=>Z.reduce((s,z,ri)=>s+z[i]*(rows[ri].y[k]-(k==='x'?ymx:ymy)),0));
    const opens=rows.map(r=>r.open).sort((a,b)=>a-b);
    const h0={x:rows.reduce((s,r)=>s+r.hx,0)/n, y:rows.reduce((s,r)=>s+r.hy,0)/n};
    this.model={mu,sd,wx:solve(XtX,Xty('x')),wy:solve(XtX,Xty('y')),ymx,ymy,openBase:opens[Math.floor(n/2)],h0};
    this.offset={x:0,y:0}; this.raws=[]; this.fx=new OneEuro(.8,.004); this.fy=new OneEuro(.8,.004);
  },
  // deriva: cada selección confirmada dice dónde estaba mirando de verdad
  onConfirm(el){
    if(this.webActive || !this.model || NOSE.mode!=='gaze' || this.recent.length<4) return;
    const st=$('#stage').getBoundingClientRect(), r=el.getBoundingClientRect();
    const cx=(r.left+r.width/2-st.left)/st.width, cy=(r.top+r.height/2-st.top)/st.height;
    const mx=this.recent.reduce((s,q)=>s+q.x,0)/this.recent.length, my=this.recent.reduce((s,q)=>s+q.y,0)/this.recent.length;
    const a=.3, cap=.12;
    this.offset.x=Math.max(-cap,Math.min(cap,this.offset.x+a*(cx-(mx+this.offset.x))));
    this.offset.y=Math.max(-cap,Math.min(cap,this.offset.y+a*(cy-(my+this.offset.y))));
    log(`mirada: corrección de deriva → offset ${(this.offset.x*100).toFixed(1)}% , ${(this.offset.y*100).toFixed(1)}%`);
  },
  save(){ try{ localStorage.setItem(GAZE_KEY,JSON.stringify(this.model)); }catch(_){} },
  loadSaved(){ try{ const m=JSON.parse(localStorage.getItem(GAZE_KEY)); if(m&&m.wx){ this.model=m; return true; } }catch(_){} return false; }
};

const NOSE = window.NOSE = {
  mode:'nose',
  on:false, ready:false, sensIdx:1, faceClick:false, neutral:null, raw:null,
  lastFace:0, fx:new OneEuro(), fy:new OneEuro(), lm:null, stream:null,
  gains:[2.4,3.4,4.6],
  session:0, starting:null, frameId:0,
  showCamera(state, message){
    const status=$('#cameraStatus');
    if(status.dataset.state===state && status.textContent===message) return;
    status.dataset.state=state; status.textContent=message;
    const active=state==='found' || state==='searching';
    $('#noseBtn').textContent=active?'Apagar cámara':state==='starting'?'Cancelar':'Activar cámara';
    $('#noseBtn').classList.toggle('on',active);
    $('#cameraPreview').classList.toggle('live',!!$('#cam').srcObject);
  },
  start(){
    if(this.on) return;
    if(!this.starting){
      const session=++this.session;
      this.starting=this.openCamera(session).finally(()=>{ if(this.session===session) this.starting=null; });
    }
    return this.starting;
  },
  async openCamera(session){
    let stream, model;
    const video=$('#cam');
    try{
      this.showCamera('starting','Esperando permiso de cámara…');
      await Promise.resolve();
      if(session!==this.session) return;
      stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false});
      if(session!==this.session) return;
      this.stream=stream;
      if(tabletComposer){
        const cameras=await navigator.mediaDevices.enumerateDevices();
        if(session!==this.session) return;
        const laptop=cameras.find(d=>d.kind==='videoinput' && /facetime|built.?in|integrada|integrated/i.test(d.label) && !/iphone|continuity/i.test(d.label));
        if(laptop && laptop.deviceId!==stream.getVideoTracks()[0]?.getSettings().deviceId){
          stream.getTracks().forEach(t=>t.stop());
          stream=await navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:laptop.deviceId},width:640,height:480},audio:false});
          if(session!==this.session) return;
          this.stream=stream;
        }
        if(/iphone|continuity/i.test(stream.getVideoTracks()[0]?.label||'')) throw Error('Elige la cámara integrada en los permisos del navegador.');
      }
      video.srcObject=stream;
      this.showCamera('starting','Preparando la detección…');
      stream.getVideoTracks()[0].addEventListener('ended',()=>{
        if(this.session===session){ this.stop(); this.showCamera('error','Se desconectó la cámara'); }
      },{once:true});
      await video.play();
      if(session!==this.session) return;
      const {FaceLandmarker,FilesetResolver}=await import(MP+'/vision_bundle.mjs');
      const files=await FilesetResolver.forVisionTasks(MP+'/wasm');
      if(session!==this.session) return;
      const opts=delegate=>({baseOptions:{modelAssetPath:MODEL,delegate},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true});
      try{ model=await FaceLandmarker.createFromOptions(files,opts('GPU')); }
      catch(e){ if(session!==this.session) return; model=await FaceLandmarker.createFromOptions(files,opts('CPU')); }
      if(session!==this.session) return;
      this.lm=model; model=null; this.on=true; this.neutral=null; this.raw=null; this.lastFace=performance.now(); this.videoTime=-1;
      this.showCamera('searching','Buscando rostro…');
      log('cámara activa · modo '+this.mode); this.loop();
    }catch(e){
      if(session!==this.session) return;
      this.stop();
      const message=e.name==='NotAllowedError'?'Permite el acceso a la cámara en el navegador.':e.name==='NotFoundError'?'No se encontró una cámara.':'No se pudo iniciar la cámara o la detección.';
      this.showCamera('error',message); island('⚠️',message,true,4000); log('cámara: '+(e.message||e));
    }finally{
      if(stream && stream!==this.stream) stream.getTracks().forEach(t=>t.stop());
      model?.close();
    }
    if(W.S.screen==='settings') renderSettings();
  },
  stop(){
    gazeWeb?.stop();
    ++this.session; this.starting=null; this.on=false; this.resetFaceEdges(); this._back=null; this.raw=null;
    cancelAnimationFrame(this.frameId);
    this.stream?.getTracks().forEach(track=>track.stop()); this.stream=null; $('#cam').srcObject=null;
    this.lm?.close(); this.lm=null;
    const canvas=$('#camDot'); canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
    $('#gazeInfo').textContent=''; $('#noseInfo').textContent='';
    this.showCamera('off','Cámara apagada');
    if(W.S.gazeLost) setGazeLost(false); island('🖱️','Puntero con mouse'); log('puntero con mouse');
    if(W.S.screen==='settings') renderSettings();
  },
  toggle(){ this.on || this.starting ? this.stop() : this.setMode('nose'); },
  async setMode(m){
    if(window.IPHONE && IPHONE.active) IPHONE.deactivate();
    if(m==='mouse'){ if(this.on || this.starting) this.stop(); return; }
    if(m!=='gaze') gazeWeb?.stop();
    this.mode=m; try{ localStorage.setItem('woki.ptr',m); }catch(_){}
    if(!this.on) await this.start();
    if(!this.on) return;
    if(m==='gaze'){
      await loadWebGaze();
      if(!this.on || this.mode!==m) return;
      if(!gazeWeb?.active && !GAZE.model && !GAZE.loadSaved() && !gazeWeb?.load()) CAL.open('gaze');
      else {
        island('👁','Puntero con la mirada · V recentra');
        if(!gazeWeb?.active && !await CAL.resumeWebGaze() && !GAZE.model && this.on && this.mode===m) CAL.open('gaze');
      }
    }
    else island('👃','Puntero con la nariz · C recentra');
    if(W.S.screen==='settings') renderSettings();
  },
  label(){ return !this.on? 'Mouse' : this.mode==='gaze'? 'Mirada' : 'Nariz'; },
  center(){ if(this.raw){ this.neutral={...this.raw}; if(this.cal) this.cal.n={...this.raw}; this.fx=new OneEuro(); this.fy=new OneEuro(); island('🎯','Centrado'); } },
  cal:null,

  loop(){
    if(!this.on) return;
    const v=$('#cam'), now=performance.now();
    // The tablet consumes just the gaze cursor, not a second face/gesture model.
    if(trackerOnly && this.mode==='gaze' && gazeWeb?.active){
      const frame=gazeWeb.frame();
      if(frame?.tracked && now-frame.capturedAt<240){
        this.raw ??= {dx:0,dy:0};
        this.lastFace=frame.capturedAt;
        if(W.S.gazeLost){
          this._back ??= now;
          if(now-this._back>=1500){ setGazeLost(false); this._back=null; }
        }
        const p=!W.S.gazeLost && GAZE.point(now);
        if(p){ const st=$('#stage').getBoundingClientRect(); W.mouse.x=st.left+st.width*p.x; W.mouse.y=st.top+st.height*p.y; }
      } else {
        this._back=null;
        if(now-this.lastFace>1500 && !W.S.gazeLost) setGazeLost(true);
      }
      this.frameId=requestAnimationFrame(()=>this.loop());
      return;
    }
    if(v.readyState>=2 && this.lm && this.videoTime!==v.currentTime){
      this.videoTime=v.currentTime;
      let r;
      try{ r=this.lm.detectForVideo(v,now); }
      catch(e){ this.stop(); this.showCamera('error','Se interrumpió la detección. Activa la cámara para reintentar.'); log('detección: '+e.message); return; }
      const f=r.faceLandmarks && r.faceLandmarks[0];
      const showPreview=!document.body.classList.contains('game-immersive');
      if(f){
        this.showCamera('found','Rostro detectado');
        this.lastFace=now;
        if(W.S.gazeLost && !this._back){ this._back=now; }
        if(this._back && now-this._back>1500){ setGazeLost(false); this._back=null; }  // espera 1,5 s antes de aceptar clics (guía)
        // giro de cabeza: nariz relativa al contorno de la cara (no depende de dónde esté sentada)
        const nose=f[1], L=f[234], R=f[454], top=f[10], chin=f[152];
        const fw=Math.hypot(R.x-L.x,R.y-L.y), fh=Math.hypot(chin.x-top.x,chin.y-top.y);
        const dx=(nose.x-(L.x+R.x)/2)/fw, dy=(nose.y-(top.y+chin.y)/2)/fh;
        this.raw={dx,dy};
        if(!this.neutral) this.neutral={dx,dy};
        let ux,uy;
        const c=this.cal;
        if(c){ // calibrado: el rango cómodo de cada lado llega a las esquinas (±0,42 ancho, ±0,40 alto)
          const k=[.8,1,1.25][this.sensIdx], ddx=dx-c.n.dx, ddy=dy-c.n.dy;
          ux=(ddx<0? -ddx/c.R : -ddx/c.L)*.42*k;
          uy=(ddy<0? ddy/c.U : ddy/c.D)*.40*k;
        } else { // sin calibrar: ganancia fija
          const g=this.gains[this.sensIdx];
          ux=-(dx-this.neutral.dx)*g; uy=(dy-this.neutral.dy)*g*1.6;  // espejo en X; el eje vertical tiene menos recorrido
        }
        const st=$('#stage').getBoundingClientRect();
        let x=st.left+st.width*(.5+ux), y=st.top+st.height*(.5+uy);
        // modo mirada: la cámara y el modelo son los mismos; cambia cómo se calcula el punto
        GAZE.update(f, r, dx, dy, now, v);
        let gazeOK=true;
        if(this.mode==='gaze'){ const p=GAZE.point(now,!document.body.classList.contains('external-playing')); if(p){ x=st.left+st.width*p.x; y=st.top+st.height*p.y; } else gazeOK=false; }
        x=Math.min(st.right-4,Math.max(st.left+4,x)); y=Math.min(st.bottom-4,Math.max(st.top+4,y));
        // clic con la cara (respaldo sin EMG)
        let freeze=!gazeOK;
        if(this.faceClick && !hasMyoWareSignal() && r.faceBlendshapes && r.faceBlendshapes[0]){
          const b=Object.fromEntries(r.faceBlendshapes[0].categories.map(c=>[c.categoryName,c.score]));
          const brow=Math.max(b.browInnerUp||0,((b.browOuterUpLeft||0)+(b.browOuterUpRight||0))/2), jaw=b.jawOpen||0;
          const cb=this.fc.ceja, cj=this.fc.mandibula;
          if(cj.base!==null && jaw>cj.base+cj.delta){ cancelGestures('face'); cb.up=false; }
          else this.faceEdge('ceja',brow,now);
          this.faceEdge('mandibula',jaw,now);
          // mientras el gesto está en curso, el puntero se queda quieto (la cara entera se mueve al levantar las cejas)
          freeze = brow>cb.base+cb.delta*.4 || jaw>cj.base+cj.delta*.4 || now-this.fcLast<250;
          $('#noseInfo').textContent=`cejas ${brow.toFixed(2)} (reposo ${cb.base.toFixed(2)}) · boca ${jaw.toFixed(2)}`;
        } else { this.resetFaceEdges(); $('#noseInfo').textContent=''; }
        if(!freeze){
          if(this.mode==='gaze'){ W.mouse.x=x; W.mouse.y=y; }            // la mirada ya viene suavizada (mediana + One Euro propios)
          else { W.mouse.x=this.fx.f(x,now); W.mouse.y=this.fy.f(y,now); }
        }
        if(showPreview) this.draw(f);
      } else {
        this.resetFaceEdges();
        this._back=null;
        if(now-this.lastFace>1500 && !W.S.gazeLost) setGazeLost(true);   // sin cara 1,5 s → escaneo con EMG
        if(!this.raw || now-this.lastFace>400) this.showCamera('searching','Buscando rostro…');
        if(showPreview){
          const canvas=$('#camDot'); canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
        }
      }
    } else if(v.readyState<2) this.resetFaceEdges();
    this.frameId=requestAnimationFrame(()=>this.loop());
  },
  fc:{ ceja:{base:null,delta:.18,up:false}, mandibula:{base:null,delta:.22,up:false} },
  fcLast:0,
  resetFaceEdges(){
    if(!this.fc.ceja.up && !this.fc.mandibula.up && !isCameraBrowHeld()) return;
    cancelGestures('face');
    this.fc.ceja.up=this.fc.mandibula.up=false;
  },
  faceEdge(src,v,now){
    const s=this.fc[src];
    if(s.base===null) s.base=v;
    if(!s.up && v<s.base+s.delta*.5) s.base=s.base*.97+v*.03;          // el reposo se aprende solo, lento
    const hi=s.base+s.delta, lo=s.base+s.delta*.45;
    if(!s.up && v>hi){ s.up=true; this.fcLast=now; pressSrc(src,'face',now); }
    else if(s.up && v<lo){ s.up=false; this.fcLast=now; releaseSrc(src,'face',now); }
  },
  draw(f){
    const canvas=$('#camDot'), video=$('#cam');
    if(canvas.width!==video.videoWidth || canvas.height!==video.videoHeight){ canvas.width=video.videoWidth; canvas.height=video.videoHeight; }
    const c=canvas.getContext('2d'), w=canvas.width, h=canvas.height;
    c.clearRect(0,0,w,h); c.fillStyle='#30D158';
    for(const i of [1,234,454,10,152]){ const p=f[i]; c.beginPath(); c.arc((1-p.x)*w,p.y*h,w*(i===1?.024:.012),0,2*Math.PI); c.fill(); }
  }
};
/* ===================== Sesión de calibración ===================== */
const CAL_KEY='woki.cal.v1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const stageXY=(fx,fy)=>({left:(fx*100)+'%',top:(fy*100)+'%'});
const CAL = {
  running:false,
  ui(title,text,step,mini=true){ $('#calCard').classList.remove('choose-control'); $('#calTitle').textContent=title; $('#calText').textContent=text; $('#calCard').classList.toggle('mini',mini);
    [...$('#calSteps').children].forEach((s,i)=>{ s.classList.toggle('on',i===step); s.classList.toggle('done',i<step); }); },
  dot(fx,fy,on=true){ const d=$('#calDot'); Object.assign(d.style,stageXY(fx,fy)); d.classList.toggle('on',on); d.classList.toggle('lower',fy>=.72); d.style.setProperty('--p',0); },
  async collect(ms){ // promedia la posición de la cabeza mientras se llena el anillo
    const pts=[], t0=performance.now(), d=$('#calDot');
    while(performance.now()-t0<ms){ const p=(performance.now()-t0)/ms; d.style.setProperty('--p',p);
      if(NOSE.raw && performance.now()-NOSE.lastFace<200) pts.push({...NOSE.raw}); await sleep(33); }
    d.style.setProperty('--p',1);
    if(pts.length<5) return null;
    pts.sort((a,b)=>a.dx-b.dx); const mid=pts.slice(Math.floor(pts.length*.2),Math.ceil(pts.length*.8)); // descarta extremos
    return {dx:mid.reduce((s,p)=>s+p.dx,0)/mid.length, dy:mid.reduce((s,p)=>s+p.dy,0)/mid.length};
  },
  async run(){
    if(this.running) return; this.running=true;
    try{
      gazeWeb?.stop();
      if (tabletComposer) {
        document.body.classList.add('nose-calibration');
        $('#noseTracking').hidden = false;
      }
      this.ui('Preparando la cámara','Colócate frente a la pantalla.',0);
      NOSE.mode='nose'; try{ localStorage.setItem('woki.ptr','nose'); }catch(_){}
      this.steps(['Centro','Esquinas','Prueba','Listo']);
      if(!NOSE.on) await NOSE.start();
      if(!NOSE.on) throw new Error('sin cámara');
      NOSE.cal=null;
      // 1 · centro
      this.ui('Mira al centro','Mantén la cabeza quieta hasta que se llene el círculo.',0); this.dot(.5,.42); await sleep(900);
      let n=await this.collect(1600); if(!n) throw new Error('no veo la cara: revisa la luz y la posición');
      NOSE.neutral = {...n};
      // 2 · esquinas
      const C={TL:[.08,.10],TR:[.92,.10],BR:[.92,.90],BL:[.08,.90]}, got={};
      for(const [k,[x,y]] of Object.entries(C)){
        this.ui('Gira la cabeza hacia el punto',tabletComposer ? 'El punto verde es la guía. El blanco se mueve contigo.' : 'Sin forzar: hasta donde te resulte cómodo.',1); this.dot(x,y); await sleep(1300);
        got[k]=await this.collect(1100); if(!got[k]) throw new Error('perdí la cara en una esquina');
      }
      const rel=k=>({x:got[k].dx-n.dx, y:got[k].dy-n.dy}), m=Math.max;
      const R=m(.02,(-rel('TR').x-rel('BR').x)/2), L=m(.02,(rel('TL').x+rel('BL').x)/2);
      const U=m(.015,(-rel('TL').y-rel('TR').y)/2), D=m(.015,(rel('BL').y+rel('BR').y)/2);
      NOSE.cal={n,R,L,U,D}; NOSE.neutral={...n}; NOSE.fx=new OneEuro(); NOSE.fy=new OneEuro();
      this.dot(.5,.5,false);
      // 3 · prueba: 3 objetivos
      const spots=[[.27,.32],[.73,.32],[.73,.68],[.27,.68]].sort(()=>Math.random()-.5).slice(0,3);
      let hits=0, times=[];
      for(let i=0;i<spots.length;i++){
        this.ui(`Apunta al círculo (${i+1}/3)`,'Mantén el punto blanco dentro del círculo.',2);
        const t=$('#calTarget'); Object.assign(t.style,stageXY(...spots[i])); t.classList.remove('hit'); t.classList.add('on');
        const t0=performance.now(); let inside=0, ok=false;
        while(performance.now()-t0<7000){
          const r=t.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
          const isIn=performance.now()-NOSE.lastFace<250 && Math.hypot(W.gz.x-cx,W.gz.y-cy)<r.width/2;
          if(isIn){ inside=inside||performance.now(); t.classList.add('hit'); if(performance.now()-inside>700){ ok=true; break; } }
          else { inside=0; t.classList.remove('hit'); }
          await sleep(33);
        }
        if(ok){ hits++; times.push((performance.now()-t0)/1000); }
        await sleep(350); t.classList.remove('on','hit'); await sleep(250);
      }
      if (hits >= 2) { try{ localStorage.setItem(CAL_KEY,JSON.stringify(NOSE.cal)); }catch(_){} }
      const avg=times.length? (times.reduce((a,b)=>a+b,0)/times.length).toFixed(1)+' s':'—';
      log(`calibración: ${hits}/3 aciertos · tiempo medio ${avg} · rangos R${R.toFixed(3)} L${L.toFixed(3)} U${U.toFixed(3)} D${D.toFixed(3)}`);
      // 4 · resultado
      if(hits>=2){ this.ui(`Listo · ${hits} de 3`,`Tiempo medio: ${avg}. Puedes recentrar cuando quieras con C.`,3); await sleep(1800); this.close(); }
      else { this.ui('Probemos otra vez',`Acertaste ${hits} de 3. Acércate a la cámara o mejora la luz.`,2,false); this.showBtns(); }
    }catch(e){ this.dot(.5,.5,false); this.ui('No pudimos calibrar', String(e.message||e), 0, false); this.showBtns(); }
    document.body.classList.remove('nose-calibration','nose-detected');
    $('#noseTracking').hidden = true;
    this.running=false;
  },
  /* ---------- Calibración de la mirada y validación con puntos no vistos ---------- */
  steps(labels){ $('#calSteps').innerHTML=labels.map(l=>`<span>${l}</span>`).join(''); },
  async runGaze(withMyoWare=false){
    if(this.running) return; this.running=true; document.body.classList.add('calibrating');
    const priorModel=GAZE.model, priorOffset=GAZE.offset;
    let accepted=false;
    try{
      NOSE.mode='gaze'; try{ localStorage.setItem('woki.ptr','gaze'); }catch(_){}
      this.steps(['Puntos','Validación','Listo']);
      this.ui('Preparando la cámara','Permite el acceso a la cámara para seguir los puntos.',0);
      const optionalWeb=loadWebGaze();
      if(!NOSE.on) await NOSE.start(); if(!NOSE.on) throw new Error('sin cámara');
      const video=$('#cam');
      const webModule=await optionalWeb;
      let web=await gazeWeb?.start(video);
      function discardWeb(){ gazeWeb?.stop(); web=null; }
      async function withWeb(action){
        if(!web) return;
        try { return await action(web); } catch { discardWeb(); }
      }
      if(GAZE.irisPx && GAZE.irisPx<12){ this.ui('Acércate a la cámara',`El iris mide ${GAZE.irisPx.toFixed(0)} px y necesita 12 px o más. Acerca la cámara a la cara (50–80 cm) o la cara a la cámara.`,0,false); await sleep(3500); }
      this.ui('Sigue el punto con los ojos',`Deja la cabeza quieta y mueve solo los ojos. Son ${gazeCalibrationPoints.length} puntos.`,0);
      await sleep(1200);
      const rows=[];
      let ridgeReady=true;
      for(const [i,[x,y]] of gazeCalibrationPoints.entries()){
        this.dot(x,y);
        let ridgeCaptured=!ridgeReady, webCaptured=false;
        for(let attempt=0;attempt<2 && (!ridgeCaptured || (web && !webCaptured));attempt++){
          this.ui(`Mira el punto (${i+1}/${gazeCalibrationPoints.length})`,attempt?'No vimos bien tus ojos. Vuelve a mirar el mismo punto.':'Sin mover la cabeza.',0);
          await sleep(700);
          if(!webCaptured) await withWeb(client=>client.target({x,y}));
          const t0=performance.now(), d=$('#calDot'), pointRows=[];
          let lastFrame;
          while(performance.now()-t0<1300){
            d.style.setProperty('--p',(performance.now()-t0)/1300);
            const c=GAZE.cur;
            if(!ridgeCaptured && c && !c.blink && c.t>=t0 && c.t!==lastFrame){
              lastFrame=c.t;
              pointRows.push({x:c.vec,y:{x,y},open:c.open,hx:c.hx,hy:c.hy});
            }
            await sleep(33);
          }
          if(pointRows.length>=8){ rows.push(...pointRows); ridgeCaptured=true; }
          if(!webCaptured) webCaptured=!!await withWeb(client=>client.capture());
        }
        if(web && !webCaptured) discardWeb();
        if(!ridgeCaptured) ridgeReady=false;
        if(!web && !ridgeReady) throw new Error('perdí tus ojos en un punto: revisa la luz o los lentes');
      }
      if(ridgeReady) GAZE.fit(rows);
      this.dot(.5,.5,false); this.ui('Ahora comprobamos','Mira cada punto nuevo.',1);
      const profile=await withWeb(async client=>{
        const trained=await client.adjust(true);
        await client.warmUp();
        return trained;
      });
      await sleep(900);
      const ridgeSamples=[], webSamples=[];
      for(const [i,[x,y]] of gazeValidationPoints.entries()){
        this.ui(`Comprueba el punto (${i+1}/${gazeValidationPoints.length})`,'Mira el punto sin mover la cabeza.',1);
        this.dot(x,y); await sleep(600);
        const ps=[], ws=[], t0=performance.now(), d=$('#calDot'); let lastRidge, lastWeb;
        while(performance.now()-t0<1200){ d.style.setProperty('--p',(performance.now()-t0)/1200);
          const now=performance.now();
          const sampleTime=GAZE.cur?.t;
          if(ridgeReady && sampleTime>=t0 && sampleTime!==lastRidge){
            lastRidge=sampleTime;
            const p=GAZE.rawPoint(now); if(p) ps.push(p);
          }
          const p=webModule?.freshWebPoint(web?.peek(),now,t0);
          if(p && p!==lastWeb){ ws.push(p); lastWeb=p; }
          await sleep(33); }
        ridgeSamples.push(ps.length>=3?ps:[]);
        webSamples.push(ws.length>=3?ws:[]);
      }
      this.dot(.5,.5,false);
      const ridgeScore=gazeValidation(gazeValidationPoints,ridgeSamples), webScore=gazeValidation(gazeValidationPoints,webSamples);
      const useWeb=!!profile && webScore.error<.14 && gazeWeb.use(web);
      if(!useWeb) discardWeb();
      const {error:e,hits}=useWeb?webScore:ridgeScore, pct=(e*100).toFixed(1);
      const result=`${hits} de ${gazeValidationPoints.length} puntos cerca del objetivo`;
      const level = e<.08? 'verde' : e<.14? 'ámbar' : 'rojo';
      if(ridgeScore.error<.14) GAZE.save();
      else { GAZE.model=priorModel; GAZE.offset=priorOffset; }
      if(level!=='rojo'){
        accepted=true;
        GAZE.offset={x:0,y:0};
        gazeWeb?.save(video,useWeb?profile:null);
      }
      log(`calibración mirada ${useWeb?'WebEyeTrack':'MediaPipe'}: ${rows.length} muestras · error medio ${pct}% del ancho · ${result} · iris ${GAZE.irisPx.toFixed(0)} px`);
      if(level==='rojo'){ this.ui('La mirada no quedó estable',`${result}. Acerca la cámara o mejora la luz de frente y vuelve a intentar.`,1,false); $('#calBtns').style.display=''; this.showBtns(); }
      else { this.ui(level==='verde'?`Listo · muy estable`:`Listo · usable`,`${result}. Si el puntero se desvía, mira al centro y aprieta V.`,2); await sleep(2200); this.finishGaze(withMyoWare); }
    }catch(e){ this.dot(.5,.5,false); this.ui('No pudimos calibrar la mirada', String(e.message||e), 0, false); this.showBtns(); }
    if(!accepted){ gazeWeb?.stop(); GAZE.model=priorModel; GAZE.offset=priorOffset; }
    document.body.classList.remove('calibrating'); this.running=false;
  },
  // recentrado rápido de 1 punto (deriva)
  async recenterGaze(){
    if((!GAZE.model && !gazeWeb?.active) || this.running) return; this.running=true; document.body.classList.add('calibrating');
    $('#calib').classList.add('on'); this.steps(['Recentrar']); this.ui('Mira el punto del centro','Un segundo y listo.',0); this.dot(.5,.5);
    await sleep(500); const ps=[], t0=performance.now(), d=$('#calDot');
    while(performance.now()-t0<1200){ d.style.setProperty('--p',(performance.now()-t0)/1200); const p=GAZE.rawPoint(performance.now()); if(p) ps.push(p); await sleep(33); }
    if(ps.length>5){ const mx=ps.reduce((s,p)=>s+p.x,0)/ps.length, my=ps.reduce((s,p)=>s+p.y,0)/ps.length; GAZE.offset={x:.5-mx,y:.5-my}; log(`mirada recentrada · offset ${((.5-mx)*100).toFixed(1)}%, ${((.5-my)*100).toFixed(1)}%`); }
    this.close(); document.body.classList.remove('calibrating'); this.running=false; island('🎯','Mirada recentrada');
  },
  showBtns(){
    if (guidedSetup && this.running) {
      const detail = $('#calText').textContent;
      const message = detail === 'sin cámara'
        ? 'No pudimos abrir la cámara. Revisa el permiso del navegador o elige Mouse.'
        : $('#calTitle').textContent + '. ' + detail;
      parent.postMessage({type:'toki-control-error', message},location.origin);
      return;
    }
    if(!tabletComposer && !trackerOnly && !$('#calIphone:not([hidden])')) $('#calCard').classList.add('choose-control');
    try { $('#calSaved').hidden = !(this.saved() || localStorage.getItem(GAZE_KEY) || (useWebGaze && localStorage.getItem('woki.webeyetrack.v1')) || (!guidedSetup && window.IPHONE && IPHONE.hasSaved())); } catch {}
  },
  saved(){ try{ return JSON.parse(localStorage.getItem(CAL_KEY)); }catch(_){ return null; } },
  async resumeWebGaze(){
    const saved=gazeWeb?.load();
    if(!saved) return false;
    const web=await gazeWeb.start($('#cam'),saved);
    if(!NOSE.on || NOSE.mode!=='gaze' || !gazeWeb.use(web)) return false;
    GAZE.offset={x:0,y:0};
    log('calibración mirada WebEyeTrack recuperada');
    return true;
  },
  async useSaved(method,withMyoWare=false){
    let last = method;
    if (!last) { try { last = localStorage.getItem('woki.ptr'); } catch {} }
    if (!guidedSetup && last === 'iphone' && window.IPHONE && IPHONE.hasSaved()) {
      IPHONE.openPanel();
      await IPHONE.useSaved();
      return;
    }
    this.ui('Recuperando tu control','Preparando la cámara con tu calibración guardada.',0);
    const nose = this.saved(), ridge = GAZE.loadSaved();
    if(last==='gaze' || !nose) await loadWebGaze();
    const gaze = ridge || !!gazeWeb?.load();
    if ((guidedSetup || method === 'gaze') && (last === 'gaze' ? !gaze : !nose)) {
      return last === 'gaze' ? this.runGaze(withMyoWare) : this.run();
    }
    const useGaze = gaze && (last === 'gaze' || !nose);
    if (!useGaze && !nose) return;
    NOSE.mode = useGaze ? 'gaze' : 'nose';
    await NOSE.start();
    if (!NOSE.on) {
      this.ui('No se pudo abrir la cámara','Revisa el permiso del navegador o elige otro control.',0,false);
      this.showBtns();
      if (guidedSetup) parent.postMessage({type:'toki-control-error', message:'No pudimos abrir la cámara con tu calibración guardada. Revisa el permiso o elige otro control.'},location.origin);
      else if (withMyoWare) this.ui('No pudimos abrir la cámara','Revisa el permiso de la webcam y vuelve a intentarlo.',0,false);
      return;
    }
    if (useGaze) {
      if(!await this.resumeWebGaze() && !ridge) return this.runGaze(withMyoWare);
      this.finishGaze(withMyoWare);
    } else {
      NOSE.cal = nose; NOSE.neutral = {...nose.n};
      this.close();
    }
    island(useGaze ? '👁' : '🎯','Calibración guardada');
  },
  finishGaze(withMyoWare){
    window.IPHONE?.deactivate();
    try { localStorage.setItem('woki.ptr','gaze'); } catch {}
    W.resumeMyoWareForGaze?.(withMyoWare);
    this.close();
  },
  close(){ if(trackerOnly) parent.postMessage({type:'toki-control-ready',mode:NOSE.label()},location.origin); $('#calib').classList.remove('on'); $('#calDot').classList.remove('on'); W.resumeMyoWareHandoff?.(); renderStatus(); },
  open(kind){ $('#calib').classList.add('on');
    if(kind==='gaze'){ this.steps(['Puntos','Validación','Listo']); this.ui('Calibrar la mirada',`Vas a seguir ${gazeCalibrationPoints.length} puntos con los ojos y después comprobar ${gazeValidationPoints.length} más. Toma unos 45 segundos.`,0,false); }
    else { this.steps([]); this.ui('Elige tu control','',-1,false); }
    this.showBtns();
    $('#calib').focus({preventScroll:true}); }
};
window.CAL=CAL;
$('#calBtns').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; b.blur();
  if(b.dataset.c==='start') CAL.run(); if(b.dataset.c==='gaze') CAL.runGaze(); if(b.dataset.c==='saved') CAL.useSaved(); if(b.dataset.c==='iphone' && window.IPHONE) IPHONE.openPanel(); if(b.dataset.c==='mouse'){ if(NOSE.on || NOSE.starting) NOSE.stop(); CAL.close(); island('🖱️','Modo demo: el mouse es la mirada'); } });
addEventListener('keydown',e=>{
  if(!$('#calib').classList.contains('on') || CAL.running || guidedSetup || window.IPHONE?.calibrating) return;
  if(e.key==='Escape'){
    if($('#calIphone:not([hidden])')) IPHONE.closePanel();
    else CAL.close();
    return;
  }
  if(!$('#calCard').classList.contains('choose-control') || e.target.closest?.('input, #legend, #devbar')) return;
  if(e.key==='Enter' && !e.target.closest?.('button')){ e.preventDefault(); CAL.run(); }
  if(e.key.toLowerCase()==='e'){ e.preventDefault(); CAL.runGaze(); }
  if(e.key.toLowerCase()==='i' && window.IPHONE){ e.preventDefault(); IPHONE.openPanel(); }
});
addEventListener('keydown',e=>{ if(isCareWheelOpen() || (document.activeElement && document.activeElement.tagName==='INPUT')) return; if($('#calib').classList.contains('on')) return;
  if(e.key==='v'||e.key==='V'){ if(NOSE.mode==='gaze' && NOSE.on) CAL.recenterGaze(); }
  if(e.key==='e'||e.key==='E'){ NOSE.setMode('gaze'); } });
CAL.showBtns();
if(document.body.classList.contains('official-os') && $('#calib').classList.contains('on')) $('#calib').focus({preventScroll:true});

$('#noseBtn').addEventListener('click',e=>{ e.currentTarget.blur(); NOSE.toggle(); });  // blur: que Espacio (= ceja) no vuelva a apretar el botón
addEventListener('pagehide',()=>{ if(NOSE.on || NOSE.starting) NOSE.stop(); });
if (guidedSetup) {
  if (new URLSearchParams(location.search).has('reanudar')) CAL.useSaved(requestedMethod);
  else if (requestedMethod === 'gaze') CAL.runGaze();
  else CAL.run();
}
