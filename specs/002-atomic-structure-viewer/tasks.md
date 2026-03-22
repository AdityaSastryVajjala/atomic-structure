# Tasks: Atomic Structure Viewer (Phase 1 MVP)

**Branch**: `002-atomic-structure-viewer` | **Date**: 2026-03-22
**Input**: plan.md, spec.md, data-model.md, research.md, contracts/

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel — operates on different files, no shared dependency
- **[US1–US4]**: Maps task to the user story it delivers
- **deps**: Tasks that must complete before this one starts
- Foundational tasks (no story tag) block all user stories

## Path Conventions

All source paths are relative to repository root:
- Angular source: `src/app/`
- Models: `src/app/models/`
- Services: `src/app/services/`
- Renderer: `src/app/renderer/`
- Components: `src/app/components/`
- Static data: `src/assets/data/`
- Scripts: `scripts/`
- Tests: co-located `.spec.ts` files alongside source

---

## Phase 1: Project Setup

**Purpose**: Bootstrap the Angular 19 project, install all dependencies, and create the
directory skeleton. Everything in Phase 2+ depends on this phase being complete.

- [x] T001 Initialize Angular 19 project with standalone component architecture
      `ng new atomic-structure --standalone --routing=false --style=css`
      Verify: `ng serve` starts with no errors; default page loads in browser.

- [x] T002 [P] Install Three.js and its TypeScript type definitions
      `npm install three @types/three`
      deps: T001
      Verify: `import * as THREE from 'three'` compiles without errors in a scratch file.

- [x] T003 [P] Configure `angular.json` to bundle `src/assets/data/` as a static asset
      Ensure `assets/data/elements.json` will be served at `/assets/data/elements.json`.
      deps: T001
      Verify: Place a test JSON file there; `ng serve` makes it accessible at the path.

- [x] T004 [P] Verify Jasmine + Karma test baseline
      Run `ng test` on the freshly initialized project; confirm all default tests pass
      and the browser test runner opens without errors.
      deps: T001

- [x] T005 [P] Create the full source directory structure per plan.md
      Create (empty, with `.gitkeep`):
      `src/app/models/`
      `src/app/services/`
      `src/app/renderer/`
      `src/app/renderer/strategies/`
      `src/app/components/periodic-table/element-cell/`
      `src/app/components/element-viewer/`
      `src/app/components/element-detail/`
      `src/app/components/viewer-controls/`
      `src/assets/data/`
      `scripts/`
      deps: T001

- [x] T006 [P] Configure Angular production build for static deployment
      Verify `ng build --configuration production` completes and outputs to
      `dist/atomic-structure/browser/` with no server-side rendering or SSR config.
      deps: T001

**Checkpoint**: All deps installed; project compiles and tests run; directory skeleton in place.

---

## Phase 2: Element Data Pipeline

**Purpose**: Build the data layer — element models, the pre-processing script that generates
`elements.json`, and the Angular service that loads and serves it. Every other phase depends
on this data being available.

- [x] T007 Write `scripts/build-elements-json.js` — the pre-processing script
      Downloads (or reads bundled) source data from Bowserinator/Periodic-Table-JSON.
      Transforms each of the 118 records into the `ElementRecord` format from
      `contracts/elements-json-schema.md`:
        `{ atomicNumber, name, symbol, atomicMass, shells[], summary? }`
      Computes `shells[]` from the simplified Bohr shell-filling sequence (see research.md R-007).
      Validates all records against the schema constraints before writing.
      Outputs to `src/assets/data/elements.json`.
      deps: T003, T005
      Verify: Running `node scripts/build-elements-json.js` produces a valid 118-element JSON file.

- [x] T008 Run build-elements-json.js and validate output
      Execute the script; manually spot-check 5 elements (H, C, Na, Fe, Og) against
      the expected shells in `contracts/elements-json-schema.md` Shell Configuration Reference.
      Verify sum of each element's `shells[]` equals its `atomicNumber`.
      deps: T007

- [x] T009 [P] Create `src/app/models/element.model.ts`
      Implements the `Element` and `ElectronShell` TypeScript interfaces from data-model.md §1.
      Includes `getElectronShells(element)` and `getConfigurationString(element)` helpers.
      Adds JSDoc header comment per Principle IX.
      deps: T005

- [x] T010 [P] Create `src/app/models/viewer-state.model.ts`
      Implements `VisualizationMode`, `AnimationState`, `ViewerState`, and
      `INITIAL_VIEWER_STATE` from data-model.md §2.
      Adds JSDoc header comment.
      deps: T005

- [x] T011 [P] Create `src/app/models/renderer-types.ts`
      Implements `ShellGeometryParams` and `NucleusParams` internal renderer types
      from data-model.md §3.
      Adds JSDoc header comment noting these are renderer-internal types only.
      deps: T005, T009

