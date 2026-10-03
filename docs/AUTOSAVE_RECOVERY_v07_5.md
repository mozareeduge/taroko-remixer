# Autosave/Recovery — v07.5

## Behavior summary

TAROKO REMIXER autosaves your working project to the browser's localStorage each time you make a change. On boot, if a saved draft exists, a restore prompt appears. Restore is explicit — nothing loads automatically. Dismiss hides the prompt without clearing the draft. Clear removes it from storage. JSON export remains the portable archive authority.

---

## Storage key

```
taroke.remixer.v07.draft
```

One key, one browser, one origin. No cloud. No account.

---

## What is stored

```json
{
  "savedAt": "2026-07-10T12:34:56.789Z",
  "schemaVersion": "0.7-reset",
  "project": { ... full project object ... }
}
```

- `savedAt`: ISO 8601 timestamp of the most recent autosave.
- `schemaVersion`: app schema version at save time, used for compatibility checking.
- `project`: full project JSON (samples, devices, stanza, flow, triggers, surface, notes).

---

## What is not stored

- Generated line history (run events).
- Exported HTML blobs.
- Browser or device metadata.
- Screenshots.
- Anything outside the project draft.

---

## Restore / Dismiss / Clear behavior

| Action | What happens |
|---|---|
| **Restore saved draft** | Applies the stored project to the editor. |
| **Dismiss** | Hides the restore prompt for this session. Draft remains in storage. |
| **Clear saved draft** | Removes the draft from localStorage. Cannot be undone. |
| **New** (topbar) | Resets to default project and clears the saved draft. |
| **Import file** | Replaces project with the imported file; autosaves the imported project. |

---

## Corruption / mismatch behavior

- **Corrupt JSON**: draft is ignored, app boots with default project, strip shows "Saved draft could not be read and was ignored."
- **Schema version mismatch**: draft is ignored (not silently loaded), same message shown.
- In both cases a "Clear saved draft" button is offered.

---

## Storage-unavailable behavior

If localStorage is inaccessible (e.g. an origin that blocks storage, browser security policy, private mode restrictions):

- The app continues normally.
- Autosave silently does nothing (the probe fails at boot).
- The autosave strip shows: "Autosave unavailable in this browser/session."
- No crash. No blocked workflow.

---

## Why JSON export remains authoritative

localStorage is volatile: it can be cleared by the browser, by the user, or by a policy change. It is origin-scoped and does not travel with the file. The `.taroke.json` and `.taroke.html` exports are portable, inspectable, and version-stable. Autosave is crash/session recovery only — not an archive.

---

## Test command and result

```bash
./tests/run_all_tests.sh
```

Result (v07.5):

| Suite | Passed | Failed |
|---|---|---|
| Core static | 14 | 0 |
| Core extended | 38 | 0 |
| Browser functional CDP | 16 | 0 |
| User-notes regression | 10 | 0 |
| Route-template regression | 5 | 0 |
| CDP deep QA | 50 | 0 |
| Accessibility / CDP | 28 | 0 |
| Autosave / CDP | 19 | 0 |
| **Total** | **180** | **0** |

---

## Screenshots

Captured at merge to main (v07.5 / `20c923c`):

- `docs/screenshots/v07_5/desktop-autosave-status.png` — autosave strip showing saved timestamp on desktop (1280px).
- `docs/screenshots/v07_5/desktop-restore-prompt.png` — restore prompt on boot with saved draft present (1280px).
- `docs/screenshots/v07_5/mobile-375-autosave.png` — autosave strip at 375px mobile width.
