import { describe, it, expect } from "vitest";
import { enablePatches } from "immer";
// commands.ts uses produceWithPatches; patches plugin must be activated before any call
enablePatches();
import {
  setProjectTitle,
  setProjectAuthor,
  setProjectLanguage,
  setProjectSourceTitle,
  setProjectSourceUrl,
  setProjectStatement,
  setProjectCredits,
  addToken,
  updateTokenLiteral,
  removeToken,
  reorderTokens,
  setTokenWeight,
  addLineDevice,
  updateDeviceName,
  toggleDeviceEnabled,
  addRoute,
  updateRouteTemplate,
  setTriggerCondition,
  setTriggerChance,
  toggleTriggerEnabled,
  setSurfaceSpeed,
  setCasePolicy,
} from "../../store/commands.js";
import { defaultProject } from "@taroko/core";
import { uid } from "@taroko/core";

describe("commands — project info", () => {
  it("setProjectTitle produces correct patch", () => {
    const p = defaultProject();
    const result = setProjectTitle(p, "New Title");
    expect(result.present.project.title).toBe("New Title");
    expect(result.label).toBe("Set title");
    expect(result.patches.length).toBeGreaterThan(0);
    expect(result.inversePatches.length).toBeGreaterThan(0);
  });

  it("setProjectAuthor produces correct patch", () => {
    const p = defaultProject();
    const result = setProjectAuthor(p, "Jane Doe");
    expect(result.present.project.author).toBe("Jane Doe");
    expect(result.label).toBe("Set author");
  });

  it("setProjectLanguage produces correct patch", () => {
    const p = defaultProject();
    const result = setProjectLanguage(p, "Tagalog");
    expect(result.present.project.language).toBe("Tagalog");
    expect(result.label).toBe("Set language");
    expect(result.patches.length).toBeGreaterThan(0);
  });

  it("setProjectSourceTitle produces correct patch", () => {
    const p = defaultProject();
    const result = setProjectSourceTitle(p, "Taroko Gorge");
    expect(result.present.project.sourceTitle).toBe("Taroko Gorge");
    expect(result.label).toBe("Set source title");
  });

  it("setProjectSourceUrl produces correct patch", () => {
    const p = defaultProject();
    const result = setProjectSourceUrl(p, "https://example.com");
    expect(result.present.project.sourceUrl).toBe("https://example.com");
    expect(result.label).toBe("Set source URL");
  });

  it("setProjectStatement produces correct patch", () => {
    const p = defaultProject();
    const result = setProjectStatement(p, "A poem about gorges.");
    expect(result.present.project.statement).toBe("A poem about gorges.");
    expect(result.label).toBe("Set statement");
  });

  it("setProjectCredits produces correct patch", () => {
    const p = defaultProject();
    const result = setProjectCredits(p, "After Montfort.");
    expect(result.present.project.credits).toBe("After Montfort.");
    expect(result.label).toBe("Set credits");
  });
});

describe("commands — tokens", () => {
  it("addToken appends to bank", () => {
    const p = defaultProject();
    const before = p.materials.trays["above"]!.length;
    const result = addToken(p, "above", "new-word");
    expect(result.present.materials.trays["above"]!.length).toBe(before + 1);
    const added = result.present.materials.trays["above"]!.at(-1)!;
    expect(added.literal).toBe("new-word");
    expect(added.role).toBe("noun");
  });

  it("updateTokenLiteral edits the right token", () => {
    const p = defaultProject();
    const tok = p.materials.trays["above"]![0]!;
    const result = updateTokenLiteral(p, "above", tok.id, "changed");
    const updated = result.present.materials.trays["above"]![0]!;
    expect(updated.literal).toBe("changed");
    expect(updated.id).toBe(tok.id);
  });

  it("removeToken removes by id", () => {
    const p = defaultProject();
    const tok = p.materials.trays["above"]![0]!;
    const before = p.materials.trays["above"]!.length;
    const result = removeToken(p, "above", tok.id);
    expect(result.present.materials.trays["above"]!.length).toBe(before - 1);
    expect(result.present.materials.trays["above"]!.find((t) => t.id === tok.id)).toBeUndefined();
  });

  it("reorderTokens reorders correctly", () => {
    const p = defaultProject();
    const tray = p.materials.trays["above"]!;
    const reversed = [...tray].reverse().map((t) => t.id);
    const result = reorderTokens(p, "above", reversed);
    const newTray = result.present.materials.trays["above"]!;
    expect(newTray[0]!.id).toBe(tray[tray.length - 1]!.id);
    expect(newTray[newTray.length - 1]!.id).toBe(tray[0]!.id);
  });

  it("setTokenWeight updates weight", () => {
    const p = defaultProject();
    const tok = p.materials.trays["trans"]![0]!;
    const result = setTokenWeight(p, "trans", tok.id, 5);
    const updated = result.present.materials.trays["trans"]!.find((t) => t.id === tok.id)!;
    expect(updated.weight).toBe(5);
  });
});

