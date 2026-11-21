(()=>{var jn={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Jn={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},gc=0,Fo=1,_c=2;var Ds=1,yc=2,Vi=3,ti=0,Le=1,_n=2,di=0,Qi=1,zo=2,Go=3,Yo=4,xc=5;var pi=100,vc=101,Mc=102,Sc=103,bc=104,Tc=200,Cc=201,wc=202,Ec=203,Ho=204,ko=205,Rc=206,Ic=207,Pc=208,Nc=209,Lc=210,Dc=211,Uc=212,Oc=213,Fc=214,xr=0,vr=1,Mr=2,Pi=3,Sr=4,br=5,Tr=6,Cr=7,Vo=0,zc=1,Gc=2,yn=0,Qo=1,Wo=2,Xo=3,qo=4,$o=5,Zo=6,Ko=7;var jo=300,Bi=301,Wi=302,ia=303,sa=304,wr=1e3,mn=1001,Er=1002,ye=1003,Yc=1004;var Us=1005;var Pe=1006,ra=1007;var Dn=1008;var Oe=1009,Jo=1010,tl=1011,Xi=1012,aa=1013,fn=1014,hn=1015,un=1016,oa=1017,la=1018,mi=1020,el=35902,nl=35899,il=1021,sl=1022,dn=1023,Pn=1026,Un=1027,rl=1028,ca=1029,ei=1030,fa=1031;var ha=1033,Os=33776,Fs=33777,zs=33778,Gs=33779,ua=35840,da=35841,pa=35842,Ba=35843,ma=36196,Aa=37492,ga=37496,_a=37488,ya=37489,Ys=37490,xa=37491,va=37808,Ma=37809,Sa=37810,ba=37811,Ta=37812,Ca=37813,wa=37814,Ea=37815,Ra=37816,Ia=37817,Pa=37818,Na=37819,La=37820,Da=37821,Ua=36492,Oa=36494,Fa=36495,za=36283,Ga=36284,Hs=36285,Ya=36286;var fs=2300,Rr=2301,_r=2302,Eo=2303,Ro=2400,Io=2401,Po=2402;var Hc=3200;var Ha=0,kc=1,On="",Me="srgb",hs="srgb-linear",us="linear",qt="srgb";var yr=7680;var Vc=519,Qc=512,Wc=513,Xc=514,al=515,qc=516,$c=517,ol=518,ll=519,Zc=35044;var cl="300 es",Je=2e3,Ni=2001;function eh(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function nh(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function ds(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Kc(){let i=ds("canvas");return i.style.display="block",i}var Vl={},Li=null;function fl(...i){let t="THREE."+i.shift();Li?Li("log",t,...i):console.log(t,...i)}function jc(i){let t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Tt(...i){i=jc(i);let t="THREE."+i.shift();if(Li)Li("warn",t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function Rt(...i){i=jc(i);let t="THREE."+i.shift();if(Li)Li("error",t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function rs(...i){let t=i.join(" ");t in Vl||(Vl[t]=!0,Tt(...i))}function Jc(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var tf={[xr]:xr,[Mr]:Tr,[Sr]:Sr,[Pi]:br,[vr]:vr,[Tr]:Mr,[Cr]:Cr,[br]:Pi},cn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},Te=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Ql=1234567,as=Math.PI/180,Di=180/Math.PI;function qi(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Te[i&255]+Te[i>>8&255]+Te[i>>16&255]+Te[i>>24&255]+"-"+Te[t&255]+Te[t>>8&255]+"-"+Te[t>>16&15|64]+Te[t>>24&255]+"-"+Te[e&63|128]+Te[e>>8&255]+"-"+Te[e>>16&255]+Te[e>>24&255]+Te[n&255]+Te[n>>8&255]+Te[n>>16&255]+Te[n>>24&255]).toLowerCase()}function Ft(i,t,e){return Math.max(t,Math.min(e,i))}function hl(i,t){return(i%t+t)%t}function ih(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function sh(i,t,e){return i!==t?(e-i)/(t-i):0}function os(i,t,e){return(1-e)*i+e*t}function rh(i,t,e,n){return os(i,t,1-Math.exp(-e*n))}function ah(i,t=1){return t-Math.abs(hl(i,t*2)-t)}function oh(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function lh(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function ch(i,t){return i+Math.floor(Math.random()*(t-i+1))}function fh(i,t){return i+Math.random()*(t-i)}function hh(i){return i*(.5-Math.random())}function uh(i){i!==void 0&&(Ql=i);let t=Ql+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function dh(i){return i*as}function ph(i){return i*Di}function Bh(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function mh(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function ul(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Ah(i,t,e,n,s){let r=Math.cos,a=Math.sin,o=r(e/2),c=a(e/2),l=r((t+n)/2),f=a((t+n)/2),d=r((t-n)/2),h=a((t-n)/2),u=r((n-t)/2),A=a((n-t)/2);switch(s){case"XYX":i.set(o*f,c*d,c*h,o*l);break;case"YZY":i.set(c*h,o*f,c*d,o*l);break;case"ZXZ":i.set(c*d,c*h,o*f,o*l);break;case"XZX":i.set(o*f,c*A,c*u,o*l);break;case"YXY":i.set(c*u,o*f,c*A,o*l);break;case"ZYZ":i.set(c*A,c*u,o*f,o*l);break;default:Tt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function dl(i){switch(i.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function ef(i,t){if(t.constructor===Float32Array)return i;let e=dl(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(i/e,-1)}function nf(i,t){if(t.constructor===Float32Array)return i;let e=dl(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(i*e)}var pl={DEG2RAD:as,RAD2DEG:Di,generateUUID:qi,clamp:Ft,euclideanModulo:hl,mapLinear:ih,inverseLerp:sh,lerp:os,damp:rh,pingpong:ah,smoothstep:oh,smootherstep:lh,randInt:ch,randFloat:fh,randFloatSpread:hh,seededRandom:uh,degToRad:dh,radToDeg:ph,isPowerOfTwo:Bh,ceilPowerOfTwo:mh,floorPowerOfTwo:ul,setQuaternionFromProperEuler:Ah,normalize:nf,denormalize:ef},At=class{static{this.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Ft(this.x,t.x,e.x),this.y=Ft(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Ft(this.x,t,e),this.y=Ft(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ft(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Ft(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},He=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let c=n[s+0],l=n[s+1],f=n[s+2],d=n[s+3],h=r[a+0],u=r[a+1],A=r[a+2],y=r[a+3];if(d!==y||c!==h||l!==u||f!==A){let B=c*h+l*u+f*A+d*y;B<0&&(h=-h,u=-u,A=-A,y=-y,B=-B);let p=1-o;if(B<.9995){let v=Math.acos(B),T=Math.sin(v);p=Math.sin(p*v)/T,o=Math.sin(o*v)/T,c=c*p+h*o,l=l*p+u*o,f=f*p+A*o,d=d*p+y*o}else{c=c*p+h*o,l=l*p+u*o,f=f*p+A*o,d=d*p+y*o;let v=1/Math.sqrt(c*c+l*l+f*f+d*d);c*=v,l*=v,f*=v,d*=v}}t[e]=c,t[e+1]=l,t[e+2]=f,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],c=n[s+1],l=n[s+2],f=n[s+3],d=r[a],h=r[a+1],u=r[a+2],A=r[a+3];return t[e]=o*A+f*d+c*u-l*h,t[e+1]=c*A+f*h+l*d-o*u,t[e+2]=l*A+f*u+o*h-c*d,t[e+3]=f*A-o*d-c*h-l*u,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,c=Math.sin,l=o(n/2),f=o(s/2),d=o(r/2),h=c(n/2),u=c(s/2),A=c(r/2);switch(a){case"XYZ":this._x=h*f*d+l*u*A,this._y=l*u*d-h*f*A,this._z=l*f*A+h*u*d,this._w=l*f*d-h*u*A;break;case"YXZ":this._x=h*f*d+l*u*A,this._y=l*u*d-h*f*A,this._z=l*f*A-h*u*d,this._w=l*f*d+h*u*A;break;case"ZXY":this._x=h*f*d-l*u*A,this._y=l*u*d+h*f*A,this._z=l*f*A+h*u*d,this._w=l*f*d-h*u*A;break;case"ZYX":this._x=h*f*d-l*u*A,this._y=l*u*d+h*f*A,this._z=l*f*A-h*u*d,this._w=l*f*d+h*u*A;break;case"YZX":this._x=h*f*d+l*u*A,this._y=l*u*d+h*f*A,this._z=l*f*A-h*u*d,this._w=l*f*d-h*u*A;break;case"XZY":this._x=h*f*d-l*u*A,this._y=l*u*d-h*f*A,this._z=l*f*A+h*u*d,this._w=l*f*d+h*u*A;break;default:Tt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],c=e[9],l=e[2],f=e[6],d=e[10],h=n+o+d;if(h>0){let u=.5/Math.sqrt(h+1);this._w=.25/u,this._x=(f-c)*u,this._y=(r-l)*u,this._z=(a-s)*u}else if(n>o&&n>d){let u=2*Math.sqrt(1+n-o-d);this._w=(f-c)/u,this._x=.25*u,this._y=(s+a)/u,this._z=(r+l)/u}else if(o>d){let u=2*Math.sqrt(1+o-n-d);this._w=(r-l)/u,this._x=(s+a)/u,this._y=.25*u,this._z=(c+f)/u}else{let u=2*Math.sqrt(1+d-n-o);this._w=(a-s)/u,this._x=(r+l)/u,this._y=(c+f)/u,this._z=.25*u}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ft(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,c=e._y,l=e._z,f=e._w;return this._x=n*f+a*o+s*l-r*c,this._y=s*f+a*c+r*o-n*l,this._z=r*f+a*l+n*c-s*o,this._w=a*f-n*o-s*c-r*l,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let c=1-e;if(o<.9995){let l=Math.acos(o),f=Math.sin(l);c=Math.sin(c*l)/f,e=Math.sin(e*l)/f,this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+a*e,this._onChangeCallback()}else this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},P=class{static{this.prototype.isVector3=!0}constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Wl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Wl.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,c=t.w,l=2*(a*s-o*n),f=2*(o*e-r*s),d=2*(r*n-a*e);return this.x=e+c*l+a*d-o*f,this.y=n+c*f+o*l-r*d,this.z=s+c*d+r*f-a*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Ft(this.x,t.x,e.x),this.y=Ft(this.y,t.y,e.y),this.z=Ft(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Ft(this.x,t,e),this.y=Ft(this.y,t,e),this.z=Ft(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ft(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,c=e.z;return this.x=s*c-r*o,this.y=r*a-n*c,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return ro.copy(this).projectOnVector(t),this.sub(ro)}reflect(t){return this.sub(ro.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Ft(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ro=new P,Wl=new He,It=class{static{this.prototype.isMatrix3=!0}constructor(t,e,n,s,r,a,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,c,l)}set(t,e,n,s,r,a,o,c,l){let f=this.elements;return f[0]=t,f[1]=s,f[2]=o,f[3]=e,f[4]=r,f[5]=c,f[6]=n,f[7]=a,f[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],f=n[4],d=n[7],h=n[2],u=n[5],A=n[8],y=s[0],B=s[3],p=s[6],v=s[1],T=s[4],M=s[7],C=s[2],b=s[5],m=s[8];return r[0]=a*y+o*v+c*C,r[3]=a*B+o*T+c*b,r[6]=a*p+o*M+c*m,r[1]=l*y+f*v+d*C,r[4]=l*B+f*T+d*b,r[7]=l*p+f*M+d*m,r[2]=h*y+u*v+A*C,r[5]=h*B+u*T+A*b,r[8]=h*p+u*M+A*m,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],f=t[8];return e*a*f-e*o*l-n*r*f+n*o*c+s*r*l-s*a*c}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],f=t[8],d=f*a-o*l,h=o*c-f*r,u=l*r-a*c,A=e*d+n*h+s*u;if(A===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/A;return t[0]=d*y,t[1]=(s*l-f*n)*y,t[2]=(o*n-s*a)*y,t[3]=h*y,t[4]=(f*e-s*c)*y,t[5]=(s*r-o*e)*y,t[6]=u*y,t[7]=(n*c-l*e)*y,t[8]=(a*e-n*r)*y,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*a+l*o)+a+t,-s*l,s*c,-s*(-l*a+c*o)+o+e,0,0,1),this}scale(t,e){return rs("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(ao.makeScale(t,e)),this}rotate(t){return rs("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(ao.makeRotation(-t)),this}translate(t,e){return rs("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(ao.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},ao=new It,Xl=new It().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ql=new It().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function gh(){let i={enabled:!0,workingColorSpace:hs,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===qt&&(s.r=In(s.r),s.g=In(s.g),s.b=In(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===qt&&(s.r=Ii(s.r),s.g=Ii(s.g),s.b=Ii(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===On?us:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[hs]:{primaries:t,whitePoint:n,transfer:us,toXYZ:Xl,fromXYZ:ql,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Me},outputColorSpaceConfig:{drawingBufferColorSpace:Me}},[Me]:{primaries:t,whitePoint:n,transfer:qt,toXYZ:Xl,fromXYZ:ql,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Me}}}),i}var Vt=gh();function In(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ii(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var gi,Ir=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{gi===void 0&&(gi=ds("canvas")),gi.width=t.width,gi.height=t.height;let s=gi.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=gi}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=ds("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=In(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(In(e[n]/255)*255):e[n]=In(e[n]);return{data:e,width:t.width,height:t.height}}else return Tt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},_h=0,Ui=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:_h++}),this.uuid=qi(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width||0,e.height||0,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(oo(s[a].image)):r.push(oo(s[a]))}else r=oo(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function oo(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Ir.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Tt("Texture: Unable to serialize Texture."),{})}var yh=0,lo=new P,Ne=class i extends cn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=mn,s=mn,r=Pe,a=Dn,o=dn,c=Oe,l=i.DEFAULT_ANISOTROPY,f=On){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:yh++}),this.uuid=qi(),this.name="",this.source=new Ui(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new At(0,0),this.repeat=new At(1,1),this.center=new At(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new It,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=f,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(lo).x}get height(){return this.source.getSize(lo).y}get depth(){return this.source.getSize(lo).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.mipmapsAutoUpdate=t.mipmapsAutoUpdate,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isPMREMTexture=t.isPMREMTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Tt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Tt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==jo)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case wr:t.x=t.x-Math.floor(t.x);break;case mn:t.x=t.x<0?0:1;break;case Er:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case wr:t.y=t.y-Math.floor(t.y);break;case mn:t.y=t.y<0?0:1;break;case Er:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ne.DEFAULT_IMAGE=null;Ne.DEFAULT_MAPPING=jo;Ne.DEFAULT_ANISOTROPY=1;var se=class{static{this.prototype.isVector4=!0}constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,c=t.elements,l=c[0],f=c[4],d=c[8],h=c[1],u=c[5],A=c[9],y=c[2],B=c[6],p=c[10];if(Math.abs(f-h)<.01&&Math.abs(d-y)<.01&&Math.abs(A-B)<.01){if(Math.abs(f+h)<.1&&Math.abs(d+y)<.1&&Math.abs(A+B)<.1&&Math.abs(l+u+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let T=(l+1)/2,M=(u+1)/2,C=(p+1)/2,b=(f+h)/4,m=(d+y)/4,x=(A+B)/4;return T>M&&T>C?T<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(T),s=b/n,r=m/n):M>C?M<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(M),n=b/s,r=x/s):C<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(C),n=m/r,s=x/r),this.set(n,s,r,e),this}let v=Math.sqrt((B-A)*(B-A)+(d-y)*(d-y)+(h-f)*(h-f));return Math.abs(v)<.001&&(v=1),this.x=(B-A)/v,this.y=(d-y)/v,this.z=(h-f)/v,this.w=Math.acos((l+u+p-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Ft(this.x,t.x,e.x),this.y=Ft(this.y,t.y,e.y),this.z=Ft(this.z,t.z,e.z),this.w=Ft(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Ft(this.x,t,e),this.y=Ft(this.y,t,e),this.z=Ft(this.z,t,e),this.w=Ft(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ft(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Pr=class extends cn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Pe,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new se(0,0,t,e),this.scissorTest=!1,this.viewport=new se(0,0,t,e),this.textures=[];let s=n.count;for(let r=0;r<s;r++)this.textures[r]=new Ne({width:t,height:e,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:Pe,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.mipmapsAutoUpdate!==void 0&&(e.mipmapsAutoUpdate=t.mipmapsAutoUpdate),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new Ui(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;else this.depthTexture=null;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},ke=class extends Pr{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},ps=class extends Ne{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ye,this.minFilter=ye,this.wrapR=mn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Nr=class extends Ne{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ye,this.minFilter=ye,this.wrapR=mn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var ee=class i{static{this.prototype.isMatrix4=!0}constructor(t,e,n,s,r,a,o,c,l,f,d,h,u,A,y,B){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,c,l,f,d,h,u,A,y,B)}set(t,e,n,s,r,a,o,c,l,f,d,h,u,A,y,B){let p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=a,p[9]=o,p[13]=c,p[2]=l,p[6]=f,p[10]=d,p[14]=h,p[3]=u,p[7]=A,p[11]=y,p[15]=B,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,s=1/_i.setFromMatrixColumn(t,0).length(),r=1/_i.setFromMatrixColumn(t,1).length(),a=1/_i.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(s),l=Math.sin(s),f=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){let h=a*f,u=a*d,A=o*f,y=o*d;e[0]=c*f,e[4]=-c*d,e[8]=l,e[1]=u+A*l,e[5]=h-y*l,e[9]=-o*c,e[2]=y-h*l,e[6]=A+u*l,e[10]=a*c}else if(t.order==="YXZ"){let h=c*f,u=c*d,A=l*f,y=l*d;e[0]=h+y*o,e[4]=A*o-u,e[8]=a*l,e[1]=a*d,e[5]=a*f,e[9]=-o,e[2]=u*o-A,e[6]=y+h*o,e[10]=a*c}else if(t.order==="ZXY"){let h=c*f,u=c*d,A=l*f,y=l*d;e[0]=h-y*o,e[4]=-a*d,e[8]=A+u*o,e[1]=u+A*o,e[5]=a*f,e[9]=y-h*o,e[2]=-a*l,e[6]=o,e[10]=a*c}else if(t.order==="ZYX"){let h=a*f,u=a*d,A=o*f,y=o*d;e[0]=c*f,e[4]=A*l-u,e[8]=h*l+y,e[1]=c*d,e[5]=y*l+h,e[9]=u*l-A,e[2]=-l,e[6]=o*c,e[10]=a*c}else if(t.order==="YZX"){let h=a*c,u=a*l,A=o*c,y=o*l;e[0]=c*f,e[4]=y-h*d,e[8]=A*d+u,e[1]=d,e[5]=a*f,e[9]=-o*f,e[2]=-l*f,e[6]=u*d+A,e[10]=h-y*d}else if(t.order==="XZY"){let h=a*c,u=a*l,A=o*c,y=o*l;e[0]=c*f,e[4]=-d,e[8]=l*f,e[1]=h*d+y,e[5]=a*f,e[9]=u*d-A,e[2]=A*d-u,e[6]=o*f,e[10]=y*d+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(xh,t,vh)}lookAt(t,e,n){let s=this.elements;return ze.subVectors(t,e),ze.lengthSq()===0&&(ze.z=1),ze.normalize(),Gn.crossVectors(n,ze),Gn.lengthSq()===0&&(Math.abs(n.z)===1?ze.x+=1e-4:ze.z+=1e-4,ze.normalize(),Gn.crossVectors(n,ze)),Gn.normalize(),Js.crossVectors(ze,Gn),s[0]=Gn.x,s[4]=Js.x,s[8]=ze.x,s[1]=Gn.y,s[5]=Js.y,s[9]=ze.y,s[2]=Gn.z,s[6]=Js.z,s[10]=ze.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],f=n[1],d=n[5],h=n[9],u=n[13],A=n[2],y=n[6],B=n[10],p=n[14],v=n[3],T=n[7],M=n[11],C=n[15],b=s[0],m=s[4],x=s[8],D=s[12],R=s[1],N=s[5],U=s[9],V=s[13],E=s[2],H=s[6],k=s[10],Y=s[14],J=s[3],W=s[7],j=s[11],tt=s[15];return r[0]=a*b+o*R+c*E+l*J,r[4]=a*m+o*N+c*H+l*W,r[8]=a*x+o*U+c*k+l*j,r[12]=a*D+o*V+c*Y+l*tt,r[1]=f*b+d*R+h*E+u*J,r[5]=f*m+d*N+h*H+u*W,r[9]=f*x+d*U+h*k+u*j,r[13]=f*D+d*V+h*Y+u*tt,r[2]=A*b+y*R+B*E+p*J,r[6]=A*m+y*N+B*H+p*W,r[10]=A*x+y*U+B*k+p*j,r[14]=A*D+y*V+B*Y+p*tt,r[3]=v*b+T*R+M*E+C*J,r[7]=v*m+T*N+M*H+C*W,r[11]=v*x+T*U+M*k+C*j,r[15]=v*D+T*V+M*Y+C*tt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],c=t[9],l=t[13],f=t[2],d=t[6],h=t[10],u=t[14],A=t[3],y=t[7],B=t[11],p=t[15],v=c*u-l*h,T=o*u-l*d,M=o*h-c*d,C=a*u-l*f,b=a*h-c*f,m=a*d-o*f;return e*(y*v-B*T+p*M)-n*(A*v-B*C+p*b)+s*(A*T-y*C+p*m)-r*(A*M-y*b+B*m)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],a=t[5],o=t[9],c=t[2],l=t[6],f=t[10];return e*(a*f-o*l)-n*(r*f-o*c)+s*(r*l-a*c)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],f=t[8],d=t[9],h=t[10],u=t[11],A=t[12],y=t[13],B=t[14],p=t[15],v=e*o-n*a,T=e*c-s*a,M=e*l-r*a,C=n*c-s*o,b=n*l-r*o,m=s*l-r*c,x=f*y-d*A,D=f*B-h*A,R=f*p-u*A,N=d*B-h*y,U=d*p-u*y,V=h*p-u*B,E=v*V-T*U+M*N+C*R-b*D+m*x;if(E===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let H=1/E;return t[0]=(o*V-c*U+l*N)*H,t[1]=(s*U-n*V-r*N)*H,t[2]=(y*m-B*b+p*C)*H,t[3]=(h*b-d*m-u*C)*H,t[4]=(c*R-a*V-l*D)*H,t[5]=(e*V-s*R+r*D)*H,t[6]=(B*M-A*m-p*T)*H,t[7]=(f*m-h*M+u*T)*H,t[8]=(a*U-o*R+l*x)*H,t[9]=(n*R-e*U-r*x)*H,t[10]=(A*b-y*M+p*v)*H,t[11]=(d*M-f*b-u*v)*H,t[12]=(o*D-a*N-c*x)*H,t[13]=(e*N-n*D+s*x)*H,t[14]=(y*T-A*C-B*v)*H,t[15]=(f*C-d*T+h*v)*H,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,c=t.z,l=r*a,f=r*o;return this.set(l*a+n,l*o-s*c,l*c+s*o,0,l*o+s*c,f*o+n,f*c-s*a,0,l*c-s*o,f*c+s*a,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,c=e._w,l=r+r,f=a+a,d=o+o,h=r*l,u=r*f,A=r*d,y=a*f,B=a*d,p=o*d,v=c*l,T=c*f,M=c*d,C=n.x,b=n.y,m=n.z;return s[0]=(1-(y+p))*C,s[1]=(u+M)*C,s[2]=(A-T)*C,s[3]=0,s[4]=(u-M)*b,s[5]=(1-(h+p))*b,s[6]=(B+v)*b,s[7]=0,s[8]=(A+T)*m,s[9]=(B-v)*m,s[10]=(1-(h+y))*m,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=_i.set(s[0],s[1],s[2]).length(),o=_i.set(s[4],s[5],s[6]).length(),c=_i.set(s[8],s[9],s[10]).length();r<0&&(a=-a),an.copy(this);let l=1/a,f=1/o,d=1/c;return an.elements[0]*=l,an.elements[1]*=l,an.elements[2]*=l,an.elements[4]*=f,an.elements[5]*=f,an.elements[6]*=f,an.elements[8]*=d,an.elements[9]*=d,an.elements[10]*=d,e.setFromRotationMatrix(an),n.x=a,n.y=o,n.z=c,this}makePerspective(t,e,n,s,r,a,o=Je,c=!1){let l=this.elements,f=2*r/(e-t),d=2*r/(n-s),h=(e+t)/(e-t),u=(n+s)/(n-s),A,y;if(c)A=r/(a-r),y=a*r/(a-r);else if(o===Je)A=-(a+r)/(a-r),y=-2*a*r/(a-r);else if(o===Ni)A=-a/(a-r),y=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=f,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=d,l[9]=u,l[13]=0,l[2]=0,l[6]=0,l[10]=A,l[14]=y,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=Je,c=!1){let l=this.elements,f=2/(e-t),d=2/(n-s),h=-(e+t)/(e-t),u=-(n+s)/(n-s),A,y;if(c)A=1/(a-r),y=a/(a-r);else if(o===Je)A=-2/(a-r),y=-(a+r)/(a-r);else if(o===Ni)A=-1/(a-r),y=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=f,l[4]=0,l[8]=0,l[12]=h,l[1]=0,l[5]=d,l[9]=0,l[13]=u,l[2]=0,l[6]=0,l[10]=A,l[14]=y,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},_i=new P,an=new ee,xh=new P(0,0,0),vh=new P(1,1,1),Gn=new P,Js=new P,ze=new P,$l=new ee,Zl=new He,Nn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],c=s[1],l=s[5],f=s[9],d=s[2],h=s[6],u=s[10];switch(e){case"XYZ":this._y=Math.asin(Ft(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-f,u),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(h,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Ft(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(o,u),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ft(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-d,u),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Ft(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(h,u),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(Ft(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-f,l),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,u));break;case"XZY":this._z=Math.asin(-Ft(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-f,u),this._y=0);break;default:Tt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return $l.makeRotationFromQuaternion(t),this.setFromRotationMatrix($l,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Zl.setFromEuler(this),this.setFromQuaternion(Zl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Nn.DEFAULT_ORDER="XYZ";var Bs=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Mh=0,Kl=new P,yi=new He,Sn=new ee,tr=new P,es=new P,Sh=new P,bh=new He,jl=new P(1,0,0),Jl=new P(0,1,0),tc=new P(0,0,1),ec={type:"added"},Th={type:"removed"},xi={type:"childadded",child:null},co={type:"childremoved",child:null},we=class i extends cn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Mh++}),this.uuid=qi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new P,e=new Nn,n=new He,s=new P(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ee},normalMatrix:{value:new It}}),this.matrix=new ee,this.matrixWorld=new ee,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Bs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return yi.setFromAxisAngle(t,e),this.quaternion.multiply(yi),this}rotateOnWorldAxis(t,e){return yi.setFromAxisAngle(t,e),this.quaternion.premultiply(yi),this}rotateX(t){return this.rotateOnAxis(jl,t)}rotateY(t){return this.rotateOnAxis(Jl,t)}rotateZ(t){return this.rotateOnAxis(tc,t)}translateOnAxis(t,e){return Kl.copy(t).applyQuaternion(this.quaternion),this.position.add(Kl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(jl,t)}translateY(t){return this.translateOnAxis(Jl,t)}translateZ(t){return this.translateOnAxis(tc,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Sn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?tr.copy(t):tr.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),es.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Sn.lookAt(es,tr,this.up):Sn.lookAt(tr,es,this.up),this.quaternion.setFromRotationMatrix(Sn),s&&(Sn.extractRotation(s.matrixWorld),yi.setFromRotationMatrix(Sn),this.quaternion.premultiply(yi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Rt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(ec),xi.child=t,this.dispatchEvent(xi),xi.child=null):Rt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Th),co.child=t,this.dispatchEvent(co),co.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Sn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Sn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Sn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(ec),xi.child=t,this.dispatchEvent(xi),xi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(es,t,Sh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(es,bh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let c=o.shapes;if(Array.isArray(c))for(let l=0,f=c.length;l<f;l++){let d=c[l];r(t.shapes,d)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(t.materials,this.material[c]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let c=this.animations[o];s.animations.push(r(t.animations,c))}}if(e){let o=a(t.geometries),c=a(t.materials),l=a(t.textures),f=a(t.images),d=a(t.shapes),h=a(t.skeletons),u=a(t.animations),A=a(t.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),f.length>0&&(n.images=f),d.length>0&&(n.shapes=d),h.length>0&&(n.skeletons=h),u.length>0&&(n.animations=u),A.length>0&&(n.nodes=A)}return n.object=s,n;function a(o){let c=[];for(let l in o){let f=o[l];delete f.metadata,c.push(f)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};we.DEFAULT_UP=new P(0,1,0);we.DEFAULT_MATRIX_AUTO_UPDATE=!0;we.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Rn=class extends we{constructor(){super(),this.isGroup=!0,this.type="Group"}},Ch={type:"move"},Oi=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Rn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Rn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Rn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){a=!0;for(let y of t.hand.values()){let B=e.getJointPose(y,n),p=this._getHandJoint(l,y);B!==null&&(p.matrix.fromArray(B.transform.matrix),p.matrix.decompose(p.position,p.quaternion,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=B.radius),p.visible=B!==null}let f=l.joints["index-finger-tip"],d=l.joints["thumb-tip"],h=f.position.distanceTo(d.position),u=.02,A=.005;l.inputState.pinching&&h>u+A?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&h<=u-A&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.quaternion,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Ch)))}return o!==null&&(o.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new Rn;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},sf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Yn={h:0,s:0,l:0},er={h:0,s:0,l:0};function fo(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var Gt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Me){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Vt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=Vt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Vt.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=Vt.workingColorSpace){if(t=hl(t,1),e=Ft(e,0,1),n=Ft(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=fo(a,r,t+1/3),this.g=fo(a,r,t),this.b=fo(a,r,t-1/3)}return Vt.colorSpaceToWorking(this,s),this}setStyle(t,e=Me){function n(r){r!==void 0&&parseFloat(r)<1&&Tt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,e);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Tt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Tt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Me){let n=sf[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Tt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=In(t.r),this.g=In(t.g),this.b=In(t.b),this}copyLinearToSRGB(t){return this.r=Ii(t.r),this.g=Ii(t.g),this.b=Ii(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Me){return Vt.workingToColorSpace(Ce.copy(this),t),Math.round(Ft(Ce.r*255,0,255))*65536+Math.round(Ft(Ce.g*255,0,255))*256+Math.round(Ft(Ce.b*255,0,255))}getHexString(t=Me){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Vt.workingColorSpace){Vt.workingToColorSpace(Ce.copy(this),e);let n=Ce.r,s=Ce.g,r=Ce.b,a=Math.max(n,s,r),o=Math.min(n,s,r),c,l,f=(o+a)/2;if(o===a)c=0,l=0;else{let d=a-o;switch(l=f<=.5?d/(a+o):d/(2-a-o),a){case n:c=(s-r)/d+(s<r?6:0);break;case s:c=(r-n)/d+2;break;case r:c=(n-s)/d+4;break}c/=6}return t.h=c,t.s=l,t.l=f,t}getRGB(t,e=Vt.workingColorSpace){return Vt.workingToColorSpace(Ce.copy(this),e),t.r=Ce.r,t.g=Ce.g,t.b=Ce.b,t}getStyle(t=Me){Vt.workingToColorSpace(Ce.copy(this),t);let e=Ce.r,n=Ce.g,s=Ce.b;return t!==Me?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Yn),this.setHSL(Yn.h+t,Yn.s+e,Yn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Yn),t.getHSL(er);let n=os(Yn.h,er.h,e),s=os(Yn.s,er.s,e),r=os(Yn.l,er.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ce=new Gt;Gt.NAMES=sf;var ms=class extends we{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Nn,this.environmentIntensity=1,this.environmentRotation=new Nn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),this.background=t.background!==null?t.background.clone():null,this.environment=t.environment!==null?t.environment.clone():null,this.fog=t.fog!==null?t.fog.clone():null,this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),this.overrideMaterial=t.overrideMaterial!==null?t.overrideMaterial.clone():null,this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}},on=new P,bn=new P,ho=new P,Tn=new P,vi=new P,Mi=new P,nc=new P,uo=new P,po=new P,Bo=new P,mo=new se,Ao=new se,go=new se,Qn=class i{constructor(t=new P,e=new P,n=new P){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),on.subVectors(t,e),s.cross(on);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){on.subVectors(s,e),bn.subVectors(n,e),ho.subVectors(t,e);let a=on.dot(on),o=on.dot(bn),c=on.dot(ho),l=bn.dot(bn),f=bn.dot(ho),d=a*l-o*o;if(d===0)return r.set(0,0,0),null;let h=1/d,u=(l*c-o*f)*h,A=(a*f-o*c)*h;return r.set(1-u-A,A,u)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Tn)===null?!1:Tn.x>=0&&Tn.y>=0&&Tn.x+Tn.y<=1}static getInterpolation(t,e,n,s,r,a,o,c){return this.getBarycoord(t,e,n,s,Tn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,Tn.x),c.addScaledVector(a,Tn.y),c.addScaledVector(o,Tn.z),c)}static getInterpolatedAttribute(t,e,n,s,r,a){return mo.setScalar(0),Ao.setScalar(0),go.setScalar(0),mo.fromBufferAttribute(t,e),Ao.fromBufferAttribute(t,n),go.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(mo,r.x),a.addScaledVector(Ao,r.y),a.addScaledVector(go,r.z),a}static isFrontFacing(t,e,n,s){return on.subVectors(n,e),bn.subVectors(t,e),on.cross(bn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return on.subVectors(this.c,this.b),bn.subVectors(this.a,this.b),on.cross(bn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;vi.subVectors(s,n),Mi.subVectors(r,n),uo.subVectors(t,n);let c=vi.dot(uo),l=Mi.dot(uo);if(c<=0&&l<=0)return e.copy(n);po.subVectors(t,s);let f=vi.dot(po),d=Mi.dot(po);if(f>=0&&d<=f)return e.copy(s);let h=c*d-f*l;if(h<=0&&c>=0&&f<=0&&c-f>0)return a=c/(c-f),e.copy(n).addScaledVector(vi,a);Bo.subVectors(t,r);let u=vi.dot(Bo),A=Mi.dot(Bo);if(A>=0&&u<=A)return e.copy(r);let y=u*l-c*A;if(y<=0&&l>=0&&A<=0)return o=l/(l-A),e.copy(n).addScaledVector(Mi,o);let B=f*A-u*d;if(B<=0&&d-f>=0&&u-A>=0)return nc.subVectors(r,s),o=(d-f)/(d-f+(u-A)),e.copy(s).addScaledVector(nc,o);let p=1/(B+y+h);return a=y*p,o=h*p,e.copy(n).addScaledVector(vi,a).addScaledVector(Mi,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Wn=class{constructor(t=new P(1/0,1/0,1/0),e=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(ln.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(ln.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=ln.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0&&t.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,ln):ln.fromBufferAttribute(r,a),ln.applyMatrix4(t.matrixWorld),this.expandByPoint(ln);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),nr.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),nr.copy(n.boundingBox)),nr.applyMatrix4(t.matrixWorld),this.union(nr)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,ln),ln.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(ns),ir.subVectors(this.max,ns),Si.subVectors(t.a,ns),bi.subVectors(t.b,ns),Ti.subVectors(t.c,ns),Hn.subVectors(bi,Si),kn.subVectors(Ti,bi),ai.subVectors(Si,Ti);let e=[0,-Hn.z,Hn.y,0,-kn.z,kn.y,0,-ai.z,ai.y,Hn.z,0,-Hn.x,kn.z,0,-kn.x,ai.z,0,-ai.x,-Hn.y,Hn.x,0,-kn.y,kn.x,0,-ai.y,ai.x,0];return!_o(e,Si,bi,Ti,ir)||(e=[1,0,0,0,1,0,0,0,1],!_o(e,Si,bi,Ti,ir))?!1:(sr.crossVectors(Hn,kn),e=[sr.x,sr.y,sr.z],_o(e,Si,bi,Ti,ir))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,ln).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(ln).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Cn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Cn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Cn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Cn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Cn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Cn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Cn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Cn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Cn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Cn=[new P,new P,new P,new P,new P,new P,new P,new P],ln=new P,nr=new Wn,Si=new P,bi=new P,Ti=new P,Hn=new P,kn=new P,ai=new P,ns=new P,ir=new P,sr=new P,oi=new P;function _o(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){oi.fromArray(i,r);let o=s.x*Math.abs(oi.x)+s.y*Math.abs(oi.y)+s.z*Math.abs(oi.z),c=t.dot(oi),l=e.dot(oi),f=n.dot(oi);if(Math.max(-Math.max(c,l,f),Math.min(c,l,f))>o)return!1}return!0}var fe=new P,rr=new At,wh=0,Ue=class extends cn{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:wh++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Zc,this.updateRanges=[],this.gpuType=hn,this.version=0,this._normalizationScale=t!==void 0?dl(t):void 0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this._normalizationScale=t._normalizationScale,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)rr.fromBufferAttribute(this,e),rr.applyMatrix3(t),this.setXY(e,rr.x,rr.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyMatrix3(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyMatrix4(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyNormalMatrix(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.transformDirection(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=this._denormalize(n)),n}setComponent(t,e,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=this._denormalize(e)),e}setX(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=this._denormalize(e)),e}setY(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=this._denormalize(e)),e}setZ(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=this._denormalize(e)),e}setW(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),s=this._normalize(s)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),s=this._normalize(s),r=this._normalize(r)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(t){let e=this._normalizationScale;return e!==void 0?Math.max(t/e,-1):ef(t,this.array)}_normalize(t){let e=this._normalizationScale;return e!==void 0?Math.round(t*e):nf(t,this.array)}};var As=class extends Ue{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var gs=class extends Ue{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var oe=class extends Ue{constructor(t,e,n){super(new Float32Array(t),e,n)}},Eh=new Wn,is=new P,yo=new P,Fi=class{constructor(t=new P,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Eh.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;is.subVectors(t,this.center);let e=is.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(is,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(yo.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(is.copy(t.center).add(yo)),this.expandByPoint(is.copy(t.center).sub(yo))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},Rh=0,je=new ee,xo=new we,Ci=new P,Ge=new Wn,ss=new Wn,_e=new P,Ve=class i extends cn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Rh++}),this.uuid=qi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(eh(t)?gs:As)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new It().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return je.makeRotationFromQuaternion(t),this.applyMatrix4(je),this}rotateX(t){return je.makeRotationX(t),this.applyMatrix4(je),this}rotateY(t){return je.makeRotationY(t),this.applyMatrix4(je),this}rotateZ(t){return je.makeRotationZ(t),this.applyMatrix4(je),this}translate(t,e,n){return je.makeTranslation(t,e,n),this.applyMatrix4(je),this}scale(t,e,n){return je.makeScale(t,e,n),this.applyMatrix4(je),this}lookAt(t){return xo.lookAt(t),xo.updateMatrix(),this.applyMatrix4(xo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ci).negate(),this.translate(Ci.x,Ci.y,Ci.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new oe(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Tt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Wn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Rt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];Ge.setFromBufferAttribute(r),this.morphTargetsRelative?(_e.addVectors(this.boundingBox.min,Ge.min),this.boundingBox.expandByPoint(_e),_e.addVectors(this.boundingBox.max,Ge.max),this.boundingBox.expandByPoint(_e)):(this.boundingBox.expandByPoint(Ge.min),this.boundingBox.expandByPoint(Ge.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Rt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Fi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Rt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new P,1/0);return}if(t){let n=this.boundingSphere.center;if(Ge.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];ss.setFromBufferAttribute(o),this.morphTargetsRelative?(_e.addVectors(Ge.min,ss.min),Ge.expandByPoint(_e),_e.addVectors(Ge.max,ss.max),Ge.expandByPoint(_e)):(Ge.expandByPoint(ss.min),Ge.expandByPoint(ss.max))}Ge.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)_e.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(_e));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],c=this.morphTargetsRelative;for(let l=0,f=o.count;l<f;l++)_e.fromBufferAttribute(o,l),c&&(Ci.fromBufferAttribute(t,l),_e.add(Ci)),s=Math.max(s,n.distanceToSquared(_e))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Rt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Rt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Ue(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],c=[],l=new Uint8Array(n.count);for(let D=0;D<n.count;D++)o[D]=new P,c[D]=new P;let f=new P,d=new P,h=new P,u=new At,A=new At,y=new At,B=new P,p=new P;function v(D,R,N){l[D]=l[R]=l[N]=1,f.fromBufferAttribute(n,D),d.fromBufferAttribute(n,R),h.fromBufferAttribute(n,N),u.fromBufferAttribute(r,D),A.fromBufferAttribute(r,R),y.fromBufferAttribute(r,N),d.sub(f),h.sub(f),A.sub(u),y.sub(u);let U=1/(A.x*y.y-y.x*A.y);isFinite(U)&&(B.copy(d).multiplyScalar(y.y).addScaledVector(h,-A.y).multiplyScalar(U),p.copy(h).multiplyScalar(A.x).addScaledVector(d,-y.x).multiplyScalar(U),o[D].add(B),o[R].add(B),o[N].add(B),c[D].add(p),c[R].add(p),c[N].add(p))}let T=this.groups;T.length===0&&(T=[{start:0,count:t.count}]);for(let D=0,R=T.length;D<R;++D){let N=T[D],U=N.start,V=N.count;for(let E=U,H=U+V;E<H;E+=3)v(t.getX(E+0),t.getX(E+1),t.getX(E+2))}let M=new P,C=new P,b=new P,m=new P;function x(D){b.fromBufferAttribute(s,D),m.copy(b);let R=o[D];M.copy(R),M.sub(b.multiplyScalar(b.dot(R))).normalize(),C.crossVectors(m,R);let U=C.dot(c[D])<0?-1:1;a.setXYZW(D,M.x,M.y,M.z,U)}for(let D=0,R=n.count;D<R;++D)l[D]&&x(D);this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new Ue(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let h=0,u=n.count;h<u;h++)n.setXYZ(h,0,0,0);let s=new P,r=new P,a=new P,o=new P,c=new P,l=new P,f=new P,d=new P;if(t)for(let h=0,u=t.count;h<u;h+=3){let A=t.getX(h+0),y=t.getX(h+1),B=t.getX(h+2);s.fromBufferAttribute(e,A),r.fromBufferAttribute(e,y),a.fromBufferAttribute(e,B),f.subVectors(a,r),d.subVectors(s,r),f.cross(d),o.fromBufferAttribute(n,A),c.fromBufferAttribute(n,y),l.fromBufferAttribute(n,B),o.add(f),c.add(f),l.add(f),n.setXYZ(A,o.x,o.y,o.z),n.setXYZ(y,c.x,c.y,c.z),n.setXYZ(B,l.x,l.y,l.z)}else for(let h=0,u=e.count;h<u;h+=3)s.fromBufferAttribute(e,h+0),r.fromBufferAttribute(e,h+1),a.fromBufferAttribute(e,h+2),f.subVectors(a,r),d.subVectors(s,r),f.cross(d),n.setXYZ(h+0,f.x,f.y,f.z),n.setXYZ(h+1,f.x,f.y,f.z),n.setXYZ(h+2,f.x,f.y,f.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)_e.fromBufferAttribute(t,e),_e.normalize(),t.setXYZ(e,_e.x,_e.y,_e.z)}toNonIndexed(){function t(o,c){let l=o.array,f=o.itemSize,d=o.normalized,h=new l.constructor(c.length*f),u=0,A=0;for(let y=0,B=c.length;y<B;y++){o.isInterleavedBufferAttribute?u=c[y]*o.data.stride+o.offset:u=c[y]*f;for(let p=0;p<f;p++)h[A++]=l[u++]}return new Ue(h,f,d)}if(this.index===null)return Tt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let c=s[o],l=t(c,n);e.setAttribute(o,l)}let r=this.morphAttributes;for(let o in r){let c=[],l=r[o];for(let f=0,d=l.length;f<d;f++){let h=l[f],u=t(h,n);c.push(u)}e.morphAttributes[o]=c}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,c=a.length;o<c;o++){let l=a[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let c in n){let l=n[c];t.data.attributes[c]=l.toJSON(t.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],f=[];for(let d=0,h=l.length;d<h;d++){let u=l[d];f.push(u.toJSON(t.data))}f.length>0&&(s[c]=f,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let l in s){let f=s[l];this.setAttribute(l,f.clone(e))}let r=t.morphAttributes;for(let l in r){let f=[],d=r[l];for(let h=0,u=d.length;h<u;h++)f.push(d[h].clone(e));this.morphAttributes[l]=f}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let l=0,f=a.length;l<f;l++){let d=a[l];this.addGroup(d.start,d.count,d.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var vo=new P,Ih=new P,Ph=new It,Ye=class{constructor(t=new P(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=vo.subVectors(n,e).cross(Ih.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let s=t.delta(vo),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(s,a)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Ph.getNormalMatrix(t),s=this.coplanarPoint(vo).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},Nh=0,Xn=class extends cn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Nh++}),this.uuid=qi(),this.name="",this.type="Material",this.blending=Qi,this.side=ti,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ho,this.blendDst=ko,this.blendEquation=pi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Gt(0,0,0),this.blendAlpha=0,this.depthFunc=Pi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Vc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=yr,this.stencilZFail=yr,this.stencilZPass=yr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Tt(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Tt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(t).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let c=r[o];delete c.metadata,a.push(c)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Gt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.diffuseRoughness!==void 0&&(this.diffuseRoughness=t.diffuseRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum),t.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=t.iridescenceThicknessRange[1]),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new Ye().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new At().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new At().fromArray(t.clearcoatNormalScale)),t.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=e[t.diffuseRoughnessMap]||null),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var wn=new P,Mo=new P,ar=new P,or=new P,zi=class{constructor(t=new P,e=new P(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,wn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=wn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(wn.copy(this.origin).addScaledVector(this.direction,e),wn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Mo.copy(t).add(e).multiplyScalar(.5),ar.copy(e).sub(t).normalize(),or.copy(this.origin).sub(Mo);let r=t.distanceTo(e)*.5,a=-this.direction.dot(ar),o=or.dot(this.direction),c=-or.dot(ar),l=or.lengthSq(),f=Math.abs(1-a*a),d,h,u,A;if(f>0)if(d=a*c-o,h=a*o-c,A=r*f,d>=0)if(h>=-A)if(h<=A){let y=1/f;d*=y,h*=y,u=d*(d+a*h+2*o)+h*(a*d+h+2*c)+l}else h=r,d=Math.max(0,-(a*h+o)),u=-d*d+h*(h+2*c)+l;else h=-r,d=Math.max(0,-(a*h+o)),u=-d*d+h*(h+2*c)+l;else h<=-A?(d=Math.max(0,-(-a*r+o)),h=d>0?-r:Math.min(Math.max(-r,-c),r),u=-d*d+h*(h+2*c)+l):h<=A?(d=0,h=Math.min(Math.max(-r,-c),r),u=h*(h+2*c)+l):(d=Math.max(0,-(a*r+o)),h=d>0?r:Math.min(Math.max(-r,-c),r),u=-d*d+h*(h+2*c)+l);else h=a>0?-r:r,d=Math.max(0,-(a*h+o)),u=-d*d+h*(h+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Mo).addScaledVector(ar,h),u}intersectSphere(t,e){if(t.radius<0)return null;wn.subVectors(t.center,this.origin);let n=wn.dot(this.direction),s=wn.dot(wn)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,c,l=1/this.direction.x,f=1/this.direction.y,d=1/this.direction.z,h=this.origin;return l>=0?(n=(t.min.x-h.x)*l,s=(t.max.x-h.x)*l):(n=(t.max.x-h.x)*l,s=(t.min.x-h.x)*l),f>=0?(r=(t.min.y-h.y)*f,a=(t.max.y-h.y)*f):(r=(t.max.y-h.y)*f,a=(t.min.y-h.y)*f),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(t.min.z-h.z)*d,c=(t.max.z-h.z)*d):(o=(t.max.z-h.z)*d,c=(t.min.z-h.z)*d),n>c||o>s)||((o>n||n!==n)&&(n=o),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,wn)!==null}intersectTriangle(t,e,n,s,r){let a=this.origin,o=this.direction,c=o.x,l=o.y,f=o.z,d=t.x-a.x,h=t.y-a.y,u=t.z-a.z,A=e.x-a.x,y=e.y-a.y,B=e.z-a.z,p=n.x-a.x,v=n.y-a.y,T=n.z-a.z,M=Math.abs(c),C=Math.abs(l),b=Math.abs(f),m,x,D,R,N,U,V,E,H,k,Y,J;if(M>=C&&M>=b?(D=c,U=d,H=A,J=p,c>=0?(m=l,x=f,R=h,N=u,V=y,E=B,k=v,Y=T):(m=f,x=l,R=u,N=h,V=B,E=y,k=T,Y=v)):C>=b?(D=l,U=h,H=y,J=v,l>=0?(m=f,x=c,R=u,N=d,V=B,E=A,k=T,Y=p):(m=c,x=f,R=d,N=u,V=A,E=B,k=p,Y=T)):(D=f,U=u,H=B,J=T,f>=0?(m=c,x=l,R=d,N=h,V=A,E=y,k=p,Y=v):(m=l,x=c,R=h,N=d,V=y,E=A,k=v,Y=p)),D===0)return null;let W=m/D,j=x/D,tt=1/D,vt=R-W*U,Nt=N-j*U,$=V-W*H,pt=E-j*H,_t=k-W*J,Ct=Y-j*J,Bt=_t*pt-Ct*$,Dt=vt*Ct-Nt*_t,le=$*Nt-pt*vt;if(s){if(Bt<0||Dt<0||le<0)return null}else if((Bt<0||Dt<0||le<0)&&(Bt>0||Dt>0||le>0))return null;let Et=Bt+Dt+le;if(Et===0)return null;let $t=tt*(Bt*U+Dt*H+le*J);return(Et>0?$t<0:$t>0)?null:this.at($t/Et,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Gi=class extends Xn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Gt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Nn,this.combine=Vo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},ic=new ee,li=new zi,lr=new Fi,sc=new P,cr=new P,fr=new P,hr=new P,So=new P,ur=new P,rc=new P,dr=new P,Qe=class extends we{constructor(t=new Ve,e=new Gi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){ur.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let f=o[c],d=r[c];f!==0&&(So.fromBufferAttribute(d,t),a?ur.addScaledVector(So,f):ur.addScaledVector(So.sub(e),f))}e.add(ur)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),lr.copy(n.boundingSphere),lr.applyMatrix4(r),li.copy(t.ray).recast(t.near),!(lr.containsPoint(li.origin)===!1&&(li.intersectSphere(lr,sc)===null||li.origin.distanceToSquared(sc)>(t.far-t.near)**2))&&(ic.copy(r).invert(),li.copy(t.ray).applyMatrix4(ic),!(n.boundingBox!==null&&li.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,li)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,f=r.attributes.uv1,d=r.attributes.normal,h=r.groups,u=r.drawRange;if(o!==null)if(Array.isArray(a))for(let A=0,y=h.length;A<y;A++){let B=h[A],p=a[B.materialIndex],v=Math.max(B.start,u.start),T=Math.min(o.count,Math.min(B.start+B.count,u.start+u.count));for(let M=v,C=T;M<C;M+=3){let b=o.getX(M),m=o.getX(M+1),x=o.getX(M+2);s=pr(this,p,t,n,l,f,d,b,m,x),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=B.materialIndex,e.push(s))}}else{let A=Math.max(0,u.start),y=Math.min(o.count,u.start+u.count);for(let B=A,p=y;B<p;B+=3){let v=o.getX(B),T=o.getX(B+1),M=o.getX(B+2);s=pr(this,a,t,n,l,f,d,v,T,M),s&&(s.faceIndex=Math.floor(B/3),e.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let A=0,y=h.length;A<y;A++){let B=h[A],p=a[B.materialIndex],v=Math.max(B.start,u.start),T=Math.min(c.count,Math.min(B.start+B.count,u.start+u.count));for(let M=v,C=T;M<C;M+=3){let b=M,m=M+1,x=M+2;s=pr(this,p,t,n,l,f,d,b,m,x),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=B.materialIndex,e.push(s))}}else{let A=Math.max(0,u.start),y=Math.min(c.count,u.start+u.count);for(let B=A,p=y;B<p;B+=3){let v=B,T=B+1,M=B+2;s=pr(this,a,t,n,l,f,d,v,T,M),s&&(s.faceIndex=Math.floor(B/3),e.push(s))}}}};function Lh(i,t,e,n,s,r,a,o){let c;if(t.side===Le?c=n.intersectTriangle(a,r,s,!0,o):c=n.intersectTriangle(s,r,a,t.side===ti,o),c===null)return null;dr.copy(o),dr.applyMatrix4(i.matrixWorld);let l=e.ray.origin.distanceTo(dr);return l<e.near||l>e.far?null:{distance:l,point:dr.clone(),object:i}}function pr(i,t,e,n,s,r,a,o,c,l){i.getVertexPosition(o,cr),i.getVertexPosition(c,fr),i.getVertexPosition(l,hr);let f=Lh(i,t,e,n,cr,fr,hr,rc);if(f){let d=new P;Qn.getBarycoord(rc,cr,fr,hr,d),s&&(f.uv=Qn.getInterpolatedAttribute(s,o,c,l,d,new At)),r&&(f.uv1=Qn.getInterpolatedAttribute(r,o,c,l,d,new At)),a&&(f.normal=Qn.getInterpolatedAttribute(a,o,c,l,d,new P),f.normal.dot(n.direction)>0&&f.normal.multiplyScalar(-1));let h={a:o,b:c,c:l,normal:new P,materialIndex:0};Qn.getNormal(cr,fr,hr,h.normal),f.face=h,f.barycoord=d}return f}var Lr=class extends Ne{constructor(t=null,e=1,n=1,s,r,a,o,c,l=ye,f=ye,d,h){super(null,a,o,c,l,f,s,r,d,h),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ci=new Fi,Dh=new At(.5,.5),Br=new P,qn=class{constructor(t=new Ye,e=new Ye,n=new Ye,s=new Ye,r=new Ye,a=new Ye){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Je,n=!1){let s=this.planes,r=t.elements,a=r[0],o=r[1],c=r[2],l=r[3],f=r[4],d=r[5],h=r[6],u=r[7],A=r[8],y=r[9],B=r[10],p=r[11],v=r[12],T=r[13],M=r[14],C=r[15];if(s[0].setComponents(l-a,u-f,p-A,C-v).normalize(),s[1].setComponents(l+a,u+f,p+A,C+v).normalize(),s[2].setComponents(l+o,u+d,p+y,C+T).normalize(),s[3].setComponents(l-o,u-d,p-y,C-T).normalize(),n)s[4].setComponents(c,h,B,M).normalize(),s[5].setComponents(l-c,u-h,p-B,C-M).normalize();else if(s[4].setComponents(l-c,u-h,p-B,C-M).normalize(),e===Je)s[5].setComponents(l+c,u+h,p+B,C+M).normalize();else if(e===Ni)s[5].setComponents(c,h,B,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),ci.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),ci.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(ci)}intersectsSprite(t){ci.center.set(0,0,0);let e=Dh.distanceTo(t.center);return ci.radius=.7071067811865476+e,ci.applyMatrix4(t.matrixWorld),this.intersectsSphere(ci)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Br.x=s.normal.x>0?t.max.x:t.min.x,Br.y=s.normal.y>0?t.max.y:t.min.y,Br.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Br)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},ac=new ee,Dr=class i{constructor(){this.coordinateSystem=Je,this._frustums=[],this._count=0}setFromArrayCamera(t){let e=t.cameras,n=this._frustums;for(let s=0;s<e.length;s++){let r=e[s];ac.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[s]===void 0&&(n[s]=new qn),n[s].setFromProjectionMatrix(ac,r.coordinateSystem,r.reversedDepth)}return this._count=e.length,this}getFrustum(t){return this._frustums[t]}intersectsObject(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsObject(t))return!0;return!1}intersectsSprite(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSprite(t))return!0;return!1}intersectsSphere(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSphere(t))return!0;return!1}intersectsBox(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsBox(t))return!0;return!1}containsPoint(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].containsPoint(t))return!0;return!1}copy(t){this.coordinateSystem=t.coordinateSystem;let e=this._frustums,n=t._frustums;for(let s=0;s<t._count;s++)e[s]===void 0&&(e[s]=new qn),e[s].copy(n[s]);return this._count=t._count,this}clone(){return new i().copy(this)}};var _s=class extends Ne{constructor(t=[],e=Bi,n,s,r,a,o,c,l,f){super(t,e,n,s,r,a,o,c,l,f),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},ys=class extends Ne{constructor(t,e,n,s,r,a,o,c,l){super(t,e,n,s,r,a,o,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Ln=class extends Ne{constructor(t,e,n=fn,s,r,a,o=ye,c=ye,l,f=Pn,d=1){if(f!==Pn&&f!==Un)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:t,height:e,depth:d};super(h,s,r,a,o,c,f,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Ui(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}},xs=class extends Ln{constructor(t,e=fn,n=Bi,s,r,a=ye,o=ye,c,l=Pn){let f={width:t,height:t,depth:1},d=[f,f,f,f,f,f];super(t,t,e,n,s,r,a,o,c,l),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},vs=class extends Ne{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},An=class i extends Ve{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let c=[],l=[],f=[],d=[],h=0,u=0;A("z","y","x",-1,-1,n,e,t,a,r,0),A("z","y","x",1,-1,n,e,-t,a,r,1),A("x","z","y",1,1,t,n,e,s,a,2),A("x","z","y",1,-1,t,n,-e,s,a,3),A("x","y","z",1,-1,t,e,n,s,r,4),A("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new oe(l,3)),this.setAttribute("normal",new oe(f,3)),this.setAttribute("uv",new oe(d,2));function A(y,B,p,v,T,M,C,b,m,x,D){let R=M/m,N=C/x,U=M/2,V=C/2,E=b/2,H=m+1,k=x+1,Y=0,J=0,W=new P;for(let j=0;j<k;j++){let tt=j*N-V;for(let vt=0;vt<H;vt++){let Nt=vt*R-U;W[y]=Nt*v,W[B]=tt*T,W[p]=E,l.push(W.x,W.y,W.z),W[y]=0,W[B]=0,W[p]=b>0?1:-1,f.push(W.x,W.y,W.z),d.push(vt/m),d.push(1-j/x),Y+=1}}for(let j=0;j<x;j++)for(let tt=0;tt<m;tt++){let vt=h+tt+H*j,Nt=h+tt+H*(j+1),$=h+(tt+1)+H*(j+1),pt=h+(tt+1)+H*j;c.push(vt,Nt,pt),c.push(Nt,$,pt),J+=6}o.addGroup(u,J,D),u+=J,h+=Y}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var fi=class i extends Ve{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:c};let l=this;s=Math.floor(s),r=Math.floor(r);let f=[],d=[],h=[],u=[],A=0,y=[],B=n/2,p=0;v(),a===!1&&(t>0&&T(!0),e>0&&T(!1)),this.setIndex(f),this.setAttribute("position",new oe(d,3)),this.setAttribute("normal",new oe(h,3)),this.setAttribute("uv",new oe(u,2));function v(){let M=new P,C=new P,b=0,m=(e-t)/n;for(let x=0;x<=r;x++){let D=[],R=x/r,N=R*(e-t)+t;for(let U=0;U<=s;U++){let V=U/s,E=V*c+o,H=Math.sin(E),k=Math.cos(E);C.x=N*H,C.y=-R*n+B,C.z=N*k,d.push(C.x,C.y,C.z),M.set(H,m,k).normalize(),h.push(M.x,M.y,M.z),u.push(V,1-R),D.push(A++)}y.push(D)}for(let x=0;x<s;x++)for(let D=0;D<r;D++){let R=y[D][x],N=y[D+1][x],U=y[D+1][x+1],V=y[D][x+1];(t>0||D!==0)&&(f.push(R,N,V),b+=3),(e>0||D!==r-1)&&(f.push(N,U,V),b+=3)}l.addGroup(p,b,0),p+=b}function T(M){let C=A,b=new At,m=new P,x=0,D=M===!0?t:e,R=M===!0?1:-1;for(let U=1;U<=s;U++)d.push(0,B*R,0),h.push(0,R,0),u.push(.5,.5),A++;let N=A;for(let U=0;U<=s;U++){let E=U/s*c+o,H=Math.cos(E),k=Math.sin(E);m.x=D*k,m.y=B*R,m.z=D*H,d.push(m.x,m.y,m.z),h.push(0,R,0),b.x=H*.5+.5,b.y=k*.5*R+.5,u.push(b.x,b.y),A++}for(let U=0;U<s;U++){let V=C+U,E=N+U;M===!0?f.push(E,E+1,V):f.push(E+1,E,V),x+=3}l.addGroup(p,x,M===!0?1:2),p+=x}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}};var tn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Tt("Curve: .getPoint() not implemented.")}getPointAt(t,e){let n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],n,s=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){let n=this.getLengths(),s=0,r=n.length,a;e?a=e:a=t*n[r-1];let o=0,c=r-1,l;for(;o<=c;)if(s=Math.floor(o+(c-o)/2),l=n[s]-a,l<0)o=s+1;else if(l>0)c=s-1;else{c=s;break}if(s=c,n[s]===a)return s/(r-1);let f=n[s],h=n[s+1]-f,u=(a-f)/h;return(s+u)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);let a=this.getPoint(s),o=this.getPoint(r),c=e||(a.isVector2?new At:new P);return c.copy(o).sub(a).normalize(),c}getTangentAt(t,e){let n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){let n=new P,s=[],r=[],a=[],o=new P,c=new ee;for(let u=0;u<=t;u++){let A=u/t;s[u]=this.getTangentAt(A,new P)}r[0]=new P,a[0]=new P;let l=Number.MAX_VALUE,f=Math.abs(s[0].x),d=Math.abs(s[0].y),h=Math.abs(s[0].z);f<=l&&(l=f,n.set(1,0,0)),d<=l&&(l=d,n.set(0,1,0)),h<=l&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let u=1;u<=t;u++){if(r[u]=r[u-1].clone(),a[u]=a[u-1].clone(),o.crossVectors(s[u-1],s[u]),o.length()>Number.EPSILON){o.normalize();let A=Math.acos(Ft(s[u-1].dot(s[u]),-1,1));r[u].applyMatrix4(c.makeRotationAxis(o,A))}a[u].crossVectors(s[u],r[u])}if(e===!0){let u=Math.acos(Ft(r[0].dot(r[t]),-1,1));u/=t,s[0].dot(o.crossVectors(r[0],r[t]))>0&&(u=-u);for(let A=1;A<=t;A++)r[A].applyMatrix4(c.makeRotationAxis(s[A],u*A)),a[A].crossVectors(s[A],r[A])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}toJSON(){let t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}},Ms=class extends tn{constructor(t=0,e=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=c}getPoint(t,e=new At){let n=e,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);let o=this.aStartAngle+t*r,c=this.aX+this.xRadius*Math.cos(o),l=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let f=Math.cos(this.aRotation),d=Math.sin(this.aRotation),h=c-this.aX,u=l-this.aY;c=h*f-u*d+this.aX,l=h*d+u*f+this.aY}return n.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},Ur=class extends Ms{constructor(t,e,n,s,r,a){super(t,e,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};function Bl(){let i=0,t=0,e=0,n=0;function s(r,a,o,c){i=r,t=o,e=-3*r+3*a-2*o-c,n=2*r-2*a+o+c}return{initCatmullRom:function(r,a,o,c,l){s(a,o,l*(o-r),l*(c-a))},initNonuniformCatmullRom:function(r,a,o,c,l,f,d){let h=(a-r)/l-(o-r)/(l+f)+(o-a)/f,u=(o-a)/f-(c-a)/(f+d)+(c-o)/d;h*=f,u*=f,s(a,o,h,u)},calc:function(r){let a=r*r,o=a*r;return i+t*r+e*a+n*o}}}var oc=new P,lc=new P,bo=new Bl,To=new Bl,Co=new Bl,Yi=class extends tn{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new P){let n=e,s=this.points,r=s.length,a=(r-(this.closed?0:1))*t,o=Math.floor(a),c=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:c===0&&o===r-1&&(o=r-2,c=1);let l,f;this.closed||o>0?l=s[(o-1)%r]:(lc.subVectors(s[0],s[1]).add(s[0]),l=lc);let d=s[o%r],h=s[(o+1)%r];if(this.closed||o+2<r?f=s[(o+2)%r]:(oc.subVectors(s[r-1],s[r-2]).add(s[r-1]),f=oc),this.curveType==="centripetal"||this.curveType==="chordal"){let u=this.curveType==="chordal"?.5:.25,A=Math.pow(l.distanceToSquared(d),u),y=Math.pow(d.distanceToSquared(h),u),B=Math.pow(h.distanceToSquared(f),u);y<1e-4&&(y=1),A<1e-4&&(A=y),B<1e-4&&(B=y),bo.initNonuniformCatmullRom(l.x,d.x,h.x,f.x,A,y,B),To.initNonuniformCatmullRom(l.y,d.y,h.y,f.y,A,y,B),Co.initNonuniformCatmullRom(l.z,d.z,h.z,f.z,A,y,B)}else this.curveType==="catmullrom"&&(bo.initCatmullRom(l.x,d.x,h.x,f.x,this.tension),To.initCatmullRom(l.y,d.y,h.y,f.y,this.tension),Co.initCatmullRom(l.z,d.z,h.z,f.z,this.tension));return n.set(bo.calc(c),To.calc(c),Co.calc(c)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new P().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};function cc(i,t,e,n,s){let r=(n-t)*.5,a=(s-e)*.5,o=i*i,c=i*o;return(2*e-2*n+r+a)*c+(-3*e+3*n-2*r-a)*o+r*i+e}function Uh(i,t){let e=1-i;return e*e*t}function Oh(i,t){return 2*(1-i)*i*t}function Fh(i,t){return i*i*t}function ls(i,t,e,n){return Uh(i,t)+Oh(i,e)+Fh(i,n)}function zh(i,t){let e=1-i;return e*e*e*t}function Gh(i,t){let e=1-i;return 3*e*e*i*t}function Yh(i,t){return 3*(1-i)*i*i*t}function Hh(i,t){return i*i*i*t}function cs(i,t,e,n,s){return zh(i,t)+Gh(i,e)+Yh(i,n)+Hh(i,s)}var Or=class extends tn{constructor(t=new At,e=new At,n=new At,s=new At){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new At){let n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(cs(t,s.x,r.x,a.x,o.x),cs(t,s.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},Fr=class extends tn{constructor(t=new P,e=new P,n=new P,s=new P){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new P){let n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(cs(t,s.x,r.x,a.x,o.x),cs(t,s.y,r.y,a.y,o.y),cs(t,s.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},zr=class extends tn{constructor(t=new At,e=new At){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new At){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new At){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Gr=class extends tn{constructor(t=new P,e=new P){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new P){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new P){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Yr=class extends tn{constructor(t=new At,e=new At,n=new At){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new At){let n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(ls(t,s.x,r.x,a.x),ls(t,s.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Ss=class extends tn{constructor(t=new P,e=new P,n=new P){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new P){let n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(ls(t,s.x,r.x,a.x),ls(t,s.y,r.y,a.y),ls(t,s.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Hr=class extends tn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new At){let n=e,s=this.points,r=(s.length-1)*t,a=Math.floor(r),o=r-a,c=s[a===0?a:a-1],l=s[a],f=s[a>s.length-2?s.length-1:a+1],d=s[a>s.length-3?s.length-1:a+2];return n.set(cc(o,c.x,l.x,f.x,d.x),cc(o,c.y,l.y,f.y,d.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new At().fromArray(s))}return this}},kh=Object.freeze({__proto__:null,ArcCurve:Ur,CatmullRomCurve3:Yi,CubicBezierCurve:Or,CubicBezierCurve3:Fr,EllipseCurve:Ms,LineCurve:zr,LineCurve3:Gr,QuadraticBezierCurve:Yr,QuadraticBezierCurve3:Ss,SplineCurve:Hr});var hi=class i extends Ve{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),c=Math.floor(s),l=o+1,f=c+1,d=t/o,h=e/c,u=[],A=[],y=[],B=[];for(let p=0;p<f;p++){let v=p*h-a;for(let T=0;T<l;T++){let M=T*d-r;A.push(M,-v,0),y.push(0,0,1),B.push(T/o),B.push(1-p/c)}}for(let p=0;p<c;p++)for(let v=0;v<o;v++){let T=v+l*p,M=v+l*(p+1),C=v+1+l*(p+1),b=v+1+l*p;u.push(T,M,b),u.push(M,C,b)}this.setIndex(u),this.setAttribute("position",new oe(A,3)),this.setAttribute("normal",new oe(y,3)),this.setAttribute("uv",new oe(B,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}};var bs=class i extends Ve{constructor(t=new Ss(new P(-1,-1,0),new P(-1,1,0),new P(1,1,0)),e=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:s,closed:r};let a=t.computeFrenetFrames(e,r);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new P,c=new P,l=new At,f=new P,d=[],h=[],u=[],A=[];y(),this.setIndex(A),this.setAttribute("position",new oe(d,3)),this.setAttribute("normal",new oe(h,3)),this.setAttribute("uv",new oe(u,2));function y(){for(let T=0;T<e;T++)B(T);B(r===!1?e:0),v(),p()}function B(T){f=t.getPointAt(T/e,f);let M=a.normals[T],C=a.binormals[T];for(let b=0;b<=s;b++){let m=b/s*Math.PI*2,x=Math.sin(m),D=-Math.cos(m);c.x=D*M.x+x*C.x,c.y=D*M.y+x*C.y,c.z=D*M.z+x*C.z,c.normalize(),h.push(c.x,c.y,c.z),o.x=f.x+n*c.x,o.y=f.y+n*c.y,o.z=f.z+n*c.z,d.push(o.x,o.y,o.z)}}function p(){for(let T=1;T<=e;T++)for(let M=1;M<=s;M++){let C=(s+1)*(T-1)+(M-1),b=(s+1)*T+(M-1),m=(s+1)*T+M,x=(s+1)*(T-1)+M;A.push(C,b,x),A.push(b,m,x)}}function v(){for(let T=0;T<=e;T++)for(let M=0;M<=s;M++)l.x=T/e,l.y=M/s,u.push(l.x,l.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new i(new kh[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}};function Ai(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];if(fc(s))s.isRenderTargetTexture?(Tt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(fc(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function Ee(i){let t={};for(let e=0;e<i.length;e++){let n=Ai(i[e]);for(let s in n)t[s]=n[s]}return t}function fc(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Vh(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function ml(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Vt.workingColorSpace}var rf={clone:Ai,merge:Ee},Qh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Wh=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,gn=class extends Xn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Qh,this.fragmentShader=Wh,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Ai(t.uniforms),this.uniformsGroups=Vh(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new Gt().setHex(s.value);break;case"v2":this.uniforms[n].value=new At().fromArray(s.value);break;case"v3":this.uniforms[n].value=new P().fromArray(s.value);break;case"v4":this.uniforms[n].value=new se().fromArray(s.value);break;case"m3":this.uniforms[n].value=new It().fromArray(s.value);break;case"m4":this.uniforms[n].value=new ee().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},kr=class extends gn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},Ts=class extends Xn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Gt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Gt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ha,this.normalScale=new At(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Nn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};var Vr=class extends Xn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Hc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Qr=class extends Xn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function wi(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function mr(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var $n=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Wr=class extends $n{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Ro,endingEnd:Ro}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],c=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Io:r=t,o=2*e-n;break;case Po:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(c===void 0)switch(this.getSettings_().endingEnd){case Io:a=t,c=2*n-e;break;case Po:a=1,c=n+s[1]-s[0];break;default:a=t-1,c=e}let l=(n-e)*.5,f=this.valueSize;this._weightPrev=l/(e-o),this._weightNext=l/(c-n),this._offsetPrev=r*f,this._offsetNext=a*f}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=t*o,l=c-o,f=this._offsetPrev,d=this._offsetNext,h=this._weightPrev,u=this._weightNext,A=(n-e)/(s-e),y=A*A,B=y*A,p=-h*B+2*h*y-h*A,v=(1+h)*B+(-1.5-2*h)*y+(-.5+h)*A+1,T=(-1-u)*B+(1.5+u)*y+.5*A,M=u*B-u*y;for(let C=0;C!==o;++C)r[C]=p*a[f+C]+v*a[l+C]+T*a[c+C]+M*a[d+C];return r}},Xr=class extends $n{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=t*o,l=c-o,f=(n-e)/(s-e),d=1-f;for(let h=0;h!==o;++h)r[h]=a[l+h]*d+a[c+h]*f;return r}},qr=class extends $n{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},$r=class extends $n{interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=t*o,l=c-o,f=this.inTangents,d=this.outTangents;if(!f||!d){let A=(n-e)/(s-e),y=1-A;for(let B=0;B!==o;++B)r[B]=a[l+B]*y+a[c+B]*A;return r}let h=o*2,u=t-1;for(let A=0;A!==o;++A){let y=a[l+A],B=a[c+A],p=u*h+A*2,v=d[p],T=d[p+1],M=t*h+A*2,C=f[M],b=f[M+1],m=qh(n,e,v,C,s);r[A]=af(m,y,T,b,B)}return r}};function af(i,t,e,n,s){let r=1-i;return r*r*r*t+3*r*r*i*e+3*r*i*i*n+i*i*i*s}function Xh(i,t,e,n,s){let r=1-i;return 3*r*r*(e-t)+6*r*i*(n-e)+3*i*i*(s-n)}function qh(i,t,e,n,s){let r=(i-t)/(s-t);for(let a=0;a<8;a++){let o=af(r,t,e,n,s)-i;if(Math.abs(o)<1e-10)break;let c=Xh(r,t,e,n,s);if(Math.abs(c)<1e-10)break;r=Math.max(0,Math.min(1,r-o/c))}return r}var We=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=wi(e,this.TimeBufferType),this.values=wi(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:wi(t.times,Array),values:wi(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s),mr(t.settings)&&(n.settings={inTangents:wi(t.settings.inTangents,Array),outTangents:wi(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new qr(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Xr(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Wr(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new $r(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case fs:e=this.InterpolantFactoryMethodDiscrete;break;case Rr:e=this.InterpolantFactoryMethodLinear;break;case _r:e=this.InterpolantFactoryMethodSmooth;break;case Eo:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Tt("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return fs;case this.InterpolantFactoryMethodLinear:return Rr;case this.InterpolantFactoryMethodSmooth:return _r;case this.InterpolantFactoryMethodBezier:return Eo}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t;mr(this.settings)&&(hc(this.settings.inTangents,t),hc(this.settings.outTangents,t))}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t;mr(this.settings)&&(uc(this.settings.inTangents,t),uc(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Rt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Rt("KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let c=n[o];if(typeof c=="number"&&isNaN(c)){Rt("KeyframeTrack: Time is not a valid number.",this,o,c),t=!1;break}if(a!==null&&a>c){Rt("KeyframeTrack: Out of order keys.",this,o,c,a),t=!1;break}a=c}if(s!==void 0&&nh(s))for(let o=0,c=s.length;o!==c;++o){let l=s[o];if(isNaN(l)){Rt("KeyframeTrack: Value is not a valid number.",this,o,l),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===_r,r=t.length-1,a=1;for(let o=1;o<r;++o){let c=!1,l=t[o],f=t[o+1];if(l!==f&&(o!==1||l!==t[0]))if(s)c=!0;else{let d=o*n,h=d-n,u=d+n;for(let A=0;A!==n;++A){let y=e[d+A];if(y!==e[h+A]||y!==e[u+A]){c=!0;break}}}if(c){if(o!==a){t[a]=t[o];let d=o*n,h=a*n;for(let u=0;u!==n;++u)e[h+u]=e[d+u]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,c=a*n,l=0;l!==n;++l)e[c+l]=e[o+l];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,mr(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function hc(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]+=t}function uc(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]*=t}We.prototype.ValueTypeName="";We.prototype.TimeBufferType=Float32Array;We.prototype.ValueBufferType=Float32Array;We.prototype.DefaultInterpolation=Rr;var Zn=class extends We{constructor(t,e,n){super(t,e,n)}};Zn.prototype.ValueTypeName="bool";Zn.prototype.ValueBufferType=Array;Zn.prototype.DefaultInterpolation=fs;Zn.prototype.InterpolantFactoryMethodLinear=void 0;Zn.prototype.InterpolantFactoryMethodSmooth=void 0;var Zr=class extends We{constructor(t,e,n,s){super(t,e,n,s)}};Zr.prototype.ValueTypeName="color";var Kr=class extends We{constructor(t,e,n,s){super(t,e,n,s)}};Kr.prototype.ValueTypeName="number";var jr=class extends $n{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=(n-e)/(s-e),l=t*o;for(let f=l+o;l!==f;l+=4)He.slerpFlat(r,0,a,l-o,a,l,c);return r}},Cs=class extends We{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new jr(this.times,this.values,this.getValueSize(),t)}};Cs.prototype.ValueTypeName="quaternion";Cs.prototype.InterpolantFactoryMethodSmooth=void 0;var Kn=class extends We{constructor(t,e,n){super(t,e,n)}};Kn.prototype.ValueTypeName="string";Kn.prototype.ValueBufferType=Array;Kn.prototype.DefaultInterpolation=fs;Kn.prototype.InterpolantFactoryMethodLinear=void 0;Kn.prototype.InterpolantFactoryMethodSmooth=void 0;var Jr=class extends We{constructor(t,e,n,s){super(t,e,n,s)}};Jr.prototype.ValueTypeName="vector";var No={enabled:!1,files:{},add:function(i,t){this.enabled!==!1&&(dc(i)||(this.files[i]=t))},get:function(i){if(this.enabled!==!1&&!dc(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function dc(i){try{let t=i.slice(i.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch{return!1}}var ta=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,c,l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(f){o++,r===!1&&s.onStart!==void 0&&s.onStart(f,a,o),r=!0},this.itemEnd=function(f){a++,s.onProgress!==void 0&&s.onProgress(f,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(f){s.onError!==void 0&&s.onError(f)},this.resolveURL=function(f){return f=f.normalize("NFC"),c?c(f):f},this.setURLModifier=function(f){return c=f,this},this.addHandler=function(f,d){return l.push(f,d),this},this.removeHandler=function(f){let d=l.indexOf(f);return d!==-1&&l.splice(d,2),this},this.getHandler=function(f){for(let d=0,h=l.length;d<h;d+=2){let u=l[d],A=l[d+1];if(u.global&&(u.lastIndex=0),u.test(f))return A}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},of=new ta,ui=class{constructor(t){this.manager=t!==void 0?t:of,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}setPriority(t){return this.priority=t,this}setCache(t){return this.cache=t,this}abort(){return this}};ui.DEFAULT_MATERIAL_NAME="__DEFAULT";var En={},Lo=class extends Error{constructor(t,e){super(t),this.response=e}},ws=class extends ui{constructor(t){super(t),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(t,e,n,s){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);let r=No.get(`file:${t}`);if(r!==void 0){this.manager.itemStart(t),setTimeout(()=>{e&&e(r),this.manager.itemEnd(t)},0);return}if(En[t]!==void 0){En[t].push({onLoad:e,onProgress:n,onError:s});return}En[t]=[],En[t].push({onLoad:e,onProgress:n,onError:s});let a=new Request(t,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",priority:this.priority,cache:this.cache,signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,c=this.responseType;fetch(a).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&Tt("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;let f=En[t],d=l.body.getReader(),h=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),u=h?parseInt(h):0,A=u!==0,y=0,B=new ReadableStream({start(p){v();function v(){d.read().then(({done:T,value:M})=>{if(T)p.close();else{y+=M.byteLength;let C=new ProgressEvent("progress",{lengthComputable:A,loaded:y,total:u});for(let b=0,m=f.length;b<m;b++){let x=f[b];x.onProgress&&x.onProgress(C)}p.enqueue(M),v()}},T=>{p.error(T)})}}});return new Response(B)}else throw new Lo(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(f=>new DOMParser().parseFromString(f,o));case"json":return l.json();default:if(o==="")return l.text();{let d=/charset="?([^;"\s]*)"?/i.exec(o),h=d&&d[1]?d[1].toLowerCase():void 0,u=new TextDecoder(h);return l.arrayBuffer().then(A=>u.decode(A))}}}).then(l=>{No.add(`file:${t}`,l);let f=En[t];delete En[t];for(let d=0,h=f.length;d<h;d++){let u=f[d];u.onLoad&&u.onLoad(l)}}).catch(l=>{let f=En[t];if(f===void 0)throw this.manager.itemError(t),l;delete En[t];for(let d=0,h=f.length;d<h;d++){let u=f[d];u.onError&&u.onError(l)}this.manager.itemError(t)}).finally(()=>{this.manager.itemEnd(t)}),this.manager.itemStart(t)}setResponseType(t){return this.responseType=t,this}setMimeType(t){return this.mimeType=t,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var Es=class extends we{static registerNode(t){this.prototype._lightNode=t}constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Gt(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}},Rs=class extends Es{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(we.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Gt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){let e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}},wo=new ee,pc=new P,Bc=new P,ea=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new At(512,512),this.mapType=Oe,this.map=null,this.mapPass=null,this.matrix=new ee,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new qn,this._frameExtents=new At(1,1),this._viewportCount=1,this._viewports=[new se(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera;pc.setFromMatrixPosition(t.matrixWorld),e.position.copy(pc),Bc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Bc),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,n,s){wo.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),n.setFromProjectionMatrix(wo,t.coordinateSystem,t.reversedDepth);let r=this._frameExtents,a=s?s.z/r.x:1,o=s?s.w/r.y:1,c=s?s.x/r.x:0,l=s?s.y/r.y:0;t.coordinateSystem===Ni||t.reversedDepth?e.set(.5*a,0,0,.5*a+c,0,.5*o,0,.5*o+l,0,0,1,0,0,0,0,1):e.set(.5*a,0,0,.5*a+c,0,.5*o,0,.5*o+l,0,0,.5,.5,0,0,0,1),e.multiply(wo)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.mapType=t.mapType,this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.mapType=this.mapType,t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},Ar=new P,gr=new He,Bn=new P,Is=class extends we{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ee,this.projectionMatrix=new ee,this.projectionMatrixInverse=new ee,this.coordinateSystem=Je,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Ar,gr,Bn),Bn.x===1&&Bn.y===1&&Bn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ar,gr,Bn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Ar,gr,Bn),Bn.x===1&&Bn.y===1&&Bn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ar,gr,Bn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Vn=new P,mc=new At,Ac=new At,Ie=class extends Is{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Di*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(as*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Di*2*Math.atan(Math.tan(as*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Vn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Vn.x,Vn.y).multiplyScalar(-t/Vn.z),Vn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Vn.x,Vn.y).multiplyScalar(-t/Vn.z)}getViewSize(t,e){return this.getViewBounds(t,mc,Ac),e.subVectors(Ac,mc)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(as*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*s/c,e-=a.offsetY*n/l,s*=a.width/c,n*=a.height/l}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var Ps=class extends Is{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,c=s-e;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,f=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=f*this.view.offsetY,c=o-f*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Do=class extends ea{constructor(){super(new Ps(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ns=class extends Es{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(we.DEFAULT_UP),this.updateMatrix(),this.target=new we,this.shadow=new Do}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}};var Ei=-90,Ri=1,Hi=class extends we{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Ie(Ei,Ri,t,e);s.layers=this.layers,this.add(s);let r=new Ie(Ei,Ri,t,e);r.layers=this.layers,this.add(r);let a=new Ie(Ei,Ri,t,e);a.layers=this.layers,this.add(a);let o=new Ie(Ei,Ri,t,e);o.layers=this.layers,this.add(o);let c=new Ie(Ei,Ri,t,e);c.layers=this.layers,this.add(c);let l=new Ie(Ei,Ri,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,c]=e;for(let l of e)this.remove(l);if(t===Je)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Ni)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,c,l,f]=this.children,d=t.getRenderTarget(),h=t.getActiveCubeFace(),u=t.getActiveMipmapLevel(),A=t.xr.enabled;t.xr.enabled=!1;let y=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let B=!1;t.isWebGLRenderer===!0?B=t.state.buffers.depth.getReversed():B=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),B&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),B&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),B&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),B&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),t.setRenderTarget(n,4,s),B&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),n.texture.mipmapsAutoUpdate=y,t.setRenderTarget(n,5,s),B&&t.autoClear===!1&&t.clearDepth(),t.render(e,f),t.setRenderTarget(d,h,u),t.xr.enabled=A,n.texture.needsPMREMUpdate=!0}},na=class extends Ie{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t,this.perCameraFrustumCulled=!1}};var Al="\\[\\]\\.:\\/",$h=new RegExp("["+Al+"]","g"),gl="[^"+Al+"]",Zh="[^"+Al.replace("\\.","")+"]",Kh=/((?:WC+[\/:])*)/.source.replace("WC",gl),jh=/(WCOD+)?/.source.replace("WCOD",Zh),Jh=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",gl),tu=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",gl),eu=new RegExp("^"+Kh+jh+Jh+tu+"$"),nu=["material","materials","bones","map"],Uo=class{constructor(t,e,n){let s=n||te.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},te=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace($h,"")}static parseTrackName(t){let e=eu.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);nu.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let c=n(o.children);if(c)return c}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Tt("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=e.objectIndex;switch(n){case"materials":if(!t.material){Rt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Rt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Rt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let f=0;f<t.length;f++)if(t[f].name===l){l=f;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Rt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Rt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Rt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(l!==void 0){if(t[l]===void 0){Rt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[l]}}let a=t[s];if(a===void 0){let l=e.nodeName;Rt("PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Rt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Rt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(c=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};te.Composite=Uo;te.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};te.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};te.prototype.GetterByBindingType=[te.prototype._getValue_direct,te.prototype._getValue_array,te.prototype._getValue_arrayElement,te.prototype._getValue_toArray];te.prototype.SetterByBindingTypeAndVersioning=[[te.prototype._setValue_direct,te.prototype._setValue_direct_setNeedsUpdate,te.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[te.prototype._setValue_array,te.prototype._setValue_array_setNeedsUpdate,te.prototype._setValue_array_setMatrixWorldNeedsUpdate],[te.prototype._setValue_arrayElement,te.prototype._setValue_arrayElement_setNeedsUpdate,te.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[te.prototype._setValue_fromArray,te.prototype._setValue_fromArray_setNeedsUpdate,te.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var lA=new Float32Array(1);var ki=class{constructor(t=1,e=0,n=0){this.radius=t,this.phi=e,this.theta=n}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Ft(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(Ft(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Oo=class{static{this.prototype.isMatrix2=!0}constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){let r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}};var Ls=class extends cn{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}};function _l(i,t,e,n){let s=iu(n);switch(e){case il:return i*t;case rl:return i*t/s.components*s.byteLength;case ca:return i*t/s.components*s.byteLength;case ei:return i*t*2/s.components*s.byteLength;case fa:return i*t*2/s.components*s.byteLength;case sl:return i*t*3/s.components*s.byteLength;case dn:return i*t*4/s.components*s.byteLength;case ha:return i*t*4/s.components*s.byteLength;case Os:case Fs:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case zs:case Gs:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case da:case Ba:return Math.max(i,16)*Math.max(t,8)/4;case ua:case pa:return Math.max(i,8)*Math.max(t,8)/2;case ma:case Aa:case _a:case ya:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case ga:case Ys:case xa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case va:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ma:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Sa:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case ba:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Ta:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Ca:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case wa:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Ea:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Ra:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Ia:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Pa:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Na:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case La:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Da:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Ua:case Oa:case Fa:return Math.ceil(i/4)*Math.ceil(t/4)*16;case za:case Ga:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Hs:case Ya:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function iu(i){switch(i){case Oe:case Jo:return{byteLength:1,components:1};case Xi:case tl:case un:return{byteLength:2,components:1};case oa:case la:return{byteLength:2,components:4};case fn:case aa:case hn:return{byteLength:4,components:1};case el:case nl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"187"}}));typeof window<"u"&&(window.__THREE__?Tt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="187");function Ef(){let i=null,t=!1,e=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),e(r,a)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function ru(i){let t=new WeakMap;function e(o,c){let l=o.array,f=o.usage,d=l.byteLength,h=i.createBuffer();i.bindBuffer(c,h),i.bufferData(c,l,f),o.onUploadCallback();let u;if(l instanceof Float32Array)u=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)u=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?u=i.HALF_FLOAT:u=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)u=i.SHORT;else if(l instanceof Uint32Array)u=i.UNSIGNED_INT;else if(l instanceof Int32Array)u=i.INT;else if(l instanceof Int8Array)u=i.BYTE;else if(l instanceof Uint8Array)u=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)u=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:h,type:u,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,c,l){let f=c.array,d=c.updateRanges;if(i.bindBuffer(l,o),d.length===0)i.bufferSubData(l,0,f);else{d.sort((u,A)=>u.start-A.start);let h=0;for(let u=1;u<d.length;u++){let A=d[h],y=d[u];y.start<=A.start+A.count+1?A.count=Math.max(A.count,y.start+y.count-A.start):(++h,d[h]=y)}d.length=h+1;for(let u=0,A=d.length;u<A;u++){let y=d[u];i.bufferSubData(l,y.start*f.BYTES_PER_ELEMENT,f,y.start,y.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let c=t.get(o);c&&(i.deleteBuffer(c.buffer),t.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let f=t.get(o);(!f||f.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let l=t.get(o);if(l===void 0)t.set(o,e(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:s,remove:r,update:a}}var au=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,ou=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,lu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,cu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,fu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,hu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,uu=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,du=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,pu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Bu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,mu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Au=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,gu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,_u=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,yu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,xu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,vu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Mu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Su=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,bu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Tu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Cu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,wu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Eu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Ru=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Iu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Pu=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Nu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Lu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Du="gl_FragColor = linearToOutputTexel( gl_FragColor );",Uu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ou=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Fu=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,zu=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Gu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Yu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Hu=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ku=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Vu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Qu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Wu=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Xu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,qu=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,$u=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Zu=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Ku=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,ju=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ju=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,td=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ed=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,nd=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,id=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,sd=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,rd=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,ad=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,od=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,ld=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,cd=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,fd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,hd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,ud=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,dd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,pd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Bd=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,md=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ad=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,gd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,_d=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,yd=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,xd=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,vd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Md=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Sd=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,bd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Td=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Cd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,wd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Ed=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Rd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Id=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Pd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Nd=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Ld=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Dd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ud=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Od=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Fd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,zd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Gd=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Yd=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Hd=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,kd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Vd=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Qd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Wd=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Xd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,qd=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,$d=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Zd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Kd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,jd=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Jd=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,tp=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,ep=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,np=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ip=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,sp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,rp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,ap=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,op=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,lp=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,fp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,hp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,up=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,dp=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,pp=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Bp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,mp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ap=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,gp=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,_p=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,yp=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xp=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,vp=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Mp=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Sp=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bp=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Tp=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Cp=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,wp=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ep=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Rp=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ip=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Pp=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Np=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Lp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Dp=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Up=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Op=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Fp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,zt={alphahash_fragment:au,alphahash_pars_fragment:ou,alphamap_fragment:lu,alphamap_pars_fragment:cu,alphatest_fragment:fu,alphatest_pars_fragment:hu,aomap_fragment:uu,aomap_pars_fragment:du,batching_pars_vertex:pu,batching_vertex:Bu,begin_vertex:mu,beginnormal_vertex:Au,bsdfs:gu,iridescence_fragment:_u,bumpmap_pars_fragment:yu,clipping_planes_fragment:xu,clipping_planes_pars_fragment:vu,clipping_planes_pars_vertex:Mu,clipping_planes_vertex:Su,color_fragment:bu,color_pars_fragment:Tu,color_pars_vertex:Cu,color_vertex:wu,common:Eu,defaultnormal_vertex:Ru,displacementmap_pars_vertex:Iu,displacementmap_vertex:Pu,emissivemap_fragment:Nu,emissivemap_pars_fragment:Lu,colorspace_fragment:Du,colorspace_pars_fragment:Uu,envmap_fragment:Ou,envmap_common_pars_fragment:Fu,envmap_pars_fragment:zu,envmap_pars_vertex:Gu,envmap_physical_pars_fragment:Ku,envmap_vertex:Yu,fog_vertex:Hu,fog_pars_vertex:ku,fog_fragment:Vu,fog_pars_fragment:Qu,gradientmap_pars_fragment:Wu,lightmap_pars_fragment:Xu,lights_lambert_fragment:qu,lights_lambert_pars_fragment:$u,lights_pars_begin:Zu,lights_toon_fragment:ju,lights_toon_pars_fragment:Ju,lights_phong_fragment:td,lights_phong_pars_fragment:ed,lights_physical_fragment:nd,lights_physical_pars_fragment:id,lights_fragment_begin:sd,lights_fragment_maps:rd,lights_fragment_end:ad,lightprobes_pars_fragment:od,logdepthbuf_fragment:ld,logdepthbuf_pars_fragment:cd,logdepthbuf_pars_vertex:fd,logdepthbuf_vertex:hd,map_fragment:ud,map_pars_fragment:dd,map_particle_fragment:pd,map_particle_pars_fragment:Bd,metalnessmap_fragment:md,metalnessmap_pars_fragment:Ad,morphinstance_vertex:gd,morphcolor_vertex:_d,morphnormal_vertex:yd,morphtarget_pars_vertex:xd,morphtarget_vertex:vd,normal_fragment_begin:Md,normal_fragment_maps:Sd,normal_pars_fragment:bd,normal_pars_vertex:Td,normal_vertex:Cd,normalmap_pars_fragment:wd,clearcoat_normal_fragment_begin:Ed,clearcoat_normal_fragment_maps:Rd,clearcoat_pars_fragment:Id,iridescence_pars_fragment:Pd,opaque_fragment:Nd,packing:Ld,premultiplied_alpha_fragment:Dd,project_vertex:Ud,dithering_fragment:Od,dithering_pars_fragment:Fd,roughnessmap_fragment:zd,roughnessmap_pars_fragment:Gd,shadowmap_pars_fragment:Yd,shadowmap_pars_vertex:Hd,shadowmap_vertex:kd,shadowmask_pars_fragment:Vd,skinbase_vertex:Qd,skinning_pars_vertex:Wd,skinning_vertex:Xd,skinnormal_vertex:qd,specularmap_fragment:$d,specularmap_pars_fragment:Zd,tonemapping_fragment:Kd,tonemapping_pars_fragment:jd,transmission_fragment:Jd,transmission_pars_fragment:tp,uv_pars_fragment:ep,uv_pars_vertex:np,uv_vertex:ip,worldpos_vertex:sp,background_vert:rp,background_frag:ap,backgroundCube_vert:op,backgroundCube_frag:lp,cube_vert:cp,cube_frag:fp,depth_vert:hp,depth_frag:up,distance_vert:dp,distance_frag:pp,equirect_vert:Bp,equirect_frag:mp,linedashed_vert:Ap,linedashed_frag:gp,meshbasic_vert:_p,meshbasic_frag:yp,meshlambert_vert:xp,meshlambert_frag:vp,meshmatcap_vert:Mp,meshmatcap_frag:Sp,meshnormal_vert:bp,meshnormal_frag:Tp,meshphong_vert:Cp,meshphong_frag:wp,meshphysical_vert:Ep,meshphysical_frag:Rp,meshtoon_vert:Ip,meshtoon_frag:Pp,points_vert:Np,points_frag:Lp,shadow_vert:Dp,shadow_frag:Up,sprite_vert:Op,sprite_frag:Fp},dt={common:{diffuse:{value:new Gt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new It},alphaMap:{value:null},alphaMapTransform:{value:new It},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new It}},envmap:{envMap:{value:null},envMapRotation:{value:new It},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new It}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new It}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new It},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new It},normalScale:{value:new At(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new It},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new It}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new It}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new It}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Gt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Gt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new It},alphaTest:{value:0},uvTransform:{value:new It}},sprite:{diffuse:{value:new Gt(16777215)},opacity:{value:1},center:{value:new At(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new It},alphaMap:{value:null},alphaMapTransform:{value:new It},alphaTest:{value:0}}},vn={basic:{uniforms:Ee([dt.common,dt.specularmap,dt.envmap,dt.aomap,dt.lightmap,dt.fog]),vertexShader:zt.meshbasic_vert,fragmentShader:zt.meshbasic_frag},lambert:{uniforms:Ee([dt.common,dt.specularmap,dt.envmap,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.fog,dt.lights,{emissive:{value:new Gt(0)},envMapIntensity:{value:1}}]),vertexShader:zt.meshlambert_vert,fragmentShader:zt.meshlambert_frag},phong:{uniforms:Ee([dt.common,dt.specularmap,dt.envmap,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.fog,dt.lights,{emissive:{value:new Gt(0)},specular:{value:new Gt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:zt.meshphong_vert,fragmentShader:zt.meshphong_frag},standard:{uniforms:Ee([dt.common,dt.envmap,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.roughnessmap,dt.metalnessmap,dt.fog,dt.lights,{emissive:{value:new Gt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:zt.meshphysical_vert,fragmentShader:zt.meshphysical_frag},toon:{uniforms:Ee([dt.common,dt.aomap,dt.lightmap,dt.emissivemap,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.gradientmap,dt.fog,dt.lights,{emissive:{value:new Gt(0)}}]),vertexShader:zt.meshtoon_vert,fragmentShader:zt.meshtoon_frag},matcap:{uniforms:Ee([dt.common,dt.bumpmap,dt.normalmap,dt.displacementmap,dt.fog,{matcap:{value:null}}]),vertexShader:zt.meshmatcap_vert,fragmentShader:zt.meshmatcap_frag},points:{uniforms:Ee([dt.points,dt.fog]),vertexShader:zt.points_vert,fragmentShader:zt.points_frag},dashed:{uniforms:Ee([dt.common,dt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:zt.linedashed_vert,fragmentShader:zt.linedashed_frag},depth:{uniforms:Ee([dt.common,dt.displacementmap]),vertexShader:zt.depth_vert,fragmentShader:zt.depth_frag},normal:{uniforms:Ee([dt.common,dt.bumpmap,dt.normalmap,dt.displacementmap,{opacity:{value:1}}]),vertexShader:zt.meshnormal_vert,fragmentShader:zt.meshnormal_frag},sprite:{uniforms:Ee([dt.sprite,dt.fog]),vertexShader:zt.sprite_vert,fragmentShader:zt.sprite_frag},background:{uniforms:{uvTransform:{value:new It},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:zt.background_vert,fragmentShader:zt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new It}},vertexShader:zt.backgroundCube_vert,fragmentShader:zt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:zt.cube_vert,fragmentShader:zt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:zt.equirect_vert,fragmentShader:zt.equirect_frag},distance:{uniforms:Ee([dt.common,dt.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:zt.distance_vert,fragmentShader:zt.distance_frag},shadow:{uniforms:Ee([dt.lights,dt.fog,{color:{value:new Gt(0)},opacity:{value:1}}]),vertexShader:zt.shadow_vert,fragmentShader:zt.shadow_frag}};vn.physical={uniforms:Ee([vn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new It},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new It},clearcoatNormalScale:{value:new At(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new It},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new It},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new It},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new It},sheen:{value:0},sheenColor:{value:new Gt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new It},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new It},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new It},transmissionSamplerSize:{value:new At},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new It},attenuationDistance:{value:0},attenuationColor:{value:new Gt(0)},specularColor:{value:new Gt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new It},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new It},anisotropyVector:{value:new At},anisotropyMap:{value:null},anisotropyMapTransform:{value:new It}}]),vertexShader:zt.meshphysical_vert,fragmentShader:zt.meshphysical_frag};var ka={r:0,b:0,g:0},zp=new ee,Rf=new It;Rf.set(-1,0,0,0,1,0,0,0,1);function Gp(i,t,e,n,s,r){let a=new Gt(0),o=s===!0?0:1,c,l,f=null,d=0,h=null;function u(v){let T=v.isScene===!0?v.background:null;if(T&&T.isTexture){let M=v.backgroundBlurriness>0;T=t.get(T,M)}return T}function A(v){let T=!1,M=u(v);M===null?B(a,o):M&&M.isColor&&(B(M,1),T=!0);let C=i.xr.getEnvironmentBlendMode();C==="additive"?e.buffers.color.setClear(0,0,0,1,r):C==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||T)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function y(v,T){let M=u(T);M&&M.isCubeTexture?(l===void 0&&(l=new Qe(new An(1,1,1),new gn({name:"BackgroundCubeMaterial",uniforms:Ai(vn.backgroundCube.uniforms),vertexShader:vn.backgroundCube.vertexShader,fragmentShader:vn.backgroundCube.fragmentShader,side:Le,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(C,b,m){this.matrixWorld.copyPosition(m.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=M,l.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(zp.makeRotationFromEuler(T.backgroundRotation)).transpose(),M.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Rf),l.material.toneMapped=Vt.getTransfer(M.colorSpace)!==qt,(f!==M||d!==M.version||h!==i.toneMapping)&&(l.material.needsUpdate=!0,f=M,d=M.version,h=i.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null)):M&&M.isTexture&&(c===void 0&&(c=new Qe(new hi(2,2),new gn({name:"BackgroundMaterial",uniforms:Ai(vn.background.uniforms),vertexShader:vn.background.vertexShader,fragmentShader:vn.background.fragmentShader,side:ti,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=M,c.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,c.material.toneMapped=Vt.getTransfer(M.colorSpace)!==qt,M.matrixAutoUpdate===!0&&M.updateMatrix(),c.material.uniforms.uvTransform.value.copy(M.matrix),(f!==M||d!==M.version||h!==i.toneMapping)&&(c.material.needsUpdate=!0,f=M,d=M.version,h=i.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null))}function B(v,T){v.getRGB(ka,ml(i)),e.buffers.color.setClear(ka.r,ka.g,ka.b,T,r)}function p(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,T=1){a.set(v),o=T,B(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(v){o=v,B(a,o)},render:A,addToRenderList:y,dispose:p}}function Yp(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=h(null),r=s,a=!1;function o(N,U,V,E,H){let k=!1,Y=d(N,E,V,U);r!==Y&&(r=Y,l(r.object)),k=u(N,E,V,H),k&&A(N,E,V,H),H!==null&&t.update(H,i.ELEMENT_ARRAY_BUFFER),(k||a)&&(a=!1,M(N,U,V,E),H!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(H).buffer))}function c(){return i.createVertexArray()}function l(N){return i.bindVertexArray(N)}function f(N){return i.deleteVertexArray(N)}function d(N,U,V,E){let H=E.wireframe===!0,k=n[U.id];k===void 0&&(k={},n[U.id]=k);let Y=N.isInstancedMesh===!0?N.id:0,J=k[Y];J===void 0&&(J={},k[Y]=J);let W=J[V.id];W===void 0&&(W={},J[V.id]=W);let j=W[H];return j===void 0&&(j=h(c()),W[H]=j),j}function h(N){let U=[],V=[],E=[];for(let H=0;H<e;H++)U[H]=0,V[H]=0,E[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:V,attributeDivisors:E,object:N,attributes:{},index:null}}function u(N,U,V,E){let H=r.attributes,k=U.attributes,Y=0,J=V.getAttributes();for(let W in J)if(J[W].location>=0){let tt=H[W],vt=k[W];if(vt===void 0&&(W==="instanceMatrix"&&N.instanceMatrix&&(vt=N.instanceMatrix),W==="instanceColor"&&N.instanceColor&&(vt=N.instanceColor)),tt===void 0||tt.attribute!==vt||vt&&tt.data!==vt.data)return!0;Y++}return r.attributesNum!==Y||r.index!==E}function A(N,U,V,E){let H={},k=U.attributes,Y=0,J=V.getAttributes();for(let W in J)if(J[W].location>=0){let tt=k[W];tt===void 0&&(W==="instanceMatrix"&&N.instanceMatrix&&(tt=N.instanceMatrix),W==="instanceColor"&&N.instanceColor&&(tt=N.instanceColor));let vt={};vt.attribute=tt,tt&&tt.data&&(vt.data=tt.data),H[W]=vt,Y++}r.attributes=H,r.attributesNum=Y,r.index=E}function y(){let N=r.newAttributes;for(let U=0,V=N.length;U<V;U++)N[U]=0}function B(N){p(N,0)}function p(N,U){let V=r.newAttributes,E=r.enabledAttributes,H=r.attributeDivisors;V[N]=1,E[N]===0&&(i.enableVertexAttribArray(N),E[N]=1),H[N]!==U&&(i.vertexAttribDivisor(N,U),H[N]=U)}function v(){let N=r.newAttributes,U=r.enabledAttributes;for(let V=0,E=U.length;V<E;V++)U[V]!==N[V]&&(i.disableVertexAttribArray(V),U[V]=0)}function T(N,U,V,E,H,k,Y){Y===!0?i.vertexAttribIPointer(N,U,V,H,k):i.vertexAttribPointer(N,U,V,E,H,k)}function M(N,U,V,E){y();let H=E.attributes,k=V.getAttributes(),Y=U.defaultAttributeValues;for(let J in k){let W=k[J];if(W.location>=0){let j=H[J];if(j===void 0&&(J==="instanceMatrix"&&N.instanceMatrix&&(j=N.instanceMatrix),J==="instanceColor"&&N.instanceColor&&(j=N.instanceColor)),j!==void 0){let tt=j.normalized,vt=j.itemSize,Nt=t.get(j);if(Nt===void 0)continue;let $=Nt.buffer,pt=Nt.type,_t=Nt.bytesPerElement,Ct=pt===i.INT||pt===i.UNSIGNED_INT||j.gpuType===aa;if(j.isInterleavedBufferAttribute){let Bt=j.data,Dt=Bt.isInterleavedBuffer===!0?Bt.stride:Bt.itemSize,le=j.offset;if(Bt.isInstancedInterleavedBuffer||Bt.isInstancedBufferAttribute){for(let Et=0;Et<W.locationSize;Et++)p(W.location+Et,Bt.meshPerAttribute);N.isInstancedMesh!==!0&&E._maxInstanceCount===void 0&&(E._maxInstanceCount=Bt.meshPerAttribute*Bt.count)}else for(let Et=0;Et<W.locationSize;Et++)B(W.location+Et);i.bindBuffer(i.ARRAY_BUFFER,$);for(let Et=0;Et<W.locationSize;Et++)T(W.location+Et,vt/W.locationSize,pt,tt,Dt*_t,(le+vt/W.locationSize*Et)*_t,Ct)}else{if(j.isInstancedBufferAttribute){for(let Bt=0;Bt<W.locationSize;Bt++)p(W.location+Bt,j.meshPerAttribute);N.isInstancedMesh!==!0&&E._maxInstanceCount===void 0&&(E._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let Bt=0;Bt<W.locationSize;Bt++)B(W.location+Bt);i.bindBuffer(i.ARRAY_BUFFER,$);for(let Bt=0;Bt<W.locationSize;Bt++)T(W.location+Bt,vt/W.locationSize,pt,tt,vt*_t,vt/W.locationSize*Bt*_t,Ct)}}else if(Y!==void 0){let tt=Y[J];if(tt!==void 0)switch(tt.length){case 2:i.vertexAttrib2fv(W.location,tt);break;case 3:i.vertexAttrib3fv(W.location,tt);break;case 4:i.vertexAttrib4fv(W.location,tt);break;default:i.vertexAttrib1fv(W.location,tt)}}}}v()}function C(){D();for(let N in n){let U=n[N];for(let V in U){let E=U[V];for(let H in E){let k=E[H];for(let Y in k)f(k[Y].object),delete k[Y];delete E[H]}}delete n[N]}}function b(N){if(n[N.id]===void 0)return;let U=n[N.id];for(let V in U){let E=U[V];for(let H in E){let k=E[H];for(let Y in k)f(k[Y].object),delete k[Y];delete E[H]}}delete n[N.id]}function m(N){for(let U in n){let V=n[U];for(let E in V){let H=V[E];if(H[N.id]===void 0)continue;let k=H[N.id];for(let Y in k)f(k[Y].object),delete k[Y];delete H[N.id]}}}function x(N){for(let U in n){let V=n[U],E=N.isInstancedMesh===!0?N.id:0,H=V[E];if(H!==void 0){for(let k in H){let Y=H[k];for(let J in Y)f(Y[J].object),delete Y[J];delete H[k]}delete V[E],Object.keys(V).length===0&&delete n[U]}}}function D(){R(),a=!0,r!==s&&(r=s,l(r.object))}function R(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:D,resetDefaultState:R,dispose:C,releaseStatesOfGeometry:b,releaseStatesOfObject:x,releaseStatesOfProgram:m,initAttributes:y,enableAttribute:B,disableUnusedAttributes:v}}function Hp(i,t,e){let n;function s(c){n=c}function r(c,l){i.drawArrays(n,c,l),e.update(l,n,1)}function a(c,l,f){f!==0&&(i.drawArraysInstanced(n,c,l,f),e.update(l,n,f))}function o(c,l,f){if(f===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,f);let h=0;for(let u=0;u<f;u++)h+=l[u];e.update(h,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function kp(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let m=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(m.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(m){return!(m!==dn&&n.convert(m)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(m){let x=m===un&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(m!==Oe&&m!==hn&&!x&&n.convert(m)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function c(m){if(m==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";m="mediump"}return m==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp",f=c(l);f!==l&&(Tt("WebGLRenderer:",l,"not supported, using",f,"instead."),l=f);let d=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),h=e.logarithmicDepthBuffer===!0&&d===!1;e.reversedDepthBuffer===!0&&d===!1&&Tt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),e.logarithmicDepthBuffer===!0&&d===!0&&Tt("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");let u=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),A=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=i.getParameter(i.MAX_TEXTURE_SIZE),B=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),v=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),T=i.getParameter(i.MAX_VARYING_VECTORS),M=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),C=i.getParameter(i.MAX_SAMPLES),b=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:u,maxVertexTextures:A,maxTextureSize:y,maxCubemapSize:B,maxAttributes:p,maxVertexUniforms:v,maxVaryings:T,maxFragmentUniforms:M,maxSamples:C,samples:b}}function Vp(i){let t=this,e=null,n=0,s=!1,r=!1,a=new Ye,o=new It,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(d,h){let u=d.length!==0||h||n!==0||s;return s=h,n=d.length,u},this.beginShadows=function(){r=!0,f(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,h){e=f(d,h,0)},this.setState=function(d,h,u){let A=d.clippingPlanes,y=d.clipIntersection,B=d.clipShadows,p=i.get(d);if(!s||A===null||A.length===0||r&&!B)r?f(null):l();else{let v=r?0:n,T=v*4,M=p.clippingState||null;c.value=M,M=f(A,h,T,u);for(let C=0;C!==T;++C)M[C]=e[C];p.clippingState=M,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=v}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function f(d,h,u,A){let y=d!==null?d.length:0,B=null;if(y!==0){if(B=c.value,A!==!0||B===null){let p=u+y*4,v=h.matrixWorldInverse;o.getNormalMatrix(v),(B===null||B.length<p)&&(B=new Float32Array(p));for(let T=0,M=u;T!==y;++T,M+=4)a.copy(d[T]).applyMatrix4(v,o),a.normal.toArray(B,M),B[M+3]=a.constant}c.value=B,c.needsUpdate=!0}return t.numPlanes=y,t.numIntersection=0,B}}var Qs=class extends ke{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new _s(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new An(5,5,5),r=new gn({name:"CubemapFromEquirect",uniforms:Ai(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Le,blending:di});r.uniforms.tEquirect.value=e;let a=new Qe(s,r),o=e.minFilter;return e.minFilter===Dn&&(e.minFilter=Pe),new Hi(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}},lf=256,Qp=3,Wp=20,If=256,Pf=16,Xp=3,qp=new P,$p=new Gt,Qa=class i{constructor(t){this._renderer=t,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new Hi(1,10,null),this._boxMesh=new Qe(new An(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){let{size:a=256,position:o=qp}=r,c=this._renderer;this._setSize(a);let l=this._allocateTarget(),f=this._getSourceTarget(!0);e>0&&(f.texture.mipmapsAutoUpdate=!1);let d=c.autoClear,h=c.autoClearColor,u=c.autoClearDepth,A=c.autoClearStencil,y=t.background;c.autoClear=!0,c.autoClearColor=!0,c.autoClearDepth=!0,c.autoClearStencil=!0,y===null&&(t.background=c.getClearColor($p));let B=new Hi(n,s,f);return B.position.copy(o),B.update(c,t),c.autoClear=d,c.autoClearColor=h,c.autoClearDepth=u,c.autoClearStencil=A,t.background=y,e>0&&(f.texture.mipmapsAutoUpdate=!0,this._blur(l,e)),this._applyPMREM(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=hf(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ff(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(t,e){return e>0?1-Math.sqrt(1-t/e):0}_setSize(t){this._cubeSize=Math.max(lf,ul(t))}_fromTexture(t,e){t.mapping===Bi||t.mapping===Wi?this._setSize(t.image.length===0?lf:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4);let n=e||this._allocateTarget();return this._textureToCubemap(t),this._applyPMREM(n),n}_allocateTarget(){let t=this._cubeSize,e=cf(t,!1,!1),n=Math.log2(t)-Qp;for(let s=0;s<=n;s++)e.texture.mipmaps.push({width:t>>s,height:t>>s});return e.texture.name="PMREM",e.texture.isPMREMTexture=!0,e}_getSourceTarget(t=!1){let e=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==e||t&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=cf(e,!0,t)),this._sourceTarget}_compileMaterial(t){this._boxMesh.material=t,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(t,e,n){let s=this._boxMesh,r=this._cubeCamera;s.material=n,r.renderTarget=t,r.activeMipmapLevel=e;let a=t.width>>e;t.viewport.set(0,0,a,a),r.update(this._renderer,s),t.viewport.set(0,0,t.width,t.height)}_textureToCubemap(t){let e;t.mapping===Bi||t.mapping===Wi?(this._cubemapMaterial===null&&(this._cubemapMaterial=hf()),e=this._cubemapMaterial,e.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=ff()),e=this._equirectMaterial),e.uniforms.envMap.value=t,this._renderCube(this._getSourceTarget(),0,e)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=Zp(),this._integrationMaterial=Kp());let e=this._cubeSize,n=t.texture.mipmaps.length-1,s=this._ggxMaterial.uniforms;s.envMap.value=this._sourceTarget.texture;let r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(e/Pf);for(let a=0;a<=n;a++){let o=i.lodToRoughness(a,n);if(a>n-Xp)r.roughness.value=o,this._renderCube(t,a,this._integrationMaterial);else{let c=o>0?Math.log2(e)+.5*Math.log2(6/(If*Math.pow(o,4)))+.5:0;s.roughness.value=o,s.lodBias.value=c,this._renderCube(t,a,this._ggxMaterial)}}}_blur(t,e){this._blurMaterial===null&&(this._blurMaterial=jp());let n=this._blurMaterial,s=n.uniforms,r=this._sourceTarget;s.sigma.value=Math.min(e,Math.PI)/Math.SQRT2,s.envMap.value=r.texture,this._renderCube(t,0,n),s.envMap.value=t.texture,this._renderCube(r,0,n)}};function cf(i,t,e){return new Qs(i,{minFilter:Dn,generateMipmaps:t,type:un,colorSpace:hs,depthBuffer:e})}function Ws(i,t,e){return new gn({name:i,uniforms:t,vertexShader:zt.cube_vert,fragmentShader:e,side:Le,blending:di,depthTest:!1,depthWrite:!1})}function Zp(){return Ws("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${If}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Kp(){return Ws("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Pf}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function jp(){return Ws("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${Wp}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function ff(){return Ws("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function hf(){return Ws("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function Jp(i){let t=new WeakMap,e=new WeakMap,n=null;function s(h,u=!1){return h==null?null:u?a(h):r(h)}function r(h){if(h&&h.isTexture){let u=h.mapping;if(u===ia||u===sa)if(t.has(h)){let A=t.get(h).texture;return o(A,h.mapping)}else{let A=h.image;if(A&&A.height>0){let y=new Qs(A.height);return y.fromEquirectangularTexture(i,h),t.set(h,y),h.addEventListener("dispose",l),o(y.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture&&h.isPMREMTexture!==!0){let u=h.mapping,A=u===ia||u===sa,y=u===Bi||u===Wi;if(A||y){let B=e.get(h),p=B!==void 0?B.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==p)return n===null&&(n=new Qa(i)),B=A?n.fromEquirectangular(h,B):n.fromCubemap(h,B),B.texture.pmremVersion=h.pmremVersion,e.set(h,B),B.texture;if(B!==void 0)return B.texture;{let v=h.image;return A&&v&&v.height>0||y&&v&&c(v)?(n===null&&(n=new Qa(i)),B=A?n.fromEquirectangular(h):n.fromCubemap(h),B.texture.pmremVersion=h.pmremVersion,e.set(h,B),h.addEventListener("dispose",f),B.texture):null}}}return h}function o(h,u){return u===ia?h.mapping=Bi:u===sa&&(h.mapping=Wi),h}function c(h){let u=0,A=6;for(let y=0;y<A;y++)h[y]!==void 0&&u++;return u===A}function l(h){let u=h.target;u.removeEventListener("dispose",l);let A=t.get(u);A!==void 0&&(t.delete(u),A.dispose())}function f(h){let u=h.target;u.removeEventListener("dispose",f);let A=e.get(u);A!==void 0&&(e.delete(u),A.dispose())}function d(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:d}}function tB(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&rs("WebGLRenderer: "+n+" extension not supported."),s}}}function eB(i,t,e,n){let s={},r=new WeakMap,a=new FinalizationRegistry(A=>delete s[A]);function o(A){c(A.target)}function c(A){A.index!==null&&t.remove(A.index);for(let B in A.attributes)t.remove(A.attributes[B]);A.removeEventListener("dispose",o),delete s[A.id],a.unregister(A);let y=r.get(A);y&&(t.remove(y),r.delete(A)),n.releaseStatesOfGeometry(A),A.isInstancedBufferGeometry===!0&&delete A._maxInstanceCount,e.memory.geometries--}function l(A,y){return s[y.id]!==void 0||(y.addEventListener("dispose",o),s[y.id]=new WeakRef(y),a.register(y,y.id,y),e.memory.geometries++),y}function f(A){let y=A.attributes;for(let B in y)t.update(y[B],i.ARRAY_BUFFER)}function d(A){let y=A.index,B=A.attributes.position,p=0;if(B===void 0)return;let v=y!==null?y.array.length:B.array.length/3-1,T=B.count>=65535?gs:As,M=new T(Math.ceil(v/3)*6,1),C=M.array;if(y!==null){let m=y.array;p=y.version;for(let x=0,D=0;x<v;x+=3){let R=m[x+0],N=m[x+1],U=m[x+2];C[D++]=R,C[D++]=N,C[D++]=N,C[D++]=U,C[D++]=U,C[D++]=R}}else{p=B.version;for(let m=0,x=0;m<v;m+=3){let D=m+0,R=m+1,N=m+2;C[x++]=D,C[x++]=R,C[x++]=R,C[x++]=N,C[x++]=N,C[x++]=D}}M.version=p;let b=r.get(A);b&&t.remove(b),r.set(A,M)}function h(A){let y=r.get(A);if(y){let B=A.index;B!==null&&y.version<B.version&&d(A)}else d(A);return r.get(A)}function u(){for(let A in s){let y=s[A].deref();y!==void 0&&c(y)}}return{get:l,update:f,getWireframeAttribute:h,dispose:u}}function nB(i,t,e){let n;function s(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function c(d,h){i.drawElements(n,h,r,d*a),e.update(h,n,1)}function l(d,h,u){u!==0&&(i.drawElementsInstanced(n,h,r,d*a,u),e.update(h,n,u))}function f(d,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,h,0,r,d,0,u);let y=0;for(let B=0;B<u;B++)y+=h[B];e.update(y,n,1)}this.setMode=s,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=f}function iB(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:Rt("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function sB(i,t,e){let n=new WeakMap,s=new se;function r(a,o,c){let l=a.morphTargetInfluences,f=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=f!==void 0?f.length:0,h=n.get(o);if(h===void 0||h.count!==d){let D=function(){m.dispose(),n.delete(o),o.removeEventListener("dispose",D)};h!==void 0&&h.texture.dispose();let u=o.morphAttributes.position!==void 0,A=o.morphAttributes.normal!==void 0,y=o.morphAttributes.color!==void 0,B=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],v=o.morphAttributes.color||[],T=0;u===!0&&(T=1),A===!0&&(T=2),y===!0&&(T=3);let M=o.attributes.position.count*T,C=1;M>t.maxTextureSize&&(C=Math.ceil(M/t.maxTextureSize),M=t.maxTextureSize);let b=new Float32Array(M*C*4*d),m=new ps(b,M,C,d);m.type=hn,m.needsUpdate=!0;let x=T*4;for(let R=0;R<d;R++){let N=B[R],U=p[R],V=v[R],E=M*C*4*R;for(let H=0;H<N.count;H++){let k=H*x;u===!0&&(s.fromBufferAttribute(N,H),b[E+k+0]=s.x,b[E+k+1]=s.y,b[E+k+2]=s.z,b[E+k+3]=0),A===!0&&(s.fromBufferAttribute(U,H),b[E+k+4]=s.x,b[E+k+5]=s.y,b[E+k+6]=s.z,b[E+k+7]=0),y===!0&&(s.fromBufferAttribute(V,H),b[E+k+8]=s.x,b[E+k+9]=s.y,b[E+k+10]=s.z,b[E+k+11]=V.itemSize===4?s.w:1)}}h={count:d,texture:m,size:new At(M,C)},n.set(o,h),o.addEventListener("dispose",D)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let u=0;for(let y=0;y<l.length;y++)u+=l[y];let A=o.morphTargetsRelative?1:1-u;c.getUniforms().setValue(i,"morphTargetBaseInfluence",A),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",h.texture,e),c.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:r}}function rB(i,t,e,n,s){let r=new WeakMap;function a(l){let f=s.render.frame,d=l.geometry,h=t.get(l,d);if(r.get(h)!==f&&(t.update(h),r.set(h,f)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==f&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,f))),l.isSkinnedMesh){let u=l.skeleton;r.get(u)!==f&&(u.update(),r.set(u,f))}return h}function o(){r=new WeakMap}function c(l){let f=l.target;f.removeEventListener("dispose",c),n.releaseStatesOfObject(f),e.remove(f.instanceMatrix),f.instanceColor!==null&&e.remove(f.instanceColor)}return{update:a,dispose:o}}var aB={[Qo]:"LINEAR_TONE_MAPPING",[Wo]:"REINHARD_TONE_MAPPING",[Xo]:"CINEON_TONE_MAPPING",[qo]:"ACES_FILMIC_TONE_MAPPING",[Zo]:"AGX_TONE_MAPPING",[Ko]:"NEUTRAL_TONE_MAPPING",[$o]:"CUSTOM_TONE_MAPPING"};function oB(i,t,e,n,s,r){let a=new ke(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,c=null,l=null,f=new Ve;f.setAttribute("position",new oe([-1,3,0,-1,-1,0,3,-1,0],3)),f.setAttribute("uv",new oe([0,2,0,0,2,0],2));let d=new kr({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new Qe(f,d),u=new Ps(-1,1,1,-1,0,1),A=null,y=null,B=!1,p,v=null,T=[],M=!1;this.setSize=function(C,b){a.setSize(C,b),o!==null&&o.setSize(C,b),c!==null&&c.setSize(C,b);for(let m=0;m<T.length;m++){let x=T[m];x.setSize&&x.setSize(C,b)}},this.setEffects=function(C){T=C,M=T.length>0&&T[0].isRenderPass===!0;let b=a.width,m=a.height;T.length>0&&o===null&&(o=new ke(b,m,{type:un,depthBuffer:!1,stencilBuffer:!1}),c=new ke(b,m,{type:un,depthBuffer:!1,stencilBuffer:!1}));let x=s===!0&&T.some(D=>D.needsDepthTexture===!0);x!==(a.depthTexture!==null)&&(x===!0&&l===null&&(l=new Ln(b,m),r===!0&&(l.format=Un,l.type=mi)),a.dispose(),a.depthTexture=x?l:null,a.resolveDepthBuffer=x,a.storeMultisampledDepthBuffer=x);for(let D=0;D<T.length;D++){let R=T[D];R.setSize&&R.setSize(b,m),x&&R.needsDepthTexture===!0&&R.setDepthTexture&&R.setDepthTexture(l)}},this.begin=function(C,b){if(B||C.toneMapping===yn&&T.length===0)return!1;if(v=b,b!==null){let m=b.width,x=b.height;(a.width!==m||a.height!==x)&&this.setSize(m,x)}return M===!1&&C.setRenderTarget(a),p=C.toneMapping,C.toneMapping=yn,!0},this.hasRenderPass=function(){return M},this.end=function(C,b){C.toneMapping=p,B=!0;let m=a,x=o;for(let D=0;D<T.length;D++){let R=T[D];R.enabled!==!1&&(R.render(C,x,m,b),R.needsSwap!==!1&&(m=x,x=x===o?c:o))}if(A!==C.outputColorSpace||y!==C.toneMapping){A=C.outputColorSpace,y=C.toneMapping,d.defines={},Vt.getTransfer(A)===qt&&(d.defines.SRGB_TRANSFER="");let D=aB[y];D&&(d.defines[D]=""),d.needsUpdate=!0}d.uniforms.tDiffuse.value=m.texture,C.setRenderTarget(v),C.render(h,u),v=null,B=!1},this.isCompositing=function(){return B},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),c!==null&&c.dispose(),f.dispose(),d.dispose()}}var Nf=new Ne,Lf=new Ln(1,1),Df=new xs(1),Uf=new ps,Of=new Nr,Ff=new _s,uf=[],df=[],pf=new Float32Array(16),Bf=new Float32Array(9),mf=new Float32Array(4);function Zi(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=uf[s];if(r===void 0&&(r=new Float32Array(s),uf[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function de(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function pe(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Xa(i,t){let e=df[t];e===void 0&&(e=new Int32Array(t),df[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function lB(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function cB(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(de(e,t))return;i.uniform2fv(this.addr,t),pe(e,t)}}function fB(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(de(e,t))return;i.uniform3fv(this.addr,t),pe(e,t)}}function hB(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(de(e,t))return;i.uniform4fv(this.addr,t),pe(e,t)}}function uB(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(de(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),pe(e,t)}else{if(de(e,n))return;mf.set(n),i.uniformMatrix2fv(this.addr,!1,mf),pe(e,n)}}function dB(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(de(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),pe(e,t)}else{if(de(e,n))return;Bf.set(n),i.uniformMatrix3fv(this.addr,!1,Bf),pe(e,n)}}function pB(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(de(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),pe(e,t)}else{if(de(e,n))return;pf.set(n),i.uniformMatrix4fv(this.addr,!1,pf),pe(e,n)}}function BB(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function mB(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(de(e,t))return;i.uniform2iv(this.addr,t),pe(e,t)}}function AB(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(de(e,t))return;i.uniform3iv(this.addr,t),pe(e,t)}}function gB(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(de(e,t))return;i.uniform4iv(this.addr,t),pe(e,t)}}function _B(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function yB(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(de(e,t))return;i.uniform2uiv(this.addr,t),pe(e,t)}}function xB(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(de(e,t))return;i.uniform3uiv(this.addr,t),pe(e,t)}}function vB(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(de(e,t))return;i.uniform4uiv(this.addr,t),pe(e,t)}}function qa(i){return i.version===0&&(i.compareFunction=ll,i.needsUpdate=!0),i}function MB(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?r=qa(Lf):r=Nf,e.setTexture2D(t||r,s)}function SB(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Of,s)}function bB(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_CUBE_SHADOW?r=qa(Df):r=Ff,e.setTextureCube(t||r,s)}function TB(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Uf,s)}function CB(i){switch(i){case 5126:return lB;case 35664:return cB;case 35665:return fB;case 35666:return hB;case 35674:return uB;case 35675:return dB;case 35676:return pB;case 5124:case 35670:return BB;case 35667:case 35671:return mB;case 35668:case 35672:return AB;case 35669:case 35673:return gB;case 5125:return _B;case 36294:return yB;case 36295:return xB;case 36296:return vB;case 35678:case 36198:case 36298:case 36306:case 35682:return MB;case 35679:case 36299:case 36307:return SB;case 35680:case 36300:case 36308:case 36293:return bB;case 36289:case 36303:case 36311:case 36292:return TB}}function wB(i,t){i.uniform1fv(this.addr,t)}function EB(i,t){let e=Zi(t,this.size,2);i.uniform2fv(this.addr,e)}function RB(i,t){let e=Zi(t,this.size,3);i.uniform3fv(this.addr,e)}function IB(i,t){let e=Zi(t,this.size,4);i.uniform4fv(this.addr,e)}function PB(i,t){let e=Zi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function NB(i,t){let e=Zi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function LB(i,t){let e=Zi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function DB(i,t){i.uniform1iv(this.addr,t)}function UB(i,t){i.uniform2iv(this.addr,t)}function OB(i,t){i.uniform3iv(this.addr,t)}function FB(i,t){i.uniform4iv(this.addr,t)}function zB(i,t){i.uniform1uiv(this.addr,t)}function GB(i,t){i.uniform2uiv(this.addr,t)}function YB(i,t){i.uniform3uiv(this.addr,t)}function HB(i,t){i.uniform4uiv(this.addr,t)}function kB(i,t,e){let n=this.cache,s=t.length,r=Xa(e,s);de(n,r)||(i.uniform1iv(this.addr,r),pe(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=qa(Lf):a=Nf;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function VB(i,t,e){let n=this.cache,s=t.length,r=Xa(e,s);de(n,r)||(i.uniform1iv(this.addr,r),pe(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||Of,r[a])}function QB(i,t,e){let n=this.cache,s=t.length,r=Xa(e,s);de(n,r)||(i.uniform1iv(this.addr,r),pe(n,r));let a;this.type===i.SAMPLER_CUBE_SHADOW?a=qa(Df):a=Ff;for(let o=0;o!==s;++o)e.setTextureCube(t[o]||a,r[o])}function WB(i,t,e){let n=this.cache,s=t.length,r=Xa(e,s);de(n,r)||(i.uniform1iv(this.addr,r),pe(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||Uf,r[a])}function XB(i){switch(i){case 5126:return wB;case 35664:return EB;case 35665:return RB;case 35666:return IB;case 35674:return PB;case 35675:return NB;case 35676:return LB;case 5124:case 35670:return DB;case 35667:case 35671:return UB;case 35668:case 35672:return OB;case 35669:case 35673:return FB;case 5125:return zB;case 36294:return GB;case 36295:return YB;case 36296:return HB;case 35678:case 36198:case 36298:case 36306:case 35682:return kB;case 35679:case 36299:case 36307:return VB;case 35680:case 36300:case 36308:case 36293:return QB;case 36289:case 36303:case 36311:case 36292:return WB}}var vl=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=CB(e.type)}},Ml=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=XB(e.type)}},Sl=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},yl=/(\w+)(\])?(\[|\.)?/g;function Af(i,t){i.seq.push(t),i.map[t.id]=t}function qB(i,t,e){let n=i.name,s=n.length;for(yl.lastIndex=0;;){let r=yl.exec(n),a=yl.lastIndex,o=r[1],c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===s){Af(e,l===void 0?new vl(o,i,t):new Ml(o,i,t));break}else{let d=e.map[o];d===void 0&&(d=new Sl(o),Af(e,d)),e=d}}}var $i=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=t.getActiveUniform(e,a),c=t.getUniformLocation(e,o.name);qB(o,c,this)}let s=[],r=[];for(let a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(t,c.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function gf(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var $B=37297,ZB=0;function KB(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var _f=new It;function jB(i){Vt._getMatrix(_f,Vt.workingColorSpace,i);let t=`mat3( ${_f.elements.map(e=>e.toFixed(4))} )`;switch(Vt.getTransfer(i)){case us:return[t,"LinearTransferOETF"];case qt:return[t,"sRGBTransferOETF"];default:return Tt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function yf(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+KB(i.getShaderSource(t),o)}else return r}function JB(i,t){let e=jB(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( ${e[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}var tm={[Qo]:"Linear",[Wo]:"Reinhard",[Xo]:"Cineon",[qo]:"ACESFilmic",[Zo]:"AgX",[Ko]:"Neutral",[$o]:"Custom"};function em(i,t){let e=tm[t];return e===void 0?(Tt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Va=new P;function nm(){Vt.getLuminanceCoefficients(Va);let i=Va.x.toFixed(4),t=Va.y.toFixed(4),e=Va.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function im(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Vs).join(`
`)}function sm(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function rm(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function Vs(i){return i!==""}function xf(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function vf(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var am=/^[ \t]*#include +<([\w\d./]+)>/gm;function bl(i){return i.replace(am,om)}function om(i,t){let e=zt[t];if(e===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">");return bl(e)}var lm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Mf(i){return i.replace(lm,cm)}function cm(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Sf(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var fm={[Ds]:"SHADOWMAP_TYPE_PCF",[Vi]:"SHADOWMAP_TYPE_VSM"};function hm(i){return fm[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var um={[Wi]:"ENVMAP_MODE_REFRACTION"};function dm(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":um[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var pm={[Vo]:"ENVMAP_BLENDING_MULTIPLY",[zc]:"ENVMAP_BLENDING_MIX",[Gc]:"ENVMAP_BLENDING_ADD"};function Bm(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":pm[i.combine]||"ENVMAP_BLENDING_NONE"}function mm(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,c=hm(e),l=e.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",f=dm(e),d=Bm(e),h=im(e),u=sm(r),A=s.createProgram(),y,B,p=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(y=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,u].filter(Vs).join(`
`),y.length>0&&(y+=`
`),B=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,u].filter(Vs).join(`
`),B.length>0&&(B+=`
`)):(y=[Sf(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,u,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+f:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+e.diffuseRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Vs).join(`
`),B=[Sf(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,u,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+f:"",e.envMap?"#define "+d:"",e.envMapPMREM?"#define ENVMAP_MAX_LOD "+e.envMapMaxLod+".0":"",e.envMapPMREM?"#define ENVMAP_SIZE "+e.envMapSize+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==yn?"#define TONE_MAPPING":"",e.toneMapping!==yn?zt.tonemapping_pars_fragment:"",e.toneMapping!==yn?em("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",zt.colorspace_pars_fragment,JB("linearToOutputTexel",e.outputColorSpace),nm(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Vs).join(`
`)),a=bl(a),a=xf(a,e),a=vf(a,e),o=bl(o),o=xf(o,e),o=vf(o,e),a=Mf(a),o=Mf(o),e.isRawShaderMaterial!==!0&&(p=`#version 300 es
`,y=[h,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+y,B=["#define varying in",e.glslVersion===cl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===cl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+B);let v=p+y+a,T=p+B+o,M=gf(s,s.VERTEX_SHADER,v),C=gf(s,s.FRAGMENT_SHADER,T);s.attachShader(A,M),s.attachShader(A,C),e.index0AttributeName!==void 0?s.bindAttribLocation(A,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(A,0,"position"),s.linkProgram(A);function b(R){if(i.debug.checkShaderErrors){let N=s.getProgramInfoLog(A)||"",U=s.getShaderInfoLog(M)||"",V=s.getShaderInfoLog(C)||"",E=N.trim(),H=U.trim(),k=V.trim(),Y=!0,J=!0;if(s.getProgramParameter(A,s.LINK_STATUS)===!1)if(Y=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,A,M,C);else{let W=yf(s,M,"vertex"),j=yf(s,C,"fragment");Rt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(A,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+E+`
`+W+`
`+j)}else E!==""?Tt("WebGLProgram: Program Info Log:",E):(H===""||k==="")&&(J=!1);J&&(R.diagnostics={runnable:Y,programLog:E,vertexShader:{log:H,prefix:y},fragmentShader:{log:k,prefix:B}})}s.deleteShader(M),s.deleteShader(C),m=new $i(s,A),x=rm(s,A)}let m;this.getUniforms=function(){return m===void 0&&b(this),m};let x;this.getAttributes=function(){return x===void 0&&b(this),x};let D=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return D===!1&&(D=s.getProgramParameter(A,$B)),D},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(A),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=ZB++,this.cacheKey=t,this.usedTimes=1,this.program=A,this.vertexShader=M,this.fragmentShader=C,this}var Am=0,Tl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new Cl(t),e.set(t,n)),n}},Cl=class{constructor(t){this.id=Am++,this.code=t,this.usedTimes=0}};function gm(i){return i===ei||i===Ys||i===Hs}function _m(i,t,e,n,s,r){let a=new Bs,o=new Tl,c=new Set,l=[],f=new Map,d=n.logarithmicDepthBuffer,h={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function u(m){return c.add(m),m===0?"uv":`uv${m}`}function A(m,x,D,R,N,U){let V=R.fog,E=N.geometry,H=m.isMeshStandardMaterial||m.isMeshLambertMaterial||m.isMeshPhongMaterial?R.environment:null,k=m.isMeshStandardMaterial||m.isMeshLambertMaterial&&!m.envMap||m.isMeshPhongMaterial&&!m.envMap,Y=t.get(m.envMap||H,k),J=h[m.type],W=n.precision;m.precision!==null&&(W=n.getMaxPrecision(m.precision),W!==m.precision&&Tt("WebGLProgram.getParameters:",m.precision,"not supported, using",W,"instead."));let j=E.morphAttributes.position||E.morphAttributes.normal||E.morphAttributes.color,tt=j!==void 0?j.length:0,vt=0;E.morphAttributes.position!==void 0&&(vt=1),E.morphAttributes.normal!==void 0&&(vt=2),E.morphAttributes.color!==void 0&&(vt=3);let Nt,$,pt,_t;if(J){let ut=vn[J];Nt=ut.vertexShader,$=ut.fragmentShader}else{Nt=m.vertexShader,$=m.fragmentShader;let ut=o.getVertexShaderStage(m),Zt=o.getFragmentShaderStage(m);o.update(m,ut,Zt),pt=ut.id,_t=Zt.id}let Ct=i.getRenderTarget(),Bt=i.state.buffers.depth.getReversed(),Dt=N.isInstancedMesh===!0,le=N.isBatchedMesh===!0,Et=!!m.map,$t=!!m.matcap,Kt=!!Y,Yt=Kt&&Y.isPMREMTexture===!0,xe=!!m.aoMap,he=!!m.lightMap,De=!!m.bumpMap&&m.wireframe===!1,re=!!m.normalMap,pn=!!m.displacementMap,me=!!m.emissiveMap,qe=!!m.metalnessMap,$e=!!m.roughnessMap,Ze=m.anisotropy>0,L=m.clearcoat>0,Ke=m.diffuseRoughness>0,ne=m.dispersion>0,ie=m.retroreflectivity>0,ht=m.iridescence>0,ue=m.sheen>0,wt=m.transmission>0,Pt=Ze&&!!m.anisotropyMap,S=L&&!!m.clearcoatMap,g=L&&!!m.clearcoatNormalMap,F=L&&!!m.clearcoatRoughnessMap,et=Ke&&!!m.diffuseRoughnessMap,K=ht&&!!m.iridescenceMap,st=ht&&!!m.iridescenceThicknessMap,ct=ue&&!!m.sheenColorMap,X=ue&&!!m.sheenRoughnessMap,q=!!m.specularMap,at=!!m.specularColorMap,w=!!m.specularIntensityMap,Z=wt&&!!m.transmissionMap,Q=wt&&!!m.thicknessMap,ot=!!m.gradientMap,it=!!m.alphaMap,rt=m.alphaTest>0,St=!!m.alphaHash,Ot=!!m.extensions,nt=yn;m.toneMapped&&(Ct===null||Ct.isXRRenderTarget===!0)&&(nt=i.toneMapping);let bt=Yt?Y.isCompressedCubeTexture?Y.image[0].mipmaps:Y.mipmaps:null,Ut={shaderID:J,shaderType:m.type,shaderName:m.name,vertexShader:Nt,fragmentShader:$,defines:m.defines,customVertexShaderID:pt,customFragmentShaderID:_t,isRawShaderMaterial:m.isRawShaderMaterial===!0,glslVersion:m.glslVersion,precision:W,batching:le,batchingColor:le&&N._colorsTexture!==null,instancing:Dt,instancingColor:Dt&&N.instanceColor!==null,instancingMorph:Dt&&N.morphTexture!==null,outputColorSpace:Ct===null?i.outputColorSpace:Ct.isXRRenderTarget===!0?Ct.texture.colorSpace:Vt.workingColorSpace,alphaToCoverage:!!m.alphaToCoverage,map:Et,matcap:$t,envMap:Kt,envMapMode:Kt&&Y.mapping,envMapPMREM:Yt,envMapMaxLod:Yt?bt.length-1:null,envMapSize:Yt?bt[0].width:null,aoMap:xe,lightMap:he,bumpMap:De,normalMap:re,displacementMap:pn,emissiveMap:me,normalMapObjectSpace:re&&m.normalMapType===kc,normalMapTangentSpace:re&&m.normalMapType===Ha,packedNormalMap:re&&m.normalMapType===Ha&&gm(m.normalMap.format),metalnessMap:qe,roughnessMap:$e,anisotropy:Ze,anisotropyMap:Pt,clearcoat:L,clearcoatMap:S,clearcoatNormalMap:g,clearcoatRoughnessMap:F,diffuseRoughness:Ke,diffuseRoughnessMap:et,dispersion:ne,retroreflection:ie,iridescence:ht,iridescenceMap:K,iridescenceThicknessMap:st,sheen:ue,sheenColorMap:ct,sheenRoughnessMap:X,specularMap:q,specularColorMap:at,specularIntensityMap:w,transmission:wt,transmissionMap:Z,thicknessMap:Q,gradientMap:ot,opaque:m.transparent===!1&&m.blending===Qi&&m.alphaToCoverage===!1,alphaMap:it,alphaTest:rt,alphaHash:St,combine:m.combine,mapUv:Et&&u(m.map.channel),aoMapUv:xe&&u(m.aoMap.channel),lightMapUv:he&&u(m.lightMap.channel),bumpMapUv:De&&u(m.bumpMap.channel),normalMapUv:re&&u(m.normalMap.channel),displacementMapUv:pn&&u(m.displacementMap.channel),emissiveMapUv:me&&u(m.emissiveMap.channel),metalnessMapUv:qe&&u(m.metalnessMap.channel),roughnessMapUv:$e&&u(m.roughnessMap.channel),anisotropyMapUv:Pt&&u(m.anisotropyMap.channel),clearcoatMapUv:S&&u(m.clearcoatMap.channel),clearcoatNormalMapUv:g&&u(m.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:F&&u(m.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:et&&u(m.diffuseRoughnessMap.channel),iridescenceMapUv:K&&u(m.iridescenceMap.channel),iridescenceThicknessMapUv:st&&u(m.iridescenceThicknessMap.channel),sheenColorMapUv:ct&&u(m.sheenColorMap.channel),sheenRoughnessMapUv:X&&u(m.sheenRoughnessMap.channel),specularMapUv:q&&u(m.specularMap.channel),specularColorMapUv:at&&u(m.specularColorMap.channel),specularIntensityMapUv:w&&u(m.specularIntensityMap.channel),transmissionMapUv:Z&&u(m.transmissionMap.channel),thicknessMapUv:Q&&u(m.thicknessMap.channel),alphaMapUv:it&&u(m.alphaMap.channel),vertexTangents:!!E.attributes.tangent&&(re||Ze),vertexNormals:!!E.attributes.normal,vertexColors:m.vertexColors,vertexAlphas:m.vertexColors===!0&&!!E.attributes.color&&E.attributes.color.itemSize===4,pointsUvs:N.isPoints===!0&&!!E.attributes.uv&&(Et||it),fog:!!V,useFog:m.fog===!0,fogExp2:!!V&&V.isFogExp2,flatShading:m.wireframe===!1&&(m.flatShading===!0||E.attributes.normal===void 0&&re===!1&&(m.isMeshLambertMaterial||m.isMeshPhongMaterial||m.isMeshStandardMaterial||m.isMeshPhysicalMaterial)),sizeAttenuation:m.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:Bt,skinning:N.isSkinnedMesh===!0,hasPositionAttribute:E.attributes.position!==void 0,morphTargets:E.morphAttributes.position!==void 0,morphNormals:E.morphAttributes.normal!==void 0,morphColors:E.morphAttributes.color!==void 0,morphTargetsCount:tt,morphTextureStride:vt,numSunLights:x.sun.length,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numSunLightShadows:x.sunShadowMap.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numLightProbeGrids:U.filter(ut=>ut.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:m.dithering,shadowMapEnabled:i.shadowMap.enabled&&D.length>0,shadowMapType:i.shadowMap.type,toneMapping:nt,decodeVideoTexture:Et&&m.map.isVideoTexture===!0&&Vt.getTransfer(m.map.colorSpace)===qt,decodeVideoTextureEmissive:me&&m.emissiveMap.isVideoTexture===!0&&Vt.getTransfer(m.emissiveMap.colorSpace)===qt,premultipliedAlpha:m.premultipliedAlpha,doubleSided:m.side===_n,flipSided:m.side===Le,useDepthPacking:m.depthPacking>=0,depthPacking:m.depthPacking||0,index0AttributeName:m.index0AttributeName,extensionClipCullDistance:Ot&&m.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ot&&m.extensions.multiDraw===!0||le)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:m.customProgramCacheKey()};return Ut.vertexUv1s=c.has(1),Ut.vertexUv2s=c.has(2),Ut.vertexUv3s=c.has(3),c.clear(),Ut}function y(m){let x=[];if(m.shaderID?x.push(m.shaderID):(x.push(m.customVertexShaderID),x.push(m.customFragmentShaderID)),m.defines!==void 0)for(let D in m.defines)x.push(D),x.push(m.defines[D]);return m.isRawShaderMaterial===!1&&(B(x,m),p(x,m),x.push(i.outputColorSpace)),x.push(m.customProgramCacheKey),x.join()}function B(m,x){m.push(x.precision),m.push(x.outputColorSpace),m.push(x.envMapMode),m.push(x.envMapPMREM),m.push(x.envMapMaxLod),m.push(x.envMapSize),m.push(x.mapUv),m.push(x.alphaMapUv),m.push(x.lightMapUv),m.push(x.aoMapUv),m.push(x.bumpMapUv),m.push(x.normalMapUv),m.push(x.displacementMapUv),m.push(x.emissiveMapUv),m.push(x.metalnessMapUv),m.push(x.roughnessMapUv),m.push(x.anisotropyMapUv),m.push(x.clearcoatMapUv),m.push(x.clearcoatNormalMapUv),m.push(x.clearcoatRoughnessMapUv),m.push(x.diffuseRoughnessMapUv),m.push(x.iridescenceMapUv),m.push(x.iridescenceThicknessMapUv),m.push(x.sheenColorMapUv),m.push(x.sheenRoughnessMapUv),m.push(x.specularMapUv),m.push(x.specularColorMapUv),m.push(x.specularIntensityMapUv),m.push(x.transmissionMapUv),m.push(x.thicknessMapUv),m.push(x.combine),m.push(x.fogExp2),m.push(x.sizeAttenuation),m.push(x.morphTargetsCount),m.push(x.numSunLights),m.push(x.numDirLights),m.push(x.numPointLights),m.push(x.numSpotLights),m.push(x.numSpotLightMaps),m.push(x.numHemiLights),m.push(x.numRectAreaLights),m.push(x.numSunLightShadows),m.push(x.numDirLightShadows),m.push(x.numPointLightShadows),m.push(x.numSpotLightShadows),m.push(x.numSpotLightShadowsWithMaps),m.push(x.numLightProbes),m.push(x.numLightProbeGrids),m.push(x.shadowMapType),m.push(x.toneMapping),m.push(x.numClippingPlanes),m.push(x.numClipIntersection),m.push(x.depthPacking)}function p(m,x){a.disableAll(),x.instancing&&a.enable(0),x.instancingColor&&a.enable(1),x.instancingMorph&&a.enable(2),x.matcap&&a.enable(3),x.envMap&&a.enable(4),x.normalMapObjectSpace&&a.enable(5),x.normalMapTangentSpace&&a.enable(6),x.clearcoat&&a.enable(7),x.iridescence&&a.enable(8),x.alphaTest&&a.enable(9),x.vertexColors&&a.enable(10),x.vertexAlphas&&a.enable(11),x.vertexUv1s&&a.enable(12),x.vertexUv2s&&a.enable(13),x.vertexUv3s&&a.enable(14),x.vertexTangents&&a.enable(15),x.anisotropy&&a.enable(16),x.alphaHash&&a.enable(17),x.batching&&a.enable(18),x.dispersion&&a.enable(19),x.retroreflection&&a.enable(24),x.diffuseRoughness&&a.enable(25),x.batchingColor&&a.enable(20),x.gradientMap&&a.enable(21),x.packedNormalMap&&a.enable(22),x.vertexNormals&&a.enable(23),m.push(a.mask),a.disableAll(),x.fog&&a.enable(0),x.useFog&&a.enable(1),x.flatShading&&a.enable(2),x.logarithmicDepthBuffer&&a.enable(3),x.reversedDepthBuffer&&a.enable(4),x.skinning&&a.enable(5),x.morphTargets&&a.enable(6),x.morphNormals&&a.enable(7),x.morphColors&&a.enable(8),x.premultipliedAlpha&&a.enable(9),x.shadowMapEnabled&&a.enable(10),x.doubleSided&&a.enable(11),x.flipSided&&a.enable(12),x.useDepthPacking&&a.enable(13),x.dithering&&a.enable(14),x.transmission&&a.enable(15),x.sheen&&a.enable(16),x.opaque&&a.enable(17),x.pointsUvs&&a.enable(18),x.decodeVideoTexture&&a.enable(19),x.decodeVideoTextureEmissive&&a.enable(20),x.alphaToCoverage&&a.enable(21),x.numLightProbeGrids>0&&a.enable(22),x.hasPositionAttribute&&a.enable(23),m.push(a.mask)}function v(m){let x=h[m.type],D;if(x){let R=vn[x];D=rf.clone(R.uniforms)}else D=m.uniforms;return D}function T(m,x){let D=f.get(x);return D!==void 0?++D.usedTimes:(D=new mm(i,x,m,s),l.push(D),f.set(x,D)),D}function M(m){if(--m.usedTimes===0){let x=l.indexOf(m);l[x]=l[l.length-1],l.pop(),f.delete(m.cacheKey),m.destroy()}}function C(m){o.remove(m)}function b(){o.dispose()}return{getParameters:A,getProgramCacheKey:y,getUniforms:v,acquireProgram:T,releaseProgram:M,releaseShaderCache:C,programs:l,dispose:b}}function ym(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,c){i.get(a)[o]=c}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function xm(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function bf(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Tf(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(h){let u=0;return h.isInstancedMesh&&(u+=2),h.isSkinnedMesh&&(u+=1),u}function o(h,u,A,y,B,p){let v=i[t];return v===void 0?(v={id:h.id,object:h,geometry:u,material:A,materialVariant:a(h),groupOrder:y,renderOrder:h.renderOrder,z:B,group:p},i[t]=v):(v.id=h.id,v.object=h,v.geometry=u,v.material=A,v.materialVariant=a(h),v.groupOrder=y,v.renderOrder=h.renderOrder,v.z=B,v.group=p),t++,v}function c(h,u,A,y,B,p,v){v.reversedDepth===!0&&(B=-B);let T=o(h,u,A,y,B,p);A.transmission>0?n.push(T):A.transparent===!0?s.push(T):e.push(T)}function l(h,u,A,y,B,p){let v=o(h,u,A,y,B,p);A.transmission>0?n.unshift(v):A.transparent===!0?s.unshift(v):e.unshift(v)}function f(h,u){e.length>1&&e.sort(h||xm),n.length>1&&n.sort(u||bf),s.length>1&&s.sort(u||bf)}function d(){for(let h=t,u=i.length;h<u;h++){let A=i[h];if(A.id===null)break;A.id=null,A.object=null,A.geometry=null,A.material=null,A.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:c,unshift:l,finish:d,sort:f}}function vm(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new Tf,i.set(n,[a])):s>=r.length?(a=new Tf,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function Mm(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new P,color:new Gt};break;case"SpotLight":e={position:new P,direction:new P,color:new Gt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new P,color:new Gt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new P,skyColor:new Gt,groundColor:new Gt};break;case"RectAreaLight":e={color:new Gt,position:new P,halfWidth:new P,halfHeight:new P};break}return i[t.id]=e,e}}}function Sm(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new At};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new At};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new At,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var bm=0;function Tm(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Cm(i){let t=new Mm,e=Sm(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new P);let s=new P,r=new ee,a=new ee;function o(l){let f=0,d=0,h=0;for(let U=0;U<9;U++)n.probe[U].set(0,0,0);let u=0,A=0,y=0,B=0,p=0,v=0,T=0,M=0,C=0,b=0,m=0,x=0,D=0,R=0;l.sort(Tm);for(let U=0,V=l.length;U<V;U++){let E=l[U],H=E.color,k=E.intensity,Y=E.distance,J=null;if(E.shadow&&E.shadow.map&&(E.shadow.map.texture.format===ei?J=E.shadow.map.texture:J=E.shadow.map.depthTexture||E.shadow.map.texture),E.isAmbientLight)f+=H.r*k,d+=H.g*k,h+=H.b*k;else if(E.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(E.sh.coefficients[W],k);R++}else if(E.isSunLight){let W=t.get(E);if(W.color.copy(E.color).multiplyScalar(E.intensity),E.castShadow){let j=E.shadow,tt=e.get(E);tt.shadowIntensity=j.intensity,tt.shadowBias=j.bias,tt.shadowNormalBias=j.normalBias,tt.shadowRadius=j.radius,tt.shadowMapSize.copy(j.mapSize).multiply(j.getFrameExtents()),n.sunShadow[A]=tt,n.sunShadowMap[A]=J;let vt=j.getViewportCount();for(let Nt=0;Nt<vt;Nt++)n.sunShadowMatrix[y+Nt]=j.getMatrix(Nt),n.sunShadowCascade[y+Nt]=j._cascadeData[Nt];y+=vt,A++}n.sun[u]=W,u++}else if(E.isDirectionalLight){let W=t.get(E);if(W.color.copy(E.color).multiplyScalar(E.intensity),E.castShadow){let j=E.shadow,tt=e.get(E);tt.shadowIntensity=j.intensity,tt.shadowBias=j.bias,tt.shadowNormalBias=j.normalBias,tt.shadowRadius=j.radius,tt.shadowMapSize=j.mapSize,n.directionalShadow[B]=tt,n.directionalShadowMap[B]=J,n.directionalShadowMatrix[B]=E.shadow.matrix,C++}n.directional[B]=W,B++}else if(E.isSpotLight){let W=t.get(E);W.position.setFromMatrixPosition(E.matrixWorld),W.color.copy(H).multiplyScalar(k),W.distance=Y,W.coneCos=Math.cos(E.angle),W.penumbraCos=Math.cos(E.angle*(1-E.penumbra)),W.decay=E.decay,n.spot[v]=W;let j=E.shadow;if(E.map&&(n.spotLightMap[x]=E.map,x++,j.updateMatrices(E),E.castShadow&&D++),n.spotLightMatrix[v]=j.matrix,E.castShadow){let tt=e.get(E);tt.shadowIntensity=j.intensity,tt.shadowBias=j.bias,tt.shadowNormalBias=j.normalBias,tt.shadowRadius=j.radius,tt.shadowMapSize=j.mapSize,n.spotShadow[v]=tt,n.spotShadowMap[v]=J,m++}v++}else if(E.isRectAreaLight){let W=t.get(E);W.color.copy(H).multiplyScalar(k),W.halfWidth.set(E.width*.5,0,0),W.halfHeight.set(0,E.height*.5,0),n.rectArea[T]=W,T++}else if(E.isPointLight){let W=t.get(E);if(W.color.copy(E.color).multiplyScalar(E.intensity),W.distance=E.distance,W.decay=E.decay,E.castShadow){let j=E.shadow,tt=e.get(E);tt.shadowIntensity=j.intensity,tt.shadowBias=j.bias,tt.shadowNormalBias=j.normalBias,tt.shadowRadius=j.radius,tt.shadowMapSize=j.mapSize,tt.shadowCameraNear=j.camera.near,tt.shadowCameraFar=j.camera.far,n.pointShadow[p]=tt,n.pointShadowMap[p]=J,n.pointShadowMatrix[p]=E.shadow.matrix,b++}n.point[p]=W,p++}else if(E.isHemisphereLight){let W=t.get(E);W.skyColor.copy(E.color).multiplyScalar(k),W.groundColor.copy(E.groundColor).multiplyScalar(k),n.hemi[M]=W,M++}}T>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=dt.LTC_FLOAT_1,n.rectAreaLTC2=dt.LTC_FLOAT_2):(n.rectAreaLTC1=dt.LTC_HALF_1,n.rectAreaLTC2=dt.LTC_HALF_2)),n.ambient[0]=f,n.ambient[1]=d,n.ambient[2]=h;let N=n.hash;(N.sunLength!==u||N.directionalLength!==B||N.pointLength!==p||N.spotLength!==v||N.rectAreaLength!==T||N.hemiLength!==M||N.numSunShadows!==A||N.numDirectionalShadows!==C||N.numPointShadows!==b||N.numSpotShadows!==m||N.numSpotMaps!==x||N.numLightProbes!==R)&&(n.sun.length=u,n.directional.length=B,n.spot.length=v,n.rectArea.length=T,n.point.length=p,n.hemi.length=M,n.sunShadow.length=A,n.sunShadowMap.length=A,n.sunShadowMatrix.length=y,n.sunShadowCascade.length=y,n.directionalShadow.length=C,n.directionalShadowMap.length=C,n.directionalShadowMatrix.length=C,n.pointShadow.length=b,n.pointShadowMap.length=b,n.pointShadowMatrix.length=b,n.spotShadow.length=m,n.spotShadowMap.length=m,n.spotLightMatrix.length=m+x-D,n.spotLightMap.length=x,n.numSpotLightShadowsWithMaps=D,n.numLightProbes=R,N.sunLength=u,N.directionalLength=B,N.pointLength=p,N.spotLength=v,N.rectAreaLength=T,N.hemiLength=M,N.numSunShadows=A,N.numDirectionalShadows=C,N.numPointShadows=b,N.numSpotShadows=m,N.numSpotMaps=x,N.numLightProbes=R,n.version=bm++)}function c(l,f){let d=0,h=0,u=0,A=0,y=0,B=0,p=f.matrixWorldInverse;for(let v=0,T=l.length;v<T;v++){let M=l[v];if(M.isSunLight){let C=n.sun[d];C.direction.setFromMatrixPosition(M.matrixWorld),C.direction.transformDirection(p),d++}else if(M.isDirectionalLight){let C=n.directional[h];C.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),C.direction.sub(s),C.direction.transformDirection(p),h++}else if(M.isSpotLight){let C=n.spot[A];C.position.setFromMatrixPosition(M.matrixWorld),C.position.applyMatrix4(p),C.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),C.direction.sub(s),C.direction.transformDirection(p),A++}else if(M.isRectAreaLight){let C=n.rectArea[y];C.position.setFromMatrixPosition(M.matrixWorld),C.position.applyMatrix4(p),a.identity(),r.copy(M.matrixWorld),r.premultiply(p),a.extractRotation(r),C.halfWidth.set(M.width*.5,0,0),C.halfHeight.set(0,M.height*.5,0),C.halfWidth.applyMatrix4(a),C.halfHeight.applyMatrix4(a),y++}else if(M.isPointLight){let C=n.point[u];C.position.setFromMatrixPosition(M.matrixWorld),C.position.applyMatrix4(p),u++}else if(M.isHemisphereLight){let C=n.hemi[B];C.direction.setFromMatrixPosition(M.matrixWorld),C.direction.transformDirection(p),B++}}}return{setup:o,setupView:c,state:n}}function Cf(i){let t=new Cm(i),e=[],n=[],s=[];function r(d){f.camera=d,e.length=0,n.length=0,s.length=0}function a(d){d.isLightProbeGrid?s.push(d):e.push(d)}function o(d){n.push(d)}function c(){t.setup(e),s.sort((d,h)=>d.priority-h.priority||d.id-h.id)}function l(d){t.setupView(e,d)}let f={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:f,setupLights:c,setupLightsView:l,pushLight:a,pushShadow:o}}function wm(i){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new Cf(i),t.set(s,[o])):r>=a.length?(o=new Cf(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var Em=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Rm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Im=[new P(1,0,0),new P(-1,0,0),new P(0,1,0),new P(0,-1,0),new P(0,0,1),new P(0,0,-1)],Pm=[new P(0,-1,0),new P(0,-1,0),new P(0,0,1),new P(0,0,-1),new P(0,-1,0),new P(0,-1,0)],wf=new ee,ks=new P,xl=new P;function Nm(i,t,e){let n=new qn,s=new At,r=new At,a=new se,o=new Vr,c=new Qr,l={},f=e.maxTextureSize,d={[ti]:Le,[Le]:ti,[_n]:_n},h=new gn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new At},radius:{value:4}},vertexShader:Em,fragmentShader:Rm}),u=h.clone();u.defines.HORIZONTAL_PASS=1;let A=new Ve;A.setAttribute("position",new Ue(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new Qe(A,h),B=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ds;let p=this.type;this.render=function(b,m,x){if(B.enabled===!1||B.autoUpdate===!1&&B.needsUpdate===!1||b.length===0)return;this.type===yc&&(Tt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Ds);let D=i.getRenderTarget(),R=i.getActiveCubeFace(),N=i.getActiveMipmapLevel(),U=i.state;U.setBlending(di),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);let V=p!==this.type;V&&m.traverse(function(E){E.material&&(Array.isArray(E.material)?E.material.forEach(H=>H.needsUpdate=!0):E.material.needsUpdate=!0)});for(let E=0,H=b.length;E<H;E++){let k=b[E],Y=k.shadow;if(Y===void 0){Tt("WebGLShadowMap:",k,"has no shadow.");continue}if(Y.autoUpdate===!1&&Y.needsUpdate===!1)continue;s.copy(Y.mapSize);let J=Y.getFrameExtents();s.multiply(J),r.copy(Y.mapSize),(s.x>f||s.y>f)&&(s.x>f&&(r.x=Math.floor(f/J.x),s.x=r.x*J.x,Y.mapSize.x=r.x),s.y>f&&(r.y=Math.floor(f/J.y),s.y=r.y*J.y,Y.mapSize.y=r.y));let W=i.state.buffers.depth.getReversed();if(Y.camera._reversedDepth=W,Y.map===null||V===!0){if(Y.map!==null&&(Y.map.depthTexture!==null&&(Y.map.depthTexture.dispose(),Y.map.depthTexture=null),Y.map.dispose()),this.type===Vi){if(k.isPointLight){Tt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}Y.map=new ke(s.x,s.y,{format:ei,type:un,minFilter:Pe,magFilter:Pe,generateMipmaps:!1}),Y.map.texture.name=k.name+".shadowMap",Y.map.depthTexture=new Ln(s.x,s.y,hn),Y.map.depthTexture.name=k.name+".shadowMapDepth",Y.map.depthTexture.format=Pn,Y.map.depthTexture.compareFunction=null,Y.map.depthTexture.minFilter=ye,Y.map.depthTexture.magFilter=ye}else k.isPointLight?(Y.map=new Qs(s.x),Y.map.depthTexture=new xs(s.x,fn)):(Y.map=new ke(s.x,s.y),Y.map.depthTexture=new Ln(s.x,s.y,fn)),Y.map.depthTexture.name=k.name+".shadowMap",Y.map.depthTexture.format=Pn,this.type===Ds?(Y.map.depthTexture.compareFunction=W?ol:al,Y.map.depthTexture.minFilter=Pe,Y.map.depthTexture.magFilter=Pe):(Y.map.depthTexture.compareFunction=null,Y.map.depthTexture.minFilter=ye,Y.map.depthTexture.magFilter=ye);Y.camera.updateProjectionMatrix()}Y.map.isWebGLCubeRenderTarget!==!0&&(Y.map.width!==s.x||Y.map.height!==s.y)&&Y.map.setSize(s.x,s.y);let j=Y.map.isWebGLCubeRenderTarget?6:Y.getViewportCount();k.isPointLight!==!0&&Y.updateMatrices(k,x);let tt=(Y.camera.layers.mask&4294967294)!==0?Y.camera.layers:x.layers;for(let vt=0;vt<j;vt++){let Nt=Y.getCamera(vt);if(k.isPointLight){let $=Y.camera,pt=Y.matrix,_t=k.distance||$.far;_t!==$.far&&($.far=_t,$.updateProjectionMatrix()),ks.setFromMatrixPosition(k.matrixWorld),$.position.copy(ks),xl.copy($.position),xl.add(Im[vt]),$.up.copy(Pm[vt]),$.lookAt(xl),$.updateMatrixWorld(),pt.makeTranslation(-ks.x,-ks.y,-ks.z),wf.multiplyMatrices($.projectionMatrix,$.matrixWorldInverse),Y._frustum.setFromProjectionMatrix(wf,$.coordinateSystem,$.reversedDepth)}if(Y.map.isWebGLCubeRenderTarget)i.setRenderTarget(Y.map,vt),i.clear();else{vt===0&&(i.setRenderTarget(Y.map),i.clear());let $=Y.getViewport(vt);a.set(r.x*$.x,r.y*$.y,r.x*$.z,r.y*$.w),U.viewport(a)}n=Y.getFrustum(vt),M(m,x,Nt,k,tt,this.type)}Y.isPointLightShadow!==!0&&this.type===Vi&&v(Y,x),Y.needsUpdate=!1}p=this.type,B.needsUpdate=!1,i.setRenderTarget(D,R,N)};function v(b,m){let x=t.update(y);h.defines.VSM_SAMPLES!==b.blurSamples&&(h.defines.VSM_SAMPLES=b.blurSamples,u.defines.VSM_SAMPLES=b.blurSamples,h.needsUpdate=!0,u.needsUpdate=!0),b.mapPass===null?b.mapPass=new ke(s.x,s.y,{format:ei,type:un}):(b.mapPass.width!==b.map.width||b.mapPass.height!==b.map.height)&&b.mapPass.setSize(b.map.width,b.map.height),h.uniforms.shadow_pass.value=b.map.depthTexture,h.uniforms.resolution.value.set(b.map.width,b.map.height),h.uniforms.radius.value=b.radius,i.setRenderTarget(b.mapPass),i.clear(),i.renderBufferDirect(m,null,x,h,y,null),u.uniforms.shadow_pass.value=b.mapPass.texture,u.uniforms.resolution.value.set(b.map.width,b.map.height),u.uniforms.radius.value=b.radius,i.setRenderTarget(b.map),i.clear(),i.renderBufferDirect(m,null,x,u,y,null)}function T(b,m,x,D){let R=null,N=x.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(N!==void 0)R=N;else if(R=x.isPointLight===!0?c:o,i.localClippingEnabled&&m.clipShadows===!0&&Array.isArray(m.clippingPlanes)&&m.clippingPlanes.length!==0||m.displacementMap&&m.displacementScale!==0||m.alphaMap&&m.alphaTest>0||m.map&&m.alphaTest>0||m.alphaToCoverage===!0){let U=R.uuid,V=m.uuid,E=l[U];E===void 0&&(E={},l[U]=E);let H=E[V];H===void 0&&(H=R.clone(),E[V]=H,m.addEventListener("dispose",C)),R=H}if(R.visible=m.visible,R.wireframe=m.wireframe,D===Vi?R.side=m.shadowSide!==null?m.shadowSide:m.side:R.side=m.shadowSide!==null?m.shadowSide:d[m.side],R.alphaMap=m.alphaMap,R.alphaTest=m.alphaToCoverage===!0?.5:m.alphaTest,R.map=m.map,R.clipShadows=m.clipShadows,R.clippingPlanes=m.clippingPlanes,R.clipIntersection=m.clipIntersection,R.displacementMap=m.displacementMap,R.displacementScale=m.displacementScale,R.displacementBias=m.displacementBias,R.wireframeLinewidth=m.wireframeLinewidth,R.linewidth=m.linewidth,x.isPointLight===!0&&R.isMeshDistanceMaterial===!0){let U=i.properties.get(R);U.light=x}return R}function M(b,m,x,D,R,N){if(b.visible===!1)return;if(b.layers.test(R)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&N===Vi)&&(!b.frustumCulled||b.intersectsFrustum(n))){b.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,b.matrixWorld);let E=t.update(b),H=b.material;if(Array.isArray(H)){let k=E.groups;for(let Y=0,J=k.length;Y<J;Y++){let W=k[Y],j=H[W.materialIndex];if(j&&j.visible){let tt=T(b,j,D,N);b.onBeforeShadow(i,b,m,x,E,tt,W),i.renderBufferDirect(x,null,E,tt,b,W),b.onAfterShadow(i,b,m,x,E,tt,W)}}}else if(H.visible){let k=T(b,H,D,N);b.onBeforeShadow(i,b,m,x,E,k,null),i.renderBufferDirect(x,null,E,k,b,null),b.onAfterShadow(i,b,m,x,E,k,null)}}let V=b.children;for(let E=0,H=V.length;E<H;E++)M(V[E],m,x,D,R,N)}function C(b){b.target.removeEventListener("dispose",C);for(let x in l){let D=l[x],R=b.target.uuid;R in D&&(D[R].dispose(),delete D[R])}}}function Lm(i,t){function e(){let w=!1,Z=new se,Q=null,ot=new se(0,0,0,0);return{setMask:function(it){Q!==it&&!w&&(i.colorMask(it,it,it,it),Q=it)},setLocked:function(it){w=it},setClear:function(it,rt,St,Ot,nt){nt===!0&&(it*=Ot,rt*=Ot,St*=Ot),Z.set(it,rt,St,Ot),ot.equals(Z)===!1&&(i.clearColor(it,rt,St,Ot),ot.copy(Z))},reset:function(){w=!1,Q=null,ot.set(-1,0,0,0)}}}function n(){let w=!1,Z=!1,Q=null,ot=null,it=null;return{setReversed:function(rt){if(Z!==rt){let St=t.get("EXT_clip_control");rt?St.clipControlEXT(St.LOWER_LEFT_EXT,St.ZERO_TO_ONE_EXT):St.clipControlEXT(St.LOWER_LEFT_EXT,St.NEGATIVE_ONE_TO_ONE_EXT),Z=rt;let Ot=it;it=null,this.setClear(Ot)}},getReversed:function(){return Z},setTest:function(rt){rt?Bt(i.DEPTH_TEST):Dt(i.DEPTH_TEST)},setMask:function(rt){Q!==rt&&!w&&(i.depthMask(rt),Q=rt)},setFunc:function(rt){if(Z&&(rt=tf[rt]),ot!==rt){switch(rt){case xr:i.depthFunc(i.NEVER);break;case vr:i.depthFunc(i.ALWAYS);break;case Mr:i.depthFunc(i.LESS);break;case Pi:i.depthFunc(i.LEQUAL);break;case Sr:i.depthFunc(i.EQUAL);break;case br:i.depthFunc(i.GEQUAL);break;case Tr:i.depthFunc(i.GREATER);break;case Cr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}ot=rt}},setLocked:function(rt){w=rt},setClear:function(rt){it!==rt&&(it=rt,Z&&(rt=1-rt),i.clearDepth(rt))},reset:function(){w=!1,Q=null,ot=null,it=null,Z=!1}}}function s(){let w=!1,Z=null,Q=null,ot=null,it=null,rt=null,St=null,Ot=null,nt=null;return{setTest:function(bt){w||(bt?Bt(i.STENCIL_TEST):Dt(i.STENCIL_TEST))},setMask:function(bt){Z!==bt&&!w&&(i.stencilMask(bt),Z=bt)},setFunc:function(bt,Ut,ut){(Q!==bt||ot!==Ut||it!==ut)&&(i.stencilFunc(bt,Ut,ut),Q=bt,ot=Ut,it=ut)},setOp:function(bt,Ut,ut){(rt!==bt||St!==Ut||Ot!==ut)&&(i.stencilOp(bt,Ut,ut),rt=bt,St=Ut,Ot=ut)},setLocked:function(bt){w=bt},setClear:function(bt){nt!==bt&&(i.clearStencil(bt),nt=bt)},reset:function(){w=!1,Z=null,Q=null,ot=null,it=null,rt=null,St=null,Ot=null,nt=null}}}let r=new e,a=new n,o=new s,c={},l=new WeakMap,f={},d={},h={},u=new WeakMap,A=[],y=null,B=!1,p=null,v=null,T=null,M=null,C=null,b=null,m=null,x=new Gt(0,0,0),D=0,R=!1,N=null,U=null,V=null,E=null,H=null,k=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Y=!1,J=0,W=i.getParameter(i.VERSION);W.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(W)[1]),Y=J>=1):W.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),Y=J>=2);let j=null,tt={},vt=i.getParameter(i.SCISSOR_BOX),Nt=i.getParameter(i.VIEWPORT),$=new se().fromArray(vt),pt=new se().fromArray(Nt);function _t(w,Z,Q,ot){let it=new Uint8Array(4),rt=i.createTexture();i.bindTexture(w,rt),i.texParameteri(w,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(w,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let St=0;St<Q;St++)w===i.TEXTURE_3D||w===i.TEXTURE_2D_ARRAY?i.texImage3D(Z,0,i.RGBA,1,1,ot,0,i.RGBA,i.UNSIGNED_BYTE,it):i.texImage2D(Z+St,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,it);return rt}let Ct={};Ct[i.TEXTURE_2D]=_t(i.TEXTURE_2D,i.TEXTURE_2D,1),Ct[i.TEXTURE_CUBE_MAP]=_t(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Ct[i.TEXTURE_2D_ARRAY]=_t(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Ct[i.TEXTURE_3D]=_t(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),Bt(i.DEPTH_TEST),a.setFunc(Pi),De(!1),re(Fo),Bt(i.CULL_FACE),xe(di);function Bt(w){f[w]!==!0&&(i.enable(w),f[w]=!0)}function Dt(w){f[w]!==!1&&(i.disable(w),f[w]=!1)}function le(w,Z){return h[w]!==Z?(i.bindFramebuffer(w,Z),h[w]=Z,w===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=Z),w===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=Z),!0):!1}function Et(w,Z){let Q=A,ot=!1;if(w){Q=u.get(Z),Q===void 0&&(Q=[],u.set(Z,Q));let it=w.textures;if(Q.length!==it.length||Q[0]!==i.COLOR_ATTACHMENT0){for(let rt=0,St=it.length;rt<St;rt++)Q[rt]=i.COLOR_ATTACHMENT0+rt;Q.length=it.length,ot=!0}}else Q[0]!==i.BACK&&(Q[0]=i.BACK,ot=!0);ot&&i.drawBuffers(Q)}function $t(w){return y!==w?(i.useProgram(w),y=w,!0):!1}let Kt={[pi]:i.FUNC_ADD,[vc]:i.FUNC_SUBTRACT,[Mc]:i.FUNC_REVERSE_SUBTRACT};Kt[Sc]=i.MIN,Kt[bc]=i.MAX;let Yt={[Tc]:i.ZERO,[Cc]:i.ONE,[wc]:i.SRC_COLOR,[Ho]:i.SRC_ALPHA,[Lc]:i.SRC_ALPHA_SATURATE,[Pc]:i.DST_COLOR,[Rc]:i.DST_ALPHA,[Ec]:i.ONE_MINUS_SRC_COLOR,[ko]:i.ONE_MINUS_SRC_ALPHA,[Nc]:i.ONE_MINUS_DST_COLOR,[Ic]:i.ONE_MINUS_DST_ALPHA,[Dc]:i.CONSTANT_COLOR,[Uc]:i.ONE_MINUS_CONSTANT_COLOR,[Oc]:i.CONSTANT_ALPHA,[Fc]:i.ONE_MINUS_CONSTANT_ALPHA};function xe(w,Z,Q,ot,it,rt,St,Ot,nt,bt){if(w===di){B===!0&&(Dt(i.BLEND),B=!1);return}if(B===!1&&(Bt(i.BLEND),B=!0),w!==xc){if(w!==p||bt!==R){if((v!==pi||C!==pi)&&(i.blendEquation(i.FUNC_ADD),v=pi,C=pi),bt)switch(w){case Qi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case zo:i.blendFunc(i.ONE,i.ONE);break;case Go:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Yo:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Rt("WebGLState: Invalid blending: ",w);break}else switch(w){case Qi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case zo:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Go:Rt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Yo:Rt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Rt("WebGLState: Invalid blending: ",w);break}T=null,M=null,b=null,m=null,x.set(0,0,0),D=0,p=w,R=bt}return}it=it||Z,rt=rt||Q,St=St||ot,(Z!==v||it!==C)&&(i.blendEquationSeparate(Kt[Z],Kt[it]),v=Z,C=it),(Q!==T||ot!==M||rt!==b||St!==m)&&(i.blendFuncSeparate(Yt[Q],Yt[ot],Yt[rt],Yt[St]),T=Q,M=ot,b=rt,m=St),(Ot.equals(x)===!1||nt!==D)&&(i.blendColor(Ot.r,Ot.g,Ot.b,nt),x.copy(Ot),D=nt),p=w,R=!1}function he(w,Z){w.side===_n?Dt(i.CULL_FACE):Bt(i.CULL_FACE);let Q=w.side===Le;Z&&(Q=!Q),De(Q),w.blending===Qi&&w.transparent===!1?xe(di):xe(w.blending,w.blendEquation,w.blendSrc,w.blendDst,w.blendEquationAlpha,w.blendSrcAlpha,w.blendDstAlpha,w.blendColor,w.blendAlpha,w.premultipliedAlpha),a.setFunc(w.depthFunc),a.setTest(w.depthTest),a.setMask(w.depthWrite),r.setMask(w.colorWrite);let ot=w.stencilWrite;o.setTest(ot),ot&&(o.setMask(w.stencilWriteMask),o.setFunc(w.stencilFunc,w.stencilRef,w.stencilFuncMask),o.setOp(w.stencilFail,w.stencilZFail,w.stencilZPass)),me(w.polygonOffset,w.polygonOffsetFactor,w.polygonOffsetUnits),w.alphaToCoverage===!0?Bt(i.SAMPLE_ALPHA_TO_COVERAGE):Dt(i.SAMPLE_ALPHA_TO_COVERAGE)}function De(w){N!==w&&(w?i.frontFace(i.CW):i.frontFace(i.CCW),N=w)}function re(w){w!==gc?(Bt(i.CULL_FACE),w!==U&&(w===Fo?i.cullFace(i.BACK):w===_c?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Dt(i.CULL_FACE),U=w}function pn(w){w!==V&&(Y&&i.lineWidth(w),V=w)}function me(w,Z,Q){w?(Bt(i.POLYGON_OFFSET_FILL),(E!==Z||H!==Q)&&(E=Z,H=Q,a.getReversed()&&(Z=-Z,Q=-Q),i.polygonOffset(Z,Q))):Dt(i.POLYGON_OFFSET_FILL)}function qe(w){w?Bt(i.SCISSOR_TEST):Dt(i.SCISSOR_TEST)}function $e(w){w===void 0&&(w=i.TEXTURE0+k-1),j!==w&&(i.activeTexture(w),j=w)}function Ze(w,Z,Q){Q===void 0&&(j===null?Q=i.TEXTURE0+k-1:Q=j);let ot=tt[Q];ot===void 0&&(ot={type:void 0,texture:void 0},tt[Q]=ot),(ot.type!==w||ot.texture!==Z)&&(j!==Q&&(i.activeTexture(Q),j=Q),i.bindTexture(w,Z||Ct[w]),ot.type=w,ot.texture=Z)}function L(){let w=tt[j];w!==void 0&&w.type!==void 0&&(i.bindTexture(w.type,null),w.type=void 0,w.texture=void 0)}function Ke(){try{i.compressedTexImage2D(...arguments)}catch(w){Rt("WebGLState:",w)}}function ne(){try{i.compressedTexImage3D(...arguments)}catch(w){Rt("WebGLState:",w)}}function ie(){try{i.texSubImage2D(...arguments)}catch(w){Rt("WebGLState:",w)}}function ht(){try{i.texSubImage3D(...arguments)}catch(w){Rt("WebGLState:",w)}}function ue(){try{i.compressedTexSubImage2D(...arguments)}catch(w){Rt("WebGLState:",w)}}function wt(){try{i.compressedTexSubImage3D(...arguments)}catch(w){Rt("WebGLState:",w)}}function Pt(){try{i.texStorage2D(...arguments)}catch(w){Rt("WebGLState:",w)}}function S(){try{i.texStorage3D(...arguments)}catch(w){Rt("WebGLState:",w)}}function g(){try{i.texImage2D(...arguments)}catch(w){Rt("WebGLState:",w)}}function F(){try{i.texImage3D(...arguments)}catch(w){Rt("WebGLState:",w)}}function et(w){return d[w]!==void 0?d[w]:i.getParameter(w)}function K(w,Z){d[w]!==Z&&(i.pixelStorei(w,Z),d[w]=Z)}function st(w){$.equals(w)===!1&&(i.scissor(w.x,w.y,w.z,w.w),$.copy(w))}function ct(w){pt.equals(w)===!1&&(i.viewport(w.x,w.y,w.z,w.w),pt.copy(w))}function X(w,Z){let Q=l.get(Z);Q===void 0&&(Q=new WeakMap,l.set(Z,Q));let ot=Q.get(w);ot===void 0&&(ot=i.getUniformBlockIndex(Z,w.name),i.uniformBlockBinding(Z,ot,ot),Q.set(w,ot))}function q(w,Z,Q){let it=l.get(Z).get(w);c[it]!==Q&&(i.bindBufferBase(i.UNIFORM_BUFFER,it,Q),c[it]=Q)}function at(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),f={},d={},j=null,tt={},h={},c={},u=new WeakMap,A=[],y=null,B=!1,p=null,v=null,T=null,M=null,C=null,b=null,m=null,x=new Gt(0,0,0),D=0,R=!1,N=null,U=null,V=null,E=null,H=null,$.set(0,0,i.canvas.width,i.canvas.height),pt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:Bt,disable:Dt,bindFramebuffer:le,drawBuffers:Et,useProgram:$t,setBlending:xe,setMaterial:he,setFlipSided:De,setCullFace:re,setLineWidth:pn,setPolygonOffset:me,setScissorTest:qe,activeTexture:$e,bindTexture:Ze,unbindTexture:L,compressedTexImage2D:Ke,compressedTexImage3D:ne,texImage2D:g,texImage3D:F,pixelStorei:K,getParameter:et,updateUBOMapping:X,uniformBlockBinding:q,texStorage2D:Pt,texStorage3D:S,texSubImage2D:ie,texSubImage3D:ht,compressedTexSubImage2D:ue,compressedTexSubImage3D:wt,scissor:st,viewport:ct,reset:at}}function Dm(i,t,e,n,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new At,f=new WeakMap,d=new Set,h,u=new WeakMap,A=new Set,y=new FinalizationRegistry(S=>A.delete(S)),B=!1;try{B=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function p(S,g){return B?new OffscreenCanvas(S,g):ds("canvas")}function v(S,g,F){let et=1,K=Pt(S);if((K.width>F||K.height>F)&&(et=F/Math.max(K.width,K.height)),et<1)if(typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&S instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&S instanceof ImageBitmap||typeof VideoFrame<"u"&&S instanceof VideoFrame){let st=Math.floor(et*K.width),ct=Math.floor(et*K.height);h===void 0&&(h=p(st,ct));let X=g?p(st,ct):h;return X.width=st,X.height=ct,X.getContext("2d").drawImage(S,0,0,st,ct),Tt("WebGLRenderer: Texture has been resized from ("+K.width+"x"+K.height+") to ("+st+"x"+ct+")."),X}else return"data"in S&&Tt("WebGLRenderer: Image in DataTexture is too big ("+K.width+"x"+K.height+")."),S;return S}function T(S){return S.generateMipmaps}function M(S){i.generateMipmap(S)}function C(S){return S.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:S.isWebGL3DRenderTarget?i.TEXTURE_3D:S.isWebGLArrayRenderTarget||S.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function b(S,g,F,et,K,st=!1){if(S!==null){if(i[S]!==void 0)return i[S];Tt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+S+"'")}let ct;et&&(ct=t.get("EXT_texture_norm16"),ct||Tt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let X=g;if(g===i.RED&&(F===i.FLOAT&&(X=i.R32F),F===i.HALF_FLOAT&&(X=i.R16F),F===i.UNSIGNED_BYTE&&(X=i.R8),F===i.UNSIGNED_SHORT&&ct&&(X=ct.R16_EXT),F===i.SHORT&&ct&&(X=ct.R16_SNORM_EXT)),g===i.RED_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.R8UI),F===i.UNSIGNED_SHORT&&(X=i.R16UI),F===i.UNSIGNED_INT&&(X=i.R32UI),F===i.BYTE&&(X=i.R8I),F===i.SHORT&&(X=i.R16I),F===i.INT&&(X=i.R32I)),g===i.RG&&(F===i.FLOAT&&(X=i.RG32F),F===i.HALF_FLOAT&&(X=i.RG16F),F===i.UNSIGNED_BYTE&&(X=i.RG8),F===i.UNSIGNED_SHORT&&ct&&(X=ct.RG16_EXT),F===i.SHORT&&ct&&(X=ct.RG16_SNORM_EXT)),g===i.RG_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.RG8UI),F===i.UNSIGNED_SHORT&&(X=i.RG16UI),F===i.UNSIGNED_INT&&(X=i.RG32UI),F===i.BYTE&&(X=i.RG8I),F===i.SHORT&&(X=i.RG16I),F===i.INT&&(X=i.RG32I)),g===i.RGB_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.RGB8UI),F===i.UNSIGNED_SHORT&&(X=i.RGB16UI),F===i.UNSIGNED_INT&&(X=i.RGB32UI),F===i.BYTE&&(X=i.RGB8I),F===i.SHORT&&(X=i.RGB16I),F===i.INT&&(X=i.RGB32I)),g===i.RGBA_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.RGBA8UI),F===i.UNSIGNED_SHORT&&(X=i.RGBA16UI),F===i.UNSIGNED_INT&&(X=i.RGBA32UI),F===i.BYTE&&(X=i.RGBA8I),F===i.SHORT&&(X=i.RGBA16I),F===i.INT&&(X=i.RGBA32I)),g===i.RGB&&(F===i.UNSIGNED_SHORT&&ct&&(X=ct.RGB16_EXT),F===i.SHORT&&ct&&(X=ct.RGB16_SNORM_EXT),F===i.UNSIGNED_INT_5_9_9_9_REV&&(X=i.RGB9_E5),F===i.UNSIGNED_INT_10F_11F_11F_REV&&(X=i.R11F_G11F_B10F)),g===i.RGBA){let q=st?us:Vt.getTransfer(K);F===i.FLOAT&&(X=i.RGBA32F),F===i.HALF_FLOAT&&(X=i.RGBA16F),F===i.UNSIGNED_BYTE&&(X=q===qt?i.SRGB8_ALPHA8:i.RGBA8),F===i.UNSIGNED_SHORT&&ct&&(X=ct.RGBA16_EXT),F===i.SHORT&&ct&&(X=ct.RGBA16_SNORM_EXT),F===i.UNSIGNED_SHORT_4_4_4_4&&(X=i.RGBA4),F===i.UNSIGNED_SHORT_5_5_5_1&&(X=i.RGB5_A1)}return(X===i.R16F||X===i.R32F||X===i.RG16F||X===i.RG32F||X===i.RGBA16F||X===i.RGBA32F)&&t.get("EXT_color_buffer_float"),X}function m(S,g){let F;return S?g===null||g===fn||g===mi?F=i.DEPTH24_STENCIL8:g===hn?F=i.DEPTH32F_STENCIL8:g===Xi&&(F=i.DEPTH24_STENCIL8,Tt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===fn||g===mi?F=i.DEPTH_COMPONENT24:g===hn?F=i.DEPTH_COMPONENT32F:g===Xi&&(F=i.DEPTH_COMPONENT16),F}function x(S,g){return T(S)===!0||S.isFramebufferTexture&&S.minFilter!==ye&&S.minFilter!==Pe?Math.log2(Math.max(g.width,g.height))+1:S.mipmaps.length>0?S.mipmaps.length:S.isCompressedTexture&&Array.isArray(S.image)?g.mipmaps.length:1}function D(S){let g=new WeakRef(S);n.get(S).__ref=g,A.add(g),y.register(S,g,g)}function R(S){let g=n.get(S).__ref;g!==void 0&&(A.delete(g),y.unregister(g))}function N(S){V(S.target)}function U(S){E(S.target)}function V(S){S.removeEventListener("dispose",N),R(S),k(S),S.isVideoTexture&&f.delete(S),S.isHTMLTexture&&d.delete(S)}function E(S){S.removeEventListener("dispose",U),R(S),J(S)}function H(){for(let S of A){let g=S.deref();g!==void 0&&(g.isRenderTarget===!0?E(g):V(g))}A.clear(),d.clear()}function k(S){let g=n.get(S);if(g.__webglInit===void 0)return;let F=S.source,et=u.get(F);if(et){let K=et[g.__cacheKey];K.usedTimes--,K.usedTimes===0&&Y(S),Object.keys(et).length===0&&u.delete(F)}n.remove(S)}function Y(S){let g=n.get(S);i.deleteTexture(g.__webglTexture);let F=S.source,et=u.get(F);delete et[g.__cacheKey],a.memory.textures--}function J(S){let g=n.get(S);g.__depthDisposeCallback&&g.__depthDisposeCallback();let F=S.depthTexture;if(F&&F.renderTarget===S&&V(F),S.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(g.__webglFramebuffer[K]))for(let st=0;st<g.__webglFramebuffer[K].length;st++)i.deleteFramebuffer(g.__webglFramebuffer[K][st]);else i.deleteFramebuffer(g.__webglFramebuffer[K]);g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer[K])}else{if(Array.isArray(g.__webglFramebuffer))for(let K=0;K<g.__webglFramebuffer.length;K++)i.deleteFramebuffer(g.__webglFramebuffer[K]);else i.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&i.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let K=0;K<g.__webglColorRenderbuffer.length;K++)g.__webglColorRenderbuffer[K]&&i.deleteRenderbuffer(g.__webglColorRenderbuffer[K]);g.__webglDepthRenderbuffer&&i.deleteRenderbuffer(g.__webglDepthRenderbuffer)}let et=S.textures;for(let K=0,st=et.length;K<st;K++){let ct=n.get(et[K]);ct.__webglTexture&&(i.deleteTexture(ct.__webglTexture),a.memory.textures--),n.remove(et[K])}n.remove(S)}let W=0;function j(){W=0}function tt(){return W}function vt(S){W=S}function Nt(){let S=W;return S>=s.maxTextures&&Tt("WebGLTextures: Trying to use "+(S+1)+" texture units while this GPU supports only "+s.maxTextures),W+=1,S}function $(S){let g=[];return g.push(S.wrapS),g.push(S.wrapT),g.push(S.wrapR||0),g.push(S.magFilter),g.push(S.minFilter),g.push(S.anisotropy),g.push(S.internalFormat),g.push(S.format),g.push(S.type),g.push(S.generateMipmaps),g.push(S.mipmapsAutoUpdate),g.push(S.premultiplyAlpha),g.push(S.flipY),g.push(S.unpackAlignment),g.push(S.colorSpace),g.join()}function pt(S,g){let F=n.get(S);if(S.isVideoTexture&&ue(S),S.isRenderTargetTexture===!1&&S.isExternalTexture!==!0&&S.version>0&&F.__version!==S.version){let et=S.image;if(et===null)Tt("WebGLRenderer: Texture marked for update but no image data found.");else if(et.complete===!1)Tt("WebGLRenderer: Texture marked for update but image is incomplete");else{he(F,S,g);return}}else S.isExternalTexture&&(F.__webglTexture=S.sourceTexture?S.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,F.__webglTexture,i.TEXTURE0+g)}function _t(S,g){let F=n.get(S);if(S.isRenderTargetTexture===!1&&S.version>0&&F.__version!==S.version){he(F,S,g);return}else S.isExternalTexture&&(F.__webglTexture=S.sourceTexture?S.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,F.__webglTexture,i.TEXTURE0+g)}function Ct(S,g){let F=n.get(S);if(S.isRenderTargetTexture===!1&&S.version>0&&F.__version!==S.version){he(F,S,g);return}e.bindTexture(i.TEXTURE_3D,F.__webglTexture,i.TEXTURE0+g)}function Bt(S,g){let F=n.get(S);if(S.version>0&&F.__version!==S.version){De(F,S,g);return}e.bindTexture(i.TEXTURE_CUBE_MAP,F.__webglTexture,i.TEXTURE0+g)}let Dt={[wr]:i.REPEAT,[mn]:i.CLAMP_TO_EDGE,[Er]:i.MIRRORED_REPEAT},le={[ye]:i.NEAREST,[Yc]:i.NEAREST_MIPMAP_NEAREST,[Us]:i.NEAREST_MIPMAP_LINEAR,[Pe]:i.LINEAR,[ra]:i.LINEAR_MIPMAP_NEAREST,[Dn]:i.LINEAR_MIPMAP_LINEAR},Et={[Qc]:i.NEVER,[ll]:i.ALWAYS,[Wc]:i.LESS,[al]:i.LEQUAL,[Xc]:i.EQUAL,[ol]:i.GEQUAL,[qc]:i.GREATER,[$c]:i.NOTEQUAL};function $t(S,g){if(g.type===hn&&t.has("OES_texture_float_linear")===!1&&(g.magFilter===Pe||g.magFilter===ra||g.magFilter===Us||g.magFilter===Dn||g.minFilter===Pe||g.minFilter===ra||g.minFilter===Us||g.minFilter===Dn)&&Tt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(S,i.TEXTURE_WRAP_S,Dt[g.wrapS]),i.texParameteri(S,i.TEXTURE_WRAP_T,Dt[g.wrapT]),(S===i.TEXTURE_3D||S===i.TEXTURE_2D_ARRAY)&&i.texParameteri(S,i.TEXTURE_WRAP_R,Dt[g.wrapR]),i.texParameteri(S,i.TEXTURE_MAG_FILTER,le[g.magFilter]),i.texParameteri(S,i.TEXTURE_MIN_FILTER,le[g.minFilter]),g.compareFunction&&(i.texParameteri(S,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(S,i.TEXTURE_COMPARE_FUNC,Et[g.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===ye||g.minFilter!==Us&&g.minFilter!==Dn||g.type===hn&&t.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||n.get(g).__currentAnisotropy){let F=t.get("EXT_texture_filter_anisotropic");i.texParameterf(S,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,s.getMaxAnisotropy())),n.get(g).__currentAnisotropy=g.anisotropy}}}function Kt(S,g){let F=!1;S.__webglInit===void 0&&(S.__webglInit=!0,g.addEventListener("dispose",N),D(g));let et=g.source,K=u.get(et);K===void 0&&(K={},u.set(et,K));let st=$(g);if(st!==S.__cacheKey){K[st]===void 0&&(K[st]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,F=!0),K[st].usedTimes++;let ct=K[S.__cacheKey];ct!==void 0&&(K[S.__cacheKey].usedTimes--,ct.usedTimes===0&&Y(g)),S.__cacheKey=st,S.__webglTexture=K[st].texture}return F}function Yt(S,g,F){return Math.floor(Math.floor(S/F)/g)}function xe(S,g,F,et){let st=S.updateRanges;if(st.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,g.width,g.height,F,et,g.data);else{st.sort((w,Z)=>w.start-Z.start);let ct=0;for(let w=1;w<st.length;w++){let Z=st[ct],Q=st[w],ot=Z.start+Z.count,it=Yt(Q.start,g.width,4),rt=Yt(Z.start,g.width,4);Q.start<=ot+1&&it===rt&&Yt(Q.start+Q.count-1,g.width,4)===it?Z.count=Math.max(Z.count,Q.start+Q.count-Z.start):(++ct,st[ct]=Q)}st.length=ct+1;let X=e.getParameter(i.UNPACK_ROW_LENGTH),q=e.getParameter(i.UNPACK_SKIP_PIXELS),at=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,g.width);for(let w=0,Z=st.length;w<Z;w++){let Q=st[w],ot=Math.floor(Q.start/4),it=Math.ceil(Q.count/4),rt=ot%g.width,St=Math.floor(ot/g.width),Ot=it,nt=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,rt),e.pixelStorei(i.UNPACK_SKIP_ROWS,St),e.texSubImage2D(i.TEXTURE_2D,0,rt,St,Ot,nt,F,et,g.data)}S.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,X),e.pixelStorei(i.UNPACK_SKIP_PIXELS,q),e.pixelStorei(i.UNPACK_SKIP_ROWS,at)}}function he(S,g,F){let et=i.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(et=i.TEXTURE_2D_ARRAY),g.isData3DTexture&&(et=i.TEXTURE_3D);let K=Kt(S,g),st=g.source;e.bindTexture(et,S.__webglTexture,i.TEXTURE0+F);let ct=n.get(st);if(st.version!==ct.__version||K===!0){if(e.activeTexture(i.TEXTURE0+F),(typeof ImageBitmap<"u"&&g.image instanceof ImageBitmap)===!1){let nt=Vt.getPrimaries(Vt.workingColorSpace),bt=g.colorSpace===On?null:Vt.getPrimaries(g.colorSpace),Ut=g.colorSpace===On||nt===bt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ut)}e.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment);let q=v(g.image,!1,s.maxTextureSize);q=wt(g,q);let at=r.convert(g.format,g.colorSpace),w=r.convert(g.type),Z=b(g.internalFormat,at,w,g.normalized,g.colorSpace,g.isVideoTexture);$t(et,g);let Q,ot=g.mipmaps,it=g.isVideoTexture!==!0,rt=ct.__version===void 0||K===!0,St=st.dataReady,Ot=x(g,q);if(g.isDepthTexture)Z=m(g.format===Un,g.type),rt&&(it?e.texStorage2D(i.TEXTURE_2D,1,Z,q.width,q.height):e.texImage2D(i.TEXTURE_2D,0,Z,q.width,q.height,0,at,w,null));else if(g.isDataTexture)if(ot.length>0){it&&rt&&e.texStorage2D(i.TEXTURE_2D,Ot,Z,ot[0].width,ot[0].height);for(let nt=0,bt=ot.length;nt<bt;nt++)Q=ot[nt],it?St&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,Q.width,Q.height,at,w,Q.data):e.texImage2D(i.TEXTURE_2D,nt,Z,Q.width,Q.height,0,at,w,Q.data);g.generateMipmaps=!1}else it?(rt&&e.texStorage2D(i.TEXTURE_2D,Ot,Z,q.width,q.height),St&&xe(g,q,at,w)):e.texImage2D(i.TEXTURE_2D,0,Z,q.width,q.height,0,at,w,q.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){it&&rt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Ot,Z,ot[0].width,ot[0].height,q.depth);for(let nt=0,bt=ot.length;nt<bt;nt++)if(Q=ot[nt],g.format!==dn)if(at!==null)if(it){if(St)if(g.layerUpdates.size>0){let Ut=_l(Q.width,Q.height,g.format,g.type);for(let ut of g.layerUpdates){let Zt=Q.data.subarray(ut*Ut/Q.data.BYTES_PER_ELEMENT,(ut+1)*Ut/Q.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,ut,Q.width,Q.height,1,at,Zt)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,0,Q.width,Q.height,q.depth,at,Q.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,nt,Z,Q.width,Q.height,q.depth,0,Q.data,0,0);else Tt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else it?St&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,0,Q.width,Q.height,q.depth,at,w,Q.data):e.texImage3D(i.TEXTURE_2D_ARRAY,nt,Z,Q.width,Q.height,q.depth,0,at,w,Q.data);g.layerUpdates.size>0&&g.clearLayerUpdates()}else{it&&rt&&e.texStorage2D(i.TEXTURE_2D,Ot,Z,ot[0].width,ot[0].height);for(let nt=0,bt=ot.length;nt<bt;nt++)Q=ot[nt],g.format!==dn?at!==null?it?St&&e.compressedTexSubImage2D(i.TEXTURE_2D,nt,0,0,Q.width,Q.height,at,Q.data):e.compressedTexImage2D(i.TEXTURE_2D,nt,Z,Q.width,Q.height,0,Q.data):Tt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):it?St&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,Q.width,Q.height,at,w,Q.data):e.texImage2D(i.TEXTURE_2D,nt,Z,Q.width,Q.height,0,at,w,Q.data)}else if(g.isDataArrayTexture)if(it){if(rt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Ot,Z,q.width,q.height,q.depth),St)if(g.layerUpdates.size>0){let nt=_l(q.width,q.height,g.format,g.type);for(let bt of g.layerUpdates){let Ut=q.data.subarray(bt*nt/q.data.BYTES_PER_ELEMENT,(bt+1)*nt/q.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,bt,q.width,q.height,1,at,w,Ut)}g.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,q.width,q.height,q.depth,at,w,q.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Z,q.width,q.height,q.depth,0,at,w,q.data);else if(g.isData3DTexture)it?(rt&&e.texStorage3D(i.TEXTURE_3D,Ot,Z,q.width,q.height,q.depth),St&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,q.width,q.height,q.depth,at,w,q.data)):e.texImage3D(i.TEXTURE_3D,0,Z,q.width,q.height,q.depth,0,at,w,q.data);else if(g.isFramebufferTexture){if(rt)if(it)e.texStorage2D(i.TEXTURE_2D,Ot,Z,q.width,q.height);else{let nt=q.width,bt=q.height;for(let Ut=0;Ut<Ot;Ut++)e.texImage2D(i.TEXTURE_2D,Ut,Z,nt,bt,0,at,w,null),nt>>=1,bt>>=1}}else if(g.isHTMLTexture){if("texElementImage2D"in i){let nt=i.canvas;if(nt.hasAttribute("layoutsubtree")||nt.setAttribute("layoutsubtree","true"),q.parentNode!==nt){nt.appendChild(q),d.add(g),nt.onpaint=bt=>{let Ut=bt.changedElements;for(let ut of d)Ut.includes(ut.image)&&(ut.needsUpdate=!0)},nt.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,q);else{let Ut=i.RGBA,ut=i.RGBA,Zt=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Ut,ut,Zt,q)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(ot.length>0){if(it&&rt){let nt=Pt(ot[0]);e.texStorage2D(i.TEXTURE_2D,Ot,Z,nt.width,nt.height)}for(let nt=0,bt=ot.length;nt<bt;nt++)Q=ot[nt],it?St&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,at,w,Q):e.texImage2D(i.TEXTURE_2D,nt,Z,at,w,Q);g.generateMipmaps=!1}else if(it){if(rt){let nt=Pt(q);e.texStorage2D(i.TEXTURE_2D,Ot,Z,nt.width,nt.height)}St&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,at,w,q)}else e.texImage2D(i.TEXTURE_2D,0,Z,at,w,q);T(g)&&g.mipmapsAutoUpdate===!0&&M(et),ct.__version=st.version,g.onUpdate&&g.onUpdate(g)}S.__version=g.version}function De(S,g,F){if(g.image.length!==6)return;let et=Kt(S,g),K=g.source;e.bindTexture(i.TEXTURE_CUBE_MAP,S.__webglTexture,i.TEXTURE0+F);let st=n.get(K);if(K.version!==st.__version||et===!0){e.activeTexture(i.TEXTURE0+F);let ct=Vt.getPrimaries(Vt.workingColorSpace),X=g.colorSpace===On?null:Vt.getPrimaries(g.colorSpace),q=g.colorSpace===On||ct===X?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,q);let at=g.isCompressedTexture||g.image[0].isCompressedTexture,w=g.image[0]&&g.image[0].isDataTexture,Z=[];for(let ut=0;ut<6;ut++)!at&&!w?Z[ut]=v(g.image[ut],!0,s.maxCubemapSize):Z[ut]=w?g.image[ut].image:g.image[ut],Z[ut]=wt(g,Z[ut]);let Q=Z[0],ot=r.convert(g.format,g.colorSpace),it=r.convert(g.type),rt=b(g.internalFormat,ot,it,g.normalized,g.colorSpace),St=g.isVideoTexture!==!0,Ot=st.__version===void 0||et===!0,nt=K.dataReady,bt=x(g,Q);$t(i.TEXTURE_CUBE_MAP,g);let Ut;if(g.isDepthTexture){if(rt=m(g.format===Un,g.type),Ot)if(St)e.texStorage2D(i.TEXTURE_CUBE_MAP,1,rt,Q.width,Q.height);else for(let ut=0;ut<6;ut++)e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,rt,Q.width,Q.height,0,ot,it,null)}else if(at){St&&Ot&&e.texStorage2D(i.TEXTURE_CUBE_MAP,bt,rt,Q.width,Q.height);for(let ut=0;ut<6;ut++){Ut=Z[ut].mipmaps;for(let Zt=0;Zt<Ut.length;Zt++){let Ae=Ut[Zt];g.format!==dn?ot!==null?St?nt&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,Zt,0,0,Ae.width,Ae.height,ot,Ae.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,Zt,rt,Ae.width,Ae.height,0,Ae.data):Tt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):St?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,Zt,0,0,Ae.width,Ae.height,ot,it,Ae.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,Zt,rt,Ae.width,Ae.height,0,ot,it,Ae.data)}}}else{if(Ut=g.mipmaps,St&&Ot){Ut.length>0&&bt++;let ut=Pt(Z[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,bt,rt,ut.width,ut.height)}for(let ut=0;ut<6;ut++)if(w){St?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,0,0,Z[ut].width,Z[ut].height,ot,it,Z[ut].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,rt,Z[ut].width,Z[ut].height,0,ot,it,Z[ut].data);for(let Zt=0;Zt<Ut.length;Zt++){let Fn=Ut[Zt].image[ut].image;St?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,Zt+1,0,0,Fn.width,Fn.height,ot,it,Fn.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,Zt+1,rt,Fn.width,Fn.height,0,ot,it,Fn.data)}}else{St?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,0,0,ot,it,Z[ut]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,rt,ot,it,Z[ut]);for(let Zt=0;Zt<Ut.length;Zt++){let Ae=Ut[Zt];St?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,Zt+1,0,0,ot,it,Ae.image[ut]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,Zt+1,rt,ot,it,Ae.image[ut])}}}T(g)&&g.mipmapsAutoUpdate===!0&&M(i.TEXTURE_CUBE_MAP),st.__version=K.version,g.onUpdate&&g.onUpdate(g)}S.__version=g.version}function re(S,g,F,et,K,st){let ct=r.convert(F.format,F.colorSpace),X=r.convert(F.type),q=b(F.internalFormat,ct,X,F.normalized,F.colorSpace),at=n.get(g),w=n.get(F);if(w.__renderTarget=g,!at.__hasExternalTextures){let Z=Math.max(1,g.width>>st),Q=Math.max(1,g.height>>st);K===i.TEXTURE_3D||K===i.TEXTURE_2D_ARRAY?e.texImage3D(K,st,q,Z,Q,g.depth,0,ct,X,null):e.texImage2D(K,st,q,Z,Q,0,ct,X,null)}e.bindFramebuffer(i.FRAMEBUFFER,S),ht(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,et,K,w.__webglTexture,0,ie(g)):(K===i.TEXTURE_2D||K>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,et,K,w.__webglTexture,st),e.bindFramebuffer(i.FRAMEBUFFER,null)}function pn(S,g,F){if(i.bindRenderbuffer(i.RENDERBUFFER,S),g.depthBuffer){let et=g.depthTexture,K=et&&et.isDepthTexture?et.type:null,st=m(g.stencilBuffer,K),ct=g.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;ht(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ie(g),st,g.width,g.height):F?i.renderbufferStorageMultisample(i.RENDERBUFFER,ie(g),st,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,st,g.width,g.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ct,i.RENDERBUFFER,S)}else{let et=g.textures;for(let K=0;K<et.length;K++){let st=et[K],ct=r.convert(st.format,st.colorSpace),X=r.convert(st.type),q=b(st.internalFormat,ct,X,st.normalized,st.colorSpace);ht(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ie(g),q,g.width,g.height):F?i.renderbufferStorageMultisample(i.RENDERBUFFER,ie(g),q,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,q,g.width,g.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function me(S,g,F){let et=g.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,S),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let K=n.get(g.depthTexture);K.__renderTarget=g;let st=et?g.depthTexture.image[0]:g.depthTexture.image;(!K.__webglTexture||st.width!==g.width||st.height!==g.height)&&(st.width=g.width,st.height=g.height,g.depthTexture.needsUpdate=!0),et?Bt(g.depthTexture,0):pt(g.depthTexture,0);let ct=K.__webglTexture,X=ie(g),q=et?i.TEXTURE_CUBE_MAP_POSITIVE_X+F:i.TEXTURE_2D,at=g.depthTexture.format===Un?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(g.depthTexture.format===Pn)ht(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,at,q,ct,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,at,q,ct,0);else if(g.depthTexture.format===Un)ht(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,at,q,ct,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,at,q,ct,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function qe(S){let g=n.get(S),F=S.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==S.depthTexture){let et=S.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),et){let K=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,et.removeEventListener("dispose",K)};et.addEventListener("dispose",K),g.__depthDisposeCallback=K}g.__boundDepthTexture=et}if(S.depthTexture&&!g.__autoAllocateDepthBuffer)if(F)for(let et=0;et<6;et++)me(g.__webglFramebuffer[et],S,et);else S.texture.mipmaps.length>0?me(g.__webglFramebuffer[0],S,0):me(g.__webglFramebuffer,S,0);else if(F){g.__webglDepthbuffer=[];for(let et=0;et<6;et++)if(e.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[et]),g.__webglDepthbuffer[et]===void 0)g.__webglDepthbuffer[et]=i.createRenderbuffer(),pn(g.__webglDepthbuffer[et],S,!1);else{let K=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,st=g.__webglDepthbuffer[et];i.bindRenderbuffer(i.RENDERBUFFER,st),i.framebufferRenderbuffer(i.FRAMEBUFFER,K,i.RENDERBUFFER,st)}}else if(S.texture.mipmaps.length>0?e.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=i.createRenderbuffer(),pn(g.__webglDepthbuffer,S,!1);else{let K=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,st=g.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,st),i.framebufferRenderbuffer(i.FRAMEBUFFER,K,i.RENDERBUFFER,st)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function $e(S,g,F){let et=n.get(S);g!==void 0&&re(et.__webglFramebuffer,S,S.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),F!==void 0&&qe(S)}function Ze(S){let g=S.texture,F=n.get(S),et=n.get(g);S.addEventListener("dispose",U),D(S);let K=S.textures,st=S.isWebGLCubeRenderTarget===!0,ct=K.length>1;if(ct||(et.__webglTexture===void 0&&(et.__webglTexture=i.createTexture()),et.__version=g.version,a.memory.textures++),st){F.__webglFramebuffer=[];for(let X=0;X<6;X++)if(g.mipmaps.length>0){F.__webglFramebuffer[X]=[];for(let q=0;q<g.mipmaps.length;q++)F.__webglFramebuffer[X][q]=i.createFramebuffer()}else F.__webglFramebuffer[X]=i.createFramebuffer()}else{if(g.mipmaps.length>0){F.__webglFramebuffer=[];for(let X=0;X<g.mipmaps.length;X++)F.__webglFramebuffer[X]=i.createFramebuffer()}else F.__webglFramebuffer=i.createFramebuffer();if(ct)for(let X=0,q=K.length;X<q;X++){let at=n.get(K[X]);at.__webglTexture===void 0&&(at.__webglTexture=i.createTexture(),a.memory.textures++)}if(S.samples>0&&ht(S)===!1){F.__webglMultisampledFramebuffer=i.createFramebuffer(),F.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let X=0;X<K.length;X++){let q=K[X];F.__webglColorRenderbuffer[X]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,F.__webglColorRenderbuffer[X]);let at=r.convert(q.format,q.colorSpace),w=r.convert(q.type),Z=b(q.internalFormat,at,w,q.normalized,q.colorSpace,S.isXRRenderTarget===!0),Q=ie(S);i.renderbufferStorageMultisample(i.RENDERBUFFER,Q,Z,S.width,S.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+X,i.RENDERBUFFER,F.__webglColorRenderbuffer[X])}i.bindRenderbuffer(i.RENDERBUFFER,null),S.depthBuffer&&(F.__webglDepthRenderbuffer=i.createRenderbuffer(),pn(F.__webglDepthRenderbuffer,S,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(st){e.bindTexture(i.TEXTURE_CUBE_MAP,et.__webglTexture),$t(i.TEXTURE_CUBE_MAP,g);for(let X=0;X<6;X++)if(g.mipmaps.length>0)for(let q=0;q<g.mipmaps.length;q++)re(F.__webglFramebuffer[X][q],S,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+X,q);else re(F.__webglFramebuffer[X],S,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0);T(g)?M(i.TEXTURE_CUBE_MAP):g.mipmaps.length>0&&i.texParameteri(i.TEXTURE_CUBE_MAP,i.TEXTURE_MAX_LEVEL,g.mipmaps.length-1),e.unbindTexture()}else if(ct){for(let X=0,q=K.length;X<q;X++){let at=K[X],w=n.get(at),Z=i.TEXTURE_2D;(S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(Z=S.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(Z,w.__webglTexture),$t(Z,at),re(F.__webglFramebuffer,S,at,i.COLOR_ATTACHMENT0+X,Z,0),T(at)&&M(Z)}e.unbindTexture()}else{let X=i.TEXTURE_2D;if((S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(X=S.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(X,et.__webglTexture),$t(X,g),g.mipmaps.length>0)for(let q=0;q<g.mipmaps.length;q++)re(F.__webglFramebuffer[q],S,g,i.COLOR_ATTACHMENT0,X,q);else re(F.__webglFramebuffer,S,g,i.COLOR_ATTACHMENT0,X,0);T(g)?M(X):g.mipmaps.length>0&&i.texParameteri(X,i.TEXTURE_MAX_LEVEL,g.mipmaps.length-1),e.unbindTexture()}S.depthBuffer&&qe(S)}function L(S){let g=S.textures;for(let F=0,et=g.length;F<et;F++){let K=g[F];if(T(K)&&K.mipmapsAutoUpdate===!0){let st=C(S),ct=n.get(K).__webglTexture;e.bindTexture(st,ct),M(st),e.unbindTexture()}}}let Ke=[];function ne(S){if(S.samples>0){if(ht(S)===!1){let g=S.textures,F=S.width,et=S.height,K=i.COLOR_BUFFER_BIT,st=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ct=n.get(S),X=g.length>1;if(X)for(let at=0;at<g.length;at++)e.bindFramebuffer(i.FRAMEBUFFER,ct.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,ct.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,ct.__webglMultisampledFramebuffer),S.texture.mipmaps.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ct.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ct.__webglFramebuffer);for(let at=0;at<g.length;at++){if(S.resolveDepthBuffer&&(S.depthBuffer&&(K|=i.DEPTH_BUFFER_BIT),S.stencilBuffer&&S.resolveStencilBuffer&&(K|=i.STENCIL_BUFFER_BIT)),X){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ct.__webglColorRenderbuffer[at]);let w=n.get(g[at]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,w,0)}i.blitFramebuffer(0,0,F,et,0,0,F,et,K,i.NEAREST),c===!0&&(Ke.length=0,Ke.push(i.COLOR_ATTACHMENT0+at),S.depthBuffer&&S.storeMultisampledDepthBuffer===!1&&Ke.push(st),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Ke))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),X)for(let at=0;at<g.length;at++){e.bindFramebuffer(i.FRAMEBUFFER,ct.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.RENDERBUFFER,ct.__webglColorRenderbuffer[at]);let w=n.get(g[at]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,ct.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.TEXTURE_2D,w,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ct.__webglMultisampledFramebuffer)}else if(S.depthBuffer&&S.storeMultisampledDepthBuffer===!1&&c){let g=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[g])}}}function ie(S){return Math.min(s.maxSamples,S.samples)}function ht(S){let g=n.get(S);return S.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function ue(S){let g=a.render.frame;f.get(S)!==g&&(f.set(S,g),S.update())}function wt(S,g){let F=S.colorSpace,et=S.format,K=S.type;return S.isCompressedTexture===!0||S.isVideoTexture===!0||F!==hs&&F!==On&&(Vt.getTransfer(F)===qt?(et!==dn||K!==Oe)&&Tt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Rt("WebGLTextures: Unsupported texture color space:",F)),g}function Pt(S){return typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement?(l.width=S.naturalWidth||S.width,l.height=S.naturalHeight||S.height):typeof VideoFrame<"u"&&S instanceof VideoFrame?(l.width=S.displayWidth,l.height=S.displayHeight):(l.width=S.width,l.height=S.height),l}this.allocateTextureUnit=Nt,this.resetTextureUnits=j,this.getTextureUnits=tt,this.setTextureUnits=vt,this.setTexture2D=pt,this.setTexture2DArray=_t,this.setTexture3D=Ct,this.setTextureCube=Bt,this.rebindTextures=$e,this.setupRenderTarget=Ze,this.updateRenderTargetMipmap=L,this.updateMultisampleRenderTarget=ne,this.setupDepthRenderbuffer=qe,this.setupFrameBufferTexture=re,this.useMultisampledRTT=ht,this.dispose=H}function Um(i,t){function e(n,s=On){let r,a=Vt.getTransfer(s);if(n===Oe)return i.UNSIGNED_BYTE;if(n===oa)return i.UNSIGNED_SHORT_4_4_4_4;if(n===la)return i.UNSIGNED_SHORT_5_5_5_1;if(n===el)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===nl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Jo)return i.BYTE;if(n===tl)return i.SHORT;if(n===Xi)return i.UNSIGNED_SHORT;if(n===aa)return i.INT;if(n===fn)return i.UNSIGNED_INT;if(n===hn)return i.FLOAT;if(n===un)return i.HALF_FLOAT;if(n===il)return i.ALPHA;if(n===sl)return i.RGB;if(n===dn)return i.RGBA;if(n===Pn)return i.DEPTH_COMPONENT;if(n===Un)return i.DEPTH_STENCIL;if(n===rl)return i.RED;if(n===ca)return i.RED_INTEGER;if(n===ei)return i.RG;if(n===fa)return i.RG_INTEGER;if(n===ha)return i.RGBA_INTEGER;if(n===Os||n===Fs||n===zs||n===Gs)if(a===qt)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Os)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Fs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===zs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Gs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Os)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Fs)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===zs)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Gs)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ua||n===da||n===pa||n===Ba)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===ua)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===da)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===pa)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Ba)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===ma||n===Aa||n===ga||n===_a||n===ya||n===Ys||n===xa)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===ma||n===Aa)return a===qt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===ga)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===_a)return r.COMPRESSED_R11_EAC;if(n===ya)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Ys)return r.COMPRESSED_RG11_EAC;if(n===xa)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===va||n===Ma||n===Sa||n===ba||n===Ta||n===Ca||n===wa||n===Ea||n===Ra||n===Ia||n===Pa||n===Na||n===La||n===Da)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===va)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ma)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Sa)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ba)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ta)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Ca)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===wa)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ea)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ra)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Ia)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Pa)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Na)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===La)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Da)return a===qt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Ua||n===Oa||n===Fa)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Ua)return a===qt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Oa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Fa)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===za||n===Ga||n===Hs||n===Ya)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===za)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ga)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Hs)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ya)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===mi?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var Om=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Fm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,wl=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new vs(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new gn({vertexShader:Om,fragmentShader:Fm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Qe(new hi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},El=class extends cn{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",c=1,l=null,f=null,d=null,h=null,u=null,A=null,y=typeof XRWebGLBinding<"u",B=new wl,p={},v=e.getContextAttributes(),T=null,M=null,C=[],b=[],m=new At,x=null,D=null,R=new Ie;R.viewport=new se;let N=new Ie;N.viewport=new se;let U=[R,N],V=new na,E=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let pt=C[$];return pt===void 0&&(pt=new Oi,C[$]=pt),pt.getTargetRaySpace()},this.getControllerGrip=function($){let pt=C[$];return pt===void 0&&(pt=new Oi,C[$]=pt),pt.getGripSpace()},this.getHand=function($){let pt=C[$];return pt===void 0&&(pt=new Oi,C[$]=pt),pt.getHandSpace()};function k($){let pt=b.indexOf($.inputSource);if(pt===-1)return;let _t=C[pt];_t!==void 0&&(_t.update($.inputSource,$.frame,l||a),_t.dispatchEvent({type:$.type,data:$.inputSource}))}function Y(){s.removeEventListener("select",k),s.removeEventListener("selectstart",k),s.removeEventListener("selectend",k),s.removeEventListener("squeeze",k),s.removeEventListener("squeezestart",k),s.removeEventListener("squeezeend",k),s.removeEventListener("end",Y),s.removeEventListener("inputsourceschange",J);for(let $=0;$<C.length;$++){let pt=b[$];pt!==null&&(b[$]=null,C[$].disconnect(pt))}E=null,H=null,B.reset();for(let $ in p)delete p[$];if(t.setRenderTarget(T),u=null,h=null,d=null,s=null,M=null,Nt.stop(),n.isPresenting=!1,t.setPixelRatio(x),t.setSize(m.width,m.height,!1),D!==null){let $=D.camera;$.fov=D.fov,$.zoom=D.zoom,$.updateProjectionMatrix(),D=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,n.isPresenting===!0&&Tt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,n.isPresenting===!0&&Tt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function($){l=$},this.getBaseLayer=function(){return h!==null?h:u},this.getBinding=function(){return d===null&&y&&(d=new XRWebGLBinding(s,e)),d},this.getFrame=function(){return A},this.getSession=function(){return s},this.setSession=async function($){if(s=$,s!==null){if(T=t.getRenderTarget(),s.addEventListener("select",k),s.addEventListener("selectstart",k),s.addEventListener("selectend",k),s.addEventListener("squeeze",k),s.addEventListener("squeezestart",k),s.addEventListener("squeezeend",k),s.addEventListener("end",Y),s.addEventListener("inputsourceschange",J),v.xrCompatible!==!0&&await e.makeXRCompatible(),x=t.getPixelRatio(),t.getSize(m),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let _t=null,Ct=null,Bt=null;v.depth&&(Bt=v.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,_t=v.stencil?Un:Pn,Ct=v.stencil?mi:fn);let Dt={colorFormat:e.RGBA8,depthFormat:Bt,scaleFactor:r};d=this.getBinding(),h=d.createProjectionLayer(Dt),s.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),M=new ke(h.textureWidth,h.textureHeight,{format:dn,type:Oe,depthTexture:new Ln(h.textureWidth,h.textureHeight,Ct,void 0,void 0,void 0,void 0,void 0,void 0,_t),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{let _t={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:r};u=new XRWebGLLayer(s,e,_t),s.updateRenderState({baseLayer:u}),t.setPixelRatio(1),t.setSize(u.framebufferWidth,u.framebufferHeight,!1),M=new ke(u.framebufferWidth,u.framebufferHeight,{format:dn,type:Oe,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await s.requestReferenceSpace(o),Nt.setContext(s),Nt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return B.getDepthTexture()};function J($){for(let pt=0;pt<$.removed.length;pt++){let _t=$.removed[pt],Ct=b.indexOf(_t);Ct>=0&&(b[Ct]=null,C[Ct].disconnect(_t))}for(let pt=0;pt<$.added.length;pt++){let _t=$.added[pt],Ct=b.indexOf(_t);if(Ct===-1){for(let Dt=0;Dt<C.length;Dt++)if(Dt>=b.length){b.push(_t),Ct=Dt;break}else if(b[Dt]===null){b[Dt]=_t,Ct=Dt;break}if(Ct===-1)break}let Bt=C[Ct];Bt&&Bt.connect(_t)}}function W($,pt){pt===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(pt.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(s===null)return;let pt=$.near,_t=$.far;B.texture!==null&&(B.depthNear>0&&(pt=B.depthNear),B.depthFar>0&&(_t=B.depthFar)),V.near=N.near=R.near=pt,V.far=N.far=R.far=_t,(E!==V.near||H!==V.far)&&(s.updateRenderState({depthNear:V.near,depthFar:V.far}),E=V.near,H=V.far),V.layers.mask=$.layers.mask|6,R.layers.mask=V.layers.mask&-5,N.layers.mask=V.layers.mask&-3;let Ct=$.parent,Bt=V.cameras;W(V,Ct);for(let Dt=0;Dt<Bt.length;Dt++)W(Bt[Dt],Ct);V.projectionMatrix.copy(R.projectionMatrix),V.projectionMatrixInverse.copy(R.projectionMatrixInverse),D===null&&$.isPerspectiveCamera&&(D={camera:$,fov:$.fov,zoom:$.zoom}),j($,V,Ct)};function j($,pt,_t){_t===null?$.matrix.copy(pt.matrixWorld):($.matrix.copy(_t.matrixWorld),$.matrix.invert(),$.matrix.multiply(pt.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(pt.projectionMatrix),$.projectionMatrixInverse.copy(pt.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Di*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return V},this.getFoveation=function(){if(!(h===null&&u===null))return c},this.setFoveation=function($){c=$,h!==null&&(h.fixedFoveation=$),u!==null&&u.fixedFoveation!==void 0&&(u.fixedFoveation=$)},this.hasDepthSensing=function(){return B.texture!==null},this.getDepthSensingMesh=function(){return B.getMesh(V)},this.getCameraTexture=function($){return p[$]};let tt=null;function vt($,pt){if(f=pt.getViewerPose(l||a),A=pt,f!==null){let _t=f.views;u!==null&&(t.setRenderTargetFramebuffer(M,u.framebuffer),t.setRenderTarget(M));let Ct=!1;_t.length!==V.cameras.length&&(V.cameras.length=0,Ct=!0);for(let Et=0;Et<_t.length;Et++){let $t=_t[Et],Kt=null;if(u!==null)Kt=u.getViewport($t);else{let xe=d.getViewSubImage(h,$t);Kt=xe.viewport,Et===0&&(t.setRenderTargetTextures(M,xe.colorTexture,xe.depthStencilTexture),t.setRenderTarget(M))}let Yt=U[Et];Yt===void 0&&(Yt=new Ie,Yt.layers.enable(Et),Yt.viewport=new se,U[Et]=Yt),Yt.matrix.fromArray($t.transform.matrix),Yt.matrix.decompose(Yt.position,Yt.quaternion,Yt.scale),Yt.projectionMatrix.fromArray($t.projectionMatrix),Yt.projectionMatrixInverse.copy(Yt.projectionMatrix).invert(),Yt.viewport.set(Kt.x,Kt.y,Kt.width,Kt.height),Et===0&&(V.matrix.copy(Yt.matrix),V.matrix.decompose(V.position,V.quaternion,V.scale)),Ct===!0&&V.cameras.push(Yt)}let Bt=s.enabledFeatures;if(Bt&&Bt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&y){d=n.getBinding();let Et=d.getDepthInformation(_t[0]);Et&&Et.isValid&&Et.texture&&B.init(Et,s.renderState)}if(Bt&&Bt.includes("camera-access")&&y){t.state.unbindTexture(),d=n.getBinding();for(let Et=0;Et<_t.length;Et++){let $t=_t[Et].camera;if($t){let Kt=p[$t];Kt||(Kt=new vs,p[$t]=Kt);let Yt=d.getCameraImage($t);Kt.sourceTexture=Yt}}}}for(let _t=0;_t<C.length;_t++){let Ct=b[_t],Bt=C[_t];Ct!==null&&Bt!==void 0&&Bt.update(Ct,pt,l||a)}tt&&tt($,pt),pt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:pt}),A=null}let Nt=new Ef;Nt.setAnimationLoop(vt),this.setAnimationLoop=function($){tt=$},this.dispose=function(){}}},zm=new ee,zf=new It;zf.set(-1,0,0,0,1,0,0,0,1);function Gm(i,t){function e(B,p){B.matrixAutoUpdate===!0&&B.updateMatrix(),p.value.copy(B.matrix)}function n(B,p){p.color.getRGB(B.fogColor.value,ml(i)),p.isFog?(B.fogNear.value=p.near,B.fogFar.value=p.far):p.isFogExp2&&(B.fogDensity.value=p.density)}function s(B,p,v,T,M){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(B,p):p.isMeshLambertMaterial?(r(B,p),p.envMap&&(B.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(B,p),d(B,p)):p.isMeshPhongMaterial?(r(B,p),f(B,p),p.envMap&&(B.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(B,p),h(B,p),p.isMeshPhysicalMaterial&&u(B,p,M)):p.isMeshMatcapMaterial?(r(B,p),A(B,p)):p.isMeshDepthMaterial?r(B,p):p.isMeshDistanceMaterial?(r(B,p),y(B,p)):p.isMeshNormalMaterial?r(B,p):p.isLineBasicMaterial?(a(B,p),p.isLineDashedMaterial&&o(B,p)):p.isPointsMaterial?c(B,p,v,T):p.isSpriteMaterial?l(B,p):p.isShadowMaterial?(B.color.value.copy(p.color),B.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(B,p){B.opacity.value=p.opacity,p.color&&B.diffuse.value.copy(p.color),p.emissive&&B.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(B.map.value=p.map,e(p.map,B.mapTransform)),p.alphaMap&&(B.alphaMap.value=p.alphaMap,e(p.alphaMap,B.alphaMapTransform)),p.bumpMap&&(B.bumpMap.value=p.bumpMap,e(p.bumpMap,B.bumpMapTransform),B.bumpScale.value=p.bumpScale,p.side===Le&&(B.bumpScale.value*=-1)),p.normalMap&&(B.normalMap.value=p.normalMap,e(p.normalMap,B.normalMapTransform),B.normalScale.value.copy(p.normalScale),p.side===Le&&B.normalScale.value.negate()),p.displacementMap&&(B.displacementMap.value=p.displacementMap,e(p.displacementMap,B.displacementMapTransform),B.displacementScale.value=p.displacementScale,B.displacementBias.value=p.displacementBias),p.emissiveMap&&(B.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,B.emissiveMapTransform)),p.specularMap&&(B.specularMap.value=p.specularMap,e(p.specularMap,B.specularMapTransform)),p.alphaTest>0&&(B.alphaTest.value=p.alphaTest);let v=t.get(p),T=v.envMap,M=v.envMapRotation;T&&(B.envMap.value=T,B.envMapRotation.value.setFromMatrix4(zm.makeRotationFromEuler(M)).transpose(),T.isCubeTexture&&T.isRenderTargetTexture===!1&&B.envMapRotation.value.premultiply(zf),B.reflectivity.value=p.reflectivity,B.ior.value=p.ior,B.refractionRatio.value=p.refractionRatio),p.lightMap&&(B.lightMap.value=p.lightMap,B.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,B.lightMapTransform)),p.aoMap&&(B.aoMap.value=p.aoMap,B.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,B.aoMapTransform))}function a(B,p){B.diffuse.value.copy(p.color),B.opacity.value=p.opacity,p.map&&(B.map.value=p.map,e(p.map,B.mapTransform))}function o(B,p){B.dashSize.value=p.dashSize,B.totalSize.value=p.dashSize+p.gapSize,B.scale.value=p.scale}function c(B,p,v,T){B.diffuse.value.copy(p.color),B.opacity.value=p.opacity,B.size.value=p.size*v,B.scale.value=T*.5,p.map&&(B.map.value=p.map,e(p.map,B.uvTransform)),p.alphaMap&&(B.alphaMap.value=p.alphaMap,e(p.alphaMap,B.alphaMapTransform)),p.alphaTest>0&&(B.alphaTest.value=p.alphaTest)}function l(B,p){B.diffuse.value.copy(p.color),B.opacity.value=p.opacity,B.rotation.value=p.rotation,p.map&&(B.map.value=p.map,e(p.map,B.mapTransform)),p.alphaMap&&(B.alphaMap.value=p.alphaMap,e(p.alphaMap,B.alphaMapTransform)),p.alphaTest>0&&(B.alphaTest.value=p.alphaTest)}function f(B,p){B.specular.value.copy(p.specular),B.shininess.value=Math.max(p.shininess,1e-4)}function d(B,p){p.gradientMap&&(B.gradientMap.value=p.gradientMap)}function h(B,p){B.metalness.value=p.metalness,p.metalnessMap&&(B.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,B.metalnessMapTransform)),B.roughness.value=p.roughness,p.roughnessMap&&(B.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,B.roughnessMapTransform)),p.envMap&&(B.envMapIntensity.value=p.envMapIntensity)}function u(B,p,v){B.ior.value=p.ior,p.diffuseRoughness>0&&(B.diffuseRoughness.value=p.diffuseRoughness,p.diffuseRoughnessMap&&(B.diffuseRoughnessMap.value=p.diffuseRoughnessMap,e(p.diffuseRoughnessMap,B.diffuseRoughnessMapTransform))),p.sheen>0&&(B.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),B.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(B.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,B.sheenColorMapTransform)),p.sheenRoughnessMap&&(B.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,B.sheenRoughnessMapTransform))),p.clearcoat>0&&(B.clearcoat.value=p.clearcoat,B.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(B.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,B.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(B.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,B.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(B.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,B.clearcoatNormalMapTransform),B.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Le&&B.clearcoatNormalScale.value.negate())),p.dispersion>0&&(B.dispersion.value=p.dispersion),p.retroreflectivity>0&&(B.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(B.iridescence.value=p.iridescence,B.iridescenceIOR.value=p.iridescenceIOR,B.iridescenceThicknessMinimum.value=p.iridescenceThicknessMinimum,B.iridescenceThicknessMaximum.value=p.iridescenceThicknessMaximum,p.iridescenceMap&&(B.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,B.iridescenceMapTransform)),p.iridescenceThicknessMap&&(B.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,B.iridescenceThicknessMapTransform))),p.transmission>0&&(B.transmission.value=p.transmission,B.transmissionSamplerMap.value=v.texture,B.transmissionSamplerSize.value.set(v.width,v.height),p.transmissionMap&&(B.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,B.transmissionMapTransform)),B.thickness.value=p.thickness,p.thicknessMap&&(B.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,B.thicknessMapTransform)),B.attenuationDistance.value=p.attenuationDistance,B.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(B.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(B.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,B.anisotropyMapTransform))),B.specularIntensity.value=p.specularIntensity,B.specularColor.value.copy(p.specularColor),p.specularColorMap&&(B.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,B.specularColorMapTransform)),p.specularIntensityMap&&(B.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,B.specularIntensityMapTransform))}function A(B,p){p.matcap&&(B.matcap.value=p.matcap)}function y(B,p){let v=t.get(p).light;B.referencePosition.value.setFromMatrixPosition(v.matrixWorld),B.nearDistance.value=v.shadow.camera.near,B.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Ym(i,t,e,n){let s={},r={};function a(v,T){let M=T.program;n.uniformBlockBinding(v,M,s[v.id])}function o(v,T){let M=s[v.id];M===void 0&&(A(v),M=c(v),s[v.id]=M,v.addEventListener("dispose",B));let C=T.program;n.updateUBOMapping(v,C);let b=t.render.frame;r[v.id]!==b&&(l(v),r[v.id]=b)}function c(v){let T=i.createBuffer(),M=v.__size,C=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,T),i.bufferData(i.UNIFORM_BUFFER,M,C),i.bindBuffer(i.UNIFORM_BUFFER,null),T}function l(v){let T=s[v.id],M=v.uniforms,C=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,T);for(let b=0,m=M.length;b<m;b++){let x=M[b];if(Array.isArray(x))for(let D=0,R=x.length;D<R;D++)f(x[D],b,D,C);else f(x,b,0,C)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(v,T,M,C){if(h(v,T,M,C)===!0){let b=v.__offset,m=v.value;if(Array.isArray(m)){let x=0;for(let D=0;D<m.length;D++){let R=m[D],N=y(R,!0);d(R,v.__data,x),x+=N.storage/Float32Array.BYTES_PER_ELEMENT}}else d(m,v.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,b,v.__data)}}function d(v,T,M){typeof v=="number"||typeof v=="boolean"?T[M]=v:v.isMatrix3?(T[M]=v.elements[0],T[M+1]=v.elements[1],T[M+2]=v.elements[2],T[M+3]=0,T[M+4]=v.elements[3],T[M+5]=v.elements[4],T[M+6]=v.elements[5],T[M+7]=0,T[M+8]=v.elements[6],T[M+9]=v.elements[7],T[M+10]=v.elements[8],T[M+11]=0):ArrayBuffer.isView(v)?T.set(v.subarray(0,T.length-M),M):v.toArray(T,M)}function h(v,T,M,C){let b=v.value,m=T+"_"+M;if(Array.isArray(b)){C[m]===void 0&&(C[m]=[]);let x=C[m],D=!1;for(let R=0;R<b.length;R++)u(b[R],x,R)===!0&&(D=!0);return D}return u(b,C,m)}function u(v,T,M){if(T[M]===void 0)return typeof v=="number"||typeof v=="boolean"?T[M]=v:ArrayBuffer.isView(v)?T[M]=v.slice():T[M]=v.clone(),!0;{let C=T[M];if(typeof v=="number"||typeof v=="boolean"){if(C!==v)return T[M]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(C.equals(v)===!1)return C.copy(v),!0}}return!1}function A(v){let T=v.uniforms,M=0,C=16;for(let m=0,x=T.length;m<x;m++){let D=Array.isArray(T[m])?T[m]:[T[m]];for(let R=0,N=D.length;R<N;R++){let U=D[R],V=Array.isArray(U.value)?U.value:[U.value],E=Array.isArray(T[m])||Array.isArray(U.value),H=M;for(let Y=0,J=V.length;Y<J;Y++){let W=V[Y],j=y(W,E),tt=M%C,vt=tt%j.boundary,Nt=tt+vt;M+=vt,Nt!==0&&C-Nt<j.storage&&(M+=C-Nt),Y===0&&(H=M),M+=j.storage}let k=U.type==="int"?Int32Array:U.type==="uint"?Uint32Array:Float32Array;U.__data=new k((M-H)/Float32Array.BYTES_PER_ELEMENT),U.__offset=H}}let b=M%C;return b>0&&(M+=C-b),v.__size=M,v.__cache={},this}function y(v,T){let M={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(M.boundary=4,M.storage=4):v.isVector2?(M.boundary=8,M.storage=8):v.isVector3||v.isColor?(M.boundary=16,M.storage=12):v.isVector4?(M.boundary=16,M.storage=16):v.isMatrix3?(M.boundary=16,M.storage=48):v.isMatrix4?(M.boundary=16,M.storage=64):v.isTexture?Tt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(M.boundary=16,M.storage=v.byteLength):Tt("WebGLRenderer: Unsupported uniform value type.",v),T===!0&&(M.boundary=16,M.storage=Math.ceil(M.storage/16)*16),M}function B(v){let T=v.target;T.removeEventListener("dispose",B),i.deleteBuffer(s[T.id]),delete s[T.id],delete r[T.id]}function p(){for(let v in s)i.deleteBuffer(s[v]);s={},r={}}return{bind:a,update:o,dispose:p}}var Hm=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),xn=null;function km(){return xn===null&&(xn=new Lr(Hm,16,16,ei,un),xn.name="DFG_LUT",xn.minFilter=Pe,xn.magFilter=Pe,xn.wrapS=mn,xn.wrapT=mn,xn.generateMipmaps=!1,xn.needsUpdate=!0),xn}var Wa=class{constructor(t={}){let{canvas:e=Kc(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:f="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:h=!1,outputBufferType:u=Oe}=t;this.isWebGLRenderer=!0;let A;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");A=n.getContextAttributes().alpha}else A=a;let y=u,B=new Set([ha,fa,ca]),p=new Set([Oe,fn,Xi,mi,oa,la]),v=new Uint32Array(4),T=new Int32Array(4),M={textures:[],min:[],max:[],resolution:[]},C=null,b=null,m=[],x=[],D=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=yn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let R=this,N=!1,U=null,V=null,E=null,H=null;this._outputColorSpace=Me;let k=0,Y=0,J=null,W=-1,j=null,tt=new se,vt=new se,Nt=null,$=new Gt(0),pt=0,_t=e.width,Ct=e.height,Bt=1,Dt=null,le=null,Et=new se(0,0,_t,Ct),$t=new se(0,0,_t,Ct),Kt=!1,Yt=new qn,xe=new Dr,he=!1,De=!1,re=new ee,pn=new P,me=new se,qe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},$e=!1;function Ze(){return J===null?Bt:1}let L=n;function Ke(_,I){return e.getContext(_,I)}let ne,ie,ht,ue,wt,Pt,S,g,F,et,K,st,ct,X,q,at,w,Z,Q,ot,it,rt,St;try{let _={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:f,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"187"}`),e.addEventListener("webglcontextlost",bt,!1),e.addEventListener("webglcontextrestored",Ut,!1),e.addEventListener("webglcontextcreationerror",ut,!1),L===null){let I="webgl2";if(L=Ke(I,_),L===null)throw Ke(I)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ot()}catch(_){throw e.removeEventListener("webglcontextlost",bt,!1),e.removeEventListener("webglcontextrestored",Ut,!1),e.removeEventListener("webglcontextcreationerror",ut,!1),Rt("WebGLRenderer: "+_.message),_}function Ot(){ne=new tB(L),ne.init(),it=new Um(L,ne),ie=new kp(L,ne,t,it),ht=new Lm(L,ne),ie.reversedDepthBuffer&&h&&ht.buffers.depth.setReversed(!0),V=L.createFramebuffer(),E=L.createFramebuffer(),H=L.createFramebuffer(),ue=new iB(L),wt=new ym,Pt=new Dm(L,ne,ht,wt,ie,it,ue),S=new Jp(R),g=new ru(L),rt=new Yp(L,g),F=new eB(L,g,ue,rt),et=new rB(L,F,g,rt,ue),Z=new sB(L,ie,Pt),q=new Vp(wt),K=new _m(R,S,ne,ie,rt,q),st=new Gm(R,wt),ct=new vm,X=new wm(ne),w=new Gp(R,S,ht,et,A,c),at=new Nm(R,et,ie),St=new Ym(L,ue,ie,ht),Q=new Hp(L,ne,ue),ot=new nB(L,ne,ue),ue.programs=K.programs,R.capabilities=ie,R.extensions=ne,R.properties=wt,R.renderLists=ct,R.shadowMap=at,R.state=ht,R.info=ue}y!==Oe&&(D=new oB(y,e.width,e.height,o,s,r));let nt=new El(R,L);this.xr=nt,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){let _=ne.get("WEBGL_lose_context");_&&_.loseContext()},this.forceContextRestore=function(){let _=ne.get("WEBGL_lose_context");_&&_.restoreContext()},this.getPixelRatio=function(){return Bt},this.setPixelRatio=function(_){_!==void 0&&(Bt=_,this.setSize(_t,Ct,!1))},this.getSize=function(_){return _.set(_t,Ct)},this.setSize=function(_,I,G=!0){if(nt.isPresenting){Tt("WebGLRenderer: Can't change size while VR device is presenting.");return}_t=_,Ct=I,e.width=Math.floor(_*Bt),e.height=Math.floor(I*Bt),G===!0&&(e.style.width=_+"px",e.style.height=I+"px"),D!==null&&D.setSize(e.width,e.height),this.setViewport(0,0,_,I)},this.getDrawingBufferSize=function(_){return _.set(_t*Bt,Ct*Bt).floor()},this.setDrawingBufferSize=function(_,I,G){_t=_,Ct=I,Bt=G,e.width=Math.floor(_*G),e.height=Math.floor(I*G),this.setViewport(0,0,_,I)},this.setEffects=function(_){if(y===Oe){Rt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(_){for(let I=0;I<_.length;I++)if(_[I].isOutputPass===!0){Tt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}D.setEffects(_||[])},this.getCurrentViewport=function(_){return _.copy(tt)},this.getViewport=function(_){return _.copy(Et)},this.setViewport=function(_,I,G,O){_.isVector4?Et.set(_.x,_.y,_.z,_.w):Et.set(_,I,G,O),ht.viewport(tt.copy(Et).multiplyScalar(Ze()).round())},this.getScissor=function(_){return _.copy($t)},this.setScissor=function(_,I,G,O){_.isVector4?$t.set(_.x,_.y,_.z,_.w):$t.set(_,I,G,O),ht.scissor(vt.copy($t).multiplyScalar(Ze()).round())},this.getScissorTest=function(){return Kt},this.setScissorTest=function(_){ht.setScissorTest(Kt=_)},this.setOpaqueSort=function(_){Dt=_},this.setTransparentSort=function(_){le=_},this.getClearColor=function(_){return _.copy(w.getClearColor())},this.setClearColor=function(){w.setClearColor(...arguments)},this.getClearAlpha=function(){return w.getClearAlpha()},this.setClearAlpha=function(){w.setClearAlpha(...arguments)},this.clear=function(_=!0,I=!0,G=!0){let O=0;if(_){let z=!1;if(J!==null){let ft=J.texture.format;z=B.has(ft)}if(z){let ft=J.texture.type,gt=p.has(ft),lt=w.getClearColor(),mt=w.getClearAlpha(),Mt=lt.r,Lt=lt.g,Ht=lt.b;gt?(v[0]=Mt,v[1]=Lt,v[2]=Ht,v[3]=mt,L.clearBufferuiv(L.COLOR,0,v)):(T[0]=Mt,T[1]=Lt,T[2]=Ht,T[3]=mt,L.clearBufferiv(L.COLOR,0,T))}else O|=L.COLOR_BUFFER_BIT}I&&(O|=L.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),G&&(O|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),O!==0&&L.clear(O)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(_){_.setRenderer(this),U=_},this.dispose=function(){e.removeEventListener("webglcontextlost",bt,!1),e.removeEventListener("webglcontextrestored",Ut,!1),e.removeEventListener("webglcontextcreationerror",ut,!1),w.dispose(),ct.dispose(),X.dispose(),Pt.dispose(),wt.dispose(),S.dispose(),et.dispose(),F.dispose(),rt.dispose(),St.dispose(),K.dispose(),nt.dispose(),nt.removeEventListener("sessionstart",Ll),nt.removeEventListener("sessionend",Dl),ii.stop()};function bt(_){_.preventDefault(),fl("WebGLRenderer: Context Lost."),N=!0}function Ut(){fl("WebGLRenderer: Context Restored."),N=!1;let _=ue.autoReset,I=at.enabled,G=at.autoUpdate,O=at.needsUpdate,z=at.type;Ot(),ue.autoReset=_,at.enabled=I,at.autoUpdate=G,at.needsUpdate=O,at.type=z}function ut(_){Rt("WebGLRenderer: A WebGL context could not be created. Reason: ",_.statusMessage)}function Zt(_){let I=_.target;I.removeEventListener("dispose",Zt),Ae(I)}function Ae(_){Fn(_),wt.remove(_)}function Fn(_){let I=wt.get(_).programs;I!==void 0&&(I.forEach(function(G){K.releaseProgram(G)}),_.isShaderMaterial&&K.releaseShaderCache(_))}this.renderBufferDirect=function(_,I,G,O,z,ft){I===null&&(I=qe);let gt=z.isMesh&&z.matrixWorld.determinantAffine()<0,lt=jf(_,I,G,O,z);ht.setMaterial(O,gt);let mt=G.index,Mt=1;if(O.wireframe===!0){if(mt=F.getWireframeAttribute(G),mt===void 0)return;Mt=2}let Lt=G.drawRange,Ht=G.attributes.position,yt=Lt.start*Mt,kt=(Lt.start+Lt.count)*Mt;ft!==null&&(yt=Math.max(yt,ft.start*Mt),kt=Math.min(kt,(ft.start+ft.count)*Mt)),mt!==null?(yt=Math.max(yt,0),kt=Math.min(kt,mt.count)):Ht!=null&&(yt=Math.max(yt,0),kt=Math.min(kt,Ht.count));let ce=kt-yt;if(ce<0||ce===1/0)return;rt.setup(z,O,lt,G,mt);let Jt,jt=Q;if(mt!==null&&(Jt=g.get(mt),jt=ot,jt.setIndex(Jt)),z.isMesh)O.wireframe===!0?(ht.setLineWidth(O.wireframeLinewidth*Ze()),jt.setMode(L.LINES)):jt.setMode(L.TRIANGLES);else if(z.isLine){let Se=O.linewidth;Se===void 0&&(Se=1),ht.setLineWidth(Se*Ze()),z.isLineSegments?jt.setMode(L.LINES):z.isLineLoop?jt.setMode(L.LINE_LOOP):jt.setMode(L.LINE_STRIP)}else z.isPoints?jt.setMode(L.POINTS):z.isSprite&&jt.setMode(L.TRIANGLES);if(z.isBatchedMesh)if(ne.get("WEBGL_multi_draw"))jt.renderMultiDraw(z._multiDrawStarts,z._multiDrawCounts,z._multiDrawCount);else{let Se=z._multiDrawStarts,xt=z._multiDrawCounts,Re=z._multiDrawCount,Wt=mt?g.get(mt).bytesPerElement:1,si=wt.get(O).currentProgram.getUniforms();for(let be=0;be<Re;be++)si.setValue(L,"_gl_DrawID",be),jt.render(Se[be]/Wt,xt[be])}else if(z.isInstancedMesh)jt.renderInstances(yt,ce,z.count);else if(G.isInstancedBufferGeometry){let Se=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,xt=Math.min(G.instanceCount,Se);jt.renderInstances(yt,ce,xt)}else jt.render(yt,ce)};function Nl(_,I,G,O){U!==null&&_.isNodeMaterial&&U.setObject(O,_),he===!0&&q.setState(_,G,!1),_.transparent===!0&&_.side===_n&&_.forceSinglePass===!1?(_.side=Le,_.needsUpdate=!0,ts(_,I,O),_.side=ti,_.needsUpdate=!0,ts(_,I,O),_.side=_n):ts(_,I,O)}this.compile=function(_,I,G=null){G===null&&(G=_),U!==null&&U.renderStart(_,I,G),b=X.get(G),b.init(I),x.push(b),G.traverseVisible(function(z){z.isLight&&z.layers.test(I.layers)&&(b.pushLight(z),z.castShadow&&b.pushShadow(z))}),_!==G&&_.traverseVisible(function(z){z.isLight&&z.layers.test(I.layers)&&(b.pushLight(z),z.castShadow&&b.pushShadow(z))}),b.setupLights(),U!==null&&U.updateLights(b.state.lightsArray),De=this.localClippingEnabled,he=q.init(this.clippingPlanes,De),he===!0&&q.setGlobalState(this.clippingPlanes,I),U!==null&&at.render(b.state.shadowsArray,G,I);let O=new Set;return _.traverse(function(z){if(!(z.isMesh||z.isPoints||z.isLine||z.isSprite))return;let ft=z.material;if(ft)if(Array.isArray(ft))for(let gt=0;gt<ft.length;gt++){let lt=ft[gt];Nl(lt,G,I,z),O.add(lt)}else Nl(ft,G,I,z),O.add(ft)}),b=x.pop(),U!==null&&U.renderEnd(),O},this.compileAsync=function(_,I,G=null){let O=this.compile(_,I,G);return new Promise(z=>{function ft(){if(O.forEach(function(gt){let mt=wt.get(gt).currentProgram;(mt===void 0||mt.isReady())&&O.delete(gt)}),O.size===0){z(_);return}setTimeout(ft,10)}ne.get("KHR_parallel_shader_compile")!==null?ft():setTimeout(ft,10)})};let io=null;function Zf(_){io&&io(_)}function Ll(){ii.stop()}function Dl(){ii.start()}let ii=new Ef;ii.setAnimationLoop(Zf),typeof self<"u"&&ii.setContext(self),this.setAnimationLoop=function(_){io=_,nt.setAnimationLoop(_),_===null?ii.stop():ii.start()},nt.addEventListener("sessionstart",Ll),nt.addEventListener("sessionend",Dl),this.render=function(_,I){if(I!==void 0&&I.isCamera!==!0){Rt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(N===!0)return;U!==null&&U.renderStart(_,I);let G=nt.enabled===!0&&nt.isPresenting===!0,O=D!==null&&(J===null||G)&&D.begin(R,J);if(_.matrixWorldAutoUpdate===!0&&_.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),nt.enabled===!0&&nt.isPresenting===!0&&(D===null||D.isCompositing()===!1)&&(nt.cameraAutoUpdate===!0&&nt.updateCamera(I),I=nt.getCamera()),_.isScene===!0&&_.onBeforeRender(R,_,I,J),b=X.get(_,x.length),b.init(I),b.state.textureUnits=Pt.getTextureUnits(),x.push(b),re.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),I.isArrayCamera?xe.setFromArrayCamera(I):Yt.setFromProjectionMatrix(re,Je,I.reversedDepth),De=this.localClippingEnabled,he=q.init(this.clippingPlanes,De),C=ct.get(_,m.length),C.init(),m.push(C),this.info.render.frame++,nt.enabled===!0&&nt.isPresenting===!0){let gt=R.xr.getDepthSensingMesh();gt!==null&&so(gt,I,-1/0,R.sortObjects)}so(_,I,0,R.sortObjects),C.finish(),U!==null&&U.updateLights(b.state.lightsArray),R.sortObjects===!0&&C.sort(Dt,le),$e=nt.enabled===!1||nt.isPresenting===!1||nt.hasDepthSensing()===!1,$e&&w.addToRenderList(C,_),this.info.autoReset===!0&&this.info.reset(),he===!0&&q.beginShadows();let z=b.state.shadowsArray;if(at.render(z,_,I),he===!0&&q.endShadows(),(O&&D.hasRenderPass())===!1){let gt=C.opaque,lt=C.transmissive;if(b.setupLights(),I.isArrayCamera){let mt=I.cameras;if(lt.length>0)for(let Mt=0,Lt=mt.length;Mt<Lt;Mt++){let Ht=mt[Mt];Ol(gt,lt,_,Ht)}$e&&w.render(_);for(let Mt=0,Lt=mt.length;Mt<Lt;Mt++){let Ht=mt[Mt];Ul(C,_,Ht,Ht.viewport)}}else lt.length>0&&Ol(gt,lt,_,I),$e&&w.render(_),Ul(C,_,I)}J!==null&&Y===0&&(Pt.updateMultisampleRenderTarget(J),Pt.updateRenderTargetMipmap(J)),O&&D.end(R),_.isScene===!0&&_.onAfterRender(R,_,I),rt.resetDefaultState(),W=-1,j=null,x.pop(),x.length>0?(b=x[x.length-1],Pt.setTextureUnits(b.state.textureUnits),he===!0&&q.setGlobalState(R.clippingPlanes,b.state.camera)):b=null,m.pop(),m.length>0?C=m[m.length-1]:C=null,U!==null&&U.renderEnd()};function so(_,I,G,O){if(_.visible===!1)return;if(_.layers.test(I.layers)){if(_.isGroup)G=_.renderOrder;else if(_.isLOD)_.autoUpdate===!0&&_.update(I);else if(_.isLight)b.pushLight(_),_.castShadow&&b.pushShadow(_);else if(_.isSprite){let gt=I.isArrayCamera?xe:Yt;if(!_.frustumCulled||_.intersectsFrustum(gt)){O&&me.setFromMatrixPosition(_.matrixWorld).applyMatrix4(re);let lt=et.update(_),mt=_.material;mt.visible&&C.push(_,lt,mt,G,me.z,null,I)}}else if(_.isMesh||_.isLine||_.isPoints){let gt=I.isArrayCamera?xe:Yt;if(!_.frustumCulled||_.intersectsFrustum(gt)){let lt=et.update(_),mt=_.material;if(O&&(_.boundingSphere!==void 0?(_.boundingSphere===null&&_.computeBoundingSphere(),me.copy(_.boundingSphere.center)):(lt.boundingSphere===null&&lt.computeBoundingSphere(),me.copy(lt.boundingSphere.center)),me.applyMatrix4(_.matrixWorld).applyMatrix4(re)),Array.isArray(mt)){let Mt=lt.groups;for(let Lt=0,Ht=Mt.length;Lt<Ht;Lt++){let yt=Mt[Lt],kt=mt[yt.materialIndex];kt&&kt.visible&&C.push(_,lt,kt,G,me.z,yt,I)}}else mt.visible&&C.push(_,lt,mt,G,me.z,null,I)}}}let ft=_.children;for(let gt=0,lt=ft.length;gt<lt;gt++)so(ft[gt],I,G,O)}function Ul(_,I,G,O){let{opaque:z,transmissive:ft,transparent:gt}=_;b.setupLightsView(G),he===!0&&q.setGlobalState(R.clippingPlanes,G),O&&ht.viewport(tt.copy(O)),z.length>0&&Ks(z,I,G),ft.length>0&&Ks(ft,I,G),gt.length>0&&Ks(gt,I,G),ht.buffers.depth.setTest(!0),ht.buffers.depth.setMask(!0),ht.buffers.color.setMask(!0),ht.setPolygonOffset(!1)}function Ol(_,I,G,O){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[O.id]===void 0){let yt=ne.has("EXT_color_buffer_half_float")||ne.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[O.id]=new ke(1,1,{generateMipmaps:!0,type:yt?un:Oe,minFilter:Dn,samples:Math.max(4,ie.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Vt.workingColorSpace})}let ft=b.state.transmissionRenderTarget[O.id],gt=O.viewport||tt;ft.setSize(gt.z*R.transmissionResolutionScale,gt.w*R.transmissionResolutionScale);let lt=R.getRenderTarget(),mt=R.getActiveCubeFace(),Mt=R.getActiveMipmapLevel();R.setRenderTarget(ft),R.getClearColor($),pt=R.getClearAlpha(),pt<1&&R.setClearColor(16777215,.5),R.clear(),$e&&w.render(G);let Lt=R.toneMapping;R.toneMapping=yn;let Ht=O.viewport;if(O.viewport!==void 0&&(O.viewport=void 0),b.setupLightsView(O),he===!0&&q.setGlobalState(R.clippingPlanes,O),Ks(_,G,O),Pt.updateMultisampleRenderTarget(ft),Pt.updateRenderTargetMipmap(ft),ne.has("WEBGL_multisampled_render_to_texture")===!1){let yt=!1;for(let kt=0,ce=I.length;kt<ce;kt++){let Jt=I[kt],{object:jt,geometry:Se,material:xt,group:Re}=Jt;if(xt.side===_n&&jt.layers.test(O.layers)){let Wt=xt.side;xt.side=Le,xt.needsUpdate=!0,Fl(jt,G,O,Se,xt,Re),xt.side=Wt,xt.needsUpdate=!0,yt=!0}}yt===!0&&(Pt.updateMultisampleRenderTarget(ft),Pt.updateRenderTargetMipmap(ft))}R.setRenderTarget(lt,mt,Mt),R.setClearColor($,pt),Ht!==void 0&&(O.viewport=Ht),R.toneMapping=Lt}function Ks(_,I,G){let O=I.isScene===!0?I.overrideMaterial:null;for(let z=0,ft=_.length;z<ft;z++){let gt=_[z],{object:lt,geometry:mt,group:Mt}=gt,Lt=gt.material;Lt.allowOverride===!0&&O!==null&&(Lt=O),lt.layers.test(G.layers)&&Fl(lt,I,G,mt,Lt,Mt)}}function Fl(_,I,G,O,z,ft){U!==null&&z.isNodeMaterial&&U.setObject(_,z),_.onBeforeRender(R,I,G,O,z,ft),_.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,_.matrixWorld),_.normalMatrix.getNormalMatrix(_.modelViewMatrix),z.onBeforeRender(R,I,G,O,_,ft),z.transparent===!0&&z.side===_n&&z.forceSinglePass===!1?(z.side=Le,z.needsUpdate=!0,R.renderBufferDirect(G,I,O,z,_,ft),z.side=ti,z.needsUpdate=!0,R.renderBufferDirect(G,I,O,z,_,ft),z.side=_n):R.renderBufferDirect(G,I,O,z,_,ft),_.onAfterRender(R,I,G,O,z,ft)}function zl(_){let I=0;for(let G of _)G.texture!==null&&I++;return I}function ts(_,I,G){I.isScene!==!0&&(I=qe);let O=wt.get(_),z=b.state.lights,ft=b.state.shadowsArray,gt=z.state.version,lt=K.getParameters(_,z.state,ft,I,G,b.state.lightProbeGridArray),mt=K.getProgramCacheKey(lt),Mt=O.programs;O.environment=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?I.environment:null,O.fog=I.fog;let Lt=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap;O.envMap=S.get(_.envMap||O.environment,Lt),O.envMapRotation=O.environment!==null&&_.envMap===null?I.environmentRotation:_.envMapRotation,Mt===void 0&&(_.addEventListener("dispose",Zt),Mt=new Map,O.programs=Mt,O.programVariants=new Map);let Ht=Mt.get(mt);if(Ht!==void 0){if(O.currentProgram===Ht&&O.lightsStateVersion===gt)return Yl(_,lt),Ht}else lt.uniforms=K.getUniforms(_),U!==null&&_.isNodeMaterial&&U.build(_,G,lt),_.onBeforeCompile(lt,R),Ht=K.acquireProgram(lt,mt),Mt.set(mt,Ht),O.uniforms=lt.uniforms;let yt=O.uniforms;return(!_.isShaderMaterial&&!_.isRawShaderMaterial||_.clipping===!0)&&(yt.clippingPlanes=q.uniform),Yl(_,lt),O.needsLights=th(_),O.lightsStateVersion=gt,O.needsLights&&(yt.ambientLightColor.value=z.state.ambient,yt.lightProbe.value=z.state.probe,yt.sunLights.value=z.state.sun,yt.sunLightShadows.value=z.state.sunShadow,yt.directionalLights.value=z.state.directional,yt.directionalLightShadows.value=z.state.directionalShadow,yt.spotLights.value=z.state.spot,yt.spotLightShadows.value=z.state.spotShadow,yt.rectAreaLights.value=z.state.rectArea,yt.ltc_1.value=z.state.rectAreaLTC1,yt.ltc_2.value=z.state.rectAreaLTC2,yt.pointLights.value=z.state.point,yt.pointLightShadows.value=z.state.pointShadow,yt.hemisphereLights.value=z.state.hemi,yt.sunShadowMatrix.value=z.state.sunShadowMatrix,yt.sunShadowCascade.value=z.state.sunShadowCascade,yt.directionalShadowMatrix.value=z.state.directionalShadowMatrix,yt.spotLightMatrix.value=z.state.spotLightMatrix,yt.spotLightMap.value=z.state.spotLightMap,yt.pointShadowMatrix.value=z.state.pointShadowMatrix),O.numLightProbeGrids=zl(b.state.lightProbeGridArray),O.currentProgram=Ht,O.uniformsList=null,Ht}function Kf(_,I,G,O,z){let ft=wt.get(_),gt=ft.currentProgram.id+","+O+","+z,lt=ft.programVariants.get(gt);return lt===void 0?(lt=ts(_,I,G),ft.programVariants.set(gt,lt)):(ft.currentProgram=lt,ft.uniformsList=null,ft.outputColorSpace=O,ft.toneMapping=z),lt}function Gl(_){if(_.uniformsList===null){let I=_.currentProgram.getUniforms();_.uniformsList=$i.seqWithValue(I.seq,_.uniforms)}return _.uniformsList}function Yl(_,I){let G=wt.get(_);G.outputColorSpace=I.outputColorSpace,G.batching=I.batching,G.batchingColor=I.batchingColor,G.instancing=I.instancing,G.instancingColor=I.instancingColor,G.instancingMorph=I.instancingMorph,G.skinning=I.skinning,G.morphTargets=I.morphTargets,G.morphNormals=I.morphNormals,G.morphColors=I.morphColors,G.morphTargetsCount=I.morphTargetsCount,G.numClippingPlanes=I.numClippingPlanes,G.numIntersection=I.numClipIntersection,G.vertexAlphas=I.vertexAlphas,G.vertexTangents=I.vertexTangents,G.toneMapping=I.toneMapping}function jf(_,I,G,O,z){I.isScene!==!0&&(I=qe),Pt.resetTextureUnits();let ft=I.fog,gt=O.isMeshStandardMaterial||O.isMeshLambertMaterial||O.isMeshPhongMaterial?I.environment:null,lt=J===null?R.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:Vt.workingColorSpace,mt=O.isMeshStandardMaterial||O.isMeshLambertMaterial&&!O.envMap||O.isMeshPhongMaterial&&!O.envMap,Mt=S.get(O.envMap||gt,mt),Lt=O.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Ht=!!G.attributes.tangent&&(!!O.normalMap||O.anisotropy>0),yt=!!G.morphAttributes.position,kt=!!G.morphAttributes.normal,ce=!!G.morphAttributes.color,Jt=yn;O.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(Jt=R.toneMapping);let jt=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,Se=jt!==void 0?jt.length:0,xt=wt.get(O),Re=b.state.lights;if(he===!0&&(De===!0||_!==j)){let ae=_===j&&O.id===W;q.setState(O,_,ae)}let Wt=!1,si=!1;O.version===xt.__version?xt.needsLights&&xt.lightsStateVersion!==Re.state.version||z.isBatchedMesh&&xt.batching===!1||!z.isBatchedMesh&&xt.batching===!0||z.isBatchedMesh&&xt.batchingColor===!0&&z._colorsTexture===null||z.isBatchedMesh&&xt.batchingColor===!1&&z._colorsTexture!==null||z.isInstancedMesh&&xt.instancing===!1||!z.isInstancedMesh&&xt.instancing===!0||z.isSkinnedMesh&&xt.skinning===!1||!z.isSkinnedMesh&&xt.skinning===!0||z.isInstancedMesh&&xt.instancingColor===!0&&z.instanceColor===null||z.isInstancedMesh&&xt.instancingColor===!1&&z.instanceColor!==null||z.isInstancedMesh&&xt.instancingMorph===!0&&z.morphTexture===null||z.isInstancedMesh&&xt.instancingMorph===!1&&z.morphTexture!==null||xt.envMap!==Mt||O.fog===!0&&xt.fog!==ft||xt.numClippingPlanes!==void 0&&(xt.numClippingPlanes!==q.numPlanes||xt.numIntersection!==q.numIntersection)||xt.vertexAlphas!==Lt||xt.vertexTangents!==Ht||xt.morphTargets!==yt||xt.morphNormals!==kt||xt.morphColors!==ce||xt.morphTargetsCount!==Se||xt.numLightProbeGrids!==zl(b.state.lightProbeGridArray)?Wt=!0:(xt.outputColorSpace!==lt||xt.toneMapping!==Jt)&&(si=!0):(Wt=!0,xt.__version=O.version);let be=xt.currentProgram;(Wt===!0||si===!0)&&(be=si===!0?Kf(O,I,z,lt,Jt):ts(O,I,z),U&&O.isNodeMaterial&&U.onUpdateProgram(O,be,xt));let js=!1,zn=!1,ri=!1,Qt=be.getUniforms(),ve=xt.uniforms;if(ht.useProgram(be.program)&&(js=!0,zn=!0,ri=!0),O.id!==W&&(W=O.id,zn=!0),js||j!==_){ht.buffers.depth.getReversed()&&_.reversedDepth!==!0&&(_._reversedDepth=!0,_.updateProjectionMatrix()),Qt.setValue(L,"projectionMatrix",_.projectionMatrix),Qt.setValue(L,"viewMatrix",_.matrixWorldInverse);let ge=Qt.map.cameraPosition;ge!==void 0&&ge.setValue(L,pn.setFromMatrixPosition(_.matrixWorld)),ie.logarithmicDepthBuffer&&Qt.setValue(L,"logDepthBufFC",2/(Math.log(_.far+1)/Math.LN2)),(O.isMeshPhongMaterial||O.isMeshToonMaterial||O.isMeshLambertMaterial||O.isMeshBasicMaterial||O.isMeshStandardMaterial||O.isShaderMaterial)&&Qt.setValue(L,"isOrthographic",_.isOrthographicCamera===!0),j!==_&&(j=_,zn=!0,ri=!0)}if(xt.needsLights&&(Re.state.sunShadowMap.length>0&&Qt.setValue(L,"sunShadowMap",Re.state.sunShadowMap,Pt),Re.state.directionalShadowMap.length>0&&Qt.setValue(L,"directionalShadowMap",Re.state.directionalShadowMap,Pt),Re.state.spotShadowMap.length>0&&Qt.setValue(L,"spotShadowMap",Re.state.spotShadowMap,Pt),Re.state.pointShadowMap.length>0&&Qt.setValue(L,"pointShadowMap",Re.state.pointShadowMap,Pt)),z.isSkinnedMesh){Qt.setOptional(L,z,"bindMatrix"),Qt.setOptional(L,z,"bindMatrixInverse");let ae=z.skeleton;ae&&(ae.boneTexture===null&&ae.computeBoneTexture(),Qt.setValue(L,"boneTexture",ae.boneTexture,Pt))}z.isBatchedMesh&&(Qt.setOptional(L,z,"batchingTexture"),Qt.setValue(L,"batchingTexture",z._matricesTexture,Pt),Qt.setOptional(L,z,"batchingIdTexture"),Qt.setValue(L,"batchingIdTexture",z._indirectTexture,Pt),Qt.setOptional(L,z,"batchingColorTexture"),z._colorsTexture!==null&&Qt.setValue(L,"batchingColorTexture",z._colorsTexture,Pt));let rn=G.morphAttributes;if((rn.position!==void 0||rn.normal!==void 0||rn.color!==void 0)&&Z.update(z,G,be),(zn||xt.receiveShadow!==z.receiveShadow)&&(xt.receiveShadow=z.receiveShadow,Qt.setValue(L,"receiveShadow",z.receiveShadow)),(O.isMeshStandardMaterial||O.isMeshLambertMaterial||O.isMeshPhongMaterial)&&O.envMap===null&&I.environment!==null&&(ve.envMapIntensity.value=I.environmentIntensity),ve.dfgLUT!==void 0&&(ve.dfgLUT.value=km()),zn){if(Qt.setValue(L,"toneMappingExposure",R.toneMappingExposure),xt.needsLights&&Jf(ve,ri),ft&&O.fog===!0&&st.refreshFogUniforms(ve,ft),st.refreshMaterialUniforms(ve,O,Bt,Ct,b.state.transmissionRenderTarget[_.id]),xt.needsLights&&xt.numLightProbeGrids>0){let ae=M,ge=0;for(let Mn of b.state.lightProbeGridArray)Mn.texture!==null&&(ae.textures[ge]=Mn.texture,ae.min[ge]=Mn.boundingBox.min,ae.max[ge]=Mn.boundingBox.max,ae.resolution[ge]=Mn.resolution,ge++);for(let Mn in ae)ae[Mn].length=ge;ve.probesSH.value=ae.textures,ve.probesMin.value=ae.min,ve.probesMax.value=ae.max,ve.probesResolution.value=ae.resolution}$i.upload(L,Gl(xt),ve,Pt)}if(O.isShaderMaterial&&O.uniformsNeedUpdate===!0&&($i.upload(L,Gl(xt),ve,Pt),O.uniformsNeedUpdate=!1),O.isSpriteMaterial&&Qt.setValue(L,"center",z.center),Qt.setValue(L,"modelViewMatrix",z.modelViewMatrix),Qt.setValue(L,"normalMatrix",z.normalMatrix),Qt.setValue(L,"modelMatrix",z.matrixWorld),O.uniformsGroups!==void 0){let ae=O.uniformsGroups;for(let ge=0,Mn=ae.length;ge<Mn;ge++){let kl=ae[ge];St.update(kl,be),St.bind(kl,be)}}return be}function Jf(_,I){_.ambientLightColor.needsUpdate=I,_.lightProbe.needsUpdate=I,_.sunLights.needsUpdate=I,_.sunLightShadows.needsUpdate=I,_.directionalLights.needsUpdate=I,_.directionalLightShadows.needsUpdate=I,_.pointLights.needsUpdate=I,_.pointLightShadows.needsUpdate=I,_.spotLights.needsUpdate=I,_.spotLightShadows.needsUpdate=I,_.rectAreaLights.needsUpdate=I,_.hemisphereLights.needsUpdate=I}function th(_){return _.isMeshLambertMaterial||_.isMeshToonMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isShadowMaterial||_.isShaderMaterial&&_.lights===!0}this.getActiveCubeFace=function(){return k},this.getActiveMipmapLevel=function(){return Y},this.getRenderTarget=function(){return J},this.setRenderTargetTextures=function(_,I,G){let O=wt.get(_);O.__autoAllocateDepthBuffer=_.resolveDepthBuffer===!1,O.__autoAllocateDepthBuffer===!1&&(O.__useRenderToTexture=!1),wt.get(_.texture).__webglTexture=I,wt.get(_.depthTexture).__webglTexture=O.__autoAllocateDepthBuffer?void 0:G,O.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(_,I){let G=wt.get(_);G.__webglFramebuffer=I,G.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(_,I=0,G=0){J=_,k=I,Y=G;let O=null,z=!1,ft=!1;if(_){let lt=wt.get(_);if(lt.__useDefaultFramebuffer!==void 0){ht.bindFramebuffer(L.FRAMEBUFFER,lt.__webglFramebuffer),tt.copy(_.viewport),vt.copy(_.scissor),Nt=_.scissorTest,ht.viewport(tt),ht.scissor(vt),ht.setScissorTest(Nt),W=-1;return}else if(lt.__webglFramebuffer===void 0)Pt.setupRenderTarget(_);else if(lt.__hasExternalTextures)Pt.rebindTextures(_,wt.get(_.texture).__webglTexture,wt.get(_.depthTexture).__webglTexture);else if(_.depthBuffer){let Lt=_.depthTexture;if(lt.__boundDepthTexture!==Lt){if(Lt!==null&&wt.has(Lt)&&(_.width!==Lt.image.width||_.height!==Lt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Pt.setupDepthRenderbuffer(_)}}let mt=_.texture;(mt.isData3DTexture||mt.isDataArrayTexture||mt.isCompressedArrayTexture)&&(ft=!0);let Mt=wt.get(_).__webglFramebuffer;_.isWebGLCubeRenderTarget?(Array.isArray(Mt[I])?O=Mt[I][G]:O=Mt[I],z=!0):_.samples>0&&Pt.useMultisampledRTT(_)===!1?O=wt.get(_).__webglMultisampledFramebuffer:Array.isArray(Mt)?O=Mt[G]:O=Mt,tt.copy(_.viewport),vt.copy(_.scissor),Nt=_.scissorTest}else tt.copy(Et).multiplyScalar(Bt).floor(),vt.copy($t).multiplyScalar(Bt).floor(),Nt=Kt;if(G!==0&&(O=V),ht.bindFramebuffer(L.FRAMEBUFFER,O)&&ht.drawBuffers(_,O),ht.viewport(tt),ht.scissor(vt),ht.setScissorTest(Nt),z){let lt=wt.get(_.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+I,lt.__webglTexture,G)}else if(ft){let lt=I;for(let mt=0;mt<_.textures.length;mt++){let Mt=wt.get(_.textures[mt]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+mt,Mt.__webglTexture,G,lt)}}else if(_!==null&&G!==0){let lt=wt.get(_.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,lt.__webglTexture,G)}W=-1};function Hl(_){let I=wt.get(_);return(I.__readFormat!==_.format||I.__readType!==_.type)&&(I.__readFormat=_.format,I.__readType=_.type,I.__formatReadable=ie.textureFormatReadable(_.format),I.__typeReadable=ie.textureTypeReadable(_.type)),I}this.readRenderTargetPixels=function(_,I,G,O,z,ft,gt,lt=0){if(!(_&&_.isWebGLRenderTarget)){Rt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let mt=wt.get(_).__webglFramebuffer;if(_.isWebGLCubeRenderTarget&&gt!==void 0&&(mt=mt[gt],Array.isArray(mt)&&(mt=mt[0])),mt){ht.bindFramebuffer(L.FRAMEBUFFER,mt);try{let Mt=_.textures[lt],Lt=Mt.format,Ht=Mt.type;_.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+lt);let yt=Hl(Mt);if(yt.__formatReadable===!1){Rt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(yt.__typeReadable===!1){Rt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=_.width-O&&G>=0&&G<=_.height-z&&L.readPixels(I,G,O,z,it.convert(Lt),it.convert(Ht),ft)}finally{let Mt=J!==null?wt.get(J).__webglFramebuffer:null;ht.bindFramebuffer(L.FRAMEBUFFER,Mt)}}},this.readRenderTargetPixelsAsync=async function(_,I,G,O,z,ft,gt,lt=0){if(!(_&&_.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let mt=wt.get(_).__webglFramebuffer;if(_.isWebGLCubeRenderTarget&&gt!==void 0&&(mt=mt[gt],Array.isArray(mt)&&(mt=mt[0])),mt)if(I>=0&&I<=_.width-O&&G>=0&&G<=_.height-z){ht.bindFramebuffer(L.FRAMEBUFFER,mt);let Mt=_.textures[lt],Lt=Mt.format,Ht=Mt.type;_.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+lt);let yt=Hl(Mt);if(yt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(yt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let kt=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,kt),L.bufferData(L.PIXEL_PACK_BUFFER,ft.byteLength,L.STREAM_READ),L.readPixels(I,G,O,z,it.convert(Lt),it.convert(Ht),0),L.bindBuffer(L.PIXEL_PACK_BUFFER,null);let ce=J!==null?wt.get(J).__webglFramebuffer:null;ht.bindFramebuffer(L.FRAMEBUFFER,ce);let Jt=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await Jc(L,Jt,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,kt),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,ft),L.bindBuffer(L.PIXEL_PACK_BUFFER,null),L.deleteBuffer(kt),L.deleteSync(Jt),ft}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(_,I=null,G=0){let O=Math.pow(2,-G),z=Math.floor(_.image.width*O),ft=Math.floor(_.image.height*O),gt=I!==null?I.x:0,lt=I!==null?I.y:0;Pt.setTexture2D(_,0),L.copyTexSubImage2D(L.TEXTURE_2D,G,0,0,gt,lt,z,ft),ht.unbindTexture()},this.copyTextureToTexture=function(_,I,G=null,O=null,z=0,ft=0){let gt,lt,mt,Mt,Lt,Ht,yt,kt,ce,Jt=_.isCompressedTexture?_.mipmaps[ft]:_.image;if(G!==null)gt=G.max.x-G.min.x,lt=G.max.y-G.min.y,mt=G.isBox3?G.max.z-G.min.z:1,Mt=G.min.x,Lt=G.min.y,Ht=G.isBox3?G.min.z:0;else{let Qt=Math.pow(2,-z);gt=Math.floor(Jt.width*Qt),lt=Math.floor(Jt.height*Qt),_.isDataArrayTexture?mt=Jt.depth:_.isData3DTexture?mt=Math.floor(Jt.depth*Qt):mt=1,Mt=0,Lt=0,Ht=0}O!==null?(yt=O.x,kt=O.y,ce=O.z):(yt=0,kt=0,ce=0);let jt=it.convert(I.format),Se=it.convert(I.type),xt;I.isData3DTexture?(Pt.setTexture3D(I,0),xt=L.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(Pt.setTexture2DArray(I,0),xt=L.TEXTURE_2D_ARRAY):(Pt.setTexture2D(I,0),xt=L.TEXTURE_2D),ht.activeTexture(L.TEXTURE0),ht.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,I.flipY),ht.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),ht.pixelStorei(L.UNPACK_ALIGNMENT,I.unpackAlignment);let Re=ht.getParameter(L.UNPACK_ROW_LENGTH),Wt=ht.getParameter(L.UNPACK_IMAGE_HEIGHT),si=ht.getParameter(L.UNPACK_SKIP_PIXELS),be=ht.getParameter(L.UNPACK_SKIP_ROWS),js=ht.getParameter(L.UNPACK_SKIP_IMAGES);ht.pixelStorei(L.UNPACK_ROW_LENGTH,Jt.width),ht.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Jt.height),ht.pixelStorei(L.UNPACK_SKIP_PIXELS,Mt),ht.pixelStorei(L.UNPACK_SKIP_ROWS,Lt),ht.pixelStorei(L.UNPACK_SKIP_IMAGES,Ht);let zn=_.isDataArrayTexture||_.isData3DTexture,ri=I.isDataArrayTexture||I.isData3DTexture;if(_.isDepthTexture){let Qt=wt.get(_),ve=wt.get(I),rn=wt.get(Qt.__renderTarget),ae=wt.get(ve.__renderTarget);ht.bindFramebuffer(L.READ_FRAMEBUFFER,rn.__webglFramebuffer),ht.bindFramebuffer(L.DRAW_FRAMEBUFFER,ae.__webglFramebuffer);for(let ge=0;ge<mt;ge++)zn&&(L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,wt.get(_).__webglTexture,z,Ht+ge),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,wt.get(I).__webglTexture,ft,ce+ge)),L.blitFramebuffer(Mt,Lt,Mt+gt,Lt+lt,yt,kt,yt+gt,kt+lt,L.DEPTH_BUFFER_BIT,L.NEAREST);ht.bindFramebuffer(L.READ_FRAMEBUFFER,null),ht.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(z!==0||_.isRenderTargetTexture||wt.has(_)){let Qt=wt.get(_),ve=wt.get(I);ht.bindFramebuffer(L.READ_FRAMEBUFFER,E),ht.bindFramebuffer(L.DRAW_FRAMEBUFFER,H);for(let rn=0;rn<mt;rn++)zn?L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Qt.__webglTexture,z,Ht+rn):L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,Qt.__webglTexture,z),ri?L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,ve.__webglTexture,ft,ce+rn):L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,ve.__webglTexture,ft),z!==0?L.blitFramebuffer(Mt,Lt,Mt+gt,Lt+lt,yt,kt,yt+gt,kt+lt,L.COLOR_BUFFER_BIT,L.NEAREST):ri?L.copyTexSubImage3D(xt,ft,yt,kt,ce+rn,Mt,Lt,gt,lt):L.copyTexSubImage2D(xt,ft,yt,kt,Mt,Lt,gt,lt);ht.bindFramebuffer(L.READ_FRAMEBUFFER,null),ht.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else ri?_.isDataTexture||_.isData3DTexture?L.texSubImage3D(xt,ft,yt,kt,ce,gt,lt,mt,jt,Se,Jt.data):I.isCompressedArrayTexture?L.compressedTexSubImage3D(xt,ft,yt,kt,ce,gt,lt,mt,jt,Jt.data):L.texSubImage3D(xt,ft,yt,kt,ce,gt,lt,mt,jt,Se,Jt):_.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,ft,yt,kt,gt,lt,jt,Se,Jt.data):_.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,ft,yt,kt,Jt.width,Jt.height,jt,Jt.data):L.texSubImage2D(L.TEXTURE_2D,ft,yt,kt,gt,lt,jt,Se,Jt);ht.pixelStorei(L.UNPACK_ROW_LENGTH,Re),ht.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Wt),ht.pixelStorei(L.UNPACK_SKIP_PIXELS,si),ht.pixelStorei(L.UNPACK_SKIP_ROWS,be),ht.pixelStorei(L.UNPACK_SKIP_IMAGES,js),ft===0&&I.generateMipmaps===!0&&I.mipmapsAutoUpdate===!0&&L.generateMipmap(xt),ht.unbindTexture()},this.initRenderTarget=function(_){wt.get(_).__webglFramebuffer===void 0&&Pt.setupRenderTarget(_)},this.initTexture=function(_){_.isCubeTexture?Pt.setTextureCube(_,0):_.isData3DTexture?Pt.setTexture3D(_,0):_.isDataArrayTexture||_.isCompressedArrayTexture?Pt.setTexture2DArray(_,0):Pt.setTexture2D(_,0),ht.unbindTexture()},this.resetState=function(){k=0,Y=0,J=null,ht.reset(),rt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Je}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=Vt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Vt._getUnpackColorSpace()}};var Gf={type:"change"},Il={type:"start"},Hf={type:"end"},$a=new zi,Yf=new Ye,Qm=Math.cos(70*pl.DEG2RAD),Be=new P,Fe=2*Math.PI,Xt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Rl=1e-6,Za=class extends Ls{constructor(t,e=null){super(t,e),this.state=Xt.NONE,this.target=new P,this.cursor=new P,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:jn.ROTATE,MIDDLE:jn.DOLLY,RIGHT:jn.PAN},this.touches={ONE:Jn.ROTATE,TWO:Jn.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new P,this._lastQuaternion=new He,this._lastTargetPosition=new P,this._quat=new He().setFromUnitVectors(t.up,new P(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new ki,this._sphericalDelta=new ki,this._scale=1,this._panOffset=new P,this._rotateStart=new At,this._rotateEnd=new At,this._rotateDelta=new At,this._panStart=new At,this._panEnd=new At,this._panDelta=new At,this._dollyStart=new At,this._dollyEnd=new At,this._dollyDelta=new At,this._dollyDirection=new P,this._mouse=new At,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Xm.bind(this),this._onPointerDown=Wm.bind(this),this._onPointerUp=qm.bind(this),this._onContextMenu=eA.bind(this),this._onMouseWheel=Km.bind(this),this._onKeyDown=jm.bind(this),this._onTouchStart=Jm.bind(this),this._onTouchMove=tA.bind(this),this._onMouseDown=$m.bind(this),this._onMouseMove=Zm.bind(this),this._interceptControlDown=nA.bind(this),this._interceptControlUp=iA.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(t){this._cursorStyle=t,t==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.ownerDocument.addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=Xt.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.ownerDocument.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.ownerDocument.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Gf),this.update(),this.state=Xt.NONE}pan(t,e){this._pan(t,e),this.update()}dollyIn(t){this._dollyIn(t),this.update()}dollyOut(t){this._dollyOut(t),this.update()}rotateLeft(t){this._rotateLeft(t),this.update()}rotateUp(t){this._rotateUp(t),this.update()}update(t=null){let e=this.object.position;Be.copy(e).sub(this.target),Be.applyQuaternion(this._quat),this._spherical.setFromVector3(Be),this.autoRotate&&this.state===Xt.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=Fe:n>Math.PI&&(n-=Fe),s<-Math.PI?s+=Fe:s>Math.PI&&(s-=Fe),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(Be.setFromSpherical(this._spherical),Be.applyQuaternion(this._quatInverse),e.copy(this.target).add(Be),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){let o=Be.length();a=this._clampDistance(o*this._scale);let c=o-a;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),r=!!c}else if(this.object.isOrthographicCamera){let o=new P(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=c!==this.object.zoom;let l=new P(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(o),this.object.updateMatrixWorld(),a=Be.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):($a.origin.copy(this.object.position),$a.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot($a.direction))<Qm?this.object.lookAt(this.target):(Yf.setFromNormalAndCoplanarPoint(this.object.up,this.target),$a.intersectPlane(Yf,this.target))))}else if(this.object.isOrthographicCamera){let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Rl||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Rl||this._lastTargetPosition.distanceToSquared(this.target)>Rl?(this.dispatchEvent(Gf),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?Fe/60*this.autoRotateSpeed*t:Fe/60/60*this.autoRotateSpeed}_getZoomScale(t){let e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){Be.setFromMatrixColumn(e,0),Be.multiplyScalar(-t),this._panOffset.add(Be)}_panUp(t,e){this.screenSpacePanning===!0?Be.setFromMatrixColumn(e,1):(Be.setFromMatrixColumn(e,0),Be.crossVectors(this.object.up,Be)),Be.multiplyScalar(t),this._panOffset.add(Be)}_pan(t,e){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;Be.copy(s).sub(this.target);let r=Be.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=t-n.left,r=e-n.top,a=n.width,o=n.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientY),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(Fe*this._rotateDelta.x/e.clientHeight),this._rotateUp(Fe*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.zoomToCursor&&(this._performCursorZoom=!0,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(Fe*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-Fe*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(Fe*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-Fe*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(n,s)}}_handleTouchStartDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),s=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(Fe*this._rotateDelta.x/e.clientHeight),this._rotateUp(Fe*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(t.pageX+e.x)*.5,o=(t.pageY+e.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new At,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){let e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Wm(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function Xm(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function qm(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Hf),this.state=Xt.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function $m(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case jn.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=Xt.DOLLY;break;case jn.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Xt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Xt.ROTATE}break;case jn.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Xt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Xt.PAN}break;default:this.state=Xt.NONE}this.state!==Xt.NONE&&this.dispatchEvent(Il)}function Zm(i){switch(this.state){case Xt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case Xt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case Xt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function Km(i){this.enabled===!1||this.enableZoom===!1||this.state!==Xt.NONE||(i.preventDefault(),this.dispatchEvent(Il),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(Hf))}function jm(i){this.enabled!==!1&&this._handleKeyDown(i)}function Jm(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Jn.ROTATE:if(this.enableRotate===!1){this.state=Xt.NONE;break}this._handleTouchStartRotate(i),this.state=Xt.TOUCH_ROTATE;break;case Jn.PAN:if(this.enablePan===!1){this.state=Xt.NONE;break}this._handleTouchStartPan(i),this.state=Xt.TOUCH_PAN;break;default:this.state=Xt.NONE}break;case 2:switch(this.touches.TWO){case Jn.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=Xt.TOUCH_DOLLY_PAN;break;case Jn.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=Xt.TOUCH_DOLLY_ROTATE;break;default:this.state=Xt.NONE}break;default:this.state=Xt.NONE}this.state!==Xt.NONE&&this.dispatchEvent(Il)}function tA(i){switch(this._trackPointer(i),this.state){case Xt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case Xt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case Xt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case Xt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=Xt.NONE}}function eA(i){this.enabled!==!1&&i.preventDefault()}function nA(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.ownerDocument.addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function iA(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.ownerDocument.removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var Ka=class extends ui{constructor(t){super(t)}load(t,e,n,s){let r=this,a=new ws(this.manager);a.setPriority(this.priority),a.setCache(this.cache),a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(t,function(o){try{e(r.parse(o))}catch(c){s?s(c):console.error(c),r.manager.itemError(t)}},n,s)}parse(t){function e(l){let f=new DataView(l),d=32/8*3+32/8*3*3+16/8,h=f.getUint32(80,!0);if(80+32/8+h*d===f.byteLength)return!0;let A=[115,111,108,105,100];for(let y=0;y<5;y++)if(n(A,f,y))return!1;return!0}function n(l,f,d){for(let h=0,u=l.length;h<u;h++)if(l[h]!==f.getUint8(d+h))return!1;return!0}function s(l){let f=new DataView(l),d=f.getUint32(80,!0),h,u,A,y=!1,B,p,v,T,M;for(let N=0;N<=70;N++)f.getUint32(N,!1)==1129270351&&f.getUint8(N+4)==82&&f.getUint8(N+5)==61&&(y=!0,B=new Float32Array(d*3*3),p=f.getUint8(N+6)/255,v=f.getUint8(N+7)/255,T=f.getUint8(N+8)/255,M=f.getUint8(N+9)/255);let C=84,b=50,m=new Ve,x=new Float32Array(d*3*3),D=new Float32Array(d*3*3),R=new Gt;for(let N=0;N<d;N++){let U=C+N*b,V=f.getFloat32(U,!0),E=f.getFloat32(U+4,!0),H=f.getFloat32(U+8,!0);if(y){let k=f.getUint16(U+48,!0);(k&32768)===0?(h=(k&31)/31,u=(k>>5&31)/31,A=(k>>10&31)/31):(h=p,u=v,A=T)}for(let k=1;k<=3;k++){let Y=U+k*12,J=N*3*3+(k-1)*3;x[J]=f.getFloat32(Y,!0),x[J+1]=f.getFloat32(Y+4,!0),x[J+2]=f.getFloat32(Y+8,!0),D[J]=V,D[J+1]=E,D[J+2]=H,y&&(R.setRGB(h,u,A,Me),B[J]=R.r,B[J+1]=R.g,B[J+2]=R.b)}}return m.setAttribute("position",new Ue(x,3)),m.setAttribute("normal",new Ue(D,3)),y&&(m.setAttribute("color",new Ue(B,3)),m.hasColors=!0,m.alpha=M),m}function r(l){let f=new Ve,d=/solid([\s\S]*?)endsolid/g,h=/facet([\s\S]*?)endfacet/g,u=/solid\s(.+)/,A=0,y=/[\s]+([+-]?(?:\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?)/.source,B=new RegExp("vertex"+y+y+y,"g"),p=new RegExp("normal"+y+y+y,"g"),v=[],T=[],M=[],C=new P,b,m=0,x=0,D=0;for(;(b=d.exec(l))!==null;){x=D;let R=b[0],N=(b=u.exec(R))!==null?b[1]:"";for(M.push(N);(b=h.exec(R))!==null;){let E=0,H=0,k=b[0];for(;(b=p.exec(k))!==null;)C.x=parseFloat(b[1]),C.y=parseFloat(b[2]),C.z=parseFloat(b[3]),H++;for(;(b=B.exec(k))!==null;)v.push(parseFloat(b[1]),parseFloat(b[2]),parseFloat(b[3])),T.push(C.x,C.y,C.z),E++,D++;H!==1&&console.error("THREE.STLLoader: Something isn't right with the normal of face number "+A),E!==3&&console.error("THREE.STLLoader: Something isn't right with the vertices of face number "+A),A++}let U=x,V=D-x;f.userData.groupNames=M,f.addGroup(U,V,m),m++}return f.setAttribute("position",new oe(v,3)),f.setAttribute("normal",new oe(T,3)),f}function a(l){return typeof l!="string"?new TextDecoder().decode(l):l}function o(l){if(typeof l=="string"){let f=new Uint8Array(l.length);for(let d=0;d<l.length;d++)f[d]=l.charCodeAt(d)&255;return f.buffer||f}else return l}let c=o(t);return e(c)?s(c):r(a(t))}};var Xs=new P;function en(i,t,e,n,s,r){let a=2*Math.PI*s/4,o=Math.max(r-2*s,0),c=Math.PI/4;Xs.copy(t),Xs[n]=0,Xs.normalize();let l=.5*a/(a+o),f=1-Xs.angleTo(i)/c;return Math.sign(Xs[e])===1?f*l:o/(a+o)+l+l*(1-f)}var ja=class i extends An{constructor(t=1,e=1,n=1,s=2,r=.1){let a=s*2+1;if(r=Math.min(t/2,e/2,n/2,r),super(1,1,1,a,a,a),this.type="RoundedBoxGeometry",this.parameters={width:t,height:e,depth:n,segments:s,radius:r},a===1)return;let o=this.toNonIndexed();this.index=null,this.attributes.position=o.attributes.position,this.attributes.normal=o.attributes.normal,this.attributes.uv=o.attributes.uv;let c=new P,l=new P,f=new P(t,e,n).divideScalar(2).subScalar(r),d=this.attributes.position.array,h=this.attributes.normal.array,u=this.attributes.uv.array,A=d.length/6,y=new P,B=.5/a;for(let p=0,v=0;p<d.length;p+=3,v+=2)switch(c.fromArray(d,p),l.copy(c),l.x-=Math.sign(l.x)*B,l.y-=Math.sign(l.y)*B,l.z-=Math.sign(l.z)*B,l.normalize(),d[p+0]=f.x*Math.sign(c.x)+l.x*r,d[p+1]=f.y*Math.sign(c.y)+l.y*r,d[p+2]=f.z*Math.sign(c.z)+l.z*r,h[p+0]=l.x,h[p+1]=l.y,h[p+2]=l.z,Math.floor(p/A)){case 0:y.set(1,0,0),u[v+0]=en(y,l,"z","y",r,n),u[v+1]=1-en(y,l,"y","z",r,e);break;case 1:y.set(-1,0,0),u[v+0]=1-en(y,l,"z","y",r,n),u[v+1]=1-en(y,l,"y","z",r,e);break;case 2:y.set(0,1,0),u[v+0]=1-en(y,l,"x","z",r,t),u[v+1]=en(y,l,"z","x",r,n);break;case 3:y.set(0,-1,0),u[v+0]=1-en(y,l,"x","z",r,t),u[v+1]=1-en(y,l,"z","x",r,n);break;case 4:y.set(0,0,1),u[v+0]=1-en(y,l,"x","y",r,t),u[v+1]=1-en(y,l,"y","x",r,e);break;case 5:y.set(0,0,-1),u[v+0]=en(y,l,"x","y",r,t),u[v+1]=1-en(y,l,"y","x",r,e);break}}static fromJSON(t){return new i(t.width,t.height,t.depth,t.segments,t.radius)}};var qs=Uint8Array.fromBase64("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");var $s=document.querySelector("canvas"),to=new ms,Ki=new Ie(35,1,1,2e3),Ja=new Wa({canvas:$s,antialias:!0,alpha:!0});Ja.setPixelRatio(Math.min(2,devicePixelRatio));var ji=new Za(Ki,$s);ji.enableDamping=!0;ji.minDistance=135;ji.maxDistance=800;function eo(i){let t=new Rn;return i.add(t),t}var Pl=eo(to);Pl.rotation.x=-Math.PI/2;function Ji(i,t,e,n,s={}){let r=new Qe(t,new Ts({color:e,...s}));return i.add(r),r.position.set(...n),r}function Xe(i,t,e,n,s,r,a,o,c=0,l){return Ji(i,c?new ja(t,e,n,3,c):new An(t,e,n),s,[r,a,o],l)}function kf(i,t){Ji(i,new bs(new Yi(t.map(e=>new P(...e))),28,1.2,8,!1),3160891,[0,0,0])}var rA=new Ka().parse(qs.buffer.slice(qs.byteOffset,qs.byteOffset+qs.byteLength));Ji(Pl,rA,13490124,[0,0,0]);var Zs=eo(Pl),sn=eo(Zs);sn.position.set(0,-28,3);sn.rotation.x=77*Math.PI/180;Xe(sn,164.9,101,2,2319959,0,68,5,1);Xe(sn,164.28,99.17,4,2370865,0,68,8,1.4);for(let i of[-78.45,78.45])for(let t of[10.52,125.48]){Xe(sn,8,17,1.6,2319959,i,t<60?t+4:t-4,4.8,1);let e=Ji(sn,new fi(2.5,2.5,1.2,20),11253949,[i,t,6.3]);e.rotation.x=Math.PI/2}var no=document.createElement("canvas");no.width=1024;no.height=600;var nn=no.getContext("2d");nn.fillStyle="#192f32";nn.fillRect(0,0,1024,600);nn.fillStyle="#eef3e7";nn.font="bold 43px sans-serif";nn.fillText("Toki",46,64);["S\xED","No","Agua","Ayuda"].forEach((i,t)=>{let e=40+t%2*480,n=100+Math.floor(t/2)*240;nn.fillStyle=["#c5eadb","#ffdabd","#c4ddf2","#f2e7ab"][t],nn.beginPath(),nn.roundRect(e,n,455,212,18),nn.fill(),nn.fillStyle="#1d3635",nn.font="bold 68px sans-serif",nn.fillText(i,e+38,n+126)});var Vf=new ys(no);Vf.colorSpace=Me;var Qf=new Qe(new hi(154.21,85.92),new Gi({map:Vf}));sn.add(Qf);Qf.position.set(0,68,10.1);Xe(sn,33,16,5,2370606,0,142,3,1);Xe(sn,33,6,14,2370606,0,148,-1,2);Xe(sn,33,13,4,2370606,0,141,-7,1);Xe(sn,62,20,21,2700085,0,157,1,7);var aA=Ji(sn,new fi(7,7,2.5,36),1122602,[0,157,12]);aA.rotation.x=Math.PI/2;var ni=eo(Zs);ni.position.set(0,49,7);Xe(ni,92.6,63.4,32.5,12637398,0,0,16.25,2.5,{transparent:!0,opacity:.27,depthWrite:!1});Xe(ni,85,56,1.6,3176280,0,0,6,1);for(let i of[-17,0,17])Xe(ni,18,14,14,10267049,35,i,14,1);Xe(ni,17,17,5,7503230,-5,-4,10,1);Xe(ni,30,30,4,2568753,-8,-2,27,2);var oA=Ji(ni,new fi(12,12,2,36),5792606,[-8,-2,30]);oA.rotation.x=Math.PI/2;for(let i=0;i<4;i++)Xe(ni,22,1.3,1,2239788,-8,-2,31.4).rotation.z=i*Math.PI/4;kf(Zs,[[0,6,151],[6,20,142],[6,27,65],[44,39,35],[48,46,20]]);kf(Zs,[[-84,-2,92],[-95,2,88],[-91,19,40],[-53,23,19],[-29,17,18]]);to.add(new Rs(16776434,9609113,2.1));var Wf=new Ns(16774626,2.4);Wf.position.set(-150,250,160);to.add(Wf);var Xf="front";function qf(i){Xf=i,Zs.visible=i!=="support";let t=Math.max(1,1.3/Ki.aspect);Ki.position.set(...i==="back"?[208*t,209*t,-327*t]:i==="support"?[192*t,198*t,-310*t]:[125*t,137*t,305*t]),ji.target.set(0,75,-10),ji.update(),document.querySelectorAll("button").forEach(e=>e.setAttribute("aria-pressed",String(e.dataset.view===i)))}function $f(){let i=$s.parentNode.clientWidth,t=$s.parentNode.clientHeight;Ja.setSize(i,t,!1),Ki.aspect=i/t,Ki.updateProjectionMatrix(),qf(Xf)}new ResizeObserver($f).observe($s.parentNode);document.querySelectorAll("button").forEach(i=>i.onclick=()=>qf(i.dataset.view));$f();Ja.setAnimationLoop(()=>{ji.update(),Ja.render(to,Ki)});})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
