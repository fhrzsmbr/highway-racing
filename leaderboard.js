import {SUPABASE_URL as U,SUPABASE_KEY as K} from './config.js';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'},ok=()=>U&&K;
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
export async function top10(){
 if(!ok())return JSON.parse(localStorage.hr||'[]');
 const r=await fetch(`${U}/rest/v1/scores?select=name,score,created_at&order=score.desc,created_at.asc&limit=10`,{headers:H});
 if(!r.ok)throw new Error(r.status);return r.json();}
export async function submit(name,score){
 if(!ok()){const a=JSON.parse(localStorage.hr||'[]');a.push({name,score,created_at:new Date().toISOString()});
  a.sort((x,y)=>y.score-x.score||x.created_at.localeCompare(y.created_at));localStorage.hr=JSON.stringify(a.slice(0,10));return;}
 const r=await fetch(`${U}/rest/v1/scores`,{method:'POST',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify({name,score})});
 if(!r.ok)throw new Error(r.status);}
export const render=(el,rows)=>{el.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}.</td><td>${esc(r.name)}</td><td>${r.score}</td><td>${new Date(r.created_at).toLocaleString('hu-HU')}</td></tr>`).join('')||'<tr><td colspan=4>Még nincs eredmény</td></tr>';};
