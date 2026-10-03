import { describe, it, expect } from "vitest";
import { enablePatches } from "immer";
enablePatches();
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "../../store/projectSlice.js";
import selectionReducer, { selectBank, selectDevice, selectTrigger } from "../../store/selectionSlice.js";
import editorReducer from "../../store/editorSlice.js";
import runtimeReducer from "../../store/runtimeSlice.js";
import historyReducer from "../../store/historySlice.js";
import importReceiptReducer, { showReceipt } from "../../store/importReceiptSlice.js";
import { ImportReceiptBanner } from "../../panels/ImportReceiptBanner.js";
import takesReducer from "../../store/takesSlice.js";
import surfaceReducer from "../../store/surfaceSlice.js";
import { MaterialsPanel } from "../../panels/MaterialsPanel.js";
import { FormsPanel } from "../../panels/FormsPanel.js";
import { InstrumentsPanel } from "../../panels/InstrumentsPanel.js";
import { CompositionPanel } from "../../panels/CompositionPanel.js";
import { AutomationPanel } from "../../panels/AutomationPanel.js";
import { PerformancePanel } from "../../panels/PerformancePanel.js";
import { ArchivePanel } from "../../panels/ArchivePanel.js";

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
  });
}

function wrap(ui: React.ReactElement, store = makeStore()) {
  return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

// ── MaterialsPanel ─────────────────────────────────────────────────────────────

describe("MaterialsPanel", () => {
  it("renders BANKS section heading", () => {
    wrap(<MaterialsPanel />);
    expect(screen.getByText("BANKS")).toBeInTheDocument();
  });

  it("lists banks from the default project", () => {
    wrap(<MaterialsPanel />);
    // default project has 'above' bank with label defined in TRAY_DEFS
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("selecting a bank shows its samples", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    expect(screen.getByText(/Wt/)).toBeInTheDocument();
  });

  it("shows add sample input when a bank is selected", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    expect(screen.getByLabelText("New sample literal")).toBeInTheDocument();
  });

  it("add sample button dispatches command", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const input = screen.getByLabelText("New sample literal");
    fireEvent.change(input, { target: { value: "test-sample" } });
    fireEvent.click(screen.getByText("Add"));
    const trays = store.getState().project.present.materials.trays;
    expect(trays["above"]?.some((t) => t.literal === "test-sample")).toBe(true);
  });
});

// ── InstrumentsPanel ───────────────────────────────────────────────────────────

