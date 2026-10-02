import type {
  TarokoProject,
  FlowScene,
  RunState,
  QueueEntry,
  TarokoEvent,
  LineEvent,
  BreathEvent,
  ErrorEvent,
  ConsumedInput,
  TriggerResult,
} from "@taroko/schema";
import { weighted, getTrayTokens, getDevice, getStanza } from "./selection.js";
import type { RNG } from "./selection.js";
import { formToken, articleFor } from "./forms.js";

export function activeScenes(project: TarokoProject): FlowScene[] {
  return (project.flowScenes ?? []).filter(
    (s) =>
      s.enabled &&
      Number(s.chance ?? 100) > 0 &&
      getStanza(project, s.stanzaId)?.enabled,
  );
}

export function expandStanza(
  project: TarokoProject,
  stanzaId: string | null | undefined,
  rng: RNG = Math.random,
): QueueEntry[] {
  const stanza = stanzaId ? getStanza(project, stanzaId) : undefined;
  const seq: QueueEntry[] = [];
  if (!stanza) return seq;
  for (const slot of stanza.slots ?? []) {
    if (rng() * 100 >= Number(slot.chance ?? 100)) continue;
    if (slot.type === "breath") {
      seq.push({ type: "breath", label: "BREATH" });
      continue;
    }
    if (slot.type !== "device") continue;
    if (slot.repeat === "loop") {
      let count = 0;
      const max = Number(slot.max ?? 4);
      while (count < max && rng() * 100 < Number(slot.chance ?? 60)) {
        const entry: QueueEntry = { type: "device", label: slot.label ?? "LOOP" };
        if (slot.deviceId !== undefined) entry.deviceId = slot.deviceId;
        seq.push(entry);
        count++;
      }
    } else {
      const entry: QueueEntry = { type: "device", label: slot.label ?? "DEVICE" };
      if (slot.deviceId !== undefined) entry.deviceId = slot.deviceId;
      seq.push(entry);
    }
  }
  return seq;
}

export function cleanSurfaceText(s: string): string {
  return String(s ?? "")
    .replace(/\{[^}]+\}/g, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.,;:!?])\s*([.,;:!?])+/g, "$1")
    .replace(/(^|\s)[.,;:!?]+\s*/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.?!])/g, "$1")
    .trim();
}

export function nextSlot(project: TarokoProject, runState: Partial<RunState> = {}, rng: RNG = Math.random): QueueEntry {
  runState.queue = Array.isArray(runState.queue) ? runState.queue : [];
  if (!runState.queue.length) {
    const scene = weighted(activeScenes(project), rng) ?? (project.flowScenes ?? [])[0] ?? null;
    const stanza = scene ? getStanza(project, scene.stanzaId) : undefined;
    runState.currentScene = scene?.id ?? null;
    runState.currentStanza = stanza?.id ?? null;
    runState.queue = expandStanza(project, stanza?.id, rng);
    if (!runState.queue.length) runState.queue = [{ type: "breath", label: "BREATH" }];
  }
  return runState.queue.shift()!;
}

