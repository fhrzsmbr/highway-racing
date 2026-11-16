import * as THREE from 'three';
import {TYPES,STATIONS,STATION_T,LW,MH,DIV,WID,SPL,TR,MERGE,hwp,H,fc,carr,bnd,C,C1,C2,makeSeg} from './roads.js';
import {Traffic} from './traffic.js';
import * as LB from './leaderboard.js';
import {Sound} from './audio.js';
const $=id=>document.getElementById(id),R=(a,b)=>a+Math.random()*(b-a),sm=x=>x*x*(3-2*x),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(65,1,.2,1800),ren=new THREE.WebGLRenderer({antialias:true});
$('game').appendChild(ren.domElement);
const hemi=new THREE.HemisphereLight(0xffffff,0x445533,1),sun=new THREE.DirectionalLight(0xffffff,.8);sun.position.set(-40,80,30);scene.add(hemi,sun);
const box=(w,h,l,c)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,l),new THREE.MeshLambertMaterial({color:c}));
const ground=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000),new THREE.MeshLambertMaterial({color:0x3d6b35}));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;scene.add(ground);
const resize=()=>{ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();};addEventListener('resize',resize);resize();
// játékos autó
const car=new THREE.Group(),body=box(1.9,.6,4.2,0xd02020),cab=box(1.6,.5,2.1,0x223344);body.position.y=.55;cab.position.set(0,1.1,.3);car.add(body,cab);
for(const x of[-1,1])for(const z of[-1.4,1.4]){const w=box(.3,.6,.7,0x111111);w.position.set(x*.95,.3,z);car.add(w);}
const tl=new THREE.Mesh(new THREE.BoxGeometry(1.5,.15,.1),new THREE.MeshBasicMaterial({color:0xff0000}));tl.position.set(0,.65,2.1);car.add(tl);
const smoke=new THREE.Mesh(new THREE.SphereGeometry(.8,8,8),new THREE.MeshBasicMaterial({color:0x888888,transparent:true,opacity:.5}));smoke.position.set(0,1.3,-1.6);car.add(smoke);scene.add(car);
const wingM=box(2,.08,.6,0x111111),exM=new THREE.Group(),kitM=new THREE.Group();wingM.position.set(0,1.25,2.05);car.add(wingM);
for(const x of[-.5,.5]){const p=box(.2,.2,.3,0xbbbbbb);p.position.set(x,.3,2.2);exM.add(p);}car.add(exM);
for(const x of[-1,1]){const k=box(.1,.2,3,0x222222);k.position.set(x,.2,0);kitM.add(k);}car.add(kitM);
const trees=[];for(let i=0;i<80;i++){const g=new THREE.Group(),a=box(.5,2.5,.5,0x5a3a1e),b=box(3,3.5,3,0x1f5a2a);a.position.y=1.25;b.position.y=4;g.add(a,b);scene.add(g);trees.push(g);}
const traffic=new Traffic(scene);
// ---- geometria-segédek (minden a globális C(s) görbét követi)
const place=(m,x,y,s)=>{m.position.set(x+C(s),y,-s);m.rotation.y=-Math.atan(C1(s));return m;};
const put=(m,add,x,y,s)=>{place(m,x,y,s);scene.add(m);add(m);return m;};
const MAT=(tex,po)=>new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:po,polygonOffsetUnits:po});
const plain=(c,po=0)=>new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide,polygonOffset:!!po,polygonOffsetFactor:po,polygonOffsetUnits:po});
function mk(P,U,I,mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));if(U)g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);scene.add(m);return m;}
function bandE(mat,s0,s1,lf,rf,y,step){const n=Math.max(1,Math.ceil((s1-s0)/step)),P=[],U=[],I=[];
 for(let i=0;i<=n;i++){const u=i/n,s=s0+(s1-s0)*u,yy=typeof y=='function'?y(s):y;P.push(lf(s)+C(s),yy,-s,rf(s)+C(s),yy,-s);U.push(0,u,1,u);if(i<n){const a=2*i;I.push(a,a+1,a+2,a+1,a+3,a+2);}}
 return mk(P,U,I,mat);}
const band=(mat,s0,s1,xf,wf,y,step)=>bandE(mat,s0,s1,s=>{const u=(s-s0)/(s1-s0);return xf(u)-wf(u);},s=>{const u=(s-s0)/(s1-s0);return xf(u)+wf(u);},y,step);
function wallF(s0,s1,xf,yb,ht,color){const n=Math.max(1,Math.ceil((s1-s0)/30)),P=[],I=[];
 for(let i=0;i<=n;i++){const s=s0+(s1-s0)*i/n,x=xf(s)+C(s),y=yb(s);P.push(x,y,-s,x,y+ht,-s);if(i<n){const a=2*i;I.push(a,a+1,a+2,a+1,a+3,a+2);}}
 return mk(P,null,I,plain(color));}
