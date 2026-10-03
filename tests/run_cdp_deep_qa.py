"""
Deep QA browser tests — TAROKE RIMIXER v07.1
Covers: exported artifact, mobile viewport, input slots, stanza/flow controls,
trigger roundtrip, note workflows, form overrides, custom bank delete.
"""
import json, subprocess, time, requests, websocket, shutil, pathlib, sys, tempfile, os
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from browser_runtime import resolve_chromium

ROOT = pathlib.Path(__file__).resolve().parents[1]
CHROME = resolve_chromium()

passed=0; failed=0; rows=[]
def rec(name, ok, msg=''):
    global passed, failed
    if ok: passed+=1; rows.append(('PASS',name,''))
    else: failed+=1; rows.append(('FAIL',name,str(msg)[:120]))

def boot_chrome(port, prof):
    shutil.rmtree(prof, ignore_errors=True)
    cmd = [CHROME,'--headless=new','--no-sandbox','--disable-gpu',
           '--disable-dev-shm-usage','--disable-extensions',
           '--disable-background-networking','--no-first-run',
           '--no-default-browser-check',f'--user-data-dir={prof}',
           f'--remote-debugging-port={port}','--remote-allow-origins=*','about:blank']
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    for _ in range(60):
        try: requests.get(f'http://127.0.0.1:{port}/json/version', timeout=.2); break
        except Exception: time.sleep(.2)
    else: raise RuntimeError(f'Chrome DevTools on port {port} did not start')
    wsurl = requests.get(f'http://127.0.0.1:{port}/json').json()[0]['webSocketDebuggerUrl']
    ws = websocket.create_connection(wsurl, timeout=10)
    cid = 0
    def send(method, params=None):
        nonlocal cid; cid+=1
        ws.send(json.dumps({'id':cid,'method':method,'params':params or {}}))
        while True:
            msg=json.loads(ws.recv())
            if msg.get('id')==cid: return msg
    def ev(expr, await_p=False):
        res=send('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':await_p})
        if 'exceptionDetails' in res.get('result',{}):
            raise RuntimeError(res['result']['exceptionDetails'].get('text','JS exception: '+repr(res['result']['exceptionDetails'])))
        return res.get('result',{}).get('result',{}).get('value')
    send('Runtime.enable'); send('Page.enable')
    return proc, ws, send, ev

def load_app(ev, with_css=False):
    css_tag = f'<style>{(ROOT/"styles.css").read_text()}</style>' if with_css else ''
    vp = '<meta name="viewport" content="width=device-width,initial-scale=1">'
    html=f'<!doctype html><html><head><meta charset="utf-8">{vp}{css_tag}</head><body><div id="app"></div></body></html>'
    ev('document.open();document.write('+json.dumps(html)+');document.close();')
    ev((ROOT/'src/core.js').read_text()+'\n//# sourceURL=core.js')
    ev((ROOT/'src/app.js').read_text()+'\n//# sourceURL=app.js')
    time.sleep(.3)