- [x] T012 [P] Write unit tests for `element.model.ts` helper functions
      Test `getElectronShells`: verify index assignment, electron count, array length.
      Test `getConfigurationString`: verify "2, 8, 1" for Sodium, "2, 4" for Carbon.
      deps: T009

- [x] T013 Implement `ElementDataService`
      File: `src/app/services/element-data.service.ts`
      Implements the full public contract from `contracts/element-data-service.md`:
        - `load(): Promise<void>` — fetches `assets/data/elements.json` via `HttpClient`,
          validates all records, populates internal cache
        - `getAllElements(): readonly Element[]`
        - `getElementById(n): Element | undefined`
        - `elements$: Observable<readonly Element[]>`
        - `isLoaded: boolean` and `loadError: string | null`
      On load failure: sets `loadError`, sets `isLoaded = false`, resolves (does NOT throw).
      Adds JSDoc header comment.
      deps: T003, T008, T009

- [x] T014 Write unit tests for `ElementDataService`
      Test: successful load populates cache, `isLoaded = true`, `loadError = null`.
      Test: HTTP 404 sets `loadError`, `isLoaded = false`.
      Test: malformed JSON sets `loadError`, `isLoaded = false`.
      Test: `getAllElements()` returns 118 elements in atomic number order.
      Test: `getElementById(6)` returns Carbon; `getElementById(999)` returns undefined.
      deps: T013

- [x] T015 Register `ElementDataService` as `APP_INITIALIZER` in `app.config.ts`
      Ensures elements are loaded before any component renders.
      Wire: `{ provide: APP_INITIALIZER, useFactory: (svc) => () => svc.load(), deps: [ElementDataService], multi: true }`
      Also provide `provideHttpClient()`.
      deps: T013

**Checkpoint**: `ng serve` loads; `elements.json` is accessible; `ElementDataService.getAllElements()`
returns all 118 elements before any component mounts.

---

## Phase 3: Shared State Management

**Purpose**: Implement the single source of truth for all viewer state. Blocks all rendering
and UI integration work.

- [x] T016 Implement `ViewerStateService`
      File: `src/app/services/viewer-state.service.ts`
      Implements the full contract from `contracts/viewer-state-service.md`:
        Observables: `selectedElement$`, `mode$`, `animationState$`, `isPaused$`
        Mutations: `selectElement()`, `clearSelection()`, `setMode()`,
                   `pause()`, `resume()`, `togglePlayPause()`, `tickAnimation(deltaMs)`
        Snapshots: `getAnimationState()`, `getMode()`
      Uses `BehaviorSubject` for all state. `tickAnimation()` only increments
      `accumulatedTimeMs` when `!isPaused`. Mutation methods run inside `NgZone.run()`
      so `isPaused$` emits inside Angular's zone.
      Initial state from `INITIAL_VIEWER_STATE`: null element, 'bohr' mode, unpaused.
      Adds JSDoc header comment.
      deps: T010, T015

- [x] T017 Write unit tests for `ViewerStateService`
      Tests MUST cover every row in the State Transition Rules table from
      `contracts/viewer-state-service.md`:
      - `selectElement(e)`: element changes; mode, isPaused, accumulatedTimeMs unchanged
      - `setMode('quantum')`: mode changes; all else unchanged
      - `pause()`: isPaused → true; accumulatedTimeMs unchanged
      - `resume()`: isPaused → false
      - `togglePlayPause()`: alternates isPaused state
      - `tickAnimation(16)` when playing: accumulatedTimeMs += 16
      - `tickAnimation(16)` when paused: accumulatedTimeMs unchanged
      - `clearSelection()`: selectedElement → null
      deps: T016

**Checkpoint**: All state transitions verified. `ViewerStateService` is ready to be
consumed by renderer and components.

---

## Phase 4: Rendering Engine Core

**Purpose**: Build the complete Three.js rendering infrastructure — scene, camera, animation
loop, nucleus, shell rings, and the strategy interface. This entire phase must complete before
User Story 1 can render anything.

- [x] T018 Create `render-strategy.interface.ts`
      File: `src/app/renderer/strategies/render-strategy.interface.ts`
      Implements the `RenderStrategy` interface exactly as defined in
      `contracts/render-strategy.md`:
        `init(element, scene, shellParams): void`
        `update(accumulatedTimeMs: number): void`
        `dispose(scene): void`
      Adds JSDoc header comment documenting what implementations MUST and MUST NOT do.
      deps: T009, T011

- [x] T019 [P] Implement shell geometry computation function
      File: `src/app/renderer/renderer-utils.ts` (shared utility, also contains T020).
      Input: `Element`. Output: `ShellGeometryParams[]` (one per shell).
      For each shell index `i` (1-based):
        `radius = 1.2 + (i - 1) * 1.5`
        `angularVelocity = 0.6 / i`
        `ringTilt = Math.PI / 3 + (i * Math.PI / 20)`
        `color` from fixed 7-color palette (index i-1 mod 7)
      Adds JSDoc comment with formula references to research.md R-004, R-009.
      deps: T009, T011

