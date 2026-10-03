import { describe, it, expect } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import projectReducer, { setProject, markSaved, mutateProject } from "../../store/projectSlice.js";
import selectionReducer, { selectBank, selectToken, selectDevice, clearSelection } from "../../store/selectionSlice.js";
import editorReducer, { setActivePanel, toggleSidebar, markPreviewStale, setPreviewFresh } from "../../store/editorSlice.js";
import runtimeReducer, { start, stop, pause, recordEvent } from "../../store/runtimeSlice.js";
import historyReducer, { pushEntry, popForUndo, clearHistory } from "../../store/historySlice.js";
import importReceiptReducer, { showReceipt, dismissReceipt, clearReceipt } from "../../store/importReceiptSlice.js";
import surfaceReducer, { appendSurfaceLine, clearSurface, setRetention } from "../../store/surfaceSlice.js";
import takesReducer, { captureTake, clearTakes, removeTake } from "../../store/takesSlice.js";
import { defaultProject } from "@taroko/core";

// ── projectSlice ────────────────────────────────────────────────────────────────

describe("projectSlice", () => {
  const reduce = (action: ReturnType<typeof setProject | typeof markSaved | typeof mutateProject>) =>
    projectReducer(undefined, action);

  it("initial state has a valid default project", () => {
    const state = projectReducer(undefined, { type: "@@INIT" });
    expect(state.present.schemaVersion).toBeDefined();
    expect(state.isDirty).toBe(false);
    expect(state.lastSavedAt).toBeNull();
  });

  it("setProject replaces and migrates project", () => {
    const p = defaultProject();
    p.project.title = "Custom";
    const state = reduce(setProject(p));
    expect(state.present.project.title).toBe("Custom");
    expect(state.isDirty).toBe(true);
  });

  it("markSaved clears isDirty and records timestamp", () => {
    let state = reduce(setProject(defaultProject()));
    expect(state.isDirty).toBe(true);
    const ts = new Date().toISOString();
    state = projectReducer(state, markSaved(ts));
    expect(state.isDirty).toBe(false);
    expect(state.lastSavedAt).toBe(ts);
  });
});

// ── selectionSlice ─────────────────────────────────────────────────────────────

describe("selectionSlice", () => {
  it("initial state is null", () => {
    const state = selectionReducer(undefined, { type: "@@INIT" });
    expect(state.primary).toBeNull();
    expect(state.secondary).toBeNull();
  });

  it("selectBank sets primary bank selection", () => {
    const state = selectionReducer(undefined, selectBank("above"));
    expect(state.primary).toEqual({ type: "bank", bankName: "above" });
    expect(state.secondary).toBeNull();
  });

  it("selectToken sets token selection", () => {
    const state = selectionReducer(undefined, selectToken({ bankName: "above", tokenId: "tok_1" }));
    expect(state.primary).toEqual({ type: "token", bankName: "above", tokenId: "tok_1" });
  });

  it("selectDevice sets device selection", () => {
    const state = selectionReducer(undefined, selectDevice("ld_path"));
    expect(state.primary).toEqual({ type: "device", deviceId: "ld_path" });
  });

  it("clearSelection resets to null", () => {
    let state = selectionReducer(undefined, selectBank("above"));
    state = selectionReducer(state, clearSelection());
    expect(state.primary).toBeNull();
  });
});

// ── editorSlice ────────────────────────────────────────────────────────────────

describe("editorSlice", () => {
  it("initial activePanel is materials", () => {
    const state = editorReducer(undefined, { type: "@@INIT" });
    expect(state.activePanel).toBe("materials");
  });

  it("setActivePanel changes panel", () => {
    const state = editorReducer(undefined, setActivePanel("instruments"));
    expect(state.activePanel).toBe("instruments");
  });

  it("toggleSidebar flips sidebar open", () => {
    let state = editorReducer(undefined, { type: "@@INIT" });
    const before = state.sidebarOpen;
    state = editorReducer(state, toggleSidebar());
    expect(state.sidebarOpen).toBe(!before);
  });

  it("markPreviewStale sets previewFresh=false", () => {
    let state = editorReducer(undefined, setPreviewFresh(true));
    expect(state.previewFresh).toBe(true);
    state = editorReducer(state, markPreviewStale());
    expect(state.previewFresh).toBe(false);
  });
});

// ── runtimeSlice ───────────────────────────────────────────────────────────────

describe("runtimeSlice", () => {
  it("initial status is stopped", () => {
    const state = runtimeReducer(undefined, { type: "@@INIT" });
    expect(state.status).toBe("stopped");
  });

  it("start sets status to running", () => {
    const state = runtimeReducer(undefined, start());
    expect(state.status).toBe("running");
  });

  it("pause sets status to paused", () => {
    const state = runtimeReducer(undefined, pause());
    expect(state.status).toBe("paused");
  });

  it("stop resets runState and status", () => {
    let state = runtimeReducer(undefined, start());
    state = runtimeReducer(state, stop());
    expect(state.status).toBe("stopped");
    expect(state.runState.tick).toBe(0);
    expect(state.recentEventIds).toHaveLength(0);
  });

  it("recordEvent tracks id and increments tick", () => {
    const ev = {
      id: "ev_0000", tick: 0, type: "breath" as const, surface: "" as const,
      trace: "0000 BREATH", stanzaId: null, sceneId: null,
    };
    const state = runtimeReducer(undefined, recordEvent(ev));
    expect(state.runState.tick).toBe(1);
    expect(state.recentEventIds).toContain("ev_0000");
  });
});

