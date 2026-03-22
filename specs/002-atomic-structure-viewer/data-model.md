# Data Model: Atomic Structure Viewer (Phase 1 MVP)

**Branch**: `002-atomic-structure-viewer` | **Date**: 2026-03-22
**Source**: spec.md (Key Entities) + research.md (R-004, R-005, R-007)

All types below are to be placed in `src/app/models/`.

---

## 1. Element Data Types (`element.model.ts`)

```typescript
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
```

---

## 2. Viewer State Types (`viewer-state.model.ts`)

```typescript
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
```

---

## 3. Renderer Internal Types (used within `renderer/`)

These types are internal to the rendering layer and are not exposed to Angular components.

```typescript
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
```

---

## 4. JSON Data Schema (`assets/data/elements.json`)

The bundled JSON file is a top-level array of 118 element objects. See also:
`contracts/elements-json-schema.md` for the formal schema definition.

**Example records**:

```json
[
  {
    "atomicNumber": 1,
    "name": "Hydrogen",
    "symbol": "H",
    "atomicMass": 1.008,
    "shells": [1],
    "summary": "Hydrogen is the lightest element and the most abundant chemical substance."
  },
  {
    "atomicNumber": 6,
    "name": "Carbon",
    "symbol": "C",
    "atomicMass": 12.011,
    "shells": [2, 4],
    "summary": "Carbon is the basis of all known life and forms more compounds than any other element."
  },
  {
    "atomicNumber": 11,
    "name": "Sodium",
    "symbol": "Na",
    "atomicMass": 22.990,
    "shells": [2, 8, 1],
    "summary": "Sodium is a soft, silvery-white, highly reactive metal."
  },
  {
    "atomicNumber": 118,
    "name": "Oganesson",
    "symbol": "Og",
    "atomicMass": 294.0,
    "shells": [2, 8, 18, 32, 32, 18, 8],
    "summary": "Oganesson is a synthetic element and the heaviest known element."
  }
]
```

---

## 5. Entity Relationship Summary

```text
ViewerState
├── selectedElement: Element | null
│   └── shells: number[]         → ShellGeometryParams[] (computed by renderer)
│   └── atomicNumber, atomicMass → NucleusParams (computed by renderer)
├── mode: VisualizationMode       → selects active RenderStrategy
└── animation: AnimationState     → drives accumulatedTimeMs in render loop
```

---

## 6. Validation Rules

| Field | Constraint |
|-------|-----------|
| `Element.atomicNumber` | Integer, 1–118, unique |
| `Element.shells` | Non-empty array; each value > 0; sum = total electrons = atomicNumber |
| `Element.atomicMass` | Positive float |
| `Element.symbol` | 1–3 character string |
| `AnimationState.accumulatedTimeMs` | Non-negative float; never decremented |
| `ShellGeometryParams.radius` | Positive float, strictly increases with shellIndex |
| `NucleusParams.displayCount` | Integer, 1–20 |
