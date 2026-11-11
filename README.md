# Highway Racing
Three.js (CDN, importmap) alapú, statikus böngészős autópályás játék. GitHub Pages: töltsd fel a mappát, Settings → Pages. (Helyi teszt: `python3 -m http.server`, majd http://localhost:8000.)

## Supabase ranglista
SQL Editor:
```sql
create table scores(id bigint generated always as identity primary key,name text not null check(char_length(name)<=16),score int not null check(score>=0),created_at timestamptz not null default now());
alter table scores enable row level security;
create policy "read" on scores for select using(true);
create policy "insert" on scores for insert with check(true);
```
Majd `js/config.js`-be írd be a Project URL-t és az anon public kulcsot. Kulcs nélkül a ranglista csak a böngészőben (localStorage) él.
Rendezés: pontszám csökkenő, azonos pontnál korábbi időpont előrébb.

## Fájlok
`js/roads.js` úttípusok + csomópont-generálás · `js/traffic.js` forgalom-AI · `js/main.js` fizika, render, HUD, pontozás · `js/leaderboard.js` Supabase REST · `js/audio.js` hang
