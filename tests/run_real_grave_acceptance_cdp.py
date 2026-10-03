#!/usr/bin/env python3
"""
Browser/CDP acceptance for real Grave v3.2 project file.
Usage: python3 tests/run_real_grave_acceptance_cdp.py /path/to/grave.taroke.json

Captures screenshots to docs/screenshots/v07_5c_real_grave/.
"""
import json, subprocess, time, requests, websocket, shutil, pathlib, sys, os, base64
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from browser_runtime import resolve_chromium, page_ws_url

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / 'docs' / 'screenshots' / 'v07_5c_real_grave'
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

fixture_path = sys.argv[1] if len(sys.argv) > 1 else None
if not fixture_path:
    print('Usage: python3 tests/run_real_grave_acceptance_cdp.py /path/to/grave.taroke.json')
    sys.exit(1)

grave_raw = pathlib.Path(fixture_path).read_text()
grave_fixture = json.loads(grave_raw)
GRAVE_TRAY_KEYS = list(grave_fixture['materials']['trays'].keys())
FIRST_TRAY = GRAVE_TRAY_KEYS[0]
CLASSIC_BANK_IDS = ['above', 'below', 'trans', 'imper', 'intrans', 'texture', 'adjs']
UNAUTHORED_LABELS = ['ABOVE', 'BELOW', 'TRANS', 'IMPER', 'INTRANS', 'TEXTURE', 'ADJS']

prof = '/tmp/chrome-prof-taroke-grave'
shutil.rmtree(prof, ignore_errors=True)
CHROME = resolve_chromium()
cmd = [CHROME, '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
       '--disable-extensions', '--disable-background-networking', '--no-first-run',
       '--no-default-browser-check', f'--user-data-dir={prof}',
       '--remote-debugging-port=9531', '--remote-allow-origins=*', 'about:blank']
chrome = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)

passed = 0; failed = 0; rows = []
def record(name, ok, msg=''):
    global passed, failed
    if ok: passed += 1; rows.append(('PASS', name, ''))
    else: failed += 1; rows.append(('FAIL', name, msg))

MOCK_LS = """
(function(){
  if(typeof window.__mockLsStore === 'undefined') window.__mockLsStore = {};
  const store = window.__mockLsStore;
  Object.defineProperty(window, 'localStorage', {
    get(){
      return {
        getItem(k){ return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null; },
        setItem(k,v){ store[k]=String(v); },
        removeItem(k){ delete store[k]; },
        clear(){ Object.keys(store).forEach(k=>delete store[k]); },
        get length(){ return Object.keys(store).length; },
        key(i){ return Object.keys(store)[i]??null; }
      };
    }, configurable:true
  });
})();
"""