const wall=(s0,s1,x,y0,y1,color)=>wallF(s0,s1,()=>x,()=>y0,y1-y0,color);
const P1={lanes:1,oncoming:0};
function roadTex(p,len){const w=Math.round(hwp(p)*2*16),c=document.createElement('canvas');c.width=w;c.height=160;const g=c.getContext('2d');
 g.fillStyle='#3a3a3e';g.fillRect(0,0,w,160);g.fillStyle='#ddd';g.fillRect(14,0,4,160);g.fillRect(w-18,0,4,160);
 for(let i=1;i<p.lanes;i++){const x=(1.2+i*LW)*16;if(p.oncoming&&i==p.oncoming){g.fillStyle='#e8c020';g.fillRect(x-5,0,3,160);g.fillRect(x+2,0,3,160);}else{g.fillStyle='#ddd';g.fillRect(x-2,0,4,70);}}
 const tx=new THREE.CanvasTexture(c);tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(1,len/10);tx.colorSpace=THREE.SRGBColorSpace;return tx;}
const ribbon=(p,s0,len,xc)=>band(MAT(roadTex(p,len),-2),s0,s0+len,()=>xc,()=>hwp(p),0,25);
// kétirányú út: elválasztott (két külön pálya) vagy elválasztás nélküli; rámpából érkezve fokozatosan kiszélesedik (tp)
function roads(t,s0,len,cx,tp){const a=tp?s0+TR:s0,out=[],f=fc(t);
 if(tp){if(t.div){const p={lanes:t.nf,oncoming:0};out.push(band(MAT(roadTex(p,TR),-2),s0,s0+TR,()=>cx+f,u=>3+(hwp(p)-3)*sm(u),0,20),band(MAT(roadTex(p,TR),-2),s0,s0+TR,()=>cx-f,u=>.05+(hwp(p)-.05)*sm(u),0,20));}
  else{const p={lanes:2*t.nf,oncoming:t.nf};out.push(band(MAT(roadTex(p,TR),-2),s0,s0+TR,u=>cx+f*(1-sm(u)),u=>3+(hwp(p)-3)*sm(u),0,20));}}
 carr(t,cx).forEach(k=>out.push(ribbon(k.p,a,s0+len-a,k.x)));return out;}
const strip=(sg,o)=>{const x0=sg.cx+H(sg.t)-1.2;return band(MAT(roadTex(P1,DIV),-4),sg.jStart,sg.end,u=>x0+(o.fx-x0)*sm(u),u=>3*Math.min(1,.12+u*3),.03,DIV/24);};
function fan(sg,s,d,add){const ops=[...sg.opts].sort((a,b)=>a.dx-b.dx),n=ops.length,W=1536,H2=400,c=document.createElement('canvas');c.width=W;c.height=H2;const g=c.getContext('2d');
 g.fillStyle='#0b5a34';g.fillRect(0,0,W,H2);g.strokeStyle='#fff';g.lineWidth=10;g.strokeRect(5,5,W-10,H2-10);g.fillStyle='#fff';g.textAlign='left';g.font='bold 70px sans-serif';g.fillText(d+' m',30,75);
 const cw=W/n,span=H(sg.t)+60;g.textAlign='center';
 ops.forEach((o,i)=>{const m=i*cw+cw/2,st=o.type?[o.name,TYPES[o.type].sub+(o.tag?' '+o.tag:'')]:[o.label.split(' ')[0],o.label.split(' ').slice(1).join(' ')];
  g.fillStyle=o.col;g.fillRect(i*cw+10,95,cw-20,85);g.fillStyle='#fff';g.font='bold 66px sans-serif';g.fillText(st[0],m,160);
  const tip=m+cl(o.dx/span,-1,1)*cw*.32,an=Math.atan2(-95,tip-m);g.strokeStyle='#fff';g.lineWidth=16;g.beginPath();g.moveTo(m,330);g.lineTo(tip,235);g.stroke();
  g.beginPath();for(const k of[0,2.2,-2.2])g.lineTo(tip+Math.cos(an+k)*30,235+Math.sin(an+k)*30);g.fill();
  g.font='bold 34px sans-serif';g.fillText(st[1],m,380);});
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const Wm=22;
 put(new THREE.Mesh(new THREE.PlaneGeometry(Wm,Wm*H2/W),new THREE.MeshBasicMaterial({map:tx})),add,sg.cx+fc(sg.t),7.4,s);
 for(const d2 of[-1,1])put(box(.5,7.4,.5,0x888888),add,sg.cx+fc(sg.t)+d2*(Wm/2-.5),3.7,s);}
