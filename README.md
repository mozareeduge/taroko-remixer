# TAROKE REMIXER

by Mohammad Zare (Mozare) · version 1.0.4 · [Open the live app](https://mozareeduge.github.io/taroke-remixer/)

TAROKE REMIXER is a browser-native workbench for composing generative poems in the lineage of Nick Montfort's *Taroko Gorge* (2009). Lexical banks, rules, timing and trace become visible authoring decisions: every bank of word-material, route template, trigger condition and surface setting is authored and can be inspected, and the system draws only from what the author supplies. A finished machine exports as a standalone HTML work that runs the same poem without the editor. See [What Is TAROKE REMIXER?](docs/WHAT_IS_TAROKE_RIMIXER.md) for the concept and scope.

**How to cite:** Zare, M. (2026). *TAROKE REMIXER* (Version 1.0.4) [Software]. https://github.com/mozareeduge/taroke-remixer

**Rights and reuse:** see [RIGHTS.md](RIGHTS.md). The citation record does not grant a license to the code or to works in the *Taroko Gorge* lineage.

---

## About this repository

It is a local-first static application: no server, no account, no build step. The app edits a project JSON describing a poem-machine and exports a standalone playable HTML artifact.

**Live URL:** `https://mozareeduge.github.io/taroke-remixer/`

**Current version:** v1.0.4 (title spelling corrected to TAROKE REMIXER; v1.0.3 was promoted from `/next2/` on 2026-08-26).

**Legacy v07.8 release checkpoint:** archived at `https://mozareeduge.github.io/taroke-remixer/archive/v07.8/` (534 passed, 0 failed, unmodified — its CI suite still runs on every push).

---

## Features

- **Source** — title, author, source lineage, statement, credits; identity mirrors update in real time.
- **Samples** — multiple named banks; tokens with weights, roles, and per-token inflection overrides; bulk paste; drag between banks.
- **Forms** — case policy, compound handling, per-token plural and verb overrides, locked literals.
- **Devices** — line-making templates; slot inputs + route templates; click slot chips to insert `{slot:form}` variables; weighted routes.
- **Stanza** — arrange device slots and breaths into repeatable patterns.
- **Flow** — scenes that select stanza patterns with weights and enabled/off state.
- **Triggers** — conditional line modifications (append / prepend / replace) based on consumed samples.
- **Surface** — speed, retention, poem size, line height, trace mode. No visible line numbers.
- **Run** — generate, pause, reset; inspect line recipes; keep or mark lines for repair.
- **Notes** — line evidence; open recipe from note.
- **Export** — standalone playable HTML, project JSON, copy JSON; live embedded preview.
- **Autosave** — browser-local draft recovery after each edit; explicit restore / dismiss / clear.
- **Import** — `.taroke.json` and supported `.taroke.html`; authored bank systems preserved exactly; no classic-bank contamination.

---

## Quick start

```bash
# Open the live app locally (v1.0.4):
open next2/index.html
```

---

## Import and export

| Format | Purpose |
|--------|---------|
| `.taroke.json` | Authoritative editable project archive. Reimportable. |
| `.taroke.html` | Standalone distributable artifact. Self-contained; no editor required. |
| Autosave | Browser-local draft (`taroke.remixer.v07.draft`). Not an archive. Explicit restore on next boot. |
| Embedded preview | Temporary in-browser render of the artifact. Not the downloaded file. |

---

## Public documentation

| Document | Contents |
|----------|----------|
| [What Is TAROKE REMIXER?](docs/WHAT_IS_TAROKE_RIMIXER.md) | Concept, layers, scope, and what it is not. |
| [Make a Remix](docs/MAKE_A_REMIX.md) | Chamber-by-chamber practical usage guide. |
| [Importing Authored Projects](docs/IMPORTING_AUTHORED_PROJECTS.md) | Import contract, fidelity rules, supported formats, Grave v3.2 acceptance. |
| [Export, Preview, and Recovery](docs/EXPORT_PREVIEW_AND_RECOVERY.md) | JSON, standalone HTML, autosave, live preview, sandboxing. |
| [Known Limits](docs/KNOWN_LIMITS.md) | Architecture, browser, import, interaction, accessibility, preview, aesthetic limits. |
| [Release v07.7](docs/RELEASE_v07_7.md) | Release notes, feature summaries, blockers, next phase. |

---

## Tests

```bash
./tests/run_all_tests.sh
```

Browser tests require Chromium plus Python `requests` and `websocket-client`:

```bash
pip3 install websocket-client
```

---

## Known limits

See [docs/KNOWN_LIMITS.md](docs/KNOWN_LIMITS.md). No server. No cloud. No account. No formal WCAG compliance claim. Primary automated browser coverage is Chromium/CDP.

---

## Repository

Static. No framework, no bundler, no build step.

`index.html`, `styles.css`, and `src/` at the repository root are the **v07.8 legacy app** —
unmodified, still covered by its 534-test CI suite, but deployed only at `/archive/v07.8/`.

The **live app** (v1.0.4) is `next2/index.html`, a single self-contained file, deployed to both
the site root and `/next2/`.
