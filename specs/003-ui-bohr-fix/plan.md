# Implementation Plan: UI/UX Optimization and Bohr Model Correction

**Branch**: `003-ui-bohr-fix` | **Date**: 2026-03-23 | **Spec**: `specs/003-ui-bohr-fix/spec.md`
**Input**: Feature specification from `specs/003-ui-bohr-fix/spec.md`

---

## Summary

Fix the Bohr model geometry so shells and electrons are co-planar and rings appear as near-circles from an educational camera angle. Simultaneously adopt a two-panel desktop layout that makes the atom viewer the visual hero, adds a structured element header, and converts the mode selector to a segmented control.

Technical approach: CSS layout fixes, one geometry constant removal (`ringTilt`), updated camera constants, and a segmented control UI component. No new dependencies; no business logic changes.

---

## Technical Context

**Language/Version**: TypeScript 5.x (via Angular 19)
**Primary Dependencies**: Angular 19 (standalone components), Three.js 0.170+, RxJS 7.x
**Storage**: N/A
**Testing**: Jasmine + Karma (`ng test`)
**Target Platform**: Desktop browser ≥ 1024px width
**Project Type**: Web SPA (Angular 19 standalone components)
**Performance Goals**: 60 fps at 1080p / 1440p for single-element Bohr visualization
**Constraints**: Animation loop MUST run outside NgZone; renderer layer MUST have zero Angular imports
**Scale/Scope**: 118 elements, 1–7 electron shells, desktop-first layout

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Notes |
|-----------|-------|-------|
| I. UX First | ✅ | Hero viewer, structured header, cohesive controls |
| II. Scientific Correctness | ✅ | Geometry fix aligns rings with electron orbits |
| III. Incremental Delivery | ✅ | Phase 1 only; no Phase 2 features scaffolded |
| IV. Simplicity Over Complexity | ✅ | Minimal changes: remove one field, update constants, CSS |
| V. Performance Matters | ✅ | No new geometry objects; animation loop unchanged |
| VI. Separation of Concerns | ✅ | Geometry changes in renderer layer; layout in component templates |
| VII. Reusability | ✅ | `ShellGeometryParams` remains stable; field removal is backwards-safe |
| VIII. Explain Before Impress | ✅ | Educational camera preset; "Bohr" label on segmented control |
| IX. Documentation Required | ✅ | Module header comments updated for each changed file |

**Gate result**: PASS — no violations. No complexity justification table needed.