function panel(sg,o,add,x,s){const c=document.createElement('canvas');c.width=512;c.height=160;const g=c.getContext('2d');g.fillStyle=o.col;g.fillRect(0,0,512,160);g.fillStyle='#fff';g.textAlign='center';g.font='bold 80px sans-serif';
 g.fillText(o.type?o.name:o.label.split(' ')[0],256,80);g.font='bold 38px sans-serif';g.fillText(o.type?TYPES[o.type].sub+(o.tag?' '+o.tag:''):o.label.split(' ').slice(1).join(' '),256,138);
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
 put(new THREE.Mesh(new THREE.PlaneGeometry(7,2.2),new THREE.MeshBasicMaterial({map:tx})),add,x,5.6,s);put(box(.3,4.5,.3,0x888888),add,x,2.25,s);}
function sign(sg,s,head,lines,add){const c=document.createElement('canvas');c.width=1024;c.height=320;const g=c.getContext('2d');
 g.fillStyle='#0b6b3a';g.fillRect(0,0,1024,320);g.strokeStyle='#fff';g.lineWidth=8;g.strokeRect(6,6,1012,308);g.fillStyle='#fff';g.font='bold 54px sans-serif';g.fillText(head,30,64);
 g.font='bold 40px sans-serif';lines.forEach((l,i)=>g.fillText(l,30+(i%2)*500,130+(i>>1)*60));
 const W=sg.station?8:22,x=sg.station?sg.cx:sg.cx+fc(sg.t),tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
 put(new THREE.Mesh(new THREE.PlaneGeometry(W,W*.3125),new THREE.MeshBasicMaterial({map:tx})),add,x,6.5,s);
 for(const d of[-1,1])put(box(.4,7,.4,0x888888),add,x+d*(W/2-.3),3.5,s);}
// nem szintbeli kereszteződések: felüljáró / aluljáró
function xing(sg,x,add){const s=x.s,t=sg.t,h=H(t),xl=sg.cx-h-3,xr=sg.cx+h+(x.j?95:3),mid=(xl+xr)/2;
 if(x.k=='over'){put(box(xr-xl,.9,12,0xb8b8b8),add,mid,6.7,s);
  [xl+1,xr-2,sg.cx+h+2.5].concat(t.div?[sg.cx]:[]).forEach(px=>put(box(1.4,6.7,2.4,0x999999),add,px,3.35,s));}
 else{put(new THREE.Mesh(new THREE.PlaneGeometry(xr-xl+220,10).rotateX(-Math.PI/2),plain(0x555559,-1)),add,mid,-.03,s);
  (t.div?[sg.cx-h,sg.cx-MH,sg.cx+MH,sg.cx+h]:[sg.cx-h,sg.cx+h]).forEach(px=>add(wall(s-8,s+8,px,0,1.1,0xcfcfcf)));
  if(t.div)add(band(plain(0x8a8a8a,-2),s-8,s+8,()=>sg.cx,()=>MH,.01,8));}}
// + csomópont: a keresztező autópálya hídja a mi utunk fölött
function crossDeck(sg,add){const s=sg.jStart+DIV*.4,c=sg.cx,h=H(sg.t),xr=c+h+8+22+30;
 put(box(640,1.2,26,0x4a4a50),add,c+100,7.6,s);
 for(const o of[-.4,.4])put(box(640,.04,.3,0xe8c020),add,c+100,8.22,s+o);
 for(const o of[-11.5,11.5])put(box(640,.04,.3,0xffffff),add,c+100,8.22,s+o);
 [c-h-14,xr+4].concat(sg.t.div?[c]:[]).forEach(px=>put(box(2.5,7,2.5,0x8a8a8a),add,px,3.5,s));}
// Y elágazás: az irányunk sávjai bővülnek, majd szétválnak; a leágazó út szembe pályája felüljáróval keresztezi az eredeti utat
function forkBuild(sg,add){const t=sg.t,c=sg.cx,f=sg.fk,a=sg.jStart,b=a+WID,e=sg.end,R1=c+H(t),L1=c-H(t),pF={lanes:TYPES[f.tn].nf,oncoming:0},
 v=s=>cl((s-b)/SPL,0,1),u1=s=>cl((s-a)/WID,0,1),Rf=f.Lb-f.innerGap,bl=R1-1.2,
 lF=s=>bl+(f.Lb-bl)*sm(v(s)),rF=s=>lF(s)+f.WbF*sm(u1(s)),
 rO=s=>L1+1.2+(Rf-L1-1.2)*sm(v(s)),lO=s=>rO(s)-f.widthO*sm(u1(s)),yO=s=>6.8*sm(cl(v(s)*3.5,0,1))*sm(cl((1-v(s))*3.5,0,1));
 add(bandE(MAT(roadTex(pF,e-a),-4),a,e,lF,rF,.03,20));
 add(bandE(MAT(roadTex(pF,e-a),-4),a,e,lO,rO,yO,15));
 add(wallF(a,e,lO,s=>yO(s)-1.2,2.2,0x999999));add(wallF(a,e,rO,s=>yO(s)-1.2,2.2,0x999999));
 for(let s=b;s<=e;s+=30){const y=yO(s),xc=(lO(s)+rO(s))/2;if(y>2&&(xc<L1-3||xc>R1+3))put(box(1.6,y-1.2,1.6,0x999999),add,xc,(y-1.2)/2,s);}
 const s2=b+SPL*.55;panel(sg,sg.opts[1],add,(lF(s2)+rF(s2))/2,s2);}
