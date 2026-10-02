# Known Limits

This document states the current known limitations of TAROKE REMIXER honestly. It is not a list of bugs — it is a description of the deliberate scope and the non-trivial edges of what is and is not covered.

---

## Architecture

- **Local-first static application.** There is no server, no cloud synchronization, and no collaborative editing. Projects are files on your machine.
- **No account system.** Nothing is tied to an identity or stored remotely.
- **No real-time sync.** If you work in two browser tabs or on two machines, you manage your own file copies.

---

## Browser and storage

- **Primary automated browser coverage is Chromium (CDP).** Tests run against a headless Chromium instance. Other browsers are not excluded, but are not covered by the automated suite. Manual browser QA remains useful for Safari, Firefox, and mobile browsers.
- **`localStorage` may be unavailable.** In private/incognito browsing, or when storage is blocked, autosave is silently disabled (the app shows a message and continues). The app does not crash.
- **Direct `file:` URL behavior may differ by browser.** Some browsers restrict localStorage or iframe behavior when loading from a local `file:` path. Using a local server or GitHub Pages is more reliable.
- **Very large projects may stress `srcdoc` or browser memory.** A project with hundreds of banks and thousands of tokens generates a large standalone HTML blob. This is then assigned to an iframe `srcdoc`. Extreme sizes may cause slowness or failure in the live preview; the JSON export and downloaded HTML artifact are unaffected.

---

## Import

- **Unknown future schemas cannot be guaranteed.** The import contract is defined for `.taroke.json` and supported `.taroke.html` files produced by this editor. Files from other tools, older schema versions outside the migration path, or novel structures may not import correctly. Import fails with an error message rather than partially loading.
- **Deterministic duplicate-ID repair cannot infer ambiguous artistic intent.** When an artwork intentionally reuses token IDs across banks (as Grave v3.2 does), the repair assigns a fixed suffix to non-first occurrences. Form overrides and note links bound to a duplicate ID retain the first-occurrence binding. The artistic intent of the ID choice cannot be inferred automatically.
- **Actual artwork files are not distributed in this repository** unless intentionally committed. The Grave v3.2 test fixture used in acceptance testing is separate from the import acceptance documentation.

---

## Interaction

- **Tested viewport matrix:** 375×667, 390×844, 430×932, 844×390 (landscape), 1024×768, 1280×800, 1440×900. Automated coverage is for these viewports.
- **Mobile and landscape interaction** has been manually reviewed and passed in the tested viewports, but some complex interactions (drag-and-drop token reordering, open select dropdowns) may behave differently on touch devices.
- **Manual browser QA remains useful** for testing on actual devices, particularly iOS Safari and Android browsers.
- **Live preview runtime recreation** occurs only on deliberate project-replacement operations: New, Import, Restore (which set preview state to UNBUILT), or an explicit Build / Rebuild / Refresh / Retry. Toast messages, Copy JSON, autosave-strip updates, and other non-project actions do not recreate the iframe or interrupt the running artifact.

---

## Accessibility

- **Focus management, ARIA labels, dialog containment, status announcements, Escape handling, and keyboard access** have been improved across the editor as part of v07.3 UX/accessibility hardening.
- **No formal WCAG compliance claim is made.** The improvements target practical usability. A formal audit has not been conducted.
- **Custom controls (slot chips, bank tabs, token cells, custom selects) may have limitations** that a native element would not. Screen-reader spot checks on specific flows remain useful.

---

## Preview

- **No `allow-same-origin` in the preview sandbox.** The preview iframe cannot access the editor's localStorage directly.
- **No preview messaging is used.** This implementation does not send, receive, or register `postMessage` communications between the editor and the preview iframe. Cross-window messaging is a browser capability, but it is not implemented here.
- **The sandbox attribute does not make arbitrary HTML universally safe.** `sandbox="allow-scripts"` is isolation for the embedded artifact runtime, not a general claim about iframe security.
- **Preview is not an archive.** Closing the browser, reloading, or importing a new file discards the preview state.

---

## Aesthetics

- **The current black/white monospace workbench is deliberate.** This is a functional workbench pass; aesthetic improvements are a future concern.
- **Surface theme controls and surface family cards are not included** in this pass and will not be reintroduced without a named redesign task.
- **No visible line numbers** appear in the run surface or exported artifact. This is a deliberate design choice, not an omission.
