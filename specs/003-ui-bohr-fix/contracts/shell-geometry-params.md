# Contract: ShellGeometryParams (Updated)

**Module**: `src/app/models/renderer-types.ts`
**Change type**: Breaking removal of `ringTilt` field
**Feature**: `003-ui-bohr-fix`

---

## Interface (after change)

```ts
export interface ShellGeometryParams {
  /** Shell index (1-based). Shell 1 = K shell. */
  shellIndex: number;

  /** Number of electrons on this shell. */
  electronCount: number;

  /**
   * Orbital radius in Three.js scene units.
   * R(i) = 1.2 + (i - 1) × 1.5
   * Shell 1 = 1.2, Shell 7 = 10.2
   */
  radius: number;

  /**
   * Angular velocity in radians per second (Bohr mode animation).
   * ω(i) = 0.6 / i — outer shells orbit slower.
   */
  angularVelocity: number;

  /**
   * Hex color string for this shell's ring and Bohr electrons.
   * Drawn from fixed 7-colour palette (SHELL_COLORS in renderer-utils.ts).
   */
  color: string;
}
```

## Removed Field

| Field | Old Type | Reason for Removal |
|-------|----------|--------------------|
| `ringTilt` | `number` (radians) | Caused ring/electron plane misalignment. Replaced by constant `Math.PI / 2` applied in `ShellRenderer` directly. |

## Production Rule

`ShellRenderer` MUST apply `mesh.rotation.x = Math.PI / 2` unconditionally for all shell ring meshes, placing them in the XZ plane (y = 0) to match the `BohrStrategy` electron orbit plane.

## Consumers

| File | Usage | Required change |
|------|-------|-----------------|
| `renderer-utils.ts` | Produces `ShellGeometryParams[]` | Remove `ringTilt` from output object |
| `shell-renderer.ts` | Consumes `ShellGeometryParams[]` | Replace `mesh.rotation.x = shell.ringTilt` with `mesh.rotation.x = Math.PI / 2` |
| `bohr-strategy.ts` | Consumes `ShellGeometryParams[]` | No change — never used `ringTilt` |
| `quantum-strategy.ts` | Consumes `ShellGeometryParams[]` | Verify — likely no `ringTilt` usage |
| `bohr-strategy.spec.ts` | Tests `BohrStrategy` | Verify mock params do not include `ringTilt` |
