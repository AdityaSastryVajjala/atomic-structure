# Implementation Plan: Atomic Structure Viewer (Phase 1 MVP)

**Branch**: `002-atomic-structure-viewer` | **Date**: 2026-03-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-atomic-structure-viewer/spec.md`

## Summary

Build a static Angular + Three.js single-page application that lets users browse all 118
chemical elements via a periodic table grid and view each element's atomic structure in 3D.
The viewer uses a Bohr model as the default, with an optional toggle to a quantum-inspired
cloud representation. Electrons animate in circular orbits and can be paused. All element
data is bundled in a static JSON asset; no backend is required.

## Technical Context

**Language/Version**: TypeScript 5.x (via Angular 19, standalone component architecture)
**Primary Dependencies**: Angular 19, Three.js (latest stable, 0.170+), RxJS 7.x (bundled)
**Storage**: `assets/data/elements.json` — static bundled file, no database
**Testing**: Jasmine + Karma (Angular default, zero additional tooling needed)
**Target Platform**: Modern desktop browsers — Chrome, Firefox, Edge, Safari (latest stable)
**Project Type**: Static single-page web application (SPA), deployable to any static host
**Performance Goals**: 60 fps during 3D rendering and animation; < 1 second element switch
**Constraints**: No backend, no network calls at runtime; fully offline-capable from static host
**Scale/Scope**: 118 elements, 4 user stories, one Angular SPA project

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Verification | Status |
|-----------|-------------|--------|
| I. User Experience First | Periodic table, viewer, detail panel, pause/resume, and mode toggle each directly serve user comprehension; no feature added for aesthetics alone | ✅ PASS |
| II. Scientific Correctness | Element data from established open-source dataset (Bowserinator Periodic-Table-JSON, MIT); nucleus labeled "simplified"; quantum mode labeled "illustrative" per FR-005, FR-019 | ✅ PASS |
| III. Incremental Delivery | Out of scope explicitly excludes Phase 2+ (bonding, reactions, exact orbital physics); quantum-inspired mode is Phase 1 illustrative only; architecture extensions for Phase 2 are zero-cost interface additions | ✅ PASS |
| IV. Simplicity Over Complexity | Angular + Three.js only; no backend, ORM, or extra frameworks; strategy pattern is justified by the dual-mode requirement — it is the simplest mechanism that keeps both modes independently maintainable | ✅ PASS |
| V. Performance Matters | 60 fps target enforced; animation loop runs outside Angular's NgZone; nucleus capped at 20 spheres; particle count in quantum mode is bounded per element | ✅ PASS |
| VI. Separation of Concerns | `renderer/` is a pure TypeScript/Three.js layer with no Angular imports; `services/` handles state; `components/` handles UI; element data lives in `models/` and `assets/` | ✅ PASS |
| VII. Reusability | `AtomRendererService` accepts `Element` as input data; `RenderStrategy` interface is designed to support future bond and molecule renderers without changing the service API | ✅ PASS |
| VIII. Explain Before Impress | Nucleus tooltip required (FR-005); quantum mode disclaimer required (FR-019); detail panel always alongside viewer; pause control enables static inspection per US3 | ✅ PASS |
| IX. Documentation Required | Data model, contracts, and module header comments are required deliverables before implementation; this plan is that documentation | ✅ PASS |

**All 9 gates pass. No complexity violations.**

## Project Structure

### Documentation (this feature)

```text
specs/002-atomic-structure-viewer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── element-data-service.md      # ElementDataService TypeScript interface
│   ├── atom-renderer-service.md     # AtomRendererService TypeScript interface
│   ├── viewer-state-service.md      # ViewerStateService TypeScript interface
│   ├── render-strategy.md           # RenderStrategy interface (strategy pattern)
│   ├── component-contracts.md       # Component @Input/@Output contracts
│   └── elements-json-schema.md      # JSON schema for assets/data/elements.json
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by this command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── app.component.ts               # Root shell: periodic table + viewer layout
│   ├── app.component.html
│   ├── app.config.ts                  # Angular standalone bootstrap config
│   │
│   ├── components/
│   │   ├── periodic-table/
│   │   │   ├── periodic-table.component.ts   # Full 118-element grid
│   │   │   └── element-cell/
│   │   │       └── element-cell.component.ts # Single clickable cell
│   │   ├── element-viewer/
│   │   │   └── element-viewer.component.ts   # Hosts Three.js canvas
│   │   ├── element-detail/
│   │   │   └── element-detail.component.ts   # Name, symbol, atomic#, mass, config
│   │   └── viewer-controls/
│   │       └── viewer-controls.component.ts  # Pause/resume, reset, mode toggle
│   │
│   ├── renderer/                      # Pure TypeScript/Three.js — no Angular imports
│   │   ├── atom-renderer.service.ts   # Scene lifecycle, render loop, camera controls
│   │   ├── nucleus-renderer.ts        # Capped cluster of nucleon spheres
│   │   ├── shell-renderer.ts          # Concentric torus ring geometry per shell
│   │   └── strategies/
│   │       ├── render-strategy.interface.ts  # Common interface for both modes
│   │       ├── bohr-strategy.ts              # Discrete electron spheres, circular orbits
│   │       └── quantum-strategy.ts           # Particle cloud per shell
│   │
│   ├── services/
│   │   ├── element-data.service.ts    # Loads + caches elements.json via HttpClient
│   │   └── viewer-state.service.ts    # Observable state: selected element, mode, animation
│   │
│   └── models/
│       ├── element.model.ts           # Element, ElectronShell TypeScript types
│       └── viewer-state.model.ts      # VisualizationMode, AnimationState, ViewerState
│
└── assets/
    └── data/
        └── elements.json              # All 118 elements — bundled static data