function build(sg){sg.objs=[];sg.prev=[];const add=m=>{sg.objs.push(m);return m;};
 if(sg.station){const bc=sg.bc=sg.end-40,bg=sg.bg,ex=bg.cx+H(bg.t)-1.2;
  add(ribbon(P1,sg.s0,sg.L,sg.cx));
  put(box(8,5,30,{fuel:0xe0a020,rest:0x4080c0,service:0x888888}[sg.kind]),add,sg.cx+9,2.5,bc);
  sg.boxM=put(new THREE.Mesh(new THREE.PlaneGeometry(3.8,6.3).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffcc00,transparent:true,opacity:.55,polygonOffset:true,polygonOffsetFactor:-5,polygonOffsetUnits:-5})),add,sg.cx,.03,bc);
  for(const[x,z,w,l]of[[-1.95,0,.15,6.5],[1.95,0,.15,6.5],[0,-3.2,3.9,.15],[0,3.2,3.9,.15]])put(box(w,.06,l,0xffffff),add,sg.cx+x,.05,bc-z);
  add(band(MAT(roadTex(P1,MERGE),-4),sg.end,sg.end+MERGE,u=>sg.cx+(ex-sg.cx)*sm(u),u=>3*(1-sm(u))+.15,.03,MERGE/20));
  sign(sg,sg.s0+15,STATIONS[sg.kind],['Állj meg a sárga dobozban!'],add);return;}
 const t=sg.t,Hh=H(t),a=sg.tp?sg.s0+TR:sg.s0;
 roads(t,sg.s0,sg.L,sg.cx,sg.tp).forEach(add);
 if(t.div)add(wall(a,sg.end,sg.cx,0,.8,0xb8b8b8)); // középső elválasztó
 const rs=sg.mg?sg.mg.s1:a;
 add(wall(a,sg.kind=='fork'?sg.jStart:sg.end,sg.cx-Hh-.5,0,.7,0x999999));add(wall(rs,sg.jStart,sg.cx+Hh+.5,0,.7,0x999999));
 if(sg.work){const[x0,x1]=sg.wb;add(band(plain(0xff7a00,-3),sg.w0,sg.w1,()=>(x0+x1)/2,()=>(x1-x0)/2,.9,40));add(wall(sg.w0,sg.w1,x0,0,.9,0xff7a00));add(wall(sg.w0,sg.w1,x1,0,.9,0xff7a00));
  sign(sg,sg.w0-250,sg.name+' ÚTON FOLYÓ MUNKA',['1 sáv lezárva','Max. 60 km/h'],add);}
 sg.xs.forEach(x=>xing(sg,x,add));
 if(sg.kind=='fork')forkBuild(sg,add);
 else sg.opts.slice(1).forEach(o=>{const x0=sg.cx+Hh-1.2;add(strip(sg,o));panel(sg,o,add,x0+(o.fx-x0)*sm(.6),sg.jStart+DIV*.6);});
 if(sg.kind=='cross')crossDeck(sg,add);
 [500,250].forEach(d=>fan(sg,sg.jStart-d,d,add));
 sg.prev.push(...roads(t,sg.end,900,sg.cx,false));
 sg.opts.slice(1).forEach(o=>sg.prev.push(...(o.station?[ribbon(P1,sg.end,140,o.fx)]:roads(TYPES[o.type],sg.end,900,o.cx,!o.fork))));}