// ── historySlice ───────────────────────────────────────────────────────────────

describe("historySlice", () => {
  it("initial state has empty past and future", () => {
    const state = historyReducer(undefined, { type: "@@INIT" });
    expect(state.past).toHaveLength(0);
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(false);
  });

  it("pushEntry makes canUndo true and clears future", () => {
    const entry = { label: "test", patches: [], inversePatches: [], timestamp: Date.now() };
    const state = historyReducer(undefined, pushEntry(entry));
    expect(state.past).toHaveLength(1);
    expect(state.canUndo).toBe(true);
    expect(state.future).toHaveLength(0);
  });

  it("popForUndo moves entry to future and updates flags", () => {
    const entry = { label: "test", patches: [], inversePatches: [], timestamp: Date.now() };
    let state = historyReducer(undefined, pushEntry(entry));
    state = historyReducer(state, popForUndo());
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(1);
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(true);
  });

  it("clearHistory resets all", () => {
    const entry = { label: "test", patches: [], inversePatches: [], timestamp: Date.now() };
    let state = historyReducer(undefined, pushEntry(entry));
    state = historyReducer(state, clearHistory());
    expect(state.past).toHaveLength(0);
    expect(state.canUndo).toBe(false);
  });
});

// ── importReceiptSlice ─────────────────────────────────────────────────────────

describe("importReceiptSlice", () => {
  it("initial state is invisible", () => {
    const state = importReceiptReducer(undefined, { type: "@@INIT" });
    expect(state.visible).toBe(false);
    expect(state.filename).toBeNull();
  });

  it("showReceipt makes receipt visible with data", () => {
    const state = importReceiptReducer(undefined, showReceipt({
      filename: "test.taroke.json",
      issues: [{ level: "warning", area: "samples.above", message: "empty", action: "add" }],
      repairCount: 2,
    }));
    expect(state.visible).toBe(true);
    expect(state.filename).toBe("test.taroke.json");
    expect(state.issues).toHaveLength(1);
    expect(state.repairCount).toBe(2);
    expect(state.timestamp).not.toBeNull();
  });

  it("dismissReceipt hides without clearing data", () => {
    let state = importReceiptReducer(undefined, showReceipt({ filename: "f.json", issues: [], repairCount: 0 }));
    state = importReceiptReducer(state, dismissReceipt());
    expect(state.visible).toBe(false);
    expect(state.filename).toBe("f.json");
  });

  it("clearReceipt resets all", () => {
    let state = importReceiptReducer(undefined, showReceipt({ filename: "f.json", issues: [], repairCount: 1 }));
    state = importReceiptReducer(state, clearReceipt());
    expect(state.visible).toBe(false);
    expect(state.filename).toBeNull();
    expect(state.repairCount).toBe(0);
  });
});

// ── surfaceSlice ────────────────────────────────────────────────────────────────

describe("surfaceSlice", () => {
  it("initial state has empty lines and default retention 28", () => {
    const state = surfaceReducer(undefined, { type: "@@INIT" });
    expect(state.lines).toEqual([]);
    expect(state.retention).toBe(28);
  });

  it("appendSurfaceLine adds a line", () => {
    const state = surfaceReducer(undefined, appendSurfaceLine("line one"));
    expect(state.lines).toEqual(["line one"]);
  });

  it("appendSurfaceLine enforces retention limit", () => {
    let state = surfaceReducer(undefined, setRetention(3));
    state = surfaceReducer(state, appendSurfaceLine("a"));
    state = surfaceReducer(state, appendSurfaceLine("b"));
    state = surfaceReducer(state, appendSurfaceLine("c"));
    expect(state.lines).toHaveLength(3);
    state = surfaceReducer(state, appendSurfaceLine("d"));
    expect(state.lines).toHaveLength(3);
    expect(state.lines).toEqual(["b", "c", "d"]);
  });

  it("clearSurface resets lines to empty array", () => {
    let state = surfaceReducer(undefined, appendSurfaceLine("x"));
    state = surfaceReducer(state, appendSurfaceLine("y"));
    state = surfaceReducer(state, clearSurface());
    expect(state.lines).toEqual([]);
  });
});

// ── takesSlice ─────────────────────────────────────────────────────────────────

describe("takesSlice", () => {
  const sampleTake = { id: "t1", tick: 3, surface: "walked the gorge", trace: "PATH>above>rock", deviceName: "PATH", route: "r1" };

  it("initial state has empty takes", () => {
    const state = takesReducer(undefined, { type: "@@INIT" });
    expect(state.takes).toEqual([]);
  });

  it("captureTake appends to takes with capturedAt timestamp", () => {
    const state = takesReducer(undefined, captureTake(sampleTake));
    expect(state.takes).toHaveLength(1);
    expect(state.takes[0]?.surface).toBe("walked the gorge");
    expect(state.takes[0]?.capturedAt).toBeDefined();
  });

  it("removeTake removes by id", () => {
    let state = takesReducer(undefined, captureTake(sampleTake));
    state = takesReducer(state, removeTake("t1"));
    expect(state.takes).toHaveLength(0);
  });

  it("clearTakes empties the list", () => {
    let state = takesReducer(undefined, captureTake(sampleTake));
    state = takesReducer(state, captureTake({ ...sampleTake, id: "t2" }));
    state = takesReducer(state, clearTakes());
    expect(state.takes).toEqual([]);
  });
});
