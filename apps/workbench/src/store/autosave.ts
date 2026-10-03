import type { Middleware } from "@reduxjs/toolkit";
import type { RootState } from "./types.js";
import { mutateProject, markSaved } from "./projectSlice.js";

const AUTOSAVE_KEY = "taroko.remixer.v08.draft";
const LEGACY_AUTOSAVE_KEYS = ["taroke.remixer.v08.draft", "taroke.rimixer.v08.draft"];
const V07_AUTOSAVE_KEY = "taroke.remixer.v07.draft";
const AUTOSAVE_DEBOUNCE_MS = 1500;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveToLocalStorage(project: RootState["project"]["present"]): void {
  try {
    const payload = JSON.stringify({ project, savedAt: new Date().toISOString() });
    localStorage.setItem(AUTOSAVE_KEY, payload);
    // Compat: keep the previous key readable by older builds.
    try { localStorage.setItem("taroke.remixer.v08.draft", payload); } catch { /* ignore */ }
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export type AutosaveDraft =
  | { status: "ok"; project: RootState["project"]["present"]; savedAt: string }
  | { status: "corrupt" }
  | { status: "none" };

export function loadFromLocalStorage(): AutosaveDraft {
  try {
    let raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) {
      for (const key of LEGACY_AUTOSAVE_KEYS) {
        try {
          raw = localStorage.getItem(key);
          if (raw) break;
        } catch { /* keep scanning */ }
      }
    }
    if (!raw) return { status: "none" };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || !parsed["project"] || !parsed["savedAt"]) {
      return { status: "corrupt" };
    }
    return { status: "ok", project: parsed["project"] as RootState["project"]["present"], savedAt: String(parsed["savedAt"]) };
  } catch {
    return { status: "corrupt" };
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
    for (const key of LEGACY_AUTOSAVE_KEYS) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }
  } catch {
    // ignore
  }
}

export type V07Draft =
  | { status: "ok"; project: RootState["project"]["present"]; savedAt: string }
  | { status: "corrupt" }
  | { status: "none" };

/** Read a v07 draft from localStorage without deleting it (non-destructive). */
export function loadV07Draft(): V07Draft {
  try {
    const raw = localStorage.getItem(V07_AUTOSAVE_KEY);
    if (!raw) return { status: "none" };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || !parsed["project"]) {
      return { status: "corrupt" };
    }
    return {
      status: "ok",
      project: parsed["project"] as RootState["project"]["present"],
      savedAt: String(parsed["savedAt"] ?? ""),
    };
  } catch {
    return { status: "corrupt" };
  }
}

export const autosaveMiddleware: Middleware<object, RootState> = (api) => (next) => (action) => {
  const result = next(action);

  if (mutateProject.match(action)) {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const state = api.getState();
      saveToLocalStorage(state.project.present);
      api.dispatch(markSaved(new Date().toISOString()));
      debounceTimer = null;
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  return result;
};
