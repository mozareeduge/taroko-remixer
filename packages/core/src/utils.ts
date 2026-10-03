import { TRAY_DEFS } from "@taroko/schema";
import type { Token, TrayDef, TarokoProject } from "@taroko/schema";

export function uid(prefix = "id"): string {
  return prefix + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    };
    return map[c] ?? c;
  });
}

export function token(literal: string, role?: string): Token {
  return {
    id: uid("tok"),
    literal: String(literal ?? "").trim(),
    role: role ?? "literal",
    weight: 1,
    lockedLiteral: false,
  };
}

export function roleForTray(tray: string): string {
  return TRAY_DEFS[tray]?.role ?? "literal";
}

export function projectTrayDefs(project: TarokoProject): Record<string, TrayDef> {
  const meta = project.materials?.bankMeta ?? {};
  const trays = project.materials?.trays ?? {};
  const out: Record<string, TrayDef> = {};
  for (const k of Object.keys(trays)) {
    const m = meta[k] ?? {};
    out[k] = Object.assign(
      {
        label: TRAY_DEFS[k]?.label ?? k.toUpperCase(),
        role: TRAY_DEFS[k]?.role ?? "literal",
        desc: TRAY_DEFS[k]?.desc ?? "custom sample bank",
      },
      m,
    );
    if (!out[k]!.label) out[k]!.label = k.toUpperCase();
    if (!out[k]!.role) out[k]!.role = "literal";
    if (!out[k]!.desc) out[k]!.desc = "custom sample bank";
  }
  return out;
}

export function tokensFromText(text: string, role?: string): Token[] {
  return String(text ?? "")
    .split(/[\n,]+|\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => token(s, role));
}

export function normalizeIdLabel(s: string): string {
  return (
    String(s ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "taroko_rimix"
  );
}
