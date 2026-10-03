import json, subprocess, time, requests, websocket, shutil, pathlib, sys, os, glob as _glob
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from browser_runtime import resolve_chromium, page_ws_url
ROOT = pathlib.Path(__file__).resolve().parents[1]
prof = '/tmp/chrome-prof-taroke-user-notes'
shutil.rmtree(prof, ignore_errors=True)
CHROME = resolve_chromium()
cmd = [CHROME,'--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-extensions','--disable-background-networking','--no-first-run','--no-default-browser-check',f'--user-data-dir={prof}','--remote-debugging-port=9254','--remote-allow-origins=*','about:blank']
chrome = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
passed=0; failed=0; rows=[]
def rec(name, ok, msg=''):
    global passed, failed
    if ok: passed+=1; rows.append(('PASS',name,''))
    else: failed+=1; rows.append(('FAIL',name,msg))
try:
    for _ in range(60):
        try:
            requests.get('http://127.0.0.1:9254/json/version', timeout=.2); break
        except Exception: time.sleep(.2)
    else: raise RuntimeError('Chrome DevTools did not start')
    wsurl=page_ws_url(9254)
    ws=websocket.create_connection(wsurl, timeout=10); cid=0
    def send(method, params=None):
        global cid
        cid+=1; ws.send(json.dumps({'id':cid,'method':method,'params':params or {}}))
        while True:
            msg=json.loads(ws.recv())
            if msg.get('id')==cid: return msg
    def ev(expr):
        res=send('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':True})
        if 'exceptionDetails' in res.get('result',{}): raise RuntimeError(res['result']['exceptionDetails'].get('text','JS exception'))
        return res.get('result',{}).get('result',{}).get('value')
    send('Runtime.enable'); send('Page.enable')
    html='<!doctype html><html><head><meta charset="utf-8"></head><body><div id="app"></div></body></html>'
    ev('document.open();document.write('+json.dumps(html)+');document.close();')
    ev((ROOT/'src/core.js').read_text()+'\n//# sourceURL=core.js')
    ev((ROOT/'src/app.js').read_text()+'\n//# sourceURL=app.js')
    time.sleep(.3)

    ev('document.querySelector(`[data-step="samples"]`).click()')
    ev('document.querySelector(`[data-add-bank]`).click()')
    ev('let bl=document.querySelector(`[data-bank-label]`); bl.value="GHOSTS"; bl.dispatchEvent(new Event("input",{bubbles:true}));')
    rec('sample bank can be created and relabelled', bool(ev('Object.values(TarokeDebug.project().materials.bankMeta).some(x=>x.label==="GHOSTS")')))
    ev('document.querySelector(`[data-add-token]`).click()')
    ev('let lit=document.querySelector(`[data-token-lit]`); lit.value="ghost"; lit.dispatchEvent(new Event("input",{bubbles:true}));')
    ev('let wt=document.querySelector(`[data-token-weight]`); wt.value=5; wt.dispatchEvent(new Event("change",{bubbles:true}));')
    rec('sample weight editable', bool(ev('TarokeDebug.project().materials.trays[TarokeDebug.ui().tray].some(t=>t.literal==="ghost" && t.weight===5)')))
    ev('document.querySelector(`[data-duplicate-token]`).click()')
    rec('sample duplicate creates repeated sample', bool(ev('TarokeDebug.project().materials.trays[TarokeDebug.ui().tray].filter(t=>t.literal==="ghost").length===2')))

    rec('weighted selection favors weighted token deterministically', bool(ev('(()=>{let p=TarokeCore.defaultProject(); p.materials.trays.above=[{id:"a",literal:"low",role:"noun",weight:0},{id:"b",literal:"high",role:"noun",weight:9}]; p.lineDevices=[{id:"d",name:"D",enabled:true,inputs:[{slot:"x",tray:"above",role:"noun"}],routes:[{id:"r",name:"R",weight:1,template:"{x:literal}"}]}]; p.stanzaPatterns=[{id:"s",name:"S",enabled:true,slots:[{id:"sl",type:"device",deviceId:"d",chance:100}]}]; p.flowScenes=[{id:"f",name:"F",stanzaId:"s",enabled:true,chance:100}]; let st={tick:0,queue:[]}; return TarokeCore.generateEvent(p,st,()=>0.5).surface==="high";})()')))

    ev('document.querySelector(`[data-step="stanza"]`).click()')
    ev('document.querySelector(`[data-add-stanza]`).click()')
    ev('let sn=document.querySelector(`[data-stanza-name]`); sn.value="BROKEN STANZA"; sn.dispatchEvent(new Event("input",{bubbles:true}));')
    rec('stanza pattern can be created and named', bool(ev('TarokeDebug.project().stanzaPatterns.some(s=>s.name==="BROKEN STANZA")')))
    ev('document.querySelector(`[data-step="flow"]`).click()')
    ev('document.querySelector(`[data-add-scene]`).click()')
    ev('document.querySelectorAll(`[data-select-open]`)[0].click()')
    ev('let opt=[...document.querySelectorAll(`[data-select-key^="scene-stanza"]`)].find(o=>o.innerText.includes("BROKEN STANZA")); if(opt) opt.click();')
    rec('flow can select newly created stanza', bool(ev('TarokeDebug.project().flowScenes.some(sc=>TarokeDebug.project().stanzaPatterns.find(st=>st.id===sc.stanzaId)?.name==="BROKEN STANZA")')))

    ev('document.querySelector(`[data-step="triggers"]`).click()')
    ev('document.querySelector(`[data-add-trigger]`).click()')
    ev('document.querySelectorAll(`[data-select-open]`)[1].click()')
    ev('let so=[...document.querySelectorAll(`[data-select-key^="trig-sample"]`)].find(o=>o.innerText.trim()==="grave"); if(so) so.click();')
    rec('trigger sample dropdown writes term', bool(ev('TarokeDebug.project().triggers.some(t=>t.condition.term==="grave")')))

    ev('document.querySelector(`[data-step="surface"]`).click()')
    rec('surface cards are intentionally removed', bool(ev('document.querySelectorAll(`[data-surface-family-card], [data-surface-palette-card]`).length===0')))
    rec('surface preview has no line numbers', bool(ev('document.querySelectorAll(`.surfacePreview .tick`).length===0')))

    ev('document.querySelector(`[data-step="run"]`).click(); document.querySelector(`[data-run]`).click();')
    time.sleep(.25)
    ev('document.querySelector(`[data-pause]`)?.click(); document.querySelector(`[data-event]`)?.click();')
    ev('document.querySelector(`[data-note^="repair"]`)?.click();')
    rec('line notes are enabled through selected run event', bool(ev('TarokeDebug.project().notes.length>=1')))
finally:
    try: chrome.kill()
    except Exception: pass
print(f'{passed} passed, {failed} failed')
for r in rows: print(' | '.join(r))
if failed: sys.exit(1)
