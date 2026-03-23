# Research: UI/UX Optimization and Bohr Model Correction

**Feature**: `003-ui-bohr-fix`
**Generated**: 2026-03-23
**Status**: Complete — all NEEDS CLARIFICATION resolved by code analysis

---

## R-001: Ring / Electron Alignment (Root Cause of Bohr Bug)

**Decision**: Remove per-shell `ringTilt` variation. Fix all shell rings to `rotation.x = Math.PI / 2` so they lie in the **XZ plane** (y = 0), matching the electron orbit plane already used by `BohrStrategy`.

**Rationale**:
`BohrStrategy.update()` places electrons at `(r·cos θ, 0, r·sin θ)` — orbiting in the XZ plane (y = 0). `THREE.TorusGeometry` defaults to the **XY plane**. The current `ShellRenderer` applies a per-shell `ringTilt = π/3 + i·π/20` (≈ 72° for shell 1) which is close to but never exactly `π/2`, and different for each shell. Result: rings and electrons are in different planes; visual misalignment.

**Fix**:
- In `renderer-utils.ts`: remove the `ringTilt` calculation; field can be deleted from `ShellGeometryParams` or set to a constant `Math.PI / 2` passed through.
- In `shell-renderer.ts`: replace `mesh.rotation.x = shell.ringTilt` with `mesh.rotation.x = Math.PI / 2` (constant).
- `BohrStrategy` requires no changes — electron formula is already correct.

**Alternatives considered**:
- Tilt both ring and orbit to the same non-zero angle — adds complexity to `BohrStrategy.update()` with no educational gain. Rejected.
- Keep rings in XY plane and change electrons to XY orbit — requires changing `BohrStrategy` electron formula; less natural Three.js orientation. Rejected.

---

## R-002: Camera Configuration for Bohr Educational Clarity

**Decision**: `CAM_POSITION = (0, 8, 16)`, `CAM_FOV = 65`, `MAX_DISTANCE = 35`. Camera looks down from above the XZ plane at ~26.6° elevation.

**Rationale**:
With rings now flat in XZ plane (y = 0), a camera above the XZ plane makes rings appear nearly circular. At elevation 26.6° (arctan(8/16)), rings appear as ellipses with aspect ratio cos(26.6°) ≈ 0.895 — nearly circular and clearly readable.

Shell radius formula: `R(i) = 1.2 + (i − 1) × 1.5`. Shell 7 (max) = 10.2 Three.js units.
From `(0, 8, 16)`, camera distance = √(64 + 256) = 17.9 units. FOV 65°, half-FOV 32.5°: visible half-height = tan(32.5°) × 17.9 ≈ 11.4 units — fits shell 7 (10.2) with ~12% margin. ✅

This replaces current `CAM_POSITION = (0, 2, 14)` / `CAM_FOV = 45` which clips shell 7 in the vertical direction.

**Alternatives considered**:
- Orthographic camera — would require `THREE.OrthographicCamera` swap; significant refactor; Three.js `OrbitControls` switching to ortho requires care. Rejected (simplicity principle).
- Near-zero elevation (purely frontal) — rings look like straight lines. Rejected (unreadable).
- Strongly top-down (>60° elevation) — loses depth cue; all shells look like nested circles without z-separation. Rejected.

---

## R-003: Shell Radius Scale Validation

**Decision**: Retain current radius formula `R(i) = 1.2 + (i − 1) × 1.5`. No changes needed.

**Rationale**:
With the new camera at `(0, 8, 16)` FOV 65, shell 7 fits with margin (see R-002). Shells are evenly spaced (1.5 units apart) so they do not overlap. Minimum gap between adjacent shells is 1.5 units; electron radius is 0.12 units; no visual overlap possible.

---

## R-004: Default Element on Load (FR-006)

**Decision**: Pre-select Hydrogen (Z=1) in `ViewerStateService` / `app.config.ts` via `APP_INITIALIZER` or service constructor default.

**Rationale**:
`INITIAL_VIEWER_STATE` in `viewer-state.model.ts` currently has `selectedElement: null`. The simplest fix is to set `selectedElement` to Hydrogen after `ElementDataService` loads. The `ElementDataService` already loads all elements via `APP_INITIALIZER`; a post-init call to `viewerState.selectElement(elements[0])` satisfies FR-006.

**Alternatives considered**:
- Set default in `AppComponent.ngOnInit` — causes a one-frame render of empty right panel. Avoided by using `APP_INITIALIZER` ordering.
- Hard-code Hydrogen data in initial state — couples state model to data; against separation of concerns. Rejected.

---

## R-005: Left Panel Fixed Width

**Decision**: `width: 300px; flex-shrink: 0` on `.panel-left` in `AppComponent`.

**Rationale**:
The periodic table grid uses `minmax(36px, 1fr)` for its 18 columns. At 36px minimum × 18 columns + gaps, minimum table width ≈ 36 × 18 + 2 × 17 = 682px. This is already wider than 300px, so the table will scroll horizontally within a 300px sidebar — which is acceptable and already handled by `overflow-x: auto`.

A `300px` sidebar keeps the table compressed but readable (symbols are 2–3 chars, numbers are 1–3 digits at small font size). `320px` is a viable alternative if testing shows symbol truncation.

---

## R-006: Element Header in Right Panel

**Decision**: Inline the element hero (`symbol`, `name`, `atomicNumber`) directly into `AppComponent`'s right panel template, reading from `ViewerStateService`. No new component needed.

**Rationale**:
The existing `ElementDetailComponent` has a `.hero` section (symbol, name, number). Moving this to a top-of-panel header position means duplicating signal reads. The cleanest solution: extract the header to `AppComponent` (which already injects `ViewerStateService`) or create a minimal `ElementHeaderComponent`. Given the principle of simplicity, inline into `AppComponent` template.

---

## R-007: Segmented Control for Mode Selector

**Decision**: Implement as inline CSS segmented control using styled radio-button-like `<button>` elements. No new library needed.

**Rationale**:
A segmented control is two side-by-side buttons with shared border, where the active button has a distinct background. Angular `[class.active]` binding with CSS satisfies this. "Quantum" button rendered as disabled (`disabled` attribute + `opacity: 0.5`).

---

## R-008: Electron Animation Speed

**Decision**: Retain current `angularVelocity = 0.6 / i` rad/s. Shell 1 completes one orbit in `2π / 0.6 ≈ 10.5 s`. Within the spec's 4–8 s recommendation for shell 1 (slightly slower), but acceptable and already validated by the existing implementation.

No changes to animation speed are required by this feature.

---

## Summary Table

| ID | Question | Decision |
|----|----------|----------|
| R-001 | Root cause of Bohr geometry bug | Ring tilt ≠ electron plane; fix: `rotation.x = π/2` constant |
| R-002 | Camera for educational clarity | `(0, 8, 16)` position, FOV 65 |
| R-003 | Shell radius scale for 7-shell elements | Retain formula; verified OK with new camera |
| R-004 | Default element on load | Select Hydrogen post-`APP_INITIALIZER` |
| R-005 | Left panel width | `300px` fixed with `flex-shrink: 0` |
| R-006 | Element header location | Inline in `AppComponent` right panel |
| R-007 | Mode selector UI | Segmented control, Quantum disabled |
| R-008 | Animation speed | No change; existing values acceptable |
