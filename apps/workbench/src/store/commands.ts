import { produceWithPatches, type Patch } from "immer";
import { uid } from "@taroko/core";
import type { TarokoProject, Token, LineDevice, Route, StanzaPattern, StanzaSlot, FlowScene, Trigger, DeviceInput } from "@taroko/schema";

// ── Command result ─────────────────────────────────────────────────────────────

export interface CommandResult {
  present: TarokoProject;
  patches: Patch[];
  inversePatches: Patch[];
  label: string;
}

function cmd(
  project: TarokoProject,
  label: string,
  mutate: (draft: TarokoProject) => void,
): CommandResult {
  const [present, patches, inversePatches] = produceWithPatches(project, mutate);
  return { present: present as TarokoProject, patches, inversePatches, label };
}

// ── Project info ───────────────────────────────────────────────────────────────

export function setProjectTitle(project: TarokoProject, title: string): CommandResult {
  return cmd(project, "Set title", (d) => { d.project.title = title; });
}

export function setProjectAuthor(project: TarokoProject, author: string): CommandResult {
  return cmd(project, "Set author", (d) => { d.project.author = author; });
}

export function setProjectStatement(project: TarokoProject, statement: string): CommandResult {
  return cmd(project, "Set statement", (d) => { d.project.statement = statement; });
}

export function setProjectCredits(project: TarokoProject, credits: string): CommandResult {
  return cmd(project, "Set credits", (d) => { d.project.credits = credits; });
}

export function setProjectLanguage(project: TarokoProject, language: string): CommandResult {
  return cmd(project, "Set language", (d) => { d.project.language = language; });
}

export function setProjectSourceTitle(project: TarokoProject, sourceTitle: string): CommandResult {
  return cmd(project, "Set source title", (d) => { d.project.sourceTitle = sourceTitle; });
}

export function setProjectSourceUrl(project: TarokoProject, sourceUrl: string): CommandResult {
  return cmd(project, "Set source URL", (d) => { d.project.sourceUrl = sourceUrl; });
}

export function setProjectSource(project: TarokoProject, sourceTitle: string, sourceUrl: string): CommandResult {
  return cmd(project, "Set source", (d) => {
    d.project.sourceTitle = sourceTitle;
    d.project.sourceUrl = sourceUrl;
  });
}

// ── Token commands ─────────────────────────────────────────────────────────────

export function addToken(project: TarokoProject, bankName: string, literal: string): CommandResult {
  return cmd(project, `Add sample to ${bankName}`, (d) => {
    const tray = d.materials.trays[bankName];
    if (!tray) return;
    const role = d.materials.bankMeta[bankName]?.role ?? "literal";
    tray.push({ id: uid("tok"), literal: literal.trim(), role, weight: 1, lockedLiteral: false });
  });
}

export function updateTokenLiteral(project: TarokoProject, bankName: string, tokenId: string, literal: string): CommandResult {
  return cmd(project, "Edit sample", (d) => {
    const tok = d.materials.trays[bankName]?.find((t) => t.id === tokenId);
    if (tok) tok.literal = literal;
  });
}

export function setTokenWeight(project: TarokoProject, bankName: string, tokenId: string, weight: number): CommandResult {
  return cmd(project, "Set sample weight", (d) => {
    const tok = d.materials.trays[bankName]?.find((t) => t.id === tokenId);
    if (tok) tok.weight = weight;
  });
}

export function setTokenLockedLiteral(project: TarokoProject, bankName: string, tokenId: string, locked: boolean): CommandResult {
  return cmd(project, "Toggle locked literal", (d) => {
    const tok = d.materials.trays[bankName]?.find((t) => t.id === tokenId);
    if (tok) tok.lockedLiteral = locked;
  });
}

export function removeToken(project: TarokoProject, bankName: string, tokenId: string): CommandResult {
  return cmd(project, `Remove sample from ${bankName}`, (d) => {
    const tray = d.materials.trays[bankName];
    if (!tray) return;
    const idx = tray.findIndex((t) => t.id === tokenId);
    if (idx >= 0) tray.splice(idx, 1);
  });
}

export function reorderTokens(project: TarokoProject, bankName: string, orderedIds: string[]): CommandResult {
  return cmd(project, "Reorder samples", (d) => {
    const tray = d.materials.trays[bankName];
    if (!tray) return;
    const map = new Map(tray.map((t) => [t.id, t]));
    const reordered = orderedIds.map((id) => map.get(id)).filter(Boolean) as Token[];
    d.materials.trays[bankName] = reordered;
  });
}

