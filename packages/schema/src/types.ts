// ── Token ────────────────────────────────────────────────────────────────────

export interface Token {
  id: string;
  literal: string;
  role: string;
  weight: number;
  lockedLiteral: boolean;
}

// ── Bank / Tray ───────────────────────────────────────────────────────────────

export interface TrayDef {
  label: string;
  role: string;
  desc: string;
}

export type TrayName = string;
export type BankMeta = Record<TrayName, TrayDef>;

// ── Line Device ───────────────────────────────────────────────────────────────

export interface DeviceInput {
  id: string;
  slot: string;
  tray: string;
  role: string;
}

export interface Route {
  id: string;
  name: string;
  weight: number;
  template: string;
}

export interface LineDevice {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  inputs: DeviceInput[];
  routes: Route[];
}

// ── Stanza ────────────────────────────────────────────────────────────────────

export type StanzaSlotType = "device" | "breath";
export type SlotRepeat = "once" | "loop";

export interface StanzaSlot {
  id: string;
  type: StanzaSlotType;
  deviceId?: string;
  label: string;
  repeat: SlotRepeat;
  chance: number;
  max?: number;
}

export interface StanzaPattern {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  slots: StanzaSlot[];
}

// ── Flow Scene ────────────────────────────────────────────────────────────────

export interface FlowScene {
  id: string;
  name: string;
  stanzaId: string;
  enabled: boolean;
  chance: number;
  mode: string;
}

// ── Trigger ───────────────────────────────────────────────────────────────────

export interface TriggerCondition {
  tray: string;
  term: string;
}

export type TriggerActionType = "append" | "prepend" | "replace";

export interface TriggerAction {
  type: TriggerActionType;
  text: string;
}

export interface Trigger {
  id: string;
  name: string;
  enabled: boolean;
  condition: TriggerCondition;
  chance: number;
  action: TriggerAction;
}

// ── Surface ───────────────────────────────────────────────────────────────────

export interface Surface {
  family: string;
  traceMode: string;
  theme: string;
  speedMs: number;
  retention: number;
  fontSize: number;
  lineHeight: number;
  showTitle: boolean;
  showSource: boolean;
  showTick: boolean;
}

// ── Project sub-objects ───────────────────────────────────────────────────────

export interface ProjectInfo {
  title: string;
  author: string;
  sourceTitle: string;
  sourceUrl: string;
  statement: string;
  credits: string;
  language: string;
}

export interface WorkbenchPrefs {
  theme: string;
  relief: string;
  density: string;
  texture: string;
}

export interface FormsConfig {
  language: string;
  casePolicy: string;
  compoundPolicy: string;
  overrides: Record<string, Record<string, string>>;
}

export interface Materials {
  trays: Record<TrayName, Token[]>;
  bankMeta: BankMeta;
}

export interface ImportRepair {
  originalId: string;
  newId: string;
  bank: string;
  index: number;
  prevBank: string;
}

export interface ProjectMeta {
  createdWith: string;
  updatedAt: string;
  importRepairs?: ImportRepair[];
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export interface ProjectNote {
  id: string;
  eventId: string;
  status: string;
  note: string;
  surface: string;
  event: unknown;
  linkedTokenIds: string[];
  linkedDeviceId: string;
  linkedStanzaId: string;
  updatedAt: string;
}

// ── Full Project ──────────────────────────────────────────────────────────────

export interface TarokoProject {
  schemaVersion: string;
  project: ProjectInfo;
  workbench: WorkbenchPrefs;
  materials: Materials;
  forms: FormsConfig;
  lineDevices: LineDevice[];
  stanzaPatterns: StanzaPattern[];
  flowScenes: FlowScene[];
  triggers: Trigger[];
  surface: Surface;
  notes: ProjectNote[];
  meta: ProjectMeta;
}

// ── Runtime ───────────────────────────────────────────────────────────────────

export interface QueueEntry {
  type: "device" | "breath";
  deviceId?: string;
  label?: string;
}

export interface RunState {
  tick: number;
  queue: QueueEntry[];
  currentScene: string | null;
  currentStanza: string | null;
}

export interface ConsumedInput {
  slot: string;
  tray: string;
  tokenId: string;
  sourceLiteral: string;
  direct: boolean;
  derived: boolean;
}

export interface TriggerResult {
  id: string;
  name: string;
  text: string;
  type: string;
  conditionTray: string;
  conditionTerm: string;
  matchedSlot: string;
  matchedTokenId: string;
  matchedSourceLiteral: string;
}

export interface LineEvent {
  id: string;
  tick: number;
  type: "line";
  sceneId: string | null;
  stanzaId: string | null;
  slotLabel: string;
  deviceId: string;
  deviceName: string;
  route: string;
  routeId: string;
  selected: Record<string, string>;
  selectedTokens: Record<string, Token | null>;
  rendered: Record<string, string>;
  consumedInputs: ConsumedInput[];
  surface: string;
  trigger: TriggerResult | null;
  trace: string;
}

export interface BreathEvent {
  id: string;
  tick: number;
  type: "breath";
  surface: "";
  trace: string;
  stanzaId: string | null;
  sceneId: string | null;
}

export interface ErrorEvent {
  id: string;
  tick: number;
  type: "error";
  surface: "";
  trace: string;
  error: string;
}

export type TarokoEvent = LineEvent | BreathEvent | ErrorEvent;

// ── Validation ────────────────────────────────────────────────────────────────

export type ValidationLevel = "error" | "warning" | "note";

export interface ValidationIssue {
  level: ValidationLevel;
  area: string;
  message: string;
  action: string;
}
