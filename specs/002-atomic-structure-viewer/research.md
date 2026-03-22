# Research: Atomic Structure Viewer (Phase 1 MVP)

**Branch**: `002-atomic-structure-viewer` | **Date**: 2026-03-22
**Resolves**: All NEEDS CLARIFICATION items from Technical Context

---

## R-001: Angular + Three.js Integration Strategy

**Decision**: Use an injectable `AtomRendererService` that owns the entire Three.js lifecycle.
The host Angular component (`ElementViewerComponent`) provides a canvas element reference via
a public `init(canvas: HTMLCanvasElement)` method call in `ngAfterViewInit`. The Three.js
animation loop runs inside `NgZone.runOutsideAngular()` to prevent Angular change detection
from firing at 60fps.

**Rationale**: Keeping Three.js inside a service — not a component — means the renderer
can be swapped, extended, or reused without touching Angular template code. Running outside
NgZone is the standard Angular performance pattern for continuous render loops.

**Alternatives considered**:
- Putting Three.js directly in component: rejected — couples renderer to UI, violates
  Principle VI (Separation of Concerns).
- Using a Web Worker for rendering: rejected — adds complexity beyond Phase 1 needs;
  OffscreenCanvas is not universally supported across target browsers.

---

## R-002: Dual-Mode Rendering Architecture

**Decision**: Strategy pattern. A `RenderStrategy` TypeScript interface defines three
methods: `init(element, scene, shellRadii)`, `update(accumulatedTimeMs)`, and
`dispose(scene)`. Two Phase 1 implementations: `BohrStrategy` and `QuantumStrategy`.
`AtomRendererService` holds an `activeStrategy: RenderStrategy` reference.

**Rationale**: The strategy pattern is the minimum structure needed to keep the two electron
rendering modes independently maintainable without duplicating the scene/camera/animation
infrastructure. It is naturally extensible for a third mode in Phase 2 (e.g., molecular
orbital) without any change to the service API, satisfying Principle VII (Reusability).

**Alternatives considered**:
- Single renderer with `if (mode === 'bohr') {...} else {...}` branching: rejected — the
  two modes have entirely different geometry creation and update logic; branching would
  produce an unreadable and unmaintainable function.
- Separate renderer services per mode: rejected — duplicates scene, camera, and animation
  loop management, violating Principle IV (Simplicity Over Complexity).

---

## R-003: Animation Pause/Resume Mechanism

**Decision**: A single `accumulatedTimeMs: number` variable tracks total elapsed animation
time. The render loop adds `deltaTime` to `accumulatedTimeMs` only when `!isPaused`.
Electron positions are computed as pure functions of `accumulatedTimeMs`, so pausing stops
position updates at the current value and resuming continues from the exact same value.
`OrbitControls` (camera interaction) runs every frame regardless of pause state.

**Rationale**: This satisfies FR-029 (electrons freeze at current position on pause) and
FR-030 (pause state persists across element changes — `isPaused` and `accumulatedTimeMs`
are viewer-level state, not element-level state). The accumulator also correctly handles
the mode toggle: switching from Bohr to Quantum with the same `accumulatedTimeMs` means
the quantum cloud position is temporally continuous with where the Bohr mode left off.

**Alternatives considered**:
- Storing current angle per electron: rejected — grows with element complexity; requires
  migrating angles on element change.
- Stopping/starting `requestAnimationFrame` on pause: rejected — breaks camera
  interactivity while paused.

---

## R-004: Bohr Model Orbital Parameters

**Decision**:
- **Shell radii**: `R(i) = 1.2 + (i - 1) * 1.5` Three.js units (shell 1 = 1.2, shell 7 = 10.2)
- **Angular velocity**: `ω(i) = 0.6 / i` radians/second (shell 1 fastest, shell 7 slowest)
- **Electron angle**: `θ(j) = (2π * j / n) + ω(i) * accumulatedTimeMs / 1000`
  where `j` is electron index, `n` is electrons in that shell