export function setTokenOverride(project: TarokoProject, tokenId: string, form: string, value: string): CommandResult {
  return cmd(project, "Set form override", (d) => {
    if (!d.forms.overrides[tokenId]) d.forms.overrides[tokenId] = {};
    d.forms.overrides[tokenId]![form] = value;
  });
}

// ── Bank meta commands ─────────────────────────────────────────────────────────

export function setBankLabel(project: TarokoProject, bankName: string, label: string): CommandResult {
  return cmd(project, "Rename bank", (d) => {
    const meta = d.materials.bankMeta[bankName];
    if (meta) meta.label = label;
  });
}

export function addBank(project: TarokoProject, key: string, label: string, role = "literal"): CommandResult {
  return cmd(project, "Add bank", (d) => {
    if (!d.materials.trays[key]) {
      d.materials.trays[key] = [];
      d.materials.bankMeta[key] = { label, role, desc: "custom sample bank" };
    }
  });
}

export function removeBank(project: TarokoProject, bankName: string): CommandResult {
  return cmd(project, "Remove bank", (d) => {
    delete d.materials.trays[bankName];
    delete d.materials.bankMeta[bankName];
  });
}

// ── Line device commands ───────────────────────────────────────────────────────

export function addLineDevice(project: TarokoProject, device: LineDevice): CommandResult {
  return cmd(project, "Add line device", (d) => { d.lineDevices.push(device); });
}

export function updateDeviceName(project: TarokoProject, deviceId: string, name: string): CommandResult {
  return cmd(project, "Rename device", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev) dev.name = name;
  });
}

export function updateDeviceDescription(project: TarokoProject, deviceId: string, description: string): CommandResult {
  return cmd(project, "Edit device description", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev) dev.description = description;
  });
}

export function toggleDeviceEnabled(project: TarokoProject, deviceId: string): CommandResult {
  return cmd(project, "Toggle device", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev) dev.enabled = !dev.enabled;
  });
}

export function removeLineDevice(project: TarokoProject, deviceId: string): CommandResult {
  return cmd(project, "Remove line device", (d) => {
    const idx = d.lineDevices.findIndex((x) => x.id === deviceId);
    if (idx >= 0) d.lineDevices.splice(idx, 1);
  });
}

export function reorderLineDevices(project: TarokoProject, orderedIds: string[]): CommandResult {
  return cmd(project, "Reorder devices", (d) => {
    const map = new Map(d.lineDevices.map((x) => [x.id, x]));
    d.lineDevices = orderedIds.map((id) => map.get(id)).filter(Boolean) as LineDevice[];
  });
}

export function addDeviceInput(project: TarokoProject, deviceId: string, input: Omit<DeviceInput, "id">): CommandResult {
  return cmd(project, "Add device input", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev) dev.inputs.push({ id: uid("inp"), ...input });
  });
}

export function removeDeviceInput(project: TarokoProject, deviceId: string, inputId: string): CommandResult {
  return cmd(project, "Remove device input", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (!dev) return;
    const idx = dev.inputs.findIndex((i) => i.id === inputId);
    if (idx < 0) return;
    const removed = dev.inputs[idx];
    if (!removed) return;
    const removedSlot = removed.slot;
    dev.inputs.splice(idx, 1);
    // Remove dangling {slot:form} references from all routes on this device
    const staleRe = new RegExp(`\\{${removedSlot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:[^}]*\\}`, "g");
    for (const route of dev.routes) {
      route.template = route.template.replace(staleRe, "");
    }
  });
}

export function updateDeviceInput(
  project: TarokoProject,
  deviceId: string,
  inputId: string,
  patch: Partial<Omit<DeviceInput, "id">>,
): CommandResult {
  return cmd(project, "Update device input", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (!dev) return;
    const inp = dev.inputs.find((i) => i.id === inputId);
    if (!inp) return;
    if (patch.slot !== undefined && patch.slot !== inp.slot) {
      const oldSlot = inp.slot;
      inp.slot = patch.slot;
      // Cascade rename into route templates: {oldSlot:form} → {newSlot:form}
      const renameRe = new RegExp(`\\{${oldSlot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:`, "g");
      for (const route of dev.routes) {
        route.template = route.template.replace(renameRe, `{${patch.slot}:`);
      }
    }
    if (patch.tray !== undefined) inp.tray = patch.tray;
    if (patch.role !== undefined) inp.role = patch.role;
  });
}

