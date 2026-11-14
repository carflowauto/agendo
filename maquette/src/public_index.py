from common import head, LOGO
CHECK = '<svg class="w-5 h-5 text-brand-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>'

def feat(svg, title, text, bullets):
    b = "".join('<li class="flex gap-2 text-sm text-slate-600">%s<span>%s</span></li>' % (CHECK.replace("w-5 h-5","w-4 h-4 mt-0.5"), x) for x in bullets)
    return """<div class="bg-white rounded-2xl border border-slate-200 p-7 hover:shadow-lg hover:shadow-brand-100/60 transition">
      <div class="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">%s</div>
      <h3 class="text-lg font-bold text-slate-900">%s</h3><p class="mt-2 text-slate-600 text-[15px] leading-relaxed">%s</p>
      <ul class="mt-4 space-y-2">%s</ul></div>""" % (svg, title, text, b)

def sv(p): return '<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">%s</svg>' % p

features = "".join([
 feat(sv('<path stroke-linecap="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path stroke-linecap="round" d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>'),
      "Réservation en ligne 24h/24", "Votre page de réservation personnalisée : vos clients choisissent une prestation et un créneau libre, même quand le salon est fermé.",
      ["Lien unique à partager sur Instagram et Google", "Sans création de compte pour le client", "Optimisée pour le mobile"]),
 feat(sv('<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>'),
      "Planning simple et clair", "Vue jour ou semaine, rendez-vous colorés par prestation, ajout d'un client au téléphone en quelques secondes.",
      ["Horaires, pauses et congés", "Fiches clients et historique", "Déplacement par glisser-déposer"]),
 feat(sv('<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>'),
      "Synchro Google Agenda et iPhone", "Vos rendez-vous apparaissent dans Google Agenda et dans le calendrier de votre iPhone grâce au lien iCal.",
      ["Google Agenda dans les deux sens", "Vos événements perso bloquent les créneaux", "Abonnement iCal (.ics) pour iPhone et Mac"]),
 feat(sv('<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>'),
      "Rappels automatiques par e-mail", "Confirmation immédiate puis rappel la veille : moins d'oublis, moins de rendez-vous manqués.",
      ["Lien pour déplacer ou annuler", "Messages à vos couleurs", "Vous êtes prévenu de chaque changement"]),
])

def plan(name, price, desc, items, cta, popular=False):
    li = "".join('<li class="flex gap-3 text-sm %s">%s<span>%s</span></li>' % ("text-brand-50" if popular else "text-slate-600", CHECK.replace("text-brand-600", "text-white" if popular else "text-brand-600"), i) for i in items)
    if popular:
        return """<div class="relative grad rounded-2xl p-8 text-white shadow-xl shadow-brand-500/30 lg:-my-4">
        <span class="absolute -top-3 left-8 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-full">Le plus choisi</span>
        <h3 class="font-bold text-lg">%s</h3><p class="text-brand-100 text-sm mt-1">%s</p>
        <p class="mt-6"><span class="text-5xl font-extrabold">%s</span><span class="text-brand-100"> HT/mois</span></p>
        <a href="planning.html" class="mt-6 block text-center bg-white text-brand-700 font-semibold rounded-xl py-3 hover:bg-brand-50">%s</a>
        <ul class="mt-8 space-y-3">%s</ul></div>""" % (name, desc, price, cta, li)
    return """<div class="bg-white rounded-2xl border border-slate-200 p-8">
        <h3 class="font-bold text-lg text-slate-900">%s</h3><p class="text-slate-500 text-sm mt-1">%s</p>
        <p class="mt-6"><span class="text-5xl font-extrabold text-slate-900">%s</span><span class="text-slate-500"> HT/mois</span></p>
        <a href="planning.html" class="mt-6 block text-center border border-slate-300 text-slate-900 font-semibold rounded-xl py-3 hover:bg-slate-50">%s</a>
        <ul class="mt-8 space-y-3">%s</ul></div>""" % (name, desc, price, cta, li)