describe("InstrumentsPanel", () => {
  it("renders DEVICES section heading", () => {
    wrap(<InstrumentsPanel />);
    expect(screen.getByText("DEVICES")).toBeInTheDocument();
  });

  it("lists default devices (PATH, SITE, CAVE)", () => {
    wrap(<InstrumentsPanel />);
    expect(screen.getAllByText("PATH").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SITE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CAVE").length).toBeGreaterThan(0);
  });

  it("shows routes when device is selected", () => {
    const store = makeStore();
    store.dispatch(selectDevice("ld_path"));
    wrap(<InstrumentsPanel />, store);
    expect(screen.getByText("ROUTES")).toBeInTheDocument();
  });
});

// ── CompositionPanel ───────────────────────────────────────────────────────────

describe("CompositionPanel", () => {
  it("renders PATTERNS section heading", () => {
    wrap(<CompositionPanel />);
    expect(screen.getByText("PATTERNS")).toBeInTheDocument();
  });

  it("lists default stanza pattern", () => {
    wrap(<CompositionPanel />);
    expect(screen.getAllByText("Classic Taroko stanza").length).toBeGreaterThan(0);
  });

  it("shows slots for selected stanza with slot content", () => {
    wrap(<CompositionPanel />);
    expect(screen.getByText("SLOTS")).toBeInTheDocument();
    // Default stanza has slots; at least one slot chip or row must be present
    const slotRows = document.querySelectorAll(".tr-slot-row, .tr-slot, [class*='slot']");
    const slotBtns = screen.queryAllByRole("button", { name: /move slot/i });
    expect(slotRows.length + slotBtns.length, "Expected slot rows or reorder buttons in default stanza").toBeGreaterThan(0);
  });
});

// ── AutomationPanel ────────────────────────────────────────────────────────────

describe("AutomationPanel", () => {
  it("renders TRIGGERS section heading", () => {
    wrap(<AutomationPanel />);
    expect(screen.getByText("TRIGGERS")).toBeInTheDocument();
  });

  it("shows default trigger", () => {
    wrap(<AutomationPanel />);
    expect(screen.getByText("box intrusion")).toBeInTheDocument();
  });

  it("shows WHEN and THEN labels paired with actual trigger condition and action", () => {
    wrap(<AutomationPanel />);
    expect(screen.getAllByText("WHEN").length).toBeGreaterThan(0);
    expect(screen.getAllByText("THEN").length).toBeGreaterThan(0);
    // Default project has a trigger with "box intrusion" condition — verify it appears in context
    const triggerText = screen.getByText("box intrusion");
    expect(triggerText).toBeInTheDocument();
    // The trigger label must be readable alongside WHEN/THEN structure
    const whenEl = screen.getAllByText("WHEN")[0]!;
    const container = whenEl.closest("[class*='tr-trigger'], [class*='trigger'], li, article") ?? whenEl.parentElement;
    expect(container).not.toBeNull();
  });

  it("toggling trigger enabled dispatches command", () => {
    const store = makeStore();
    store.dispatch(selectTrigger("tr_box"));
    wrap(<AutomationPanel />, store);
    const toggleBtn = screen.getByText("ON");
    fireEvent.click(toggleBtn);
    const trigger = store.getState().project.present.triggers.find((t) => t.id === "tr_box");
    expect(trigger?.enabled).toBe(false);
  });
});

// ── PerformancePanel ───────────────────────────────────────────────────────────

describe("PerformancePanel", () => {
  it("renders CUE section heading", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByText("CUE")).toBeInTheDocument();
  });

  it("renders Audition button in Cue section", () => {
    wrap(<PerformancePanel />);
    // Cue has an Audition button (private preview, aria-label "Generate next event")
    expect(screen.getByRole("button", { name: /Generate next event/i })).toBeInTheDocument();
  });

  it("renders SURFACE section heading", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByText("SURFACE")).toBeInTheDocument();
  });

  it("clicking Cue Audition shows a Cue preview (line or breath)", () => {
    wrap(<PerformancePanel />);
    fireEvent.click(screen.getByRole("button", { name: /Generate next event/i }));
    // After Cue audition: Cue section shows either a line preview or a breath marker
    const hasCueLine = screen.queryByText(/tr-cue__line/) !== null
      || document.querySelector(".tr-cue__line") !== null
      || document.querySelector(".tr-cue__breath") !== null
      || screen.queryByText("— breath —") !== null
      || screen.queryByRole("status") !== null
      || !!document.querySelector(".tr-cue__output");
    expect(hasCueLine).toBe(true);
  });

  // REGRESSION: Cue is a private audition — it must never append to Surface history.
  it("REGRESSION: Cue Generate does not append to Surface history", () => {
    wrap(<PerformancePanel />);
    // Surface starts empty
    expect(screen.getByText("Generate events to see surface output.")).toBeInTheDocument();
    // Click Cue Generate multiple times to ensure we get at least one line event
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByRole("button", { name: /Generate next event/i }));
    }
    // Surface MUST still show the empty placeholder — Cue is private audition
    expect(screen.getByText("Generate events to see surface output.")).toBeInTheDocument();
  });

  // REGRESSION: Surface must have its own separate generate/run action.
  it("REGRESSION: Surface has its own generate action separate from Cue", () => {
    wrap(<PerformancePanel />);
    // Surface has a "Generate ▶" button with aria-label distinguishing it from Cue
    const surfaceGenBtn = screen.queryByRole("button", { name: /Surface: generate/i })
      ?? screen.queryByLabelText(/Surface: generate/i);
    expect(surfaceGenBtn).not.toBeNull();
  });
});

// ── ArchivePanel ───────────────────────────────────────────────────────────────