const rmList=l=>{(l||[]).forEach(m=>{scene.remove(m);m.geometry.dispose();m.material.map?.dispose();m.material.dispose();});};
const rm=sg=>{rmList(sg.objs);rmList(sg.prev);sg.objs=[];sg.prev=[];};
// ---- állapot
let camX=0,state='menu',last=0,P,cur,old=[],score=0,dist=0,safe=0,tod=.3,rain=false,rainT=60,shake=0,toastT=0,keys={};
const skyC=new THREE.Color();scene.fog=new THREE.FogExp2(0x88aacc,.0016);
function reset(){old.forEach(rm);old=[];if(cur){rm(cur);if(cur.bg)rm(cur.bg);}traffic.clear();cur=makeSeg('D2',0,0);build(cur);
 P={s:0,x:MH+1.2+1.5*LW,v:20,vx:0,hp:100,fuel:100,cool:0,lv:{speed:0,motor:0,steer:0,brake:0,eco:0,wing:0,exhaust:0,kit:0}};camX=MH+1.2+1.5*LW;vis();score=0;dist=0;safe=0;}
function advance(o){const par=cur;rmList(par.prev);par.prev=[];old.push(par);
 if(o.station){ // a főút látható marad a lehajtó mellett, és ugyanarra a típusra/számra csatlakozunk vissza
  const bg=makeSeg(par.t.id,par.end,par.cx,par.name,false),st={t:STATION_T,station:true,kind:o.station,s0:par.end,L:140,end:par.end+140,cx:o.fx,opts:[],jStart:1e12,done:false,name:o.label,vend:par.end+140+MERGE,bg};
  bg.mg={s0:st.end,s1:st.end+MERGE,x0:st.cx,ex:par.cx+H(par.t)-1.2};cur=st;build(st);build(bg);}
 else{cur=makeSeg(o.type,par.end,o.cx,o.name,!o.fork);build(cur);}}
function choose(){const sg=cur,[lo,hi]=bnd(sg);let o=sg.opts[0],bd=Math.max(0,lo-P.x,P.x-hi);
 for(const q of sg.opts.slice(1)){const d=Math.abs(P.x-q.fx);if(d<bd){bd=d;o=q;}}
 score+=o.straight?50:200;toast(o.straight?'+50 egyenesen tovább':'+200 útvonalválasztás: '+o.label);advance(o);}
function toast(t){$('toast').textContent=t;toastT=2.5;}
function hit(d,pv){P.hp-=d;P.v*=pv;P.cool=.7;shake=Math.min(1,d/15+.2);safe=0;score-=20+d*3;Sound.crash();}
const CATS={speed:{n:'Végsebesség',d:'+9 km/h végsebesség szintenként, nő a fogyasztás',D:{spd:2.5}},
 motor:{n:'Motor (gyorsulás)',d:'+8% gyorsulás szintenként, nő a fogyasztás',D:{acc:.08}},
 steer:{n:'Kormányzás',d:'+6% kormányzás, stabilabb nagy sebességnél',D:{st:.06,sd:3}},
 brake:{n:'Fékezés',d:'+8% fékerő szintenként',D:{br:.08}},
 eco:{n:'Fogyasztás',d:'−5% fogyasztás szintenként',D:{eco:-.05}},
 wing:{n:'Szárny (kozmetikai)',d:'+1,5% kormány, +2% fék, +1,5% fogyasztás / szint',D:{st:.015,br:.02,eco:.015}},
 exhaust:{n:'Kipufogó (kozmetikai)',d:'+2% gyorsulás, +1,4 km/h, −0,5% kormány, +1% fogyasztás / szint',D:{acc:.02,spd:.4,st:-.005,eco:.01}},
 kit:{n:'Aerokit (kozmetikai)',d:'+2 km/h, −1% kormány, −1% fogyasztás / szint',D:{spd:.55,st:-.01,eco:-.01}}};
const UPG_AT={fuel:['eco'],service:['motor','speed'],rest:['steer','brake','wing','exhaust','kit']};
function stats(){const L=P.lv,S={spd:0,acc:0,st:0,br:0,eco:0,sd:0};
 for(const id in CATS)for(const k in CATS[id].D)S[k]+=CATS[id].D[k]*L[id];
 const perf=L.speed+L.motor,imb=Math.min(.4,Math.max(0,perf-(L.steer+L.brake)-3)*.04);
 return{vb:61+S.spd,acc:1+S.acc,st:(1+S.st)*(1-imb),br:(1+S.br)*(1-imb),eco:Math.max(.4,1+S.eco)*(1+.03*perf),sd:45+S.sd,imb};}
