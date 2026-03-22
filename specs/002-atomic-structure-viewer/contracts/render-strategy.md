# Contract: RenderStrategy Interface

**File**: `src/app/renderer/strategies/render-strategy.interface.ts`
**Implementations**: `BohrStrategy`, `QuantumStrategy`
**Consumer**: `AtomRendererService` (holds one active strategy at a time)
**Purpose**: Defines the contract that both electron visualization modes must fulfill.
Allows `AtomRendererService` to switch between Bohr and quantum-inspired rendering
without knowing the details of either implementation.

---

## TypeScript Interface

```typescript
import * as THREE from 'three';
import { Element } from '../../models/element.model';
import { ShellGeometryParams } from '../../models/viewer-state.model';

/**
 * Common contract for all electron visualization strategies.
 *
 * Implementations are responsible for:
 *  - Creating and adding their Three.js objects to the scene in init().
 *  - Updating electron positions/states based on time in update().
 *  - Removing and disposing all their Three.js objects in dispose().
 *
 * Implementations MUST NOT:
 *  - Modify the nucleus geometry (managed by NucleusRenderer).
 *  - Modify shell ring geometry (managed by ShellRenderer).
 *  - Access or modify camera or lights.
 *  - Store references to the scene beyond what is needed for dispose().
 */
export interface RenderStrategy {

  /**
   * Initializes the strategy for a given element.
   * Creates all Three.js objects (geometries, materials, meshes/points)
   * needed to represent the electrons, and adds them to the scene.
   *
   * Called when:
   *  - A new element is selected.
   *  - The visualization mode is switched (after the previous strategy is disposed).
   *
   * @param element   The element to render electrons for.
   * @param scene     The Three.js scene to add objects into.
   * @param shellParams Pre-computed geometry parameters for each shell
   *                    (radius, angularVelocity, color, etc.). MUST NOT be mutated.
   */
  init(
    element: Element,
    scene: THREE.Scene,
    shellParams: readonly ShellGeometryParams[]
  ): void;

  /**
   * Updates electron positions/states for the current animation frame.
   * Called every frame by the render loop, regardless of whether animation is
   * paused — the caller (AtomRendererService) advances accumulatedTimeMs only
   * when not paused, so strategies receive a frozen time value when paused.
   *
   * Implementations compute positions as pure functions of accumulatedTimeMs,
   * so passing the same value twice produces the same positions (idempotent).
   *
   * @param accumulatedTimeMs Total elapsed animation time in milliseconds.
   *                          Frozen when animation is paused; same value each
   *                          frame until resumed.
   */
  update(accumulatedTimeMs: number): void;

  /**
   * Removes all Three.js objects created by this strategy from the scene
   * and frees their GPU resources (geometry.dispose(), material.dispose()).
   *
   * Called before switching to a different strategy or before loading a new element.
   * After dispose(), this strategy instance MUST NOT be used again.
   *
   * @param scene The same scene passed to init(). Objects MUST be removed from it.
   */
  dispose(scene: THREE.Scene): void;
}
```

---

## Implementation Contracts

### BohrStrategy

**File**: `src/app/renderer/strategies/bohr-strategy.ts`

| Responsibility | Detail |
|----------------|--------|
| Objects created | One `Mesh` (SphereGeometry + MeshPhongMaterial) per electron |
| Position update | `θ(j) = (2π * j / n) + ω(i) * accumulatedTimeMs / 1000`; x/z from cos/sin |
| Y position | All electrons stay at y=0 within their shell plane (shell ring handles tilt) |
| Material | MeshPhongMaterial, color matches `shellParams[i].color`, radius 0.12 units |
| Group | All electron meshes grouped in a `THREE.Group` per shell for easy dispose |

### QuantumStrategy

**File**: `src/app/renderer/strategies/quantum-strategy.ts`

| Responsibility | Detail |
|----------------|--------|
| Objects created | One `THREE.Points` per shell (BufferGeometry + PointsMaterial) |
| Particle count | `n * 12` per shell where `n = shell.electronCount` |
| Position init | Spherical: `r = R(shell) + Gaussian(σ=0.4)`, `θ,φ` uniform random |
| Position update | Rotate all particles by `ω_group * accumulatedTimeMs / 1000`; add per-particle drift only when time advances (drift = 0 when paused, since time is frozen) |
| Material | PointsMaterial, size 0.12, circular alpha-masked sprite, opacity 0.6, additive blending |
| Dispose | Calls `geometry.dispose()`, `material.dispose()`, removes Points from scene |

---

## Extension Guidance (Phase 2+)

To add a third visualization mode (e.g., molecular orbital for Phase 2):
1. Create `src/app/renderer/strategies/orbital-strategy.ts` implementing `RenderStrategy`.
2. Add `'orbital'` to the `VisualizationMode` union type in `viewer-state.model.ts`.
3. Update `AtomRendererService` to construct `OrbitalStrategy` when mode is `'orbital'`.
4. No other files need to change.

The `RenderStrategy` interface itself MUST remain stable across phases.