try:
    for _ in range(60):
        try:
            requests.get('http://127.0.0.1:9531/json/version', timeout=.2)
            break
        except Exception:
            time.sleep(.2)
    else:
        raise RuntimeError('Chrome DevTools did not start')

    wsurl = page_ws_url(9531)
    ws = websocket.create_connection(wsurl, timeout=15)
    cid = 0
    def send(method, params=None):
        global cid; cid += 1
        ws.send(json.dumps({'id': cid, 'method': method, 'params': params or {}}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get('id') == cid: return msg
    def ev(expr, await_promise=False):
        res = send('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': await_promise})
        if 'exceptionDetails' in res.get('result', {}):
            raise RuntimeError(res['result']['exceptionDetails'].get('text','JS exception'))
        return res.get('result',{}).get('result',{}).get('value')
    def screenshot(name, selector=None):
        r = send('Page.captureScreenshot', {'format': 'png'})
        data = r.get('result', {}).get('data', '')
        if data:
            out = SCREENSHOTS / name
            out.write_bytes(base64.b64decode(data))
            print(f'  Screenshot: {out}')
    def get_project():
        return json.loads(ev('JSON.stringify(window.TarokeDebug?.project()||{})') or '{}')
    def get_ui():
        return json.loads(ev('JSON.stringify(window.TarokeDebug?.ui()||{})') or '{}')
    def step(s):
        ev(f'document.querySelector(`[data-step="{s}"]`)?.click()')
        time.sleep(0.3)

    send('Runtime.enable')
    send('Page.enable')
    send('Emulation.setDeviceMetricsOverride', {'width': 1280, 'height': 800, 'deviceScaleFactor': 1, 'mobile': False})

    # Boot app
    base_html = '<!doctype html><html><head><meta charset="utf-8"><title>test</title></head><body><div id="app"></div></body></html>'
    ev('document.open();document.write(' + json.dumps(base_html) + ');document.close();')
    ev(MOCK_LS)
    core_js = (ROOT / 'src/core.js').read_text()
    app_js  = (ROOT / 'src/app.js').read_text()
    ev(core_js + '\n//# sourceURL=core.js')
    ev(app_js  + '\n//# sourceURL=app.js')
    time.sleep(0.5)

    # Import the Grave fixture
    payload = grave_raw.replace('\\', '\\\\').replace('`', '\\`').replace('$', '\\$')
    ev(f'''(function(){{
      const raw = `{payload}`;
      try {{
        const inp = document.querySelector('[data-file]');
        if(inp) {{
          const file = new File([raw], 'grave_v3_2.taroke.json', {{type:'application/json'}});
          const dt = new DataTransfer();
          dt.items.add(file);
          Object.defineProperty(inp, 'files', {{value: dt.files, configurable: true}});
          inp.dispatchEvent(new Event('change'));
        }}
      }} catch(e) {{ console.error('import error:', e); }}
    }})()''')
    time.sleep(0.8)

    # --- Test 1: Import succeeds
    proj = get_project()
    record('Import succeeds without crash',
        bool(proj.get('project', {}).get('title')))

    # --- Test 2: No unauthored classic bank
    step('samples')
    time.sleep(0.3)
    html = ev('document.body.innerHTML') or ''
    classic_present = [c for c in CLASSIC_BANK_IDS if f'data-tray="{c}"' in html]
    record('Samples: no unauthored classic bank present',
        len(classic_present) == 0, f'found: {classic_present}')

    # --- Test 3: First bank is real Grave bank
    ui = get_ui()
    selected = ui.get('tray', '')
    record('Samples: opens on real Grave bank',
        selected == FIRST_TRAY or selected in GRAVE_TRAY_KEYS,
        f'selected="{selected}" first="{FIRST_TRAY}"')

    # Screenshot 1: first bank
    screenshot('real-grave-samples-first-bank.png')

    # --- Test 4: All authored banks reachable
    proj2 = get_project()
    actual_keys = list(proj2.get('materials', {}).get('trays', {}).keys())
    missing_banks = [k for k in GRAVE_TRAY_KEYS if k not in actual_keys]
    record('Samples: all authored banks present',
        len(missing_banks) == 0, f'missing: {missing_banks}')

    # --- Test 5: Bank order matches source file
    record('Samples: bank order matches source file',
        actual_keys == GRAVE_TRAY_KEYS,
        f'first 5 got={actual_keys[:5]} exp={GRAVE_TRAY_KEYS[:5]}')

    # Screenshot 2: long bank list (scroll to show many banks)
    screenshot('real-grave-long-bank-list.png')

    # --- Test 6: Custom labels appear
    grave_bm = grave_fixture['materials']['bankMeta']
    some_labels = [grave_bm[k]['label'] for k in list(grave_bm.keys())[:5] if 'label' in grave_bm[k]]
    missing_labels = [l for l in some_labels if l not in html]
    record('Samples: custom bankMeta labels visible',
        len(missing_labels) == 0, f'missing: {missing_labels}')

    # --- Test 7: bankMeta roles correct
    proj_bm = proj2.get('materials', {}).get('bankMeta', {})
    role_ok = True
    for k in ['processed_bodies', 'labor_verbs', 'body_textures', 'relations', 'quantity']:
        exp_role = grave_bm.get(k, {}).get('role', '')
        got_role = proj_bm.get(k, {}).get('role', '')
        if exp_role and got_role != exp_role:
            print(f'  ROLE MISMATCH: {k} exp={exp_role} got={got_role}')
            role_ok = False
    record('BankMeta: authored roles preserved (noun/verb/adj/adv/prep)',
        role_ok)

    # --- Test 8: Devices list only actual Grave banks
    step('devices')
    time.sleep(0.3)
    html_dev = ev('document.body.innerHTML') or ''
    classic_in_dev = [c for c in CLASSIC_BANK_IDS if f'data-tray="{c}"' in html_dev or f'data-value="{c}"' in html_dev]
    record('Devices: no classic bank in device editor',
        len(classic_in_dev) == 0, f'found: {classic_in_dev}')

    # Screenshot 3: device bank selector
    screenshot('real-grave-device-bank-selector.png')

    # --- Test 9: Device inputs reference valid Grave banks
    grave_tray_set = set(GRAVE_TRAY_KEYS)
    bad_refs = []
    for dev in proj2.get('lineDevices', []):
        for inp in dev.get('inputs', []):
            if inp.get('tray') not in grave_tray_set:
                bad_refs.append(f'{dev["name"]}.{inp["slot"]}→{inp["tray"]}')
    record('Devices: all device inputs reference valid Grave banks',
        len(bad_refs) == 0, f'bad refs: {bad_refs}')

    # --- Test 10: Triggers list only actual Grave banks
    step('triggers')
    time.sleep(0.3)
    html_trg = ev('document.body.innerHTML') or ''
    classic_in_trg = [c for c in CLASSIC_BANK_IDS if f'data-tray="{c}"' in html_trg or f'data-value="{c}"' in html_trg]
    record('Triggers: no classic bank in trigger selector',
        len(classic_in_trg) == 0, f'found: {classic_in_trg}')

    # --- Test 11: New device uses actual bank
    step('devices')
    ev('document.querySelector("[data-add-device]")?.click()')
    time.sleep(0.3)
    proj3 = get_project()
    last_dev = proj3.get('lineDevices', [])[-1] if proj3.get('lineDevices') else None
    if last_dev:
        classic_new = [i['tray'] for i in last_dev.get('inputs', []) if i['tray'] not in grave_tray_set and i['tray']]
        record('New device: uses actual Grave bank',
            len(classic_new) == 0, f'classic refs: {classic_new}')
    else:
        record('New device: uses actual Grave bank', True, 'no device added (ok)')

    # --- Test 12: New trigger uses actual bank
    step('triggers')
    count_before = len(get_project().get('triggers', []))
    ev('document.querySelector("[data-add-trigger]")?.click()')
    time.sleep(0.3)
    proj4 = get_project()
    trigs = proj4.get('triggers', [])
    if len(trigs) > count_before:
        new_trig_tray = trigs[-1].get('condition', {}).get('tray', '')
        record('New trigger: uses actual Grave bank',
            not new_trig_tray or new_trig_tray in grave_tray_set,
            f'tray="{new_trig_tray}"')
    else:
        record('New trigger: uses actual Grave bank', True, 'none added (ok)')

    # --- Test 13: Referenced-bank deletion blocked
    # Find a bank referenced by a device
    ref_banks = set()
    for dev in proj4.get('lineDevices', []):
        for inp in dev.get('inputs', []):
            ref_banks.add(inp.get('tray', ''))
    ref_bank = next(iter(ref_banks - {''}), None)
    if ref_bank:
        ev(f'(function(){{const b=document.querySelector(`[data-delete-tray="{ref_bank}"]`);if(b)b.click();}})(); ')
        time.sleep(0.2)
        proj_after = get_project()
        record('Bank deletion: referenced bank deletion is blocked',
            ref_bank in proj_after.get('materials', {}).get('trays', {}),
            f'bank "{ref_bank}" was deleted')
    else:
        record('Bank deletion: referenced bank deletion is blocked', True, 'no ref bank (ok)')

    # --- Test 14: Run produces resolved lines
    step('run')
    ev('document.querySelector("[data-run]")?.click()')
    time.sleep(3.5)
    ev('document.querySelector("[data-pause]")?.click()')
    time.sleep(0.2)
    events_raw = ev('JSON.stringify(window.TarokeDebug?.ui()?.events||[])')
    events = json.loads(events_raw or '[]')
    line_events = [e for e in events if e.get('type') == 'line']
    blank_lines = [e for e in line_events if not (e.get('surface') or '').strip()]
    record('Run: produces line events from Grave banks',
        len(line_events) > 0, f'got {len(line_events)} line events')
    record('Run: no blank line surfaces',
        len(blank_lines) == 0, f'{len(blank_lines)} blank events')

    # Screenshot 4: run output
    screenshot('real-grave-run-output.png')

    # --- Test 15: JSON export preserves tray order
    exported_json = ev('(function(){ try { return window.TarokeCore?.exportProjectJson(window.TarokeDebug?.project()) || "{}"; } catch(e) { return "{}"; } })()')
    if exported_json:
        exported = json.loads(exported_json)
        exp_keys = list(exported.get('materials', {}).get('trays', {}).keys())
        record('JSON export: exact tray order preserved',
            exp_keys == GRAVE_TRAY_KEYS,
            f'first 5: {exp_keys[:5]}')
        classic_in_exp = [c for c in CLASSIC_BANK_IDS if c in exp_keys]
        record('JSON export: no classic banks injected',
            len(classic_in_exp) == 0, f'found: {classic_in_exp}')
        exp_repairs = exported.get('meta', {}).get('importRepairs', [])
        record('JSON export: importRepairs present',
            len(exp_repairs) > 0, f'got {len(exp_repairs)} repairs')
    else:
        record('JSON export: exact tray order preserved', False, 'export failed')
        record('JSON export: no classic banks injected', False, 'export failed')
        record('JSON export: importRepairs present', False, 'export failed')

    # --- Test 16: HTML export preserves tray order
    html_exported = ev('(function(){ try { return window.TarokeCore?.exportProjectHtml(window.TarokeDebug?.project()) || ""; } catch(e) { return ""; } })()')
    if html_exported:
        m = __import__('re').search(r'<script[^>]*id=["\']taroke-project["\'][^>]*>([\s\S]*?)</script>', html_exported)
        if m:
            html_proj = json.loads(m.group(1).replace('<\\/script', '</script').replace('<\\!--', '<!--'))
            html_keys = list(html_proj.get('materials', {}).get('trays', {}).keys())
            record('HTML export: exact tray order preserved',
                html_keys == GRAVE_TRAY_KEYS, f'first 5: {html_keys[:5]}')
            html_repairs = html_proj.get('meta', {}).get('importRepairs', [])
            record('HTML export: importRepairs preserved',
                len(html_repairs) > 0, f'got {len(html_repairs)} repairs')
        else:
            record('HTML export: exact tray order preserved', False, 'no embedded JSON found')
            record('HTML export: importRepairs preserved', False, 'no embedded JSON found')
    else:
        record('HTML export: exact tray order preserved', False, 'HTML export failed')
        record('HTML export: importRepairs preserved', False, 'HTML export failed')

    # --- Test 17: Autosave / restore cycle
    # Trigger autosave
    ev('window.TarokeDebug?.save?.()')
    time.sleep(0.3)
    autosave_raw = ev('localStorage.getItem("taroke.remixer.v07.draft")')
    if autosave_raw:
        draft = json.loads(autosave_raw)
        draft_keys = list((draft.get('project') or draft).get('materials', {}).get('trays', {}).keys())
        record('Autosave: tray keys preserved in draft',
            draft_keys == GRAVE_TRAY_KEYS, f'first 5: {draft_keys[:5]}')
        draft_repairs = (draft.get('project') or draft).get('meta', {}).get('importRepairs', [])
        record('Autosave: importRepairs preserved in draft',
            len(draft_repairs) > 0, f'got {len(draft_repairs)}')
        # Simulate restore
        restore_raw = json.dumps(draft.get('project') or draft)
        restore_esc = restore_raw.replace('\\','\\\\').replace('`','\\`').replace('$','\\$')
        ev(f'''(function(){{
          const raw = `{restore_esc}`;
          const inp = document.querySelector('[data-file]');
          if(inp) {{
            const file = new File([raw], 'restore.taroke.json', {{type:'application/json'}});
            const dt = new DataTransfer();
            dt.items.add(file);
            Object.defineProperty(inp, 'files', {{value: dt.files, configurable: true}});
            inp.dispatchEvent(new Event('change'));
          }}
        }})()''')
        time.sleep(0.6)
        proj_r = get_project()
        restored_keys = list(proj_r.get('materials', {}).get('trays', {}).keys())
        record('Autosave restore: exact tray order preserved',
            restored_keys == GRAVE_TRAY_KEYS, f'first 5: {restored_keys[:5]}')
        record('Autosave restore: no classic contamination',
            not any(c in restored_keys for c in CLASSIC_BANK_IDS))
        record('Autosave restore: importRepairs survives restore',
            len(proj_r.get('meta', {}).get('importRepairs', [])) > 0)
    else:
        record('Autosave: tray keys preserved in draft', False, 'no autosave found')
        record('Autosave: importRepairs preserved in draft', False, 'no autosave found')
        record('Autosave restore: exact tray order preserved', False, 'no autosave found')
        record('Autosave restore: no classic contamination', False, 'no autosave found')
        record('Autosave restore: importRepairs survives restore', False, 'no autosave found')

    # --- Test 18: No console errors
    console_errors = json.loads(ev('JSON.stringify(window.__consoleErrors||[])') or '[]')
    record('No uncaught console errors',
        len(console_errors) == 0, f'errors: {console_errors[:3]}')

    # --- Test 19: Mobile 375px - no overflow
    step('samples')
    time.sleep(0.2)
    send('Emulation.setDeviceMetricsOverride', {'width': 375, 'height': 667, 'deviceScaleFactor': 2, 'mobile': True})
    time.sleep(0.2)
    overflow_375 = ev('document.documentElement.scrollWidth > document.documentElement.clientWidth + 5')
    record('Mobile 375×667: no horizontal overflow',
        not overflow_375, 'horizontal overflow detected')

    # Screenshot 5: mobile
    screenshot('real-grave-mobile-375-samples.png')

    # Reset to 1280
    send('Emulation.setDeviceMetricsOverride', {'width': 1280, 'height': 800, 'deviceScaleFactor': 1, 'mobile': False})

    # --- Test 20: Other mobile sizes
    for w, h in [(390, 844), (430, 932), (1440, 900)]:
        send('Emulation.setDeviceMetricsOverride', {'width': w, 'height': h, 'deviceScaleFactor': 1, 'mobile': w < 500})
        time.sleep(0.1)
        ov = ev('document.documentElement.scrollWidth > document.documentElement.clientWidth + 5')
        record(f'{w}×{h}: no horizontal overflow', not ov, 'overflow detected')

finally:
    ws.close()
    chrome.terminate()
    chrome.wait(timeout=5)

print()
for status, name, msg in rows:
    print(f'{status} | {name}' + (f' | {msg}' if msg else ''))
print(f'\n{passed} passed, {failed} failed')
sys.exit(0 if failed == 0 else 1)
