export const LW=3.6;
export const TYPES={
 M7:{label:'M7',lanes:2,oncoming:0,limit:130,density:.55,sp:1,risk:1},
 M0:{label:'M0 (2×2 szembe)',lanes:4,oncoming:2,limit:110,density:.6,sp:.85,risk:1.3},
 M5:{label:'M5+építkezés',lanes:3,oncoming:0,limit:60,density:.8,sp:.5,risk:1.15,work:true},
 MH3:{label:'MH3 gyorsforgalmi',lanes:3,oncoming:0,limit:200,density:.22,sp:1.3,risk:1.25}};
for(const k in TYPES)TYPES[k].id=k;
export const STATION_T={id:'P',label:'Lehajtó',lanes:1,oncoming:0,limit:30,density:0,sp:0,risk:1};
export const STATIONS={fuel:'⛽ Benzinkút',rest:'🅿 Pihenő',service:'🔧 Szerviz'};
const R=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
export const hw=t=>t.lanes*LW/2+1.2;
export function laneXs(seg,s){
 const t=seg.t,n=t.lanes,c=seg.cx,all=[...Array(n)].map((_,i)=>c+(i-(n-1)/2)*LW);
 if(t.work&&s>seg.w0&&s<seg.w1)return{fwd:[c+2.7],opp:[]}; // 1,5 sáv elzárva: csak a jobb oldali 5,4 m marad
 return{fwd:all.slice(t.oncoming),opp:all.slice(0,t.oncoming)};}
export function makeSeg(tid,s0,cx){
 const t=TYPES[tid],L=R(2200,3000),seg={t,s0,cx,L,end:s0+L,jStart:s0+L-450,w0:s0+500,w1:s0+L-900};
 const n=1+(Math.random()*5|0),others=Object.keys(TYPES).filter(k=>k!==tid),cnt=[0,0];
 seg.opts=[{dx:0,type:tid,label:t.label,dir:'↑'}];
 for(let i=0;i<n;i++){const sd=i%2?-1:1,j=cnt[i%2]++,k=Math.random()<.55?{type:pick(others)}:{station:pick(Object.keys(STATIONS))};
  seg.opts.push({...k,dx:sd*(hw(t)+7+j*9),label:k.type?TYPES[k.type].label:STATIONS[k.station],dir:sd>0?'→':'←'});}
 return seg;}
