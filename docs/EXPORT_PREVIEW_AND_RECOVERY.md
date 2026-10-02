# Export, Preview, and Recovery

TAROKE REMIXER provides three mechanisms for preserving and distributing your work: project JSON export, standalone HTML export, and browser-local autosave. The Export chamber also offers a temporary live preview. This document explains each and how they differ.

---

## Project JSON

The `.taroke.json` file is the **authoritative editable project archive**.

- Contains the full project structure: sample banks, forms, devices, stanza patterns, flow scenes, triggers, surface settings, and notes.
- Suitable for version control and long-term archiving.
- Reimportable into TAROKE REMIXER at any time.
- Does not contain generated run events — only the configuration that produces them.

Export action: **Export project JSON** in the Export chamber.

---

## Standalone HTML

The `.taroke.html` file is a **distributable playable artifact**.

- Self-contained: includes the project data and the generator runtime in a single HTML file.
- No editor, no dependencies — open in any modern browser.
- Uses the same generator and runtime semantics as the editor's Run chamber (including trigger evaluation).
- Can be reopened in TAROKE REMIXER as an import source when the file includes the embedded project JSON.
- Independent from editor autosave: exporting HTML does not touch localStorage.

Export action: **Save playable HTML** in the Export chamber.

---

## Autosave and recovery

TAROKE REMIXER autosaves your working project to the browser's localStorage after each edit.

**Storage key:** `taroke.remixer.v07.draft`

One key, one browser, one origin. No cloud. No account.

**On the next boot**, if a saved draft exists and matches the current schema version, a **restore prompt** appears. Recovery is always explicit — nothing loads automatically.

| Action | What happens |
|--------|-------------|
| **Restore saved draft** | Applies the stored project to the editor. |
| **Dismiss** | Hides the restore prompt for this session. The draft remains in storage. |
| **Clear saved draft** | Removes the draft from localStorage. Cannot be undone. |
| **New** (topbar) | Resets to default project and removes the saved draft. |
| **Import file** | Replaces the project with the imported file; autosaves the imported project. |

**Corrupt or mismatched data is handled safely:**

- A corrupt draft (invalid JSON) is ignored. The app boots with the default project and shows a warning.
- A schema version mismatch causes the draft to be ignored, not silently loaded. The same warning is shown.
- If localStorage is unavailable (private browsing, storage disabled), the app boots without crashing and shows a message that autosave is unavailable.

**Autosave is not an archive.** JSON export remains the authoritative portable copy. Autosave is browser-local and session-oriented — a convenience recovery mechanism, not a backup system.

---

## Live preview

The Export chamber includes a **temporary embedded rendering** of the standalone artifact.

The preview is built on demand. When you first visit Export, the status reads "Live preview has not been built." Click **Build live artifact preview** to render it. The preview runs in a sandboxed iframe inside the editor page.

**Preview states:**

| State | Condition | Status text | Button label |
|-------|-----------|-------------|--------------|
| UNBUILT | Not yet built | "Live preview has not been built." | Build live artifact preview |
| FRESH | Project unchanged since last build | "Preview built from the current project." | Rebuild live artifact preview |
| STALE | Project changed since last build | "Preview is out of date." | Refresh live artifact preview |
| ERROR | Build failed | "Preview failed: [message]" | Retry live artifact preview |

**The preview is temporary:**

- It is not the archive.
- It is not the downloaded artifact.
- Importing a new file, clicking New, or restoring a draft resets the preview state to UNBUILT.
- After any of those operations, click **Build live artifact preview** again if you want a preview of the new project state.

**Recreation note:** the preview iframe is recreated only on deliberate project-replacement operations (New, Import, Restore) or an explicit Build / Rebuild / Refresh / Retry. Toast messages, Copy JSON, autosave-strip updates, and other incidental renders do not recreate the iframe or interrupt the running artifact.

---

## Iframe sandboxing

The live preview iframe uses `sandbox="allow-scripts"` without `allow-same-origin`.

This means the preview runs with an opaque origin — it cannot directly access the editor page's localStorage or document. The sandboxed runtime is isolated from the editor environment.

Cross-window communication via `postMessage` is a general browser capability. This implementation does not send, receive, or register any preview messages. The sandbox is containment for the embedded runtime; it does not make arbitrary HTML universally safe to embed.

**Preview state is ephemeral.** The live preview exists only while the iframe is mounted. It is not persisted and cannot be recovered after navigation or reload.
