/**
 * final-horizon-performance.test.tsx
 * T03 performance chambers: Surface event records with provenance,
 * Monitor collapsible, line selection, follow suspend/resume,
 * UNMIX for selected line, Takes with annotation.
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "../store/projectSlice.js";
import selectionReducer from "../store/selectionSlice.js";
import editorReducer from "../store/editorSlice.js";
import runtimeReducer from "../store/runtimeSlice.js";
import historyReducer from "../store/historySlice.js";
import importReceiptReducer from "../store/importReceiptSlice.js";
import takesReducer, { captureTake } from "../store/takesSlice.js";
import surfaceReducer, {
  appendSurfaceRecord, selectLine, setFollowActive,
  type SurfaceRecord,
} from "../store/surfaceSlice.js";
import { PerformancePanel } from "../panels/PerformancePanel.js";

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

const SAMPLE_RECORD: SurfaceRecord = {
  id: "sl_001",
  tick: 3,
  surface: "graves carry the floor",
  deviceName: "PATH",
  route: "plural",
  trace: "PATH:plural",
  consumedInputs: [
    { slot: "above", tray: "above", sourceLiteral: "grave", direct: true },
    { slot: "trans", tray: "trans", sourceLiteral: "carry", direct: true },
    { slot: "below", tray: "below", sourceLiteral: "floor", direct: true },
  ],
};

// ── CUE section ───────────────────────────────────────────────────────────────

describe("PerformancePanel: CUE section (T03)", () => {
  it("renders CUE heading", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByText("CUE")).toBeInTheDocument();
  });

  it("has Audition button with aria-label Generate next event", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByRole("button", { name: /Generate next event/i })).toBeInTheDocument();
  });
});

// ── SURFACE section ───────────────────────────────────────────────────────────

describe("PerformancePanel: SURFACE section (T03)", () => {
  it("renders SURFACE heading", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByText("SURFACE")).toBeInTheDocument();
  });

  it("shows empty message when no records", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByText("Generate events to see surface output.")).toBeInTheDocument();
  });

  it("renders a surface record's text when records exist in store", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord(SAMPLE_RECORD));
    wrap(<PerformancePanel />, store);
    expect(screen.getByText("graves carry the floor")).toBeInTheDocument();
  });

  it("Surface has its own generate action (Surface: generate label)", () => {
    wrap(<PerformancePanel />);
    const genBtn = screen.queryByRole("button", { name: /Surface: generate/i });
    expect(genBtn).not.toBeNull();
  });

  it("surfaceSlice stores SurfaceRecord with provenance (not just strings)", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord(SAMPLE_RECORD));
    const { records } = store.getState().surface;
    expect(records[0]).toBeDefined();
    expect(records[0]!.deviceName).toBe("PATH");
    expect(records[0]!.route).toBe("plural");
    expect(records[0]!.consumedInputs?.length).toBeGreaterThan(0);
  });

  it("surfaceSlice also maintains backward-compat lines array", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord(SAMPLE_RECORD));
    const { lines } = store.getState().surface;
    expect(lines).toContain("graves carry the floor");
  });
});

// ── MONITOR section ───────────────────────────────────────────────────────────

describe("PerformancePanel: MONITOR section (T03)", () => {
  it("renders MONITOR heading", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByText("MONITOR")).toBeInTheDocument();
  });

  it("Monitor has expand/collapse toggle button with aria-expanded", () => {
    wrap(<PerformancePanel />);
    const toggle = screen.queryAllByRole("button").find(
      (b) => b.hasAttribute("aria-expanded") && b.hasAttribute("aria-controls")
    );
    expect(toggle).toBeDefined();
    expect(toggle!.getAttribute("aria-controls")).toBe("tr-monitor-body");
  });

  it("Monitor body is hidden by default (collapsed)", () => {
    wrap(<PerformancePanel />);
    const body = document.getElementById("tr-monitor-body");
    expect(body).toBeNull();
  });

  it("clicking Monitor toggle expands it to show Tick row", () => {
    wrap(<PerformancePanel />);
    const toggle = screen.getAllByRole("button").find(
      (b) => b.hasAttribute("aria-controls") && b.getAttribute("aria-controls") === "tr-monitor-body"
    );
    expect(toggle).toBeDefined();
    fireEvent.click(toggle!);
    expect(document.getElementById("tr-monitor-body")).not.toBeNull();
    expect(screen.getByText("Tick")).toBeInTheDocument();
  });

  it("Monitor shows Follow state after expand", () => {
    wrap(<PerformancePanel />);
    const toggle = screen.getAllByRole("button").find(
      (b) => b.getAttribute("aria-controls") === "tr-monitor-body"
    )!;
    fireEvent.click(toggle);
    expect(screen.getByText("Follow")).toBeInTheDocument();
  });
});

// ── Line selection ─────────────────────────────────────────────────────────────

describe("PerformancePanel: line selection (T03)", () => {
  it("clicking a surface line sets it as selected (aria-selected)", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord(SAMPLE_RECORD));
    wrap(<PerformancePanel />, store);
    const line = screen.getByText("graves carry the floor");
    fireEvent.click(line);
    expect(line.closest("[role='option']")?.getAttribute("aria-selected")).toBe("true");
  });

  it("clicking the selected line again deselects it", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord(SAMPLE_RECORD));
    wrap(<PerformancePanel />, store);
    const line = screen.getByText("graves carry the floor");
    fireEvent.click(line);
    fireEvent.click(line);
    expect(store.getState().surface.selectedIndex).toBeNull();
  });

  it("selectLine dispatches correctly from store", () => {
    const store = makeStore();
    store.dispatch(selectLine(2));
    expect(store.getState().surface.selectedIndex).toBe(2);
    store.dispatch(selectLine(null));
    expect(store.getState().surface.selectedIndex).toBeNull();
  });
});

// ── Follow suspend/resume ──────────────────────────────────────────────────────

describe("PerformancePanel: follow suspend/resume (T03)", () => {
  it("followActive is true by default", () => {
    const store = makeStore();
    expect(store.getState().surface.followActive).toBe(true);
  });

  it("setFollowActive(false) suspends follow", () => {
    const store = makeStore();
    store.dispatch(setFollowActive(false));
    expect(store.getState().surface.followActive).toBe(false);
  });

  it("Resume follow button appears when followActive is false", () => {
    const store = makeStore();
    store.dispatch(setFollowActive(false));
    wrap(<PerformancePanel />, store);
    expect(screen.getByRole("button", { name: /Resume follow/i })).toBeInTheDocument();
  });

  it("clicking Resume follow sets followActive to true", () => {
    const store = makeStore();
    store.dispatch(setFollowActive(false));
    wrap(<PerformancePanel />, store);
    fireEvent.click(screen.getByRole("button", { name: /Resume follow/i }));
    expect(store.getState().surface.followActive).toBe(true);
  });

  it("Resume follow button is absent when followActive is true", () => {
    wrap(<PerformancePanel />);
    expect(screen.queryByRole("button", { name: /Resume follow/i })).toBeNull();
  });
});

// ── UNMIX for selected line ────────────────────────────────────────────────────

describe("PerformancePanel: UNMIX for selected line (T03)", () => {
  it("UNMIX section appears when a line is selected", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord(SAMPLE_RECORD));
    store.dispatch(selectLine(0));
    wrap(<PerformancePanel />, store);
    expect(screen.getByText("UNMIX")).toBeInTheDocument();
  });

  it("UNMIX is absent when no line is selected", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord(SAMPLE_RECORD));
    wrap(<PerformancePanel />, store);
    expect(screen.queryByText("UNMIX")).toBeNull();
  });

  it("UNMIX shows Device and Route from provenance", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord(SAMPLE_RECORD));
    store.dispatch(selectLine(0));
    wrap(<PerformancePanel />, store);
    expect(screen.getByText("Device")).toBeInTheDocument();
    expect(screen.getByText("PATH")).toBeInTheDocument();
    expect(screen.getByText("Route")).toBeInTheDocument();
    expect(screen.getByText("plural")).toBeInTheDocument();
  });

  it("UNMIX shows consumed slot/tray rows", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord(SAMPLE_RECORD));
    store.dispatch(selectLine(0));
    wrap(<PerformancePanel />, store);
    expect(screen.getByText(/above.*above/i)).toBeInTheDocument();
    expect(screen.getByText("grave")).toBeInTheDocument();
  });

  it("UNMIX shows Capture Take button", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord(SAMPLE_RECORD));
    store.dispatch(selectLine(0));
    wrap(<PerformancePanel />, store);
    expect(screen.getByRole("button", { name: /Capture.*Take/i })).toBeInTheDocument();
  });

  it("Capture Take button dispatches to takes store", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord(SAMPLE_RECORD));
    store.dispatch(selectLine(0));
    wrap(<PerformancePanel />, store);
    fireEvent.click(screen.getByRole("button", { name: /Capture.*Take/i }));
    expect(store.getState().takes.takes.length).toBe(1);
    expect(store.getState().takes.takes[0]!.surface).toBe("graves carry the floor");
  });
});

// ── Takes with annotation ─────────────────────────────────────────────────────

describe("PerformancePanel: Takes with annotation (T03)", () => {
  it("renders takes from Redux store", () => {
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

  it("each take has an annotation input field", () => {
    const store = makeStore();
    store.dispatch(captureTake({
      id: "take_ann_1",
      tick: 7,
      surface: "wet paper slides",
      trace: "PATH:plural",
      deviceName: "PATH",
      route: "plural",
    }));
    wrap(<PerformancePanel />, store);
    const annotationInput = screen.queryByRole("textbox", { name: /Annotation for take/i });
    expect(annotationInput).not.toBeNull();
  });

  it("Remove button on each take is labeled (not a bare symbol)", () => {
    const store = makeStore();
    store.dispatch(captureTake({
      id: "take_rem_1",
      tick: 2,
      surface: "a broken door bends",
      trace: "",
      deviceName: "PATH",
      route: "plural",
    }));
    wrap(<PerformancePanel />, store);
    const removeBtn = screen.queryAllByRole("button").find(
      (b) => (b.getAttribute("aria-label") ?? "").startsWith("Remove take")
    );
    expect(removeBtn).toBeDefined();
    expect(removeBtn!.textContent?.trim()).toBe("Remove");
  });

  it("TAKES heading appears when takes exist", () => {
    const store = makeStore();
    store.dispatch(captureTake({
      id: "take_h1",
      tick: 1,
      surface: "branch shifts",
      trace: "",
      deviceName: "",
      route: "",
    }));
    wrap(<PerformancePanel />, store);
    expect(screen.getByText("TAKES")).toBeInTheDocument();
  });
});