**Post-design re-check** (after Phase 1):
All contracts and data-model changes confirmed to respect these principles. No regressions introduced.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-ui-bohr-fix/
├── plan.md              # This file
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output ✅
├── quickstart.md        # Phase 1 output ✅
├── contracts/
│   ├── shell-geometry-params.md   # Updated interface contract ✅
│   ├── bohr-camera-preset.md      # New camera preset contract ✅
│   └── layout-contract.md         # Two-panel layout contract ✅
└── tasks.md             # Phase 2 output (created by /speckit.tasks — not yet)
```

### Source Code (modified files only)

```text
src/app/
├── app.component.ts                         # Layout: fixed left panel, element header, default select
├── models/
│   └── renderer-types.ts                   # Remove ringTilt from ShellGeometryParams
├── renderer/
│   ├── atom-renderer.service.ts            # Update CAM_FOV, CAM_POSITION, MAX_DISTANCE
│   ├── renderer-utils.ts                   # Remove ringTilt from computeShellGeometry()
│   └── shell-renderer.ts                   # Use constant rotation.x = π/2
├── components/
│   ├── element-detail/
│   │   └── element-detail.component.ts     # Remove hero section
│   ├── viewer-controls/
│   │   └── viewer-controls.component.ts    # Mode segmented control
│   └── periodic-table/
│       └── element-cell/
│           └── element-cell.component.ts   # Verify selected highlight (may need no change)
```

**Structure Decision**: Single Angular SPA. No new files, no new components (element header inlined in AppComponent). Follows existing single-project structure.

---

## Execution Tracks

### Track 1 — Layout Refactor

**Objective**: Adopt two-panel desktop layout with fixed sidebar, hero viewer, element header, and structured detail cards.

**Scope**:
- `app.component.ts` — fix left panel width; add element header; wire Hydrogen default selection on init
- `element-detail.component.ts` — remove duplicated `.hero` section (now in AppComponent header)

**Technical approach** (Angular 19):
- `panel-left`: change `flex: 0 0 auto` to `flex: 0 0 300px; overflow-x: auto; overflow-y: auto`.
- Add `.element-header` div at top of `.panel-right` in `AppComponent` template; read `ViewerStateService.selectedElement$` via `toSignal()` (already injected).
- Default element: in `AppComponent.ngOnInit()`, call `this.viewerState.selectElement(this.elementData.getAllElements().find(e => e.atomicNumber === 1)!)`.
- `ElementDetailComponent`: delete the `.hero` block from template and its associated CSS; keep only `<dl class="data-list">` and quantum disclaimer.

**Dependencies**: None — Track 1 is independent of Tracks 2, 3, 4.

**Risks / Edge cases**:
- `getAllElements()` must return Hydrogen correctly. Safeguard: use `find(e => e.atomicNumber === 1)` not index 0.
- On narrow screens (<1024px), fixed 300px sidebar compresses viewer. Acceptable per non-goal (no mobile layout).
- Removing `.hero` from `ElementDetailComponent` requires updating its spec if tests assert hero content.

---

### Track 2 — Controls & Interaction

**Objective**: Group all viewer controls cohesively; convert mode selector to a segmented control with "Bohr" active and "Quantum" disabled.

**Scope**:
- `viewer-controls.component.ts` — replace mode toggle button with segmented control

**Technical approach** (Angular 19):
Replace the single `mode-btn` button with two adjacent `<button>` elements in a `.seg-control` wrapper:
```html
<div class="seg-control">
  <button class="seg-btn" [class.active]="mode() === 'bohr'" (click)="setMode('bohr')">⚛ Bohr</button>
  <button class="seg-btn" disabled title="Coming soon">☁ Quantum</button>
</div>
```
Active state: `background: #1f6feb; color: #e6edf3`. Disabled state: `opacity: 0.45; cursor: not-allowed`.
Remove `toggleMode()` method; add `setMode(m: VisualizationMode)` calling `viewerState.setMode(m)`.

**Dependencies**: None — independent of other tracks.

**Risks / Edge cases**:
- `ViewerStateService.mode$` starts as `'bohr'` — segmented control correctly shows Bohr active on load.
- Removing `toggleMode()` invalidates existing test in `viewer-controls.component.spec.ts`; update test.

---

### Track 3 — Bohr Model Fix

**Objective**: Correct shell ring geometry so rings and electron orbits are co-planar; update camera to educational framing that shows shells as near-circles.

**Scope**:
- `renderer-types.ts` — remove `ringTilt` from `ShellGeometryParams`
- `renderer-utils.ts` — remove `ringTilt` from `computeShellGeometry()` output
- `shell-renderer.ts` — replace `mesh.rotation.x = shell.ringTilt` with constant `Math.PI / 2`
- `atom-renderer.service.ts` — update `CAM_FOV = 65`, `CAM_POSITION = (0, 8, 16)`, `MAX_DISTANCE = 35`
- `bohr-strategy.spec.ts`, `quantum-strategy.spec.ts` — remove `ringTilt` from mock `ShellGeometryParams`

**Technical approach** (Three.js):

*Geometry fix*:
`THREE.TorusGeometry` lies in the XY plane by default. `BohrStrategy` places electrons at `(r·cos θ, 0, r·sin θ)` — the **XZ plane** (y = 0). To align rings with electron orbits, apply `rotation.x = Math.PI / 2` to every ring mesh. This rotates the ring from XY to XZ plane. Electrons and rings now share the same plane; per-shell tilt variation removed.

