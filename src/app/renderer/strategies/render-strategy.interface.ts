/**
 * RenderStrategy interface — common contract for all electron visualization modes.
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
 *
 * See contracts/render-strategy.md for full specification.
 */

import * as THREE from 'three';
import { Element } from '../../models/element.model';
import { ShellGeometryParams } from '../../models/renderer-types';

export interface RenderStrategy {
  /**
   * Initialises the strategy for a given element.
   * Creates all Three.js objects needed to represent electrons and adds them to the scene.
   *
   * Called when a new element is selected or the visualization mode is switched
   * (after the previous strategy has been disposed).
   *
   * @param element     The element to render electrons for.
   * @param scene       The Three.js scene to add objects into.
   * @param shellParams Pre-computed geometry parameters for each shell. MUST NOT be mutated.
   */
  init(
    element: Element,
    scene: THREE.Scene,
    shellParams: readonly ShellGeometryParams[]
  ): void;

  /**
   * Updates electron positions/states for the current animation frame.
   * Called every frame by the render loop.
   *
   * Electron positions MUST be computed as pure functions of accumulatedTimeMs so that
   * passing the same value twice produces identical positions (idempotent). This is what
   * makes pause/resume work correctly — the time value simply stops advancing.
   *
   * @param accumulatedTimeMs Total elapsed animation time in milliseconds.
   *                          Frozen when animation is paused.
   */
  update(accumulatedTimeMs: number): void;

  /**
   * Removes all Three.js objects created by this strategy from the scene and frees
   * their GPU resources (geometry.dispose(), material.dispose()).
   *
   * Called before switching to a different strategy or before loading a new element.
   * After dispose(), this strategy instance MUST NOT be used again.
   *
   * @param scene The same scene passed to init(). All owned objects MUST be removed.
   */
  dispose(scene: THREE.Scene): void;
}