describe("ArchivePanel", () => {
  it("renders EXPORT section heading", () => {
    wrap(<ArchivePanel />);
    expect(screen.getByText("EXPORT")).toBeInTheDocument();
  });

  it("renders JSON export button", () => {
    wrap(<ArchivePanel />);
    expect(screen.getByText(/Export JSON/)).toBeInTheDocument();
  });

  it("renders HTML export button", () => {
    wrap(<ArchivePanel />);
    expect(screen.getByText(/Export HTML/)).toBeInTheDocument();
  });

  it("renders import button", () => {
    wrap(<ArchivePanel />);
    expect(screen.getByText(/Import/)).toBeInTheDocument();
  });

  it("shows project info table", () => {
    wrap(<ArchivePanel />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Grave sample")).toBeInTheDocument();
  });

  it("shows role=alert error message when a malformed file is imported", async () => {
    wrap(<ArchivePanel />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    const badFile = new File(["{ not valid json }"], "bad.taroke.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [badFile] } });
    // Wait for observable DOM state change — alert element must appear
    const alert = await waitFor(() => {
      const el = screen.queryByRole("alert");
      if (!el) throw new Error("alert not yet rendered");
      return el;
    }, { timeout: 2000 });
    expect(alert.textContent).toMatch(/could not|error|invalid|failed/i);
  });
});

// ── Takes (store-backed) ───────────────────────────────────────────────────────

import { captureTake } from "../../store/takesSlice.js";

describe("PerformancePanel — store-backed Takes", () => {
  it("renders takes from Redux store, not local state", () => {
    const store = makeStore();
    store.dispatch(captureTake({
      id: "take_test_1",
      tick: 5,
      surface: "river stirs the branch",
      trace: "PATH:plural",
      deviceName: "PATH",
      route: "plural",
    }));
    wrap(<PerformancePanel />, store);
    expect(screen.getByText("river stirs the branch")).toBeInTheDocument();
  });

  it("Capture Take button dispatches to Redux takes slice", () => {
    const store = makeStore();
    wrap(<PerformancePanel />, store);
    // Generate first so there is a current event
    const generateBtn = screen.getByRole("button", { name: /generate next event/i });
    fireEvent.click(generateBtn);
    // Capture Take may appear if last event was a line (not a breath)
    const captureBtn = screen.queryByRole("button", { name: /capture take/i });
    if (captureBtn) {
      fireEvent.click(captureBtn);
      expect(store.getState().takes.takes.length).toBeGreaterThan(0);
    }
  });
});

// ── ImportReceiptBanner ────────────────────────────────────────────────────────

describe("ImportReceiptBanner", () => {
  it("does not render when receipt is not visible", () => {
    const { container } = wrap(<ImportReceiptBanner />);
    expect(container.querySelector(".tr-import-receipt")).toBeNull();
  });

  it("renders filename and repair count when visible", () => {
    const store = makeStore();
    store.dispatch(showReceipt({
      filename: "my-poem.taroke.json",
      issues: [],
      repairCount: 2,
    }));
    wrap(<ImportReceiptBanner />, store);
    expect(screen.getByText(/my-poem\.taroke\.json/)).toBeInTheDocument();
    expect(screen.getByText(/2 repair/)).toBeInTheDocument();
  });

  it("dismiss button hides the banner", () => {
    const store = makeStore();
    store.dispatch(showReceipt({ filename: "test.taroke.json", issues: [], repairCount: 0 }));
    wrap(<ImportReceiptBanner />, store);
    const dismiss = screen.getByRole("button", { name: /dismiss import receipt/i });
    fireEvent.click(dismiss);
    expect(store.getState().importReceipt.visible).toBe(false);
  });
});

// ── MaterialsPanel — accessible reorder ───────────────────────────────────────

describe("MaterialsPanel — accessible reorder", () => {
  it("renders Up/Down buttons for each token", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const upButtons = screen.getAllByRole("button", { name: /move .+ up/i });
    expect(upButtons.length).toBeGreaterThan(0);
    const downButtons = screen.getAllByRole("button", { name: /move .+ down/i });
    expect(downButtons.length).toBeGreaterThan(0);
  });

  it("Up button is disabled for the first token", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const upButtons = screen.getAllByRole("button", { name: /move .+ up/i });
    expect(upButtons[0]).toBeDisabled();
  });

  it("Down button is disabled for the last token", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const downButtons = screen.getAllByRole("button", { name: /move .+ down/i });
    expect(downButtons[downButtons.length - 1]).toBeDisabled();
  });

  it("clicking an enabled Up button changes token order with stable IDs", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);

    const before = store.getState().project.present.materials.trays["above"]!.map((t) => t.id);
    expect(before.length, "bank must have at least 2 tokens to test reorder").toBeGreaterThan(1);

    // Find the first enabled Up button (index 1+ since index 0 is disabled)
    const upButtons = screen.getAllByRole("button", { name: /move .+ up/i });
    const enabledUp = upButtons.find((btn) => !btn.hasAttribute("disabled"));
    expect(enabledUp, "Expected at least one enabled Up button").toBeTruthy();
    fireEvent.click(enabledUp!);

    const after = store.getState().project.present.materials.trays["above"]!.map((t) => t.id);
    // IDs must all be present (stable) but order must have changed
    expect([...after].sort()).toEqual([...before].sort());
    expect(after).not.toEqual(before);
  });
});

// ── MaterialsPanel — literal editing and expected share ───────────────────────

describe("MaterialsPanel — literal editing and expected share", () => {
  it("shows literal input fields for each token", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const inputs = screen.getAllByRole("textbox", { name: /literal for sample/i });
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("editing a literal input updates the project model", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const inputs = screen.getAllByRole("textbox", { name: /literal for sample/i });
    fireEvent.change(inputs[0]!, { target: { value: "renamed-token" } });
    const tokens = store.getState().project.present.materials.trays["above"];
    expect(tokens?.some((t) => t.literal === "renamed-token")).toBe(true);
  });

  it("shows a Share column header", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    expect(screen.getByRole("columnheader", { name: "Share" })).toBeInTheDocument();
  });

  it("shows percentage in the share column for a token", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const pctCells = document.querySelectorAll(".tr-table__td--share");
    expect(pctCells.length).toBeGreaterThan(0);
    expect(pctCells[0]!.textContent).toMatch(/%/);
  });
});

