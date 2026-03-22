# Contract: elements.json Schema

**File**: `assets/data/elements.json`
**Loaded by**: `ElementDataService` via Angular `HttpClient` at app startup
**Source**: Derived from Bowserinator/Periodic-Table-JSON (MIT) + Bohr shell computation
**Purpose**: Defines the exact structure of the bundled element data file. Any pre-processing
script that generates this file MUST produce output conforming to this schema.

---

## Schema (TypeScript notation)

```typescript
// Root: array of exactly 118 elements, ordered by atomicNumber ascending (1–118)
type ElementsJson = ElementRecord[];

interface ElementRecord {
  /** Integer. 1 = Hydrogen, 118 = Oganesson. Must be unique. */
  atomicNumber: number;

  /** Full element name. Non-empty string. E.g., "Carbon". */
  name: string;

  /** Chemical symbol. 1–3 uppercase-leading characters. E.g., "C", "Na", "Og". */
  symbol: string;

  /**
   * Standard atomic mass in unified atomic mass units (u).
   * Positive float. E.g., 12.011 for Carbon.
   * For synthetic elements with no stable isotopes, use the most stable isotope mass.
   * E.g., 294 for Oganesson.
   */
  atomicMass: number;

  /**
   * Simplified Bohr model electron configuration.
   * Ordered array of electron counts per shell, innermost first.
   * Each value MUST be > 0. Sum MUST equal atomicNumber.
   * Length equals number of occupied electron shells (1–7).
   *
   * Examples:
   *   Hydrogen  (1):  [1]
   *   Helium    (2):  [2]
   *   Carbon    (6):  [2, 4]
   *   Sodium    (11): [2, 8, 1]
   *   Iron      (26): [2, 8, 14, 2]
   *   Oganesson(118): [2, 8, 18, 32, 32, 18, 8]
   */
  shells: number[];

  /**
   * Optional educational summary string.
   * Plain text, 1–3 sentences. May be undefined or null for some elements.
   * The UI must handle absence gracefully (show nothing, not an error).
   */
  summary?: string | null;
}
```

---

## Validation Rules

All rules MUST be enforced by `ElementDataService` during load:

| Rule | Constraint |
|------|-----------|
| Array length | Exactly 118 records |
| `atomicNumber` | Unique integers 1–118, sorted ascending |
| `name` | Non-empty string |
| `symbol` | 1–3 character string, first character uppercase |
| `atomicMass` | Positive float |
| `shells` | Non-empty array; each element > 0; sum === atomicNumber |
| `shells` length | 1–7 (maximum 7 shells for any known element) |
| `summary` | String or absent/null — never an object or number |

---

## Example Records

```json
[
  {
    "atomicNumber": 1,
    "name": "Hydrogen",
    "symbol": "H",
    "atomicMass": 1.008,
    "shells": [1],
    "summary": "Hydrogen is the lightest and most abundant element in the universe."
  },
  {
    "atomicNumber": 2,
    "name": "Helium",
    "symbol": "He",
    "atomicMass": 4.003,
    "shells": [2],
    "summary": "Helium is a colorless, odorless, tasteless, non-toxic, inert, monatomic gas."
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
    "summary": "Sodium is a soft, silvery-white, highly reactive alkali metal."
  },
  {
    "atomicNumber": 26,
    "name": "Iron",
    "symbol": "Fe",
    "atomicMass": 55.845,
    "shells": [2, 8, 14, 2],
    "summary": "Iron is the most common element on Earth by mass and is the main constituent of Earth's inner core."
  },
  {
    "atomicNumber": 118,
    "name": "Oganesson",
    "symbol": "Og",
    "atomicMass": 294.0,
    "shells": [2, 8, 18, 32, 32, 18, 8],
    "summary": "Oganesson is a synthetic chemical element and the heaviest known element."
  }
]
```

---

## Shell Configuration Reference

Key elements for testing shell rendering (covers 1–7 shells):

| Element | Z | Shells | Shell Count |
|---------|---|--------|-------------|
| Hydrogen | 1 | [1] | 1 |
| Helium | 2 | [2] | 1 |
| Lithium | 3 | [2, 1] | 2 |
| Neon | 10 | [2, 8] | 2 |
| Sodium | 11 | [2, 8, 1] | 3 |
| Argon | 18 | [2, 8, 8] | 3 |
| Potassium | 19 | [2, 8, 8, 1] | 4 |
| Krypton | 36 | [2, 8, 18, 8] | 4 |
| Rubidium | 37 | [2, 8, 18, 8, 1] | 5 |
| Xenon | 54 | [2, 8, 18, 18, 8] | 5 |
| Caesium | 55 | [2, 8, 18, 18, 8, 1] | 6 |
| Radon | 86 | [2, 8, 18, 32, 18, 8] | 6 |
| Francium | 87 | [2, 8, 18, 32, 18, 8, 1] | 7 |
| Oganesson | 118 | [2, 8, 18, 32, 32, 18, 8] | 7 |

These elements MUST be used in shell rendering tests to verify all shell counts (1–7)
render correctly without overlap or visual artifacts.
