# What Is TAROKE REMIXER?

TAROKE REMIXER is a **visible-constraint generative-poetry workbench** that runs entirely in your browser as a static local-first application.

---

## The core idea

Generative poetry built from authored constraints rather than opaque chance. Every bank of word-material, every route template, every trigger condition, and every surface setting is something you author and can inspect. The system picks from what you give it — it does not synthesize, guess, or use AI text generation.

The name acknowledges Taroko Gorge (Nick Montfort, 2009) and the tradition of Taroko-style remix poems — works that take the architecture of a generative text and re-author its material. TAROKE REMIXER is a workbench for making and running that kind of work.

---

## What the app is

A **static local-first browser application**. Open `index.html` in any modern browser — no server, no account, no install, no build step. Your project lives in your browser's working session and in files you export.

It edits a **project JSON** that describes the full poem-machine: sample banks, form rules, line devices, stanza patterns, flow scenes, trigger conditions, output surface settings, and notes. From that project it can export a **standalone playable HTML artifact** — a self-contained file that runs the same poem elsewhere.

---

## Working layers

The editor is organised into named chambers, each controlling one layer of the project:

| Chamber | What it controls |
|---------|-----------------|
| **Source** | Title, author, source lineage, statement, credits |
| **Samples** | Banks of word-material: tokens, weights, roles, labels |
| **Forms** | Inflection rules: case policy, compound handling, per-token overrides |
| **Devices** | Line-making templates: slot inputs + route templates with `{slot:form}` variables |
| **Stanza** | Arrangements of device slots into repeatable patterns |
| **Flow** | Scenes that select stanza patterns over time |
| **Triggers** | Condition rules that modify a line when a specific consumed sample fires |
| **Surface** | Run and export settings: speed, retention, poem size, trace mode |
| **Run** | Live generation: start, pause, reset, inspect line recipes |
| **Notes** | Line evidence: keep lines, mark for repair, open recipes |
| **Export** | Save playable HTML, export project JSON, copy JSON, build live preview |

Every layer is user-editable. The app exposes authored constraints rather than hiding them behind an opaque generator.

---

## Imported artworks

When you import an authored project file (`.taroke.json` or a supported standalone `.taroke.html`), that project's own bank system is authoritative. Imported sample banks, labels, roles, and key order are preserved exactly. The app does not inject classic Taroko defaults into projects that define their own banks.

---

## What it is not

- **Not a cloud service.** No data is sent anywhere. No account is needed. The browser's localStorage is used only for local draft autosave.
- **Not an AI text-generation service.** The app generates text from authored material using probabilistic selection. No language model is involved.
- **Not a universal no-code platform.** The workbench is designed for Taroko-style constrained generative poems. It does not cover every possible generative-text schema.
- **Not a hosted account system.** Your projects are yours — JSON files on your machine.
- **Not a finished solution for every generative-poetry schema.** Future schema versions, novel artwork structures, and import formats not yet tested may behave differently. See `docs/KNOWN_LIMITS.md`.
