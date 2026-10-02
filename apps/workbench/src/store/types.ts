import type { TarokoProject, RunState, ValidationIssue } from "@taroko/schema";
import type { ImportReceipt } from "@taroko/core";
import type { TakesState } from "./takesSlice.js";
import type { SurfaceState } from "./surfaceSlice.js";

// ── Project state ──────────────────────────────────────────────────────────────

export interface ProjectState {
  present: TarokoProject;
  isDirty: boolean;
  lastSavedAt: string | null;
}

// ── Selection state ────────────────────────────────────────────────────────────

export type SelectionTarget =
  | { type: "bank"; bankName: string }
  | { type: "token"; bankName: string; tokenId: string }
  | { type: "device"; deviceId: string }
  | { type: "route"; deviceId: string; routeId: string }
  | { type: "stanza"; stanzaId: string }
  | { type: "scene"; sceneId: string }
  | { type: "trigger"; triggerId: string }
  | { type: "note"; noteId: string }
  | null;

export interface SelectionState {
  primary: SelectionTarget;
  secondary: SelectionTarget;
}

// ── Editor state ───────────────────────────────────────────────────────────────

export type EditorPanel = "source" | "materials" | "forms" | "instruments" | "composition" | "automation" | "performance" | "archive";

export interface EditorState {
  activePanel: EditorPanel;
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  previewFresh: boolean;
  previewHtml: string | null;
}

// ── Runtime state ──────────────────────────────────────────────────────────────

export type RuntimeStatus = "stopped" | "running" | "paused";

export interface RuntimeState {
  status: RuntimeStatus;
  runState: RunState;
  recentEventIds: string[];
}

// ── History state (undo/redo) ─────────────────────────────────────────────────

export interface HistoryEntry {
  label: string;
  patches: unknown[];
  inversePatches: unknown[];
  timestamp: number;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;
}

// ── Import receipt ─────────────────────────────────────────────────────────────

export interface ImportReceiptState {
  visible: boolean;
  filename: string | null;
  timestamp: string | null;
  issues: ValidationIssue[];
  repairCount: number;
  fullReceipt: ImportReceipt | null;
}

// ── Root ──────────────────────────────────────────────────────────────────────

export interface RootState {
  project: ProjectState;
  selection: SelectionState;
  editor: EditorState;
  runtime: RuntimeState;
  history: HistoryState;
  importReceipt: ImportReceiptState;
  takes: TakesState;
  surface: SurfaceState;
}