*Camera fix*: Update constants in `atom-renderer.service.ts`:
```ts
const CAM_FOV      = 65;
const CAM_POSITION = new THREE.Vector3(0, 8, 16);
const MAX_DISTANCE = 35;
```
Camera at (0, 8, 16) looks down at the XZ plane at ~26.6° elevation (within spec's 15–30° range). Shell 7 (radius 10.2) fits within the frustum with ~12% margin at FOV 65.

**Dependencies** (within track):
`renderer-types.ts` → `renderer-utils.ts` → `shell-renderer.ts` → specs/tests

**Risks / Edge cases**:
- `quantum-strategy.ts` may read `ringTilt` — grep before deleting.
- After fix, all shell rings are parallel (all in XZ plane). Shell colors and radii still differentiate shells visually. This is intentionally simpler and more educational.
- Camera change only affects the reset position, not the user's live orbit. Both reset triggers (element change and Reset Camera button) will apply the new position correctly.

---

### Track 4 — Visual Polish

**Objective**: Consistent spacing, card layout for element properties, readable selected-element highlight.

**Scope**:
- `element-detail.component.ts` — tighten card layout after hero section removal
- `element-cell.component.ts` — verify selected state is visually distinct

**Technical approach** (CSS):
- `ElementDetailComponent`: after hero removal, the `<dl>` becomes the full content. Add `padding: 12px 16px` and verify row gaps.
- `ElementCellComponent`: verify `.selected` CSS applies distinct border + background. If too subtle, update to `border: 2px solid #58a6ff; background: #1c2840`.

**Dependencies**: Depends on Track 1 (hero removal done first to avoid layout conflicts).

**Risks / Edge cases**:
- Periodic table cell size at 300px sidebar: element symbols are 1–2 chars; readable at 36px cell min-width.
- Selected element border must be distinguishable from hover state.

---

## Suggested Execution Order

```
Step 1: Track 3 — Bohr Model Fix
   Reason: foundational geometry correctness; validates H/He/Li rendering before UI work.

Step 2: Track 1 + Track 2 (parallel)
   Reason: different files; layout + controls changes are independent.

Step 3: Track 4 — Visual Polish
   Reason: depends on Track 1 hero removal being in place.
```

---

## Parallelization Opportunities

| Parallel pair | Safe? | Note |
|---------------|-------|------|
| Track 1 + Track 2 | ✅ | Different files |
| Track 1 + Track 3 | ✅ | Different files |
| Track 2 + Track 3 | ✅ | Different files |
| Track 4 + Track 1 | ⚠ Partial | Track 4 depends on Track 1 hero removal |

---

## Definition of Done

**Geometry (P1)**
- [ ] Hydrogen: one nucleus at (0,0,0), one flat ring, one electron on circumference
- [ ] Helium: one ring, two electrons at 180° apart
- [ ] Lithium: two concentric rings, electron counts 2 + 1
- [ ] Uranium (or any 7-shell element): all 7 rings visible, no clipping, no overlap

**Camera (P1)**
- [ ] Reset Camera shows shells as near-circles from slightly above; all shells visible
- [ ] Shell 7 elements do not clip outside viewer bounds at reset position
- [ ] Camera elevation at reset: 15–30° above XZ plane

**Layout (P2)**
- [ ] Left panel 300px; periodic table scrolls if needed; right panel takes remaining width
- [ ] Element header (symbol + name + atomic number) visible at top of right panel
- [ ] Hydrogen selected by default on first load; right panel never empty
- [ ] No layout shift when switching between elements

**Controls (P3)**
- [ ] Pause freezes electron motion within one animation frame
- [ ] Resume restarts from frozen position
- [ ] Mode selector is a segmented control: Bohr active, Quantum disabled
- [ ] All controls in one visual row adjacent to the viewer

**Visual (P2)**
- [ ] Selected element in periodic table has distinct border/background vs unselected
- [ ] Element detail shows property rows (atomic number, mass, config)
- [ ] Interface looks polished at 1080p and 1440p
- [ ] Dark theme retained; no light-mode artifacts
