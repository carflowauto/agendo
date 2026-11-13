import sys
from playwright.sync_api import sync_playwright
B="file:///workspace/maquette/"; O="/workspace/maquette/captures/"
def resa(p):
    p.click('#services button[data-i="0"]'); p.wait_for_timeout(300)
    p.click('#week button[data-t="14:30"] >> nth=0'); p.wait_for_timeout(200)
    p.fill('#f-name','Camille Durand'); p.fill('#f-phone','06 12 34 56 78'); p.fill('#f-email','camille.durand@gmail.com')
    p.evaluate("window.scrollTo(0,0)")
jobs=[("index",1440,"index.html",None),("reservation",1440,"reservation.html",resa),("planning",1440,"planning.html",None),
      ("synchronisation",1440,"synchronisation.html",None),("prestations",1440,"prestations.html",None),
      ("rendez-vous",1440,"rendez-vous.html",None),("clients",1440,"clients.html",None),("horaires",1440,"horaires.html",None),("parametres",1440,"parametres.html",None),
      ("confirmation",390,"confirmation.html?s=Coupe+femme&dur=45&p=45&t=14%3A30&y=2026&m=10&d=17&n=Camille+Durand&e=camille.durand%40gmail.com&st=Marie",None),
      ("reservation-mobile",390,"reservation.html",resa)]
only=sys.argv[1:]
with sync_playwright() as pw:
    br=pw.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    for name,w,url,fn in jobs:
        if only and name not in only: continue
        ctx=br.new_context(viewport={"width":w,"height":900 if w>500 else 844},device_scale_factor=1 if w>500 else 2,locale="fr-FR")
        p=ctx.new_page(); p.goto(B+url,wait_until="networkidle"); p.wait_for_timeout(600)
        if fn: fn(p); p.wait_for_timeout(300)
        h=p.evaluate("document.documentElement.scrollHeight"); p.set_viewport_size({"width":w,"height":h}); p.wait_for_timeout(300)
        p.screenshot(path=O+name+".png",full_page=True); ctx.close(); print("ok",name)
    br.close()
