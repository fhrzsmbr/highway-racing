import * as THREE from 'three';
import {TYPES,STATIONS,STATION_T,LW,hw,makeSeg} from './roads.js';
import {Traffic} from './traffic.js';
import * as LB from './leaderboard.js';
import {Sound} from './audio.js';
const $=id=>document.getElementById(id),R=(a,b)=>a+Math.random()*(b-a),sm=x=>x*x*(3-2*x);
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
const trees=[];for(let i=0;i<80;i++){const g=new THREE.Group(),a=box(.5,2.5,.5,0x5a3a1e),b=box(3,3.5,3,0x1f5a2a);a.position.y=1.25;b.position.y=4;g.add(a,b);scene.add(g);trees.push(g);}
const traffic=new Traffic(scene);
// ---- úthálózat építése
function roadTex(t,len){const w=Math.round(hw(t)*2*16),c=document.createElement('canvas');c.width=w;c.height=160;const g=c.getContext('2d');
 g.fillStyle='#3a3a3e';g.fillRect(0,0,w,160);g.fillStyle='#ddd';g.fillRect(14,0,4,160);g.fillRect(w-18,0,4,160);
 for(let i=1;i<t.lanes;i++){const x=(1.2+i*LW)*16;if(t.oncoming&&i==t.oncoming){g.fillStyle='#e8c020';g.fillRect(x-5,0,3,160);g.fillRect(x+2,0,3,160);}else{g.fillStyle='#ddd';g.fillRect(x-2,0,4,70);}}
 const tx=new THREE.CanvasTexture(c);tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(1,len/10);tx.colorSpace=THREE.SRGBColorSpace;return tx;}
function ribbon(t,s0,len,cx){const m=new THREE.Mesh(new THREE.PlaneGeometry(hw(t)*2,len),new THREE.MeshLambertMaterial({map:roadTex(t,len)}));m.rotation.x=-Math.PI/2;m.position.set(cx,0,-(s0+len/2));scene.add(m);return m;}
function strip(sg,o){const n=24,P=[],U=[],I=[],e=Math.sign(o.dx)*(hw(sg.t)+3),w=3;
 for(let i=0;i<=n;i++){const u=i/n,s=sg.jStart+450*u,x=sg.cx+e+(o.dx-e)*sm(u);P.push(x-w,.02,-s,x+w,.02,-s);U.push(0,u,1,u);if(i<n){const a=i*2;I.push(a,a+1,a+2,a+1,a+3,a+2);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:roadTex(STATION_T,450),side:THREE.DoubleSide}));scene.add(m);return m;}
function sign(sg,s,head,lines){const c=document.createElement('canvas');c.width=1024;c.height=320;const g=c.getContext('2d');
 g.fillStyle='#0b6b3a';g.fillRect(0,0,1024,320);g.strokeStyle='#fff';g.lineWidth=8;g.strokeRect(6,6,1012,308);g.fillStyle='#fff';g.font='bold 54px sans-serif';g.fillText(head,30,64);
 g.font='bold 40px sans-serif';lines.forEach((l,i)=>g.fillText(l,30+(i%2)*500,130+(i>>1)*60));
 const W=hw(sg.t)*2+2,tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
 const p=new THREE.Mesh(new THREE.PlaneGeometry(W,W*.3125),new THREE.MeshBasicMaterial({map:tx}));p.position.set(sg.cx,6.5,-s);scene.add(p);sg.objs.push(p);
 for(const d of[-1,1]){const q=box(.4,7,.4,0x888888);q.position.set(sg.cx+d*(hw(sg.t)+.8),3.5,-s);scene.add(q);sg.objs.push(q);}}