function vis(){const L=P.lv;wingM.visible=L.wing>0;wingM.scale.set(.6+.04*L.wing,1,1+.1*L.wing);exM.visible=L.exhaust>0;exM.scale.setScalar(.8+.05*L.exhaust);kitM.visible=L.kit>0;kitM.scale.set(1,1+.1*L.kit,1);}
const MG={hz:[.16,.11,.07],sp:[2.2,3,3.8]};let ph='up',mg=null;
function openStation(){state='stop';mg=cur.kind=='rest'?null:{r:0,t:0,sum:0,tz:R(.2,.8),pos:0,msg:'',amt:0};ph=mg?'mg':'up';show(['hud','st']);renderStation();}
function mgTick(dt){if(ph!='mg')return;mg.t+=dt*MG.sp[mg.r];const u=(mg.t/Math.PI)%2;mg.pos=u<1?u:2-u;const m=$('mgm');if(m)m.style.left=mg.pos*100+'%';}
function mgStop(){if(state!='stop'||ph!='mg')return;const d=Math.abs(mg.pos-mg.tz),hz=MG.hz[mg.r],p=d<hz*.35?34:d<hz?24:d<hz*2?12:3;
 mg.sum+=p;mg.msg=p>=34?'TÖKÉLETES!':p>=24?'Jó!':p>=12?'Majdnem':'Mellé';mg.r++;mg.tz=R(.2,.8);
 if(mg.r>=3){mg.amt=Math.min(100,mg.sum);if(cur.kind=='fuel')P.fuel=Math.min(100,P.fuel+mg.amt);else P.hp=Math.min(100,P.hp+mg.amt);ph='up';}renderStation();}
function upHTML(){const sg=cur,S=stats();
 return `<h2>Fejlesztések</h2><p>Pontszám: ${Math.floor(score)} · megállásonként 1 fejlesztés${sg.upDone?' (ezt a megállót már felhasználtad)':''}</p>`+UPG_AT[sg.kind].map(id=>{const c=CATS[id],l=P.lv[id],cost=100+60*l;
  return `<div class="up"><b>${c.n}</b> <span class="pips">${'<i class="on"></i>'.repeat(l)}${'<i></i>'.repeat(10-l)}</span> ${l}/10<br><small>${c.d}</small><br><button data-id="${id}" ${sg.upDone||l>=10||score<cost?'disabled':''}>${l>=10?'MAX':'Fejlesztés – '+cost+' pont'}</button></div>`;}).join('')
  +(S.imb?`<p class="wr">⚠ Kiegyensúlyozatlan autó: kormányzás és fék −${Math.round(S.imb*100)}%</p>`:'')+'<button id="go">Tovább az autópályára</button>';}
function renderStation(){const sg=cur;let h;
 if(ph=='mg'){const hz=MG.hz[mg.r];h=`<h1>${STATIONS[sg.kind]}</h1><p>${sg.kind=='fuel'?'Tankolás':'Javítás'}: nyomd meg a <b>Szóközt</b> (vagy a gombot), amikor a jelölő a zöld sávban van! (${mg.r+1}/3)</p><div id="mgb"><div id="mgz" style="left:${(mg.tz-hz)*100}%;width:${hz*200}%"></div><div id="mgm"></div></div><p>${mg.msg}</p><button id="mgs">STOP</button>`;}
 else h=`<h1>${STATIONS[sg.kind]}</h1>`+(mg?`<p>${sg.kind=='fuel'?'Tankolva':'Javítva'}: +${mg.amt}%</p>`:'')+upHTML();
 $('stc').innerHTML=h;
 if(ph=='mg')$('mgs').onpointerdown=mgStop;else{$('go').onclick=leave;document.querySelectorAll('button[data-id]').forEach(b=>b.onclick=()=>buy(b.dataset.id));}}
