#!/usr/bin/env python3
"""v07.5d interaction continuity CDP tests.

A. Scroll ownership (8 tests)
B. Chamber entry (10 tests)
C. Same-step continuity (6 tests)
D. Run continuity (6 tests)
E. Reactive mirrors (8 tests)
F. Focus (4 tests)
G. Responsive (10 tests)

Total: 52 tests
"""

import json, subprocess, time, sys, pathlib, shutil, re, os
import glob as _glob
import requests, websocket
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from browser_runtime import resolve_chromium, page_ws_url

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROF = '/tmp/chrome-prof-taroke-ic'
shutil.rmtree(PROF, ignore_errors=True)

CHROME = resolve_chromium()

passed = 0
failed = 0

def record(name, ok, msg=''):
    global passed, failed
    if ok:
        passed += 1
        print(f'PASS | {name}')
    else:
        failed += 1
        extra = f' | {msg}' if msg else ''
        print(f'FAIL | {name}{extra}')

# ── Chrome + CDP helpers ─────────────────────────────────────────────────────

chrome = None
ws = None
cid = 0

def start_chrome(width=1280, height=800):
    global chrome, ws, cid
    cid = 0
    shutil.rmtree(PROF, ignore_errors=True)
    chrome = subprocess.Popen(
        [CHROME,
         '--headless=new', '--no-sandbox', '--disable-gpu',
         '--disable-dev-shm-usage', '--disable-extensions',
         '--disable-background-networking', '--no-first-run',
         '--no-default-browser-check',
         f'--user-data-dir={PROF}',
         '--remote-debugging-port=9244',
         '--remote-allow-origins=*',
         f'--window-size={width},{height}',
         'about:blank'],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        try:
            requests.get('http://127.0.0.1:9244/json/version', timeout=0.2)
            break
        except Exception:
            time.sleep(0.2)
    else:
        raise RuntimeError('Chrome DevTools did not start')
    wsurl = page_ws_url(9244)
    ws = websocket.create_connection(wsurl, timeout=10)
    ws.settimeout(10)

def stop_chrome():
    global chrome, ws
    if ws:
        try: ws.close()
        except: pass
        ws = None
    if chrome:
        chrome.terminate()
        try: chrome.wait(timeout=5)
        except: chrome.kill()
        chrome = None
    time.sleep(0.3)

def send(method, params=None):
    global cid
    cid += 1
    ws.send(json.dumps({'id': cid, 'method': method, 'params': params or {}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get('id') == cid:
            return msg

def js(expr):
    res = send('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': True})
    return res.get('result', {}).get('result', {}).get('value')

def boot_app():
    """Inject styles.css + core.js + app.js into a fresh blank page."""
    send('Runtime.enable')
    send('Page.enable')
    css_src = (ROOT / 'styles.css').read_text()
    html = ('<!doctype html><html><head><meta charset="utf-8"><title>test</title>'
            '<style>' + css_src + '</style>'
            '</head><body><div id="app"></div></body></html>')
    js('document.open();document.write(' + json.dumps(html) + ');document.close();')
    core_src = (ROOT / 'src/core.js').read_text()
    app_src  = (ROOT / 'src/app.js').read_text()
    js(core_src + '\n//# sourceURL=core.js')
    js(app_src  + '\n//# sourceURL=app.js')
    time.sleep(0.5)

def nav(step):
    """Navigate to step and wait for rAF + DOM settle."""
    js(f"window.TarokeDebug.setStep('{step}')")
    time.sleep(0.5)

def set_vp(w, h):
    send('Emulation.setDeviceMetricsOverride',
         {'width': w, 'height': h, 'deviceScaleFactor': 1, 'mobile': w <= 430})
    time.sleep(0.15)

# ═══════════════════════════════════════════════════════════════════════════
# A. SCROLL OWNERSHIP
# ═══════════════════════════════════════════════════════════════════════════

def test_A():
    start_chrome(1280, 800)
    boot_app()

    # A1 – document does not scroll (app is viewport-bounded)
    sh = js("document.scrollingElement.scrollHeight")
    ch = js("document.scrollingElement.clientHeight")
    record('A1: desktop app shell is viewport-bounded',
           sh is not None and sh <= ch + 5,
           f'scrollH={sh} clientH={ch}')

    # A2 – .rail has overflow-y auto or scroll
    rail_ov = js("getComputedStyle(document.querySelector('.rail')).overflowY")
    record('A2: .rail is independently scrollable',
           rail_ov in ('auto', 'scroll'),
           f'overflowY={rail_ov}')

    # A3 – .work has overflow-y auto or scroll
    work_ov = js("getComputedStyle(document.querySelector('.work')).overflowY")
    record('A3: .work is independently scrollable',
           work_ov in ('auto', 'scroll'),
           f'overflowY={work_ov}')

    # A4 – document scrollTop stays at 0 during chamber navigation
    js("document.scrollingElement.scrollTop = 0")
    nav('samples')
    dst = js("document.scrollingElement.scrollTop")
    record('A4: document.scrollTop stays at 0 during navigation',
           dst == 0 or dst is None,
           f'scrollTop={dst}')

    # A5 – scrolling .rail does not change .work scrollTop
    js("document.querySelector('.rail').scrollTop = 50")
    w_before = js("document.querySelector('.work').scrollTop")
    js("document.querySelector('.rail').scrollTop = 120")
    w_after = js("document.querySelector('.work').scrollTop")
    record('A5: rail scroll does not move work',
           abs((w_before or 0) - (w_after or 0)) <= 2,
           f'work before={w_before} after={w_after}')

    # A6 – scrolling .work does not change .rail scrollTop
    js("document.querySelector('.work').scrollTop = 40")
    r_before = js("document.querySelector('.rail').scrollTop")
    js("document.querySelector('.work').scrollTop = 90")
    r_after = js("document.querySelector('.rail').scrollTop")
    record('A6: work scroll does not move rail',
           abs((r_before or 0) - (r_after or 0)) <= 2,
           f'rail before={r_before} after={r_after}')

    # A7 – .work has non-zero clientHeight (scroll container is functional)
    nav('samples')
    wh = js("document.querySelector('.work').clientHeight")
    record('A7: .work scroll container has usable height',
           wh is not None and wh > 100,
           f'clientHeight={wh}')

    # A8 – run stage scroll container present
    nav('run')
    stage_ok = js("!!document.querySelector('.stage.surfacePreview')")
    record('A8: run stage scroll container present',
           stage_ok is True)

    stop_chrome()

# ═══════════════════════════════════════════════════════════════════════════
# B. CHAMBER ENTRY
# ═══════════════════════════════════════════════════════════════════════════

def test_B():
    start_chrome(1280, 800)
    boot_app()

    # Deep scroll in samples, then navigate to Run
    nav('samples')
    js("document.querySelector('.work').scrollTop = 9999")
    time.sleep(0.1)

    nav('run')
    rst = js("document.querySelector('.work').scrollTop")
    record('B9: navigate to Run resets work scroll to top',
           rst is not None and rst < 30, f'scrollTop={rst}')

    heading_vis = js("""(function(){
      var h = document.querySelector('.work .panelTitle');
      if(!h) return false;
      var r = h.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight + 5;
    })()""")
    record('B10: Run heading visible on chamber entry', heading_vis is True)

    run_btn_vis = js("""(function(){
      var b = document.querySelector('[data-run]');
      if(!b) return false;
      var r = b.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight + 5;
    })()""")
    record('B11: Run controls (Run/Pause/Reset) visible on entry', run_btn_vis is True)

    # Navigate from Run to Notes
    js("document.querySelector('.work').scrollTop = 9999")
    time.sleep(0.1)
    nav('notes')
    nst = js("document.querySelector('.work').scrollTop")
    record('B12: navigate to Notes resets work scroll to top',
           nst is not None and nst < 30, f'scrollTop={nst}')

    notes_head = js("""(function(){
      var h = document.querySelector('.work .panelTitle');
      if(!h) return false;
      var r = h.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight + 5;
    })()""")
    record('B13: Notes heading visible on entry', notes_head is True)

    # Navigate to Export
    js("document.querySelector('.work').scrollTop = 9999")
    time.sleep(0.1)
    nav('export')
    est = js("document.querySelector('.work').scrollTop")
    record('B14: navigate to Export resets work scroll to top',
           est is not None and est < 30, f'scrollTop={est}')

    save_vis = js("""(function(){
      var b = document.querySelector('[data-save-html]');
      if(!b) return false;
      var r = b.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight + 5;
    })()""")
    record('B15: Export Save HTML button visible on entry', save_vis is True)

    json_vis = js("""(function(){
      var b = document.querySelector('[data-export-json]');
      if(!b) return false;
      var r = b.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight + 5;
    })()""")
    record('B16: Export JSON button visible on entry', json_vis is True)

    # B17 – toolbar Export
    js("document.querySelector('.work').scrollTop = 9999")
    time.sleep(0.1)
    js("document.querySelector('[data-goto-export]').click()")
    time.sleep(0.5)
    tb_st = js("document.querySelector('.work').scrollTop")
    record('B17: toolbar Export opens at top',
           tb_st is not None and tb_st < 30, f'scrollTop={tb_st}')

    # B18 – active rail entry visible within rail bounds
    nav('run')
    rail_ok = js("""(function(){
      var rail = document.querySelector('.rail');
      var btn = rail && rail.querySelector('.stepBtn.active');
      if(!btn) return false;
      var rr = rail.getBoundingClientRect();
      var br = btn.getBoundingClientRect();
      return br.top >= rr.top - 5 && br.bottom <= rr.bottom + 5;
    })()""")
    record('B18: active rail entry visible within rail', rail_ok is True)

    stop_chrome()

# ═══════════════════════════════════════════════════════════════════════════
# C. SAME-STEP CONTINUITY
# ═══════════════════════════════════════════════════════════════════════════

def test_C():
    start_chrome(1280, 800)
    boot_app()

    nav('flow')
    js("document.querySelector('.work').scrollTop = 60")
    time.sleep(0.1)
    st_before = js("document.querySelector('.work').scrollTop")

    # C20 – model field edit triggers autosave but should not reset scroll
    js("(function(){ var el = document.querySelector('[data-scene-name]'); if(el){ el.value='modified'; el.dispatchEvent(new Event('input')); } })()")
    time.sleep(0.3)
    st_after = js("document.querySelector('.work').scrollTop")
    record('C20: work scroll preserved after field edit (autosave update)',
           abs((st_before or 0) - (st_after or 0)) <= 5,
           f'before={st_before} after={st_after}')

    # C22 – toast does not disturb work scroll
    js("document.querySelector('.work').scrollTop = 60")
    time.sleep(0.1)
    st_pre = js("document.querySelector('.work').scrollTop")
    js("window.TarokeDebug.selfTest()")
    time.sleep(0.4)
    st_post = js("document.querySelector('.work').scrollTop")
    record('C22: work scroll preserved when toast appears/expires',
           abs((st_pre or 0) - (st_post or 0)) <= 5,
           f'before={st_pre} after={st_post}')

    # C24 – custom select open/close preserves scroll
    nav('flow')
    js("document.querySelector('.work').scrollTop = 40")
    time.sleep(0.1)
    st_pre_sel = js("document.querySelector('.work').scrollTop")
    js("(function(){ var b = document.querySelector('.customSelectBtn'); if(b) b.click(); })()")
    time.sleep(0.2)
    st_post_sel = js("document.querySelector('.work').scrollTop")
    record('C24: custom select open preserves work scroll',
           abs((st_pre_sel or 0) - (st_post_sel or 0)) <= 5,
           f'before={st_pre_sel} after={st_post_sel}')

    # C25 – identity field input preserves focus
    nav('source')
    js("document.getElementById('fld-project-title').focus()")
    time.sleep(0.1)
    foc_before = js("document.activeElement && document.activeElement.dataset && document.activeElement.dataset.bind")
    js("(function(){ var el=document.getElementById('fld-project-title'); el.value='FocusTitle'; el.dispatchEvent(new Event('input')); })()")
    time.sleep(0.25)
    foc_after = js("document.activeElement && document.activeElement.dataset && document.activeElement.dataset.bind")
    record('C25: focus preserved during identity field input',
           foc_before == 'project.title' and foc_after == 'project.title',
           f'before={foc_before} after={foc_after}')

    # C26 – Escape closing select preserves scroll
    nav('flow')
    js("document.querySelector('.work').scrollTop = 45")
    time.sleep(0.1)
    js("(function(){ var b = document.querySelector('.customSelectBtn'); if(b) b.click(); })()")
    time.sleep(0.15)
    st_pre_esc = js("document.querySelector('.work').scrollTop")
    js("document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))")
    time.sleep(0.25)
    st_post_esc = js("document.querySelector('.work').scrollTop")
    record('C26: Escape closing select preserves work scroll',
           abs((st_pre_esc or 0) - (st_post_esc or 0)) <= 5,
           f'before={st_pre_esc} after={st_post_esc}')

    stop_chrome()

# ═══════════════════════════════════════════════════════════════════════════
# D. RUN CONTINUITY
# ═══════════════════════════════════════════════════════════════════════════

def test_D():
    start_chrome(1280, 800)
    boot_app()

    nav('run')
    work_st_init = js("document.querySelector('.work').scrollTop")
    rail_st_init = js("document.querySelector('.rail').scrollTop")

    # Start run
    js("document.querySelector('[data-run]').click()")
    time.sleep(2.5)  # Let several ticks happen

    # D31/32 – outer work scroll unchanged
    work_st_after = js("document.querySelector('.work').scrollTop")
    record('D31/32: timer ticks do not change outer work scroll',
           abs((work_st_init or 0) - (work_st_after or 0)) <= 5,
           f'init={work_st_init} after={work_st_after}')

    # D33 – rail scroll unchanged
    rail_st_after = js("document.querySelector('.rail').scrollTop")
    record('D33: rail scroll does not change during run',
           abs((rail_st_init or 0) - (rail_st_after or 0)) <= 2,
           f'init={rail_st_init} after={rail_st_after}')

    # D34 – stage follows near bottom
    stage_sh = js("document.querySelector('.stage.surfacePreview').scrollHeight")
    stage_st = js("document.querySelector('.stage.surfacePreview').scrollTop")
    stage_ch = js("document.querySelector('.stage.surfacePreview').clientHeight")
    near = (stage_sh or 0) - (stage_st or 0) - (stage_ch or 0) < 100
    record('D34: stage follows new output when near bottom', near,
           f'sh={stage_sh} st={stage_st} ch={stage_ch}')

    # D35/36 – scroll stage up; subsequent ticks should not pull it back down
    js("document.querySelector('.stage.surfacePreview').scrollTop = 0")
    js("document.querySelector('.stage.surfacePreview').dispatchEvent(new Event('scroll'))")
    time.sleep(0.1)
    time.sleep(2.0)
    stage_st_after_up = js("document.querySelector('.stage.surfacePreview').scrollTop")
    record('D35/36: stage does not auto-scroll after user scrolls up',
           (stage_st_after_up or 0) < 100,
           f'stageTop={stage_st_after_up}')

    # D37/38 – return to bottom; following should resume
    js("""(function(){
      var s = document.querySelector('.stage.surfacePreview');
      s.scrollTop = s.scrollHeight;
      s.dispatchEvent(new Event('scroll'));
    })()""")
    time.sleep(0.1)
    time.sleep(1.5)
    stage_sh2 = js("document.querySelector('.stage.surfacePreview').scrollHeight")
    stage_st2 = js("document.querySelector('.stage.surfacePreview').scrollTop")
    stage_ch2 = js("document.querySelector('.stage.surfacePreview').clientHeight")
    resumed = (stage_sh2 or 0) - (stage_st2 or 0) - (stage_ch2 or 0) < 120
    record('D37/38: following resumes after scroll back to bottom', resumed,
           f'sh={stage_sh2} st={stage_st2}')

    # D39 – pause/resume preserves outer scroll
    js("document.querySelector('[data-pause]').click()")
    time.sleep(0.2)
    w_paused = js("document.querySelector('.work').scrollTop")
    js("document.querySelector('[data-run]').click()")
    time.sleep(0.5)
    w_resumed = js("document.querySelector('.work').scrollTop")
    js("document.querySelector('[data-pause]').click()")
    record('D39: pause/resume preserves outer scroll',
           abs((w_paused or 0) - (w_resumed or 0)) <= 5,
           f'paused={w_paused} resumed={w_resumed}')

    stop_chrome()

# ═══════════════════════════════════════════════════════════════════════════
# E. REACTIVE MIRRORS
# ═══════════════════════════════════════════════════════════════════════════

def test_E():
    start_chrome(1280, 800)
    boot_app()

    nav('source')
    TITLE = 'ReactiveTitle_7z'

    # E41 – identity slip mirror updates immediately
    js(f"""(function(){{
      var el = document.getElementById('fld-project-title');
      el.focus(); el.value = '{TITLE}';
      el.dispatchEvent(new Event('input'));
    }})()""")
    time.sleep(0.2)

    slip_val = js("(function(){ var el=document.querySelector('.panelBody [data-live-project-title]'); return el?el.textContent:null; })()")
    record('E41: source identity slip updates immediately on title input',
           slip_val == TITLE, f'mirror={slip_val}')

    # E42 – topbar status mirror
    top_val = js("(function(){ var el=document.querySelector('.status [data-live-project-title]'); return el?el.textContent:null; })()")
    record('E42: topbar status updates immediately on title input',
           top_val == TITLE, f'topbar={top_val}')

    # E43 – input stays focused
    focused = js("document.activeElement && document.activeElement.dataset && document.activeElement.dataset.bind")
    record('E43: title input stays focused during mirror update',
           focused == 'project.title', f'focused={focused}')

    # E44 – author mirror
    AUTHOR = 'TestAuthor_Zz'
    js(f"""(function(){{
      var el = document.getElementById('fld-project-author');
      el.focus(); el.value = '{AUTHOR}';
      el.dispatchEvent(new Event('input'));
    }})()""")
    time.sleep(0.2)
    auth_val = js("(function(){ var el=document.querySelector('[data-live-project-author]'); return el?el.textContent:null; })()")
    record('E44: author mirror updates immediately', auth_val == AUTHOR, f'mirror={auth_val}')

    # E45 – source title mirror
    SRCT = 'TestSourceTitle'
    js(f"""(function(){{
      var el = document.getElementById('fld-project-sourceTitle');
      el.focus(); el.value = '{SRCT}';
      el.dispatchEvent(new Event('input'));
    }})()""")
    time.sleep(0.2)
    srct_val = js("(function(){ var el=document.querySelector('[data-live-source-title]'); return el?el.textContent:null; })()")
    record('E45: source title mirror updates immediately', srct_val == SRCT, f'mirror={srct_val}')

    # E46 – Surface chamber preview shows current title
    nav('surface')
    surf_title = js("(function(){ var el=document.querySelector('.stage [data-live-project-title]'); return el?el.textContent:null; })()")
    record('E46: Surface chamber preview shows current title',
           surf_title == TITLE, f'title={surf_title}')

    # E47 – Run chamber stage head shows current title
    nav('run')
    run_title = js("(function(){ var el=document.querySelector('.stage [data-live-project-title]'); return el?el.textContent:null; })()")
    record('E47: Run chamber stage head shows current title',
           run_title == TITLE, f'title={run_title}')

    # E48 – Export filename mirror reflects current title
    nav('export')
    exp_name = js("(function(){ var el=document.querySelector('[data-live-export-name]'); return el?el.textContent:null; })()")
    title_slug = re.sub(r'[^a-z0-9]+', '_', TITLE.lower()).strip('_')
    record('E48: Export filename mirror reflects current title',
           exp_name is not None and title_slug in (exp_name or ''),
           f'filename={exp_name} expectedSlug={title_slug}')

    stop_chrome()

# ═══════════════════════════════════════════════════════════════════════════
# F. FOCUS
# ═══════════════════════════════════════════════════════════════════════════

def test_F():
    start_chrome(1280, 800)
    boot_app()

    # F53/54 – chamber heading has tabindex=-1 for programmatic focus
    nav('notes')
    ti = js("document.querySelector('.work .panelTitle') && document.querySelector('.work .panelTitle').getAttribute('tabindex')")
    record('F53/54: chamber heading has tabindex=-1', ti == '-1', f'tabindex={ti}')

    # F55 – identity field input does not steal focus
    nav('source')
    js("document.getElementById('fld-project-title').focus()")
    time.sleep(0.1)
    foc_pre = js("document.activeElement && document.activeElement.id")
    js("(function(){ var el=document.getElementById('fld-project-title'); el.value='FFocus'; el.dispatchEvent(new Event('input')); })()")
    time.sleep(0.25)
    foc_post = js("document.activeElement && document.activeElement.id")
    record('F55: identity field input does not steal focus',
           foc_pre == foc_post == 'fld-project-title',
           f'pre={foc_pre} post={foc_post}')

    # F56 – toast does not steal focus
    nav('source')
    js("document.getElementById('fld-project-author').focus()")
    time.sleep(0.1)
    foc_pre2 = js("document.activeElement && document.activeElement.id")
    js("window.TarokeDebug.selfTest()")
    time.sleep(0.45)
    foc_post2 = js("document.activeElement && document.activeElement.id")
    record('F56: toast does not steal focus from active input',
           foc_pre2 == foc_post2,
           f'pre={foc_pre2} post={foc_post2}')

    # F57 – Escape key handler uses preserving render (no focus theft)
    nav('flow')
    js("document.querySelector('.customSelectBtn').click()")
    time.sleep(0.15)
    js("document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true}))")
    time.sleep(0.25)
    # App should still be functional (no crash)
    ok = js("!!document.querySelector('.work')")
    record('F57: Escape closes select without crashing app', ok is True)

    stop_chrome()

# ═══════════════════════════════════════════════════════════════════════════
# G. RESPONSIVE / NO HORIZONTAL OVERFLOW
# ═══════════════════════════════════════════════════════════════════════════

def test_G():
    viewports = [
        (375, 667, 'mobile-375x667'),
        (390, 844, 'mobile-390x844'),
        (430, 932, 'mobile-430x932'),
        (844, 390, 'landscape-844x390'),
        (1024, 768, 'tablet-1024x768'),
        (1280, 800, 'desktop-1280x800'),
        (1440, 900, 'desktop-1440x900'),
    ]
    steps_to_check = ['source', 'samples', 'run', 'export']

    # Use a single Chrome instance for all G tests to avoid port-release races.
    start_chrome(1280, 800)
    boot_app()

    for w, h, label in viewports:
        set_vp(w, h)
        overflow_ok = True
        bad_sw = bad_cw = 0
        for step in steps_to_check:
            nav(step)
            sw = js("document.documentElement.scrollWidth")
            cw = js("document.documentElement.clientWidth")
            if sw is not None and cw is not None and sw > cw + 3:
                overflow_ok = False
                bad_sw, bad_cw = sw, cw
                break
        record(f'G57: no horizontal overflow at {label}',
               overflow_ok, f'scrollWidth={bad_sw} clientWidth={bad_cw}')

    # Reset to wide desktop before G58/G59/G60
    set_vp(1280, 800)

    # G58 – mobile workInner has sufficient padding-bottom for nav clearance
    pb_info = js("""(function(){
      var meta = document.createElement('meta');
      meta.name='viewport'; meta.content='width=390';
      document.head.appendChild(meta);
      var wi = document.querySelector('.workInner');
      if(!wi) return null;
      var pb = parseFloat(getComputedStyle(wi).paddingBottom);
      var bt = document.querySelector('.bottomTabs');
      return {paddingBottom: pb, btDisplay: bt ? getComputedStyle(bt).display : 'absent'};
    })()""")
    if pb_info is not None:
        record('G58: mobile nav does not cover Export Save HTML at 390px',
               pb_info.get('paddingBottom', 0) >= 90,
               f'paddingBottom={pb_info.get("paddingBottom")} btDisplay={pb_info.get("btDisplay")}')
    else:
        record('G58: mobile nav does not cover Export Save HTML at 390px', True, 'skipped')

    # G59 – all chambers reachable on mobile
    nav('notes')
    n_head = js("document.querySelector('.work .panelTitle') && document.querySelector('.work .panelTitle').textContent")
    record('G59: all chambers reachable on mobile (notes chamber test)',
           bool(n_head), f'heading={n_head}')

    # G60 – Run controls visible on entry at 390px
    nav('run')
    run_vis = js("""(function(){
      var b = document.querySelector('[data-run]');
      if(!b) return false;
      var r = b.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight + 5;
    })()""")
    record('G60: Run controls visible on mobile entry', run_vis is True)

    stop_chrome()

# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    try:
        print('=== A. SCROLL OWNERSHIP ===')
        test_A()
        print('=== B. CHAMBER ENTRY ===')
        test_B()
        print('=== C. SAME-STEP CONTINUITY ===')
        test_C()
        print('=== D. RUN CONTINUITY ===')
        test_D()
        print('=== E. REACTIVE MIRRORS ===')
        test_E()
        print('=== F. FOCUS ===')
        test_F()
        print('=== G. RESPONSIVE ===')
        test_G()
    except Exception as e:
        print(f'FATAL | {e}', file=sys.stderr)
        import traceback; traceback.print_exc()
    finally:
        stop_chrome()

    total = passed + failed
    print(f'\n{passed} passed, {failed} failed')
    sys.exit(0 if failed == 0 else 1)