function build(sg){sg.objs=[ribbon(sg.t,sg.s0,sg.L,sg.cx)];sg.prev=[];
 const add=m=>{scene.add(m);sg.objs.push(m);return m;};
 if(sg.station){const b=add(box(8,5,30,{fuel:0xe0a020,rest:0x4080c0,service:0x888888}[sg.kind]));b.position.set(sg.cx+9,2.5,-(sg.end-30));
  const l=add(box(7,.1,.6,0xffffff));l.position.set(sg.cx,.03,-(sg.end-14));sign(sg,sg.s0+40,STATIONS[sg.kind],['Állj meg a vonalnál']);return;}
 const len=sg.jStart-sg.s0;
 for(const sd of[-1,1]){const r=add(box(.3,.7,len,0x999999));r.position.set(sg.cx+sd*(hw(sg.t)+.5),.35,-(sg.s0+len/2));}
 if(sg.t.work){const b=add(box(5.4,.9,sg.w1-sg.w0,0xff7a00));b.position.set(sg.cx-2.7,.45,-(sg.w0+sg.w1)/2);
  sign(sg,sg.w0-250,'ÉPÍTKEZÉS 60 km/h',['1,5 sáv lezárva']);}
 sg.opts.slice(1).forEach(o=>add(strip(sg,o)));
 [1200,700,400,200].forEach(d=>sign(sg,sg.jStart-d,d+' m',sg.opts.map(o=>o.dir+' '+o.label)));
 const pv=(t,cx)=>sg.prev.push(ribbon(t,sg.end,900,cx));pv(sg.t,sg.cx);sg.opts.slice(1).forEach(o=>pv(o.station?STATION_T:TYPES[o.type],sg.cx+o.dx));}
const rmList=l=>{(l||[]).forEach(m=>{scene.remove(m);m.geometry.dispose();m.material.map?.dispose();m.material.dispose();});};
const rm=sg=>{rmList(sg.objs);rmList(sg.prev);sg.objs=[];sg.prev=[];};
// ---- állapot
let camX=0,state='menu',last=0,P,cur,old=[],score=0,dist=0,safe=0,tod=.3,rain=false,rainT=60,shake=0,toastT=0,keys={};
const skyC=new THREE.Color();scene.fog=new THREE.FogExp2(0x88aacc,.0016);
function reset(){old.forEach(rm);old=[];if(cur)rm(cur);traffic.clear();cur=makeSeg('M7',0,0);build(cur);P={s:0,x:1.8,v:20,vx:0,hp:100,fuel:100,cool:0,up:0};camX=1.8;score=0;dist=0;safe=0;}
function advance(o){rmList(cur.prev);cur.prev=[];old.push(cur);
 cur=o.station?{t:STATION_T,station:true,kind:o.station,s0:cur.end,L:220,end:cur.end+220,cx:cur.cx+o.dx,opts:[],jStart:1e12}:makeSeg(o.type,cur.end,cur.cx+o.dx);build(cur);}
function choose(){const sg=cur;let o=sg.opts[0];
 if(Math.abs(P.x-sg.cx)>hw(sg.t)+1)o=sg.opts.slice(1).reduce((a,b)=>Math.abs(P.x-(sg.cx+b.dx))<Math.abs(P.x-(sg.cx+a.dx))?b:a);
 score+=o.dx?200:50;toast(o.dx?'+200 útvonalválasztás: '+o.label:'+50 egyenesen tovább');advance(o);}
function toast(t){$('toast').textContent=t;toastT=2.5;}
function hit(d,pv){P.hp-=d;P.v*=pv;P.cool=.7;shake=Math.min(1,d/15+.2);safe=0;score-=20+d*3;Sound.crash();}
function action(c){if(!cur.station||P.v>1||P.s<cur.end-60)return;const k=cur.kind;
 if(c=='KeyF'&&(k=='fuel'||k=='rest'))P.fuel=Math.min(100,P.fuel+(k=='fuel'?100:20));
 if(c=='KeyR'&&(k=='service'||k=='rest'))P.hp=Math.min(100,P.hp+(k=='service'?100:15));
 if(c=='KeyU'&&(k=='service'||k=='rest')){if(P.up>=4)toast('Maximális motorszint');else if(score<300)toast('Kell hozzá 300 pont');else{score-=300;P.up++;toast('Motor upgrade! Szint: '+P.up+'/4 (+18 km/h végsebesség)');}}
 if(c=='Enter'||c=='KeyE'){const n=makeSeg(Object.keys(TYPES)[Math.random()*4|0],cur.end,cur.cx);old.push(cur);cur=n;build(n);P.v=0;}}
