/**
 * Element data types for the Atomic Structure Viewer.
 *
 * These types represent the core domain model: a chemical element and its
 * electron shell configuration as used throughout the application.
 *
 * All 118 elements are loaded from assets/data/elements.json at startup
 * via ElementDataService and are immutable at runtime.
 */

/**
 * Represents one electron shell in a Bohr model element.
 * Index 1 = innermost shell.
 */
export interface ElectronShell {
  /** Shell index: 1 = K shell (innermost), up to 7 for heaviest elements. */
  index: number;
  /** Number of electrons on this shell. Must be > 0. */
  electrons: number;
}

/**
 * A chemical element with all data needed for visualization and the detail panel.
 * All 118 elements are stored in assets/data/elements.json and loaded once at startup.
 */
export interface Element {
  /** Unique identifier. Integer from 1 (Hydrogen) to 118 (Oganesson). */
  atomicNumber: number;

  /** Full element name, e.g., "Carbon". */
  name: string;

  /** Chemical symbol, e.g., "C". */
  symbol: string;

  /**
   * Standard atomic mass in unified atomic mass units (u).
   * Example: 12.011 for Carbon, 1.008 for Hydrogen.
   */
  atomicMass: number;

  /**
   * Electron configuration as an ordered array of electron counts per shell.
   * Index 0 = innermost shell (K shell). Length equals number of occupied shells.
   * Example: [2, 4] for Carbon, [2, 8, 1] for Sodium.
   * Computed from simplified Bohr model shell-filling (see research.md R-007).
   */
  shells: number[];

  /**
   * Optional educational summary string, sourced from Periodic-Table-JSON dataset.
   * May be undefined for some elements; UI must handle absence gracefully.
   */
  summary?: string;
}

/**
 * Derived helper: returns the ElectronShell array for a given element,
 * converting the flat shells array into indexed shell objects.
 */
export function getElectronShells(element: Element): ElectronShell[] {
  return element.shells.map((electrons, i) => ({
    index: i + 1,
    electrons,
  }));
}

/**
 * Derived helper: returns the human-readable electron configuration string,
 * e.g., "2, 8, 1" for Sodium.
 */
export function getConfigurationString(element: Element): string {
  return element.shells.join(', ');
}
