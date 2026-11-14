from common import head, LOGO

salon_header = """
<header class="bg-white border-b border-slate-200">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
    """ + LOGO.replace('text-xl','text-lg').replace('w-8 h-8','w-7 h-7') + """
    <span class="text-xs text-slate-500 hidden sm:inline">Réservation sécurisée · Confirmation immédiate</span>
  </div>
</header>
"""

html = head("Salon Marie – Coiffure · Réserver en ligne") + """<body class="bg-slate-50 text-slate-800 pb-28 lg:pb-0">
""" + salon_header + """
<div id="move-banner" class="hidden bg-amber-50 border-b border-amber-200 text-amber-900 text-sm"><div class="max-w-6xl mx-auto px-4 sm:px-6 py-3">Vous déplacez votre rendez-vous : choisissez un nouveau créneau, l'ancien sera libéré automatiquement.</div></div>

<section class="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
  <div class="relative rounded-2xl overflow-hidden h-40 sm:h-52 grad">
    <div class="absolute inset-0 opacity-30" style="background-image:radial-gradient(circle at 20% 30%,#fff 0,transparent 35%),radial-gradient(circle at 80% 70%,#f0abfc 0,transparent 40%)"></div>
    <div class="absolute top-4 right-4 flex gap-2">
      <span class="bg-white/90 text-slate-800 text-xs font-semibold rounded-full px-3 py-1.5">Coiffure femme</span>
      <span class="bg-white/90 text-slate-800 text-xs font-semibold rounded-full px-3 py-1.5">Coiffure homme</span>
      <span class="bg-white/90 text-slate-800 text-xs font-semibold rounded-full px-3 py-1.5 hidden sm:inline">Coloriste</span>
    </div>
  </div>
  <div class="bg-white rounded-2xl border border-slate-200 -mt-10 relative mx-3 sm:mx-6 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-5">
    <span class="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-brand-500 text-white text-xl font-extrabold flex items-center justify-center shrink-0 shadow-md -mt-12 md:mt-0 ring-4 ring-white">SM</span>
    <div class="flex-1 min-w-0">
      <h1 class="text-2xl font-extrabold text-slate-900">Salon Marie – Coiffure</h1>
      <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        <span class="inline-flex items-center gap-1.5"><svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>24 rue Oberkampf, 75011 Paris</span>
        <span class="inline-flex items-center gap-1.5"><span class="text-amber-400">★</span><b class="text-slate-900">4,9</b> (312 avis)</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span><span class="text-emerald-700 font-medium">Ouvert</span> · ferme à 19:00</span>
        <span class="inline-flex items-center gap-1.5"><svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 5.5C3 14 10 21 18.5 21l2-3.5-4-2-2 2C12 16.5 7.5 12 6.5 9.5l2-2-2-4L3 5.5z"/></svg>01 43 55 21 08</span>
      </div>
    </div>
    <details class="md:w-64 text-sm bg-slate-50 rounded-xl px-4 py-3 group" open>
      <summary class="font-semibold text-slate-900 cursor-pointer list-none flex justify-between">Horaires <span class="text-slate-400 group-open:rotate-180 transition">⌄</span></summary>
      <dl class="mt-2 grid grid-cols-2 gap-y-1 text-slate-600">
        <dt>Lundi</dt><dd class="text-right text-slate-400">Fermé</dd>
        <dt>Mar. – Ven.</dt><dd class="text-right">09:00 – 19:00</dd>
        <dt>Samedi</dt><dd class="text-right">09:00 – 18:00</dd>
        <dt>Dimanche</dt><dd class="text-right text-slate-400">Fermé</dd>
      </dl>
    </details>
  </div>
</section>

<main class="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-3 gap-6 items-start">
  <div class="lg:col-span-2 space-y-6 min-w-0">
    <!-- STEP 1 -->
    <section class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <div class="flex items-center gap-3"><span class="step-dot w-7 h-7 rounded-full grad text-white text-sm font-bold flex items-center justify-center">1</span><h2 class="text-lg font-bold text-slate-900">Choisissez une prestation</h2></div>
      <div class="mt-4 flex gap-2 overflow-x-auto pb-1" id="cats"></div>
      <div id="services" class="mt-4 divide-y divide-slate-100"></div>
    </section>

    <!-- STEP 2 -->
    <section id="step2" class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 opacity-60">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3"><span id="dot2" class="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center">2</span><h2 class="text-lg font-bold text-slate-900">Choisissez un créneau</h2></div>
        <div class="flex items-center gap-2">
          <button id="prevW" class="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40" aria-label="Semaine précédente">‹</button>
          <span id="weekLabel" class="text-sm font-semibold text-slate-700 w-44 text-center"></span>
          <button id="nextW" class="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50" aria-label="Semaine suivante">›</button>
        </div>
      </div>
      <p id="step2hint" class="mt-3 text-sm text-slate-500">Sélectionnez d'abord une prestation pour afficher les disponibilités.</p>
      <div class="mt-4 flex items-center gap-3 text-sm">
        <label class="text-slate-600">Avec</label>
        <select id="staff" class="rounded-lg border border-slate-300 h-9 px-2 text-sm bg-white"><option>Peu importe</option><option>Marie</option><option>Julien</option><option>Sarah</option></select>
      </div>
      <div class="mt-4 overflow-x-auto"><div id="week" class="grid grid-cols-7 gap-1 sm:gap-2"></div></div>
    </section>

    <!-- STEP 3 -->
    <section id="step3" class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 opacity-60">
      <div class="flex items-center gap-3"><span id="dot3" class="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center">3</span><h2 class="text-lg font-bold text-slate-900">Vos coordonnées</h2></div>
      <form id="form" class="mt-4 grid sm:grid-cols-2 gap-4" onsubmit="return false">
        <label class="block sm:col-span-2"><span class="text-sm font-medium text-slate-700">Nom et prénom</span><input id="f-name" autocomplete="name" class="mt-1 w-full rounded-lg border border-slate-300 px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="Ex. : Camille Durand"></label>
        <label class="block"><span class="text-sm font-medium text-slate-700">Téléphone mobile</span><input id="f-phone" type="tel" autocomplete="tel" class="mt-1 w-full rounded-lg border border-slate-300 px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="06 12 34 56 78"></label>
        <label class="block"><span class="text-sm font-medium text-slate-700">E-mail</span><input id="f-email" type="email" autocomplete="email" class="mt-1 w-full rounded-lg border border-slate-300 px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="camille@exemple.fr"></label>
        <label class="block sm:col-span-2"><span class="text-sm font-medium text-slate-700">Message pour le salon <span class="text-slate-400 font-normal">(facultatif)</span></span><textarea rows="2" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" placeholder="Ex. : cheveux longs, première visite…"></textarea></label>
        <label class="sm:col-span-2 flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" checked class="mt-0.5 rounded text-brand-600"> Recevoir un rappel par e-mail la veille du rendez-vous</label>
      </form>
      <p id="form-err" class="hidden mt-3 text-sm text-rose-600 font-medium">Merci de renseigner votre nom, un téléphone et un e-mail valides.</p>
    </section>
  </div>

  <!-- RECAP -->
  <aside class="min-w-0 lg:sticky lg:top-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
    <h2 class="font-bold text-slate-900">Récapitulatif</h2>
    <div class="mt-4 space-y-4 text-sm">
      <div class="flex gap-3"><span class="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">✂</span><div><p class="text-slate-500 text-xs">Prestation</p><p id="r-service" class="font-semibold text-slate-400">Aucune prestation choisie</p><p id="r-dur" class="text-slate-500"></p></div></div>
      <div class="flex gap-3"><span class="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg></span><div><p class="text-slate-500 text-xs">Date et heure</p><p id="r-date" class="font-semibold text-slate-400">Aucun créneau choisi</p><p id="r-staff" class="text-slate-500"></p></div></div>
      <div class="flex gap-3"><span class="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span><div><p class="text-slate-500 text-xs">Adresse</p><p class="font-semibold text-slate-900">Salon Marie – Coiffure</p><p class="text-slate-500">24 rue Oberkampf, 75011 Paris</p></div></div>
    </div>
    <div class="mt-5 pt-4 border-t border-slate-100 flex justify-between items-baseline"><span class="text-slate-600 text-sm">Total à régler sur place</span><span id="r-price" class="text-2xl font-extrabold text-slate-900">–</span></div>
    <button id="confirm" disabled class="mt-5 w-full h-12 rounded-xl grad text-white font-semibold shadow-md shadow-brand-500/25 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed">Confirmer le rendez-vous</button>
    <p class="mt-3 text-xs text-slate-500 text-center">Annulation gratuite jusqu'à 24 h avant le rendez-vous.</p>
  </aside>
</main>

<div class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
  <div class="flex-1 min-w-0"><p id="m-line1" class="text-sm font-semibold text-slate-900 truncate">Choisissez une prestation</p><p id="m-line2" class="text-xs text-slate-500 truncate">puis un créneau</p></div>
  <button id="confirm-m" disabled class="h-11 px-5 rounded-xl grad text-white text-sm font-semibold disabled:opacity-40">Confirmer le rendez-vous</button>
</div>

<footer class="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-xs text-slate-400 flex justify-between"><span>Réservation propulsée par <a href="index.html" class="font-semibold text-slate-500 hover:text-brand-600">Sheensy</a></span><a href="#" class="hover:text-slate-600">Confidentialité</a></footer>

<script>
const SERVICES = [
 {cat:'Femme', name:'Coupe femme', desc:'Shampoing, coupe et coiffage', dur:45, price:45},
 {cat:'Femme', name:'Brushing', desc:'Shampoing et brushing, cheveux courts à longs', dur:30, price:30},
 {cat:'Femme', name:'Coupe + brushing', desc:'Shampoing, coupe et brushing', dur:60, price:60},
 {cat:'Femme', name:'Chignon / coiffure de soirée', desc:'Sur cheveux propres et secs', dur:45, price:55},
 {cat:'Homme', name:'Coupe homme', desc:'Shampoing, coupe aux ciseaux ou tondeuse', dur:30, price:25},
 {cat:'Homme', name:'Coupe + taille de barbe', desc:'Coupe, contours et barbe à la tondeuse', dur:45, price:35},
 {cat:'Homme', name:'Coupe enfant (– 12 ans)', desc:'Fille ou garçon', dur:20, price:18},
 {cat:'Couleur', name:'Couleur racines', desc:'Application, temps de pose et shampoing', dur:75, price:65},
 {cat:'Couleur', name:'Couleur complète', desc:'Longueurs et racines', dur:90, price:80},
 {cat:'Couleur', name:'Balayage', desc:'Éclaircissement naturel, patine incluse', dur:150, price:120},
 {cat:'Couleur', name:'Mèches', desc:'Mèches au papier, patine incluse', dur:120, price:95},
 {cat:'Soins', name:'Soin profond à la kératine', desc:'Réparation et brillance', dur:30, price:25},
 {cat:'Soins', name:'Lissage brésilien', desc:'Tenue jusqu\\'à 4 mois', dur:180, price:180},
];
const CATS = ['Tout', 'Femme', 'Homme', 'Couleur', 'Soins'];
const DAYS = ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'];
const DAYS_L = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const MONTHS_S = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const BASE = new Date(2026,10,16); // lundi 16 novembre 2026
let cat='Tout', sel=null, slot=null, weekOffset=0;
const fmtDur = m => m<60 ? m+' min' : Math.floor(m/60)+' h'+(m%60? ' '+String(m%60).padStart(2,'0'):'');
const $ = id => document.getElementById(id);

function renderCats(){
  $('cats').innerHTML = CATS.map(c=>`<button data-c="${c}" class="shrink-0 px-4 h-9 rounded-full text-sm font-semibold border ${c===cat?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}">${c}</button>`).join('');
  $('cats').querySelectorAll('button').forEach(b=>b.onclick=()=>{cat=b.dataset.c;renderCats();renderServices();});
}
function renderServices(){
  const list = SERVICES.map((s,i)=>({...s,i})).filter(s=>cat==='Tout'||s.cat===cat);
  let html='', last='';
  list.forEach(s=>{
    if(cat==='Tout' && s.cat!==last){ html+=`<p class="pt-4 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">${s.cat}</p>`; last=s.cat; }
    const on = sel===s.i;
    html+=`<div class="flex items-center gap-4 py-3.5 ${on?'bg-brand-50/60 -mx-3 px-3 rounded-xl':''}">
      <div class="flex-1 min-w-0"><p class="font-semibold text-slate-900">${s.name}</p><p class="text-sm text-slate-500 truncate">${s.desc}</p></div>
      <div class="text-right shrink-0"><p class="font-bold text-slate-900">${s.price} €</p><p class="text-xs text-slate-500">${fmtDur(s.dur)}</p></div>
      <button data-i="${s.i}" class="shrink-0 w-20 sm:w-28 h-10 rounded-lg text-sm font-semibold ${on?'grad text-white shadow-sm':'border border-brand-200 text-brand-700 hover:bg-brand-50'}">${on?'✓ Choisi':'Choisir'}</button>
    </div>`;
  });
  $('services').innerHTML = html;
  $('services').querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>{sel=+b.dataset.i; slot=null; renderServices(); renderWeek(); update(); $('step2').scrollIntoView({behavior:'smooth',block:'start'});});
}
function slotsFor(date){
  const d=date.getDay(); if(d===0||d===1) return null;
  const end = d===6 ? 18*60 : 19*60; const out=[];
  const seed = date.getDate()*7 + (sel||0)*3;
  for(let m=9*60; m+ (sel!==null?SERVICES[sel].dur:30) <= end; m+=30){
    const k=(m/30 + seed)%5; if(k===1||k===3) continue;
    if(m>=12*60+30 && m<13*60+30 && d!==6) continue;
    out.push(m);
  }
  return out;
}
function renderWeek(){
  const start = new Date(BASE); start.setDate(BASE.getDate()+weekOffset*7);
  const end = new Date(start); end.setDate(start.getDate()+6);
  $('weekLabel').textContent = `${start.getDate()} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
  $('prevW').disabled = weekOffset===0;
  const active = sel!==null;
  $('step2').classList.toggle('opacity-60',!active);
  $('step2hint').classList.toggle('hidden',active);
  $('dot2').className = 'w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center '+(active?'grad text-white':'bg-slate-200 text-slate-600');
  let html='';
  for(let i=0;i<7;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const past = d < new Date(2026,10,14);
    const slots = past?[]:slotsFor(d);
    html+=`<div class="text-center"><p class="text-xs font-semibold text-slate-500 uppercase">${DAYS[d.getDay()]}</p><p class="text-lg font-bold text-slate-900">${d.getDate()}</p><p class="text-[11px] text-slate-400 mb-2">${MONTHS_S[d.getMonth()]}</p><div class="space-y-1.5">`;
    if(slots===null) html+=`<div class="hatch rounded-lg h-24 flex items-center justify-center text-[10px] sm:text-xs font-medium text-slate-400">Fermé</div>`;
    else if(!active) html+= Array(6).fill('<div class="h-9 rounded-lg bg-slate-100"></div>').join('');
    else slots.slice(0,10).forEach(m=>{
      const key=d.toDateString()+'|'+m; const on = slot && slot.key===key;
      const t=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
      html+=`<button data-k="${key}" data-t="${t}" data-d="${d.toISOString()}" class="w-full h-9 rounded-lg text-[12px] sm:text-sm font-semibold tabular-nums ${on?'grad text-white shadow-md ring-2 ring-brand-300':'bg-brand-50 text-brand-700 hover:bg-brand-100'}">${t}</button>`;
    });
    html+='</div></div>';
  }
  $('week').innerHTML=html;
  $('week').querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>{slot={key:b.dataset.k,t:b.dataset.t,d:new Date(b.dataset.d)}; renderWeek(); update();});
}
function update(){
  const s = sel!==null?SERVICES[sel]:null;
  $('r-service').textContent = s? s.name : 'Aucune prestation choisie';
  $('r-service').className = 'font-semibold '+(s?'text-slate-900':'text-slate-400');
  $('r-dur').textContent = s? fmtDur(s.dur)+' · '+s.price+' €' : '';
  $('r-price').textContent = s? s.price+' €' : '–';
  const st = $('staff').value;
  if(slot){ const d=slot.d; $('r-date').textContent = `${DAYS_L[d.getDay()][0].toUpperCase()+DAYS_L[d.getDay()].slice(1)} ${d.getDate()} ${MONTHS[d.getMonth()]} à ${slot.t}`; $('r-date').className='font-semibold text-slate-900'; $('r-staff').textContent = st==='Peu importe'?'Avec le premier coiffeur disponible':'Avec '+st; }
  else { $('r-date').textContent='Aucun créneau choisi'; $('r-date').className='font-semibold text-slate-400'; $('r-staff').textContent=''; }
  const ready = !!(s&&slot);
  $('confirm').disabled = !ready; $('confirm-m').disabled=!ready;
  $('step3').classList.toggle('opacity-60',!ready);
  $('dot3').className = 'w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center '+(ready?'grad text-white':'bg-slate-200 text-slate-600');
  $('m-line1').textContent = s? s.name+' · '+s.price+' €' : 'Choisissez une prestation';
  $('m-line2').textContent = slot? $('r-date').textContent : 'puis un créneau';
}
function confirmRdv(){
  const n=$('f-name'), p=$('f-phone'), e=$('f-email'); let ok=true;
  [[n,v=>v.trim().length>1],[p,v=>v.replace(/\\D/g,'').length>=10],[e,v=>/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v)]].forEach(([el,fn])=>{const good=fn(el.value); el.classList.toggle('border-rose-400',!good); el.classList.toggle('ring-2',!good); el.classList.toggle('ring-rose-100',!good); ok=ok&&good;});
  $('form-err').classList.toggle('hidden',ok);
  if(!ok){ $('step3').scrollIntoView({behavior:'smooth',block:'center'}); return; }
  const s=SERVICES[sel]; const d=slot.d;
  const q = new URLSearchParams({s:s.name, dur:s.dur, p:s.price, t:slot.t, y:d.getFullYear(), m:d.getMonth(), d:d.getDate(), n:n.value.trim(), e:e.value.trim(), st:$('staff').value});
  location.href='confirmation.html?'+q.toString();
}
$('confirm').onclick=confirmRdv; $('confirm-m').onclick=confirmRdv;
$('staff').onchange=update;
$('prevW').onclick=()=>{if(weekOffset>0){weekOffset--;slot=null;renderWeek();update();}};
$('nextW').onclick=()=>{weekOffset++;slot=null;renderWeek();update();};
if(new URLSearchParams(location.search).get('move')) $('move-banner').classList.remove('hidden');
renderCats(); renderServices(); renderWeek(); update();
</script>
</body></html>"""
open("/workspace/maquette/reservation.html","w").write(html)

