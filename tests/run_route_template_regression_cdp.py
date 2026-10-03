import json, subprocess, time, requests, websocket, shutil, pathlib, sys, os
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from browser_runtime import resolve_chromium, page_ws_url
ROOT = pathlib.Path(__file__).resolve().parents[1]
prof = '/tmp/chrome-prof-taroke-route-pass'
shutil.rmtree(prof, ignore_errors=True)
CHROME = resolve_chromium()
cmd = [CHROME,'--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-extensions','--disable-background-networking','--no-first-run','--no-default-browser-check',f'--user-data-dir={prof}','--remote-debugging-port=9255','--remote-allow-origins=*','about:blank']
chrome = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
passed=0; failed=0; rows=[]
def rec(name, ok, msg=''):
    global passed, failed
    if ok: passed+=1; rows.append(('PASS',name,''))
    else: failed+=1; rows.append(('FAIL',name,msg))
try:
    for _ in range(60):
        try:
            requests.get('http://127.0.0.1:9255/json/version', timeout=.2); break
        except Exception: time.sleep(.2)
    else: raise RuntimeError('Chrome DevTools did not start')
    wsurl=page_ws_url(9255)
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
    time.sleep(.25)

    ev('document.querySelector(`[data-step="devices"]`).click()')
    rec('device route template uses textarea', bool(ev('!!document.querySelector(`textarea[data-route-template]`)')))
    rec('slot insertion chips are visible', bool(ev('document.querySelectorAll(`[data-insert-value]`).length > 0')))
    ev('let ta=document.querySelector(`textarea[data-route-template]`); ta.value="STATIC "; ta.focus(); ta.setSelectionRange(7,7); ta.dispatchEvent(new Event("input",{bubbles:true}));')
    ev('document.querySelector(`[data-insert-value]`).click()')
    rec('clicking slot chip inserts variable into active template', bool(ev('TarokeDebug.project().lineDevices[0].routes[0].template.startsWith("STATIC {")')))
    ev('document.querySelector(`[data-route-down]`).click()')
    rec('route move buttons reorder route lanes', bool(ev('TarokeDebug.project().lineDevices[0].routes[1].template.startsWith("STATIC {")')))
    rec('unknown/missing slot cleanup removes doubled punctuation', bool(ev('(()=>{let p=TarokeCore.defaultProject(); p.materials.trays.above=[{id:"a",literal:"piece",role:"noun",weight:1}]; p.lineDevices=[{id:"d",name:"D",enabled:true,inputs:[{slot:"1",tray:"above",role:"noun"}],routes:[{id:"r",name:"R",weight:1,template:"{1:literal}, {2:literal}, maybe"}]}]; p.stanzaPatterns=[{id:"s",name:"S",enabled:true,slots:[{id:"sl",type:"device",deviceId:"d",chance:100}]}]; p.flowScenes=[{id:"f",name:"F",stanzaId:"s",enabled:true,chance:100}]; let e=TarokeCore.generateEvent(p,{tick:0,queue:[]},()=>0.1); return e.surface==="piece, maybe" && !e.surface.includes(",,");})()')))
finally:
    try: chrome.kill()
    except Exception: pass
print(f'{passed} passed, {failed} failed')
for r in rows: print(' | '.join(r))
if failed: sys.exit(1)
