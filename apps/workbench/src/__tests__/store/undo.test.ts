import { describe, it, expect, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { enablePatches } from "immer";
import projectReducer, { mutateProject } from "../../store/projectSlice.js";
import selectionReducer from "../../store/selectionSlice.js";
import editorReducer from "../../store/editorSlice.js";
import runtimeReducer from "../../store/runtimeSlice.js";
import historyReducer, { popForUndo, popForRedo } from "../../store/historySlice.js";
import importReceiptReducer from "../../store/importReceiptSlice.js";
import takesReducer from "../../store/takesSlice.js";
import surfaceReducer from "../../store/surfaceSlice.js";
import { createUndoMiddleware } from "../../store/undoMiddleware.js";
import { autosaveMiddleware } from "../../store/autosave.js";
import { setProjectTitle, addToken, removeToken } from "../../store/commands.js";
import { defaultProject } from "@taroko/core";

// enablePatches must be called before any produceWithPatches / applyPatches usage
enablePatches();

// Each test store gets a fresh undoMiddleware instance (isolated coalescing state)
function makeStore() {
  return configureStore({
    reducer: {
      project: projectReducer,
      selection: selectionReducer,
      editor: editorReducer,
      runtime: runtimeReducer,
      history: historyReducer,
      importReceipt: importReceiptReducer,
      takes: takesReducer,
      surface: surfaceReducer,
    },
    middleware: (get) =>
      get({ serializableCheck: { ignoredActionPaths: ["payload.patches", "payload.inversePatches"] } })
        .prepend(createUndoMiddleware())
        .concat(autosaveMiddleware),
  });
}

function dispatchCmd(store: ReturnType<typeof makeStore>, result: ReturnType<typeof setProjectTitle>) {
  store.dispatch(mutateProject(result));
}

// ── Undo / Redo integration ─────────────────────────────────────────────────────

describe("undo / redo — middleware integration", () => {
  it("dispatching a command records one history entry", () => {
    const store = makeStore();
    const p = store.getState().project.present;
    dispatchCmd(store, setProjectTitle(p, "Title A"));
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().history.canUndo).toBe(true);
  });

  it("undo reverts project state and moves entry to future", () => {
    const store = makeStore();
    const original = store.getState().project.present.project.title;
    dispatchCmd(store, setProjectTitle(store.getState().project.present, "Title A"));
    expect(store.getState().project.present.project.title).toBe("Title A");

    store.dispatch(popForUndo());
    expect(store.getState().project.present.project.title).toBe(original);
    expect(store.getState().history.past).toHaveLength(0);
    expect(store.getState().history.future).toHaveLength(1);
    expect(store.getState().history.canRedo).toBe(true);
  });

  it("undo does NOT corrupt future (P0 regression guard)", () => {
    const store = makeStore();
    dispatchCmd(store, setProjectTitle(store.getState().project.present, "Title A"));
    store.dispatch(popForUndo());
    // future must still hold exactly one entry — P0 bug would zero it out
    expect(store.getState().history.future).toHaveLength(1);
    expect(store.getState().history.canRedo).toBe(true);
  });

  it("redo re-applies the command after undo", () => {
    const store = makeStore();
    dispatchCmd(store, setProjectTitle(store.getState().project.present, "Title A"));
    store.dispatch(popForUndo());
    store.dispatch(popForRedo());
    expect(store.getState().project.present.project.title).toBe("Title A");
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().history.future).toHaveLength(0);
  });

  it("second undo after redo works correctly (multi-step round-trip)", () => {
    // Use fake timers to space commands beyond the 800ms coalescing window so
    // both commits land in history as separate entries.
    vi.useFakeTimers();
    try {
      const store = makeStore();
      const original = store.getState().project.present.project.title;
      vi.setSystemTime(1000);
      dispatchCmd(store, setProjectTitle(store.getState().project.present, "A"));
      vi.setSystemTime(2000); // 1000ms gap — beyond coalescing window
      dispatchCmd(store, setProjectTitle(store.getState().project.present, "B"));
      expect(store.getState().history.past).toHaveLength(2);
      store.dispatch(popForUndo()); // back to A
      store.dispatch(popForUndo()); // back to original
      expect(store.getState().project.present.project.title).toBe(original);
      store.dispatch(popForRedo()); // forward to A
      expect(store.getState().project.present.project.title).toBe("A");
      store.dispatch(popForRedo()); // forward to B
      expect(store.getState().project.present.project.title).toBe("B");
    } finally {
      vi.useRealTimers();
    }
  });

  it("undo restore dispatch does not push to history (skipHistory guard)", () => {
    const store = makeStore();
    dispatchCmd(store, setProjectTitle(store.getState().project.present, "A"));
    const beforeUndo = store.getState().history.past.length; // 1
    store.dispatch(popForUndo());
    // The restore mutateProject(skipHistory:true) must NOT push a new entry to past
    expect(store.getState().history.past.length).toBe(beforeUndo - 1); // 0
  });
});

// ── Coalescing ─────────────────────────────────────────────────────────────────

describe("undo coalescing", () => {
  it("two same-label commands within 800ms produce one history entry", () => {
    vi.useFakeTimers();
    try {
      const store = makeStore();
      vi.setSystemTime(1000);
      dispatchCmd(store, setProjectTitle(store.getState().project.present, "A"));
      vi.setSystemTime(1400); // 400ms later — within window
      dispatchCmd(store, setProjectTitle(store.getState().project.present, "AB"));
      expect(store.getState().history.past).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("same-label commands separated by >800ms produce two history entries", () => {
    vi.useFakeTimers();
    try {
      const store = makeStore();
      vi.setSystemTime(1000);
      dispatchCmd(store, setProjectTitle(store.getState().project.present, "A"));
      vi.setSystemTime(1901); // 901ms later — outside window
      dispatchCmd(store, setProjectTitle(store.getState().project.present, "AB"));
      expect(store.getState().history.past).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("delete commands are never coalesced", () => {
    const store = makeStore();
    const p = store.getState().project.present;
    const tok = p.materials.trays["above"]![0]!;
    dispatchCmd(store, removeToken(p, "above", tok.id));
    const p2 = store.getState().project.present;
    const tok2 = p2.materials.trays["above"]![0];
    if (tok2) {
      dispatchCmd(store, removeToken(p2, "above", tok2.id));
      expect(store.getState().history.past).toHaveLength(2);
    }
  });

  it("different labels are never coalesced", () => {
    const store = makeStore();
    dispatchCmd(store, setProjectTitle(store.getState().project.present, "A"));
    const p = store.getState().project.present;
    dispatchCmd(store, addToken(p, "above", "word"));
    expect(store.getState().history.past).toHaveLength(2);
  });
});

// ── 50-entry history cap ────────────────────────────────────────────────────────

describe("history 50-entry cap", () => {
  it("pushing 51 commands keeps history.past at exactly 50", () => {
    vi.useFakeTimers();
    try {
      const store = makeStore();
      for (let i = 0; i < 51; i++) {
        vi.setSystemTime(i * 1000); // 1s apart — no coalescing
        dispatchCmd(store, setProjectTitle(store.getState().project.present, `Title ${i}`));
      }
      expect(store.getState().history.past).toHaveLength(50);
    } finally {
      vi.useRealTimers();
    }
  });
});
