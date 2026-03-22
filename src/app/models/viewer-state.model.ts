/**
 * Viewer state types for the Atomic Structure Viewer.
 *
 * Defines the global viewer state managed by ViewerStateService and shared
 * across all viewer-related components via RxJS observables.
 */

import { Element } from './element.model';

/**
 * The two electron visualization modes available in Phase 1.
 * Applies ONLY to electron rendering; nucleus and shell rings are unaffected.
 *
 * - 'bohr': Discrete electron spheres animating in circular orbits.
 * - 'quantum': Particle cloud per shell, illustrative probability-inspired distribution.
 */
export type VisualizationMode = 'bohr' | 'quantum';

/**
 * Tracks the state of the electron animation loop.
 * isPaused: whether electron positions are currently frozen.
 * accumulatedTimeMs: total elapsed animation time in milliseconds.
 *   - Incremented only when !isPaused.
 *   - Drives all time-dependent electron position calculations.
 *   - Preserved across element changes and mode switches.
 *   - Reset to 0 only when explicitly requested (not on element change).
 */
export interface AnimationState {
  isPaused: boolean;
  accumulatedTimeMs: number;
}

/**
 * Global viewer state shared across all viewer-related components.
 * Managed by ViewerStateService and exposed as observables.
 */
export interface ViewerState {
  /** Currently selected element. Null until the user first clicks an element. */
  selectedElement: Element | null;

  /** Active visualization mode. Defaults to 'bohr'. */
  mode: VisualizationMode;

  /** Current animation state. Defaults to { isPaused: false, accumulatedTimeMs: 0 }. */
  animation: AnimationState;
}

/** Default initial state for the viewer. */
export const INITIAL_VIEWER_STATE: ViewerState = {
  selectedElement: null,
  mode: 'bohr',
  animation: {
    isPaused: false,
    accumulatedTimeMs: 0,
  },
};
