# Quickstart: 003-ui-bohr-fix

**Feature**: UI/UX Optimization and Bohr Model Correction
**Branch**: `003-ui-bohr-fix` (tracked under `specs/003-ui-bohr-fix/`; working branch is `main`)

---

## Dev Setup

```bash
# Install dependencies (if not already done)
npm install

# Start dev server
ng serve
# → http://localhost:4200

# Run tests
ng test
```

---

## Key Files for This Feature

| File | What to change |
|------|----------------|
| `src/app/models/renderer-types.ts` | Remove `ringTilt` from `ShellGeometryParams` |
| `src/app/renderer/renderer-utils.ts` | Remove `ringTilt` from `computeShellGeometry()` output |
| `src/app/renderer/shell-renderer.ts` | Replace `mesh.rotation.x = shell.ringTilt` → `Math.PI / 2` |
| `src/app/renderer/atom-renderer.service.ts` | Update `CAM_FOV`, `CAM_POSITION`, `MAX_DISTANCE` constants |
| `src/app/app.component.ts` | Fix left panel width, add element header, select Hydrogen on init |
| `src/app/components/element-detail/element-detail.component.ts` | Remove `.hero` section |
| `src/app/components/viewer-controls/viewer-controls.component.ts` | Convert mode button to segmented control |
| `src/app/components/periodic-table/element-cell/element-cell.component.ts` | Verify selected-state highlight |

---

## Manual Verification Checklist

After implementation, verify these visually in the browser:

1. **Hydrogen** — select from periodic table → one nucleus at center, one flat circular ring, one electron on ring circumference. ✅
2. **Helium** — two electrons evenly spaced (180° apart) on one ring. ✅
3. **Lithium** — two concentric flat rings, 2 electrons on ring 1, 1 on ring 2. ✅
4. **Uranium (Z=92)** — 7 rings visible, no overlap, no clipping. ✅
5. **Pause** — electrons freeze immediately; rings stay visible. ✅
6. **Reset Camera** — atom recenters, rings appear as near-circles from slightly above. ✅
7. **Left panel** — 300px wide, periodic table scrolls if needed; viewer panel has majority of width. ✅
8. **Element header** — shows symbol, name, atomic number at top of right panel. ✅
9. **Controls grouping** — Pause/Resume + Reset Camera + mode selector in one row. ✅
10. **Mode selector** — segmented: "Bohr" active (highlighted), "Quantum" visible but disabled. ✅

---

## Architecture Notes

- **Geometry fix** (`shell-renderer.ts`, `renderer-utils.ts`): All changes isolated to the renderer layer. No Angular imports needed.
- **Camera fix** (`atom-renderer.service.ts`): Module-level constants only. `resetCamera()` logic unchanged.
- **Layout fix** (`app.component.ts`): CSS changes + new inline header template. No new component needed.
- **Animation loop**: Runs outside `NgZone` — do NOT add Angular state reads inside the loop.
- **Strategy pattern**: `BohrStrategy` and `QuantumStrategy` are unchanged. Only their input (`ShellGeometryParams`) loses one field.

---

## Running Tests

```bash
ng test --include="**/shell-renderer*" --include="**/renderer-utils*" --include="**/bohr-strategy*"
```

Key test files to update:
- `bohr-strategy.spec.ts` — mock `ShellGeometryParams` must not include `ringTilt`
- `quantum-strategy.spec.ts` — same check