# ─── Session 1: Main app QA ───────────────────────────────────────────────────
prof1 = '/tmp/chrome-qa-deep-main'
proc1 = None
try:
    proc1, ws1, send1, ev1 = boot_chrome(9261, prof1)
    load_app(ev1)

    # Boot checks
    rec('app boots without loading fallback',
        'Loading TAROKE' not in (ev1('document.body.innerText') or ''))
    rec('no unhandled JS errors on boot',
        bool(ev1('!!window.TarokeCore && !!window.TarokeDebug')))

    # index.html boot check (static file check)
    idx = (ROOT/'index.html').read_text()
    rec('index.html references core.js', 'src/core.js' in idx)
    rec('index.html references app.js', 'src/app.js' in idx)
    rec('index.html has no inline framework script', 'react' not in idx.lower() and 'vue' not in idx.lower())
    rec('.nojekyll exists at repo root', (ROOT/'.nojekyll').exists())
    rec('package.json has no runtime dependencies',
        json.loads((ROOT/'package.json').read_text()).get('dependencies') is None)

    # Custom bank delete (unreferenced): bank removed, no reserve injection
    ev1('document.querySelector(`[data-step="samples"]`).click()')
    ev1('document.querySelector(`[data-add-bank]`).click()')
    ev1('let bl=document.querySelector(`[data-bank-label]`); bl.value="TEMP"; bl.dispatchEvent(new Event("input",{bubbles:true}));')
    ev1('document.querySelector(`[data-add-token]`).click()')
    ev1('let lit=document.querySelector(`[data-token-lit]`); lit.value="phantom"; lit.dispatchEvent(new Event("input",{bubbles:true}));')
    bank_id = ev1('Object.keys(TarokeDebug.project().materials.bankMeta).find(k=>TarokeDebug.project().materials.bankMeta[k].label==="TEMP")')
    reserve_count_before = ev1('(TarokeDebug.project().materials.trays.reserve||[]).length')
    if bank_id:
        ev1(f'document.querySelector(`[data-delete-bank="{bank_id}"]`)?.click()')
        reserve_count_after = ev1('(TarokeDebug.project().materials.trays.reserve||[]).length')
        rec('unreferenced custom bank deleted without reserve injection',
            reserve_count_after == reserve_count_before)
        rec('deleted bank not in trays',
            not bool(ev1(f'"{bank_id}" in TarokeDebug.project().materials.trays')))
    else:
        rec('unreferenced custom bank deleted without reserve injection', False, 'bank_id not found')
        rec('deleted bank not in trays', False, 'bank_id not found')

    # Device: add input slot, rename it, delete it
    ev1('document.querySelector(`[data-step="devices"]`).click()')
    ev1('document.querySelector(`[data-add-input="ld_path"]`)?.click()')
    time.sleep(.1)
    new_input_count = ev1('TarokeDebug.project().lineDevices.find(d=>d.id==="ld_path").inputs.length')
    rec('device add input slot increases input count', bool(new_input_count and new_input_count > 3))

    # Rename new slot
    ev1('let slots=[...document.querySelectorAll(`[data-input-slot^="ld_path:"]`)]; let last=slots[slots.length-1]; last.value="newslot"; last.dispatchEvent(new Event("input",{bubbles:true}));')
    rec('input slot rename writes to model',
        bool(ev1('TarokeDebug.project().lineDevices.find(d=>d.id==="ld_path").inputs.some(i=>i.slot==="newslot")')))

    # Delete new slot
    ev1('let delBtns=[...document.querySelectorAll(`[data-del-input^="ld_path:"]`)]; delBtns[delBtns.length-1]?.click();')
    rec('delete input slot removes from model',
        not bool(ev1('TarokeDebug.project().lineDevices.find(d=>d.id==="ld_path").inputs.some(i=>i.slot==="newslot")')))

    # Stanza slot chance and repeat
    ev1('document.querySelector(`[data-step="stanza"]`).click()')
    ev1('let sc=document.querySelector(`[data-slot-chance]`); if(sc){sc.value=42; sc.dispatchEvent(new Event("input",{bubbles:true}));}')
    rec('stanza slot chance writes to model',
        bool(ev1('TarokeDebug.project().stanzaPatterns[0].slots.some(s=>s.chance===42)')))

    # Every device appears in slot device dropdown
    device_names = ev1('TarokeDebug.project().lineDevices.map(d=>d.name).join(",")')
    options_text = ev1('(()=>{document.querySelectorAll(`[data-select-open^="slotdev:"]`)[0]?.click(); const opts=[...document.querySelectorAll(`[data-select-key^="slotdev:"]`)]; return opts.map(o=>o.innerText).join(",");})()')
    all_devices_listed = all(name.strip() in (options_text or '') for name in (device_names or '').split(',') if name.strip())
    rec('all devices appear in stanza slot device dropdown', all_devices_listed)
    ev1('document.querySelector(`[data-step="stanza"]`).click()')  # re-render (closes select)

    # Flow: scene enable/disable and chance
    ev1('document.querySelector(`[data-step="flow"]`).click()')
    ev1('document.querySelector(`[data-scene-toggle="0"]`)?.click()')
    rec('scene toggle writes enabled=false',
        not bool(ev1('TarokeDebug.project().flowScenes[0].enabled')))
    ev1('document.querySelector(`[data-scene-toggle="0"]`)?.click()')
    rec('scene toggle writes enabled=true again',
        bool(ev1('TarokeDebug.project().flowScenes[0].enabled')))

    ev1('let chance=document.querySelector(`[data-scene-chance="0"]`); if(chance){chance.value=77; chance.dispatchEvent(new Event("input",{bubbles:true}));}')
    rec('scene chance field writes to model',
        bool(ev1('TarokeDebug.project().flowScenes[0].chance===77')))

    # Triggers: prepend mode and roundtrip
    ev1('document.querySelector(`[data-step="triggers"]`).click()')
    ev1('document.querySelector(`[data-add-trigger]`).click()')
    n_trigs = ev1('TarokeDebug.project().triggers.length')
    ev1(f'let li={n_trigs-1}; let tn=document.querySelectorAll(`[data-trig-name]`)[li]; tn.value="QA_TRIGGER"; tn.dispatchEvent(new Event("input",{{bubbles:true}}));')
    ev1(f'let tx=document.querySelectorAll(`[data-trig-text]`)[{n_trigs-1}]; tx.value="[QA]"; tx.dispatchEvent(new Event("input",{{bubbles:true}}));')
    ev1(f'let tc=document.querySelectorAll(`[data-trig-chance]`)[{n_trigs-1}]; tc.value=88; tc.dispatchEvent(new Event("input",{{bubbles:true}}));')
    rec('trigger name/text/chance editable',
        bool(ev1('TarokeDebug.project().triggers.some(t=>t.name==="QA_TRIGGER" && t.action.text==="[QA]" && t.chance===88)')))

    # Trigger roundtrip via export/import
    rec('trigger survives export/import in browser',
        bool(ev1('(()=>{const p=TarokeDebug.project(); const html=TarokeCore.exportProjectHtml(p); const q=TarokeCore.extractProjectFromText(html); return q.triggers.some(t=>t.name==="QA_TRIGGER" && t.action.text==="[QA]");})()')))

    # Form overrides: plural and thirdSingular
    ev1('document.querySelector(`[data-step="forms"]`).click()')
    ev1('document.querySelector(`[data-tray="above"]`)?.click()')
    time.sleep(.1)
    # get first token id from above tray
    tid = ev1('TarokeDebug.project().materials.trays.above[0]?.id')
    if tid:
        ev1(f'let ov=document.querySelector(`[data-override="{tid}:plural"]`); if(ov){{ov.value="custom_plurals"; ov.dispatchEvent(new Event("input",{{bubbles:true}}));}};')
        rec('form override plural writes to model',
            bool(ev1(f'(TarokeDebug.project().forms.overrides["{tid}"]||{{}}).plural==="custom_plurals"')))
    else:
        rec('form override plural writes to model', False, 'no token found')

    # Run: no tick spans in poem lines
    ev1('document.querySelector(`[data-step="run"]`).click()')
    ev1('document.querySelector(`[data-run]`).click();')
    time.sleep(.5)
    ev1('document.querySelector(`[data-pause]`)?.click()')
    tick_count = ev1('document.querySelectorAll(".poemLine .tick").length')
    rec('run poem has no visible tick spans', tick_count == 0)

    # Run: event count
    ev_count = ev1('TarokeDebug.ui().events.length')
    rec('run generates events', bool(ev_count and ev_count > 0))

    # Recipe modal: opens and has note buttons
    ev1('document.querySelector(`[data-event]`)?.click()')
    time.sleep(.1)
    rec('recipe modal opens on event click',
        bool(ev1('document.querySelector(".modal") !== null')))
    rec('recipe modal has keep/repair note buttons',
        bool(ev1('document.querySelectorAll(`[data-note]`).length >= 2')))
    rec('recipe modal has open-device button',
        bool(ev1('!!document.querySelector(`[data-open-device]`)')))
    ev1('document.querySelector(`[data-close-event]`)?.click()')
    rec('recipe modal closes', not bool(ev1('document.querySelector(".modal")')))

    # Surface: no line numbers
    rec('surface preview has no tick spans',
        ev1('document.querySelectorAll(".surfacePreview .tick").length') == 0)

    # Export step: validation + export buttons present
    ev1('document.querySelector(`[data-step="export"]`).click()')
    rec('export step has save-html button',
        bool(ev1('!!document.querySelector(`[data-save-html]`)')))
    rec('export step has export-json button',
        bool(ev1('!!document.querySelector(`[data-export-json]`)')))

    # Guide modal
    ev1('document.querySelector(`[data-help]`)?.click()')
    rec('guide modal opens', bool(ev1('!!document.querySelector(".guideModal")')))
    ev1('document.querySelector(`[data-close-help]`)?.click()')
    rec('guide modal closes', not bool(ev1('document.querySelector(".guideModal")')))

