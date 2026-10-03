# QA Hardening Plan — TAROKO REMIXER v07.1

Generated: 2026-07-08

## 1. Boot and Static Deployment

- [ ] root `index.html` loads without framework/bundler
- [ ] `src/core.js` and `src/app.js` are referenced correctly
- [ ] no "Loading TAROKO" boot fallback remains in DOM after boot
- [ ] no console errors on first load (syntax errors, missing modules, etc.)
- [ ] `.nojekyll` exists at repo root
- [ ] no zip/temp extraction folder tracked in git
- [ ] `package.json` has no runtime external dependencies

## 2. Project Data and Migration

- [ ] `sample_v07_reset.taroke.json` imports cleanly via `migrateProject`
- [ ] exported JSON roundtrips: title, author, trays, devices, stanza, flow, triggers, notes, surface
- [ ] old MUMBLING-style projects (with `lineMachines`, `rareEvents`, `dictionary`) migrate without crash
- [ ] missing slots in route templates do not leave doubled commas (`,,`) or leading punctuation
- [ ] `bankMeta` persists through import/export
- [ ] `surface.showTick` is forced to `false` on migration (no tick display regression)
- [ ] `surface.family` is forced to `'taroko'` on migration

## 3. Sample Banks

- [ ] create bank: adds tray + bankMeta entry
- [ ] rename bank: label editable; id stays stable
- [ ] bank role/description editable
- [ ] add sample: token appended with correct role from bank
- [ ] edit sample literal via `data-token-lit`
- [ ] edit sample weight via `data-token-weight`; number coercion correct
- [ ] lock literal: `lockedLiteral=true`; locked form returns literal unchanged
- [ ] duplicate sample: new token id, same literal, appended to tray
- [ ] move sample between banks via drag
- [ ] weighted selection: token with higher weight wins over repeated trials (deterministic test at rng=0.5)
- [ ] dedupe: removes exact duplicate literals
- [ ] sort: sorts alphabetically
- [ ] bulk add: splits by newline/comma; empty entries dropped
- [ ] delete bank: moves tokens to reserve; devices pointing to it rerouted to reserve

## 4. Forms

- [ ] form override: plural override field writes `forms.overrides[id].plural`
- [ ] form override: thirdSingular override works
- [ ] `formToken` plural: regular, -y→-ies, -(s/x/z/ch/sh)→-es, -fe→-ves, -f→-ves (non-exception)
- [ ] `formToken` thirdSingular: regular, -y→-ies, -(s/x/z/ch/sh/o)→-es
- [ ] `formToken` uppercase/lowercase/title do not depend on lockedLiteral
- [ ] locked literal: plural/thirdSingular/base/singular return the literal unchanged
- [ ] compound handling `compoundPolicy=head`: pluralizes only head of compound
- [ ] case policy `upper`/`lower`/`title` applies to all form output

## 5. Devices and Route Templates

- [ ] create device: adds lineDevice with default input + route
- [ ] edit device name via `data-device-field`
- [ ] edit device description
- [ ] enable/disable device toggle
- [ ] add input slot: appended to device.inputs
- [ ] edit input slot name, bank, role
- [ ] delete input slot
- [ ] add route: appended to device.routes with `{first_slot:literal}.`
- [ ] route textarea uses `<textarea>` (not `<input>`)
- [ ] clicking slot chip inserts complete `{slot:form}` at cursor position
- [ ] clicking chip with cursor mid-string inserts correctly, does not duplicate or corrupt
- [ ] route move up / move down reorders correctly
- [ ] route drag reorder works
- [ ] delete route
- [ ] delete device
- [ ] missing variable cleanup: `{slot:form}` for undefined slot is removed, no doubled punctuation
- [ ] malformed/unknown `{ghost:literal}` in route produces validation error
- [ ] route weight 0: route excluded from weighted selection
- [ ] route with `{article:a}` picks 'a' or 'an' correctly

