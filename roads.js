export const LW=3.6,DIV=260,TR=200,MERGE=220,PAL=['#444','#1e88e5','#fb8c00','#d81b60','#00a884','#8e44ad'];
// Globális útgörbe: lokális x → világ x = x + C(s). Minden objektum (út, jármű, tábla) ezt követi.
const A1=14,K1=1/380,P1=Math.random()*6.28,A2=4,K2=1/160,P2=Math.random()*6.28,B0=A1*Math.sin(P1)+A2*Math.sin(P2);
export const C=s=>A1*Math.sin(s*K1+P1)+A2*Math.sin(s*K2+P2)-B0;
export const C1=s=>A1*K1*Math.cos(s*K1+P1)+A2*K2*Math.cos(s*K2+P2);
export const C2=s=>-A1*K1*K1*Math.sin(s*K1+P1)-A2*K2*K2*Math.sin(s*K2+P2);
export const TYPES={
 S2:{lanes:2,oncoming:0,limit:130,density:.55,sp:1,risk:1,sub:'2 sáv'},
 D22:{lanes:4,oncoming:2,limit:110,density:.6,sp:.85,risk:1.3,sub:'2×2 szembe'},
 S3:{lanes:3,oncoming:0,limit:200,density:.3,sp:1.3,risk:1.25,sub:'3 sáv gyors'}};
for(const k in TYPES)TYPES[k].id=k;
export const STATION_T={id:'P',lanes:1,oncoming:0,limit:30,density:0,sp:0,risk:1,sub:'Lehajtó'};
export const OPP_T={id:'O',lanes:2,oncoming:0};
export const STATIONS={fuel:'⛽ Benzinkút',rest:'🅿 Pihenő',service:'🔧 Szerviz'};
const R=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
export const hw=t=>t.lanes*LW/2+1.2;
// útszám: kétsávos M1–M9, 2×2 sávos A1–A9, háromsávos M10–M99
export const numName=id=>id=='D22'?'A'+(1+(Math.random()*9|0)):id=='S3'?'M'+(10+(Math.random()*90|0)):'M'+(1+(Math.random()*9|0));
export function laneXs(seg,s){
 const t=seg.t,n=t.lanes,c=seg.cx,all=[...Array(n)].map((_,i)=>c+(i-(n-1)/2)*LW);
 let fwd=all.slice(t.oncoming),opp=all.slice(0,t.oncoming);
 if(seg.oc!=null)opp=s>seg.o0&&s<seg.o1?[seg.oc-LW/2,seg.oc+LW/2]:[]; // elválasztott szembejövő pálya
 if(seg.work&&s>seg.w0&&s<seg.w1)fwd=[seg.wc];
 return{fwd,opp};}
export function makeSeg(tid,s0,cx,name,tp){
 const t=TYPES[tid],n=t.lanes,L=R(2200,3000)+(tp?TR:0),
 seg={t,s0,cx,name:name||numName(tid),tp:!!tp,L,end:s0+L,jStart:s0+L-DIV,w0:s0+TR+300,w1:s0+L-900,work:Math.random()<.35,xs:[]};
 if(seg.work){const nf=n-t.oncoming,xl=cx+t.oncoming*LW-n*LW/2,xr=cx+n*LW/2,bw=nf>=3?1.5*LW:LW;seg.wb=[xl,xl+bw];seg.wc=(xl+bw+xr)/2;}
 if(!t.oncoming){seg.oc=cx-hw(t)-9.8;seg.o0=s0+TR+400;seg.o1=seg.jStart-50;}
 seg.xs.push({s:seg.jStart-150,k:'over',j:true});
 for(let i=0,m=1+(Math.random()*2|0);i<m;i++)seg.xs.push({s:R(s0+TR+450,seg.jStart-700),k:Math.random()<.5?'over':'under'});
 const nb=1+(Math.random()*5|0),ids=Object.keys(TYPES);
 seg.opts=[{dx:0,type:tid,name:seg.name,label:seg.name,dir:'↑'}];
 for(let i=0;i<nb;i++){const k=Math.random()<.55?{type:pick(ids)}:{station:pick(Object.keys(STATIONS))},nm=k.type?numName(k.type):STATIONS[k.station];
  seg.opts.push({...k,dx:hw(t)+13+i*11,name:nm,label:nm,dir:'→'});} // az ágak mind jobbra válnak
 seg.opts.forEach((o,i)=>o.col=PAL[i]);return seg;}
