import { useEffect, useState } from "react";
import { useAppDispatch } from "../store/hooks.js";
import { setProject } from "../store/projectSlice.js";
import { loadFromLocalStorage, clearAutosave, loadV07Draft } from "../store/autosave.js";
import { migrateProject } from "@taroko/core";

type BannerState = "none" | "draft" | "corrupt" | "v07draft" | "dismissed";

export function DraftRecoveryBanner() {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<BannerState>("none");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadFromLocalStorage();
    if (draft.status === "ok") {
      setState("draft");
      setSavedAt(draft.savedAt);
    } else if (draft.status === "corrupt") {
      setState("corrupt");
    } else {
      // No v08 draft — check for a v07 draft to offer non-destructive migration
      const v07 = loadV07Draft();
      if (v07.status === "ok") {
        setState("v07draft");
        setSavedAt(v07.savedAt || null);
      }
    }
  }, []);

  if (state === "none" || state === "dismissed") return null;

  function handleMigrateV07() {
    const v07 = loadV07Draft();
    if (v07.status !== "ok") {
      setState("corrupt");
      return;
    }
    try {
      const migrated = migrateProject(v07.project);
      dispatch(setProject(migrated));
      // Leave v07 key intact — non-destructive: v07 app can still find its draft
      setState("dismissed");
    } catch {
      setState("corrupt");
    }
  }

  function handleRestore() {
    const draft = loadFromLocalStorage();
    if (draft.status !== "ok") {
      setState("corrupt");
      return;
    }
    try {
      const migrated = migrateProject(draft.project);
      dispatch(setProject(migrated));
      clearAutosave();
      setState("dismissed");
    } catch {
      setState("corrupt");
    }
  }

  function handleDismiss() {
    setState("dismissed");
  }

  function handleClear() {
    clearAutosave();
    setState("dismissed");
  }

  const timeLabel = savedAt
    ? new Date(savedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
    : "unknown time";

  if (state === "corrupt") {
    return (
      <div className="tr-draft-banner tr-draft-banner--error" role="alert" aria-live="assertive">
        <span className="tr-draft-banner__msg">
          Autosave draft could not be read (corrupt or schema mismatch).
        </span>
        <button className="tr-btn tr-btn--ghost tr-draft-banner__btn" onClick={handleClear}>
          Clear draft
        </button>
        <button className="tr-btn tr-btn--icon tr-draft-banner__dismiss" aria-label="Dismiss" onClick={handleDismiss}>
          ✕
        </button>
      </div>
    );
  }

  if (state === "v07draft") {
    return (
      <div className="tr-draft-banner tr-draft-banner--v07" role="status" aria-live="polite">
        <span className="tr-draft-banner__msg">
          v07 draft found ({timeLabel}) — migrate to v08 or dismiss. Your v07 session is unchanged.
        </span>
        <button className="tr-btn tr-btn--primary tr-draft-banner__btn" onClick={handleMigrateV07}>
          Migrate to v08
        </button>
        <button className="tr-btn tr-btn--ghost tr-draft-banner__btn" onClick={handleDismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="tr-draft-banner" role="status" aria-live="polite">
      <span className="tr-draft-banner__msg">
        Draft saved {timeLabel} — restore or dismiss.
      </span>
      <button className="tr-btn tr-btn--primary tr-draft-banner__btn" onClick={handleRestore}>
        Restore draft
      </button>
      <button className="tr-btn tr-btn--ghost tr-draft-banner__btn" onClick={handleDismiss}>
        Dismiss
      </button>
      <button className="tr-btn tr-btn--ghost tr-draft-banner__btn" onClick={handleClear}>
        Clear draft
      </button>
    </div>
  );
}
