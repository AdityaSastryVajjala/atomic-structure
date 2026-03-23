# Contract: Bohr Camera Preset

**Module**: `src/app/renderer/atom-renderer.service.ts`
**Change type**: Updated constants
**Feature**: `003-ui-bohr-fix`

---

## Preset Values

| Constant | New Value | Old Value | Unit |
|----------|-----------|-----------|------|
| `CAM_FOV` | `65` | `45` | degrees |
| `CAM_POSITION` | `Vector3(0, 8, 16)` | `Vector3(0, 2, 14)` | Three.js units |
| `CAM_TARGET` | `Vector3(0, 0, 0)` | `Vector3(0, 0, 0)` | Three.js units |
| `MIN_DISTANCE` | `3` | `3` | Three.js units |
| `MAX_DISTANCE` | `35` | `25` | Three.js units |

## Geometry Verification

```
Position:          (0, 8, 16)
Distance to origin: √(0² + 8² + 16²) = √320 ≈ 17.9 units
Elevation angle:    arctan(8 / 16) ≈ 26.6°  [spec: 15–30°] ✅
Half-FOV:           32.5°
Visible half-height: tan(32.5°) × 17.9 ≈ 11.4 units
Shell 7 radius:     10.2 units  [1.2 + 6 × 1.5]
Margin:             ≈ 12%  ✅

Ring appearance at 26.6° elevation (rings in XZ plane):
  Apparent aspect ratio: cos(26.6°) ≈ 0.895  (near-circular) ✅
```

## Behaviour Contract

`AtomRendererService.resetCamera()` MUST:
1. Set `camera.position` to `CAM_POSITION`.
2. Set `controls.target` to `CAM_TARGET`.
3. Call `controls.update()`.
4. NOT change `camera.fov` at reset time (FOV is set once at init; reset only repositions).

`resetCamera()` is called automatically on element change AND on the "Reset Camera" button press.

## Scope

This preset applies to **Bohr mode only**. When a Quantum mode camera preset is introduced in a future phase, it MUST be a separate named constant set and MUST NOT overwrite these values.