function end(why){state='over';$('why').textContent=why;$('fs').textContent='Pontszám: '+Math.floor(score);$('save').disabled=false;$('msg').textContent='';show(['over']);refresh($('lb2'));Sound.engine(0,false);}
function step(dt){
 const sg=cur,t=sg.t,up=keys.ArrowUp||keys.KeyW,dn=keys.ArrowDown||keys.KeyS||keys.Space,st=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
 const dm=P.hp<50?.65+.35*P.hp/50:1,vb=61+5*P.up,vm=(sg.station?14:vb)*dm,off=!sg.station&&Math.abs(P.x-sg.cx)>hw(t)&&P.s<sg.jStart;
 if(up&&P.fuel>0&&P.v<vm)P.v+=14*(1-P.v/vm*.85)*dt;
 if(P.v>vm)P.v-=6*dt;if(dn)P.v-=32*dt;
 const kk=61/vb;P.v-=(.015*P.v*kk+.0007*P.v*P.v*kk*kk)*dt*(P.fuel<=0?2:1)+(off?10*dt:0);P.v=Math.max(0,P.v);
 const tgt=st*(6+P.v*.12)/(1+P.v/45)*Math.min(1,P.v/6)*(P.hp<50?.7:1)*(rain?.85:1)+(P.hp<50?Math.sin(performance.now()/300)*1.2*(1-P.hp/50)*Math.min(1,P.v/10):0);
 P.vx+=(tgt-P.vx)*Math.min(1,5*dt);P.x+=P.vx*dt;P.s+=P.v*dt;dist+=P.v*dt;P.cool-=dt;
 P.fuel=Math.max(0,P.fuel-(.03+.0035*P.v*(up?1:.6))*dt*(P.hp<25?2:1));if(P.hp<25)P.hp-=.6*dt;
 if(sg.station&&P.s>sg.end-14){P.s=sg.end-14;P.v=0;}
 if(!sg.station&&P.s>=sg.end)choose();
 const d=P.x-sg.cx,e=hw(t)+.3;
 if(!sg.station&&P.s<sg.jStart&&Math.abs(d)>e){P.x=sg.cx+Math.sign(d)*e;P.vx=-Math.sign(d)*3;if(P.cool<=0)hit(P.v*.5*t.risk,.7);}
 if(t.work&&P.s>sg.w0&&P.s<sg.w1&&P.x<sg.cx&&P.x>sg.cx-5.9&&P.cool<=0){P.x=sg.cx+1;hit(P.v*.9,.3);}
 traffic.update(dt,P,sg);
 let danger=false;
 for(const c of traffic.cars){
  if(Math.abs(P.x-c.x)<(c.d.w+1.9)/2&&Math.abs(P.s-c.s)<(c.d.l+4.2)/2&&P.cool<=0){
   const rel=Math.abs(c.opp?P.v+c.v:P.v-c.v);P.vx=(P.x>=c.x?1:-1)*4;if(!c.opp){P.v=Math.min(P.v,c.v)*.7;c.v+=2;}hit(rel*.9*t.risk,c.opp?.4:1);}
  if(c.opp)continue;
  if(c.s>P.s+3)c.ahead=true;else if(c.ahead&&c.s<P.s-3){c.ahead=false;if(Math.abs(c.x-P.x)<6){score+=50;toast('+50 előzés');}}
  if(c.s>P.s&&c.s-P.s<9&&Math.abs(c.x-P.x)<2.2&&P.v>20)danger=true;}
 const wrong=t.oncoming&&P.x<sg.cx-t.lanes*LW/2+t.oncoming*LW;
 if(danger)score-=3*dt;if(wrong)score-=15*dt;
 const over=P.v*3.6-t.limit;if(over>15&&!sg.station)score-=over*.04*dt;
 safe+=dt;score=Math.max(0,score+P.v*dt*.1*(1+Math.min(1,safe/60)));
 if(old.length&&old[0].end<P.s-400)rm(old.shift());
 if(P.hp<=0)end('Totálkár');else if(P.fuel<=0&&P.v<1)end('Elfogyott az üzemanyag');
 // HUD
 $('spd').textContent=Math.round(P.v*3.6);$('limit').textContent='⚠ '+(sg.station?30:t.limit);$('road').textContent=sg.station?STATIONS[sg.kind]:t.label;
 $('score').textContent=Math.floor(score);$('dist').textContent=(dist/1000).toFixed(1);
 $('hpb').style.width=Math.max(0,P.hp)+'%';$('hpb').style.background=P.hp<25?'#e33':P.hp<50?'#ea3':'#4c4';$('fub').style.width=P.fuel+'%';$('fub').style.background=P.fuel<20?'#e33':'#4c4';
 const dj=Math.max(0,Math.round((sg.jStart-P.s)/10)*10);
 $('next').textContent=sg.station?'Lehajtó – állj meg a vonalnál':(dj>2600?'Következő csomópont: '+dj+' m':(dj>0?dj+' m: ':'ELÁGAZÁS! ')+sg.opts.map(o=>o.dir+o.label).join(' · '));
 $('warn').textContent=[P.fuel<20?'⛽ ALACSONY ÜZEMANYAG':'',P.hp<50?'🔧 SÚLYOS SÉRÜLÉS':'',wrong?'⛔ SZEMBE SÁVBAN!':''].filter(Boolean).join('  ');
 const k=sg.kind,ready=sg.station&&P.v<1&&P.s>sg.end-60;
 $('prompt').textContent=ready?[(k=='fuel'||k=='rest')?'[F] tankolás':'',(k=='service'||k=='rest')?'[R] javítás':'',(k=='service'||k=='rest')?'[U] végsebesség-upgrade (300 pont, '+P.up+'/4)':'','[Enter] vissza az autópályára'].filter(Boolean).join(' · '):'';
 if((toastT-=dt)<0)$('toast').textContent='';}
