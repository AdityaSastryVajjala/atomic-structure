# Data Model: UI/UX Optimization and Bohr Model Correction

**Feature**: `003-ui-bohr-fix`
**Generated**: 2026-03-23

---

## Overview

This feature introduces no new data entities and makes no changes to `elements.json` or the `Element` / `ElementShell` domain models. All changes are confined to renderer geometry parameters and viewer state defaults.

---

## Changed: `ShellGeometryParams` (`src/app/models/renderer-types.ts`)

**Change**: Remove `ringTilt` field.

```ts
// BEFORE
export interface ShellGeometryParams {
  shellIndex: number;
  electronCount: number;
  radius: number;
  angularVelocity: number;
  ringTilt: number;       // ← REMOVE
  color: string;
}

// AFTER
export interface ShellGeometryParams {
  shellIndex: number;
  electronCount: number;
  radius: number;
  angularVelocity: number;
  color: string;
}
```

**Rationale**: `ringTilt` was a per-shell visual differentiation parameter that misaligned ring geometry with the electron orbit plane. `ShellRenderer` now applies a constant `rotation.x = Math.PI / 2` directly, making the field unnecessary. Removing it keeps the contract minimal.

**Consumers affected**:
- `renderer-utils.ts` — remove `ringTilt` from `computeShellGeometry()` output
- `shell-renderer.ts` — remove `shell.ringTilt` usage; use constant `Math.PI / 2`
- `bohr-strategy.ts` — no change (never used `ringTilt`)
- `quantum-strategy.ts` — check for usage; likely none

---

## Changed: Camera Preset Constants (`src/app/renderer/atom-renderer.service.ts`)

The Bohr canonical camera preset is encoded as module-level constants. These are not part of a typed model, but their values are the normative specification for the `resetCamera()` behaviour.

| Constant | Current Value | New Value | Reason |
|----------|---------------|-----------|--------|
| `CAM_FOV` | 45 | 65 | Wider frustum to fit 7-shell elements |
| `CAM_POSITION` | `(0, 2, 14)` | `(0, 8, 16)` | Elevated above XZ plane; shells read as near-circles |
| `CAM_TARGET` | `(0, 0, 0)` | `(0, 0, 0)` | No change |
| `MAX_DISTANCE` | 25 | 35 | Allows user to zoom out for large elements |
| `MIN_DISTANCE` | 3 | 3 | No change |

**Elevation verification**: From `(0, 8, 16)` to origin, elevation from XZ plane = arctan(8/16) ≈ **26.6°**, within the spec's 15–30° range.

**Frustum verification**: Distance = √(64 + 256) = 17.9 units. Half-FOV = 32.5°. Visible half-height = tan(32.5°) × 17.9 ≈ 11.4 units. Shell 7 radius = 10.2 units. Margin ≈ 12%. ✅

---

## Changed: Initial Viewer State (`src/app/models/viewer-state.model.ts` + services)

**Change**: `INITIAL_VIEWER_STATE.selectedElement` remains `null` at construction time. Hydrogen (atomicNumber = 1) is selected after `APP_INITIALIZER` completes, via a post-init call in `AppComponent.ngOnInit()`.

**Rationale**: `INITIAL_VIEWER_STATE` cannot reference `ElementDataService` (which loads asynchronously). The post-init selection is the correct lifecycle hook.

**No model changes required** — the `ViewerState` type already supports non-null `selectedElement`. The default selection is a runtime initialisation, not a structural change.

---

## Unchanged Entities

| Entity | Location | Status |
|--------|----------|--------|
| `Element` | `element.model.ts` | No change |
| `ElectronShell` | `element.model.ts` | No change |
| `NucleusParams` | `renderer-types.ts` | No change |
| `ViewerState` | `viewer-state.model.ts` | No change |
| `AnimationState` | `viewer-state.model.ts` | No change |
| `VisualizationMode` | `viewer-state.model.ts` | No change |
| `elements.json` | `src/assets/data/` | No change |
