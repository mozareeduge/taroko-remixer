import json, subprocess, time, requests, websocket, shutil, pathlib, sys, os
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from browser_runtime import resolve_chromium, page_ws_url

ROOT = pathlib.Path(__file__).resolve().parents[1]
prof = '/tmp/chrome-prof-taroke-autosave'
shutil.rmtree(prof, ignore_errors=True)
CHROME = resolve_chromium()
cmd = [CHROME,'--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-extensions','--disable-background-networking','--no-first-run','--no-default-browser-check',f'--user-data-dir={prof}','--remote-debugging-port=9248','--remote-allow-origins=*','about:blank']
chrome = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
passed=0; failed=0; rows=[]

def record(name, ok, msg=''):
    global passed, failed
    if ok: passed+=1; rows.append(('PASS',name,''))
    else: failed+=1; rows.append(('FAIL',name,msg))

AUTOSAVE_KEY = 'taroke.remixer.v07.draft'
BLANK_HTML = '<!doctype html><html><head><meta charset="utf-8"><title>test</title></head><body><div id="app"></div></body></html>'

# In-memory localStorage mock — works at about:blank where real localStorage is blocked
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

UNAVAIL_LS = """
Object.defineProperty(window,'localStorage',{
  get(){ throw new DOMException('Access denied','SecurityError'); },
  configurable:true
});
"""

