import type { Token, TarokoProject, LineDevice, StanzaPattern } from "@taroko/schema";

export type RNG = () => number;

export function choose<T>(arr: T[], rng: RNG = Math.random): T | null {
  if (!arr || !arr.length) return null;
  return arr[Math.floor(rng() * arr.length)] ?? null;
}

export function weighted<T extends { weight?: number; chance?: number }>(
  arr: T[],
  rng: RNG = Math.random,
): T | null {
  const items = (arr ?? []).filter((x) => Number(x.weight ?? x.chance ?? 0) > 0);
  const sum = items.reduce((a, b) => a + Number(b.weight ?? b.chance ?? 0), 0);
  if (!items.length || !sum) return (arr ?? [])[0] ?? null;
  let r = rng() * sum;
  for (const it of items) {
    r -= Number(it.weight ?? it.chance ?? 0);
    if (r <= 0) return it;
  }
  return items[items.length - 1] ?? null;
}

export function getTrayTokens(project: TarokoProject, name: string): Token[] {
  return (project.materials?.trays?.[name] ?? []).filter(
    (t) => t && String(t.literal ?? "").trim(),
  );
}

export function getDevice(project: TarokoProject, id: string): LineDevice | undefined {
  return (project.lineDevices ?? []).find((m) => m.id === id);
}

export function getStanza(project: TarokoProject, id: string): StanzaPattern | undefined {
  return (project.stanzaPatterns ?? []).find((s) => s.id === id);
}