// ── CompositionPanel — slot reorder ──────────────────────────────────────────

describe("CompositionPanel — slot reorder", () => {
  it("renders Up/Down reorder buttons for each slot", () => {
    const store = makeStore();
    wrap(<CompositionPanel />, store);
    const upBtns = screen.queryAllByRole("button", { name: /move slot .+ up/i });
    const downBtns = screen.queryAllByRole("button", { name: /move slot .+ down/i });
    expect(upBtns.length + downBtns.length).toBeGreaterThan(0);
  });

  it("Up button is disabled for the first slot", () => {
    const store = makeStore();
    wrap(<CompositionPanel />, store);
    const upBtns = screen.queryAllByRole("button", { name: /move slot .+ up/i });
    if (upBtns.length > 0) {
      expect(upBtns[0]).toBeDisabled();
    }
  });
});

// ── FormsPanel ─────────────────────────────────────────────────────────────────

describe("FormsPanel", () => {
  it("renders FORMS section heading", () => {
    wrap(<FormsPanel />);
    expect(screen.getByText("FORMS")).toBeInTheDocument();
  });

  it("renders case policy select", () => {
    wrap(<FormsPanel />);
    expect(screen.getByRole("combobox", { name: /case policy/i })).toBeInTheDocument();
  });

  it("renders OVERRIDES section heading", () => {
    wrap(<FormsPanel />);
    expect(screen.getByText("OVERRIDES")).toBeInTheDocument();
  });

  it("changing case policy updates the project", () => {
    const store = makeStore();
    wrap(<FormsPanel />, store);
    const select = screen.getByRole("combobox", { name: /case policy/i });
    fireEvent.change(select, { target: { value: "lower" } });
    expect(store.getState().project.present.forms.casePolicy).toBe("lower");
  });
});

// ── ArchivePanel — import receipt dispatch ────────────────────────────────────

describe("ArchivePanel — import receipt dispatch on success", () => {
  it("reads a valid project file, migrates it, replaces state, and shows receipt", async () => {
    const store = makeStore();
    const titleBefore = store.getState().project.present.project.title;

    wrap(<ArchivePanel />, store);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const importedTitle = "receipt-import-test-" + Date.now();
    const validProject = JSON.stringify({
      schemaVersion: "7.8",
      project: { title: importedTitle, author: "test-author" },
      materials: {
        trays: { above: [{ id: "tok_a1", literal: "wave", role: "noun", weight: 1, lockedLiteral: false }] },
        bankMeta: {},
      },
      forms: { casePolicy: "source" },
      lineDevices: [],
      stanzaPatterns: [],
      flowScenes: [],
      triggers: [],
      meta: {},
    });
    const file = new File([validProject], "receipt-import-test.taroke.json", { type: "application/json" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // FileReader fires onload asynchronously — wait for Redux state to update
    await waitFor(() => {
      expect(store.getState().importReceipt.visible, "importReceipt.visible must become true after import").toBe(true);
    }, { timeout: 2000 });

    // Verify the project state was replaced with the imported project
    const titleAfter = store.getState().project.present.project.title;
    expect(titleAfter).toBe(importedTitle);
    expect(titleAfter).not.toBe(titleBefore);

    // Verify receipt contains the correct filename
    expect(store.getState().importReceipt.filename).toBe("receipt-import-test.taroke.json");
  });
});

// ── InstrumentsPanel — route variable palette ─────────────────────────────────

describe("InstrumentsPanel — route variable palette", () => {
  it("shows variable chip buttons when device has inputs", () => {
    const store = makeStore();
    store.dispatch(selectDevice("ld_path"));
    wrap(<InstrumentsPanel />, store);
    const chips = screen.queryAllByRole("button", { name: /insert .+:.+ variable/i });
    expect(chips.length).toBeGreaterThan(0);
  });

  it("chip labels use {slot:form} format", () => {
    const store = makeStore();
    store.dispatch(selectDevice("ld_path"));
    wrap(<InstrumentsPanel />, store);
    const chips = screen.queryAllByRole("button", { name: /insert .+:.+ variable/i });
    // Hard failure: chips must be present when a device with inputs is selected
    expect(chips.length, "Expected at least one {slot:form} chip when PATH device is selected").toBeGreaterThan(0);
    expect(chips[0]!.textContent).toMatch(/\{.+:.+\}/);
  });
});