try:
    for _ in range(60):
        try:
            requests.get('http://127.0.0.1:9248/json/version', timeout=.2)
            break
        except Exception:
            time.sleep(.2)
    else:
        raise RuntimeError('Chrome DevTools did not start')

    wsurl = page_ws_url(9248)
    ws = websocket.create_connection(wsurl, timeout=10)
    cid = 0

    def send(method, params=None):
        global cid
        cid += 1
        ws.send(json.dumps({'id':cid,'method':method,'params':params or {}}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get('id') == cid:
                return msg

    def eval_js(expr, await_promise=False):
        res = send('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': await_promise})
        if 'exceptionDetails' in res.get('result', {}):
            raise RuntimeError(res['result']['exceptionDetails'].get('text', 'JS exception'))
        return res.get('result', {}).get('result', {}).get('value')

    send('Runtime.enable'); send('Page.enable')

    core_text = (ROOT/'src/core.js').read_text()
    app_text  = (ROOT/'src/app.js').read_text()

    def boot_fresh(extra_before='', mock_ls=True):
        """Reload blank page, optionally install mock localStorage, load app."""
        eval_js('document.open();document.write('+json.dumps(BLANK_HTML)+');document.close();')
        if mock_ls:
            eval_js(MOCK_LS)
        if extra_before:
            eval_js(extra_before)
        eval_js(core_text + '\n//# sourceURL=core.js')
        eval_js(app_text  + '\n//# sourceURL=app.js')
        time.sleep(.5)

    def ls_get(key):
        return eval_js(f'(window.localStorage||{{getItem:()=>null}}).getItem({json.dumps(key)})')

    def ls_set(key, val):
        eval_js(f'localStorage.setItem({json.dumps(key)},{json.dumps(val)})')

    def ls_remove(key):
        eval_js(f'localStorage.removeItem({json.dumps(key)})')

    # ── Boot: normal session with mock localStorage ───────────────────────────
    boot_fresh()
    ls_remove(AUTOSAVE_KEY)

    # ── Test 1: edit project → autosave writes to localStorage key ────────────
    eval_js('document.querySelector(`[data-bind="project.title"]`).value = "Autosave Test Title"')
    eval_js('document.querySelector(`[data-bind="project.title"]`).dispatchEvent(new Event("input",{bubbles:true}))')
    time.sleep(.1)
    raw = ls_get(AUTOSAVE_KEY)
    record('edit project → autosave writes to localStorage key', raw is not None and len(raw) > 10)

    # ── Test 2: saved value contains savedAt and project payload ──────────────
    try:
        parsed = json.loads(raw or '{}')
        has_savedAt  = bool(parsed.get('savedAt'))
        has_project  = bool(parsed.get('project'))
        has_schema   = bool(parsed.get('schemaVersion'))
        record('saved value contains savedAt and project payload', has_savedAt and has_project and has_schema)
    except Exception as e:
        record('saved value contains savedAt and project payload', False, str(e))

    # ── Test 14: autosave status is perceivable text ──────────────────────────
    # Navigate away and back to trigger a render so the strip updates
    eval_js('document.querySelector(`[data-step="samples"]`).click()')
    time.sleep(.1)
    eval_js('document.querySelector(`[data-step="source"]`).click()')
    time.sleep(.1)
    strip_text = eval_js('document.querySelector(".autosaveStrip")?.textContent?.trim() || ""')
    record('autosave status is perceivable text', bool(strip_text and len(strip_text) > 5))

    # ── Test 16: 375px: no horizontal overflow from autosave UI ──────────────
    send('Emulation.setDeviceMetricsOverride',{'width':375,'height':812,'deviceScaleFactor':2,'mobile':True})
    time.sleep(.2)
    overflow = eval_js('document.body.scrollWidth > document.body.clientWidth')
    record('mobile 375px: no horizontal overflow from autosave UI', not overflow)
    send('Emulation.clearDeviceMetricsOverride')

    # ── Test 13: no visible tick/line-number regression ───────────────────────
    eval_js('document.querySelector(`[data-step="run"]`).click()')
    time.sleep(.1)
    eval_js('document.querySelector(`[data-run]`).click()')
    time.sleep(1.5)
    tick_visible = eval_js('''(function(){
      return [...document.querySelectorAll(".tick")].some(t=>{
        const s=window.getComputedStyle(t);
        return s.display!=="none" && s.visibility!=="hidden" && t.offsetWidth>0;
      });
    })()''')
    record('no visible tick/line-number regression in run surface', not tick_visible)

    # ── Test 10 & 11: standalone HTML export independent of autosave ──────────
    html_export = eval_js('window.TarokeCore.exportProjectHtml(window.TarokeDebug.project())')
    autosave_key_in_html = AUTOSAVE_KEY in (html_export or '')
    record('standalone HTML export does not embed autosave storage key', not autosave_key_in_html)
    ls_api_in_html = 'localStorage' in (html_export or '')
    record('standalone HTML does not write to editor autosave key', not ls_api_in_html)

    # ── Test 6: clear removes saved draft ────────────────────────────────────
    # Navigate to source first to ensure autosave strip is visible
    eval_js('document.querySelector(`[data-step="source"]`).click()')
    time.sleep(.1)
    clear_btn = eval_js('!!document.querySelector("[data-clear-draft]")')
    if clear_btn:
        eval_js('document.querySelector("[data-clear-draft]").click()')
        time.sleep(.1)
    raw_after = ls_get(AUTOSAVE_KEY)
    record('clear saved draft removes draft from localStorage', raw_after is None)

    # ── Test 9: import valid JSON → autosave updates after validation ─────────
    # Make an edit so there's something to autosave
    eval_js('document.querySelector(`[data-bind="project.title"]`).value = "Import Test"')
    eval_js('document.querySelector(`[data-bind="project.title"]`).dispatchEvent(new Event("input",{bubbles:true}))')
    time.sleep(.1)
    raw_post_edit = ls_get(AUTOSAVE_KEY)
    try:
        pw = json.loads(raw_post_edit or '{}')
        record('autosave stores schemaVersion in saved wrapper', 'schemaVersion' in pw)
    except Exception:
        record('autosave stores schemaVersion in saved wrapper', False, 'parse failed')

    # ── Tests 3-5: boot with saved draft → prompt, restore, dismiss ───────────
    schema_ver = eval_js('window.TarokeCore.SCHEMA_VERSION')
    boot_fresh()  # fresh page with clean mock localStorage

    # Preload a valid draft
    draft_title = 'BOOT_DRAFT_TEST_TITLE'
    draft_project = json.loads(eval_js('window.TarokeCore.exportProjectJson(window.TarokeDebug.project())'))
    draft_project['project']['title'] = draft_title
    draft_wrapper = {'savedAt': '2026-07-10T10:00:00.000Z', 'schemaVersion': schema_ver, 'project': draft_project}
    ls_set(AUTOSAVE_KEY, json.dumps(draft_wrapper))

    # Fresh boot with draft present
    boot_fresh()

    # Test 3: restore prompt appears
    has_restore_btn = eval_js('!!document.querySelector("[data-restore-draft]")')
    strip_content   = eval_js('document.querySelector(".autosaveStrip")?.textContent || ""')
    has_found_text  = 'Saved draft found' in (strip_content or '')
    record('boot with saved draft → restore prompt appears', has_restore_btn and has_found_text)

    # Test 4: restore loads saved draft
    if has_restore_btn:
        eval_js('document.querySelector("[data-restore-draft]").click()')
        time.sleep(.2)
        restored_title = eval_js('window.TarokeDebug.project().project?.title')
        record('restore loads saved draft content', restored_title == draft_title)
    else:
        record('restore loads saved draft content', False, 'restore button not found')

    # Fresh boot again with draft for dismiss test
    boot_fresh()
    ls_set(AUTOSAVE_KEY, json.dumps(draft_wrapper))
    boot_fresh()

    # Test 5: dismiss keeps current/default state
    has_dismiss = eval_js('!!document.querySelector("[data-dismiss-draft]")')
    default_title = eval_js('window.TarokeDebug.project().project?.title')
    if has_dismiss:
        eval_js('document.querySelector("[data-dismiss-draft]").click()')
        time.sleep(.1)
        after_title = eval_js('window.TarokeDebug.project().project?.title')
        record('dismiss keeps current/default state (no silent restore)', after_title != draft_title)
        prompt_gone = not eval_js('!!document.querySelector("[data-restore-draft]")')
        record('dismiss hides restore prompt', prompt_gone)
    else:
        record('dismiss keeps current/default state (no silent restore)', False, 'no dismiss button')
        record('dismiss hides restore prompt', False, 'no dismiss button')

    # ── Test 7: corrupt saved draft does not crash app ────────────────────────
    boot_fresh()
    ls_set(AUTOSAVE_KEY, 'not valid json {{{')
    boot_fresh()
    boots_ok = eval_js('!!window.TarokeDebug && document.querySelectorAll("button").length > 5')
    no_restore_btn = not eval_js('!!document.querySelector("[data-restore-draft]")')
    record('corrupt saved draft does not crash app', boots_ok)
    record('corrupt draft: restore prompt not shown', no_restore_btn)

    # ── Test 8: schema/version mismatch does not silently load ────────────────
    boot_fresh()
    mismatch_project = {'project': {'title': 'MISMATCH_TITLE'}, 'schemaVersion': 'old-v01'}
    mismatch_wrapper = {'savedAt': '2026-07-10T09:00:00.000Z', 'schemaVersion': 'old-schema-v01', 'project': mismatch_project}
    ls_set(AUTOSAVE_KEY, json.dumps(mismatch_wrapper))
    boot_fresh()
    boots_ok2   = eval_js('!!window.TarokeDebug && document.querySelectorAll("button").length > 5')
    no_restore2 = not eval_js('!!document.querySelector("[data-restore-draft]")')
    title_safe  = eval_js('window.TarokeDebug.project().project?.title') != 'MISMATCH_TITLE'
    record('schema/version mismatch does not crash app', boots_ok2)
    record('schema/version mismatch does not silently load project', no_restore2 and title_safe)

    # ── Test 12: localStorage unavailable does not crash app ─────────────────
    boot_fresh(extra_before=UNAVAIL_LS, mock_ls=False)
    boots_unavail = eval_js('!!window.TarokeDebug && document.querySelectorAll("button").length > 5')
    unavail_msg   = eval_js('document.querySelector(".autosaveStrip")?.textContent || ""')
    record('localStorage unavailable: app boots without crash', boots_unavail)
    record('localStorage unavailable: autosave unavailable message shown', 'unavailable' in (unavail_msg or '').lower())

finally:
    chrome.terminate()
    chrome.wait()
    shutil.rmtree(prof, ignore_errors=True)

for status, name, msg in rows:
    print(f'{status} | {name} | {msg}')
print(f'{passed} passed, {failed} failed')
if failed:
    sys.exit(1)