- [x] T020 [P] Implement nucleus params computation function
      File: `src/app/renderer/renderer-utils.ts` (same file as T019).
      Input: `Element`. Output: `NucleusParams`.
      `protonCount = element.atomicNumber`
      `neutronCount = Math.round(element.atomicMass) - element.atomicNumber`
      `displayCount = Math.min(protonCount + neutronCount, 20)` (cap per AD-006)
      Adds JSDoc comment referencing research.md R-006.
      deps: T009, T011

- [x] T021 Implement `AtomRendererService` core scaffold
      File: `src/app/renderer/atom-renderer.service.ts`
      Creates the skeleton:
        - `init(canvas: HTMLCanvasElement): void` — creates `WebGLRenderer`,
          `PerspectiveCamera` (FOV 45°, near 0.1, far 100, position (0,2,14)),
          `AmbientLight` and `PointLight`, `THREE.Scene`, `OrbitControls`.
        - `dispose(): void` — disposes renderer, cancels animation frame.
        - `isWebGLSupported(): boolean` — checks for WebGL context availability.
      Module is pure TypeScript + Three.js; ZERO Angular component imports.
      Adds JSDoc header comment describing purpose, inputs, outputs.
      deps: T002, T018

- [x] T022 Add `OrbitControls` and zoom limits to `AtomRendererService`
      Wire `OrbitControls` to the camera and renderer DOM element.
      Set `controls.minDistance = 3`, `controls.maxDistance = 25`.
      Call `controls.update()` in the render loop each frame.
      deps: T021

- [x] T023 Implement the animation loop in `AtomRendererService`
      The loop: `requestAnimationFrame(loop)` scheduled inside
      `ngZone.runOutsideAngular(() => { ... })` so Angular CD is not triggered at 60fps.
      Per frame:
        1. Compute `deltaMs` using `THREE.Clock`.
        2. Call `viewerState.tickAnimation(deltaMs)` (advances time accumulator).
        3. Call `activeStrategy?.update(viewerState.getAnimationState().accumulatedTimeMs)`.
        4. Call `orbitControls.update()`.
        5. Call `renderer.render(scene, camera)`.
      Injects `NgZone` and `ViewerStateService`.
      deps: T021, T016

- [x] T024 Implement `NucleusRenderer`
      File: `src/app/renderer/nucleus-renderer.ts`
      Input: `NucleusParams`, `THREE.Scene`.
      Algorithm (per AD-006, research.md R-006):
        Uses Fibonacci lattice to distribute `displayCount` sphere positions on a sphere
        of radius 0.45 Three.js units.
        `displayCount` proton/neutron sphere split: proportional to actual proton/neutron
        ratio, both clamped to the cap total.
        Proton spheres: warm orange color; neutron spheres: cool grey color.
        All nucleon sphere radius: 0.09 units.
      Exposes `render(params, scene)` and `dispose(scene)`.
      Adds JSDoc header comment.
      deps: T011, T021

- [x] T025 [P] Implement `ShellRenderer`
      File: `src/app/renderer/shell-renderer.ts`
      Input: `ShellGeometryParams[]`, `THREE.Scene`.
      For each shell:
        Creates `THREE.TorusGeometry(radius, tubeRadius=0.025, 64, 16)`.
        Applies `MeshBasicMaterial` with `shell.color`, `transparent: true`, `opacity: 0.45`.
        Sets `mesh.rotation.x = shell.ringTilt`.
      Exposes `renderAll(params, scene)` and `dispose(scene)`.
      Adds JSDoc header comment.
      deps: T011, T021

- [x] T026 Subscribe to `ViewerStateService` in `AtomRendererService`
      Inject `ViewerStateService`. Subscribe to `selectedElement$` and `mode$`.
      On `selectedElement$` emit (element change sequence per AD-002):
        1. `activeStrategy?.dispose(scene)`
        2. Dispose nucleus and shell renderers (scene down to lights only)
        3. `nucleusRenderer.render(computeNucleusParams(element), scene)`
        4. `shellParams = computeShellGeometry(element)`
        5. `shellRenderer.renderAll(shellParams, scene)`
        6. `activeStrategy = buildStrategy(currentMode)`
        7. `activeStrategy.init(element, scene, shellParams)`
        8. `resetCamera()`
      On `mode$` emit (mode switch sequence per AD-002):
        1. `activeStrategy?.dispose(scene)` (removes electrons only)
        2. Construct new strategy for new mode
        3. `activeStrategy.init(currentElement, scene, shellParams)`
        (nucleus + shells NOT touched; camera NOT reset; accumulatedTimeMs NOT reset)
      deps: T016, T023, T024, T025