export function renderDeviceEvent(
  project: TarokoProject,
  deviceId: string,
  slot: QueueEntry,
  runState: Partial<RunState> = {},
  rng: RNG = Math.random,
): LineEvent | ErrorEvent {
  const device = getDevice(project, deviceId);
  if (!device || !device.enabled) {
    const tick = Number(runState.tick ?? 0);
    return {
      id: "ev_" + String(tick).padStart(4, "0"),
      tick,
      type: "error",
      surface: "",
      trace: "Missing or disabled device",
      error: "NO_DEVICE",
    };
  }

  const route = weighted(device.routes, rng) ?? { id: "", name: "empty", weight: 0, template: "" };
  const selectedTokens: Record<string, ReturnType<typeof getTrayTokens>[number] | null> = {};
  const selected: Record<string, string> = {};
  const rendered: Record<string, string> = {};

  for (const input of device.inputs ?? []) {
    const tok = weighted(getTrayTokens(project, input.tray), rng) ?? null;
    selectedTokens[input.slot] = tok;
    selected[input.slot] = tok ? tok.literal : "";
  }

  const consumedDirect = new Set<string>();
  const consumedDerived = new Set<string>();

  let surface = cleanSurfaceText(
    String(route.template ?? "").replace(
      /\{([^}:]+):?([^}]*)\}/g,
      (_, slotName: string, form: string) => {
        slotName = String(slotName ?? "").trim();
        form = String(form ?? "literal").trim();
        if (slotName === "article" && form === "a") {
          const first =
            (device.inputs ?? []).find((i) => i.role === "noun") ?? (device.inputs ?? [])[0];
          if (first?.slot) consumedDerived.add(first.slot);
          const phrase = formToken(project, selectedTokens[first?.slot ?? ""] ?? null, "singular");
          return articleFor(phrase);
        }
        const out = formToken(project, selectedTokens[slotName] ?? null, form || "literal");
        rendered[slotName] = out;
        if (selectedTokens[slotName]) consumedDirect.add(slotName);
        return out;
      },
    ),
  );

  const consumedInputs: ConsumedInput[] = (device.inputs ?? []).reduce<ConsumedInput[]>((acc, inp) => {
    const tok = selectedTokens[inp.slot];
    if (!tok) return acc;
    const direct = consumedDirect.has(inp.slot);
    const derived = consumedDerived.has(inp.slot);
    if (direct || derived) {
      acc.push({
        slot: inp.slot,
        tray: inp.tray,
        tokenId: tok.id,
        sourceLiteral: tok.literal,
        direct,
        derived,
      });
    }
    return acc;
  }, []);

  let trigger: TriggerResult | null = null;
  for (const tr of project.triggers ?? []) {
    if (!tr.enabled) continue;
    const tray = tr.condition?.tray ?? "";
    const term = tr.condition?.term ?? "";
    const candidates = consumedInputs.filter(
      (ci) =>
        ci.tray === tray &&
        (!term || ci.sourceLiteral.toLowerCase() === String(term).toLowerCase()),
    );
    if (!candidates.length) continue;
    if (rng() * 100 < Number(tr.chance ?? 0)) {
      const matched = candidates[0]!;
      trigger = {
        id: tr.id,
        name: tr.name,
        text: tr.action?.text ?? "",
        type: tr.action?.type ?? "append",
        conditionTray: tray,
        conditionTerm: term,
        matchedSlot: matched.slot,
        matchedTokenId: matched.tokenId,
        matchedSourceLiteral: matched.sourceLiteral,
      };
      if (trigger.type === "prepend") surface = trigger.text + " " + surface;
      else if (trigger.type === "replace") surface = trigger.text;
      else surface = surface + " " + trigger.text;
      break;
    }
  }

  const tick = Number(runState.tick ?? 0);
  const id = "ev_" + String(tick).padStart(4, "0");
  const trace =
    (device.inputs ?? [])
      .map((i) => `${i.slot}=${rendered[i.slot] ?? selected[i.slot] ?? ""}`)
      .join(" / ");

  return {
    id,
    tick,
    type: "line",
    sceneId: runState.currentScene ?? null,
    stanzaId: runState.currentStanza ?? null,
    slotLabel: slot.label ?? "",
    deviceId: device.id,
    deviceName: device.name,
    route: route.name,
    routeId: route.id,
    selected,
    selectedTokens,
    rendered,
    consumedInputs,
    surface,
    trigger,
    trace: `${String(tick).padStart(4, "0")} ${device.name} / ${route.name} / ${trace}`,
  };
}

export function generateEvent(
  project: TarokoProject,
  runState: Partial<RunState> = {},
  rng: RNG = Math.random,
): TarokoEvent {
  const tick = Number(runState.tick ?? 0);
  const slot = nextSlot(project, runState, rng);
  if (slot.type === "breath") {
    const ev: BreathEvent = {
      id: "ev_" + String(tick).padStart(4, "0"),
      tick,
      type: "breath",
      surface: "",
      trace: `${String(tick).padStart(4, "0")} BREATH / stanza boundary`,
      stanzaId: (runState as RunState).currentStanza ?? null,
      sceneId: (runState as RunState).currentScene ?? null,
    };
    return ev;
  }
  return renderDeviceEvent(project, slot.deviceId ?? "", slot, runState, rng);
}