- **Default camera distance**: 14 Three.js units (provides full view of 7-shell elements)

**Rationale**: Uniform inter-shell spacing prevents overlap for all 118 elements. Decreasing
angular velocity with shell index subtly reflects physical reality (outer electrons orbit
slower) without requiring physics simulation. Evenly spaced starting angles (360°/n) are
visually clear and match the spec assumption.

**Animation speed judgment**: 0.6 rad/s on shell 1 produces one full orbit in ~10.5 seconds
— slow enough to observe, fast enough to clearly convey motion. This satisfies FR-027
(moderate, non-distracting speed).

---

## R-005: Quantum-Inspired Mode Approach

**Decision**: Replace each shell's discrete electron spheres with a `Three.js Points`
geometry. For a shell with `n` electrons, generate `n * 12` particles. Each particle's
initial position is computed in spherical coordinates:
- `r = R(shell) + Gaussian noise (σ = 0.4)` — creates radial spread around shell radius
- `θ, φ` sampled uniformly across the sphere surface — isotropic cloud

Each frame, particles rotate as a rigid group at `ω_group = 0.15` rad/s (slow drift) plus
a small per-particle random angular jitter (±0.002 rad/frame) to simulate electron
uncertainty. `PointsMaterial` uses a circular alpha-masked sprite, white, semi-transparent
(opacity 0.6), additive blending.

**Phase 1 animation behavior for quantum mode**: The same pause/resume mechanism applies.
The group rotation angle is driven by `accumulatedTimeMs`, and the random jitter is
regenerated each frame only when not paused.

**Future phase note**: In Phase 2, the quantum mode may use shell-specific probability
density functions. Phase 1 keeps the approach illustrative and performance-safe.

**Rationale**: `Points` is the most performant Three.js primitive for this use case — a
single draw call for all particles in a shell. The radial spread creates the "cloud" effect
clearly distinguishable from Bohr's discrete spheres. The slow group rotation keeps the
mode visually active when unpaused without becoming distracting.

**Alternatives considered**:
- Volume shader / raymarching for true probability density: rejected — beyond Phase 1 scope
  and computationally expensive; violates Principle III (Incremental Delivery).
- Instanced mesh of small spheres: rejected — more draw calls than `Points`, overkill for
  Phase 1 particle counts.

**Performance estimate**: Oganesson (heaviest element, 7 shells, 118 electrons) generates
118 × 12 = 1,416 particles total — well within Three.js `Points` performance budget for 60fps.

---

## R-006: Nucleus Rendering

**Decision**: Display up to 20 nucleon spheres (the cap). Sphere positions distributed over
a small sphere (radius 0.45 units) using the Fibonacci lattice algorithm for near-uniform
coverage. All nucleon spheres: radius 0.09 units. Two colors: proton-colored (e.g., warm
red-orange) and neutron-colored (e.g., cool grey). For elements with ≤ 20 nucleons (p + n),
show exact count. For heavier elements, show 20 spheres. An HTML overlay label "Nucleus
(simplified)" is rendered over the viewer canvas at all times.

**Nucleon counts note**: Neutron count is calculated as `round(atomicMass) - atomicNumber`
from the element data. For elements where this exceeds the cap, both protons and neutrons
are proportionally sub-sampled to the cap.

**Rationale**: The Fibonacci lattice avoids the polar clustering artifacts of uniform
latitude/longitude sampling. Two colors (proton/neutron) add one layer of scientific
correctness without requiring labels on individual nucleons. The HTML overlay is the
simplest way to display the disclaimer label without requiring Three.js text geometry or
font loading.

**Elements with ≤ 20 total nucleons**: Hydrogen (2), Helium (4), up to approximately
Neon (20). This gives roughly the first 10 elements exact nucleus representation, which
are the most commonly taught and most likely to be inspected closely.

---

## R-007: Element Data Source and Structure

