(function(){
  'use strict';
  const C = window.TarokeCore;
  const AUTOSAVE_KEY = 'taroke.remixer.v07.draft';
  const _store = {
    ok: false,
    probe(){ try{ localStorage.setItem('__t__','1'); localStorage.removeItem('__t__'); this.ok=true; }catch(e){ this.ok=false; } },
    get(){ try{ return localStorage.getItem(AUTOSAVE_KEY); }catch(e){ return null; } },
    set(v){ try{ localStorage.setItem(AUTOSAVE_KEY,v); return true; }catch(e){ return false; } },
    rm(){ try{ localStorage.removeItem(AUTOSAVE_KEY); }catch(e){} }
  };
  const STEPS = [
    ['source','Source','origin'], ['samples','Samples','banks'], ['forms','Forms','modulators'], ['devices','Devices','line racks'], ['stanza','Stanza','patterns'], ['flow','Flow','scenes'], ['triggers','Triggers','conditions'], ['surface','Surface','output'], ['run','Run','live'], ['notes','Notes','repairs'], ['export','Export','files']
  ];
  const BASE_BANKS = Object.keys(C.TRAY_DEFS);
  function trayNames(){ return Object.keys(project.materials?.trays || {}); }
  function bankDef(name){ return C.projectTrayDefs(project)[name] || {label:String(name).toUpperCase(), role:'literal', desc:'custom sample bank'}; }
  const ROLES = ['noun','verb','adjective','adverb','preposition','literal','mixed'];
  function firstValidTray(proj){
    const trays = proj?.materials?.trays || {};
    for(const d of (proj?.lineDevices || [])){
      for(const inp of (d.inputs || [])){
        if(inp.tray && trays[inp.tray]) return inp.tray;
      }
    }
    return Object.keys(trays)[0] || null;
  }
  let project = C.defaultProject();
  let _bootDraftProject = null;
  let ui = {step:'source', tray:'above', device:'ld_path', stanza:'st_classic', token:null, openSelect:null, drag:null, timer:null, runState:{tick:0,queue:[]}, events:[], selectedEvent:null, help:false, msg:'', autosave:{available:false, savedAt:null, draftFound:false, draftDismissed:false, corruptWarning:false}, preview:{srcdoc:null,error:null,builtSig:null}};

  // Run-stage follow policy: true = follow new lines; updated by stage scroll listener
  let _runFollowing = true;

  // Preview iframe preservation: true when buildPreview() triggered this render cycle
  let _previewBuildPending = false;
  // Holds the existing preview iframe node temporarily during non-build renders
  let _savedPreviewIframe = null;

  const app = document.getElementById('app');
  const h = C.esc;
  const tray = n => project.materials.trays[n] || [];
  const device = id => C.getDevice(project,id) || project.lineDevices[0];
  const stanza = id => C.getStanza(project,id) || project.stanzaPatterns[0];
  const selectedDevice = () => device(ui.device);
  const selectedStanza = () => stanza(ui.stanza);
  const findToken = id => trayNames().flatMap(t=>tray(t)).find(x=>x.id===id);
  const tokenTray = id => trayNames().find(t=>tray(t).some(x=>x.id===id));
  const roleForTray = name => bankDef(name).role || 'literal';

  function saveDraft(){
    if(!ui.autosave.available)return;
    const w={savedAt:new Date().toISOString(),schemaVersion:C.SCHEMA_VERSION,project:project};
    if(_store.set(JSON.stringify(w))){ ui.autosave.savedAt=w.savedAt; if(ui.autosave.draftFound){ui.autosave.draftFound=false;_bootDraftProject=null;} }
  }
  _store.probe(); ui.autosave.available=_store.ok;
  if(_store.ok){ const _raw=_store.get(); if(_raw){ try{ const _w=JSON.parse(_raw); if(_w&&_w.project){ if(_w.schemaVersion&&_w.schemaVersion!==C.SCHEMA_VERSION){ ui.autosave.corruptWarning=true; }else{ _bootDraftProject=C.migrateProject(_w.project); ui.autosave.draftFound=true; ui.autosave.savedAt=_w.savedAt||null; } }else{ ui.autosave.corruptWarning=true; } }catch(e){ ui.autosave.corruptWarning=true; } } }

  function applyTheme(){ document.body.dataset.theme = project.workbench?.theme || 'night'; }
  function flash(msg){ ui.msg=msg; renderPreserving(); setTimeout(()=>{ui.msg=''; renderPreserving();},1800); }
  function set(path,val){ const parts=path.split('.'); let o=project; while(parts.length>1){ const k=parts.shift(); o[k]=o[k]||{}; o=o[k]; } o[parts[0]]=val; saveDraft(); }
  function get(path){ return path.split('.').reduce((o,k)=>o?.[k],project); }
  function issueCount(prefix){ return C.validateProject(project).filter(i=>i.area.startsWith(prefix)).length; }
  function status(id){ if(id==='samples')return issueCount('samples')?'warning':'ready'; if(id==='forms')return trayNames().reduce((n,t)=>n+tray(t).filter(x=>x.lockedLiteral).length,0)+' locked'; if(id==='devices')return project.lineDevices.length+' devices'; if(id==='stanza')return project.stanzaPatterns.length+' patterns'; if(id==='flow')return C.activeScenes(project).length?'ready':'blocked'; if(id==='run')return ui.timer?'running':ui.events.length+' events'; if(id==='notes')return project.notes.length+' notes'; if(id==='surface')return project.surface.family; return 'ready'; }

  // ─── Render-state capture/restore for same-step rerenders ───────────────────

  function getElemKey(el){
    if(!el) return null;
    return el.dataset.bind || el.dataset.routeTemplate || el.dataset.deviceField ||
           el.dataset.stanzaName || el.dataset.stanzaDesc || el.dataset.sceneName ||
           el.dataset.sceneChance || el.dataset.trigName || el.dataset.trigTerm ||
           el.dataset.trigText || el.dataset.trigChance || el.dataset.routeName ||
           el.dataset.routeWeight || el.dataset.inputSlot || el.dataset.tokenLit ||
           el.dataset.bankLabel || el.dataset.bankDesc || el.dataset.slotChance ||
           el.id || null;
  }

  function captureRenderState(){
    const work = document.querySelector('.work');
    const rail = document.querySelector('.rail');
    const stage = ui.step === 'run' ? document.querySelector('.stage.surfacePreview') : null;
    const active = document.activeElement;
    const isMeaningful = active && active !== document.body && active !== document.documentElement && app.contains(active);
    return {
      workST: work ? work.scrollTop : 0,
      railST: rail ? rail.scrollTop : 0,
      stageST: stage ? stage.scrollTop : 0,
      focusKey: isMeaningful ? getElemKey(active) : null,
      focusTag: isMeaningful ? active.tagName : null,
      sel0: (isMeaningful && active.selectionStart != null) ? active.selectionStart : null,
      sel1: (isMeaningful && active.selectionEnd != null) ? active.selectionEnd : null,
      taST: (isMeaningful && active.tagName === 'TEXTAREA') ? active.scrollTop : null,
    };
  }

  function restoreRenderState(state){
    if(!state) return;
    const work = document.querySelector('.work');
    const rail = document.querySelector('.rail');
    if(work && state.workST) work.scrollTop = state.workST;
    if(rail && state.railST) rail.scrollTop = state.railST;
    // Stage scroll is handled separately by run follow policy
    if(state.focusKey){
      const candidates = [
        `[data-bind="${CSS.escape(state.focusKey)}"]`,
        `[data-route-template="${CSS.escape(state.focusKey)}"]`,
        `[data-device-field="${CSS.escape(state.focusKey)}"]`,
        `[data-stanza-name="${CSS.escape(state.focusKey)}"]`,
        `[data-stanza-desc="${CSS.escape(state.focusKey)}"]`,
        `[data-scene-name="${CSS.escape(state.focusKey)}"]`,
        `[data-route-name="${CSS.escape(state.focusKey)}"]`,
        `#${CSS.escape(state.focusKey)}`,
      ];
      for(const sel of candidates){
        try{
          const el = document.querySelector(sel);
          if(el){
            el.focus({preventScroll:true});
            if(state.sel0 != null && el.setSelectionRange){
              try{ el.setSelectionRange(state.sel0, state.sel1); }catch(e){}
            }
            if(state.taST != null && el.tagName === 'TEXTAREA'){
              el.scrollTop = state.taST;
            }
            break;
          }
        }catch(e){}
      }
    }
  }

  function renderPreserving(){
    const state = captureRenderState();
    render();
    requestAnimationFrame(()=> restoreRenderState(state));
  }

  // ─── Live preview state/signature (v07.6) ───────────────────────────────────

  function previewSignature() {
    return JSON.stringify({p:project.project,m:project.materials,f:project.forms,d:project.lineDevices,st:project.stanzaPatterns,fl:project.flowScenes,tr:project.triggers,su:project.surface,n:project.notes,me:project.meta,sv:project.schemaVersion});
  }
  function previewState() {
    if(ui.preview.error) return 'error';
    if(!ui.preview.builtSig) return 'unbuilt';
    if(previewSignature()===ui.preview.builtSig) return 'fresh';
    return 'stale';
  }
  function buildPreview() {
    const work=document.querySelector('.work'); const rail=document.querySelector('.rail');
    const workST=work?work.scrollTop:0; const railST=rail?rail.scrollTop:0;
    _previewBuildPending = true;
    try{
      ui.preview.srcdoc=C.exportProjectHtml(project);
      ui.preview.error=null;
      ui.preview.builtSig=previewSignature();
    }catch(e){
      ui.preview.error=e.message||'Preview build failed.';
    }
    render();
    requestAnimationFrame(()=>{
      const w=document.querySelector('.work'); const r=document.querySelector('.rail');
      if(w) w.scrollTop=workST; if(r) r.scrollTop=railST;
      const btn=document.querySelector('[data-build-preview]');
      if(btn) btn.focus({preventScroll:true});
    });
  }

  // ─── Centralized chamber navigation ─────────────────────────────────────────

  function navigateStep(nextStep, opts){
    opts = opts || {};
    if(!STEPS.some(([id])=>id===nextStep)) return;
    const isNew = ui.step !== nextStep;
    const rail = document.querySelector('.rail');
    const railST = rail ? rail.scrollTop : 0;
    ui.openSelect = null;
    ui.step = nextStep;
    render();
    requestAnimationFrame(()=>{
      // Restore rail scroll
      const rail2 = document.querySelector('.rail');
      if(rail2) rail2.scrollTop = railST;
      // Ensure active rail entry visible
      const activeBtn = rail2 && rail2.querySelector('.stepBtn.active');
      if(activeBtn) activeBtn.scrollIntoView({block:'nearest',behavior:'auto'});
      if(isNew){
        // Scroll work container to top (desktop)
        const work = document.querySelector('.work');
        if(work) work.scrollTop = 0;
        // Scroll document to top (mobile)
        window.scrollTo(0, 0);
        // Focus the first chamber heading
        const heading = document.querySelector('.work .panelTitle');
        if(heading){
          if(!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex','-1');
          heading.focus({preventScroll:true});
        }
      }
    });
  }

  // ─── Reactive identity mirrors ───────────────────────────────────────────────

  function updateLiveMirrors(){
    const title = project.project.title || '';
    const author = project.project.author || '';
    const srcTitle = project.project.sourceTitle || '';
    const stmt = project.project.statement || '';
    const credits = project.project.credits || '';
    const fname = C.downloadName(project, '.taroke.html');
    document.querySelectorAll('[data-live-project-title]').forEach(el=>{ el.textContent = title; });
    document.querySelectorAll('[data-live-project-author]').forEach(el=>{ el.textContent = author; });
    document.querySelectorAll('[data-live-source-title]').forEach(el=>{ el.textContent = srcTitle; });
    document.querySelectorAll('[data-live-statement]').forEach(el=>{ el.textContent = stmt; });
    document.querySelectorAll('[data-live-credits]').forEach(el=>{ el.textContent = credits; });
    document.querySelectorAll('[data-live-export-name]').forEach(el=>{ el.textContent = fname; });
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  function render(){
    applyTheme();
    // Preserve the running preview iframe across non-build renders (e.g. toast, dismiss-draft)
    // to avoid interrupting the embedded artifact runtime.
    _savedPreviewIframe = null;
    if(!_previewBuildPending && ui.step==='export' && ui.preview.srcdoc){
      _savedPreviewIframe = app.querySelector('.livePreviewFrame');
      if(_savedPreviewIframe) _savedPreviewIframe.remove();
    }
    app.innerHTML = `<div class="app">${topbar()}<main class="layout">${rail()}<section class="work" tabindex="-1"><div class="workInner">${autosaveStrip()}${work()}</div></section></main>${mobileTabs()}${ui.help?guide():''}${ui.selectedEvent?lineInspector():''}${ui.msg?`<div class="toast" role="status" aria-live="polite">${h(ui.msg)}</div>`:''}<input class="fileInput" type="file" accept=".html,.json,text/html,application/json" data-file></div>`;
    bind();
    if(_savedPreviewIframe){
      const placeholder=app.querySelector('.livePreviewFrame');
      if(placeholder&&placeholder.parentNode) placeholder.parentNode.replaceChild(_savedPreviewIframe,placeholder);
      _savedPreviewIframe=null;
    }
    _previewBuildPending=false;
  }
  function topbar(){ return `<header class="top"><div class="brand"><b>TAROKE RIMIXER</b><span>v07 reset / stripped functional workbench</span></div><nav class="toolbar"><button class="btn" data-new>New</button><button class="btn" data-open>Open</button><button class="btn" data-self-test>Self-test</button><button class="btn primary" data-goto-export>Export</button><button class="btn" data-help>Guide</button></nav><div class="status">local / editable / <span data-live-project-title>${h(project.project.title)}</span></div></header>`; }
  function rail(){ return `<aside class="rail" aria-label="Navigation">${STEPS.map(([id,label,k],i)=>`<button class="stepBtn ${ui.step===id?'active':''}" data-step="${id}" aria-current="${ui.step===id?'step':'false'}"><span class="stepNum">${String(i+1).padStart(2,'0')}</span><span><span class="stepLabel">${label}</span><br><span class="kicker">${k}</span></span><span class="state">${h(status(id))}</span></button>`).join('')}</aside>`; }
  function mobileTabs(){ return `<nav class="bottomTabs" aria-label="Chambers">${STEPS.map(([id,label])=>`<button class="${ui.step===id?'active':''}" data-step="${id}" aria-current="${ui.step===id?'step':'false'}">${label}<br><span>${h(status(id))}</span></button>`).join('')}</nav>`; }
  function fmtTime(iso){ try{ return new Date(iso).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }
  function autosaveStrip(){
    const as=ui.autosave;
    if(!as.available) return `<div class="autosaveStrip"><span class="autosaveMuted">Autosave unavailable in this browser/session.</span></div>`;
    if(as.corruptWarning) return `<div class="autosaveStrip"><span class="autosaveMuted">Saved draft could not be read and was ignored. JSON export remains the archive copy.</span><button class="btn small" data-clear-draft>Clear saved draft</button></div>`;
    if(as.draftFound&&!as.draftDismissed){ const when=as.savedAt?` (${fmtTime(as.savedAt)})`:''; return `<div class="autosaveStrip autosaveAlert"><b>Saved draft found${h(when)}.</b><button class="btn small primary" data-restore-draft>Restore saved draft</button><button class="btn small" data-dismiss-draft>Dismiss</button><button class="btn small" data-clear-draft>Clear saved draft</button><span class="autosaveMuted">JSON export remains the archive copy.</span></div>`; }
    if(!as.savedAt) return '';
    return `<div class="autosaveStrip"><span class="autosaveMuted" aria-live="polite">Draft saved locally in this browser at ${fmtTime(as.savedAt)}.</span><button class="btn small" data-clear-draft>Clear saved draft</button></div>`;
  }
  function work(){ return ({source,samples,forms,devices,stanza:stanzaStep,flow,triggers,surface,run,notes,export:exportStep}[ui.step]||source)(); }
  function field(label,path,type='text'){ const id='fld-'+path.replace(/[^a-z0-9]/gi,'-'); return `<div class="field"><label for="${id}">${h(label)}</label><input id="${id}" class="input" type="${type}" value="${h(get(path)||'')}" data-bind="${path}"></div>`; }
  function area(label,path){ const id='fld-'+path.replace(/[^a-z0-9]/gi,'-'); return `<div class="field"><label for="${id}">${h(label)}</label><textarea id="${id}" class="textarea" data-bind="${path}">${h(get(path)||'')}</textarea></div>`; }
  function num(label,path,min,max,step=1){ const id='fld-'+path.replace(/[^a-z0-9]/gi,'-'); return `<div class="field"><label for="${id}">${h(label)}</label><input id="${id}" class="input" type="number" min="${min}" max="${max}" step="${step}" value="${h(get(path)||0)}" data-bind-number="${path}"></div>`; }

  function source(){ return `<div class="grid2"><div class="panel"><div class="panelHead"><div><div class="panelTitle" tabindex="-1">Source ground</div><div class="panelKicker">lineage / identity / public face</div></div></div><div class="panelBody"><p class="hint">This records what the remix inherits and how the exported work identifies itself.</p>${field('Title','project.title')}${field('Author','project.author')}${field('Source title','project.sourceTitle')}${field('Source URL','project.sourceUrl')}${area('Statement','project.statement')}${area('Credits','project.credits')}</div></div><div class="panel"><div class="panelHead"><div><div class="panelTitle">Identity slip</div><div class="panelKicker">export face</div></div></div><div class="panelBody"><h2 class="mono" data-live-project-title>${h(project.project.title)}</h2><p class="hint">by <span data-live-project-author>${h(project.project.author)}</span> / after <span data-live-source-title>${h(project.project.sourceTitle)}</span></p><p data-live-statement>${h(project.project.statement)}</p></div></div></div>`; }

  function samples(){
    const name=project.materials.trays[ui.tray]?ui.tray:trayNames()[0]; ui.tray=name;
    const toks=tray(name); const def=bankDef(name); const isLastBank=trayNames().length<=1;
    return `<div class="panel"><div class="panelHead"><div><div class="panelTitle" tabindex="-1">Sample banks</div><div class="panelKicker">banks / tokens / drag / duplicate / weight</div></div><div class="row"><button class="btn primary" data-add-bank>Add bank</button><button class="btn small" data-dedupe="${name}">Dedupe</button><button class="btn small" data-sort="${name}">Sort</button></div></div><div class="panelBody"><p class="hint">Drag samples between banks. Duplicating a sample or increasing its weight raises its chance of selection.</p><div class="trayGrid"><div class="bankTabs">${trayNames().map(n=>`<button class="bankTab ${n===name?'active':''}" data-tray="${n}" data-bank-drop="${n}"><b>${h(bankDef(n).label)}</b><span class="micro">${tray(n).length} / ${h(bankDef(n).role)} / ${h(bankDef(n).desc)}</span></button>`).join('')}</div><div class="sampleBank" data-bank-drop="${name}"><div class="row"><div><div class="panelTitle" style="font-size:24px">${h(def.label)} bank</div><div class="hint">${h(def.desc)} / id: ${h(name)}</div></div><button class="btn right" data-add-token="${name}">Add sample</button></div><div class="panel"><div class="panelBody"><h3 class="mono">Bank editor</h3><div class="grid3"><div class="field"><label>Bank label</label><input class="input" value="${h(def.label)}" data-bank-label="${name}"></div>${customSelect('Default role',def.role,ROLES.map(r=>[r,r]),`bankrole:${name}`)}<div class="field"><label>Description</label><input class="input" value="${h(def.desc)}" data-bank-desc="${name}"></div></div><div class="row">${!isLastBank?`<button class="btn small danger" data-delete-bank="${name}">Delete bank</button>`:'<span class="micro">Last bank: cannot delete. Add another bank first.</span>'}</div></div></div><div class="field"><label>Bulk paste</label><textarea class="textarea" data-bulk="${name}" placeholder="Paste words, lines, or comma-separated samples. Repetition is preserved."></textarea><button class="btn" data-bulk-add="${name}">Add pasted samples</button></div><div class="tokenList">${toks.map(t=>`<button draggable="true" class="tokenCell ${t.lockedLiteral?'locked':''}" data-token="${t.id}" data-token-drag="${name}:${t.id}">${h(t.literal||'empty')}<br><span class="micro">${h(t.role)} / weight ${Number(t.weight||1)}</span></button>`).join('')||'<p class="hint">Drop or add samples here.</p>'}</div>${ui.token?tokenEditor(findToken(ui.token), tokenTray(ui.token)):''}</div></div></div></div>`;
  }
  function tokenEditor(t,tname){ if(!t)return ''; const forms={plural:C.formToken(project,t,'plural'),third:C.formToken(project,t,'thirdSingular')}; return `<div class="tokenEditor"><div class="row"><b class="mono">Sample editor</b><button class="btn small right" data-close-token>Close</button></div><div class="grid3"><div class="field"><label>Literal</label><input class="input" value="${h(t.literal)}" data-token-lit="${t.id}"></div>${customSelect('Role',t.role,ROLES.map(r=>[r,r]),`tokrole:${t.id}`)}<div class="field"><label>Weight</label><input class="input" type="number" min="0" step="1" value="${h(t.weight??1)}" data-token-weight="${t.id}"></div></div><p class="micro">bank ${h(tname)} / plural ${h(forms.plural)} / verb 3sg ${h(forms.third)}</p><div class="row"><button class="btn small ${t.lockedLiteral?'primary':''}" data-lock="${t.id}">${t.lockedLiteral?'Literal locked':'Lock literal'}</button><button class="btn small" data-duplicate-token="${tname}:${t.id}">Duplicate sample</button><button class="btn small" data-focus-forms="${t.id}">Forms</button><button class="btn small danger" data-delete-token="${tname}:${t.id}">Delete sample</button></div></div>`; }

  function forms(){ const t=ui.token?findToken(ui.token):tray(ui.tray)[0]; return `<div class="panel"><div class="panelHead"><div><div class="panelTitle" tabindex="-1">Form modulators</div><div class="panelKicker">global defaults / bank policy / sample override</div></div></div><div class="panelBody"><div class="grid3"><div class="panel"><div class="panelBody"><h3 class="mono">Global defaults</h3>${customSelect('Case policy',project.forms.casePolicy,[['preserve','preserve literal'],['upper','uppercase output'],['lower','lowercase output'],['title','title case']], 'forms.casePolicy')}${customSelect('Compound handling',project.forms.compoundPolicy,[['head','pluralize head'],['literal','keep literal']], 'forms.compoundPolicy')}</div></div><div class="panel"><div class="panelBody"><h3 class="mono">Tray policy</h3><p class="hint">Noun banks show noun forms. Verb banks show verb forms. Mixed banks ask for role.</p><div class="ports">${trayNames().map(n=>`<button class="port ${ui.tray===n?'active':''}" data-tray="${n}">${bankDef(n).label} / ${bankDef(n).role}</button>`).join('')}</div></div></div><div class="panel"><div class="panelBody"><h3 class="mono">Sample override</h3>${t?`<p class="hint"><b>${h(t.literal)}</b> can stay literal or receive explicit forms.</p><div class="grid2">${fieldOverride(t,'plural','Plural override')}${fieldOverride(t,'thirdSingular','Verb 3sg override')}</div><button class="btn small ${t.lockedLiteral?'primary':''}" data-lock="${t.id}">${t.lockedLiteral?'Literal locked':'Lock literal'}</button>`:'<p class="hint">No sample available.</p>'}</div></div></div><div class="panel"><div class="panelHead"><div><div class="panelTitle">${h(bankDef(ui.tray).label)} forms</div><div class="panelKicker">selected bank</div></div></div><div class="panelBody"><div class="tokenList">${tray(ui.tray).map(tok=>`<button class="tokenCell" data-token="${tok.id}">${h(tok.literal)}<br><span class="micro">plural ${h(C.formToken(project,tok,'plural'))}</span></button>`).join('')}</div></div></div></div></div>`; }
  function fieldOverride(t,k,label){ const val=project.forms.overrides?.[t.id]?.[k]||''; return `<div class="field"><label>${h(label)}</label><input class="input" value="${h(val)}" data-override="${t.id}:${k}"></div>`; }

  function devices(){ const d=selectedDevice(); return `<div class="deviceLayout"><div class="panel deviceListPanel"><div class="panelHead"><div><div class="panelTitle" tabindex="-1">Line devices</div><div class="panelKicker">textual racks / line makers</div></div><button class="btn primary" data-add-device>Create device</button></div><div class="panelBody"><p class="hint">A line device receives word samples, applies forms, and prints one line. PATH, SITE, and CAVE are inherited defaults.</p>${project.lineDevices.map(dev=>deviceCard(dev)).join('')}</div></div><div class="panel deviceEditorPanel"><div class="panelHead"><div><div class="panelTitle">Device editor</div><div class="panelKicker">click slot chips into route templates</div></div></div><div class="panelBody">${deviceEditor(d)}</div></div></div>`; }
  function deviceCard(d){ return `<button class="deviceCard ${ui.device===d.id?'active':''}" data-device="${d.id}"><div class="deviceTitle">${h(d.name)}</div><p>${h(d.description||'')}</p><div class="ports">${(d.inputs||[]).map(i=>`<span class="port">${h(i.slot)} → ${h(i.tray)}</span>`).join('')}</div><p class="micro">${d.routes?.length||0} routes / ${d.enabled?'enabled':'off'}</p></button>`; }
  function slotChips(d,idx){ const forms=['literal','plural','thirdSingular','uppercase','lowercase','base']; return (d.inputs||[]).map(i=>`<span class="slotChipGroup"><b>${h(i.slot)}</b>${forms.map(f=>`<button type="button" class="port slotChip" data-insert-route="${h(d.id)}" data-insert-index="${idx}" data-insert-value="${h(`{${i.slot}:${f}}`)}">{${h(i.slot)}:${f}}</button>`).join('')}</span>`).join('') || '<span class="micro">Add an input slot first.</span>'; }
  function deviceEditor(d){ if(!d)return '<p>No device.</p>'; return `<div>${fieldForDevice(d,'Device name','name')}${areaForDevice(d,'Description','description')}<h3 class="mono">Inputs</h3><p class="hint">Input slots name the variables used by route templates. Change the slot name, choose a sample bank, then click slot chips below to insert variables into any route.</p>${(d.inputs||[]).map((i,idx)=>`<div class="inputLane"><input class="input slotNameInput" value="${h(i.slot)}" data-input-slot="${d.id}:${idx}" title="Slot variable name">${customSelect('Bank',i.tray,trayNames().map(n=>[n,bankDef(n).label]),`inputtray:${d.id}:${idx}`)}${customSelect('Form role',i.role,ROLES.map(r=>[r,r]),`inputrole:${d.id}:${idx}`)}<button class="btn small danger" data-del-input="${d.id}:${idx}">Delete</button></div>`).join('')}<button class="btn small" data-add-input="${d.id}">Add input</button><h3 class="mono">Route lanes</h3><p class="hint">Template/schema = static text plus variables. Write normal text directly. Click/tap a slot chip to insert it at the cursor. You can delete, rewrite, or mix variables and text manually.</p>${(d.routes||[]).map((r,idx)=>`<div class="routeCard routeLane" draggable="true" data-route-drag="${d.id}:${idx}"><div class="routeLaneTop"><div class="field compact"><label>Route name</label><input class="input" value="${h(r.name)}" data-route-name="${d.id}:${idx}"></div><div class="field compact weightField"><label>Weight</label><input class="input" type="number" value="${h(r.weight)}" data-route-weight="${d.id}:${idx}"></div><button class="btn small danger" data-del-route="${d.id}:${idx}">Delete</button></div><div class="field"><label>Template / schema</label><textarea class="textarea routeTemplate" data-route-template="${d.id}:${idx}" placeholder="Example: {1:literal}, maybe, {3:literal}. Static text can be written anywhere.">${h(r.template)}</textarea></div><div class="slotChipBox"><div class="micro">Click to insert at cursor:</div>${slotChips(d,idx)}</div><div class="row"><button class="btn small" data-route-up="${d.id}:${idx}" aria-label="Move route ${idx+1} up">Move up</button><button class="btn small" data-route-down="${d.id}:${idx}" aria-label="Move route ${idx+1} down">Move down</button><span class="micro">Drag also works when the browser supports it.</span></div></div>`).join('')}<div class="row"><button class="btn small" data-add-route="${d.id}">Add route</button><button class="btn small ${d.enabled?'primary':''}" data-toggle-device="${d.id}">${d.enabled?'Enabled':'Off'}</button><button class="btn small danger" data-delete-device="${d.id}">Delete device</button></div></div>`; }
  function fieldForDevice(d,label,k){ return `<div class="field"><label>${h(label)}</label><input class="input" value="${h(d[k]||'')}" data-device-field="${d.id}:${k}"></div>`; }
  function areaForDevice(d,label,k){ return `<div class="field"><label>${h(label)}</label><textarea class="textarea" data-device-field="${d.id}:${k}">${h(d[k]||'')}</textarea></div>`; }

  function stanzaStep(){ const st=selectedStanza(); return `<div class="panel"><div class="panelHead"><div><div class="panelTitle" tabindex="-1">Stanza patterns</div><div class="panelKicker">create / edit / arrange device slots</div></div><div class="row">${customSelect('',ui.stanza,project.stanzaPatterns.map(s=>[s.id,s.name]),'ui.stanza')}<button class="btn primary" data-add-stanza>Create pattern</button><button class="btn" data-reset-stanza>Reset classic</button></div></div><div class="panelBody"><p class="hint">Line devices make lines. Stanza patterns arrange line devices into repeatable forms. Every device can be added to a stanza.</p>${st?`<div class="grid2"><div class="field"><label>Pattern name</label><input class="input" value="${h(st.name||'')}" data-stanza-name="${st.id}"></div><div class="field"><label>Description</label><input class="input" value="${h(st.description||'')}" data-stanza-desc="${st.id}"></div></div>`:''}<div class="slotsStrip">${(st?.slots||[]).map((s,i)=>slotCard(st,s,i)).join('<span class="arrow">→</span>')}</div><div class="row" style="margin-top:18px">${project.lineDevices.map(d=>`<button class="btn small" data-add-slot="${d.id}">Add ${h(d.name)}</button>`).join('')}<button class="btn small" data-add-breath>Add breath</button>${st&&st.id!=='st_classic'?`<button class="btn small danger" data-delete-stanza="${st.id}">Delete pattern</button>`:''}</div></div></div>`; }
  function slotCard(st,s,i){ return `<div class="slotCard" draggable="true" data-slot-drag="${st.id}:${i}"><div class="handle">⠿ slot ${i+1}</div><div class="slotTitle">${h(s.label||s.type)}</div><p class="micro">${s.type==='device'?h(device(s.deviceId)?.name||s.deviceId):'stanza boundary'}</p>${s.type==='device'?customSelect('Device',s.deviceId,project.lineDevices.map(d=>[d.id,d.name]),`slotdev:${st.id}:${i}`):''}<div class="row"><button class="btn small" data-slot-up="${st.id}:${i}" aria-label="Move slot ${i+1} up">↑</button><button class="btn small" data-slot-down="${st.id}:${i}" aria-label="Move slot ${i+1} down">↓</button><button class="btn small danger" data-slot-del="${st.id}:${i}">Delete</button></div>${s.type==='device'?`<div class="grid2">${customSelect('Repeat',s.repeat||'once',[['once','once'],['loop','0..n loop']],`slotrepeat:${st.id}:${i}`)}<div class="field"><label>Chance</label><input class="input" type="number" value="${h(s.chance??100)}" data-slot-chance="${st.id}:${i}"></div></div>`:''}</div>`; }

  function flow(){ return `<div class="panel"><div class="panelHead"><div><div class="panelTitle" tabindex="-1">Flow scenes</div><div class="panelKicker">arrangement / routing over time</div></div><button class="btn primary" data-add-scene>Add scene</button></div><div class="panelBody"><p class="hint">Flow chooses which stanza pattern gets the next chance to speak. Scenes can be reordered, disabled, or weighted.</p>${project.flowScenes.map((s,i)=>`<div class="sceneCard" draggable="true" data-scene-drag="${i}"><div class="routeGrid"><input class="input" value="${h(s.name)}" data-scene-name="${i}">${customSelect('',s.stanzaId,project.stanzaPatterns.map(st=>[st.id,st.name]),`scene-stanza:${i}`)}<input class="input" type="number" value="${h(s.chance)}" data-scene-chance="${i}"><button class="btn small danger" data-scene-del="${i}">Delete</button></div><div class="row"><button class="btn small" data-scene-up="${i}" aria-label="Move scene up">↑</button><button class="btn small" data-scene-down="${i}" aria-label="Move scene down">↓</button><button class="btn small ${s.enabled?'primary':''}" data-scene-toggle="${i}" aria-pressed="${s.enabled?'true':'false'}">${s.enabled?'Enabled':'Off'}</button></div></div>`).join('')}</div></div>`; }

  function triggers(){ return `<div class="panel"><div class="panelHead"><div><div class="panelTitle" tabindex="-1">Trigger conditions</div><div class="panelKicker">bank sample → exception text</div></div><button class="btn primary" data-add-trigger>Add trigger</button></div><div class="panelBody"><p class="hint">Each trigger can target a bank and a sample in that bank. The sample dropdown writes the term field.</p>${(project.triggers||[]).map((t,i)=>triggerCard(t,i)).join('')}</div></div>`; }
  function triggerCard(t,i){ const bank=t.condition?.tray||trayNames()[0]||''; const samples=tray(bank).map(tok=>[tok.literal,tok.literal]); return `<div class="sceneCard"><div class="grid2"><input class="input" value="${h(t.name)}" data-trig-name="${i}">${customSelect('Bank',bank,trayNames().map(n=>[n,bankDef(n).label]),`trig-tray:${i}`)}</div><div class="grid3">${customSelect('Sample term',t.condition?.term||'',[['','any selected sample'],...samples],`trig-sample:${i}`)}<input class="input" placeholder="manual term" value="${h(t.condition?.term||'')}" data-trig-term="${i}"><input class="input" type="number" value="${h(t.chance)}" data-trig-chance="${i}"></div><div class="field"><label>Text to add</label><input class="input" value="${h(t.action?.text||'')}" data-trig-text="${i}"></div><div class="row"><button class="btn small ${t.enabled?'primary':''}" data-trig-toggle="${i}">${t.enabled?'Enabled':'Off'}</button><button class="btn small danger" data-trig-del="${i}">Delete</button></div></div>`; }

  function surfaceInline(){ const t=C.THEME_TOKENS[project.surface.theme]||C.THEME_TOKENS.night; return `style="background:${t.surfaceBg};color:${t.surfaceText};border-color:${t.surfaceMuted};font-size:${Number(project.surface.fontSize||21)}px;line-height:${Number(project.surface.lineHeight||1.48)}"`; }

  function surface(){ return `<div class="panel"><div class="panelHead"><div><div class="panelTitle" tabindex="-1">Output surface</div><div class="panelKicker">run and export behavior</div></div></div><div class="panelBody surfaceClean"><p class="hint">Surface is functional now: no theme cards, no family cards, no line numbers. The exported poem uses the same plain stream settings.</p><h3 class="mono">Run/export controls</h3><div class="grid3">${customSelect('Trace mode',project.surface.traceMode,[['hidden','hidden'],['receipt','receipt'],['tape','event tape']],'surface.traceMode')}${num('Speed ms','surface.speedMs',250,8000,50)}${num('Line retention','surface.retention',4,80,1)}${num('Poem size','surface.fontSize',14,72,1)}${num('Line height','surface.lineHeight',1,2.5,.05)}</div><div class="stage surfacePreview" ${surfaceInline()} data-trace="${h(lastTrace())}">${surfaceSample()}</div></div></div>`; }

  function surfaceSample(){ return `<div><div class="stageHead"><span data-live-project-title>${h(project.project.title)}</span> / after <span data-live-source-title>${h(project.project.sourceTitle)}</span></div><p class="poemLine"><span class="poemText">graves refuse the floor.</span></p><p class="poemLine"><span class="poemText">a gateway rises.</span></p></div>`; }
  function lastTrace(){ return ui.events[ui.events.length-1]?.trace || 'No event yet.'; }

  function run(){ return `<div class="panel"><div class="panelHead"><div><div class="panelTitle" tabindex="-1">Run chamber</div><div class="panelKicker">clean surface / inspect when paused or selected</div></div><div class="row controls"><button class="btn primary" data-run>${ui.timer?'Running':'Run'}</button><button class="btn" data-pause>Pause</button><button class="btn" data-reset-run>Reset</button></div></div><div class="panelBody"><p class="hint">The run surface stays close to the exported artifact. Click a line to inspect its recipe; annotation controls are not printed into the poem.</p>${validationPanel()}<div class="stage surfacePreview" ${surfaceInline()} data-trace="${h(lastTrace())}"><div class="stageHead"><span data-live-project-title>${h(project.project.title)}</span> / after <span data-live-source-title>${h(project.project.sourceTitle)}</span></div>${ui.events.filter(e=>e.type!=='breath').slice(-project.surface.retention).map(e=>`<div class="poemLine ${ui.selectedEvent===e.id?'selected':''}" data-event="${e.id}"><span class="poemText">${h(e.surface)}</span></div>`).join('')||'<p class="hint">Run to generate lines.</p>'}</div>${project.surface.traceMode!=='hidden'?`<div class="eventTape"><b>EVENT TAPE</b> ${h(lastTrace())}</div>`:''}</div></div>`; }
  function validationPanel(){ const issues=C.validateProject(project); if(!issues.length)return '<div class="hint">Validation ready.</div>'; return `<div class="inspector"><b class="mono">Validation</b>${issues.map(i=>`<p><b>${h(i.level)} / ${h(i.area)}</b><br>${h(i.message)}<br><span class="micro">${h(i.action||'')}</span></p>`).join('')}</div>`; }
  function lineInspector(){
    const e=ui.events.find(x=>x.id===ui.selectedEvent); if(!e)return '';
    // consumedInputs (v07.5e+): tokens that contributed to this line via the route template.
    // selectedTokens: all tokens picked (including slots omitted from the chosen template).
    const consumed=e.consumedInputs||[];
    const consumedIds=new Set(consumed.map(c=>c.tokenId));
    const allToks=Object.values(e.selectedTokens||{}).filter(Boolean);
    const consumedToks=consumed.map(c=>e.selectedTokens?.[c.slot]).filter(Boolean);
    const omittedToks=allToks.filter(t=>!consumedIds.has(t.id));
    const trigLine=e.trigger?`<p class="micro">Trigger: ${h(e.trigger.name||'')} matched slot <b>${h(e.trigger.matchedSlot||'')}</b> (${h(e.trigger.matchedSourceLiteral||'')})</p>`:'';
    const omittedSection=omittedToks.length?`<h3 class="mono">Selected but not rendered</h3><div class="tokenList">${omittedToks.map(t=>`<span class="tokenCell locked" title="Selected; slot absent from route template">${h(t.literal)}</span>`).join('')}</div>`:'';
    return `<div class="modalShade" data-close-event><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-insp-title" onclick="event.stopPropagation()"><div class="modalHead"><div><div class="panelTitle" id="modal-insp-title">Line recipe</div><div class="panelKicker">${h(e.id)} / ${h(e.deviceName)} / ${h(e.route)}</div></div><button class="btn" data-close-event>Close</button></div><div class="modalBody"><div class="stage"><p class="poemText">${h(e.surface)}</p><p class="micro">${h(e.trace)}</p>${trigLine}</div><h3 class="mono">Consumed samples</h3><div class="tokenList">${consumedToks.map(t=>`<button class="tokenCell" data-jump-token="${t.id}">${h(t.literal)}</button>`).join('')||'<span class="hint">none</span>'}</div>${omittedSection}<div class="row"><button class="btn primary" data-note="keep:${e.id}">Keep as sample line</button><button class="btn" data-note="repair:${e.id}">Mark for repair</button><button class="btn" data-open-device="${e.deviceId}">Open device</button></div></div></div></div>`;
  }
  function notes(){ return `<div class="panel"><div class="panelHead"><div><div class="panelTitle" tabindex="-1">Notes / repairs</div><div class="panelKicker">line evidence and repair doors</div></div></div><div class="panelBody">${project.notes.length?project.notes.map(n=>`<div class="noteCard"><b>${h(n.status)} / ${h(n.eventId)}</b><p>${h(n.surface)}</p><p class="micro">${h(n.event?.trace||'')}</p><button class="btn small" data-open-note-event="${n.eventId}">Open recipe</button></div>`).join(''):'<p class="hint">No notes yet. Select a generated line in Run.</p>'}</div></div>`; }
  function exportStep(){
    const state=previewState();
    const statusHtml=state==='error'
      ?`<div class="previewStatus previewError" role="alert" aria-live="assertive">Preview failed: ${h(ui.preview.error)}</div>`
      :state==='unbuilt'
        ?`<div class="previewStatus" role="status" aria-live="polite">Live preview has not been built.</div>`
        :state==='fresh'
          ?`<div class="previewStatus" role="status" aria-live="polite">Preview built from the current project.</div>`
          :`<div class="previewStatus" role="status" aria-live="polite">Preview is out of date.</div>`;
    const btnLabel=state==='unbuilt'?'Build live artifact preview':state==='fresh'?'Rebuild live artifact preview':state==='stale'?'Refresh live artifact preview':'Retry live artifact preview';
    const frameHtml=ui.preview.srcdoc?`<iframe class="livePreviewFrame" sandbox="allow-scripts" title="Live preview of the exported TAROKE artifact"></iframe>`:'';
    return `<div class="panel"><div class="panelHead"><div><div class="panelTitle" tabindex="-1">Export</div><div class="panelKicker">playable HTML + project JSON</div></div></div><div class="panelBody"><p class="hint">HTML is the playable artwork and can be reopened here. JSON is the clean project configuration. Both are accepted as import.</p>${validationPanel()}<p class="micro">Filename: <span data-live-export-name>${h(C.downloadName(project,'.taroke.html'))}</span></p><div class="row exportActions"><button class="btn primary" data-save-html>Save playable HTML</button><button class="btn" data-export-json>Export project JSON</button><button class="btn" data-copy-json>Copy JSON</button></div><div class="previewSection"><p class="hint">JSON is the editable project archive. Playable HTML is the standalone distributable artifact. The embedded preview is temporary — it runs in this browser only and is not the archive or the downloaded artifact.</p>${statusHtml}<div class="row"><button class="btn" data-build-preview>${h(btnLabel)}</button></div>${frameHtml}</div></div></div>`;
  }

  function customSelect(label,value,options,key){ const open=ui.openSelect===key; const current=(options.find(o=>String(o[0])===String(value))||['',value])[1]; const lid='csl-'+key.replace(/[^a-z0-9]/gi,'-'); return `<div class="field"><label id="${lid}">${h(label||'select')}</label><div class="selectWrap"><button class="customSelectBtn" type="button" aria-haspopup="listbox" aria-expanded="${open?'true':'false'}" aria-labelledby="${lid}" data-select-open="${h(key)}"><span>${h(current)}</span><span>⌄</span></button>${open?`<div class="listbox" role="listbox">${options.map(([v,l])=>`<button class="option" role="option" aria-selected="${String(v)===String(value)}" data-select-key="${h(key)}" data-select-value="${h(v)}">${h(l)}</button>`).join('')}</div>`:''}</div></div>`; }
  function guide(){ return `<div class="modalShade"><div class="modal guideModal" role="dialog" aria-modal="true" aria-labelledby="modal-guide-title"><div class="modalHead"><div><div class="panelTitle" id="modal-guide-title">Guide</div><div class="panelKicker">samples → devices → stanza → flow → run → export</div></div><button class="btn" data-close-help>Close</button></div><div class="modalBody"><p class="hint">Use sample banks as word material. Devices are text-field/variable templates. Stanzas arrange devices. Flow chooses stanzas. Run tests the poem. Export writes a standalone HTML or JSON artifact.</p></div></div></div>`; }

  function bind(){
    // Primary navigation — centralized, resets scroll on chamber change
    app.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>navigateStep(b.dataset.step));
    app.querySelector('[data-goto-export]')?.addEventListener('click',()=>navigateStep('export'));
    app.querySelector('[data-help]')?.addEventListener('click',()=>{ui.help=true;renderPreserving();}); app.querySelector('[data-close-help]')?.addEventListener('click',()=>{ui.help=false;renderPreserving();}); app.querySelector('[data-self-test]')?.addEventListener('click',runSelfTest);
    app.querySelector('[data-new]')?.addEventListener('click',()=>{pause(); project=C.defaultProject(); _store.rm(); _bootDraftProject=null; ui={...ui,events:[],selectedEvent:null,runState:{tick:0,queue:[]},token:null,autosave:{available:ui.autosave.available,savedAt:null,draftFound:false,draftDismissed:false,corruptWarning:false},preview:{srcdoc:null,error:null,builtSig:null}}; navigateStep('source');});
    app.querySelector('[data-open]')?.addEventListener('click',()=>app.querySelector('[data-file]').click()); app.querySelector('[data-file]')?.addEventListener('change',importFile);
    app.querySelector('[data-restore-draft]')?.addEventListener('click',()=>{ if(_bootDraftProject){pause(); project=_bootDraftProject; _bootDraftProject=null; ui={...ui,events:[],selectedEvent:null,runState:{tick:0,queue:[]},token:null,tray:firstValidTray(project)||trayNames()[0]||ui.tray,device:project.lineDevices[0]?.id,stanza:project.stanzaPatterns[0]?.id,autosave:{...ui.autosave,draftFound:false},preview:{srcdoc:null,error:null,builtSig:null}}; saveDraft(); navigateStep('source'); } });
    app.querySelector('[data-dismiss-draft]')?.addEventListener('click',()=>{ ui.autosave.draftDismissed=true; renderPreserving(); });
    app.querySelector('[data-clear-draft]')?.addEventListener('click',()=>{ _store.rm(); _bootDraftProject=null; ui.autosave.savedAt=null; ui.autosave.draftFound=false; ui.autosave.corruptWarning=false; renderPreserving(); });
    // Model binding — identity fields update live mirrors; no full render on text input
    app.querySelectorAll('[data-bind]').forEach(el=>el.oninput=()=>{set(el.dataset.bind,el.value);saveDraft();updateLiveMirrors();}); app.querySelectorAll('[data-bind-number]').forEach(el=>el.onchange=()=>{set(el.dataset.bindNumber,Number(el.value));saveDraft();render();});
    app.querySelectorAll('[data-select-open]').forEach(b=>b.onclick=()=>{ui.openSelect=ui.openSelect===b.dataset.selectOpen?null:b.dataset.selectOpen;renderPreserving();});
    app.querySelectorAll('[data-select-key]').forEach(b=>b.onclick=()=>{const key=b.dataset.selectKey; const val=b.dataset.selectValue; handleSelect(key,val); ui.openSelect=null; saveDraft(); render();});
    app.querySelectorAll('[data-tray]').forEach(b=>b.onclick=()=>{ui.tray=b.dataset.tray;ui.token=null;render();});
    app.querySelector('[data-add-bank]')?.addEventListener('click',()=>{const id='bank_'+C.normalizeIdLabel('custom_'+Date.now().toString(36)); project.materials.trays[id]=[]; project.materials.bankMeta=project.materials.bankMeta||{}; project.materials.bankMeta[id]={label:'NEW BANK',role:'noun',desc:'custom sample bank'}; ui.tray=id; saveDraft(); render();});
    app.querySelectorAll('[data-bank-label]').forEach(el=>el.oninput=()=>{project.materials.bankMeta=project.materials.bankMeta||{}; project.materials.bankMeta[el.dataset.bankLabel]=project.materials.bankMeta[el.dataset.bankLabel]||{}; project.materials.bankMeta[el.dataset.bankLabel].label=el.value; saveDraft();});
    app.querySelectorAll('[data-bank-desc]').forEach(el=>el.oninput=()=>{project.materials.bankMeta=project.materials.bankMeta||{}; project.materials.bankMeta[el.dataset.bankDesc]=project.materials.bankMeta[el.dataset.bankDesc]||{}; project.materials.bankMeta[el.dataset.bankDesc].desc=el.value; saveDraft();});
    app.querySelectorAll('[data-delete-bank]').forEach(b=>b.onclick=()=>{
      const n=b.dataset.deleteBank;
      if(trayNames().length<=1){flash('Cannot delete the only bank.');return;}
      const refDevices=(project.lineDevices||[]).filter(d=>(d.inputs||[]).some(i=>i.tray===n));
      const refTriggers=(project.triggers||[]).filter(t=>t.condition?.tray===n);
      if(refDevices.length||refTriggers.length){
        const dList=refDevices.map(d=>d.name).join(', ');
        const tList=refTriggers.map(t=>t.name).join(', ');
        flash('Bank "'+n+'" is used by'+(dList?' devices: '+dList:'')+(tList?' triggers: '+tList:'')+'. Reroute first.');
        return;
      }
      delete project.materials.trays[n];
      if(project.materials.bankMeta)delete project.materials.bankMeta[n];
      ui.tray=trayNames()[0]||null;
      ui.token=null; saveDraft(); render();
    });
    app.querySelectorAll('[data-token]').forEach(b=>b.onclick=()=>{ui.token=b.dataset.token; ui.tray=tokenTray(ui.token)||ui.tray; render();});
    app.querySelectorAll('[data-token-lit]').forEach(el=>el.oninput=()=>{const t=findToken(el.dataset.tokenLit); if(t){t.literal=el.value; saveDraft();}});
    app.querySelectorAll('[data-token-weight]').forEach(el=>el.onchange=()=>{const t=findToken(el.dataset.tokenWeight); if(t){t.weight=Number(el.value); saveDraft(); render();}});
    app.querySelectorAll('[data-duplicate-token]').forEach(b=>b.onclick=()=>{const [n,id]=b.dataset.duplicateToken.split(':'); const t=tray(n).find(x=>x.id===id); if(t){const cp=C.clone(t); cp.id=C.uid('tok'); tray(n).push(cp); ui.token=cp.id; saveDraft(); render();}});
    app.querySelectorAll('[data-close-token]').forEach(b=>b.onclick=()=>{ui.token=null;render();});
    app.querySelectorAll('[data-add-token]').forEach(b=>b.onclick=()=>{const n=b.dataset.addToken; const tok=C.token('',roleForTray(n)); tray(n).push(tok); ui.token=tok.id; saveDraft(); render();});
    app.querySelectorAll('[data-delete-token]').forEach(b=>b.onclick=()=>{const [n,id]=b.dataset.deleteToken.split(':'); project.materials.trays[n]=tray(n).filter(t=>t.id!==id); if(ui.token===id)ui.token=null; saveDraft(); render();});
    app.querySelectorAll('[data-lock]').forEach(b=>b.onclick=()=>{const t=findToken(b.dataset.lock); if(t){t.lockedLiteral=!t.lockedLiteral; saveDraft(); render();}});
    // Contextual navigation — navigate and select
    app.querySelectorAll('[data-focus-forms]').forEach(b=>b.onclick=()=>{ui.token=b.dataset.focusForms; ui.tray=tokenTray(ui.token)||ui.tray; navigateStep('forms');});
    app.querySelectorAll('[data-bulk-add]').forEach(b=>b.onclick=()=>{const n=b.dataset.bulkAdd; const ta=app.querySelector(`[data-bulk="${n}"]`); tray(n).push(...C.tokensFromText(ta.value,roleForTray(n))); ta.value=''; saveDraft(); render();});
    app.querySelectorAll('[data-dedupe]').forEach(b=>{b.onclick=()=>{const n=b.dataset.dedupe, seen=new Set(); project.materials.trays[n]=tray(n).filter(t=>{const k=t.literal.toLowerCase(); if(seen.has(k))return false; seen.add(k); return true;}); saveDraft(); render();};});
    app.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{tray(b.dataset.sort).sort((a,b)=>a.literal.localeCompare(b.literal)); saveDraft(); render();});
    app.querySelectorAll('[data-override]').forEach(el=>el.oninput=()=>{const [id,k]=el.dataset.override.split(':'); project.forms.overrides[id]=project.forms.overrides[id]||{}; project.forms.overrides[id][k]=el.value; saveDraft();});
    bindDrag(); bindDevices(); bindStanza(); bindFlow(); bindTriggers(); bindRunExport();
  }
  function handleSelect(key,val){ if(key==='forms.casePolicy')project.forms.casePolicy=val; else if(key==='forms.compoundPolicy')project.forms.compoundPolicy=val; else if(key.startsWith('tokrole:')){const t=findToken(key.split(':')[1]); if(t)t.role=val;} else if(key==='ui.stanza'){ui.stanza=val;} else if(key.startsWith('inputtray:')){const [,mid,idx]=key.split(':'); device(mid).inputs[+idx].tray=val;} else if(key.startsWith('inputrole:')){const [,mid,idx]=key.split(':'); device(mid).inputs[+idx].role=val;} else if(key.startsWith('slotdev:')){const [,sid,idx]=key.split(':'); stanza(sid).slots[+idx].deviceId=val;} else if(key.startsWith('slotrepeat:')){const [,sid,idx]=key.split(':'); stanza(sid).slots[+idx].repeat=val;} else if(key.startsWith('scene-stanza:'))project.flowScenes[+key.split(':')[1]].stanzaId=val; else if(key.startsWith('trig-tray:'))project.triggers[+key.split(':')[1]].condition.tray=val; else if(key.startsWith('bankrole:')){const n=key.split(':')[1]; project.materials.bankMeta=project.materials.bankMeta||{}; project.materials.bankMeta[n]=project.materials.bankMeta[n]||{}; project.materials.bankMeta[n].role=val;} else if(key.startsWith('trig-sample:')){const i=+key.split(':')[1]; project.triggers[i].condition=project.triggers[i].condition||{}; project.triggers[i].condition.term=val;} else if(key==='surface.family')project.surface.family=val; else if(key==='surface.traceMode')project.surface.traceMode=val; else if(key==='surface.theme')project.surface.theme=val; }
  function bindDrag(){
    app.querySelectorAll('[draggable="true"]').forEach(el=>{
      el.ondragstart=e=>{
        ui.drag=el.dataset.tokenDrag?{type:'token',data:el.dataset.tokenDrag}:el.dataset.slotDrag?{type:'slot',data:el.dataset.slotDrag}:el.dataset.sceneDrag?{type:'scene',data:el.dataset.sceneDrag}:el.dataset.routeDrag?{type:'route',data:el.dataset.routeDrag}:null;
        if(e.dataTransfer) e.dataTransfer.effectAllowed='move';
        el.classList.add('dragging');
      };
      el.ondragend=()=>{ui.drag=null; el.classList.remove('dragging');};
    });
    app.querySelectorAll('[data-bank-drop]').forEach(zone=>{
      zone.ondragover=e=>{if(ui.drag?.type==='token')e.preventDefault();};
      zone.ondrop=e=>{e.preventDefault(); if(ui.drag?.type==='token'){
        const [from,id]=ui.drag.data.split(':'); const to=zone.dataset.bankDrop; const tok=tray(from).find(t=>t.id===id);
        if(tok&&from!==to){project.materials.trays[from]=tray(from).filter(t=>t.id!==id); project.materials.trays[to].push(tok); ui.tray=to; saveDraft(); render();}
      }};
    });
    app.querySelectorAll('[data-route-drag]').forEach(zone=>{
      zone.ondragover=e=>{if(ui.drag?.type==='route')e.preventDefault();};
      zone.ondrop=e=>{e.preventDefault(); if(ui.drag?.type==='route'){
        const [fromDev,fromIdx]=ui.drag.data.split(':'); const [toDev,toIdx]=zone.dataset.routeDrag.split(':');
        if(fromDev===toDev && fromIdx!==toIdx){move(device(fromDev).routes,+fromIdx,+toIdx-+fromIdx); saveDraft(); render();}
      }};
    });
    app.querySelectorAll('[data-slot-drag]').forEach(zone=>{
      zone.ondragover=e=>{if(ui.drag?.type==='slot')e.preventDefault();};
      zone.ondrop=e=>{e.preventDefault(); if(ui.drag?.type==='slot'){
        const [fromSt,fromIdx]=ui.drag.data.split(':'); const [toSt,toIdx]=zone.dataset.slotDrag.split(':');
        if(fromSt===toSt && fromIdx!==toIdx){move(stanza(fromSt).slots,+fromIdx,+toIdx-+fromIdx); saveDraft(); render();}
      }};
    });
    app.querySelectorAll('[data-scene-drag]').forEach(zone=>{
      zone.ondragover=e=>{if(ui.drag?.type==='scene')e.preventDefault();};
      zone.ondrop=e=>{e.preventDefault(); if(ui.drag?.type==='scene'){
        const fromIdx=+ui.drag.data; const toIdx=+zone.dataset.sceneDrag;
        if(fromIdx!==toIdx){move(project.flowScenes,fromIdx,toIdx-fromIdx); saveDraft(); render();}
      }};
    });
  }
  function bindDevices(){ app.querySelectorAll('[data-device]').forEach(b=>b.onclick=()=>{ui.device=b.dataset.device;render();}); app.querySelector('[data-add-device]')?.addEventListener('click',()=>{const id=C.uid('ld'); const firstTray=firstValidTray(project)||trayNames()[0]||''; project.lineDevices.push({id,name:'NEW DEVICE',enabled:true,description:'Custom line device.',inputs:[{slot:'sample',tray:firstTray,role:'noun'}],routes:[{id:C.uid('rt'),name:'route',weight:100,template:'{sample:literal}.'}]}); ui.device=id; saveDraft(); render();}); app.querySelectorAll('[data-device-field]').forEach(el=>el.oninput=()=>{const [id,k]=el.dataset.deviceField.split(':'); device(id)[k]=el.value; saveDraft();}); app.querySelectorAll('[data-add-input]').forEach(b=>b.onclick=()=>{const firstTray=firstValidTray(project)||trayNames()[0]||''; device(b.dataset.addInput).inputs.push({slot:'new',tray:firstTray,role:'literal'}); saveDraft(); render();}); app.querySelectorAll('[data-del-input]').forEach(b=>b.onclick=()=>{const [id,i]=b.dataset.delInput.split(':'); device(id).inputs.splice(+i,1); saveDraft(); render();}); app.querySelectorAll('[data-input-slot]').forEach(el=>el.oninput=()=>{const [id,i]=el.dataset.inputSlot.split(':'); device(id).inputs[+i].slot=el.value.trim()||'slot'; saveDraft();}); app.querySelectorAll('[data-add-route]').forEach(b=>b.onclick=()=>{const d=device(b.dataset.addRoute); const first=d.inputs?.[0]?.slot||'sample'; d.routes.push({id:C.uid('rt'),name:'new',weight:50,template:`{${first}:literal}.`}); saveDraft(); render();}); app.querySelectorAll('[data-route-name]').forEach(el=>el.oninput=()=>{const [id,i]=el.dataset.routeName.split(':'); device(id).routes[+i].name=el.value; saveDraft();}); app.querySelectorAll('[data-route-weight]').forEach(el=>el.oninput=()=>{const [id,i]=el.dataset.routeWeight.split(':'); device(id).routes[+i].weight=Number(el.value); saveDraft();}); app.querySelectorAll('[data-route-template]').forEach(el=>{el.onfocus=()=>{ui.activeTemplate=el.dataset.routeTemplate;}; el.oninput=()=>{const [id,i]=el.dataset.routeTemplate.split(':'); device(id).routes[+i].template=el.value; ui.activeTemplate=el.dataset.routeTemplate; saveDraft();};}); app.querySelectorAll('[data-insert-value]').forEach(b=>b.onclick=()=>{const id=b.dataset.insertRoute; const i=Number(b.dataset.insertIndex); const token=b.dataset.insertValue; const key=`${id}:${i}`; const ta=app.querySelector(`[data-route-template="${key}"]`); if(!ta)return; const start=ta.selectionStart??ta.value.length, end=ta.selectionEnd??ta.value.length; ta.value=ta.value.slice(0,start)+token+ta.value.slice(end); const pos=start+token.length; ta.focus(); ta.setSelectionRange(pos,pos); device(id).routes[i].template=ta.value; ui.activeTemplate=key; saveDraft();}); app.querySelectorAll('[data-route-up]').forEach(b=>b.onclick=()=>{const [id,i]=b.dataset.routeUp.split(':'); move(device(id).routes,+i,-1); saveDraft(); render();}); app.querySelectorAll('[data-route-down]').forEach(b=>b.onclick=()=>{const [id,i]=b.dataset.routeDown.split(':'); move(device(id).routes,+i,1); saveDraft(); render();}); app.querySelectorAll('[data-del-route]').forEach(b=>b.onclick=()=>{const [id,i]=b.dataset.delRoute.split(':'); device(id).routes.splice(+i,1); saveDraft(); render();}); app.querySelectorAll('[data-toggle-device]').forEach(b=>b.onclick=()=>{const d=device(b.dataset.toggleDevice); d.enabled=!d.enabled; saveDraft(); render();}); app.querySelectorAll('[data-delete-device]').forEach(b=>b.onclick=()=>{project.lineDevices=project.lineDevices.filter(d=>d.id!==b.dataset.deleteDevice); ui.device=project.lineDevices[0]?.id; saveDraft(); render();}); }
  function bindStanza(){
    app.querySelector('[data-reset-stanza]')?.addEventListener('click',()=>{project.stanzaPatterns=C.classicStanzaPatterns(); ui.stanza='st_classic'; saveDraft(); render();});
    app.querySelector('[data-add-stanza]')?.addEventListener('click',()=>{const id=C.uid('st'); const first=project.lineDevices[0]; project.stanzaPatterns.push({id,name:'NEW STANZA',enabled:true,description:'Custom stanza pattern.',slots:first?[{id:C.uid('slot'),type:'device',deviceId:first.id,label:first.name,repeat:'once',chance:100}]:[]}); ui.stanza=id; saveDraft(); render();});
    app.querySelectorAll('[data-stanza-name]').forEach(el=>el.oninput=()=>{const st=stanza(el.dataset.stanzaName); if(st){st.name=el.value; saveDraft();}});
    app.querySelectorAll('[data-stanza-desc]').forEach(el=>el.oninput=()=>{const st=stanza(el.dataset.stanzaDesc); if(st){st.description=el.value; saveDraft();}});
    app.querySelectorAll('[data-delete-stanza]').forEach(b=>b.onclick=()=>{const id=b.dataset.deleteStanza; if(id==='st_classic')return; project.stanzaPatterns=project.stanzaPatterns.filter(st=>st.id!==id); (project.flowScenes||[]).forEach(sc=>{if(sc.stanzaId===id)sc.stanzaId=project.stanzaPatterns[0]?.id;}); ui.stanza=project.stanzaPatterns[0]?.id; saveDraft(); render();});
    app.querySelectorAll('[data-add-slot]').forEach(b=>b.onclick=()=>{selectedStanza().slots.push({id:C.uid('slot'),type:'device',deviceId:b.dataset.addSlot,label:device(b.dataset.addSlot).name,repeat:'once',chance:100}); saveDraft(); render();});
    app.querySelector('[data-add-breath]')?.addEventListener('click',()=>{selectedStanza().slots.push({id:C.uid('slot'),type:'breath',label:'BREATH',repeat:'once',chance:100}); saveDraft(); render();});
    app.querySelectorAll('[data-slot-up]').forEach(b=>b.onclick=()=>{const [sid,i]=b.dataset.slotUp.split(':'); move(stanza(sid).slots,+i,-1); saveDraft(); render();});
    app.querySelectorAll('[data-slot-down]').forEach(b=>b.onclick=()=>{const [sid,i]=b.dataset.slotDown.split(':'); move(stanza(sid).slots,+i,1); saveDraft(); render();});
    app.querySelectorAll('[data-slot-del]').forEach(b=>b.onclick=()=>{const [sid,i]=b.dataset.slotDel.split(':'); stanza(sid).slots.splice(+i,1); saveDraft(); render();});
    app.querySelectorAll('[data-slot-chance]').forEach(el=>el.oninput=()=>{const [sid,i]=el.dataset.slotChance.split(':'); stanza(sid).slots[+i].chance=Number(el.value); saveDraft();});
  }
  function bindFlow(){ app.querySelector('[data-add-scene]')?.addEventListener('click',()=>{project.flowScenes.push({id:C.uid('sc'),name:'New scene',stanzaId:project.stanzaPatterns[0].id,enabled:true,chance:100,mode:'loop'}); saveDraft(); render();}); app.querySelectorAll('[data-scene-name]').forEach(el=>el.oninput=()=>{project.flowScenes[+el.dataset.sceneName].name=el.value; saveDraft();}); app.querySelectorAll('[data-scene-chance]').forEach(el=>el.oninput=()=>{project.flowScenes[+el.dataset.sceneChance].chance=Number(el.value); saveDraft();}); app.querySelectorAll('[data-scene-del]').forEach(b=>b.onclick=()=>{project.flowScenes.splice(+b.dataset.sceneDel,1); saveDraft(); render();}); app.querySelectorAll('[data-scene-toggle]').forEach(b=>b.onclick=()=>{const s=project.flowScenes[+b.dataset.sceneToggle]; s.enabled=!s.enabled; saveDraft(); render();}); app.querySelectorAll('[data-scene-up]').forEach(b=>b.onclick=()=>{move(project.flowScenes,+b.dataset.sceneUp,-1); saveDraft(); render();}); app.querySelectorAll('[data-scene-down]').forEach(b=>b.onclick=()=>{move(project.flowScenes,+b.dataset.sceneDown,1); saveDraft(); render();}); }
  function bindTriggers(){ app.querySelector('[data-add-trigger]')?.addEventListener('click',()=>{const firstTray=firstValidTray(project)||trayNames()[0]||''; project.triggers.push({id:C.uid('tr'),name:'New trigger',enabled:true,condition:{tray:firstTray,term:''},chance:25,action:{type:'append',text:'[EVENT]'}}); saveDraft(); render();}); app.querySelectorAll('[data-trig-name]').forEach(el=>el.oninput=()=>{project.triggers[+el.dataset.trigName].name=el.value; saveDraft();}); app.querySelectorAll('[data-trig-term]').forEach(el=>el.oninput=()=>{project.triggers[+el.dataset.trigTerm].condition.term=el.value; saveDraft();}); app.querySelectorAll('[data-trig-chance]').forEach(el=>el.oninput=()=>{project.triggers[+el.dataset.trigChance].chance=Number(el.value); saveDraft();}); app.querySelectorAll('[data-trig-text]').forEach(el=>el.oninput=()=>{project.triggers[+el.dataset.trigText].action.text=el.value; saveDraft();}); app.querySelectorAll('[data-trig-toggle]').forEach(b=>b.onclick=()=>{const t=project.triggers[+b.dataset.trigToggle]; t.enabled=!t.enabled; saveDraft(); render();}); app.querySelectorAll('[data-trig-del]').forEach(b=>b.onclick=()=>{project.triggers.splice(+b.dataset.trigDel,1); saveDraft(); render();}); }
  function bindRunExport(){
    app.querySelector('[data-run]')?.addEventListener('click',runStart);
    app.querySelector('[data-pause]')?.addEventListener('click',pause);
    app.querySelector('[data-reset-run]')?.addEventListener('click',()=>{pause(); ui.runState={tick:0,queue:[]}; ui.events=[]; ui.selectedEvent=null; _runFollowing=true; render();});
    app.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>{ui.selectedEvent=b.dataset.event; pause(); renderPreserving();});
    app.querySelectorAll('[data-close-event]').forEach(b=>b.onclick=()=>{ui.selectedEvent=null;renderPreserving();});
    app.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>{const [status,id]=b.dataset.note.split(':'); const ev=ui.events.find(e=>e.id===id); if(ev){C.addOrUpdateNote(project,ev,status,''); saveDraft(); flash(status==='keep'?'Line kept.':'Line marked for repair.'); ui.selectedEvent=null; render();}});
    // Contextual jumps from inspector
    app.querySelectorAll('[data-jump-token]').forEach(b=>b.onclick=()=>{ui.token=b.dataset.jumpToken; ui.tray=tokenTray(ui.token)||ui.tray; ui.selectedEvent=null; navigateStep('samples');});
    app.querySelectorAll('[data-open-device]').forEach(b=>b.onclick=()=>{ui.device=b.dataset.openDevice; ui.selectedEvent=null; navigateStep('devices');});
    app.querySelectorAll('[data-open-note-event]').forEach(b=>b.onclick=()=>{ui.selectedEvent=b.dataset.openNoteEvent; renderPreserving();});
    app.querySelector('[data-build-preview]')?.addEventListener('click',buildPreview);
    // Assign iframe srcdoc via DOM property (avoids attribute entity encoding)
    const previewFrame=app.querySelector('.livePreviewFrame');
    if(previewFrame&&ui.preview.srcdoc&&!_savedPreviewIframe) previewFrame.srcdoc=ui.preview.srcdoc;
    app.querySelector('[data-save-html]')?.addEventListener('click',()=>download(C.exportProjectHtml(project),C.downloadName(project,'.taroke.html'),'text/html'));
    app.querySelector('[data-export-json]')?.addEventListener('click',()=>download(C.exportProjectJson(project),C.downloadName(project,'.taroke.json'),'application/json'));
    app.querySelector('[data-copy-json]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(C.exportProjectJson(project));flash('JSON copied.');}catch(e){flash('Copy unavailable.');}});
    // Run-stage scroll listener: update _runFollowing based on user scroll position
    const stageEl = app.querySelector('.stage.surfacePreview');
    if(stageEl){ stageEl.onscroll = function(){ _runFollowing = (this.scrollHeight - this.scrollTop - this.clientHeight) < 80; }; }
  }
  function runSelfTest(){
    try{
      const errors=C.validateProject(project).filter(x=>x.level==='error');
      const st={tick:0,queue:[]};
      const ev=C.generateEvent(project,st);
      const html=C.exportProjectHtml(project);
      const round=C.extractProjectFromText(html);
      if(errors.length) flash('Self-test failed: '+errors.length+' blocking issue(s).');
      else if(!round?.project?.title) flash('Self-test failed: export/import broken.');
      else flash('Self-test passed: model, generator, export/import.');
    }catch(e){ flash('Self-test failed: '+e.message); }
  }
  window.TarokeDebug={project:()=>C.clone(project),ui:()=>C.clone(ui),selfTest:runSelfTest,setStep:(step)=>navigateStep(step)};

  function move(arr,i,dir){ const j=i+dir; if(j<0||j>=arr.length)return; const [x]=arr.splice(i,1); arr.splice(j,0,x); }

  function runStart(){
    if(ui.timer) return;
    _runFollowing = true;
    tick(); // immediate first line
    ui.timer = setInterval(tick, Math.max(250, project.surface.speedMs||1200));
  }

  function tick(){
    const ev = C.generateEvent(project, ui.runState);
    ui.runState.tick++;
    // Capture outer scroll before render (run follow is handled separately)
    const work = document.querySelector('.work');
    const rail = document.querySelector('.rail');
    const workST = work ? work.scrollTop : 0;
    const railST = rail ? rail.scrollTop : 0;
    const stage = document.querySelector('.stage.surfacePreview');
    const nearBottom = !stage || (stage.scrollHeight - stage.scrollTop - stage.clientHeight) < 80;
    // Apply follow policy: if user scrolled up, don't follow; otherwise keep _runFollowing updated
    if(nearBottom) _runFollowing = true;
    ui.events.push(ev);
    if(ui.events.length>160) ui.events.shift();
    render();
    // Restore outer scroll and apply stage follow
    requestAnimationFrame(()=>{
      const work2 = document.querySelector('.work');
      const rail2 = document.querySelector('.rail');
      if(work2) work2.scrollTop = workST;
      if(rail2) rail2.scrollTop = railST;
      if(_runFollowing){
        const stage2 = document.querySelector('.stage.surfacePreview');
        if(stage2) stage2.scrollTop = stage2.scrollHeight;
      }
      // Rebind stage scroll listener after render
      const stageEl = document.querySelector('.stage.surfacePreview');
      if(stageEl){ stageEl.onscroll = function(){ _runFollowing = (this.scrollHeight - this.scrollTop - this.clientHeight) < 80; }; }
    });
  }

  // Legacy runTimer alias kept so existing tests that call TarokeDebug etc. still work
  function runTimer(){ runStart(); }

  function pause(){ if(ui.timer){clearInterval(ui.timer); ui.timer=null;} }
  function importFile(e){ const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{pause(); project=C.extractProjectFromText(r.result); _bootDraftProject=null; ui={...ui,events:[],selectedEvent:null,runState:{tick:0,queue:[]},token:null,tray:firstValidTray(project)||trayNames()[0]||ui.tray,device:project.lineDevices[0]?.id,stanza:project.stanzaPatterns[0]?.id,autosave:{...ui.autosave,draftFound:false,draftDismissed:false},preview:{srcdoc:null,error:null,builtSig:null}}; saveDraft(); flash('Imported project.'); navigateStep('source');}catch(err){flash('Import failed: '+err.message);} }; r.readAsText(f); e.target.value=''; }
  function download(content,name,type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},100); }

  window.addEventListener('beforeunload',()=>saveDraft());
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    let changed=false;
    if(ui.openSelect){ui.openSelect=null;changed=true;}
    else if(ui.selectedEvent){ui.selectedEvent=null;changed=true;}
    else if(ui.help){ui.help=false;changed=true;}
    if(changed)renderPreserving();
  });
  render();
})();