## 6. Stanza Patterns

- [ ] create stanza: pushed to stanzaPatterns
- [ ] rename stanza
- [ ] reset classic stanza
- [ ] add device slot from line device buttons
- [ ] add breath slot
- [ ] slot reorder up/down
- [ ] slot drag reorder
- [ ] slot delete
- [ ] slot chance field writes `slots[i].chance`
- [ ] slot repeat select: once / loop
- [ ] loop slot: generates 0..max lines per chance
- [ ] every enabled lineDevice is selectable from slot device dropdown
- [ ] delete custom stanza: reroutes flow scenes that referenced it
- [ ] classic stanza ('st_classic') cannot be deleted

## 7. Flow Scenes

- [ ] create scene: pushed to flowScenes
- [ ] edit scene name
- [ ] select stanza: every defined stanza appears in dropdown
- [ ] edit chance
- [ ] enable/disable scene toggle
- [ ] reorder scenes up/down
- [ ] scene drag reorder
- [ ] delete scene
- [ ] no active scenes produces validation error

## 8. Triggers

- [ ] add trigger
- [ ] trigger name editable
- [ ] trigger bank select updates `condition.tray`
- [ ] trigger sample dropdown writes `condition.term`
- [ ] trigger manual term editable
- [ ] trigger chance: 0 means never fires, 100 means always fires
- [ ] trigger append: text appears appended after surface when condition + chance match
- [ ] trigger prepend: text prepended
- [ ] trigger replace: surface replaced
- [ ] trigger enable/disable
- [ ] trigger delete
- [ ] trigger roundtrips through export/import

## 9. Run Surface

- [ ] run starts, generates events continuously
- [ ] generated events appear in DOM
- [ ] no `.tick` spans in poem lines (showTick=false)
- [ ] breath events do not appear as poem lines
- [ ] run retains at most `surface.retention` lines
- [ ] pause stops generation
- [ ] reset clears events
- [ ] clicking a line opens recipe modal
- [ ] recipe modal: shows surface text, trace, selected tokens, note buttons
- [ ] "Keep as sample line" adds note with status `keep`
- [ ] "Mark for repair" adds note with status `repair`
- [ ] "Open device" navigates to device editor
- [ ] "Jump to token" navigates to samples tab
- [ ] surface speed control changes interval
- [ ] notes recorded only from selected event (not ambient generation)

## 10. Standalone Artifact Export

- [ ] exported HTML opens and generates lines independently (no repo deps)
- [ ] exported HTML contains `<script type="application/json" id="taroke-project">`
- [ ] exported HTML has no `.tick` spans
- [ ] exported HTML has no unresolved `{...}` variables in output
- [ ] exported HTML head element contains title
- [ ] exported HTML CSS is inline (no external stylesheet link)
- [ ] exported HTML minified runtime produces same outputs as core.js given same seed
- [ ] project JSON embedded in exported HTML survives `extractProjectFromText` round-trip
- [ ] `safeJsonForHtml` escapes `</script>` sequences correctly

## 11. Mobile Layout (390px viewport)

- [ ] horizontal overflow does not occur at 390px width
- [ ] rail (step navigation) does not overflow
- [ ] buttons in topbar wrap with gaps (no overlap)
- [ ] route textarea is reachable and usable
- [ ] controls in device editor do not overlap at 390px
- [ ] bottom tabs visible and tappable at 390px
- [ ] panels have min breathing space (padding/margin not zero)
- [ ] no invisible fixed element blocks tap targets

## 12. Accessibility / Basic Keyboard

- [ ] route textarea receives focus and accepts typing
- [ ] step buttons in rail are keyboard-reachable
- [ ] custom select dropdown opens and closes with click
- [ ] modal shade dismisses on outside click
- [ ] no invisible permanently-open modal blocks navigation
- [ ] guide modal closes correctly
- [ ] line recipe modal closes correctly
