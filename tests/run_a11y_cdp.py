"""
v07.3 Accessibility and UX hardening regression tests.
Covers: focus-visible CSS, aria-live toast, modal role/aria-modal,
aria-label on up/down buttons, Escape closes overlays, label-for association,
no horizontal overflow at 375/430px, customSelect aria-labelledby.
"""
import json, subprocess, time, requests, websocket, shutil, pathlib, sys, os
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from browser_runtime import resolve_chromium, page_ws_url

ROOT = pathlib.Path(__file__).resolve().parents[1]
CHROME = resolve_chromium()

passed=0; failed=0; rows=[]
def rec(name, ok, msg=''):
    global passed, failed
    if ok: passed+=1; rows.append(('PASS',name,''))
    else: failed+=1; rows.append(('FAIL',name,str(msg)[:160]))

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
    wsurl = page_ws_url(port)
    ws = websocket.create_connection(wsurl, timeout=10)
    cid = 0
    def send(method, params=None):
        nonlocal cid; cid+=1
        ws.send(json.dumps({'id':cid,'method':method,'params':params or {}}))
        while True:
            msg=json.loads(ws.recv())
            if msg.get('id')==cid: return msg
    def ev(expr):
        res=send('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':True})
        if 'exceptionDetails' in res.get('result',{}):
            raise RuntimeError(res['result']['exceptionDetails'].get('text','JS exception: '+repr(res['result']['exceptionDetails'])))
        return res.get('result',{}).get('result',{}).get('value')
    send('Runtime.enable'); send('Page.enable')
    return proc, ws, send, ev

def load_app(ev, width=None):
    css = (ROOT/'styles.css').read_text()
    vp = '<meta name="viewport" content="width=device-width,initial-scale=1">'
    html = f'<!doctype html><html><head><meta charset="utf-8">{vp}<style>{css}</style></head><body><div id="app"></div></body></html>'
    ev('document.open();document.write('+json.dumps(html)+');document.close();')
    ev((ROOT/'src/core.js').read_text()+'\n//# sourceURL=core.js')
    ev((ROOT/'src/app.js').read_text()+'\n//# sourceURL=app.js')
    time.sleep(.35)