export function addRoute(project: TarokoProject, deviceId: string, route: Route): CommandResult {
  return cmd(project, "Add route", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (dev) dev.routes.push(route);
  });
}

export function updateRouteTemplate(project: TarokoProject, deviceId: string, routeId: string, template: string): CommandResult {
  return cmd(project, "Edit route template", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    const route = dev?.routes.find((r) => r.id === routeId);
    if (route) route.template = template;
  });
}

export function setRouteWeight(project: TarokoProject, deviceId: string, routeId: string, weight: number): CommandResult {
  return cmd(project, "Set route weight", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    const route = dev?.routes.find((r) => r.id === routeId);
    if (route) route.weight = weight;
  });
}

export function removeRoute(project: TarokoProject, deviceId: string, routeId: string): CommandResult {
  return cmd(project, "Remove route", (d) => {
    const dev = d.lineDevices.find((x) => x.id === deviceId);
    if (!dev) return;
    const idx = dev.routes.findIndex((r) => r.id === routeId);
    if (idx >= 0) dev.routes.splice(idx, 1);
  });
}

// ── Stanza commands ────────────────────────────────────────────────────────────

export function addStanzaPattern(project: TarokoProject, stanza: StanzaPattern): CommandResult {
  return cmd(project, "Add stanza pattern", (d) => { d.stanzaPatterns.push(stanza); });
}

export function updateStanzaName(project: TarokoProject, stanzaId: string, name: string): CommandResult {
  return cmd(project, "Rename stanza", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    if (s) s.name = name;
  });
}

export function toggleStanzaEnabled(project: TarokoProject, stanzaId: string): CommandResult {
  return cmd(project, "Toggle stanza", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    if (s) s.enabled = !s.enabled;
  });
}

export function removeStanzaPattern(project: TarokoProject, stanzaId: string): CommandResult {
  return cmd(project, "Remove stanza pattern", (d) => {
    const idx = d.stanzaPatterns.findIndex((x) => x.id === stanzaId);
    if (idx >= 0) d.stanzaPatterns.splice(idx, 1);
  });
}

export function addStanzaSlot(project: TarokoProject, stanzaId: string, slot: StanzaSlot): CommandResult {
  return cmd(project, "Add stanza slot", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    if (s) s.slots.push(slot);
  });
}

export function removeStanzaSlot(project: TarokoProject, stanzaId: string, slotId: string): CommandResult {
  return cmd(project, "Remove stanza slot", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    if (!s) return;
    const idx = s.slots.findIndex((sl) => sl.id === slotId);
    if (idx >= 0) s.slots.splice(idx, 1);
  });
}

export function reorderStanzaSlots(project: TarokoProject, stanzaId: string, orderedIds: string[]): CommandResult {
  return cmd(project, "Reorder stanza slots", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    if (!s) return;
    const map = new Map(s.slots.map((sl) => [sl.id, sl]));
    s.slots = orderedIds.map((id) => map.get(id)).filter(Boolean) as StanzaSlot[];
  });
}

export function setSlotChance(project: TarokoProject, stanzaId: string, slotId: string, chance: number): CommandResult {
  return cmd(project, "Set slot chance", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    const slot = s?.slots.find((sl) => sl.id === slotId);
    if (slot) slot.chance = chance;
  });
}

export function setSlotRepeat(project: TarokoProject, stanzaId: string, slotId: string, repeat: "once" | "loop"): CommandResult {
  return cmd(project, "Set slot repeat", (d) => {
    const s = d.stanzaPatterns.find((x) => x.id === stanzaId);
    const slot = s?.slots.find((sl) => sl.id === slotId);
    if (slot) slot.repeat = repeat;
  });
}

// ── Flow scene commands ────────────────────────────────────────────────────────

export function addFlowScene(project: TarokoProject, scene: FlowScene): CommandResult {
  return cmd(project, "Add flow scene", (d) => { d.flowScenes.push(scene); });
}

export function updateSceneName(project: TarokoProject, sceneId: string, name: string): CommandResult {
  return cmd(project, "Rename scene", (d) => {
    const s = d.flowScenes.find((x) => x.id === sceneId);
    if (s) s.name = name;
  });
}

