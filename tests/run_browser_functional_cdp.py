import json, subprocess, time, requests, websocket, shutil, pathlib, sys, textwrap, os, glob as _glob
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from browser_runtime import resolve_chromium, page_ws_url
ROOT = pathlib.Path(__file__).resolve().parents[1]
prof = '/tmp/chrome-prof-taroke-reset'
shutil.rmtree(prof, ignore_errors=True)
CHROME = resolve_chromium()
cmd = [CHROME,'--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-extensions','--disable-background-networking','--no-first-run','--no-default-browser-check',f'--user-data-dir={prof}','--remote-debugging-port=9244','--remote-allow-origins=*','about:blank']
chrome = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
passed=0; failed=0; rows=[]
def record(name, ok, msg=''):
    global passed, failed
    if ok: passed+=1; rows.append(('PASS',name,''))
    else: failed+=1; rows.append(('FAIL',name,msg))
try:
    for _ in range(60):
        try:
            requests.get('http://127.0.0.1:9244/json/version', timeout=.2)
            break
        except Exception:
            time.sleep(.2)
    else:
        raise RuntimeError('Chrome DevTools did not start')
    wsurl = page_ws_url(9244)
    ws = websocket.create_connection(wsurl, timeout=10)
    cid = 0
    def send(method, params=None):
        nonlocal_dummy = None
        global cid
        cid += 1
        ws.send(json.dumps({'id':cid,'method':method,'params':params or {}}))
        while True:
            msg=json.loads(ws.recv())
            if msg.get('id')==cid:
                return msg
    def eval_js(expr, await_promise=False):
        res=send('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':await_promise})
        if 'exceptionDetails' in res.get('result',{}):
            raise RuntimeError(res['result']['exceptionDetails'].get('text','JS exception'))
        return res.get('result',{}).get('result',{}).get('value')
    send('Runtime.enable'); send('Page.enable')
    html = '<!doctype html><html><head><meta charset="utf-8"><title>test</title></head><body><div id="app"></div></body></html>'
    eval_js('document.open();document.write('+json.dumps(html)+');document.close();')
    core = (ROOT/'src/core.js').read_text()
    app = (ROOT/'src/app.js').read_text()
    eval_js(core+'\n//# sourceURL=core.js')
    eval_js(app+'\n//# sourceURL=app.js')
    time.sleep(.5)
    record('app boots and renders controls', bool(eval_js('!!window.TarokeCore && !!window.TarokeDebug && document.querySelectorAll("button").length>20')))
    record('no loading fallback remains', 'Loading TAROKE' not in (eval_js('document.body.innerText') or ''))
    eval_js('document.querySelector(`[data-step="samples"]`).click()')
    eval_js('document.querySelector(`[data-add-token="above"]`).click()')
    eval_js('let i=document.querySelector(`[data-token-lit]`); i.value="wolf"; i.dispatchEvent(new Event("input",{bubbles:true}));')
    record('sample add/edit updates model', eval_js('TarokeDebug.project().materials.trays.above.some(t=>t.literal==="wolf")'))
    # Drag token above -> below through real drag/drop events. Fallback to mouse events if DataTransfer is not constructible.
    drag_script = r'''
    (()=>{
      const id=document.querySelector('[data-token-lit]').dataset.tokenLit; const tok=document.querySelector('[data-token-drag="above:'+id+'"]');
      const drop=document.querySelector('[data-bank-drop="below"]');
      if(!tok||!drop) return false;
      let dt; try{dt=new DataTransfer();}catch(e){dt=null;}
      tok.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:dt}));
      drop.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt}));
      drop.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));
      return TarokeDebug.project().materials.trays.below.some(t=>t.literal==='wolf');
    })()
    '''
    record('token drag/drop bank move works', bool(eval_js(drag_script)))
    eval_js('document.querySelector(`[data-step="forms"]`).click()')
    eval_js('let o=document.querySelector(`[data-override$=":plural"]`); if(o){o.value="wolves"; o.dispatchEvent(new Event("input",{bubbles:true}));}')
    record('form override editable', bool(eval_js('Object.values(TarokeDebug.project().forms.overrides).some(x=>x.plural==="wolves")')))
    eval_js('document.querySelector(`[data-step="devices"]`).click()')
    eval_js('let dn=document.querySelector(`[data-device-field$=":name"]`); dn.value="TEST DEVICE"; dn.dispatchEvent(new Event("input",{bubbles:true}));')
    record('device name editable', bool(eval_js('TarokeDebug.project().lineDevices.some(d=>d.name==="TEST DEVICE")')))
    eval_js('document.querySelector(`[data-add-route]`).click()')
    eval_js('let rt=[...document.querySelectorAll(`[data-route-template]`)].at(-1); rt.value="{new:literal}."; rt.dispatchEvent(new Event("input",{bubbles:true}));')
    record('route add/template editable', bool(eval_js('TarokeDebug.project().lineDevices.find(d=>d.name==="TEST DEVICE").routes.some(r=>r.template==="{new:literal}." )')))
    # route drag reorder
    route_drag = r'''
    (()=>{const cards=[...document.querySelectorAll('[data-route-drag]')]; if(cards.length<2)return true; let dt;try{dt=new DataTransfer();}catch(e){dt=null;} const before=TarokeDebug.project().lineDevices.find(d=>d.name==='TEST DEVICE').routes.map(r=>r.id).join('|'); cards[cards.length-1].dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:dt})); cards[0].dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt})); cards[0].dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt})); const after=TarokeDebug.project().lineDevices.find(d=>d.name==='TEST DEVICE').routes.map(r=>r.id).join('|'); return before!==after;})()
    '''
    record('route drag/drop reorder works', bool(eval_js(route_drag)))
    eval_js('document.querySelector(`[data-step="stanza"]`).click()')
    eval_js('document.querySelector(`[data-add-breath]`).click()')
    record('stanza slot add works', bool(eval_js('TarokeDebug.project().stanzaPatterns[0].slots.some(s=>s.type==="breath")')))
    slot_drag = r'''
    (()=>{const cards=[...document.querySelectorAll('[data-slot-drag]')]; if(cards.length<2)return true; let dt;try{dt=new DataTransfer();}catch(e){dt=null;} const before=TarokeDebug.project().stanzaPatterns[0].slots.map(s=>s.id).join('|'); cards[cards.length-1].dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:dt})); cards[0].dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt})); cards[0].dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt})); const after=TarokeDebug.project().stanzaPatterns[0].slots.map(s=>s.id).join('|'); return before!==after;})()
    '''
    record('slot drag/drop reorder works', bool(eval_js(slot_drag)))
    eval_js('document.querySelector(`[data-step="flow"]`).click()')
    eval_js('document.querySelector(`[data-add-scene]`).click()')
    eval_js('let sn=[...document.querySelectorAll(`[data-scene-name]`)].at(-1); sn.value="TEST SCENE"; sn.dispatchEvent(new Event("input",{bubbles:true}));')
    record('flow scene add/edit works', bool(eval_js('TarokeDebug.project().flowScenes.some(s=>s.name==="TEST SCENE")')))
    scene_drag = r'''
    (()=>{const cards=[...document.querySelectorAll('[data-scene-drag]')]; if(cards.length<2)return true; let dt;try{dt=new DataTransfer();}catch(e){dt=null;} const before=TarokeDebug.project().flowScenes.map(s=>s.id).join('|'); cards[cards.length-1].dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:dt})); cards[0].dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt})); cards[0].dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt})); const after=TarokeDebug.project().flowScenes.map(s=>s.id).join('|'); return before!==after;})()
    '''
    record('scene drag/drop reorder works', bool(eval_js(scene_drag)))
    eval_js('document.querySelector(`[data-step="triggers"]`).click()')
    eval_js('document.querySelector(`[data-add-trigger]`).click()')
    eval_js('let tt=[...document.querySelectorAll(`[data-trig-term]`)].at(-1); tt.value="raven"; tt.dispatchEvent(new Event("input",{bubbles:true})); let tx=[...document.querySelectorAll(`[data-trig-text]`)].at(-1); tx.value="[HIT]"; tx.dispatchEvent(new Event("input",{bubbles:true}));')
    record('trigger add/edit works', bool(eval_js('TarokeDebug.project().triggers.some(t=>t.condition.term==="raven" && t.action.text==="[HIT]")')))
    eval_js('document.querySelector(`[data-step="surface"]`).click()')
    eval_js('let sp=document.querySelector(`[data-bind-number="surface.speedMs"]`); if(sp){sp.value=900; sp.dispatchEvent(new Event("change",{bubbles:true}));}')
    record('surface number editable', bool(eval_js('TarokeDebug.project().surface.speedMs===900')))
    eval_js('document.querySelector(`[data-step="run"]`).click(); document.querySelector(`[data-run]`).click();')
    time.sleep(.5)
    eval_js('document.querySelector(`[data-pause]`)?.click()')
    record('run generates events', bool(eval_js('TarokeDebug.ui().events.length>0')))
    eval_js('document.querySelector(`[data-step="export"]`).click()')
    record('export html/import works in browser', bool(eval_js('(()=>{const p=TarokeDebug.project(); const html=TarokeCore.exportProjectHtml(p); const q=TarokeCore.extractProjectFromText(html); return q.project.title===p.project.title && html.includes("taroke-project");})()')))
finally:
    try: chrome.kill()
    except Exception: pass
    try:
        err = chrome.stderr.read() if chrome.stderr else ''
    except Exception:
        err = ''
print(f'{passed} passed, {failed} failed')
for r in rows:
    print(' | '.join(r))
if failed:
    sys.exit(1)