function render(dt){
 if(state=='menu'){P.s=(P.s+22*dt)%3000;P.v=22;P.vx=0;}
 tod+=dt/120;const k=Math.max(.08,Math.min(1,(Math.sin(tod*6.283)+1.1)/1.6));rainT-=dt;if(rainT<0){rain=!rain&&Math.random()<.5;rainT=R(40,90);}
 skyC.setHSL(.58,rain?.1:.55,.04+.5*k*(rain?.6:1));scene.background=skyC;scene.fog.color.copy(skyC);scene.fog.density=rain?.0055:.0016;hemi.intensity=.25+.9*k*(rain?.7:1);sun.intensity=.9*k;
 car.position.set(P.x,0,-P.s);car.rotation.y=-P.vx*.02;car.rotation.z=-P.vx*.01;
 body.material.color.setHSL(0,.7,.15+.3*P.hp/100);smoke.visible=P.hp<50;smoke.scale.setScalar(1+.3*Math.sin(performance.now()/120));
 const sh=shake*(Math.random()-.5);shake=Math.max(0,shake-dt*2.5);
 camX+=(P.x-camX)*Math.min(1,12*dt);cam.position.set(camX+sh,3.9+sh*.5,-P.s+9);cam.lookAt(camX,1.3,-P.s-18);cam.fov=64+P.v*.28;cam.updateProjectionMatrix();
 ground.position.set(P.x,-.08,-P.s);
 trees.forEach((g,i)=>{const sd=i%2?1:-1,ts=(Math.floor(P.s/40)+(i>>1)-5)*40;g.position.set(cur.cx+sd*(hw(cur.t)+34+Math.abs(Math.sin(ts*12.9+i))*20),0,-ts);});
 Sound.engine(P.v,state=='play');ren.render(scene,cam);}
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.05,(t-last)/1000||0);last=t;if(state=='play')step(dt);render(dt);}
// ---- UI
const show=ids=>['menu','over','hud'].forEach(i=>$(i).hidden=!ids.includes(i));
const refresh=el=>LB.top10().then(r=>LB.render(el,r)).catch(()=>el.innerHTML='<tr><td colspan=4>A ranglista nem elérhető</td></tr>');
const vol=()=>Sound.vol=$('mute').checked?0:$('vol').value/100;$('vol').oninput=vol;$('mute').onchange=vol;
const start=()=>{Sound.start();vol();reset();state='play';show(['hud']);};
$('play').onclick=start;$('again').onclick=start;$('tomenu').onclick=()=>{state='menu';reset();show(['menu']);refresh($('lb1'));};
$('save').onclick=async()=>{$('save').disabled=true;try{await LB.submit($('name').value.trim().slice(0,16)||'Anonim',Math.floor(score));$('msg').textContent='Mentve!';refresh($('lb2'));}catch(e){$('msg').textContent='Mentés sikertelen';$('save').disabled=false;}};
addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(state=='play')action(e.code);});
addEventListener('keyup',e=>keys[e.code]=false);
reset();refresh($('lb1'));requestAnimationFrame(frame);