prof = '/tmp/chrome-prof-a11y-v073'
proc = None
try:
    proc, ws, send, ev = boot_chrome(9270, prof)
    load_app(ev)

    # ── 1. focus-visible CSS present for critical controls ──────────────────
    rec('focus-visible CSS rule exists in stylesheet',
        bool(ev('''(()=>{
          const sheets=[...document.styleSheets];
          for(const s of sheets){
            try{
              const rules=[...s.cssRules];
              for(const r of rules){
                if(r.selectorText && r.selectorText.includes(':focus-visible') &&
                   r.style && r.style.outline &&
                   (r.style.outline.includes('#fff') || r.style.outline.includes('255, 255, 255'))) return true;
              }
            }catch(e){}
          }
          return false;
        })()''')))

    # ── 2. toast has aria-live and role=status ──────────────────────────────
    # Trigger flash via self-test button (flash now calls render immediately)
    ev('document.querySelector("[data-self-test]").click()')
    time.sleep(.15)
    toast_attrs = ev('''(()=>{
      const t=document.querySelector('.toast');
      if(!t)return null;
      return JSON.stringify({live:t.getAttribute('aria-live'),role:t.getAttribute('role')});
    })()''')
    if toast_attrs:
        ta = json.loads(toast_attrs)
        rec('toast has aria-live="polite"', ta.get('live')=='polite')
        rec('toast has role="status"', ta.get('role')=='status')
    else:
        rec('toast has aria-live="polite"', False, 'toast not found after selfTest')
        rec('toast has role="status"', False, 'toast not found after selfTest')

    # ── 3. guide modal has role=dialog and aria-modal ──────────────────────
    ev('document.querySelector("[data-help]").click()')
    time.sleep(.15)
    modal_attrs = ev('''(()=>{
      const m=document.querySelector(".modal.guideModal");
      if(!m) return null;
      return JSON.stringify({role:m.getAttribute('role'), modal:m.getAttribute('aria-modal'), labeled:m.getAttribute('aria-labelledby')});
    })()''')
    if modal_attrs:
        ma = json.loads(modal_attrs)
        rec('guide modal has role="dialog"', ma.get('role')=='dialog')
        rec('guide modal has aria-modal="true"', ma.get('modal')=='true')
        rec('guide modal has aria-labelledby', bool(ma.get('labeled')))
        # Verify the referenced element exists
        labeled_id = ma.get('labeled','')
        label_text = ev(f'document.getElementById("{labeled_id}")?.textContent')
        rec('guide modal labelledby element exists', bool(label_text))
    else:
        rec('guide modal has role="dialog"', False, 'modal not found')
        rec('guide modal has aria-modal="true"', False, 'modal not found')
        rec('guide modal has aria-labelledby', False, 'modal not found')
        rec('guide modal labelledby element exists', False, 'modal not found')

    # ── 4. Escape closes guide modal ────────────────────────────────────────
    ev('''document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))''')
    time.sleep(.15)
    rec('Escape closes guide modal',
        not ev('!!document.querySelector(".modal.guideModal")'))

    # ── 5. custom select aria-labelledby ────────────────────────────────────
    # Navigate to samples step which renders customSelect widgets
    ev('document.querySelector("[data-step=\\"samples\\"]").click()')
    time.sleep(.2)
    rec('customSelect button has aria-labelledby',
        bool(ev('!!document.querySelector(".customSelectBtn[aria-labelledby]")')))

    # Verify aria-labelledby points to a real element with text
    rec('customSelect labelledby element has text content',
        bool(ev('''(()=>{
          const btn=document.querySelector(".customSelectBtn[aria-labelledby]");
          if(!btn) return false;
          const lid=btn.getAttribute("aria-labelledby");
          const lbl=document.getElementById(lid);
          return lbl && lbl.textContent.trim().length > 0;
        })()''')))

    # ── 6. field helpers have for/id association ────────────────────────────
    # Navigate back to source step which uses field() / area() helpers
    ev('document.querySelector("[data-step=\\"source\\"]").click()')
    time.sleep(.2)
    rec('field label has for= attribute on source step',
        bool(ev('''(()=>{
          const labels=[...document.querySelectorAll('.field label[for]')];
          if(!labels.length) return false;
          const lbl=labels[0];
          const target=document.getElementById(lbl.getAttribute('for'));
          return !!target;
        })()''')))

    # ── 7. stanza slot up/down buttons have aria-label ─────────────────────
    ev('document.querySelector("[data-step=\\"stanza\\"]").click()')
    time.sleep(.2)
    rec('stanza slot up button has aria-label',
        bool(ev('!!document.querySelector("[data-slot-up][aria-label]")')))
    rec('stanza slot down button has aria-label',
        bool(ev('!!document.querySelector("[data-slot-down][aria-label]")')))

    # ── 8. flow scene up/down buttons have aria-label ──────────────────────
    ev('document.querySelector("[data-step=\\"flow\\"]").click()')
    time.sleep(.2)
    rec('flow scene up button has aria-label',
        bool(ev('!!document.querySelector("[data-scene-up][aria-label]")')))
    rec('flow scene down button has aria-label',
        bool(ev('!!document.querySelector("[data-scene-down][aria-label]")')))
    rec('flow scene toggle button has aria-pressed',
        bool(ev('!!document.querySelector("[data-scene-toggle][aria-pressed]")')))

    # ── 9. device route move buttons have aria-label ───────────────────────
    ev('document.querySelector("[data-step=\\"devices\\"]").click()')
    time.sleep(.2)
    rec('route move-up button has aria-label',
        bool(ev('!!document.querySelector("[data-route-up][aria-label]")')))
    rec('route move-down button has aria-label',
        bool(ev('!!document.querySelector("[data-route-down][aria-label]")')))

    # ── 10. Escape closes open custom select ────────────────────────────────
    ev('document.querySelector(".customSelectBtn").click()')
    time.sleep(.15)
    listbox_open = bool(ev('!!document.querySelector(".listbox")'))
    ev('''document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))''')
    time.sleep(.15)
    listbox_closed = not ev('!!document.querySelector(".listbox")')
    rec('custom select opens on click', listbox_open)
    rec('Escape closes open custom select', listbox_closed)

    # ── 11. line inspector modal has role=dialog, aria-modal ───────────────
    ev('document.querySelector("[data-step=\\"run\\"]").click()')
    time.sleep(.2)
    ev('document.querySelector("[data-run]").click()')
    time.sleep(1.5)
    ev('document.querySelector("[data-pause]").click()')
    time.sleep(.15)
    has_event = bool(ev('!!document.querySelector("[data-event]")'))
    if has_event:
        ev('document.querySelector("[data-event]").click()')
        time.sleep(.2)
        insp_attrs = ev('''(()=>{
          const m=document.querySelector(".modal:not(.guideModal)");
          if(!m) return null;
          return JSON.stringify({role:m.getAttribute('role'), modal:m.getAttribute('aria-modal'), lid:m.getAttribute('aria-labelledby')});
        })()''')
        if insp_attrs:
            ia = json.loads(insp_attrs)
            rec('line inspector modal has role="dialog"', ia.get('role')=='dialog')
            rec('line inspector modal has aria-modal="true"', ia.get('modal')=='true')
            # Escape closes inspector
            ev('''document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))''')
            time.sleep(.15)
            rec('Escape closes line inspector modal',
                not ev('!!document.querySelector(".modal:not(.guideModal)")'))
        else:
            rec('line inspector modal has role="dialog"', False, 'modal not in DOM')
            rec('line inspector modal has aria-modal="true"', False, 'modal not in DOM')
            rec('Escape closes line inspector modal', False, 'modal not opened')
    else:
        rec('line inspector modal has role="dialog"', False, 'no event generated')
        rec('line inspector modal has aria-modal="true"', False, 'no event generated')
        rec('Escape closes line inspector modal', False, 'no event generated')

    # ── 12. no horizontal overflow at 375px ────────────────────────────────
    send('Emulation.setDeviceMetricsOverride',
         {'width':375,'height':812,'deviceScaleFactor':2,'mobile':True})
    time.sleep(.3)
    rec('375px: no horizontal overflow',
        not ev('document.documentElement.scrollWidth > document.documentElement.clientWidth'))

    # ── 13. no horizontal overflow at 430px ────────────────────────────────
    send('Emulation.setDeviceMetricsOverride',
         {'width':430,'height':932,'deviceScaleFactor':3,'mobile':True})
    time.sleep(.3)
    rec('430px: no horizontal overflow',
        not ev('document.documentElement.scrollWidth > document.documentElement.clientWidth'))

    # ── 14. run surface has no visible tick spans (regression) ─────────────
    send('Emulation.clearDeviceMetricsOverride',{})
    ev('document.querySelector("[data-step=\\"run\\"]").click()')
    time.sleep(.2)
    rec('run surface has no visible tick spans',
        not ev('''(()=>{
          const ticks=[...document.querySelectorAll(".tick,.line-num")];
          return ticks.some(t=>{
            const s=getComputedStyle(t);
            return s.display!=="none" && s.visibility!=="hidden" && s.opacity!=="0";
          });
        })()'''))

    # ── 15. import/export controls reachable on export step ────────────────
    ev('document.querySelector("[data-step=\\"export\\"]").click()')
    time.sleep(.2)
    rec('export step: save-html button present and not hidden',
        bool(ev('''(()=>{
          const b=document.querySelector("[data-save-html]");
          if(!b) return false;
          const s=getComputedStyle(b);
          return s.display!=="none" && s.visibility!=="hidden";
        })()''')))
    rec('export step: export-json button present and not hidden',
        bool(ev('''(()=>{
          const b=document.querySelector("[data-export-json]");
          if(!b) return false;
          const s=getComputedStyle(b);
          return s.display!=="none" && s.visibility!=="hidden";
        })()''')))

finally:
    if proc:
        try: proc.kill()
        except Exception: pass

print(f'{passed} passed, {failed} failed')
for r in rows:
    print(' | '.join(r))
if failed:
    sys.exit(1)