- [x] T027 Implement `resetCamera()` in `AtomRendererService`
      Resets camera position to (0, 2, 14) and `orbitControls.target` to (0, 0, 0).
      Calls `orbitControls.update()`.
      deps: T022

**Checkpoint**: Renderer core is complete. Scene setup, loop, nucleus, shells, and state
subscriptions all work. BohrStrategy and QuantumStrategy are not yet implemented — that
comes in US1 and US4 phases.

---

## Phase 5: User Story 1 — Element Selection & Bohr Visualization (Priority: P1) 🎯 MVP

**Goal**: User can click any element in the periodic table and see its 3D atomic structure
rendered in the viewer panel using the Bohr model. No detail panel yet. No controls yet.

**Independent Test**: Open app, click Carbon → viewer shows 2 rings and 6 electron spheres.
Open DevTools Network tab → zero external requests.

- [x] T028 Implement `BohrStrategy.init()`
      File: `src/app/renderer/strategies/bohr-strategy.ts`
      For each shell in `shellParams`:
        Compute even starting angles: `θ_start(j) = (2π * j) / n` for electron `j` of `n`.
        Create one `THREE.Mesh(SphereGeometry(0.12, 16, 16), MeshPhongMaterial({ color }))` per electron.
        Group all electron meshes for this shell in a `THREE.Group`.
        Add each group to `scene`.
      Stores shell groups for use in `update()` and `dispose()`.
      deps: T018, T019, T021

