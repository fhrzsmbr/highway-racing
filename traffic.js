import * as THREE from 'three';
import {laneXs,hw,LW} from './roads.js';
const K={car:{w:1.9,l:4.2,h:1.3,v:[28,38],p:.5},suv:{w:2.1,l:4.7,h:1.7,v:[26,34],p:.2},van:{w:2.2,l:5.6,h:2.1,v:[23,30],p:.12},truck:{w:2.5,l:10,h:3.2,v:[19,25],p:.12},bus:{w:2.6,l:11.5,h:3.2,v:[21,26],p:.06}};
const R=(a,b)=>a+Math.random()*(b-a),M=c=>new THREE.MeshLambertMaterial({color:c});
export class Traffic{
 constructor(scene){this.scene=scene;this.cars=[];}
 clear(){this.cars.forEach(c=>this.scene.remove(c.m));this.cars=[];}
 mesh(k,opp){const d=K[k],g=new THREE.Group(),big=k=='truck'||k=='bus';
  const b=new THREE.Mesh(new THREE.BoxGeometry(d.w,d.h*.6,d.l),M(new THREE.Color().setHSL(Math.random(),.5,.45)));b.position.y=d.h*.4;
  const c=new THREE.Mesh(new THREE.BoxGeometry(d.w*.9,d.h*.5,d.l*(k=='car'?.5:.85)),M(big?0xdddddd:0x223344));c.position.y=d.h*.8;
  const l=new THREE.Mesh(new THREE.BoxGeometry(d.w*.8,.15,.1),new THREE.MeshBasicMaterial({color:opp?0xffffcc:0xff2222}));l.position.set(0,d.h*.4,(opp?-1:1)*d.l/2);
  g.add(b,c,l);if(opp)g.rotation.y=Math.PI;return g;}
 spawn(seg,s,opp){if(s>seg.end)return;let r=Math.random(),k='car',a=0;for(const n in K){a+=K[n].p;if(r<a){k=n;break;}}
  const L=laneXs(seg,s),ls=opp?L.opp:L.fwd;if(!ls.length)return;const x=ls[Math.random()*ls.length|0],d=K[k];
  if(this.cars.some(c=>Math.abs(c.x-x)<3&&Math.abs(c.s-s)<c.d.l+30))return;
  const v=R(...d.v)*seg.t.sp,m=this.mesh(k,opp);this.scene.add(m);this.cars.push({k,d,m,s,x,tx:x,v,v0:v,opp,cd:0,ahead:false});}
 update(dt,P,seg){
  const po={s:P.s,x:P.x,v:P.v,d:{l:4.2,w:1.9},opp:false},all=this.cars.concat(po);
  for(const c of this.cars){
   const L=laneXs(seg,c.s),ls=c.opp?L.opp:L.fwd;
   if(c.opp)c.s-=c.v*dt;else{
    if(ls.length&&!ls.includes(c.tx))c.tx=ls.reduce((a,b)=>Math.abs(b-c.x)<Math.abs(a-c.x)?b:a);
    let gap=99,lead=null;for(const o of all)if(o!==c&&!o.opp&&o.s>c.s&&Math.abs(o.x-c.x)<2.4){const g=o.s-c.s-(o.d.l+c.d.l)/2;if(g<gap){gap=g;lead=o;}}
    let tv=c.v0;if(lead&&gap<14+c.v*1.4)tv=Math.max(0,Math.min(c.v0,lead.v-(gap<7?5:0)));
    c.v+=Math.max(-10*dt,Math.min(4*dt,tv-c.v));c.cd-=dt;
    if(lead&&c.cd<=0&&gap<35&&c.v<c.v0-2){ // előzés / sávváltás
     const free=l=>!all.some(o=>o!==c&&!o.opp&&Math.abs(o.x-l)<2.4&&o.s>c.s-14&&o.s<c.s+28),
      cand=ls.filter(l=>Math.abs(l-c.tx)>2&&Math.abs(l-c.tx)<LW+1.5&&free(l));if(cand.length){c.tx=cand[0];c.cd=5;}}
    c.s+=c.v*dt;}
   c.x+=Math.max(-2.4*dt,Math.min(2.4*dt,c.tx-c.x));c.m.position.set(c.x,0,-c.s);}
  this.cars=this.cars.filter(c=>{const ok=c.s>P.s-200&&c.s<P.s+700&&Math.abs(c.x-seg.cx)<hw(seg.t)+1;if(!ok)this.scene.remove(c.m);return ok;});
  if(seg.station)return;
  const n=this.cars.filter(c=>!c.opp&&c.s>P.s).length,no=this.cars.filter(c=>c.opp).length;
  if(n<seg.t.density*16&&Math.random()<dt*2)this.spawn(seg,P.s+R(300,600),false);
  if(seg.t.oncoming&&no<8&&Math.random()<dt*1.2)this.spawn(seg,P.s+R(350,650),true);}
}
