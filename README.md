# TAROKO REMIXER

by Mohammad Zare (Mozare) · version 1.0.4 (2026-10-02) · [Open the live app](https://taroko-remixer.theblackbirdfield.com/)

Nick Montfort's *Taroko Gorge* (2009) is a short JavaScript program that writes a nature poem without end. Its word lists sit in plain view in the page source, and writers soon copied the page, changed the words, and published their own versions. At the Electronic Literature Organization's 2012 panel on these remixes (*Taroko Gorge Remixed: Repetition and Difference in Machine Texts*, West Virginia University, 21 June 2012; transcript of the session audio archived by Christopher T. Funkhouser), Sonny Rae Tempest, speaking "from a non-academic place" and without knowing JavaScript, described using the poem "as a template": "The code is simple enough that I can show my metalhead friends the input and the output, and they can go and do this themselves." TAROKO REMIXER follows that aspect of *Taroko Gorge* toward no-code creation. The decisions a remixer once made inside the source file (which words, in which banks, with what weights, through which line patterns, in what order, under which exceptions) become configurable modules in the browser, wired into one another, so that a person can design a working poem-machine, run it, and export it as a standalone work without writing a line of code. The app is a platform in the sense of Montfort and Bogost's platform studies, a computing system whose design shapes the works made on it: it admits one family of works, procedural e-poems built from banks, routes, stanzas and rules, and an open-ended number of them, each of them a remix. The full statement and its sources are in [What Is TAROKO REMIXER?](docs/WHAT_IS_TAROKO_REMIXER.md).

**How to cite:** Zare, Mohammad (Mozare). *TAROKO REMIXER*. Version 1.0.4, 2026. https://taroko-remixer.theblackbirdfield.com/ (source: https://github.com/mozareeduge/taroko-remixer)

**Rights and reuse:** see [RIGHTS.md](RIGHTS.md). The citation record does not grant a license to the code or to works in the *Taroko Gorge* lineage.

---

## What the app does (v1.0.4)

The live app is one self-contained file, `next2/index.html`: no server, no account, no build step. Its left-hand navigator holds nine chambers.

| Chamber | What you do there |
|---------|-------------------|
| **00 · Intakes** | Browse works from the *Taroko Gorge* lineage. *Ready to remix* lists 15 validated baselines (from Montfort's *Taroko Gorge* to remixes such as Scott Rettberg's *Tokyo Garage* and Talan Memmott's *Toy Garbage*); *Ecosystem* lists all 35 records, including procedure records, witnesses and reference links. *Start from this intake* opens a baseline as a new derivative project; the bundled baselines are never changed. |
| **01 · Source** | Record the work's identity, lineage, statement and public attribution. A project started from an intake shows its provenance here. |
| **02 · Materials** | Collect textual matter in Banks; give each Material a weight and a role; bulk paste one Material per line. |
| **03 · Forms** | Inspect the forms of a Material side by side (base, plural, possessive, compound) under a global case policy and compound separator; override any form in place or return it to the automatic form. |
| **04 · Instruments** | Build line-making Instruments: Inputs receive Materials, weighted Routes construct lines from `{input:form}` templates. Each Route can be tested on its own. |
| **05 · Composition** | Build reusable Stanzas from Instruments and Breaths, then arrange the Stanzas in the Flow (once, loop, or by chance). |
| **06 · Rules** | Compose no-code Rules: typed conditions (Bank, Material, Instrument, Route, runtime) and an action that appends, prepends or replaces text. Test a Rule against a line before enabling it. |
| **07 · Performance** | Run, Pause, Stop or Step the Flow and read the Surface as it fills. Select a line and choose *Unmix* to see how it was made; keep judgments as Takes; generate a revision of a line with the current settings. |
| **08 · Archive** | Preview and export the work as a standalone HTML file: *Dynamic* (a generative remix with Run, Pause, Stop and Step for the audience) or *Static* (a fixed reading of the current Surface). |

Project files and recovery:

| Item | What it is |
|------|------------|
| **Save project** | Downloads the editable project as `<title>.taroke.json`. This file is the durable archive of your work. |
| **Open project** | Opens a `.taroke.json` / `.json` project. Projects from the pre-v1 (v07) editor are converted to the v1 model; the app lists what was converted before you continue. |
| **Browser recovery copy** | Every edit is also kept in the browser's `localStorage` (`taroko.remixer.v1.draft`; older `taroke.*` keys are still read). An unsaved session is recovered on the next visit. It is not a substitute for a saved project file. |
| **Exported HTML** | `<title>.interactive.html` or `<title>.static.html`. Self-contained; runs without the editor. |

The `.taroke.*` file extensions and `taroke.*` storage keys keep their earlier spelling on purpose, so that saved work keeps opening.

---

## Quick start

Open the live app: https://taroko-remixer.theblackbirdfield.com/

Or run it locally by opening `next2/index.html` in a modern browser.

---

## Deployments

| Path | Contents |
|------|----------|
| `/` and `/next2/` | TAROKO REMIXER v1.0.4 (`next2/index.html`), the current app. |
| `/next/` | The v08 React/TypeScript workbench (`apps/workbench`), an experimental line of development. |
| `/archive/v07.8/` | The frozen v07.8 legacy app. |

The site is published from the `gh-pages` branch.

---

## Documentation

Current:

| Document | Contents |
|----------|----------|
| [What Is TAROKO REMIXER?](docs/WHAT_IS_TAROKO_REMIXER.md) | Statement, sources, what the app is and is not. |
| [CHANGELOG](CHANGELOG.md) | Release history, newest first. |
| [RIGHTS.md](RIGHTS.md) | Rights and reuse. |

Historical (v07.x legacy app). These describe the v07.8 editor, archived at `/archive/v07.8/`, and its chambers (Samples, Devices, Triggers, Notes and so on), which v1.0.4 replaced:

| Document | Contents |
|----------|----------|
| [Make a Remix](docs/MAKE_A_REMIX.md) | v07 chamber-by-chamber usage guide. |
| [Importing Authored Projects](docs/IMPORTING_AUTHORED_PROJECTS.md) | v07 import contract, fidelity rules, Grave v3.2 acceptance. |
| [Export, Preview, and Recovery](docs/EXPORT_PREVIEW_AND_RECOVERY.md) | v07 JSON / HTML export, autosave, live preview, sandboxing. |
| [Known Limits](docs/KNOWN_LIMITS.md) | v07 architecture, browser, import, interaction, accessibility and preview limits. |
| [Release v07.7](docs/RELEASE_v07_7.md) | v07.7 documentation-packet release notes. |
| [Release Checkpoint v07.8](docs/RELEASE_CHECKPOINT_v07_8.md) | v07.8 release-verification record. |

---

## Known limits (v1.0.4)

- Local-first: no server, no cloud sync, no account. Your work lives in the project files you save; the browser recovery copy is a safety net, not an archive.
- *Save project* downloads a new file each time; it does not write back to the file you opened.
- *Open project* reads project JSON only. Exported HTML works are for reading and performance and are not reopened as projects.
- No formal WCAG compliance claim.
- The v1.0.4 app has no automated test suite in this repository yet; the suites below cover the v07.8 legacy app and the v08 workbench.

---

## Tests

```bash
./tests/run_all_tests.sh            # v07.8 legacy app (534 passed, 0 failed at the v07.8 checkpoint)
python tests/run_docs_verification.py
npm run test:workbench              # v08 workbench unit tests
```

Browser tests require Chromium plus Python `requests` and `websocket-client`:

```bash
pip3 install websocket-client
```

---

## Repository

Static. No framework, no bundler, no build step for the live app.

- `next2/index.html`: the live app, v1.0.4, one self-contained file.
- `index.html`, `styles.css`, `src/`: the **v07.8 legacy app**, frozen and unmodified, still covered by its 534-test CI suite, deployed only at `/archive/v07.8/`.
- `apps/workbench`, `packages/`: the v08 workbench served at `/next/`.