export function toggleSceneEnabled(project: TarokoProject, sceneId: string): CommandResult {
  return cmd(project, "Toggle scene", (d) => {
    const s = d.flowScenes.find((x) => x.id === sceneId);
    if (s) s.enabled = !s.enabled;
  });
}

export function setSceneChance(project: TarokoProject, sceneId: string, chance: number): CommandResult {
  return cmd(project, "Set scene chance", (d) => {
    const s = d.flowScenes.find((x) => x.id === sceneId);
    if (s) s.chance = chance;
  });
}

export function removeFlowScene(project: TarokoProject, sceneId: string): CommandResult {
  return cmd(project, "Remove flow scene", (d) => {
    const idx = d.flowScenes.findIndex((x) => x.id === sceneId);
    if (idx >= 0) d.flowScenes.splice(idx, 1);
  });
}

// ── Trigger commands ───────────────────────────────────────────────────────────

export function addTrigger(project: TarokoProject, trigger: Trigger): CommandResult {
  return cmd(project, "Add trigger", (d) => { d.triggers.push(trigger); });
}

export function updateTriggerName(project: TarokoProject, triggerId: string, name: string): CommandResult {
  return cmd(project, "Rename trigger", (d) => {
    const t = d.triggers.find((x) => x.id === triggerId);
    if (t) t.name = name;
  });
}

export function toggleTriggerEnabled(project: TarokoProject, triggerId: string): CommandResult {
  return cmd(project, "Toggle trigger", (d) => {
    const t = d.triggers.find((x) => x.id === triggerId);
    if (t) t.enabled = !t.enabled;
  });
}

export function setTriggerCondition(project: TarokoProject, triggerId: string, tray: string, term: string): CommandResult {
  return cmd(project, "Set trigger condition", (d) => {
    const t = d.triggers.find((x) => x.id === triggerId);
    if (t) { t.condition.tray = tray; t.condition.term = term; }
  });
}

export function setTriggerChance(project: TarokoProject, triggerId: string, chance: number): CommandResult {
  return cmd(project, "Set trigger chance", (d) => {
    const t = d.triggers.find((x) => x.id === triggerId);
    if (t) t.chance = chance;
  });
}

export function setTriggerAction(project: TarokoProject, triggerId: string, type: "append" | "prepend" | "replace", text: string): CommandResult {
  return cmd(project, "Set trigger action", (d) => {
    const t = d.triggers.find((x) => x.id === triggerId);
    if (t) { t.action.type = type; t.action.text = text; }
  });
}

export function removeTrigger(project: TarokoProject, triggerId: string): CommandResult {
  return cmd(project, "Remove trigger", (d) => {
    const idx = d.triggers.findIndex((x) => x.id === triggerId);
    if (idx >= 0) d.triggers.splice(idx, 1);
  });
}

// ── Surface commands ───────────────────────────────────────────────────────────

export function setSurfaceSpeed(project: TarokoProject, speedMs: number): CommandResult {
  return cmd(project, "Set surface speed", (d) => { d.surface.speedMs = speedMs; });
}

export function setSurfaceRetention(project: TarokoProject, retention: number): CommandResult {
  return cmd(project, "Set surface retention", (d) => { d.surface.retention = retention; });
}

export function setSurfaceFontSize(project: TarokoProject, fontSize: number): CommandResult {
  return cmd(project, "Set font size", (d) => { d.surface.fontSize = fontSize; });
}

export function setSurfaceTheme(project: TarokoProject, theme: string): CommandResult {
  return cmd(project, "Set surface theme", (d) => { d.surface.theme = theme; });
}

export function setSurfaceTraceMode(project: TarokoProject, traceMode: string): CommandResult {
  return cmd(project, "Set trace mode", (d) => { d.surface.traceMode = traceMode; });
}

// ── Forms commands ─────────────────────────────────────────────────────────────

export function setCasePolicy(project: TarokoProject, casePolicy: string): CommandResult {
  return cmd(project, "Set case policy", (d) => { d.forms.casePolicy = casePolicy; });
}

export function setCompoundPolicy(project: TarokoProject, compoundPolicy: string): CommandResult {
  return cmd(project, "Set compound policy", (d) => { d.forms.compoundPolicy = compoundPolicy; });
}
