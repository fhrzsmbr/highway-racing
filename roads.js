export const LW=3.6,MH=1.5,DIV=260,WID=250,SPL=350,TR=200,MERGE=220,PAL=['#444','#1e88e5','#fb8c00','#d81b60','#00a884','#8e44ad'];
// Globális útgörbe: lokális x → világ x = x + C(s). Minden objektum ezt követi.
const A1=14,K1=1/380,P1=Math.random()*6.28,A2=4,K2=1/160,P2=Math.random()*6.28,B0=A1*Math.sin(P1)+A2*Math.sin(P2);
export const C=s=>A1*Math.sin(s*K1+P1)+A2*Math.sin(s*K2+P2)-B0;
export const C1=s=>A1*K1*Math.cos(s*K1+P1)+A2*K2*Math.cos(s*K2+P2);
export const C2=s=>-A1*K1*K1*Math.sin(s*K1+P1)-A2*K2*K2*Math.sin(s*K2+P2);
// nf = sáv / irány; div = 1: középen elválasztott, 0: elválasztás nélküli (A jelű)
export const TYPES={
 D2:{nf:2,div:1,pre:'M',a:1,b:9,sub:'2×2',limit:130,density:.55,sp:1,risk:1},
 D3:{nf:3,div:1,pre:'M',a:10,b:99,sub:'2×3 gyors',limit:200,density:.3,sp:1.3,risk:1.25},
 U2:{nf:2,div:0,pre:'A',a:1,b:9,sub:'2×2 szembe',limit:110,density:.6,sp:.85,risk:1.3},
 U3:{nf:3,div:0,pre:'A',a:10,b:99,sub:'2×3 szembe',limit:150,density:.45,sp:1.05,risk:1.4}};
for(const k in TYPES)TYPES[k].id=k;
export const STATION_T={id:'P',lanes:1,oncoming:0,limit:30,density:0,sp:0,risk:1,sub:'Lehajtó'};
export const STATIONS={fuel:'⛽ Benzinkút',rest:'🅿 Pihenő',service:'🔧 Szerviz'};
const R=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
export const hwp=p=>p.lanes*LW/2+1.2;                              // egy sáv-csomag (ribbon) fél szélessége
export const wc=t=>t.nf*LW+2.4;                                    // egy irányú pálya szélessége
export const H=t=>t.div?MH+wc(t):t.nf*LW+1.2;                      // a teljes út fél szélessége a középvonaltól
export const fc=t=>t.div?MH+wc(t)/2:t.nf*LW/2;                     // előre irányú pálya közepe
export const carr=(t,cx)=>t.div?[{p:{lanes:t.nf,oncoming:0},x:cx+fc(t)},{p:{lanes:t.nf,oncoming:0},x:cx-fc(t)}]:[{p:{lanes:2*t.nf,oncoming:t.nf},x:cx}];
export const bnd=sg=>sg.t.div?[sg.cx+MH,sg.cx+H(sg.t)+.3]:[sg.cx-H(sg.t)-.3,sg.cx+H(sg.t)+.3];
export const numName=id=>{const t=TYPES[id];return t.pre+(t.a+(Math.random()*(t.b-t.a+1)|0));};
export function laneXs(seg,s){const t=seg.t,c=seg.cx,f=[],o=[],b=t.div?MH+1.2:0;
 for(let i=0;i<t.nf;i++){const k=(i+.5)*LW;f.push(c+b+k);o.push(c-b-k);}
 return{fwd:seg.work&&s>seg.w0&&s<seg.w1?[seg.wc]:f,opp:o};}
export function makeSeg(tid,s0,cx,name,tp){
 const t=TYPES[tid],ids=Object.keys(TYPES),kr=Math.random(),kind='exit',jl=kind=='fork'?WID+SPL:DIV,L=R(2300,3100)+(tp?TR:0),
 seg={t,s0,cx,name:name||numName(tid),tp:!!tp,L,end:s0+L,jl,jStart:s0+L-jl,kind,w0:s0+TR+300,work:Math.random()<.35,xs:[]};
 seg.w1=seg.jStart-700;
 if(seg.work){const xl=cx+(t.div?MH+1.2:0),bw=t.nf>=3?1.5*LW:LW;seg.wb=[xl,xl+bw];seg.wc=(xl+bw+xl+t.nf*LW)/2;}
 seg.xs.push({s:seg.jStart-150,k:'over',j:true});
 for(let i=0,m=1+(Math.random()*2|0);i<m;i++)seg.xs.push({s:R(s0+TR+450,seg.jStart-800),k:Math.random()<.5?'over':'under'});
 const Rr=H(t),fcs=cx+fc(t),add=o=>seg.opts.push(o);
 seg.opts=[{straight:1,dx:0,fx:fcs,type:tid,name:seg.name,label:seg.name,dir:'↑'}];
 if(kind=='exit'){for(let i=0,n=1+(Math.random()*5|0);i<n;i++){const fx=cx+Rr+8+i*11;
  if(Math.random()<.55){const tn=pick(ids),nm=numName(tn);add({type:tn,ramp:1,fx,dx:fx-fcs,cx:fx-fc(TYPES[tn]),name:nm,label:nm,dir:'→'});}  // régi csomópont: 1–5 ág, út vagy lehajtó
  else{const k=pick(Object.keys(STATIONS)),nm=STATIONS[k];add({station:k,ramp:1,fx,dx:fx-fcs,name:nm,label:nm,dir:'→'});}}}
 else if(kind=='cross'){const tn=pick(ids),nm=numName(tn);['K','Ny'].forEach((tag,i)=>{const fx=cx+Rr+8+i*11;add({type:tn,ramp:1,tag,fx,dx:fx-fcs,cx:fx-fc(TYPES[tn]),name:nm,label:nm+' '+tag,dir:'→'});});}
 else{const tn=pick(ids),tb=TYPES[tn],widthO=tb.div?wc(tb):tb.nf*LW+1.2,innerGap=tb.div?2*MH:0,WbF=widthO,Lb=cx+Rr+widthO+innerGap+6,nm=numName(tn),fx=Lb+WbF/2;
  seg.fk={tn,widthO,innerGap,WbF,Lb};add({fork:1,type:tn,fx,dx:fx-fcs,cx:Lb-(tb.div?MH:0),name:nm,label:nm,dir:'→'});}
 seg.opts.forEach((o,i)=>o.col=PAL[i]);return seg;}