plans = (plan("Solo", "19 €", "Pour les indépendants qui travaillent seuls.", ["1 agenda", "Réservations illimitées", "Page de réservation personnalisée", "Rappels par e-mail", "Synchro Google Agenda et iPhone"], "Essayer gratuitement")
 + plan("Salon", "39 €", "Pour les salons jusqu'à 5 collaborateurs.", ["Jusqu'à 5 agendas", "Tout ce qui est inclus dans Solo", "Fiches clients et historique", "Statistiques de fréquentation", "Support prioritaire par chat"], "Essayer gratuitement", True)
 + plan("Multi-sites", "79 €", "Pour les enseignes avec plusieurs adresses.", ["Agendas illimités", "Tout ce qui est inclus dans Salon", "Plusieurs établissements", "Gestion des droits par collaborateur", "Accompagnement à la mise en place"], "Contacter l'équipe"))

# hero mock app card
hero_mock = """
<div class="relative">
  <div class="absolute -inset-6 grad opacity-20 blur-3xl rounded-[3rem]"></div>
  <div class="relative bg-white rounded-2xl shadow-2xl shadow-brand-900/10 border border-slate-200 overflow-hidden">
    <div class="flex items-center gap-1.5 px-4 h-9 bg-slate-50 border-b border-slate-200"><span class="w-2.5 h-2.5 rounded-full bg-rose-300"></span><span class="w-2.5 h-2.5 rounded-full bg-amber-300"></span><span class="w-2.5 h-2.5 rounded-full bg-emerald-300"></span><span class="ml-3 text-[11px] text-slate-400">sheensy.com/pro/planning</span></div>
    <div class="p-4">
      <div class="flex items-center justify-between mb-3"><div><p class="text-xs text-slate-500">Mardi 17 novembre</p><p class="font-bold text-slate-900">Planning du jour</p></div>
      <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Google Agenda</span></div>
      <div class="space-y-2 pb-10">
        <div class="flex gap-3 items-stretch"><span class="w-12 text-xs text-slate-400 pt-2">09:30</span><div class="flex-1 rounded-lg bg-brand-50 border-l-4 border-brand-500 px-3 py-2"><p class="text-sm font-semibold text-brand-900">Camille Durand</p><p class="text-xs text-brand-700">Coupe femme · 45 min</p></div></div>
        <div class="flex gap-3 items-stretch"><span class="w-12 text-xs text-slate-400 pt-2">10:30</span><div class="flex-1 rounded-lg bg-amber-50 border-l-4 border-amber-500 px-3 py-2"><p class="text-sm font-semibold text-amber-900">Léa Martin</p><p class="text-xs text-amber-700">Balayage · 2 h 30</p></div></div>
        <div class="flex gap-3 items-stretch"><span class="w-12 text-xs text-slate-400 pt-2">13:00</span><div class="flex-1 rounded-lg gstripe border border-dashed border-slate-300 px-3 py-2"><p class="text-sm font-semibold text-slate-600">Déjeuner – Google Agenda</p><p class="text-xs text-slate-500">Créneau bloqué automatiquement</p></div></div>
        <div class="flex gap-3 items-stretch"><span class="w-12 text-xs text-slate-400 pt-2">14:30</span><div class="flex-1 rounded-lg bg-sky-50 border-l-4 border-sky-500 px-3 py-2"><p class="text-sm font-semibold text-sky-900">Hugo Bernard</p><p class="text-xs text-sky-700">Coupe homme · 30 min</p></div></div>
      </div>
    </div>
  </div>
  <div class="absolute -bottom-7 -left-6 hidden sm:flex items-center gap-3 bg-white rounded-xl shadow-xl border border-slate-200 px-4 py-3">
    <span class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></span>
    <div><p class="text-sm font-semibold text-slate-900">Nouveau rendez-vous</p><p class="text-xs text-slate-500">Inès R. · Brushing · Sam. 10:00</p></div>
  </div>
  <div class="absolute -top-5 -right-4 hidden sm:flex items-center gap-2 bg-white rounded-xl shadow-xl border border-slate-200 px-3 py-2">
    <span class="text-amber-400">★★★★★</span><span class="text-xs font-semibold text-slate-700">4,9/5 · 312 avis</span>
  </div>
</div>"""