conf = head("Rendez-vous confirmé – Salon Marie – Coiffure") + """<body class="bg-slate-50 text-slate-800">
<header class="bg-white border-b border-slate-200"><div class="max-w-md mx-auto px-5 h-14 flex items-center justify-between">""" + LOGO.replace('text-xl','text-lg').replace('w-8 h-8','w-7 h-7') + """<a href="reservation.html" class="text-sm font-medium text-slate-500 hover:text-slate-800">Salon Marie</a></div></header>
<main class="max-w-md mx-auto px-5 py-8">
  <div id="ok-state">
    <div class="text-center">
      <div class="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center ring-8 ring-emerald-50"><svg class="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
      <h1 class="mt-6 text-2xl font-extrabold text-slate-900">Rendez-vous confirmé !</h1>
      <p class="mt-2 text-slate-600">Merci <span id="c-first">Camille</span>, un e-mail de confirmation a été envoyé à <span id="c-email" class="font-medium text-slate-800">camille.durand@gmail.com</span>.</p>
    </div>
    <div class="mt-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="grad px-5 py-4 text-white flex items-center gap-4">
        <div class="bg-white/15 rounded-xl w-16 py-2 text-center"><p id="c-dow" class="text-[11px] uppercase font-semibold text-brand-100">Mar.</p><p id="c-day" class="text-2xl font-extrabold leading-none">17</p><p id="c-mon" class="text-[11px] uppercase font-semibold text-brand-100">nov.</p></div>
        <div><p id="c-when" class="font-bold text-lg">Mardi 17 novembre</p><p id="c-time" class="text-brand-100">14:30 – 15:15</p></div>
      </div>
      <dl class="divide-y divide-slate-100 text-sm">
        <div class="flex justify-between gap-4 px-5 py-3.5"><dt class="text-slate-500">Prestation</dt><dd id="c-service" class="font-semibold text-slate-900 text-right">Coupe femme</dd></div>
        <div class="flex justify-between gap-4 px-5 py-3.5"><dt class="text-slate-500">Durée</dt><dd id="c-dur" class="font-semibold text-slate-900">45 min</dd></div>
        <div class="flex justify-between gap-4 px-5 py-3.5"><dt class="text-slate-500">Avec</dt><dd id="c-staff" class="font-semibold text-slate-900">Marie</dd></div>
        <div class="flex justify-between gap-4 px-5 py-3.5"><dt class="text-slate-500">Prix</dt><dd id="c-price" class="font-semibold text-slate-900">45 € · à régler sur place</dd></div>
        <div class="px-5 py-3.5"><dt class="text-slate-500">Adresse</dt><dd class="mt-1 font-semibold text-slate-900">Salon Marie – Coiffure</dd><dd class="text-slate-600">24 rue Oberkampf, 75011 Paris</dd><dd class="mt-1"><a href="https://maps.google.com/?q=24+rue+Oberkampf+75011+Paris" target="_blank" class="text-brand-600 font-medium">Itinéraire →</a></dd></div>
        <div class="flex justify-between gap-4 px-5 py-3.5"><dt class="text-slate-500">Référence</dt><dd class="font-mono text-slate-700">AGD-7K42Q</dd></div>
      </dl>
    </div>

    <div class="mt-6 space-y-3">
      <div class="relative">
        <button id="addcal" class="w-full h-12 rounded-xl grad text-white font-semibold shadow-md shadow-brand-500/25 flex items-center justify-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v4M10 15h4"/></svg>Ajouter à mon calendrier</button>
        <div id="calmenu" class="hidden absolute z-10 left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden text-sm">
          <a id="cal-apple" href="#" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"><span class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">iCal</span><span><b class="block text-slate-900">Calendrier iPhone / Mac</b><span class="text-slate-500 text-xs">Fichier .ics</span></span></a>
          <a id="cal-google" href="#" target="_blank" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-t border-slate-100"><span class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold"><span class="text-blue-500">G</span></span><span><b class="block text-slate-900">Google Agenda</b><span class="text-slate-500 text-xs">S'ouvre dans un nouvel onglet</span></span></a>
          <a id="cal-outlook" href="#" target="_blank" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-t border-slate-100"><span class="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs">O</span><span><b class="block text-slate-900">Outlook</b><span class="text-slate-500 text-xs">Outlook.com ou Microsoft 365</span></span></a>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <a href="reservation.html?move=1" class="h-12 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>Déplacer</a>
        <button onclick="openCancel()" class="h-12 rounded-xl border border-rose-200 bg-white text-rose-600 font-semibold flex items-center justify-center gap-2 hover:bg-rose-50"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>Annuler</button>
      </div>
      <p class="text-xs text-slate-500 text-center pt-1">Déplacement et annulation gratuits jusqu'à 24 h avant le rendez-vous. Vous recevrez un rappel par e-mail la veille.</p>
    </div>
  </div>

  <div id="cancel-state" class="hidden text-center py-10">
    <div class="mx-auto w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center"><svg class="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></div>
    <h1 class="mt-6 text-2xl font-extrabold text-slate-900">Rendez-vous annulé</h1>
    <p class="mt-2 text-slate-600">Le salon a été prévenu et le créneau est de nouveau disponible. Un e-mail de confirmation d'annulation vous a été envoyé.</p>
    <a href="reservation.html" class="mt-8 inline-flex h-12 px-6 items-center rounded-xl grad text-white font-semibold">Reprendre un rendez-vous</a>
  </div>
</main>

<div id="cancel-modal" class="fixed inset-0 z-50 hidden items-end sm:items-center justify-center bg-slate-900/50" onclick="if(event.target===this)closeCancel()">
  <div class="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6">
    <h3 class="text-lg font-bold text-slate-900">Annuler ce rendez-vous ?</h3>
    <p class="mt-2 text-sm text-slate-600">Le créneau sera libéré et le salon sera prévenu. Cette action est définitive.</p>
    <label class="block mt-4"><span class="text-sm font-medium text-slate-700">Motif <span class="text-slate-400 font-normal">(facultatif)</span></span><select class="mt-1 w-full rounded-lg border border-slate-300 h-11 px-3 text-sm bg-white"><option>Empêchement personnel</option><option>J'ai trouvé un autre créneau</option><option>Autre</option></select></label>
    <div class="mt-6 grid grid-cols-2 gap-3"><button onclick="closeCancel()" class="h-11 rounded-xl border border-slate-300 font-semibold text-slate-700">Garder</button><button onclick="doCancel()" class="h-11 rounded-xl bg-rose-600 text-white font-semibold">Oui, annuler</button></div>
  </div>
</div>

<script>
const q=new URLSearchParams(location.search);
const DAYS=['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'], DAYS_L=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'], MONTHS_S=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const svc=q.get('s')||'Coupe femme', dur=+(q.get('dur')||45), price=q.get('p')||'45', t=q.get('t')||'14:30';
const d=new Date(+(q.get('y')||2026), +(q.get('m')||10), +(q.get('d')||17));
const name=q.get('n')||'Camille Durand', email=q.get('e')||'camille.durand@gmail.com', st=q.get('st');
const [hh,mm]=t.split(':').map(Number); const startM=hh*60+mm, endM=startM+dur;
const fm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const fmtDur=m=>m<60?m+' min':Math.floor(m/60)+' h'+(m%60?' '+String(m%60).padStart(2,'0'):'');
const set=(id,v)=>document.getElementById(id).textContent=v;
set('c-first',name.split(' ')[0]); set('c-email',email); set('c-dow',DAYS[d.getDay()]); set('c-day',d.getDate()); set('c-mon',MONTHS_S[d.getMonth()]);
set('c-when',DAYS_L[d.getDay()]+' '+d.getDate()+' '+MONTHS[d.getMonth()]); set('c-time',fm(startM)+' – '+fm(endM));
set('c-service',svc); set('c-dur',fmtDur(dur)); set('c-price',price+' € · à régler sur place'); set('c-staff',(!st||st==='Peu importe')?'Marie':st);
const pad=n=>String(n).padStart(2,'0');
const stamp=m=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(Math.floor(m/60))}${pad(m%60)}00`;
const title=svc+' – Salon Marie', loc='24 rue Oberkampf, 75011 Paris';
document.getElementById('cal-google').href='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(title)+'&dates='+stamp(startM)+'/'+stamp(endM)+'&ctz=Europe/Paris&location='+encodeURIComponent(loc)+'&details='+encodeURIComponent('Réservé via Sheensy – réf. AGD-7K42Q');
document.getElementById('cal-outlook').href='https://outlook.live.com/calendar/0/deeplink/compose?subject='+encodeURIComponent(title)+'&location='+encodeURIComponent(loc);
const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sheensy//FR','BEGIN:VEVENT','UID:AGD-7K42Q@sheensy.com','DTSTART;TZID=Europe/Paris:'+stamp(startM),'DTEND;TZID=Europe/Paris:'+stamp(endM),'SUMMARY:'+title,'LOCATION:'+loc,'END:VEVENT','END:VCALENDAR'].join('\\r\\n');
const a=document.getElementById('cal-apple'); a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'})); a.download='rendez-vous-salon-marie.ics';
document.getElementById('addcal').onclick=e=>{e.stopPropagation();document.getElementById('calmenu').classList.toggle('hidden');};
document.addEventListener('click',()=>document.getElementById('calmenu').classList.add('hidden'));
function openCancel(){const m=document.getElementById('cancel-modal');m.classList.remove('hidden');m.classList.add('flex');}
function closeCancel(){const m=document.getElementById('cancel-modal');m.classList.add('hidden');m.classList.remove('flex');}
function doCancel(){closeCancel();document.getElementById('ok-state').classList.add('hidden');document.getElementById('cancel-state').classList.remove('hidden');}
</script>
</body></html>"""
open("/workspace/maquette/confirmation.html","w").write(conf)