describe("commands — line devices", () => {
  it("addLineDevice adds a device", () => {
    const p = defaultProject();
    const before = p.lineDevices.length;
    const newDevice = {
      id: uid("ld"), name: "TEST", enabled: true, description: "test",
      inputs: [{ id: "inp_test_above", slot: "above", tray: "above", role: "noun" }],
      routes: [{ id: uid("rt"), name: "test route", weight: 100, template: "{above:literal}" }],
    };
    const result = addLineDevice(p, newDevice);
    expect(result.present.lineDevices.length).toBe(before + 1);
    expect(result.present.lineDevices.at(-1)!.name).toBe("TEST");
  });

  it("updateDeviceName renames a device", () => {
    const p = defaultProject();
    const devId = p.lineDevices[0]!.id;
    const result = updateDeviceName(p, devId, "RENAMED");
    expect(result.present.lineDevices.find((d) => d.id === devId)!.name).toBe("RENAMED");
  });

  it("toggleDeviceEnabled flips enabled state", () => {
    const p = defaultProject();
    const dev = p.lineDevices[0]!;
    expect(dev.enabled).toBe(true);
    const result = toggleDeviceEnabled(p, dev.id);
    expect(result.present.lineDevices.find((d) => d.id === dev.id)!.enabled).toBe(false);
  });

  it("addRoute adds route to device", () => {
    const p = defaultProject();
    const dev = p.lineDevices[0]!;
    const before = dev.routes.length;
    const newRoute = { id: uid("rt"), name: "new", weight: 10, template: "{above:literal}." };
    const result = addRoute(p, dev.id, newRoute);
    const updated = result.present.lineDevices.find((d) => d.id === dev.id)!;
    expect(updated.routes.length).toBe(before + 1);
  });

  it("updateRouteTemplate changes template", () => {
    const p = defaultProject();
    const dev = p.lineDevices[0]!;
    const route = dev.routes[0]!;
    const result = updateRouteTemplate(p, dev.id, route.id, "new template");
    const updated = result.present.lineDevices.find((d) => d.id === dev.id)!.routes.find((r) => r.id === route.id)!;
    expect(updated.template).toBe("new template");
  });
});

describe("commands — triggers", () => {
  it("setTriggerCondition updates condition", () => {
    const p = defaultProject();
    const tr = p.triggers[0]!;
    const result = setTriggerCondition(p, tr.id, "below", "floor");
    const updated = result.present.triggers.find((t) => t.id === tr.id)!;
    expect(updated.condition.tray).toBe("below");
    expect(updated.condition.term).toBe("floor");
  });

  it("setTriggerChance updates chance", () => {
    const p = defaultProject();
    const tr = p.triggers[0]!;
    const result = setTriggerChance(p, tr.id, 75);
    expect(result.present.triggers.find((t) => t.id === tr.id)!.chance).toBe(75);
  });

  it("toggleTriggerEnabled flips trigger enabled state", () => {
    const p = defaultProject();
    const tr = p.triggers[0]!;
    expect(tr.enabled).toBe(true);
    const result = toggleTriggerEnabled(p, tr.id);
    expect(result.present.triggers.find((t) => t.id === tr.id)!.enabled).toBe(false);
  });
});

describe("commands — surface + forms", () => {
  it("setSurfaceSpeed updates speed", () => {
    const p = defaultProject();
    const result = setSurfaceSpeed(p, 500);
    expect(result.present.surface.speedMs).toBe(500);
  });

  it("setCasePolicy updates casePolicy", () => {
    const p = defaultProject();
    const result = setCasePolicy(p, "upper");
    expect(result.present.forms.casePolicy).toBe("upper");
  });
});

describe("command immutability", () => {
  it("commands do not mutate the original project", () => {
    const p = defaultProject();
    const originalTitle = p.project.title;
    setProjectTitle(p, "mutated");
    expect(p.project.title).toBe(originalTitle);
  });

  it("inverse patches restore the original state", async () => {
    const { applyPatches } = await import("immer");
    const p = defaultProject();
    const result = setProjectTitle(p, "New Title");
    const restored = applyPatches(result.present, result.inversePatches);
    expect(restored.project.title).toBe(p.project.title);
  });
});
