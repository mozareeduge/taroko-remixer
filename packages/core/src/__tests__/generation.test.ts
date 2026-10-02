import { describe, it, expect } from "vitest";
import { cleanSurfaceText, generateEvent, activeScenes } from "../generation.js";
import { defaultProject } from "../migration.js";
import type { RunState } from "@taroko/schema";

describe("cleanSurfaceText", () => {
  it("removes unfilled {slot} placeholders", () => {
    expect(cleanSurfaceText("hello {above:plural} world")).toBe("hello world");
  });
  it("removes doubled punctuation", () => {
    expect(cleanSurfaceText("hello,, world")).toBe("hello, world");
  });
  it("removes leading punctuation", () => {
    expect(cleanSurfaceText(" , hello")).toBe("hello");
  });
  it("collapses multiple spaces", () => {
    expect(cleanSurfaceText("a  b   c")).toBe("a b c");
  });
  it("trims whitespace", () => {
    expect(cleanSurfaceText("  hello world  ")).toBe("hello world");
  });
});

describe("activeScenes", () => {
  it("returns enabled scenes with enabled stanza", () => {
    const project = defaultProject();
    const scenes = activeScenes(project);
    expect(scenes.length).toBeGreaterThan(0);
    expect(scenes[0]!.enabled).toBe(true);
  });

  it("excludes disabled scenes", () => {
    const project = defaultProject();
    project.flowScenes[0]!.enabled = false;
    expect(activeScenes(project)).toHaveLength(0);
  });
});

describe("generateEvent", () => {
  const seqRng = (() => {
    let i = 0;
    const vals = [0.1, 0.9, 0.1, 0.5, 0.1, 0.5, 0.1, 0.5, 0.1, 0.5, 0.1, 0.5];
    return () => vals[i++ % vals.length] ?? 0.5;
  })();

  it("returns a breath or line event", () => {
    const project = defaultProject();
    const state: Partial<RunState> = { tick: 0, queue: [], currentScene: null, currentStanza: null };
    const event = generateEvent(project, state, seqRng);
    expect(["breath", "line", "error"]).toContain(event.type);
  });

  it("produces a line event with non-empty surface for line type", () => {
    const project = defaultProject();
    const state: Partial<RunState> = { tick: 0, queue: [], currentScene: null, currentStanza: null };
    // Generate events until we get a line
    let lineEvent = null;
    for (let i = 0; i < 20; i++) {
      const ev = generateEvent(project, state, Math.random);
      (state as RunState).tick = ((state as RunState).tick ?? 0) + 1;
      if (ev.type === "line") { lineEvent = ev; break; }
    }
    expect(lineEvent).not.toBeNull();
    expect(lineEvent!.surface.length).toBeGreaterThan(0);
  });

  it("tick increments are tracked externally", () => {
    const project = defaultProject();
    const state: Partial<RunState> = { tick: 5, queue: [], currentScene: null, currentStanza: null };
    const ev = generateEvent(project, state, () => 0.1);
    expect(ev.tick).toBe(5);
    expect(ev.id).toBe("ev_0005");
  });

  it("trigger fires on matching consumed token", () => {
    const project = defaultProject();
    // Force above tray to only have unknown-box so trigger always matches
    project.materials.trays["above"] = [
      { id: "tok_box", literal: "unknown-box", role: "noun", weight: 1, lockedLiteral: false },
    ];
    // Force trigger chance to 100
    const trigger = project.triggers.find((t) => t.id === "tr_box")!;
    trigger.chance = 100;
    // Force PATH route only (weight = plural route, which consumes above slot directly)
    const pathDevice = project.lineDevices.find((d) => d.id === "ld_path")!;
    pathDevice.routes = [pathDevice.routes.find((r) => r.id === "rt_path_plural")!];

    // Use deterministic RNG returning 0.1 to pick first items
    const rng = () => 0.1;
    const state: Partial<RunState> = { tick: 0, queue: [], currentScene: null, currentStanza: null };
    // Generate until we get a line event with trigger
    let found = false;
    for (let i = 0; i < 30; i++) {
      const ev = generateEvent(project, state, rng);
      (state as RunState).tick = ((state as RunState).tick ?? 0) + 1;
      if (ev.type === "line" && ev.trigger !== null) { found = true; break; }
    }
    expect(found).toBe(true);
  });
});
