/**
 * renderer-utils.ts — Pure computation helpers for the rendering layer.
 *
 * No Three.js or Angular imports. Converts element domain data into pre-computed
 * geometry parameters consumed by NucleusRenderer, ShellRenderer, and strategies.
 *
 * Formulas reference: research.md R-004 (shell geometry), R-006 (nucleus), R-009 (colors).
 */

import { Element } from '../models/element.model';
import { NucleusParams, ShellGeometryParams } from '../models/renderer-types';

/**
 * Fixed 7-color palette for shell rings and Bohr electrons, one color per shell index.
 * Index 0 = innermost shell (K). Applied as (shellIndex - 1) % 7.
 * Research ref: R-009.
 */
export const SHELL_COLORS: readonly string[] = [
  '#4fc3f7', // K shell — sky blue
  '#81c784', // L shell — sage green
  '#ffb74d', // M shell — amber
  '#f06292', // N shell — rose
  '#ce93d8', // O shell — lavender
  '#4dd0e1', // P shell — cyan
  '#fff176', // Q shell — pale yellow
];

/**
 * Computes ShellGeometryParams for every occupied shell of the given element.
 * Returns one entry per shell, ordered innermost-first (index 1 = K shell).
 *
 * Formulas (research.md R-004):
 *   radius          = 1.2 + (i - 1) * 1.5            [Three.js units]
 *   angularVelocity = 0.6 / i                         [radians/second, outer = slower]
 *   color           = SHELL_COLORS[(i - 1) % 7]
 *
 * @param element The element whose shells array drives the output length and electronCount.
 */
export function computeShellGeometry(element: Element): ShellGeometryParams[] {
  return element.shells.map((electronCount, idx) => {
    const i = idx + 1; // 1-based shell index
    return {
      shellIndex: i,
      electronCount,
      radius: 1.2 + (i - 1) * 1.5,
      angularVelocity: 0.6 / i,
      color: SHELL_COLORS[(i - 1) % SHELL_COLORS.length],
    };
  });
}

/**
 * Computes NucleusParams for the given element.
 * Caps displayCount at 20 spheres (per AD-006, research.md R-006).
 *
 * protonCount  = element.atomicNumber
 * neutronCount = round(atomicMass) - atomicNumber   (may be 0 for Hydrogen-1)
 * displayCount = min(protonCount + neutronCount, 20)
 *
 * @param element The element to derive nucleus parameters from.
 */
export function computeNucleusParams(element: Element): NucleusParams {
  const protonCount = element.atomicNumber;
  const neutronCount = Math.max(0, Math.round(element.atomicMass) - element.atomicNumber);
  const displayCount = Math.min(protonCount + neutronCount, 20);
  return { protonCount, neutronCount, displayCount };
}
