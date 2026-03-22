/**
 * Renderer-internal geometry types for the Atomic Structure Viewer.
 *
 * These types are INTERNAL to the renderer/ layer and MUST NOT be imported
 * by Angular components or services outside of renderer/. They encapsulate
 * pre-computed Three.js geometry parameters derived from element data.
 */

/**
 * Pre-computed geometric parameters for a single electron shell.
 * Generated once per element load; reused by both Bohr and Quantum strategies.
 */
export interface ShellGeometryParams {
  /** Shell index (1-based), matches ElectronShell.index. */
  shellIndex: number;

  /** Number of electrons on this shell. */
  electronCount: number;

  /**
   * Orbital radius in Three.js scene units.
   * R(i) = 1.2 + (i - 1) * 1.5
   */
  radius: number;

  /**
   * Angular velocity in radians per second (Bohr mode).
   * ω(i) = 0.6 / i — outer shells orbit slower.
   */
  angularVelocity: number;

  /**
   * Torus ring tilt in radians for shell ring visual differentiation.
   * tilt(i) = Math.PI / 3 + (i * Math.PI / 20)
   */
  ringTilt: number;

  /**
   * Color for this shell's ring and Bohr electrons, from the fixed 7-color palette.
   * Represented as a hex string, e.g., '#4fc3f7'.
   */
  color: string;
}

/**
 * Parameters passed to nucleus rendering.
 * Derived from the selected element; used by NucleusRenderer.
 */
export interface NucleusParams {
  /** Number of protons. Equals element.atomicNumber. */
  protonCount: number;

  /**
   * Estimated neutron count. Calculated as round(atomicMass) - atomicNumber.
   * May be 0 for Hydrogen-1 in some isotope representations.
   */
  neutronCount: number;

  /**
   * Capped total display sphere count. MAX = 20.
   * If protonCount + neutronCount <= 20: equals actual total.
   * Otherwise: 20, proportionally split between protons and neutrons.
   */
  displayCount: number;
}
