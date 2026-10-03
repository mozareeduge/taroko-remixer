import { IRREGULAR_PLURALS, IRREGULAR_VERB3, F_END_EXCEPTIONS } from "@taroko/schema";
import type { Token, TarokoProject } from "@taroko/schema";

export function splitHead(word: string): [string, string] {
  const s = String(word ?? "");
  const m = s.match(/^(.*[-\s])([^\-\s]+)$/);
  return m ? [m[1] ?? "", m[2] ?? ""] : ["", s];
}

export function styleLike(src: string, out: string): string {
  src = String(src ?? "");
  out = String(out ?? "");
  if (!src) return out;
  if (src.toUpperCase() === src && /[A-Z]/.test(src)) return out.toUpperCase();
  if (src.toLowerCase() === src) return out.toLowerCase();
  if (
    src[0] === src[0]?.toUpperCase() &&
    src.slice(1) === src.slice(1).toLowerCase()
  ) {
    return (out[0]?.toUpperCase() ?? "") + out.slice(1).toLowerCase();
  }
  return out;
}

export function pluralBase(lower: string): string {
  lower = String(lower ?? "").toLowerCase();
  if (IRREGULAR_PLURALS[lower]) return IRREGULAR_PLURALS[lower]!;
  if (/[^aeiou]y$/.test(lower)) return lower.slice(0, -1) + "ies";
  if (/(s|x|z|ch|sh)$/.test(lower)) return lower + "es";
  if (/fe$/.test(lower)) return lower.slice(0, -2) + "ves";
  if (/f$/.test(lower) && !F_END_EXCEPTIONS.has(lower)) return lower.slice(0, -1) + "ves";
  if (/o$/.test(lower) && !/(photo|piano|radio|studio|video|zoo)$/.test(lower)) return lower + "es";
  return lower + "s";
}

export function verb3Base(lower: string): string {
  lower = String(lower ?? "").toLowerCase();
  if (IRREGULAR_VERB3[lower]) return IRREGULAR_VERB3[lower]!;
  if (/[^aeiou]y$/.test(lower)) return lower.slice(0, -1) + "ies";
  if (/(s|x|z|ch|sh|o)$/.test(lower)) return lower + "es";
  return lower + "s";
}

export function applyCase(project: TarokoProject, s: string): string {
  const p = project.forms?.casePolicy ?? "preserve";
  if (p === "upper") return String(s).toUpperCase();
  if (p === "lower") return String(s).toLowerCase();
  if (p === "title") return String(s).replace(/\b\w/g, (c) => c.toUpperCase());
  return s;
}

// Sentinel stored in overrides to mean "keep the literal unchanged for this form".
// Must NEVER appear in generated text (Cue, Surface, UNMIX, exported HTML, visible poem).
export const KEEP_UNCHANGED_SENTINEL = "__keep__";

export function formToken(project: TarokoProject, tok: Token | null | undefined, form = "literal"): string {
  form = String(form ?? "literal").trim();
  if (!tok) return "";
  const lit = String(tok.literal ?? "");
  const ov: Record<string, string> = (project.forms?.overrides?.[tok.id] as Record<string, string>) ?? {};

  // __keep__ means "use the literal text unchanged for this form" — never leak the sentinel.
  const isKept = (f: string) => ov[f] === KEEP_UNCHANGED_SENTINEL;

  if (tok.lockedLiteral && !["uppercase", "lowercase", "title"].includes(form)) {
    return applyCase(project, lit);
  }
  if (form === "literal" || form === "base") {
    if (isKept(form)) return applyCase(project, lit);
    return applyCase(project, ov[form] ?? lit);
  }
  if (form === "literal+s") return applyCase(project, lit + "s");
  if (form === "uppercase") return lit.toUpperCase();
  if (form === "lowercase") return lit.toLowerCase();
  if (form === "title") return lit.replace(/\b\w/g, (c) => c.toUpperCase());
  const [prefix, head] = splitHead(lit);
  const low = head.toLowerCase();
  let made = head;
  if (form === "singular") made = isKept("singular") ? head : (ov["singular"] ?? head);
  else if (form === "plural") made = isKept("plural") ? head : (ov["plural"] ?? pluralBase(low));
  else if (form === "thirdSingular") made = isKept("thirdSingular") ? head : (ov["thirdSingular"] ?? verb3Base(low));
  else if (form === "imperative") made = isKept("imperative") ? head : (ov["imperative"] ?? head);
  else made = isKept(form) ? head : (ov[form] ?? head);
  const out = prefix + styleLike(project.forms?.compoundPolicy === "literal" ? lit : head, made);
  return applyCase(project, out);
}

export function articleFor(phrase: string): string {
  const w = String(phrase ?? "").trim().replace(/^[^a-zA-Z]+/, "");
  if (!w) return "a";
  if (/^(honest|hour|heir|honor)/i.test(w)) return "an";
  if (/^(university|user|unit|one\b)/i.test(w)) return "a";
  return /^[aeiou]/i.test(w) ? "an" : "a";
}