function buy(id){const l=P.lv[id],c=100+60*l;if(cur.upDone||l>=10||score<c)return;score-=c;P.lv[id]++;cur.upDone=true;vis();renderStation();}
function leave(){state='play';show(['hud']);P.v=0;} // a lehajtó végén az autó magától csatlakozik vissza a főútra
function end(why){state='over';$('why').textContent=why;$('fs').textContent='Pontszám: '+Math.floor(score);$('save').disabled=false;$('msg').textContent='';show(['over']);refresh($('lb2'));Sound.engine(0,false);}
function step(dt){
 const sg=cur,t=sg.t,S=stats(),up=keys.ArrowUp||keys.KeyW,dn=keys.ArrowDown||keys.KeyS||keys.Space,st=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
 const dm=P.hp<50?.65+.35*P.hp/50:1,vb=S.vb,vm=(sg.station?14:vb)*dm,inMg=!!(sg.mg&&P.s<sg.mg.s1);
 const rampX=()=>sg.mg.x0+(sg.mg.ex-sg.mg.x0)*sm(cl((P.s-sg.mg.s0)/MERGE,0,1)),[lo,hi]=sg.station?[-1e9,1e9]:bnd(sg),inRoad=P.x>=lo&&P.x<=hi;
 const off=!sg.station&&(inMg?!inRoad&&Math.abs(P.x-rampX())>3.3:!inRoad&&P.s<sg.jStart);
 if(up&&P.fuel>0&&P.v<vm)P.v+=14*S.acc*(1-P.v/vm*.85)*dt;
 if(P.v>vm)P.v-=6*dt;if(dn)P.v-=32*S.br*dt;
 const kk=61/vb;P.v-=(.015*P.v*kk+.0007*P.v*P.v*kk*kk)*dt*(P.fuel<=0?2:1)+(off?10*dt:0);P.v=Math.max(0,P.v);
 const tgt=st*S.st*(6+P.v*.12)/(1+P.v/S.sd)*Math.min(1,P.v/6)*(P.hp<50?.7:1)*(rain?.85:1)+(P.hp<50?Math.sin(performance.now()/300)*1.2*(1-P.hp/50)*Math.min(1,P.v/10):0);
 P.vx+=(tgt-P.vx)*Math.min(1,5*dt);P.x+=(P.vx-C2(P.s)*P.v*P.v*.35)*dt;P.s+=P.v*dt;dist+=P.v*dt;P.cool-=dt; // kanyarban kifelé húz az autó
 P.fuel=Math.max(0,P.fuel-(.03+.0035*P.v*(up?1:.6))*S.eco*dt*(P.hp<25?2:1));if(P.hp<25)P.hp-=.6*dt;
 if(sg.station){if(!up)P.v=Math.max(0,P.v-3*dt);
  const ib=Math.abs(P.s-sg.bc)<=1.05&&Math.abs(P.x-sg.cx)<=.95;sg.boxM.material.color.set(ib?0x00ff66:0xffcc00);
  if(ib&&P.v<1.2&&!sg.done){sg.done=true;P.v=0;openStation();return;}
  if(P.s>=sg.end){old.push(sg);cur=sg.bg;}}
 else if(P.s>=sg.end)choose();
 if(!sg.station&&!inMg&&P.s>(sg.tp?sg.s0+TR:sg.s0)){let hr=0;
  if(P.s<sg.jStart&&P.x>hi){P.x=hi;hr=-1;}else if(!(sg.kind=='fork'&&P.s>sg.jStart)&&P.x<lo){P.x=lo;hr=1;}
  if(hr){P.vx=hr*3;if(P.cool<=0)hit(P.v*.5*t.risk,.7);}}
 if(sg.work&&P.s>sg.w0&&P.s<sg.w1&&P.x>sg.wb[0]-(t.div?1.5:.3)&&P.x<sg.wb[1]+.5&&P.cool<=0){P.x=sg.wb[1]+1.1;hit(P.v*.9,.3);}
 traffic.update(dt,P,sg.station?sg.bg:sg);
 let danger=false;
 for(const c of traffic.cars){
  if(Math.abs(P.x-c.x)<(c.d.w+1.9)/2&&Math.abs(P.s-c.s)<(c.d.l+4.2)/2&&P.cool<=0){
   const rel=Math.abs(c.opp?P.v+c.v:P.v-c.v);P.vx=(P.x>=c.x?1:-1)*4;if(!c.opp){P.v=Math.min(P.v,c.v)*.7;c.v+=2;}hit(rel*.9*t.risk,c.opp?.4:1);}
  if(c.opp)continue;
  if(c.s>P.s+3)c.ahead=true;else if(c.ahead&&c.s<P.s-3){c.ahead=false;if(Math.abs(c.x-P.x)<6){score+=50;toast('+50 előzés');}}
  if(c.s>P.s&&c.s-P.s<9&&Math.abs(c.x-P.x)<2.2&&P.v>20)danger=true;}
 const wrong=!sg.station&&!t.div&&P.x<sg.cx,inW=sg.work&&P.s>sg.w0-250&&P.s<sg.w1,lim=sg.station?30:inW?60:t.limit;
 if(danger)score-=3*dt;if(wrong)score-=15*dt;
 const over=P.v*3.6-lim;if(over>15&&!sg.station)score-=over*.04*dt;
 safe+=dt;score=Math.max(0,score+P.v*dt*.1*(1+Math.min(1,safe/60)));
 if(old.length&&(old[0].vend||old[0].end)<P.s-400)rm(old.shift());
 if(P.hp<=0)end('Totálkár');else if(P.fuel<=0&&P.v<1)end('Elfogyott az üzemanyag');
 // HUD
 $('spd').textContent=Math.round(P.v*3.6);$('limit').textContent='⚠ '+lim;$('road').textContent=sg.station?sg.name:sg.name+' · '+t.sub;
 $('score').textContent=Math.floor(score);$('dist').textContent=(dist/1000).toFixed(1);
 $('hpb').style.width=Math.max(0,P.hp)+'%';$('hpb').style.background=P.hp<25?'#e33':P.hp<50?'#ea3':'#4c4';$('fub').style.width=P.fuel+'%';$('fub').style.background=P.fuel<20?'#e33':'#4c4';
 const dj=Math.max(0,Math.round((sg.jStart-P.s)/10)*10);
 $('next').textContent=sg.station?'Lehajtó – állj meg a sárga dobozban':(dj>2600?'Következő csomópont: '+dj+' m':(dj>0?dj+' m: ':'ELÁGAZÁS! ')+[...sg.opts].sort((a,b)=>a.dx-b.dx).map(o=>o.dir+o.label).join(' · '));
 $('warn').textContent=[P.fuel<20?'⛽ ALACSONY ÜZEMANYAG':'',P.hp<50?'🔧 SÚLYOS SÉRÜLÉS':'',wrong?'⛔ SZEMBE SÁVBAN!':'',inW?'🚧 ÚTON FOLYÓ MUNKA':''].filter(Boolean).join('  ');
 $('prompt').textContent=sg.station&&!sg.done?(P.s>sg.bc+1.05?'Kihagytad a dobozt – haladj tovább':'Állj meg a sárga dobozban! (max. 1,5× autóhossz)'):'';
 if((toastT-=dt)<0)$('toast').textContent='';}