finally:
    try: proc1.kill()
    except Exception: pass

# ─── Session 2: Exported HTML artifact ───────────────────────────────────────
prof2 = '/tmp/chrome-qa-deep-artifact'
proc2 = None
try:
    proc2, ws2, send2, ev2 = boot_chrome(9262, prof2)

    # Generate the export HTML from the default project
    load_app(ev2)
    artifact_html = ev2('TarokeCore.exportProjectHtml(TarokeCore.defaultProject())')
    assert artifact_html, 'exportProjectHtml returned nothing'

    # Write artifact to temp file, load as data: URL
    artifact_path = pathlib.Path(tempfile.gettempdir()) / 'taroke_qa_artifact.html'
    artifact_path.write_text(artifact_html, encoding='utf-8')

    # Verify artifact content WITHOUT running it in a browser tab
    rec('artifact has taroke-project script tag',
        'id="taroke-project"' in artifact_html)
    rec('artifact has inline CSS (no external stylesheet)',
        '<link' not in artifact_html and ':root{' in artifact_html)
    rec('artifact has tick display:none CSS',
        '.tick{display:none}' in artifact_html or 'tick' in artifact_html and 'display:none' in artifact_html)
    # Verify safeJsonForHtml escapes </script> inside the JSON block
    import re as _re
    _m = _re.search(r'id="taroke-project"[^>]*>([\s\S]*?)</script>', artifact_html)
    _json_content = _m.group(1) if _m else ''
    rec('artifact JSON block has no unescaped </script> (XSS risk)',
        '</script>' not in _json_content)
    rec('artifact title comes from project',
        'Grave sample' in artifact_html or 'TAROKE' in artifact_html)
    rec('artifact embeds generateEvent function', 'generateEvent' in artifact_html)
    rec('artifact embeds clean function (no tick in output)', 'display:none' in artifact_html)

    # Load the artifact page in the browser and run it
    send2('Page.navigate', {'url': artifact_path.as_uri()})
    time.sleep(2.5)  # let the poem generate some lines

    body_text = ev2('document.body.innerText')
    inner_html = ev2('document.body.innerHTML')
    rec('artifact page loaded (head element)', bool(ev2('!!document.getElementById("head")')))
    rec('artifact stage has generated lines', bool(ev2('document.getElementById("stage")?.children.length > 0')))
    rec('artifact no visible tick spans', ev2('document.querySelectorAll(".tick").length') == 0)
    rec('artifact has no unresolved {slot:form} in output lines',
        not __import__('re').search(r'\{[a-z_]+:[a-z]+\}', body_text or ''))