- [x] T029 Implement `BohrStrategy.update()`
      Per frame (called with `accumulatedTimeMs`):
      For each shell `i` and electron `j`:
        `θ = (2π * j / n) + (ω_i * accumulatedTimeMs / 1000)`
        `mesh.position.x = radius * Math.cos(θ)`
        `mesh.position.z = radius * Math.sin(θ)`
        `mesh.position.y = 0` (electrons orbit in the shell's equatorial plane)
      When `accumulatedTimeMs` is frozen (paused), positions are also frozen — no extra
      pause logic needed here.
      deps: T028

- [x] T030 Implement `BohrStrategy.dispose()`
      For each stored shell group:
        Remove from scene.
        Dispose all child mesh geometries and materials.
      Clears internal references.
      deps: T028

- [x] T031 Wire `BohrStrategy` as the default strategy in `AtomRendererService`
      In the `selectedElement$` subscription (T026), construct `new BohrStrategy()` when
      mode is 'bohr' (which is the initial default). Already wired via buildStrategy() in T026.
      deps: T026, T028, T029, T030

- [x] T032 [P] Implement `ElementCellComponent`
      File: `src/app/components/periodic-table/element-cell/element-cell.component.ts`
      Standalone component. `@Input({ required: true }) element: Element`.
      `@Input() isSelected = false`. `@Output() selected = new EventEmitter<Element>()`.
      Template: displays `element.symbol` and `element.atomicNumber`.
      Applies a CSS class for selected state.
      No service dependencies — purely presentational.
      Adds JSDoc header comment.
      deps: T009

- [x] T033 Implement `PeriodicTableComponent`
      File: `src/app/components/periodic-table/periodic-table.component.ts`
      Standalone component. Injects `ElementDataService` and `ViewerStateService`.
      Renders all 118 elements in the standard periodic table grid layout using CSS Grid.
      Each cell is an `ElementCellComponent` with `isSelected` bound to
      `selectedElement$.atomicNumber === element.atomicNumber`.
      On cell `selected` event: emits `@Output() elementSelected = new EventEmitter<Element>()`.
      Adds JSDoc header comment.
      deps: T014, T016, T032

- [x] T034 Implement `ElementViewerComponent` — canvas host
      File: `src/app/components/element-viewer/element-viewer.component.ts`
      Standalone component. `@ViewChild('viewerCanvas') canvasRef!: ElementRef<HTMLCanvasElement>`.
      `ngAfterViewInit`: calls `atomRenderer.isWebGLSupported()`. If true: calls
      `atomRenderer.init(canvasRef.nativeElement)`. If false: sets error state.
      `ngOnDestroy`: calls `atomRenderer.dispose()`.
      Template: `<canvas #viewerCanvas>` + WebGL error overlay + nucleus label when element selected.
      Injects `AtomRendererService` and `ViewerStateService`.
      Adds JSDoc header comment.
      deps: T021, T022, T023

- [x] T035 Implement `AppComponent` layout shell
      File: `src/app/app.component.ts`
      Standalone root component. Two-column layout: periodic table left, viewer panel right.
      Includes `PeriodicTableComponent` and `ElementViewerComponent`.
      On `(elementSelected)` from `PeriodicTableComponent`: calls
      `viewerStateService.selectElement(element)`.
      Injects `ViewerStateService`.
      deps: T033, T034

- [ ] T036 End-to-end verification for User Story 1
      Manual test:
        1. `ng serve` → open `http://localhost:4200`
        2. Verify all 118 element cells are visible and labelled.
        3. Click **Carbon (C, 6)** → viewer shows 2 rings and 6 animated electron spheres.
        4. Click **Oganesson (Og, 118)** → viewer shows 7 rings and 118 electron spheres.
        5. Click **Hydrogen (H, 1)** → viewer shows 1 ring and 1 electron sphere.
        6. DevTools → Network → zero requests after initial page load.
        7. Click rapidly between 5 elements → no corrupted or blended renders.
      deps: T031, T035

- [x] T037 [P] Write unit tests for `PeriodicTableComponent`
      Test: renders exactly 118 `ElementCellComponent` instances.
      Test: `elementSelected` emits the correct element when a cell fires `selected`.
      Test: the currently selected element's cell has `isSelected = true`; all others false.
      deps: T033

- [x] T038 [P] Write unit tests for `BohrStrategy` (scene object count verification)
      Test: after `init(carbon, scene, shellParams)`, scene contains 6 electron mesh objects
      across 2 shell groups.
      Test: after `dispose(scene)`, all objects are removed from scene.
      Test: `update(1000)` and `update(2000)` produce different electron positions
      (animation advances).
      Test: `update(t)` called twice with same `t` produces identical positions (idempotent).
      deps: T028, T029, T030

**Checkpoint**: User Story 1 is fully functional and independently testable. The application
delivers core educational value: browse 118 elements, see each element's Bohr structure.

---

## Phase 6: User Story 2 — Element Details Panel (Priority: P2)

**Goal**: After selecting an element, the user sees a detail panel with name, symbol,
atomic number, atomic mass, and simplified electron configuration.

**Independent Test**: Select Sodium → detail panel shows "Sodium | Na | 11 | 22.990 u | 2, 8, 1".
Switch to Carbon → panel updates to "Carbon | C | 6 | 12.011 u | 2, 4". No delay.

- [x] T039 Implement `ElementDetailComponent`
      File: `src/app/components/element-detail/element-detail.component.ts`
      Standalone component. Injects `ViewerStateService`.
      Subscribes to `selectedElement$` and renders:
        Name, Symbol, Atomic Number, Atomic Mass (formatted as `12.011 u`),
        Electron Configuration (via `getConfigurationString(element)`).
      Shows an empty/placeholder state when `selectedElement === null`.
      Does NOT yet show quantum disclaimer (added in T067).
      Adds JSDoc header comment.
      deps: T009, T016

- [x] T040 Add `ElementDetailComponent` to `AppComponent` layout
      Include in the viewer panel column below `ElementViewerComponent`.
      deps: T035, T039

- [x] T041 [P] Write unit tests for `ElementDetailComponent`
      Test: with null selection, panel shows placeholder (no element data visible).
      Test: with Carbon selected, all five fields show correct values.
      Test: switching from Carbon to Sodium updates all five fields correctly.
      Test: electron configuration string for Oganesson is "2, 8, 18, 32, 32, 18, 8".
      deps: T039

**Checkpoint**: User Stories 1 and 2 are both functional. The app delivers the full
educational loop: visual structure + labelled data side by side.

---

## Phase 7: User Story 3 — Viewer Interaction (Priority: P3)

**Goal**: Rotate, zoom, reset camera, and pause/resume electron animation.

**Independent Test**: Load any element. Drag → atom rotates. Scroll → zoom in/out.
Click Reset → camera returns to default. Click Pause → electrons freeze. Click Resume →
electrons continue from exact position. Switching element while paused keeps paused state.

- [x] T042 Implement `ViewerControlsComponent` — pause/resume button
      File: `src/app/components/viewer-controls/viewer-controls.component.ts`
      Standalone component. Injects `ViewerStateService`.
      Subscribes to `isPaused$` to update button label/icon (▶ / ⏸).
      On click: calls `viewerStateService.togglePlayPause()`.
      deps: T016

- [x] T043 Implement `ViewerControlsComponent` — reset camera button
      Add reset button to the same component (T042).
      On click: calls `atomRendererService.resetCamera()`.
      Injects `AtomRendererService`.
      deps: T027, T042

- [x] T044 Add `ViewerControlsComponent` to `AppComponent` layout
      Include in the viewer panel column between `ElementViewerComponent` and
      `ElementDetailComponent`.
      deps: T035, T043

- [ ] T045 Verify pause/resume correctness end-to-end
      Manual test:
        1. Select Carbon. Observe electrons orbiting.
        2. Click **Pause** → electrons stop mid-orbit; button shows ▶.
        3. Note approximate positions of electrons.
        4. Click **Resume** → electrons continue from those exact positions; button shows ⏸.
        5. Click **Pause** again. Select **Sodium**. Verify sodium loads in paused state
           (electrons of sodium are static from the start).
        6. Click **Resume** → sodium electrons begin animating.
      deps: T016, T023, T043, T044

- [x] T046 [P] Write unit tests for pause/resume state in `ViewerStateService`
      Already covered in T017. Verify these test cases exist and pass:
        - `tickAnimation` does NOT advance `accumulatedTimeMs` when paused.
        - `selectElement` while paused: `isPaused` stays true.
        - `togglePlayPause` alternates correctly from any starting state.
      deps: T017

**Checkpoint**: User Stories 1, 2, and 3 are all functional. Rotation, zoom, reset, and
pause/resume all work correctly and independently.

---

## Phase 8: User Story 4 — Visualization Mode Toggle (Priority: P4)

**Goal**: User can toggle between Bohr model (discrete orbiting electrons) and
quantum-inspired mode (diffuse particle cloud). Mode switch preserves camera, animation
state, and detail panel. Nucleus and shells remain unchanged.

**Independent Test**: Select any element in Bohr mode. Toggle to quantum mode → electrons
change to cloud. Toggle back → discrete spheres return. Repeat for 3 different elements.
Camera and isPaused state unchanged throughout.

- [x] T047 Implement `QuantumStrategy.init()`
      File: `src/app/renderer/strategies/quantum-strategy.ts`
      For each shell in `shellParams`:
        Create `n * 12` particles where `n = shell.electronCount`.
        Compute initial positions in spherical coordinates:
          `r = shell.radius + GaussianNoise(σ=0.4)` (use Box-Muller transform)
          `θ, φ` uniform random (`θ ∈ [0, 2π]`, `φ ∈ [0, π]`)
          Convert to Cartesian for `BufferGeometry` position attribute.
        Create `THREE.Points(geometry, PointsMaterial({ size: 0.12, transparent: true,
          opacity: 0.6, blending: THREE.AdditiveBlending }))`.
        Stores per-shell initial positions and a per-particle random drift value (±0.002).
        Adds the `Points` object to `scene`.
      deps: T018, T019, T021

- [x] T048 Implement `QuantumStrategy.update()`
      Per frame (called with `accumulatedTimeMs`):
      For each shell's particle cloud:
        `groupAngle = 0.15 * accumulatedTimeMs / 1000`
        Rotate all particles by `groupAngle` around the Y-axis (applied to the `Points`
        object's rotation or via position recalculation).
        When `accumulatedTimeMs` is frozen (paused), `groupAngle` is constant →
        particles are frozen. No extra pause logic needed.
      deps: T047

- [x] T049 Implement `QuantumStrategy.dispose()`
      For each stored `THREE.Points` object:
        Remove from scene, call `geometry.dispose()`, `material.dispose()`.
      Clears internal references.
      deps: T047

- [x] T050 Integrate `QuantumStrategy` into `AtomRendererService` mode-switch flow
      In the `mode$` subscription (T026), when mode switches to 'quantum':
        `activeStrategy.dispose(scene)` (removes electrons only).
        `activeStrategy = new QuantumStrategy()`.
        `activeStrategy.init(currentElement, scene, shellParams)`.
      When mode switches back to 'bohr':
        Same sequence but constructs `new BohrStrategy()`.
      Nucleus, shell rings, camera, and `accumulatedTimeMs` MUST NOT be modified.
      deps: T026, T047, T048, T049

- [x] T051 [P] Implement `ViewerControlsComponent` — mode toggle button
      Add mode toggle to the existing `ViewerControlsComponent`.
      Subscribes to `mode$` to reflect current mode (e.g., "Bohr" / "Quantum" label).
      On click: calls `viewerStateService.setMode(currentMode === 'bohr' ? 'quantum' : 'bohr')`.
      deps: T016, T042

- [x] T052 Add quantum-mode disclaimer to `ElementDetailComponent`
      When `mode$ === 'quantum'`, show below the data fields:
      "Quantum view is illustrative — not physically exact."
      Hides when mode switches back to 'bohr'.
      deps: T039, T051

- [ ] T053 Verify mode toggle end-to-end
      Manual test:
        1. Select Iron. Bohr mode: discrete electron spheres visible.
        2. Click mode toggle → electrons become particle cloud. Nucleus + shells unchanged.
        3. Disclaimer visible in detail panel.
        4. Camera not reset. Animation not paused.
        5. Toggle back to Bohr → spheres return. Disclaimer hidden.
        6. Repeat for Hydrogen (1 shell) and Oganesson (7 shells).
        7. Pause animation → switch mode → verify still paused in new mode.
      deps: T050, T051, T052

- [x] T054 [P] Write unit tests for `QuantumStrategy` (scene object count verification)
      Test: after `init(carbon, scene, shellParams)`, scene contains 2 `THREE.Points` objects
      (one per shell), each with `n * 12` particles in the geometry buffer.
      Test: after `dispose(scene)`, all Points objects removed from scene.
      Test: `update(1000)` and `update(2000)` produce different particle group angles
      (rotation advances with time).
      Test: `update(t)` called twice with the same `t` produces the same rotation (idempotent).
      deps: T047, T048, T049

**Checkpoint**: All 4 user stories are independently functional. Core MVP is complete.

---

## Phase 9: Error Handling & Edge Cases

**Purpose**: Harden the application against failure modes and validate behaviour at the
boundaries identified in spec.md Edge Cases.

- [x] T055 Implement WebGL detection and error display (FR-023)
      In `ElementViewerComponent`, if `atomRenderer.isWebGLSupported()` returns false:
        Hide the `<canvas>`. Display an error overlay:
        "Your browser does not support 3D graphics (WebGL). Please use a modern browser."
      Ensure no call to `atomRenderer.init()` is made in this case.
      deps: T034

- [x] T056 Implement `elements.json` load error display (FR-024)
      After `APP_INITIALIZER` completes, check `elementDataService.loadError` in
      `ElementViewerComponent` or `AppComponent`.
      If `loadError !== null`: display a specific error overlay:
      "Could not load element data: {loadError}. Refresh the page to retry."
      deps: T013, T034

- [ ] T057 Verify OrbitControls zoom limits are enforced
      Manual test: in the running app, scroll to maximum zoom in — verify view stops at
      min distance (nucleus fills but is not clipped). Scroll to maximum zoom out — view
      stops before the atom becomes a point. Confirm no crash at limits.
      deps: T022

- [ ] T058 Verify rapid element switching produces no artifacts
      Manual test: click through 10 different elements as fast as possible. Verify:
        No blended or overlapping electron geometries from previous elements.
        No console errors.
        Final selected element renders correctly.
      This tests the `activeStrategy.dispose()` → `clearSceneObjects()` sequence in T026.
      deps: T036

- [ ] T059 Verify Oganesson renders correctly in both modes (7 shells, 118 electrons)
      Manual test:
        1. Select Oganesson. In Bohr mode: verify 7 rings visible, all non-overlapping,
           118 electron spheres distributed across shells (2,8,18,32,32,18,8).
        2. Check at default zoom that all shells and electrons are visible and legible.
        3. Switch to quantum mode: verify 7 particle clouds visible and performant.
        4. Verify no frame rate stutter in either mode.
      deps: T036, T053

- [ ] T060 Verify pause-then-switch-element preserves paused state
      Manual test:
        1. Select Carbon. Pause animation. Verify electrons frozen.
        2. Select Sodium. Verify sodium's electrons appear static (paused state preserved).
        3. Resume. Verify Sodium's electrons begin animating.
      deps: T045, T035

- [ ] T061 Verify mode-toggle-while-rotating does not interrupt camera or cause artifacts
      Manual test:
        1. Select any element. Click and drag to start rotating the atom.
        2. While the atom is rotating, click the mode toggle.
        3. Verify rotation continues smoothly after mode switch; no flicker or jump.
      deps: T053

**Checkpoint**: All edge cases from spec.md are verified. Application is production-ready.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Module documentation, performance profiling, disclaimers, and final validation.

- [x] T062 [P] Add HTML overlay "Nucleus (simplified)" to `ElementViewerComponent`
      Position as an absolute-positioned `<div>` over the canvas.
      Show only when `selectedElement !== null` and no error is active (FR-005).
      Style: small, unobtrusive, bottom-left of canvas or below nucleus.
      deps: T034

- [x] T063 [P] Add module header JSDoc comments to all `renderer/` files
      Each file: one-paragraph comment at the top describing purpose, inputs, and outputs.
      Files: `atom-renderer.service.ts`, `nucleus-renderer.ts`, `shell-renderer.ts`,
      `strategies/render-strategy.interface.ts`, `strategies/bohr-strategy.ts`,
      `strategies/quantum-strategy.ts`, `shell-geometry.ts` (or wherever T019 lives).
      Rationale: Principle IX (Documentation Required).
      deps: T031, T050

- [x] T064 [P] Add module header JSDoc comments to all `services/` and `models/` files
      Files: `element-data.service.ts`, `viewer-state.service.ts`,
      `element.model.ts`, `viewer-state.model.ts`, `renderer-types.ts`.
      deps: T016, T013

- [x] T065 [P] Add module header JSDoc comments to all `components/` files
      Files: `periodic-table.component.ts`, `element-cell.component.ts`,
      `element-viewer.component.ts`, `element-detail.component.ts`,
      `viewer-controls.component.ts`, `app.component.ts`.
      deps: T040, T044, T052

- [x] T066 [P] Add inline architectural rationale comments to `AtomRendererService`
      Document (inline or in JSDoc):
        - Why the animation loop runs outside NgZone (AD-001)
        - Why the strategy pattern is used (AD-002)
        - Why the time accumulator is used instead of per-electron angle storage (AD-003)
      deps: T026, T050

- [ ] T067 Profile animation loop — verify it runs outside NgZone
      In Chrome DevTools → Performance → record 5 seconds of animation.
      Verify: `Zone.prototype.runOutsideAngular` is visible in the call stack;
      Angular change detection cycle count is NOT elevated at 60fps.
      deps: T023

- [ ] T068 Profile Bohr mode with Oganesson — verify 60fps sustained
      In Chrome DevTools → Performance → record 10 seconds with Oganesson selected in Bohr mode.
      Verify sustained 60fps (frame time < 16.7ms). Document result.
      deps: T059

- [ ] T069 Profile Quantum mode with Oganesson — verify 60fps sustained
      Same as T068 but with Quantum mode active for Oganesson.
      1,416 particles (118 electrons × 12) should render well within 16.7ms.
      deps: T059

- [ ] T070 Run complete quickstart.md validation checklist
      Execute every item in the Functional, Performance, Error Handling, and
      Static/Offline validation sections of `specs/002-atomic-structure-viewer/quickstart.md`.
      All items MUST be checked before this task is marked complete.
      deps: T060, T061, T062, T063, T064, T065, T066, T067, T068, T069

- [ ] T071 Production build verification
      `ng build --configuration production`
      Serve output: `npx serve dist/atomic-structure/browser`
      Open in browser → DevTools Network → select multiple elements → confirm zero
      external network requests; `elements.json` loads from bundled static files only.
      deps: T070

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1: Setup                → No dependencies. Start immediately.
Phase 2: Element Data         → Requires Phase 1 complete.
Phase 3: State Management     → Requires Phase 2 complete.
Phase 4: Rendering Core       → Requires Phase 2 + Phase 3 complete.
Phase 5: US1 (P1 MVP)         → Requires Phase 4 complete. Delivers first running feature.
Phase 6: US2 (P2)             → Requires Phase 5 complete.
Phase 7: US3 (P3)             → Requires Phase 5 complete. (Can run in parallel with Phase 6.)
Phase 8: US4 (P4)             → Requires Phase 5 complete. (Can run in parallel with 6 and 7.)
Phase 9: Error Handling       → Requires Phase 5–8 complete.
Phase 10: Polish              → Requires Phase 9 complete.
```

### Key Blocking Chains

```text
T001 → T002 → T021 → T023 → T026 → T031 → T036   (renderer pipeline, critical path)
T001 → T007 → T008 → T013 → T015 → T016           (data + state pipeline)
T001 → T009 → T018 → T028 → T031                  (strategy + Bohr pipeline)
```

### Within-Phase Parallel Opportunities

**Phase 1**: T002, T003, T004, T005, T006 all parallel after T001.

**Phase 2**: T009, T010, T011 parallel after T005; T012, T007 parallel (different concerns);
T014, T015 parallel after their respective deps.

**Phase 4**: T019, T020 parallel (different computation functions); T024, T025 parallel
(NucleusRenderer and ShellRenderer operate on different scene objects).

**Phase 5**: T032 (ElementCellComponent) parallel with all renderer tasks — it has no
renderer dependency; T037 and T038 parallel after T033/T028.

**Phase 7**: T042 and T046 can run in parallel with Phase 6 tasks.

**Phase 10**: T062, T063, T064, T065, T066 all parallel.

### User Story Dependencies

| User Story | Can Start After | Blocks |
|------------|----------------|--------|
| US1 (P1) | Phase 4 complete | Nothing — MVP. |
| US2 (P2) | US1 complete | Nothing. |
| US3 (P3) | US1 complete | Nothing. Can parallel with US2. |
| US4 (P4) | US1 complete | Nothing. Can parallel with US2, US3. |

---

## Notes

- `[P]` tasks = operate on different files, no shared state dependency — safe to parallelize.
- Tasks without `[P]` MUST complete before their listed `deps` are considered unblocked.
- Three.js renderer tasks (T024–T031, T047–T050) are sequential by nature — they share
  the `scene` object and must follow the documented sequences in plan.md AD-002.
- The time accumulator (`accumulatedTimeMs`) is the single most important correctness
  constraint: NEVER reset it on element change or mode switch. Only increment it in the
  render loop when `!isPaused`.
- All `renderer/` files MUST have zero Angular imports (`@angular/*`). If you find yourself
  importing Angular in the renderer layer, stop and restructure.
- Stop at the end of each Phase checkpoint to validate independently before proceeding.
- Commit after each task or logical group of parallel tasks.