function render(dt){
 if(state=='menu'){P.s+=22*dt;P.v=22;P.vx=0;if(P.s>cur.jStart-600)reset();}
 tod+=dt/120;const k=Math.max(.08,Math.min(1,(Math.sin(tod*6.283)+1.1)/1.6));rainT-=dt;if(rainT<0){rain=!rain&&Math.random()<.5;rainT=R(40,90);}
 skyC.setHSL(.58,rain?.1:.55,.04+.5*k*(rain?.6:1));scene.background=skyC;scene.fog.color.copy(skyC);scene.fog.density=rain?.0055:.0016;hemi.intensity=.25+.9*k*(rain?.7:1);sun.intensity=.9*k;
 car.position.set(P.x+C(P.s),0,-P.s);car.rotation.y=-(Math.atan(C1(P.s))+P.vx*.02);car.rotation.z=-P.vx*.01;
 body.material.color.setHSL(0,.7,.15+.3*P.hp/100);smoke.visible=P.hp<50;smoke.scale.setScalar(1+.3*Math.sin(performance.now()/120));
 const sh=shake*(Math.random()-.5);shake=Math.max(0,shake-dt*2.5);
 camX+=(P.x+C(P.s-9)-camX)*Math.min(1,12*dt);
 cam.position.set(camX+sh,3.9+sh*.5,-P.s+9);cam.lookAt(camX+C(P.s+25)-C(P.s-9),1.3,-P.s-25);cam.fov=64+P.v*.28;cam.updateProjectionMatrix();
 ground.position.set(camX,-.08,-P.s);
 const ref=cur.station?cur.bg:cur;
 trees.forEach((g,i)=>{const sd=i%2?1:-1,ts=(Math.floor(P.s/40)+(i>>1)-5)*40,h=Math.abs(Math.sin(ts*12.9+i));g.position.set(ref.cx+sd*(H(ref.t)+(sd>0?75+h*25:28+h*22))+C(ts),0,-ts);});
 Sound.engine(P.v,state=='play');ren.render(scene,cam);}
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.05,(t-last)/1000||0);last=t;if(state=='play')step(dt);else if(state=='stop')mgTick(dt);render(dt);}
// ---- UI
const show=ids=>['menu','over','hud','st'].forEach(i=>$(i).hidden=!ids.includes(i));
const refresh=el=>LB.top10().then(r=>LB.render(el,r)).catch(()=>el.innerHTML='<tr><td colspan=4>A ranglista nem elérhető</td></tr>');
const vol=()=>Sound.vol=$('mute').checked?0:$('vol').value/100;$('vol').oninput=vol;$('mute').onchange=vol;
const start=()=>{Sound.start();vol();reset();state='play';show(['hud']);};
$('play').onclick=start;$('again').onclick=start;$('tomenu').onclick=()=>{state='menu';reset();show(['menu']);refresh($('lb1'));};
$('save').onclick=async()=>{$('save').disabled=true;try{await LB.submit($('name').value.trim().slice(0,16)||'Anonim',Math.floor(score));$('msg').textContent='Mentve!';refresh($('lb2'));}catch(e){$('msg').textContent='Mentés sikertelen';$('save').disabled=false;}};
addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(state=='stop'&&!e.repeat&&(e.code=='Space'||e.code=='Enter'))mgStop();});
addEventListener('keyup',e=>keys[e.code]=false);
reset();refresh($('lb1'));requestAnimationFrame(frame);
