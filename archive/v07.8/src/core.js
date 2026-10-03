(function(root, factory){
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TarokeCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';

  const SCHEMA_VERSION = '0.7-reset';
  const TRAY_DEFS = {
    above: {label:'ABOVE', role:'noun', desc:'actor / upper / subject samples'},
    below: {label:'BELOW', role:'noun', desc:'object / place / lower samples'},
    trans: {label:'TRANS', role:'verb', desc:'transitive action samples'},
    imper: {label:'IMPER', role:'verb', desc:'command samples'},
    intrans: {label:'INTRANS', role:'verb', desc:'state / movement samples'},
    texture: {label:'TEXTURE', role:'noun', desc:'surface / matter samples'},
    adjs: {label:'ADJS', role:'adjective', desc:'descriptor samples'},
    reserve: {label:'RESERVE', role:'mixed', desc:'off-stage material'}
  };
  const THEME_TOKENS = {
    night: {name:'Night bench', bg:'#050604', panel:'#11120d', panel2:'#171811', well:'#000000', text:'#f4ecd8', muted:'#9d9277', line:'#38362b', accent:'#a7ff3f', warn:'#ffb84d', surfaceBg:'#000000', surfaceText:'#f4ecd8', surfaceMuted:'#9d9277', surfaceAccent:'#a7ff3f'},
    paper: {name:'Paper machine', bg:'#d4cbb4', panel:'#eee4cf', panel2:'#f8eed8', well:'#fff9ec', text:'#14110b', muted:'#756d5e', line:'#5f5649', accent:'#ff5a2a', warn:'#c97300', surfaceBg:'#f5ead4', surfaceText:'#17110b', surfaceMuted:'#7b6f5e', surfaceAccent:'#ff5a2a'},
    amber: {name:'Amber monitor', bg:'#050403', panel:'#140f08', panel2:'#211609', well:'#000000', text:'#ffdba3', muted:'#b9894f', line:'#49361e', accent:'#ffb84d', warn:'#ff665d', surfaceBg:'#050403', surfaceText:'#ffdba3', surfaceMuted:'#b9894f', surfaceAccent:'#ffb84d'},
    cyan: {name:'Cold cyan', bg:'#020608', panel:'#081216', panel2:'#0e1b22', well:'#000000', text:'#e7fbff', muted:'#83aab4', line:'#24434b', accent:'#7de7ff', warn:'#ffb84d', surfaceBg:'#00070a', surfaceText:'#e7fbff', surfaceMuted:'#83aab4', surfaceAccent:'#7de7ff'}
  };
  const SURFACE_FAMILIES = {
    taroko: {name:'Taroko stream', desc:'vertical timed poem stream'},
    document: {name:'Document slip', desc:'paper/archive surface'},
    split: {name:'Split apparatus', desc:'poem plus trace evidence'},
    projection: {name:'Projection', desc:'large performance surface'},
    patch: {name:'Patch surface', desc:'machine visible beside output'}
  };

  const IRREGULAR_PLURALS = {man:'men', woman:'women', child:'children', person:'people', mouse:'mice', tooth:'teeth', foot:'feet', goose:'geese', ox:'oxen', sheep:'sheep', deer:'deer', fish:'fish', aircraft:'aircraft', series:'series', species:'species', cactus:'cacti', focus:'foci', fungus:'fungi', nucleus:'nuclei', syllabus:'syllabi', analysis:'analyses', crisis:'crises', thesis:'theses', diagnosis:'diagnoses', phenomenon:'phenomena', criterion:'criteria'};
  const IRREGULAR_VERB3 = {be:'is', have:'has', do:'does', go:'goes'};
  const F_END_EXCEPTIONS = new Set(['roof','belief','chef','chief','proof','reef','cliff','safe']);

  function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4); }
  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function token(literal, role){ return { id: uid('tok'), literal: String(literal ?? '').trim(), role: role || 'literal', weight: 1, lockedLiteral: false }; }
  function roleForTray(tray){ return TRAY_DEFS[tray]?.role || 'literal'; }
  function projectTrayDefs(project){
    const meta = project?.materials?.bankMeta || {};
    const trays = project?.materials?.trays || {};
    const out = {};
    Object.keys(trays).forEach(k=>{
      const m = meta[k] || {};
      out[k] = Object.assign(
        {label:(TRAY_DEFS[k]?.label || k.toUpperCase()), role:(TRAY_DEFS[k]?.role || 'literal'), desc:(TRAY_DEFS[k]?.desc || 'custom sample bank')},
        m
      );
      if (!out[k].label) out[k].label = k.toUpperCase();
      if (!out[k].role)  out[k].role  = 'literal';
      if (!out[k].desc)  out[k].desc  = 'custom sample bank';
    });
    return out;
  }
  function tokensFromText(text, role){ return String(text||'').split(/[\n,]+|\s{2,}/).map(s=>s.trim()).filter(Boolean).map(s=>token(s, role)); }
  function normalizeIdLabel(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'') || 'taroke_rimix'; }

  function classicLineDevices(){
    return [
      { id:'ld_path', name:'PATH', enabled:true, description:'Actor / action / object line device.', inputs:[{slot:'above', tray:'above', role:'noun'}, {slot:'trans', tray:'trans', role:'verb'}, {slot:'below', tray:'below', role:'noun'}], routes:[
        {id:'rt_path_plural', name:'plural', weight:55, template:'{above:plural} {trans:base} the {below:literal}.'},
        {id:'rt_path_singular', name:'singular', weight:25, template:'{article:a} {above:singular} {trans:thirdSingular} the {below:literal}.'},
        {id:'rt_path_literal', name:'literal rough', weight:20, template:'{above:literal} {trans:literal} the {below:literal}.'}
      ]},
      { id:'ld_site', name:'SITE', enabled:true, description:'Movement / state line device.', inputs:[{slot:'thing', tray:'above', role:'noun'}, {slot:'intrans', tray:'intrans', role:'verb'}], routes:[
        {id:'rt_site_plural', name:'plural', weight:60, template:'{thing:plural} {intrans:base}.'},
        {id:'rt_site_singular', name:'singular', weight:25, template:'{article:a} {thing:singular} {intrans:thirdSingular}.'},
        {id:'rt_site_literal', name:'literal rough', weight:15, template:'{thing:literal} {intrans:literal}.'}
      ]},
      { id:'ld_cave', name:'CAVE', enabled:true, description:'Command / texture / breath line device.', inputs:[{slot:'imper', tray:'imper', role:'verb'}, {slot:'adjs', tray:'adjs', role:'adjective'}, {slot:'texture', tray:'texture', role:'noun'}], routes:[
        {id:'rt_cave_command', name:'command', weight:80, template:'{imper:literal} the {adjs:literal} {texture:singular}...'},
        {id:'rt_cave_signal', name:'signal command', weight:20, template:'{imper:uppercase} the {adjs:literal} {texture:singular}...'}
      ]}
    ];
  }
  function classicStanzaPatterns(){
    return [{
      id:'st_classic', name:'Classic Taroko stanza', enabled:true, description:'PATH, optional SITE loop, PATH, breath, CAVE, breath.',
      slots:[
        {id:uid('slot'), type:'device', deviceId:'ld_path', label:'PATH', repeat:'once', chance:100},
        {id:uid('slot'), type:'device', deviceId:'ld_site', label:'SITE LOOP', repeat:'loop', chance:62, max:4},
        {id:uid('slot'), type:'device', deviceId:'ld_path', label:'PATH', repeat:'once', chance:100},
        {id:uid('slot'), type:'breath', label:'BREATH', repeat:'once', chance:100},
        {id:uid('slot'), type:'device', deviceId:'ld_cave', label:'CAVE', repeat:'once', chance:100},
        {id:uid('slot'), type:'breath', label:'BREATH', repeat:'once', chance:100}
      ]
    }];
  }
  function defaultProject(){
    const trays = {
      above: ['grave','paper-body','unknown-box','gateway','baby','office','joint','guardrail','giant-hole'].map(s=>token(s,'noun')),
      below: ['floor','wall','basement','baby','rat','drug','document','piece'].map(s=>token(s,'noun')),
      trans: ['carry','push','shake','refuse','flirt','spank','uplift','expire'].map(s=>token(s,'verb')),
      imper: ['enter','leave','drink','twist','package','mark'].map(s=>token(s,'verb')),
      intrans: ['rush','rise','wait','soak','expire'].map(s=>token(s,'verb')),
      texture: ['paper','foil','garbage','shroud','receipt','sticky'].map(s=>token(s,'noun')),
      adjs: ['wet','broken','folded','legal','black','exploded','rainbow'].map(s=>token(s,'adjective')),
      reserve: []
    };
    return {
      schemaVersion: SCHEMA_VERSION,
      project:{title:'Grave sample', author:'Mozare', sourceTitle:'Taroko Gorge', sourceUrl:'https://collection.eliterature.org/3/works/taroko-gorge/taroko-gorge.html', statement:'A local-first remix machine for shaping source samples, form modulation, line devices, stanza patterns, flow scenes, triggers, output surface, and event tape.', credits:'Made with TAROKE RIMIXER.', language:'en'},
      workbench:{theme:'night', relief:'medium', density:'standard', texture:'source'},
      materials:{trays, bankMeta: clone(TRAY_DEFS)},
      forms:{language:'en', casePolicy:'preserve', compoundPolicy:'head', overrides:{}},
      lineDevices: classicLineDevices(),
      stanzaPatterns: classicStanzaPatterns(),
      flowScenes:[{id:'sc_classic', name:'Classic scene', stanzaId:'st_classic', enabled:true, chance:100, mode:'loop'}],
      triggers:[{id:'tr_box', name:'box intrusion', enabled:true, condition:{tray:'above', term:'unknown-box'}, chance:35, action:{type:'append', text:'[BOX EVENT]'}}],
      surface:{family:'taroko', traceMode:'hidden', theme:'night', speedMs:1200, retention:28, fontSize:21, lineHeight:1.48, showTitle:true, showSource:true, showTick:false},
      notes:[], meta:{createdWith:'TAROKE RIMIXER', updatedAt:new Date().toISOString()}
    };
  }

  function splitHead(word){ const s=String(word||''); const m=s.match(/^(.*[-\s])([^\-\s]+)$/); return m?[m[1],m[2]]:['',s]; }
  function styleLike(src,out){ src=String(src||''); out=String(out||''); if(!src)return out; if(src.toUpperCase()===src && /[A-Z]/.test(src))return out.toUpperCase(); if(src.toLowerCase()===src)return out.toLowerCase(); if(src[0]===src[0]?.toUpperCase() && src.slice(1)===src.slice(1).toLowerCase())return out[0]?.toUpperCase()+out.slice(1).toLowerCase(); return out; }
  function pluralBase(lower){ lower=String(lower||'').toLowerCase(); if(IRREGULAR_PLURALS[lower])return IRREGULAR_PLURALS[lower]; if(/[^aeiou]y$/.test(lower))return lower.slice(0,-1)+'ies'; if(/(s|x|z|ch|sh)$/.test(lower))return lower+'es'; if(/fe$/.test(lower))return lower.slice(0,-2)+'ves'; if(/f$/.test(lower) && !F_END_EXCEPTIONS.has(lower))return lower.slice(0,-1)+'ves'; if(/o$/.test(lower) && !/(photo|piano|radio|studio|video|zoo)$/.test(lower))return lower+'es'; return lower+'s'; }
  function verb3Base(lower){ lower=String(lower||'').toLowerCase(); if(IRREGULAR_VERB3[lower])return IRREGULAR_VERB3[lower]; if(/[^aeiou]y$/.test(lower))return lower.slice(0,-1)+'ies'; if(/(s|x|z|ch|sh|o)$/.test(lower))return lower+'es'; return lower+'s'; }
  function applyCase(project,s){ const p=project?.forms?.casePolicy||'preserve'; if(p==='upper')return String(s).toUpperCase(); if(p==='lower')return String(s).toLowerCase(); if(p==='title')return String(s).replace(/\b\w/g,c=>c.toUpperCase()); return s; }
  function formToken(project,tok,form='literal'){ form=String(form||'literal').trim(); if(!tok)return ''; const lit=String(tok.literal||''); const ov=project?.forms?.overrides?.[tok.id]||{}; if(tok.lockedLiteral && !['uppercase','lowercase','title'].includes(form))return applyCase(project,lit); if(form==='literal' || form==='base')return applyCase(project,ov[form]||lit); if(form==='literal+s')return applyCase(project,lit+'s'); if(form==='uppercase')return lit.toUpperCase(); if(form==='lowercase')return lit.toLowerCase(); if(form==='title')return lit.replace(/\b\w/g,c=>c.toUpperCase()); const [prefix,head]=splitHead(lit); const low=head.toLowerCase(); let made=head; if(form==='singular')made=ov.singular||head; else if(form==='plural')made=ov.plural||pluralBase(low); else if(form==='thirdSingular')made=ov.thirdSingular||verb3Base(low); else if(form==='imperative')made=ov.imperative||head; else made=ov[form]||head; const out=prefix+styleLike(project?.forms?.compoundPolicy==='literal'?lit:head,made); return applyCase(project,out); }
  function articleFor(phrase){ const w=String(phrase||'').trim().replace(/^[^a-zA-Z]+/,''); if(!w)return 'a'; if(/^(honest|hour|heir|honor)/i.test(w))return 'an'; if(/^(university|user|unit|one\b)/i.test(w))return 'a'; return /^[aeiou]/i.test(w)?'an':'a'; }
  function choose(arr,rng=Math.random){ return arr&&arr.length?arr[Math.floor(rng()*arr.length)]:null; }
  function weighted(arr,rng=Math.random){ const items=(arr||[]).filter(x=>Number(x.weight??x.chance??0)>0); const sum=items.reduce((a,b)=>a+Number(b.weight??b.chance??0),0); if(!items.length||!sum)return (arr||[])[0]||null; let r=rng()*sum; for(const it of items){r-=Number(it.weight??it.chance??0); if(r<=0)return it;} return items[items.length-1]; }
  function getTrayTokens(project,name){ return (project?.materials?.trays?.[name]||[]).filter(t=>t&&String(t.literal||'').trim()); }
  function getDevice(project,id){ return (project?.lineDevices||project?.lineMachines||[]).find(m=>m.id===id); }
  function getStanza(project,id){ return (project?.stanzaPatterns||[]).find(s=>s.id===id); }
  function activeScenes(project){ return (project.flowScenes||[]).filter(s=>s.enabled && Number(s.chance??100)>0 && getStanza(project,s.stanzaId)?.enabled); }
  function expandStanza(project, stanza, rng=Math.random){
    const seq=[]; if(!stanza)return seq;
    for(const slot of stanza.slots||[]){
      if(rng()*100 >= Number(slot.chance??100)) continue;
      if(slot.type==='breath'){ seq.push({type:'breath', label:'BREATH'}); continue; }
      if(slot.type!=='device') continue;
      if(slot.repeat==='loop'){
        let count=0, max=Number(slot.max||4);
        while(count<max && rng()*100 < Number(slot.chance??60)){ seq.push({type:'device', deviceId:slot.deviceId, label:slot.label||'LOOP'}); count++; }
      } else seq.push({type:'device', deviceId:slot.deviceId, label:slot.label||'DEVICE'});
    }
    return seq;
  }
  function cleanSurfaceText(s){
    return String(s||'')
      .replace(/\{[^}]+\}/g,'')
      .replace(/\s+([.,;:!?])/g,'$1')
      .replace(/([.,;:!?])\s*([.,;:!?])+/g,'$1')
      .replace(/(^|\s)[.,;:!?]+\s*/g,'$1')
      .replace(/\(\s*\)/g,'')
      .replace(/\[\s*\]/g,'')
      .replace(/\s{2,}/g,' ')
      .replace(/\s+([.?!])/g,'$1')
      .trim();
  }
  function nextSlot(project, runState={}, rng=Math.random){
    runState.queue = Array.isArray(runState.queue) ? runState.queue : [];
    if(!runState.queue.length){
      const scene = weighted(activeScenes(project), rng) || (project.flowScenes||[])[0];
      const stanza = getStanza(project, scene?.stanzaId) || (project.stanzaPatterns||[])[0];
      runState.currentScene = scene?.id || null; runState.currentStanza = stanza?.id || null;
      runState.queue = expandStanza(project, stanza, rng);
      if(!runState.queue.length) runState.queue = [{type:'breath',label:'BREATH'}];
    }
    return runState.queue.shift();
  }
  function renderDeviceEvent(project, device, slot, runState={}, rng=Math.random){
    const route=weighted(device.routes,rng)||{name:'empty',template:''}; const selectedTokens={}, selected={}, rendered={};
    for(const input of device.inputs||[]){ const tok=weighted(getTrayTokens(project,input.tray),rng); selectedTokens[input.slot]=tok; selected[input.slot]=tok?tok.literal:''; }
    // Track which slots are actually consumed by the chosen route template.
    // consumedDirect: slot explicitly referenced via {slotName:form}.
    // consumedDerived: slot read by {article:a} to choose "a" vs "an".
    const consumedDirect=new Set(), consumedDerived=new Set();
    let surface=cleanSurfaceText(String(route.template||'').replace(/\{([^}:]+):?([^}]*)\}/g,(_,slotName,form)=>{
      slotName=String(slotName||'').trim(); form=String(form||'literal').trim();
      if(slotName==='article' && form==='a'){ const first=(device.inputs||[]).find(i=>i.role==='noun')||(device.inputs||[])[0]; if(first?.slot) consumedDerived.add(first.slot); const phrase=formToken(project, selectedTokens[first?.slot], 'singular'); return articleFor(phrase); }
      const out=formToken(project, selectedTokens[slotName], form||'literal'); rendered[slotName]=out; if(selectedTokens[slotName]) consumedDirect.add(slotName); return out;
    }));
    // consumedInputs: authoritative set of inputs that contributed to this rendered line.
    const consumedInputs=(device.inputs||[]).reduce((acc,inp)=>{
      const tok=selectedTokens[inp.slot]; if(!tok) return acc;
      const direct=consumedDirect.has(inp.slot), derived=consumedDerived.has(inp.slot);
      if(direct||derived) acc.push({slot:inp.slot,tray:inp.tray,tokenId:tok.id,sourceLiteral:tok.literal,direct,derived});
      return acc;
    },[]);
    // Trigger evaluation: an input is eligible only if it appears in consumedInputs.
    // No chance RNG call when no consumed candidate matches the trigger condition.
    let trigger=null;
    for(const tr of project.triggers||project.rareEvents||[]){
      if(!tr.enabled) continue;
      const tray=tr.condition?.tray||tr.triggerLayer, term=tr.condition?.term||tr.triggerTerm;
      const candidates=consumedInputs.filter(ci=>ci.tray===tray && (!term || ci.sourceLiteral.toLowerCase()===String(term).toLowerCase()));
      if(!candidates.length) continue;
      if(rng()*100 < Number(tr.chance||0)){
        const matched=candidates[0];
        trigger={id:tr.id,name:tr.name,text:tr.action?.text||tr.insertion||'',type:tr.action?.type||tr.placement||'append',conditionTray:tray,conditionTerm:term||'',matchedSlot:matched.slot,matchedTokenId:matched.tokenId,matchedSourceLiteral:matched.sourceLiteral};
        if(trigger.type==='prepend') surface=trigger.text+' '+surface;
        else if(trigger.type==='replace') surface=trigger.text;
        else surface=surface+' '+trigger.text;
        break;
      }
    }
    const tick=Number(runState.tick||0), id='ev_'+String(tick).padStart(4,'0');
    const trace=(device.inputs||[]).map(i=>`${i.slot}=${rendered[i.slot]||selected[i.slot]||''}`).join(' / ');
    return {id,tick,type:'line',sceneId:runState.currentScene,stanzaId:runState.currentStanza,slotLabel:slot?.label||'',deviceId:device.id,deviceName:device.name,route:route.name,routeId:route.id,selected,selectedTokens,rendered,consumedInputs,surface,trigger,trace:`${String(tick).padStart(4,'0')} ${device.name} / ${route.name} / ${trace}`};
  }
  function generateEvent(project, runState={}, rng=Math.random){
    const tick=Number(runState.tick||0); let slot=nextSlot(project,runState,rng);
    if(slot.type==='breath')return {id:'ev_'+String(tick).padStart(4,'0'), tick, type:'breath', surface:'', trace:`${String(tick).padStart(4,'0')} BREATH / stanza boundary`, stanzaId:runState.currentStanza, sceneId:runState.currentScene};
    const device=getDevice(project, slot.deviceId); if(!device || !device.enabled) return {id:'ev_'+String(tick).padStart(4,'0'), tick, type:'error', surface:'', trace:'Missing or disabled device', error:'NO_DEVICE'};
    return renderDeviceEvent(project, device, slot, runState, rng);
  }
  function addOrUpdateNote(project,event,status='repair',text=''){ project.notes=project.notes||[]; let n=project.notes.find(x=>x.eventId===event.id); if(!n){ n={id:uid('note'), eventId:event.id, status, note:text, surface:event.surface, event:clone(event), linkedTokenIds:Object.values(event.selectedTokens||{}).filter(Boolean).map(t=>t.id), linkedDeviceId:event.deviceId, linkedStanzaId:event.stanzaId, updatedAt:new Date().toISOString()}; project.notes.push(n);} else {n.status=status; n.note=text??n.note; n.event=clone(event); n.surface=event.surface; n.updatedAt=new Date().toISOString();} return n; }
  function validateProject(project){
    const issues=[];
    const push=(level,area,message,action)=>issues.push({level,area,message,action});
    const defs=projectTrayDefs(project);
    Object.keys(project?.materials?.trays||{}).forEach(name=>{
      const def=defs[name]||{label:name};
      const c=getTrayTokens(project,name).length;
      if(name!=='reserve'&&c===0)push('warning','samples.'+name,`${def.label} has no samples. Devices using it will print blanks.`,'Add samples or reroute the device input.');
      if(name!=='reserve'&&c>0&&c<3)push('note','samples.'+name,`${def.label} has only ${c} sample${c===1?'':'s'}. Repetition will be strong.`,'Accept the pressure or add more samples.');
    });
    (project.lineDevices||[]).forEach(d=>{
      if(!d.name)push('error','devices.'+d.id,'A line device has no name.','Name the device.');
      if(!d.inputs?.length)push('error','devices.'+d.id,`${d.name} has no input slots.`,'Add at least one slot.');
      if(!d.routes?.length)push('error','devices.'+d.id,`${d.name} has no routes.`,'Add a route template.');
      const slots=new Set((d.inputs||[]).map(i=>i.slot));
      (d.inputs||[]).forEach(i=>{ if(!project?.materials?.trays?.[i.tray]) push('error','devices.'+d.id,`${d.name} input ${i.slot} points to missing bank ${i.tray}.`,'Choose an existing sample bank.'); });
      (d.routes||[]).forEach(r=>{
        const mentioned=[...String(r.template||'').matchAll(/\{([^}:]+):?([^}]*)\}/g)].map(x=>x[1]).filter(s=>s!=='article');
        mentioned.forEach(s=>{ if(!slots.has(s))push('error','devices.'+d.id,`${d.name} route “${r.name||'untitled'}” uses unknown slot {${s}}.`,'Add a matching input slot or change the template.'); });
      });
    });
    (project.stanzaPatterns||[]).forEach(st=>{ if(!st.slots?.some(s=>s.type==='device'))push('error','stanza.'+st.id,`${st.name} has no line device slots.`,'Drag or add at least one device.'); });
    if(!activeScenes(project).length)push('error','flow','No enabled scene can run.','Enable one flow scene and stanza pattern.');
    return issues;
  }
  function _hasProp(obj, key){ return obj != null && Object.prototype.hasOwnProperty.call(obj, key); }
  function migrateProject(input){
    const base = defaultProject();
    const p = clone(input || {});
    const inp = input || {};

    if (p.lineMachines && !p.lineDevices) p.lineDevices = p.lineMachines;
    p.schemaVersion = SCHEMA_VERSION;
    p.project   = Object.assign({}, base.project,   p.project   || {});
    p.workbench = Object.assign({}, base.workbench, p.workbench || p.appearance || {});

    // A/B/C: Tray selection — explicit modern trays > legacy dictionary > default
    const hasExplicitTrays = _hasProp(inp.materials, 'trays');
    const hasLegacyDict    = _hasProp(inp, 'dictionary');

    let rawTrays;
    if (hasExplicitTrays) {
      if (!p.materials || typeof p.materials !== 'object') p.materials = {};
      rawTrays = p.materials.trays || {};
    } else if (hasLegacyDict) {
      p.materials = (p.materials && typeof p.materials === 'object') ? p.materials : {};
      rawTrays = clone(inp.dictionary || {});
    } else {
      p.materials = clone(base.materials);
      rawTrays = clone(base.materials.trays);
    }

    // D: bankMeta — only for trays that actually exist; imported meta wins over defaults
    const rawBankMeta = inp.materials?.bankMeta;
    const importedBankMeta = (rawBankMeta && typeof rawBankMeta === 'object') ? clone(rawBankMeta) : {};
    const bankMeta = {};
    Object.keys(rawTrays).forEach(k => {
      const m = importedBankMeta[k] || {};
      bankMeta[k] = Object.assign(
        {label:(TRAY_DEFS[k]?.label || k.toUpperCase()), role:(TRAY_DEFS[k]?.role || 'literal'), desc:(TRAY_DEFS[k]?.desc || 'custom sample bank')},
        m
      );
      if (!bankMeta[k].label) bankMeta[k].label = k.toUpperCase();
      if (!bankMeta[k].role)  bankMeta[k].role  = 'literal';
      if (!bankMeta[k].desc)  bankMeta[k].desc  = 'custom sample bank';
    });

    // Normalize tokens and repair duplicate token IDs
    const seenIds = new Map();
    const repairs = [];
    const trays = {};
    Object.keys(rawTrays).forEach(k => {
      const trayRole = bankMeta[k]?.role || roleForTray(k);
      trays[k] = (rawTrays[k] || []).map((x, idx) => {
        const tok = typeof x === 'string'
          ? token(x, trayRole)
          : Object.assign({id: uid('tok'), literal: '', role: trayRole, weight: 1, lockedLiteral: false}, x);
        if (!tok.id) tok.id = uid('tok');
        if (seenIds.has(tok.id)) {
          const prev = seenIds.get(tok.id);
          const newId = 'tok_' + k + '_dup_' + idx;
          repairs.push({originalId: tok.id, newId, bank: k, index: idx, prevBank: prev.bank});
          tok.id = newId;
        } else {
          seenIds.set(tok.id, {bank: k, idx});
        }
        return tok;
      });
    });

    p.materials.trays   = trays;
    p.materials.bankMeta = bankMeta;
    p.forms = Object.assign({}, base.forms, p.forms || {});

    // E: Collections — absent → use defaults; explicitly present (even empty array) → preserve
    const hasLD = _hasProp(inp, 'lineDevices') || _hasProp(inp, 'lineMachines');
    const hasSP = _hasProp(inp, 'stanzaPatterns');
    const hasFS = _hasProp(inp, 'flowScenes');
    const hasTR = _hasProp(inp, 'triggers') || _hasProp(inp, 'rareEvents');

    p.lineDevices    = hasLD ? (Array.isArray(p.lineDevices) ? p.lineDevices : []) : base.lineDevices;
    p.stanzaPatterns = hasSP ? (Array.isArray(p.stanzaPatterns) ? p.stanzaPatterns : []) : base.stanzaPatterns;
    p.flowScenes     = hasFS ? (Array.isArray(p.flowScenes) ? p.flowScenes : []) : base.flowScenes;

    if (!hasTR) {
      p.triggers = base.triggers;
    } else if (Array.isArray(p.triggers)) {
      // preserve as-is
    } else if (Array.isArray(p.rareEvents)) {
      p.triggers = p.rareEvents.map(r => ({
        id: r.id || uid('tr'), name: r.name, enabled: r.enabled,
        condition: {tray: r.triggerLayer, term: r.triggerTerm},
        chance: r.chance, action: {type: r.placement || 'append', text: r.insertion}
      }));
    } else {
      p.triggers = [];
    }

    // F: Surface — merge defaults, then enforce global invariants (documented)
    // Invariants: showTick=false (no visible tick policy), family='taroko' (single surface family)
    p.surface = Object.assign({}, base.surface, p.surface || {});
    p.surface.showTick = false;
    p.surface.family   = 'taroko';

    p.notes = Array.isArray(p.notes) ? p.notes.map(n => {
      const x = clone(n);
      if (x.surface) x.surface = cleanSurfaceText(x.surface);
      if (x.event && x.event.surface) x.event.surface = cleanSurfaceText(x.event.surface);
      return x;
    }) : [];

    p.meta = Object.assign({}, base.meta, p.meta || {});
    // Preserve existing provenance; merge with any new repairs from this pass.
    // New repairs for the same newId replace the old entry; all others are kept.
    const prevRepairs = Array.isArray(inp.meta?.importRepairs) ? clone(inp.meta.importRepairs) : [];
    const newRepairIds = new Set(repairs.map(r => r.newId));
    const mergedRepairs = [...prevRepairs.filter(r => !newRepairIds.has(r.newId)), ...repairs];
    delete p.meta.importRepairs;
    if (mergedRepairs.length) p.meta.importRepairs = mergedRepairs;

    return p;
  }
  function downloadName(project, ext){ return normalizeIdLabel(project.project?.title || 'taroke_rimix') + ext; }
  function surfaceCss(project){
    const theme=THEME_TOKENS[project.surface?.theme]||THEME_TOKENS.night;
    const size=Number(project.surface?.fontSize||21), lh=Number(project.surface?.lineHeight||1.48);
    const bg=theme.surfaceBg, text=theme.surfaceText, muted=theme.surfaceMuted, accent=theme.surfaceAccent;
    const traceHidden = project.surface?.traceMode==='hidden';
    return `:root{--bg:${bg};--text:${text};--muted:${muted};--accent:${accent}}body{margin:0;background:var(--bg);color:var(--text);font:${size}px/${lh} ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:hidden}.wrap{height:100vh;display:grid;grid-template-rows:auto 1fr ${traceHidden?'0':'auto'}}.head{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);padding:16px 22px;border-bottom:1px solid color-mix(in srgb,var(--muted),transparent 55%)}.stage{padding:32px;overflow:auto}.line{margin:0 0 14px}.tick{display:none}.trace{${traceHidden?'display:none;':''}font-size:12px;color:var(--muted);border-top:1px solid color-mix(in srgb,var(--muted),transparent 55%);padding:10px 18px;white-space:nowrap;overflow:auto;background:var(--bg)}.rare{color:var(--accent)}`;
  }
  function standaloneRuntime(){ return `(()=>{const project=JSON.parse(document.getElementById('taroke-project').textContent);${miniRuntime()}let state={tick:0,queue:[]};const stage=document.getElementById('stage'),trace=document.getElementById('trace'),max=project.surface?.retention||28;document.getElementById('head').textContent=(project.project?.title||'Untitled')+' / '+(project.project?.author||'')+' / after '+(project.project?.sourceTitle||'Taroko');function line(){const e=generateEvent(project,state);state.tick++;if(e.type!=='breath'){const p=document.createElement('p');p.className='line';p.innerHTML=esc(e.surface);stage.appendChild(p);}while(stage.children.length>max)stage.removeChild(stage.firstChild);stage.scrollTop=stage.scrollHeight;if(trace)trace.textContent=e.trace}line();setInterval(line,Math.max(250,project.surface?.speedMs||1200));})();`; }
  function miniRuntime(){ return String.raw`const IRR=${JSON.stringify(IRREGULAR_PLURALS)},V3=${JSON.stringify(IRREGULAR_VERB3)};function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function toks(n){return (project.materials?.trays?.[n]||[]).filter(x=>x.literal)}function split(w){const m=String(w||'').match(/^(.*[-\s])([^\-\s]+)$/);return m?[m[1],m[2]]:['',String(w||'')]}function style(src,out){if(src.toUpperCase()===src&&/[A-Z]/.test(src))return out.toUpperCase();if(src.toLowerCase()===src)return out.toLowerCase();if(src[0]===src[0]?.toUpperCase()&&src.slice(1)===src.slice(1).toLowerCase())return out[0]?.toUpperCase()+out.slice(1).toLowerCase();return out}function plbase(l){return IRR[l]||(/[^aeiou]y$/.test(l)?l.slice(0,-1)+'ies':/(s|x|z|ch|sh)$/.test(l)?l+'es':l+'s')}function v3base(l){return V3[l]||(/[^aeiou]y$/.test(l)?l.slice(0,-1)+'ies':/(s|x|z|ch|sh|o)$/.test(l)?l+'es':l+'s')}function form(t,f){f=String(f||'literal').trim();let lit=t?.literal||'';if(t?.lockedLiteral&&!['uppercase','lowercase','title'].includes(f))return lit;if(f==='literal'||f==='base')return lit;if(f==='uppercase')return lit.toUpperCase();if(f==='lowercase')return lit.toLowerCase();if(f==='literal+s')return lit+'s';let [pre,head]=split(lit),l=head.toLowerCase(),m=head;if(f==='plural')m=plbase(l);else if(f==='thirdSingular')m=v3base(l);return pre+style(head,m)}function clean(s){return String(s||'').replace(/\{[^}]+\}/g,'').replace(/\s+([.,;:!?])/g,'$1').replace(/([,;:!?])\s*([,;:!?])+/g,'$1').replace(/(^|\s)[,;:!?]+\s*/g,'$1').replace(/\(\s*\)/g,'').replace(/\[\s*\]/g,'').replace(/\s{2,}/g,' ').replace(/\s+([.?!])/g,'$1').trim()}function article(w){return /^[aeiou]/i.test(String(w||'').trim())?'an':'a'}function wgt(a){let items=(a||[]).filter(x=>+(x.weight??x.chance)>0),sum=items.reduce((n,x)=>n+ +(x.weight??x.chance),0),r=Math.random()*sum;for(const x of items){r-=+(x.weight??x.chance);if(r<=0)return x}return items[0]||a?.[0]}function dev(id){return (project.lineDevices||[]).find(d=>d.id===id)}function stanza(id){return (project.stanzaPatterns||[]).find(s=>s.id===id)}function exp(st){let out=[];(st?.slots||[]).forEach(slot=>{if(Math.random()*100>+(slot.chance??100))return;if(slot.type==='breath')out.push({type:'breath'});else if(slot.repeat==='loop'){let c=0,max=+(slot.max||4);while(c<max&&Math.random()*100<=+(slot.chance??60)){out.push({type:'device',deviceId:slot.deviceId});c++}}else out.push({type:'device',deviceId:slot.deviceId})});return out}function slot(state){if(!state.queue.length){let sc=wgt((project.flowScenes||[]).filter(s=>s.enabled));state.currentScene=sc?.id;state.currentStanza=sc?.stanzaId;state.queue=exp(stanza(sc?.stanzaId));if(!state.queue.length)state.queue=[{type:'breath'}]}return state.queue.shift()}function generateEvent(project,state){let s=slot(state),tick=state.tick||0;if(s.type==='breath')return{id:'ev_'+String(tick).padStart(4,'0'),tick,type:'breath',surface:'',trace:String(tick).padStart(4,'0')+' BREATH'};let d=dev(s.deviceId),r=wgt(d?.routes||[]),sel={},rend={};(d?.inputs||[]).forEach(i=>sel[i.slot]=wgt(toks(i.tray)));let cdir=new Set(),cderiv=new Set();let surf=clean((r?.template||'').replace(/\{([^}:]+):?([^}]*)\}/g,(_,sl,f)=>{sl=String(sl||'').trim();f=String(f||'literal').trim();if(sl==='article'&&f==='a'){let first=(d.inputs||[]).find(i=>i.role==='noun')||d.inputs?.[0];if(first?.slot)cderiv.add(first.slot);return article(form(sel[first?.slot],'singular'))}let o=form(sel[sl],f||'literal');rend[sl]=o;if(sel[sl])cdir.add(sl);return o}));let consumed=(d?.inputs||[]).reduce((a,i)=>{let tok=sel[i.slot];if(tok&&(cdir.has(i.slot)||cderiv.has(i.slot)))a.push({slot:i.slot,tray:i.tray,src:tok.literal});return a},[]);for(const tr of project.triggers||[]){if(!tr.enabled)continue;let tray=tr.condition?.tray,term=tr.condition?.term;let cands=consumed.filter(c=>c.tray===tray&&(!term||c.src.toLowerCase()===String(term).toLowerCase()));if(!cands.length)continue;if(Math.random()*100<+(tr.chance||0)){let type=tr.action?.type||'append',txt=tr.action?.text||'';if(type==='prepend')surf=txt+' '+surf;else if(type==='replace')surf=txt;else surf=surf+' '+txt;break;}}return{id:'ev_'+String(tick).padStart(4,'0'),tick,type:'line',surface:surf,trace:String(tick).padStart(4,'0')+' '+(d?.name||'')+' / '+(r?.name||'')}}`; }
  function safeJsonForHtml(project){ return JSON.stringify(project,null,2).replace(/<\//gi,'<\\/').replace(/<!--/g,'<\\!--'); }
  function exportProjectHtml(project){ const json=safeJsonForHtml(project); const css=surfaceCss(project); return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(project.project?.title||'TAROKE')}</title><style>${css}</style></head><body><script type="application/json" id="taroke-project">${json}</script><div class="wrap"><div class="head" id="head"></div><main class="stage" id="stage"></main><div class="trace" id="trace">TAROKE RIMIXER artifact / import this HTML to edit</div></div><script>${standaloneRuntime()}<\/script></body></html>`; }
  function exportProjectJson(project){ return JSON.stringify(project,null,2); }
  function extractProjectFromText(text){ const s=String(text||''); const m=s.match(/<script[^>]*id=["']taroke-project["'][^>]*>([\s\S]*?)<\/script>/i); const raw=m?m[1].replace(/<\\\/script/gi,'</script').replace(/<\\!--/g,'<!--'):s; return migrateProject(JSON.parse(raw)); }
  return {SCHEMA_VERSION, TRAY_DEFS, projectTrayDefs, THEME_TOKENS, SURFACE_FAMILIES, defaultProject, classicLineDevices, classicStanzaPatterns, token, tokensFromText, roleForTray, clone, esc, uid, normalizeIdLabel, pluralBase, verb3Base, formToken, articleFor, weighted, getTrayTokens, getDevice, getStanza, activeScenes, expandStanza, generateEvent, addOrUpdateNote, cleanSurfaceText, validateProject, migrateProject, exportProjectHtml, exportProjectJson, extractProjectFromText, surfaceCss, downloadName};
});
