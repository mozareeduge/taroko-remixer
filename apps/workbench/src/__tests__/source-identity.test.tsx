import { describe, it, expect } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { enablePatches } from "immer";
enablePatches();
import projectReducer, { mutateProject } from "../store/projectSlice.js";
import selectionReducer from "../store/selectionSlice.js";
import editorReducer, { setActivePanel } from "../store/editorSlice.js";
import runtimeReducer from "../store/runtimeSlice.js";
import historyReducer, { popForUndo, popForRedo } from "../store/historySlice.js";
import importReceiptReducer from "../store/importReceiptSlice.js";
import takesReducer from "../store/takesSlice.js";
import surfaceReducer from "../store/surfaceSlice.js";
import { createUndoMiddleware } from "../store/undoMiddleware.js";
import { autosaveMiddleware } from "../store/autosave.js";
import {
  setProjectTitle,
  setProjectAuthor,
  setProjectLanguage,
  setProjectSourceTitle,
  setProjectSourceUrl,
  setProjectStatement,
  setProjectCredits,
} from "../store/commands.js";
import { defaultProject } from "@taroke/core";
import { downloadName } from "@taroke/core";
import type { EditorPanel } from "../store/types.js";

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

// ── Source navigation ──────────────────────────────────────────────────────────

describe("source navigation — EditorPanel type", () => {
  it("'source' is a valid EditorPanel value", () => {
    const panel: EditorPanel = "source";
    expect(panel).toBe("source");
  });

  it("setActivePanel accepts 'source'", () => {
    const store = makeStore();
    store.dispatch(setActivePanel("source"));
    expect(store.getState().editor.activePanel).toBe("source");
  });

  it("switching from 'source' to 'materials' works", () => {
    const store = makeStore();
    store.dispatch(setActivePanel("source"));
    store.dispatch(setActivePanel("materials"));
    expect(store.getState().editor.activePanel).toBe("materials");
  });

  it("switching back to 'source' preserves current bank selection", () => {
    const store = makeStore();
    store.dispatch(setActivePanel("materials"));
    store.dispatch(setActivePanel("source"));
    store.dispatch(setActivePanel("materials"));
    // bank selection (selection state) unchanged by panel navigation
    expect(store.getState().selection.primary).toBeNull();
  });
});

// ── Undo/redo of identity edits ───────────────────────────────────────────────

describe("undo/redo — identity field edits", () => {
  it("undo reverts setProjectTitle", () => {
    const store = makeStore();
    const original = store.getState().project.present.project.title;
    store.dispatch(mutateProject(setProjectTitle(store.getState().project.present, "Changed Title")));
    expect(store.getState().project.present.project.title).toBe("Changed Title");
    store.dispatch(popForUndo());
    expect(store.getState().project.present.project.title).toBe(original);
  });

  it("redo reapplies setProjectTitle after undo", () => {
    const store = makeStore();
    store.dispatch(mutateProject(setProjectTitle(store.getState().project.present, "Redone Title")));
    store.dispatch(popForUndo());
    store.dispatch(popForRedo());
    expect(store.getState().project.present.project.title).toBe("Redone Title");
  });

  it("undo reverts setProjectLanguage", () => {
    const store = makeStore();
    const original = store.getState().project.present.project.language;
    store.dispatch(mutateProject(setProjectLanguage(store.getState().project.present, "Tagalog")));
    store.dispatch(popForUndo());
    expect(store.getState().project.present.project.language).toBe(original);
  });

  it("undo reverts setProjectSourceTitle", () => {
    const store = makeStore();
    store.dispatch(mutateProject(setProjectSourceTitle(store.getState().project.present, "Taroko Gorge")));
    store.dispatch(popForUndo());
    expect(store.getState().project.present.project.sourceTitle).toBe(defaultProject().project.sourceTitle);
  });

  it("undo reverts setProjectStatement", () => {
    const store = makeStore();
    store.dispatch(mutateProject(setProjectStatement(store.getState().project.present, "A statement.")));
    store.dispatch(popForUndo());
    expect(store.getState().project.present.project.statement).toBe(defaultProject().project.statement);
  });

  it("undo reverts setProjectCredits", () => {
    const store = makeStore();
    store.dispatch(mutateProject(setProjectCredits(store.getState().project.present, "Credits here.")));
    store.dispatch(popForUndo());
    expect(store.getState().project.present.project.credits).toBe(defaultProject().project.credits);
  });
});

// ── Blank title fallback and safe filename ────────────────────────────────────

describe("blank title fallback and filename safety", () => {
  it("blank title field stays blank in project state", () => {
    const store = makeStore();
    store.dispatch(mutateProject(setProjectTitle(store.getState().project.present, "")));
    expect(store.getState().project.present.project.title).toBe("");
  });

  it("blank title produces safe fallback filename", () => {
    const p = defaultProject();
    p.project.title = "";
    expect(downloadName(p, ".taroke.json")).toBe("taroke_rimix.taroke.json");
  });

  it("special-char title is sanitized in filename", () => {
    const p = defaultProject();
    p.project.title = "My Project <&> Test";
    expect(downloadName(p, ".taroke.json")).toBe("my_project_test.taroke.json");
  });

  it("whitespace-only title produces safe fallback filename", () => {
    const p = defaultProject();
    p.project.title = "   ";
    expect(downloadName(p, ".taroke.json")).toBe("taroke_rimix.taroke.json");
  });
});

// ── Source URL validation ────────────────────────────────────────────────────

describe("source URL — store allows any value, validation is local", () => {
  it("invalid URL is stored without error", () => {
    const store = makeStore();
    store.dispatch(mutateProject(setProjectSourceUrl(store.getState().project.present, "not-a-url")));
    expect(store.getState().project.present.project.sourceUrl).toBe("not-a-url");
  });

  it("empty URL is stored as empty string", () => {
    const store = makeStore();
    store.dispatch(mutateProject(setProjectSourceUrl(store.getState().project.present, "")));
    expect(store.getState().project.present.project.sourceUrl).toBe("");
  });

  it("valid https URL is stored correctly", () => {
    const store = makeStore();
    store.dispatch(mutateProject(setProjectSourceUrl(store.getState().project.present, "https://example.com/poem")));
    expect(store.getState().project.present.project.sourceUrl).toBe("https://example.com/poem");
  });

  it("ftp URL is stored but treated as invalid by isValidHttpUrl logic", () => {
    const store = makeStore();
    store.dispatch(mutateProject(setProjectSourceUrl(store.getState().project.present, "ftp://example.com")));
    expect(store.getState().project.present.project.sourceUrl).toBe("ftp://example.com");
    // Validation logic (extracted here for unit test): ftp is not http/https
    const url = store.getState().project.present.project.sourceUrl;
    let isValid = true;
    try { const u = new URL(url); isValid = u.protocol === "http:" || u.protocol === "https:"; } catch { isValid = false; }
    expect(isValid).toBe(false);
  });
});
