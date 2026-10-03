# WP05 Salvage Matrix — Temporary Branch vs Canonical

**Canonical branch**: `claude/v08-wp05-vertical-slice-recovery` HEAD `1a7a257`  
**Temporary source**: `claude/v08-wp05-checkpoint-a-939fk4` HEAD `40f60938`  
**Date**: 2026-07-15  

## Critical Structural Fact

The temporary commit `40f6093` was built from the WP04 base and is NOT a descendant
of the canonical PR #15 branch. It represents a parallel implementation from the same
WP04 starting point. Canonical PR #15 contains 30+ commits of additional fixes,
tests, and recovery work not present in the temporary branch.

Therefore: PR #15 is the ONLY canonical candidate. The temporary branch is reference
material only.

## File Classification

| File | Disposition | Rationale |
|------|-------------|-----------|
| `apps/workbench/src/shell/panels/MaterialsPanel.tsx` | **PORT LOGIC** | Role-aware forms + Keep unchanged + drag/drop reorder are superior to canonical |
| `apps/workbench/src/shell/panels/InstrumentsPanel.tsx` | **PORT LOGIC** | Variable palette (search, keyboard nav, caret insertion) is net-new; device commands differ |
| `apps/workbench/src/shell/panels/ArchivePanel.tsx` | **DISCARD** | Canonical ArchivePanel is equivalent or superior |
| `apps/workbench/src/shell/panels/CompositionPanel.tsx` | **DISCARD** | Canonical has move-to-start/end already (115593c) |
| `apps/workbench/src/shell/panels/AutomationPanel.tsx` | **DISCARD** | Canonical AutomationPanel equivalent |
| `apps/workbench/src/shell/panels/PerformancePanel.tsx` | **DISCARD** | Canonical PerformancePanel has Cue/Surface isolation; superior |
| `apps/workbench/src/store/commands.ts` (temp adds) | **SELECTIVE PORT** | addDevice/removeDevice/toggleDevice → canonical already has addLineDevice/removeLineDevice/toggleDeviceEnabled; reorderDeviceInputs → port; updateDeviceInputSlot/Tray/Role → canonical has unified updateDeviceInput (superior); addRoute (temp) → canonical has addRoute |
| `next/` directory | **DISCARD** | Generated build artifact; must not commit |
| `apps/workbench/dist/` | **DISCARD** | Generated build artifact |
| `playwright-report/`, `test-results/`, `screenshots/` | **DISCARD** | Transient test output |
| `tests/e2e/checkpoint-a-journey.spec.ts` (temp replaces with checkpoint-a.spec.ts) | **KEEP CANONICAL** | Canonical checkpoint-a.spec.ts has 29 tests with proper non-fake assertions |
| `apps/workbench/playwright.config.ts` (temp) | **SELECTIVE** | Temp hardcodes Chromium executablePath — do NOT port that; canonical config is correct |
| `tests/browser_runtime.py` | **ALREADY IN CANONICAL** | Canonical added this in `fcff001` |
| `tests/verify_browser_runtime_usage.py` | **ALREADY IN CANONICAL** | Canonical added this |
| `.github/workflows/preview.yml` | **ALREADY IN CANONICAL** | Canonical added in `b806b9a` |
| `apps/workbench/src/__tests__/store/slices-extended.test.ts` (temp deletes) | **KEEP CANONICAL** | Canonical merged into slices.test.ts correctly |
| `scripts/verify_v07_baseline.py` (temp modifies) | **KEEP CANONICAL** | Canonical version is correct |

## What Is Worth Porting (Verified Superior Features)

### 1. Role-aware forms in MaterialsPanel
- **Source**: `apps/workbench/src/shell/panels/MaterialsPanel.tsx` lines ~1-50 (ROLE_FORMS), ~107-130 (toggleKeepUnchanged/setFormOverride), ~200-280 (forms section)
- **Target**: `apps/workbench/src/panels/MaterialsPanel.tsx` — add selected-token forms section
- **Key concern**: `__keep__` sentinel must be handled in `formToken` to never leak to output

### 2. Drag/drop reorder in MaterialsPanel
- **Source**: temp MaterialsPanel lines ~55-75 (drag handlers)
- **Target**: canonical MaterialsPanel — add draggable list items (currently uses ↑/↓ table buttons only)
- **Note**: canonical already has Move up/down; need to add Move to start/end and drag support

### 3. Route variable palette in InstrumentsPanel
- **Source**: temp `VariablePalette` component + caret insertion helpers
- **Target**: canonical `InstrumentsPanel.tsx`
- **Note**: test 25 already verifies chip insertion; need to ensure it actually works end-to-end

### 4. reorderDeviceInputs command
- **Source**: temp commands.ts `reorderDeviceInputs`
- **Target**: canonical commands.ts — add if missing
- **Note**: canonical has `updateDeviceInput` for field editing; needs reorder command

## What Is NOT Being Ported

- `apps/workbench/src/shell/panels/` directory (architecture conflict — canonical uses `src/panels/`)
- `next/` generated files
- Hardcoded `/opt/pw-browsers/chromium` as universal browser path
- `updateDeviceInputSlot/Tray/Role` separate commands (canonical unified `updateDeviceInput` is better)
- `addDevice/removeDevice/toggleDevice` aliases (canonical has `addLineDevice/removeLineDevice/toggleDeviceEnabled`)
- Stale checkpoint documents from temporary branch
- `apps/workbench/src/__tests__/store/slices-extended.test.ts` (temp version reverted this)

## Disposition of Temporary Branch

After porting verified superior features:
- Temporary branch `claude/v08-wp05-checkpoint-a-939fk4` is SUPERSEDED
- All unique valid work has been ported to `claude/v08-wp05-vertical-slice-recovery`
- Branch may be deleted after canonical parity is verified
