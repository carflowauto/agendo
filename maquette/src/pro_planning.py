from common import pro_page
actions = """<button onclick="openModal('modal-rdv')" class="inline-flex items-center gap-1.5 grad text-white text-sm font-semibold rounded-lg px-3.5 h-9 shadow-sm hover:opacity-95"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span class="hidden sm:inline">Nouveau rendez-vous</span></button>"""
content = """
<div class="flex flex-col xl:flex-row xl:items-center gap-4 mb-5">
  <div class="flex items-center gap-2">
    <button id="today" class="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">Aujourd'hui</button>
    <div class="flex"><button id="prev" class="h-9 w-9 rounded-l-lg border border-slate-300 bg-white hover:bg-slate-50" aria-label="Précédent">‹</button><button id="next" class="h-9 w-9 -ml-px rounded-r-lg border border-slate-300 bg-white hover:bg-slate-50" aria-label="Suivant">›</button></div>
    <h2 id="range" class="text-lg font-bold text-slate-900 ml-2">16 – 21 novembre 2026</h2>
  </div>
  <div class="xl:ml-auto flex flex-wrap items-center gap-3">
    <span class="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full pl-2 pr-3 h-8">
      <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0012 22z"/><path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 000 9.2L6.4 14z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 003.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z"/></svg>
      Synchronisé avec Google Agenda <span class="font-normal text-emerald-600">· il y a 2 min</span>
    </span>
    <select class="h-9 rounded-lg border border-slate-300 bg-white text-sm px-2 font-medium"><option>Tous les collaborateurs</option><option>Marie</option><option>Julien</option><option>Sarah</option></select>
    <div class="inline-flex p-1 bg-slate-200/70 rounded-lg" role="tablist">
      <button data-v="day" class="vbtn h-7 px-3 rounded-md text-sm font-semibold text-slate-600">Jour</button>
      <button data-v="week" class="vbtn h-7 px-3 rounded-md text-sm font-semibold bg-white text-slate-900 shadow-sm">Semaine</button>
    </div>
  </div>
</div>

<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
  <div class="bg-white rounded-xl border border-slate-200 px-4 py-3"><p class="text-xs text-slate-500">RDV cette semaine</p><p class="text-xl font-extrabold text-slate-900">38 <span class="text-xs font-semibold text-emerald-600">+12 %</span></p></div>
  <div class="bg-white rounded-xl border border-slate-200 px-4 py-3"><p class="text-xs text-slate-500">Chiffre d'affaires prévu</p><p class="text-xl font-extrabold text-slate-900">2 145 €</p></div>
  <div class="bg-white rounded-xl border border-slate-200 px-4 py-3"><p class="text-xs text-slate-500">Taux de remplissage</p><p class="text-xl font-extrabold text-slate-900">82 %</p></div>
  <div class="bg-white rounded-xl border border-slate-200 px-4 py-3"><p class="text-xs text-slate-500">Réservés en ligne</p><p class="text-xl font-extrabold text-slate-900">71 %</p></div>
</div>

<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
  <div class="overflow-x-auto"><div id="cal" class="min-w-[760px]"></div></div>
  <div class="flex flex-wrap gap-x-5 gap-y-2 px-5 py-3 border-t border-slate-100 text-xs text-slate-600">
    <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-brand-500"></span>Coupe &amp; coiffage</span>
    <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-500"></span>Couleur &amp; balayage</span>
    <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-sky-500"></span>Homme &amp; enfant</span>
    <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500"></span>Soins</span>
    <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded gstripe border border-slate-300"></span>Événement Google Agenda (bloque le créneau)</span>
    <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded hatch"></span>Fermé / pause</span>
  </div>
</div>

<div id="drawer" class="fixed inset-0 z-50 hidden" onclick="if(event.target===this)closeDrawer()">
  <div class="absolute inset-0 bg-slate-900/30" onclick="closeDrawer()"></div>
  <div class="absolute right-0 inset-y-0 w-full max-w-sm bg-white shadow-2xl p-6 overflow-y-auto">
    <div class="flex items-start justify-between"><div><p id="d-time" class="text-sm text-slate-500"></p><h3 id="d-client" class="text-xl font-bold text-slate-900"></h3></div><button onclick="closeDrawer()" class="text-2xl text-slate-400 hover:text-slate-700 leading-none">&times;</button></div>
    <span id="d-src" class="mt-2 inline-flex text-xs font-semibold rounded-full px-2.5 py-1 bg-brand-50 text-brand-700"></span>
    <dl class="mt-6 space-y-3 text-sm">
      <div class="flex justify-between"><dt class="text-slate-500">Prestation</dt><dd id="d-service" class="font-semibold text-slate-900"></dd></div>
      <div class="flex justify-between"><dt class="text-slate-500">Collaborateur</dt><dd id="d-staff" class="font-semibold text-slate-900"></dd></div>
      <div class="flex justify-between"><dt class="text-slate-500">Téléphone</dt><dd class="font-semibold text-slate-900">06 12 34 56 78</dd></div>
      <div class="flex justify-between"><dt class="text-slate-500">Rappel e-mail</dt><dd class="font-semibold text-emerald-600">Programmé la veille à 18:00</dd></div>
      <div class="flex justify-between"><dt class="text-slate-500">Google Agenda</dt><dd class="font-semibold text-emerald-600">✓ Synchronisé</dd></div>
    </dl>
    <div class="mt-8 grid grid-cols-2 gap-2"><a href="clients.html" class="h-10 rounded-lg border border-slate-300 text-sm font-semibold flex items-center justify-center">Fiche client</a><button onclick="closeDrawer();toast('Rendez-vous déplacé')" class="h-10 rounded-lg border border-slate-300 text-sm font-semibold">Déplacer</button><button onclick="closeDrawer();toast('Client marqué comme arrivé')" class="h-10 rounded-lg grad text-white text-sm font-semibold col-span-2">Marquer comme arrivé</button><button onclick="closeDrawer();toast('Rendez-vous annulé, le client a été prévenu')" class="h-10 rounded-lg text-rose-600 text-sm font-semibold col-span-2 hover:bg-rose-50">Annuler le rendez-vous</button></div>
  </div>
</div>

<script>
const H0=9, H1=19, PX=56; // 56px par heure
const DAYS=['Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'], DAYS_L=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const C={brand:'bg-brand-50 border-brand-500 text-brand-900', amber:'bg-amber-50 border-amber-500 text-amber-900', sky:'bg-sky-50 border-sky-500 text-sky-900', emerald:'bg-emerald-50 border-emerald-500 text-emerald-900'};
// day index 0=lundi 16 nov
const EV=[
 [1,'09:00',45,'Camille Durand','Coupe femme','brand','Marie','En ligne'],
 [1,'10:00',150,'Léa Martin','Balayage','amber','Marie','En ligne'],
 [1,'13:30',30,'Hugo Bernard','Coupe homme','sky','Julien','Téléphone'],
 [1,'14:30',60,'Chloé Petit','Coupe + brushing','brand','Marie','En ligne'],
 [1,'16:00',75,'Nadia Benali','Couleur racines','amber','Sarah','En ligne'],
 [2,'09:30',30,'Thomas Roux','Coupe homme','sky','Julien','En ligne'],
 [2,'10:30',30,'Inès Robert','Brushing','brand','Marie','En ligne'],
 [2,'11:00',90,'Julie Moreau','Couleur complète','amber','Sarah','Téléphone'],
 [2,'14:00',180,'Emma Laurent','Lissage brésilien','emerald','Marie','En ligne'],
 [2,'17:30',45,'Paul Girard','Coupe + taille de barbe','sky','Julien','En ligne'],
 [3,'09:00',120,'Sophie Fournier','Mèches','amber','Sarah','En ligne'],
 [3,'11:30',45,'Manon Lambert','Coupe femme','brand','Marie','En ligne'],
 [3,'15:00',20,'Lucas Fontaine','Coupe enfant','sky','Julien','Téléphone'],
 [3,'15:30',30,'Zoé Chevalier','Soin kératine','emerald','Marie','En ligne'],
 [3,'16:30',60,'Alice Mercier','Coupe + brushing','brand','Marie','En ligne'],
 [4,'09:00',45,'Sarah Blanc','Coupe femme','brand','Marie','En ligne'],
 [4,'10:00',150,'Clara Dupont','Balayage','amber','Sarah','En ligne'],
 [4,'14:00',30,'Maxime Henry','Coupe homme','sky','Julien','En ligne'],
 [4,'15:00',45,'Anaïs Guerin','Chignon de soirée','brand','Marie','Téléphone'],
 [4,'17:00',75,'Lina Faure','Couleur racines','amber','Sarah','En ligne'],
 [5,'09:00',30,'Rayan Morel','Coupe homme','sky','Julien','En ligne'],
 [5,'09:30',60,'Margaux Simon','Coupe + brushing','brand','Marie','En ligne'],
 [5,'11:00',90,'Eva Lefebvre','Couleur complète','amber','Sarah','En ligne'],
 [5,'13:30',45,'Jade André','Coupe femme','brand','Marie','En ligne'],
 [5,'14:30',30,'Louis Mathieu','Coupe homme','sky','Julien','En ligne'],
 [5,'15:30',120,'Romane Gautier','Mèches','amber','Sarah','Téléphone'],
];
const GEV=[[1,'12:30',60,'Déjeuner'],[2,'12:30',60,'Déjeuner'],[3,'12:30',60,'Déjeuner'],[3,'18:00',60,'Dentiste – Dr Lemaire'],[4,'12:30',60,'Déjeuner'],[2,'17:30',0,''],[5,'12:30',45,'Livraison fournisseur L\\'Oréal']].filter(g=>g[2]>0);
let view='week', dayIdx=1;
const toM=t=>{const[a,b]=t.split(':').map(Number);return a*60+b}, fm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const dur=m=>m<60?m+' min':Math.floor(m/60)+' h'+(m%60?' '+String(m%60).padStart(2,'0'):'');
function render(){
  const days = view==='week' ? [0,1,2,3,4,5] : [dayIdx];
  document.getElementById('range').textContent = view==='week' ? '16 – 21 novembre 2026' : DAYS_L[dayIdx]+' '+(16+dayIdx)+' novembre 2026';
  const cols = 'grid-template-columns:64px repeat('+days.length+',minmax(0,1fr))';
  let h='<div class="grid border-b border-slate-200 sticky top-0 bg-white z-10" style="'+cols+'"><div></div>';
  days.forEach(d=>{const today=d===1; h+=`<div class="px-3 py-3 border-l border-slate-100 ${today?'bg-brand-50/50':''}"><p class="text-xs font-semibold uppercase ${today?'text-brand-600':'text-slate-500'}">${DAYS[d]}</p><p class="text-xl font-bold ${today?'text-brand-700':'text-slate-900'}">${16+d}${today?' <span class=\\'text-[10px] align-middle font-semibold bg-brand-600 text-white rounded-full px-2 py-0.5 ml-1\\'>Aujourd\\'hui</span>':''}</p></div>`;});
  h+='</div><div class="grid relative pt-3 pb-2" style="'+cols+'"><div class="relative">';
  for(let x=H0;x<=H1;x++) h+=`<div class="absolute right-2 text-[11px] text-slate-400 leading-none" style="top:${(x-H0)*PX-5}px">${String(x).padStart(2,'0')}:00</div>`;
  h+='</div>';
  days.forEach(d=>{
    h+=`<div class="relative border-l border-slate-100 ${d===1?'bg-brand-50/20':''}" style="height:${(H1-H0)*PX}px">`;
    for(let x=H0;x<=H1;x++) h+=`<div class="absolute inset-x-0 border-t border-slate-100" style="top:${(x-H0)*PX}px"></div><div class="absolute inset-x-0 border-t border-dashed border-slate-50" style="top:${(x-H0)*PX+PX/2}px"></div>`;
    if(d===0){ h+=`<div class="absolute inset-0 hatch flex items-start justify-center pt-6"><span class="text-xs font-semibold text-slate-500 bg-white/80 rounded px-2 py-1">Fermé</span></div>`; }
    if(d===5){ h+=`<div class="absolute inset-x-0 bottom-0 hatch" style="height:${PX}px"></div>`; }
    GEV.filter(g=>g[0]===d).forEach(g=>{const top=(toM(g[1])-H0*60)/60*PX, ht=g[2]/60*PX; h+=`<div class="absolute left-1 right-1 rounded-md gstripe border border-dashed border-slate-300 px-2 py-1 overflow-hidden" style="top:${top}px;height:${ht-2}px"><p class="text-[11px] font-semibold text-slate-600 truncate flex items-center gap-1"><span class="font-bold text-blue-500">G</span> ${g[3]}</p><p class="text-[10px] text-slate-400">${g[1]} · Google Agenda</p></div>`;});
    EV.filter(e=>e[0]===d).forEach((e,i)=>{const top=(toM(e[1])-H0*60)/60*PX, ht=e[2]/60*PX; const id=EV.indexOf(e);
      h+=`<div role="button" onclick="openDrawer(${id})" class="cursor-pointer absolute left-1 right-1 rounded-md border-l-[3px] ${C[e[5]]} px-2 py-1 text-left overflow-hidden hover:shadow-md hover:z-10 transition" style="top:${top}px;height:${ht-2}px">
        <p class="text-[11px] font-bold truncate">${e[3]}</p>${ht>34?`<p class="text-[10px] opacity-80 truncate">${e[1]} · ${e[4]}</p>`:''}${ht>60 && view==='week'?`<p class="text-[10px] opacity-70 truncate">${e[6]} · ${dur(e[2])}</p>`:''}${view==='day'?`<p class="text-[10px] opacity-70">${e[6]} · ${dur(e[2])} · ${e[7]}</p>`:''}</div>`;});
    if(d===1){ const now=(14*60+10-H0*60)/60*PX; h+=`<div class="absolute inset-x-0 z-20 pointer-events-none" style="top:${now}px"><div class="h-0.5 bg-rose-500"></div><div class="w-2.5 h-2.5 rounded-full bg-rose-500 -mt-1.5 -ml-1"></div></div>`; }
    h+='</div>';
  });
  h+='</div>';
  document.getElementById('cal').innerHTML=h;
  document.querySelectorAll('.vbtn').forEach(b=>{const on=b.dataset.v===view; b.className='vbtn h-7 px-3 rounded-md text-sm font-semibold '+(on?'bg-white text-slate-900 shadow-sm':'text-slate-600');});
}
document.querySelectorAll('.vbtn').forEach(b=>b.onclick=()=>{view=b.dataset.v;render();});
document.getElementById('prev').onclick=()=>{if(view==='day'&&dayIdx>0){dayIdx--;render();}};
document.getElementById('next').onclick=()=>{if(view==='day'&&dayIdx<5){dayIdx++;render();}};
document.getElementById('today').onclick=()=>{dayIdx=1;render();};
function openDrawer(i){const e=EV[i];document.getElementById('d-time').textContent=DAYS_L[e[0]]+' '+(16+e[0])+' nov. · '+e[1]+' – '+fm(toM(e[1])+e[2]);document.getElementById('d-client').textContent=e[3];document.getElementById('d-service').textContent=e[4]+' ('+dur(e[2])+')';document.getElementById('d-staff').textContent=e[6];document.getElementById('d-src').textContent='Réservé '+(e[7]==='En ligne'?'en ligne':'par téléphone');document.getElementById('drawer').classList.remove('hidden');}
function closeDrawer(){document.getElementById('drawer').classList.add('hidden');}
render();
</script>
"""
open("/workspace/maquette/planning.html","w").write(pro_page("Planning","planning","Planning","Mardi 17 novembre 2026 · 5 rendez-vous aujourd'hui",content,actions))