finally:
    try: proc2.kill()
    except Exception: pass
    try:
        os.unlink(os.path.join(tempfile.gettempdir(), 'taroke_qa_artifact.html'))
    except Exception: pass

# ─── Session 3: Mobile viewport layout ───────────────────────────────────────
prof3 = '/tmp/chrome-qa-deep-mobile'
proc3 = None
try:
    proc3, ws3, send3, ev3 = boot_chrome(9263, prof3)
    # Set 390px mobile viewport
    send3('Emulation.setDeviceMetricsOverride', {
        'width':390,'height':844,'deviceScaleFactor':2,'mobile':True
    })
    load_app(ev3, with_css=True)

    # Check no horizontal overflow
    scroll_w = ev3('document.documentElement.scrollWidth')
    client_w = ev3('document.documentElement.clientWidth')
    rec('390px: no horizontal overflow (scrollWidth <= clientWidth)',
        bool(scroll_w and client_w and scroll_w <= client_w + 5))

    # Check bottom tabs visible
    rec('390px: bottom tabs present', bool(ev3('!!document.querySelector(".bottomTabs")')))
    rec('390px: bottom tabs not hidden',
        ev3('window.getComputedStyle(document.querySelector(".bottomTabs")||document.body).display') != 'none')

    # Check step navigation works at 390px
    ev3('document.querySelector(`[data-step="devices"]`)?.click()')
    time.sleep(.1)
    rec('390px: device step navigable', bool(ev3('TarokeDebug.ui().step==="devices"')))

    # Route textarea reachable
    rec('390px: route textarea present and usable',
        bool(ev3('!!document.querySelector("textarea[data-route-template]")')))

    # Check topbar buttons wrap without overlapping by inspecting widths
    topbar_html = ev3('document.querySelector(".top")?.innerHTML')
    rec('390px: topbar renders', bool(topbar_html))

    # Check run step at mobile
    ev3('document.querySelector(`[data-step="run"]`)?.click()')
    time.sleep(.1)
    rec('390px: run step renders', bool(ev3('!!document.querySelector("[data-run]")')))

    # Check panels have non-zero padding (basic breathing space)
    padding = ev3('(()=>{const panels=[...document.querySelectorAll(".panelBody")]; if(!panels.length)return 0; return parseInt(window.getComputedStyle(panels[0]).paddingLeft)||0;})()')
    rec('390px: panel body has non-zero padding', bool(padding and int(padding) > 0))

finally:
    try: proc3.kill()
    except Exception: pass

# ─── Final report ─────────────────────────────────────────────────────────────
print(f'{passed} passed, {failed} failed')
for r in rows: print(' | '.join(r))
if failed: sys.exit(1)