**Decision**: Use **Bowserinator's `Periodic-Table-JSON`** (GitHub: Bowserinator/Periodic-
Table-JSON, MIT license) as the base dataset. Fields used: `number` (→ atomicNumber),
`name`, `symbol`, `atomic_mass` (→ atomicMass), `summary`. Add a `shells` array computed
from Bohr model shell-filling sequence (2, 8, 18, 32, 50, 72, 98 electrons max per shell).

The final `elements.json` is a pre-processed array of 118 element objects, bundled into
`assets/data/` and loaded once at app startup via Angular's `APP_INITIALIZER`.

**Bohr shell filling rule**: Fill shells sequentially. Shell 1 max: 2. Shell 2 max: 8.
Shell 3 max: 18. Shell 4 max: 32. Shell 5 max: 18 (note: Bohr model simplified, not
Aufbau). Shell 6 max: 18. Shell 7 max: 32. This produces a simplified but educationally
appropriate configuration.

**Note**: For the most chemically accurate simplified shells, use the IUPAC simplified
shell counts (e.g., Potassium: [2, 8, 8, 1]) rather than pure capacity-filling. These
are provided in the Periodic-Table-JSON dataset's `electron_configuration` field and can
be parsed automatically during the pre-processing step.

**Rationale**: MIT-licensed, complete, widely-used dataset. Pre-processing at build time
(not at runtime) means zero parsing overhead in the browser.

---

## R-008: Testing Strategy

**Decision**: Jasmine + Karma (Angular's default testing stack). Test focus:
1. `ElementDataService`: unit tests for JSON loading, caching, error handling
2. `ViewerStateService`: unit tests for state transitions (element selection, mode toggle,
   pause/resume)
3. `PeriodicTableComponent`: verify all 118 elements render cells; verify click emits event
4. `ElementDetailComponent`: verify correct data binds for a given element state
5. Three.js rendering code (`AtomRendererService`, strategies): integration-style tests
   using a real canvas; verify scene object counts match expected shell/electron counts

**Not tested separately**: Visual appearance (no snapshot/visual regression testing in
Phase 1); Three.js internal rendering pipeline.

**Rationale**: Jasmine + Karma require zero additional configuration in an Angular project.
The service-focused test strategy covers all user-facing acceptance scenarios without
requiring complex visual testing infrastructure.

---

## R-009: Shell Ring Visual Design

**Decision**: Each shell is a `Three.js TorusGeometry` with:
- Outer radius: `R(i)` (same as electron orbit radius)
- Tube radius: 0.025 units (thin ring)
- Tilt: `rotation.x = Math.PI / 3 + (i * Math.PI / 20)` — slight progressive tilt per shell
- Color: Fixed palette of 7 colors (one per max shell), semi-transparent (opacity 0.4)

**Rationale**: Progressive tilt makes shells visually distinct and avoids the flat 2D look
of all rings being coplanar. Semi-transparency allows electrons and inner shells to remain
visible through outer shells.

---

## Summary of All Resolved Decisions

| ID | Topic | Decision |
|----|-------|----------|
| R-001 | Angular + Three.js integration | Injectable service, canvas ref passed in, loop outside NgZone |
| R-002 | Dual rendering modes | Strategy pattern: `RenderStrategy` interface + Bohr/Quantum implementations |
| R-003 | Animation pause/resume | `accumulatedTimeMs` accumulator; not incremented when paused |
| R-004 | Bohr orbital parameters | R(i) = 1.2 + (i-1)×1.5; ω(i) = 0.6/i rad/s; θ = 2πj/n + ω×t |
| R-005 | Quantum-inspired mode | Three.js Points, n×12 particles, Gaussian radial spread, group rotation |
| R-006 | Nucleus rendering | Cap 20 spheres, Fibonacci lattice, HTML overlay disclaimer |
| R-007 | Element data | Bowserinator Periodic-Table-JSON (MIT), pre-processed, bundled as JSON |
| R-008 | Testing | Jasmine + Karma, service unit tests + component integration tests |
| R-009 | Shell ring design | TorusGeometry, progressive tilt, semi-transparent, per-shell color |