html = head("Sheensy – La prise de rendez-vous en ligne pour les pros") + """<body class="bg-white text-slate-800">
<header class="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-100">
  <div class="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center gap-8">
    """ + LOGO + """
    <nav class="hidden md:flex items-center gap-1 text-sm font-medium">
      <a href="index.html" class="px-3 py-2 rounded-lg text-slate-900 bg-slate-100">Accueil</a>
      <a href="#fonctionnalites" class="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50">Fonctionnalités</a>
      <a href="#tarifs" class="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50">Tarifs</a>
    </nav>
    <div class="ml-auto flex items-center gap-2">
      <a href="planning.html" class="hidden sm:inline-flex px-4 h-10 items-center text-sm font-semibold text-slate-700 hover:text-slate-900">Connexion</a>
      <a href="planning.html" class="inline-flex px-4 h-10 items-center rounded-xl grad text-white text-sm font-semibold shadow-md shadow-brand-500/25 hover:opacity-95">Essayer gratuitement</a>
      <button class="md:hidden p-2 rounded-lg hover:bg-slate-100" onclick="document.getElementById('mnav').classList.toggle('hidden')" aria-label="Menu"><svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
    </div>
  </div>
  <div id="mnav" class="hidden md:hidden border-t border-slate-100 px-5 py-3 space-y-1 text-sm font-medium">
    <a href="index.html" class="block px-3 py-2 rounded-lg bg-slate-100">Accueil</a><a href="#fonctionnalites" class="block px-3 py-2 rounded-lg">Fonctionnalités</a><a href="#tarifs" class="block px-3 py-2 rounded-lg">Tarifs</a><a href="planning.html" class="block px-3 py-2 rounded-lg">Connexion</a>
  </div>
</header>

<section class="relative overflow-hidden">
  <div class="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/70 via-white to-white"></div>
  <div class="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-24 lg:pt-24 grid lg:grid-cols-2 gap-14 items-center">
    <div>
      <span class="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 bg-white border border-brand-200 rounded-full px-3 py-1.5 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>Nouveau : synchro iPhone via iCal</span>
      <h1 class="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">Vos clients réservent en ligne <span class="grad-text">24h/24</span></h1>
      <p class="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">Sheensy est le logiciel de prise de rendez-vous pensé pour les coiffeurs, instituts et indépendants. Une page de réservation, un planning clair, vos agendas synchronisés et des rappels automatiques.</p>
      <div class="mt-8 flex flex-col sm:flex-row gap-3">
        <a href="planning.html" class="inline-flex justify-center items-center whitespace-nowrap px-6 h-12 rounded-xl grad text-white font-semibold shadow-lg shadow-brand-500/30 hover:opacity-95">Essayer gratuitement 14 jours</a>
        <a href="reservation.html" class="inline-flex justify-center items-center whitespace-nowrap gap-2 px-6 h-12 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-50">Voir la démo <span aria-hidden="true">→</span></a>
      </div>
      <p class="mt-4 text-sm text-slate-500">Sans carte bancaire · Sans engagement · Mise en ligne en 10 minutes</p>
      <div class="mt-10 flex items-center gap-6">
        <div><p class="text-2xl font-extrabold text-slate-900">-70 %</p><p class="text-xs text-slate-500">de rendez-vous oubliés</p></div>
        <div class="w-px h-10 bg-slate-200"></div>
        <div><p class="text-2xl font-extrabold text-slate-900">45 %</p><p class="text-xs text-slate-500">des réservations hors horaires</p></div>
        <div class="w-px h-10 bg-slate-200"></div>
        <div><p class="text-2xl font-extrabold text-slate-900">3 clics</p><p class="text-xs text-slate-500">pour réserver</p></div>
      </div>
    </div>
    """ + hero_mock + """
  </div>
</section>

<section class="border-y border-slate-100 bg-slate-50/60">
  <div class="max-w-7xl mx-auto px-5 sm:px-8 py-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-slate-400 font-semibold">
    <span class="text-sm text-slate-500 font-medium">Ils gèrent leur planning avec Sheensy :</span>
    <span>Atelier Lumière</span><span>Barber Oberkampf</span><span>Institut Rose Thé</span><span>L'Instant Beauté</span><span>Studio Coupe &amp; Co</span>
  </div>
</section>

<section id="fonctionnalites" class="scroll-mt-16 max-w-7xl mx-auto px-5 sm:px-8 py-24">
  <div class="max-w-2xl">
    <p class="text-sm font-semibold text-brand-600 uppercase tracking-wider">Fonctionnalités</p>
    <h2 class="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Tout ce qu'il faut pour remplir votre agenda, rien de superflu</h2>
    <p class="mt-4 text-lg text-slate-600">Vous vous concentrez sur vos clients, Sheensy s'occupe du reste.</p>
  </div>
  <div class="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">""" + features + """</div>

  <div class="mt-20 grid lg:grid-cols-2 gap-10 items-center bg-slate-900 rounded-3xl p-8 sm:p-12 text-white overflow-hidden relative">
    <div class="absolute -right-24 -top-24 w-80 h-80 grad rounded-full opacity-40 blur-3xl"></div>
    <div class="relative">
      <h3 class="text-2xl sm:text-3xl font-extrabold">Votre planning partout, même sur votre iPhone</h3>
      <p class="mt-4 text-slate-300 leading-relaxed">Connectez Google Agenda en un clic : vos rendez-vous y sont ajoutés et vos événements personnels bloquent les créneaux. Sur iPhone, ajoutez votre lien d'abonnement iCal une seule fois, et vos rendez-vous s'affichent dans l'app Calendrier.</p>
      <div class="mt-6 flex flex-wrap gap-3">
        <span class="inline-flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm font-medium"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>Google Agenda</span>
        <span class="inline-flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm font-medium"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>Calendrier iPhone (iCal)</span>
        <span class="inline-flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm font-medium"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>Calendrier Mac</span>
      </div>
    </div>
    <div class="relative bg-white/5 border border-white/10 rounded-2xl p-5 font-mono text-sm">
      <p class="text-slate-400 text-xs mb-2 font-sans">Votre lien d'abonnement</p>
      <div class="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2.5"><span class="truncate text-brand-200">webcal://sheensy.com/ical/salon-marie-7f3k9q2m.ics</span><span class="ml-auto font-sans text-xs bg-white text-slate-900 rounded-md px-2 py-1 font-semibold">Copier</span></div>
      <p class="text-slate-400 text-xs mt-4 font-sans">Mis à jour automatiquement toutes les 15 minutes</p>
    </div>
  </div>
</section>

<section class="bg-slate-50 border-y border-slate-100">
  <div class="max-w-7xl mx-auto px-5 sm:px-8 py-20 grid md:grid-cols-3 gap-6">
    <figure class="bg-white rounded-2xl border border-slate-200 p-7"><p class="text-amber-400">★★★★★</p><blockquote class="mt-3 text-slate-700 leading-relaxed">« Mes clientes réservent le soir depuis leur canapé. Je ne passe plus mes journées au téléphone entre deux coupes. »</blockquote><figcaption class="mt-5 text-sm"><span class="font-semibold text-slate-900">Marie Lefèvre</span><span class="text-slate-500"> · Salon Marie, Paris 11e</span></figcaption></figure>
    <figure class="bg-white rounded-2xl border border-slate-200 p-7"><p class="text-amber-400">★★★★★</p><blockquote class="mt-3 text-slate-700 leading-relaxed">« Les rappels de la veille ont presque supprimé les rendez-vous manqués. L'abonnement s'est remboursé dès le premier mois. »</blockquote><figcaption class="mt-5 text-sm"><span class="font-semibold text-slate-900">Karim Haddad</span><span class="text-slate-500"> · Barber Oberkampf</span></figcaption></figure>
    <figure class="bg-white rounded-2xl border border-slate-200 p-7"><p class="text-amber-400">★★★★★</p><blockquote class="mt-3 text-slate-700 leading-relaxed">« Tout est dans le calendrier de mon iPhone, à côté de mes rendez-vous perso. C'est exactement ce que je cherchais. »</blockquote><figcaption class="mt-5 text-sm"><span class="font-semibold text-slate-900">Sophie Garnier</span><span class="text-slate-500"> · Institut Rose Thé, Lyon</span></figcaption></figure>
  </div>
</section>

<section id="tarifs" class="scroll-mt-16 max-w-7xl mx-auto px-5 sm:px-8 py-24">
  <div class="text-center max-w-2xl mx-auto">
    <p class="text-sm font-semibold text-brand-600 uppercase tracking-wider">Tarifs</p>
    <h2 class="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Des prix simples, sans commission</h2>
    <p class="mt-4 text-lg text-slate-600">14 jours d'essai gratuit sur toutes les offres. Résiliable à tout moment.</p>
  </div>
  <div class="mt-16 grid lg:grid-cols-3 gap-6 items-center max-w-6xl mx-auto">""" + plans + """</div>
  <p class="text-center text-sm text-slate-500 mt-10">Prix hors taxes. Aucun frais par réservation, aucun frais de mise en service.</p>
</section>

<section class="max-w-7xl mx-auto px-5 sm:px-8 pb-24">
  <div class="grad rounded-3xl px-8 py-14 sm:px-14 text-center text-white">
    <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">Prêt à remplir votre agenda ?</h2>
    <p class="mt-4 text-brand-100 text-lg">Créez votre page de réservation en 10 minutes.</p>
    <a href="planning.html" class="mt-8 inline-flex items-center px-7 h-12 rounded-xl bg-white text-brand-700 font-semibold hover:bg-brand-50">Essayer gratuitement</a>
  </div>
</section>

<footer class="border-t border-slate-200 bg-slate-50">
  <div class="max-w-7xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
    <div class="col-span-2">""" + LOGO + """<p class="mt-4 text-slate-500 max-w-xs">Le logiciel de prise de rendez-vous en ligne pour les professionnels de la beauté et du bien-être.</p></div>
    <div><p class="font-semibold text-slate-900">Produit</p><ul class="mt-3 space-y-2 text-slate-600"><li><a href="#fonctionnalites" class="hover:text-slate-900">Fonctionnalités</a></li><li><a href="#tarifs" class="hover:text-slate-900">Tarifs</a></li><li><a href="reservation.html" class="hover:text-slate-900">Démo de réservation</a></li></ul></div>
    <div><p class="font-semibold text-slate-900">Ressources</p><ul class="mt-3 space-y-2 text-slate-600"><li><a href="#" class="hover:text-slate-900">Centre d'aide</a></li><li><a href="#" class="hover:text-slate-900">Synchroniser son iPhone</a></li><li><a href="#" class="hover:text-slate-900">Nous contacter</a></li></ul></div>
    <div><p class="font-semibold text-slate-900">Légal</p><ul class="mt-3 space-y-2 text-slate-600"><li><a href="#" class="hover:text-slate-900">Mentions légales</a></li><li><a href="#" class="hover:text-slate-900">CGU</a></li><li><a href="#" class="hover:text-slate-900">Confidentialité (RGPD)</a></li></ul></div>
  </div>
  <div class="border-t border-slate-200"><div class="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row gap-2 justify-between text-xs text-slate-500"><p>© 2026 Sheensy. Tous droits réservés.</p><p>Conçu en France · Données hébergées en Europe</p></div></div>
</footer>
</body></html>"""
open("/workspace/maquette/index.html","w").write(html)
