import { THEME_TOKENS, SCHEMA_VERSION, EDITOR_VERSION } from "@taroko/schema";
import type { TarokoProject } from "@taroko/schema";
import { esc } from "./utils.js";
import { normalizeIdLabel } from "./utils.js";
import { migrateProject, validateProject } from "./migration.js";
import { IRREGULAR_PLURALS, IRREGULAR_VERB3 } from "@taroko/schema";

export interface ImportReceipt {
  filename: string;
  sourceFormat: "json" | "html" | "unknown";
  sourceSchema: string | null;
  resultingSchema: string;
  editorVersion: string;
  migrationPath: string;
  orderedBankIds: string[];
  bankCount: number;
  tokenCount: number;
  deviceCount: number;
  routeCount: number;
  patternCount: number;
  flowSceneCount: number;
  triggerCount: number;
  warnings: string[];
  errors: string[];
  duplicateIdFindings: { originalId: string; newId: string; bank: string; index: number }[];
  repairCount: number;
  repairDetails: string[];
  classicDefaultsApplied: { devices: boolean; patterns: boolean; scenes: boolean; triggers: boolean };
  authoredBankOrderPreserved: boolean;
}

export function importProjectWithReceipt(
  text: string,
  filename: string,
): { project: TarokoProject; receipt: ImportReceipt } {
  const s = String(text ?? "");

  // Detect format
  const isHtml = /<html/i.test(s) || /<script[^>]*taroke-project/i.test(s);
  const sourceFormat: ImportReceipt["sourceFormat"] = isHtml ? "html" : s.trim().startsWith("{") ? "json" : "unknown";

  // Extract raw JSON
  const m = s.match(/<script[^>]*id=["']taroke-project["'][^>]*>([\s\S]*?)<\/script>/i);
  const rawJson = m
    ? (m[1] ?? "").replace(/<\\\/script/gi, "</script").replace(/<\\!--/g, "<!--")
    : s;

  let rawInput: Record<string, unknown>;
  try {
    rawInput = JSON.parse(rawJson) as Record<string, unknown>;
  } catch {
    throw new Error(`Cannot parse as JSON: ${filename}`);
  }

  // Capture source schema before migration
  const sourceSchema = typeof rawInput["schemaVersion"] === "string" ? rawInput["schemaVersion"] : null;

  // Capture original bank order before migration
  const rawMaterials = rawInput["materials"] as Record<string, unknown> | undefined;
  const rawTraysObj = rawMaterials?.["trays"] as Record<string, unknown> | undefined;
  const rawLegacyDict = rawInput["dictionary"] as Record<string, unknown> | undefined;
  const preTrays = rawTraysObj ?? rawLegacyDict;
  const preBankIds = preTrays ? Object.keys(preTrays) : null;

  // Detect which collections would use classic defaults
  function hasProp(obj: unknown, key: string) {
    return obj != null && Object.prototype.hasOwnProperty.call(obj, key);
  }
  const classicDefaultsApplied = {
    devices: !hasProp(rawInput, "lineDevices") && !hasProp(rawInput, "lineMachines"),
    patterns: !hasProp(rawInput, "stanzaPatterns"),
    scenes: !hasProp(rawInput, "flowScenes"),
    triggers: !hasProp(rawInput, "triggers") && !hasProp(rawInput, "rareEvents"),
  };

  // Determine migration path
  const migrationSteps: string[] = [];
  if (hasProp(rawInput, "dictionary")) migrationSteps.push("legacy-dictionary→trays");
  if (hasProp(rawInput, "lineMachines")) migrationSteps.push("lineMachines→lineDevices");
  if (hasProp(rawInput, "rareEvents")) migrationSteps.push("rareEvents→triggers");
  if (!sourceSchema) migrationSteps.push("no-schema");
  else if (sourceSchema !== SCHEMA_VERSION) migrationSteps.push(`schema-upgrade:${sourceSchema}→${SCHEMA_VERSION}`);
  const migrationPath = migrationSteps.length ? migrationSteps.join(", ") : "current-schema";

  // Run migration
  const project = migrateProject(rawInput);

  // Run validation to get truthful warnings/errors
  const issues = validateProject(project);
  const warnings = issues.filter((i) => i.level === "warning" || i.level === "note").map((i) => `[${i.area}] ${i.message}`);
  const errors = issues.filter((i) => i.level === "error").map((i) => `[${i.area}] ${i.message}`);

  // Read repairs from migrated meta (set by migrateProject)
  const repairs = Array.isArray(project.meta?.importRepairs) ? project.meta.importRepairs : [];
  const duplicateIdFindings = repairs.map((r) => ({
    originalId: r?.originalId ?? "",
    newId: r?.newId ?? "",
    bank: r?.bank ?? "",
    index: r?.index ?? 0,
  }));
  const repairDetails = repairs.map(
    (r) => `Token ${r?.originalId} in bank "${r?.bank}" (index ${r?.index}) reassigned → ${r?.newId}`,
  );

  // Post-migration bank data
  const orderedBankIds = Object.keys(project.materials?.trays ?? {});
  const bankCount = orderedBankIds.length;
  const tokenCount = orderedBankIds.reduce((n, k) => n + (project.materials?.trays[k]?.length ?? 0), 0);
  const deviceCount = (project.lineDevices ?? []).length;
  const routeCount = (project.lineDevices ?? []).reduce((n, d) => n + (d.routes?.length ?? 0), 0);
  const patternCount = (project.stanzaPatterns ?? []).length;
  const flowSceneCount = (project.flowScenes ?? []).length;
  const triggerCount = (project.triggers ?? []).length;

  // Check if authored bank order was preserved
  const authoredBankOrderPreserved = preBankIds === null ||
    (preBankIds.length === orderedBankIds.length && preBankIds.every((id, i) => id === orderedBankIds[i]));

  const receipt: ImportReceipt = {
    filename,
    sourceFormat,
    sourceSchema,
    resultingSchema: SCHEMA_VERSION,
    editorVersion: EDITOR_VERSION,
    migrationPath,
    orderedBankIds,
    bankCount,
    tokenCount,
    deviceCount,
    routeCount,
    patternCount,
    flowSceneCount,
    triggerCount,
    warnings,
    errors,
    duplicateIdFindings,
    repairCount: repairs.length,
    repairDetails,
    classicDefaultsApplied,
    authoredBankOrderPreserved,
  };

  return { project, receipt };
}

export function downloadName(project: TarokoProject, ext: string): string {
  return normalizeIdLabel(project.project?.title ?? "taroko_rimix") + ext;
}

export function surfaceCss(project: TarokoProject): string {
  const theme = THEME_TOKENS[project.surface?.theme ?? ""] ?? THEME_TOKENS["night"]!;
  const size = Number(project.surface?.fontSize ?? 21);
  const lh = Number(project.surface?.lineHeight ?? 1.48);
  const { surfaceBg: bg, surfaceText: text, surfaceMuted: muted, surfaceAccent: accent } = theme;
  const traceHidden = project.surface?.traceMode === "hidden";
  const divider = `1px solid color-mix(in srgb,var(--muted),transparent 55%)`;
  return `:root{--bg:${bg};--text:${text};--muted:${muted};--accent:${accent}}body{margin:0;background:var(--bg);color:var(--text);font:${size}px/${lh} ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:hidden}@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}.wrap{height:100vh;display:flex;flex-direction:column}.head{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);padding:16px 22px;border-bottom:${divider};flex-shrink:0}.byline{font-size:13px;color:var(--muted);padding:8px 22px;border-bottom:${divider};flex-shrink:0;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.byline a{color:var(--accent);text-decoration:underline;text-underline-offset:2px}.byline__sep{opacity:.5}.identity{border-bottom:${divider};flex-shrink:0}.identity summary{padding:8px 22px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);cursor:pointer;list-style:none}.identity summary::-webkit-details-marker{display:none}.identity__body{padding:10px 22px 16px;font-size:0.85em;color:var(--muted);line-height:1.6}.identity__statement{margin:0 0 8px;white-space:pre-line}.identity__credits{margin:0;font-size:.9em;opacity:.75;white-space:pre-line}.stage{flex:1;padding:32px;overflow:auto}.line{margin:0 0 14px}.tick{display:none}.trace{${traceHidden ? "display:none;" : ""}font-size:12px;color:var(--muted);border-top:${divider};padding:10px 18px;white-space:nowrap;overflow:auto;background:var(--bg);flex-shrink:0}.rare{color:var(--accent)}`;
}

export function miniRuntime(): string {
  return String.raw`const IRR=${JSON.stringify(IRREGULAR_PLURALS)},V3=${JSON.stringify(IRREGULAR_VERB3)};function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function toks(n){return (project.materials?.trays?.[n]||[]).filter(x=>x.literal)}function split(w){const m=String(w||'').match(/^(.*[-\s])([^\-\s]+)$/);return m?[m[1],m[2]]:['',String(w||'')]}function style(src,out){if(src.toUpperCase()===src&&/[A-Z]/.test(src))return out.toUpperCase();if(src.toLowerCase()===src)return out.toLowerCase();if(src[0]===src[0]?.toUpperCase()&&src.slice(1)===src.slice(1).toLowerCase())return out[0]?.toUpperCase()+out.slice(1).toLowerCase();return out}function plbase(l){return IRR[l]||(/[^aeiou]y$/.test(l)?l.slice(0,-1)+'ies':/(s|x|z|ch|sh)$/.test(l)?l+'es':l+'s')}function v3base(l){return V3[l]||(/[^aeiou]y$/.test(l)?l.slice(0,-1)+'ies':/(s|x|z|ch|sh|o)$/.test(l)?l+'es':l+'s')}function form(t,f){f=String(f||'literal').trim();let lit=t?.literal||'';if(t?.lockedLiteral&&!['uppercase','lowercase','title'].includes(f))return lit;if(f==='literal'||f==='base')return lit;if(f==='uppercase')return lit.toUpperCase();if(f==='lowercase')return lit.toLowerCase();if(f==='literal+s')return lit+'s';let [pre,head]=split(lit),l=head.toLowerCase(),m=head;if(f==='plural')m=plbase(l);else if(f==='thirdSingular')m=v3base(l);return pre+style(head,m)}function clean(s){return String(s||'').replace(/\{[^}]+\}/g,'').replace(/\s+([.,;:!?])/g,'$1').replace(/([,;:!?])\s*([,;:!?])+/g,'$1').replace(/(^|\s)[,;:!?]+\s*/g,'$1').replace(/\(\s*\)/g,'').replace(/\[\s*\]/g,'').replace(/\s{2,}/g,' ').replace(/\s+([.?!])/g,'$1').trim()}function article(w){return /^[aeiou]/i.test(String(w||'').trim())?'an':'a'}function wgt(a){let items=(a||[]).filter(x=>+(x.weight??x.chance)>0),sum=items.reduce((n,x)=>n+ +(x.weight??x.chance),0),r=Math.random()*sum;for(const x of items){r-=+(x.weight??x.chance);if(r<=0)return x}return items[0]||a?.[0]}function dev(id){return (project.lineDevices||[]).find(d=>d.id===id)}function stanza(id){return (project.stanzaPatterns||[]).find(s=>s.id===id)}function exp(st){let out=[];(st?.slots||[]).forEach(slot=>{if(Math.random()*100>+(slot.chance??100))return;if(slot.type==='breath')out.push({type:'breath'});else if(slot.repeat==='loop'){let c=0,max=+(slot.max||4);while(c<max&&Math.random()*100<=+(slot.chance??60)){out.push({type:'device',deviceId:slot.deviceId});c++}}else out.push({type:'device',deviceId:slot.deviceId})});return out}function slot(state){if(!state.queue.length){let sc=wgt((project.flowScenes||[]).filter(s=>s.enabled));state.currentScene=sc?.id;state.currentStanza=sc?.stanzaId;state.queue=exp(stanza(sc?.stanzaId));if(!state.queue.length)state.queue=[{type:'breath'}]}return state.queue.shift()}function generateEvent(project,state){let s=slot(state),tick=state.tick||0;if(s.type==='breath')return{id:'ev_'+String(tick).padStart(4,'0'),tick,type:'breath',surface:'',trace:String(tick).padStart(4,'0')+' BREATH'};let d=dev(s.deviceId),r=wgt(d?.routes||[]),sel={},rend={};(d?.inputs||[]).forEach(i=>sel[i.slot]=wgt(toks(i.tray)));let cdir=new Set(),cderiv=new Set();let surf=clean((r?.template||'').replace(/\{([^}:]+):?([^}]*)\}/g,(_,sl,f)=>{sl=String(sl||'').trim();f=String(f||'literal').trim();if(sl==='article'&&f==='a'){let first=(d.inputs||[]).find(i=>i.role==='noun')||d.inputs?.[0];if(first?.slot)cderiv.add(first.slot);return article(form(sel[first?.slot],'singular'))}let o=form(sel[sl],f||'literal');rend[sl]=o;if(sel[sl])cdir.add(sl);return o}));let consumed=(d?.inputs||[]).reduce((a,i)=>{let tok=sel[i.slot];if(tok&&(cdir.has(i.slot)||cderiv.has(i.slot)))a.push({slot:i.slot,tray:i.tray,src:tok.literal});return a},[]);for(const tr of project.triggers||[]){if(!tr.enabled)continue;let tray=tr.condition?.tray,term=tr.condition?.term;let cands=consumed.filter(c=>c.tray===tray&&(!term||c.src.toLowerCase()===String(term).toLowerCase()));if(!cands.length)continue;if(Math.random()*100<+(tr.chance||0)){let type=tr.action?.type||'append',txt=tr.action?.text||'';if(type==='prepend')surf=txt+' '+surf;else if(type==='replace')surf=txt;else surf=surf+' '+txt;break;}}return{id:'ev_'+String(tick).padStart(4,'0'),tick,type:'line',surface:surf,trace:String(tick).padStart(4,'0')+' '+(d?.name||'')+' / '+(r?.name||'')}}`;
}

export function standaloneRuntime(): string {
  return `(()=>{const project=JSON.parse(document.getElementById('taroke-project').textContent);${miniRuntime()}let state={tick:0,queue:[]};const stage=document.getElementById('stage'),trace=document.getElementById('trace'),max=project.surface?.retention||28;function line(){const e=generateEvent(project,state);state.tick++;if(e.type!=='breath'){const p=document.createElement('p');p.className='line';p.innerHTML=esc(e.surface);stage.appendChild(p);}while(stage.children.length>max)stage.removeChild(stage.firstChild);stage.scrollTop=stage.scrollHeight;if(trace)trace.textContent=e.trace}line();setInterval(line,Math.max(250,project.surface?.speedMs||1200));})();`;
}

function safeExportUrl(url: string): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : null;
}

export function safeJsonForHtml(project: TarokoProject): string {
  return JSON.stringify(project, null, 2)
    .replace(/<\//gi, "<\\/")
    .replace(/<!--/g, "<\\!--");
}

export function exportProjectHtml(project: TarokoProject): string {
  const json = safeJsonForHtml(project);
  const css = surfaceCss(project);
  const info = project.project ?? {};
  const title = info.title || "Untitled";
  const author = info.author ?? "";
  const sourceTitle = info.sourceTitle ?? "";
  const sourceUrl = info.sourceUrl ?? "";
  const statement = info.statement ?? "";
  const credits = info.credits ?? "";

  const safeSrcUrl = safeExportUrl(sourceUrl);
  const sourceRef = sourceTitle
    ? safeSrcUrl
      ? `<a href="${esc(safeSrcUrl)}" class="byline__link" rel="noopener noreferrer">${esc(sourceTitle)}</a>`
      : esc(sourceTitle)
    : "";

  const bylineParts: string[] = [];
  if (author) bylineParts.push(`<span class="byline__author">${esc(author)}</span>`);
  if (sourceRef) bylineParts.push(`<span class="byline__source">${sourceRef}</span>`);
  const bylineHtml = bylineParts.length
    ? `<div class="byline">${bylineParts.join('<span class="byline__sep"> / </span>')}</div>`
    : "";

  const stmtHtml = statement ? `<p class="identity__statement">${esc(statement)}</p>` : "";
  const credHtml = credits ? `<p class="identity__credits">${esc(credits)}</p>` : "";
  const detailsHtml = stmtHtml || credHtml
    ? `<details class="identity"><summary>Statement &amp; credits</summary><div class="identity__body">${stmtHtml}${credHtml}</div></details>`
    : "";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${css}</style></head><body><script type="application/json" id="taroke-project">${json}</script><div class="wrap"><div class="head" id="head">${esc(title)}</div>${bylineHtml}${detailsHtml}<main class="stage" id="stage"></main><div class="trace" id="trace">TAROKO REMIXER artifact / import this HTML to edit</div></div><script>${standaloneRuntime()}<\/script></body></html>`;
}

export function exportProjectJson(project: TarokoProject): string {
  return JSON.stringify(project, null, 2);
}

export function extractProjectFromText(text: string): TarokoProject {
  const s = String(text ?? "");
  const m = s.match(/<script[^>]*id=["']taroke-project["'][^>]*>([\s\S]*?)<\/script>/i);
  const raw = m
    ? (m[1] ?? "").replace(/<\\\/script/gi, "</script").replace(/<\\!--/g, "<!--")
    : s;
  return migrateProject(JSON.parse(raw));
}