```

**Structure Decision**: Single Angular project at the repository root. The `renderer/`
directory is a pure TypeScript layer with no Angular-specific imports — it manages Three.js
scenes and strategies directly. This fulfills Principle VI (Separation of Concerns) and
Principle VII (Reusability): the renderer can be extracted and reused in molecule/bonding
phases without touching any Angular component code. Services bridge Angular state to the
Three.js layer via method calls and RxJS subscriptions.

## Architectural Decisions

### AD-001: Three.js + Angular Integration
**Decision**: `AtomRendererService` is an injectable Angular service that accepts a canvas
element from `ElementViewerComponent` on initialization. All Three.js work — scene creation,
animation loop, camera controls — lives inside this service. The animation loop runs via
`ngZone.runOutsideAngular()` to prevent Angular's change detection from firing at 60fps.
State changes flow from Angular → renderer via direct service method calls.

**Rationale**: Prevents performance degradation from Angular CD at render frequency.
Keeps Three.js entirely out of component code.

### AD-002: Dual-Mode Rendering via Strategy Pattern
**Decision**: A `RenderStrategy` interface defines `init(element, scene)`, `update(time)`,
and `dispose(scene)`. Two implementations: `BohrStrategy` and `QuantumStrategy`.
`AtomRendererService` holds the active strategy. Mode switches call `dispose()` on the old
strategy, construct the new one, and call `init()`.

**Rationale**: Cleanest separation of the two electron rendering modes. Easily extended for
a third mode in a later phase without modifying the service. Satisfies Principle IV
(Simplicity) and Principle VII (Reusability).

### AD-003: Animation Pause via Time Accumulator
**Decision**: A `accumulatedTime` variable tracks total elapsed animation time. The animation
loop increments it only when `!isPaused`. Electron positions are computed from `accumulatedTime`,
so pausing freezes electrons at their exact current positions. Resuming continues from that
exact time, not from zero. Camera interaction (OrbitControls) remains active regardless of
pause state.

**Rationale**: Satisfies FR-029 and FR-030 (freeze at position, persist pause state on
element change). Simpler than storing individual electron angles.

### AD-004: Bohr Electron Positioning
**Decision**: Each shell `i` has radius `R(i) = 1.2 + (i - 1) * 1.5` Three.js units.
Shell `i` has angular velocity `ω(i) = 0.5 / i` radians/second (outer shells orbit slower,
loosely mimicking physics). Electron `j` on shell `i` with `n` electrons has angle
`θ(j, t) = (2π * j / n) + ω(i) * accumulatedTime`. All computation is in the strategy's
`update(time)` method.

**Rationale**: Even spacing, consistent motion per shell, visually intuitive, numerically
simple. The slowing outer shells add subtle realism without complexity.

### AD-005: Quantum-Inspired Mode via Particle Cloud
**Decision**: Each shell's electrons are replaced by a `Three.js Points` object (particle
cloud). For shell with `n` electrons, generate `n * 12` particles. Particle positions are
computed using spherical coordinates: `r = R(shell) + Gaussian jitter (σ = 0.4)`, `θ` and
`φ` uniform random. Particles rotate slowly as a group (`ω = 0.15` rad/s) plus a small
per-particle random drift each frame. The `PointsMaterial` uses a semi-transparent circle
sprite for a soft appearance.

**Rationale**: Visually distinct from Bohr mode, clearly cloud-like, computationally cheap
(BufferGeometry + PointsMaterial renders thousands of points efficiently), and pausable with
the same accumulator mechanism. Appropriate for Phase 1 illustrative purposes.

### AD-006: Nucleus Rendering
**Decision**: Up to 20 nucleon spheres displayed regardless of actual nucleon count. Sphere
positions are distributed across a small sphere (radius 0.4) using the Fibonacci lattice
method for uniform coverage. All nucleon spheres use the same size (radius 0.08). A
persistent HTML overlay label on the viewer canvas reads "Nucleus (simplified)".

**Rationale**: Satisfies FR-005 and Principle II (Scientific Correctness via honest
labeling). Cap at 20 keeps performance consistent across all 118 elements. Fibonacci lattice
avoids clustering artifacts.

### AD-007: Element Data Source
**Decision**: Use Bowserinator's `Periodic-Table-JSON` (GitHub, MIT license) as the base
dataset. Augment with `shells` array computed from Bohr model shell-filling sequence (2, 8,
18, 32, 50, 72, 98 max per shell). Bundle as `assets/data/elements.json` loaded once via
Angular's `HttpClient` with `APP_INITIALIZER` and cached in `ElementDataService`.

**Rationale**: Complete, well-maintained 118-element dataset. MIT licensed. Bundling avoids
any runtime network dependency, satisfying FR-002 and SC-006.

### AD-008: Shell Ring Geometry
**Decision**: Each shell is a `Three.js TorusGeometry` with tube radius 0.03. Shells are
slightly tilted per shell index (`rotation.x = π/4 + (i * π/16)`) to create visual depth
when viewed at the default camera angle. Color-coded by shell index using a fixed palette.

**Rationale**: `TorusGeometry` is lightweight and clearly ring-shaped. Tilt variation makes
it easy to distinguish shells at a glance, supporting Principle VIII (Explain Before Impress).
