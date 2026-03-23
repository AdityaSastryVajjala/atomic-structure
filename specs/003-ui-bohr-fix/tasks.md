# Tasks: UI/UX Optimization and Bohr Model Correction

**Feature**: `003-ui-bohr-fix`
**Input**: Design documents from `specs/003-ui-bohr-fix/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All tasks include exact file paths

---

## Phase 1: Setup (Existing Project Verification)

**Purpose**: Confirm the project baseline is clean before making changes.

- [x] T001 Run `ng serve` and confirm the application compiles without TypeScript errors before changes begin

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Remove `ringTilt` from the `ShellGeometryParams` interface — this is a breaking API change that all renderer files depend on. No user story work in the renderer layer can begin until this is complete.

**⚠️ CRITICAL**: T003–T007 are blocked until T002 is complete.

- [x] T002 Remove `ringTilt: number` field from `ShellGeometryParams` interface in `src/app/models/renderer-types.ts`

**Checkpoint**: Interface updated — renderer consumers can now be fixed in parallel.

---

## Phase 3: User Story 1 — Explore an Element's Bohr Model (Priority: P1) 🎯 MVP

**Goal**: Correct the Bohr model geometry so that Hydrogen, Helium, and Lithium render accurately — correct nucleus position, co-planar ring and electron orbit, and a readable educational camera angle.

**Independent Test**: Load the app, click Hydrogen — verify one nucleus centered at origin, one circular shell ring in the XZ plane, and one electron on the shell circumference. Click Pause and verify electron freezes. Click Reset Camera and verify the atom recenters to a near-top-down framing.

### Implementation for User Story 1

- [x] T003 [P] [US1] Remove `ringTilt` from the return object of `computeShellGeometry()` in `src/app/renderer/renderer-utils.ts`
- [x] T004 [P] [US1] Replace `mesh.rotation.x = shell.ringTilt` with the constant `mesh.rotation.x = Math.PI / 2` in `src/app/renderer/shell-renderer.ts`
- [x] T005 [P] [US1] Update camera constants to `CAM_FOV = 65`, `CAM_POSITION = new THREE.Vector3(0, 8, 16)`, `MAX_DISTANCE = 35` in `src/app/renderer/atom-renderer.service.ts`
- [x] T006 [P] [US1] Grep for `ringTilt` usage and remove any references in `src/app/renderer/strategies/quantum-strategy.ts`
- [x] T007 [P] [US1] Remove `ringTilt` from all mock `ShellGeometryParams` objects in `src/app/renderer/strategies/bohr-strategy.spec.ts`

**Checkpoint**: Bohr geometry and camera are corrected — Hydrogen/Helium/Lithium should render correctly. Verify visually with `ng serve` before proceeding to Phase 4.

---

## Phase 4: User Story 2 — Navigate the Periodic Table and Study Element Details (Priority: P2)

**Goal**: Adopt a two-panel desktop layout with a fixed 300px sidebar, a dominant atom viewer, an element header, and a default Hydrogen selection on first load so the right panel is never empty.

**Independent Test**: Load the app — verify Hydrogen is pre-selected, the right panel shows an element header with symbol/name/atomic number, the atom viewer dominates the right panel, and switching three elements in sequence shows no layout shift.

### Implementation for User Story 2

- [x] T008 [US2] Update `.panel-left` CSS to `width: 300px; flex-shrink: 0; overflow-x: auto; overflow-y: auto` and update `.panel-right` to `display: flex; flex-direction: column; gap: 8px; min-width: 0` in `src/app/app.component.ts`
- [x] T009 [US2] Add `.element-header` template block (symbol, name, atomic number) and its CSS (`flex: 0 0 auto; padding: 8px 12px; background: #161b22; border: 1px solid #30363d; border-radius: 6px`) to `src/app/app.component.ts`, reading from `toSignal(viewerState.selectedElement$)`
- [x] T010 [US2] Add default Hydrogen selection in `AppComponent.ngOnInit()` by calling `this.viewerState.selectElement(this.elementData.getAllElements().find(e => e.atomicNumber === 1)!)` in `src/app/app.component.ts`
- [x] T011 [P] [US2] Remove the `.hero` template block and all associated hero CSS from `src/app/components/element-detail/element-detail.component.ts`

**Checkpoint**: Two-panel layout is in place with default element selection. Element header and detail cards coexist without duplication.

---

## Phase 5: User Story 3 — Use Viewer Controls (Priority: P3)

**Goal**: Replace the single mode toggle button with a cohesive segmented control showing "⚛ Bohr" (active) and "☁ Quantum" (disabled), and consolidate all controls near the atom viewer.

**Independent Test**: Load any element and verify: the mode selector renders as a segmented control with Bohr highlighted and Quantum visually disabled; Pause freezes electrons; Resume restarts them; Reset Camera snaps to the canonical Bohr framing.

### Implementation for User Story 3

- [x] T012 [US3] Replace the single `mode-btn` button with a `.seg-control` wrapper containing two `<button class="seg-btn">` elements (`⚛ Bohr` active via `[class.active]="mode() === 'bohr'"`, `☁ Quantum` with `disabled` attribute), replace `toggleMode()` with `setMode(m: VisualizationMode)` calling `viewerState.setMode(m)`, and add active/disabled CSS states in `src/app/components/viewer-controls/viewer-controls.component.ts`

**Checkpoint**: All three user stories are independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Visual consistency and final validation across all user stories.

- [x] T013 [P] Verify `.selected` CSS class applies `border: 2px solid #58a6ff` and `background: #1c2840` — update if the current contrast is insufficient — in `src/app/components/periodic-table/element-cell/element-cell.component.ts`
- [x] T014 [P] Add `padding: 12px 16px` to the `<dl class="data-list">` container and verify row gaps after hero removal in `src/app/components/element-detail/element-detail.component.ts`
- [x] T015 Run `ng serve` and validate all acceptance criteria from `specs/003-ui-bohr-fix/quickstart.md` including Hydrogen, Helium, Lithium, and a 7-shell element (Uranium)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS** all renderer tasks in Phase 3
- **Phase 3 (US1)**: Depends on Phase 2; T003–T007 can all run in parallel (different files)
- **Phase 4 (US2)**: Independent of Phase 3 — can start in parallel with Phase 3 (different files); T011 can run in parallel with T008–T010
- **Phase 5 (US3)**: Independent of Phases 3 and 4 (different file)
- **Phase 6 (Polish)**: Depends on Phase 4 (hero removal must be complete before T014)

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 (foundational) only — no dependency on US2 or US3
- **US2 (P2)**: Independent of US1 — different files entirely
- **US3 (P3)**: Independent of US1 and US2 — single file change

### Parallel Execution Map

| Track | Tasks | Parallel with |
|-------|-------|---------------|
| Track 3 (Bohr fix) | T003, T004, T005, T006, T007 | Each other (after T002); also parallel with Track 1+2 |
| Track 1 (Layout) | T008, T009, T010 (sequential — same file), T011 (parallel) | Tracks 2 and 3 |
| Track 2 (Controls) | T012 | Tracks 1 and 3 |
| Track 4 (Polish) | T013, T014 (parallel with each other) | After Track 1 completes |

---

## Parallel Example: User Story 1 (after T002 completes)

```bash
# Launch all five US1 fixes simultaneously (different files):
Task: "Remove ringTilt from computeShellGeometry() in src/app/renderer/renderer-utils.ts"        # T003
Task: "Replace shell.ringTilt with Math.PI / 2 in src/app/renderer/shell-renderer.ts"           # T004
Task: "Update CAM_FOV / CAM_POSITION / MAX_DISTANCE in src/app/renderer/atom-renderer.service.ts" # T005
Task: "Grep and remove ringTilt from src/app/renderer/strategies/quantum-strategy.ts"           # T006
Task: "Remove ringTilt from mocks in src/app/renderer/strategies/bohr-strategy.spec.ts"         # T007
```

## Parallel Example: User Story 2

```bash
# T011 can run in parallel with T008 (different files):
Task: "Remove .hero section from src/app/components/element-detail/element-detail.component.ts" # T011
Task: "Update panel CSS in src/app/app.component.ts"                                            # T008
# T009 and T010 follow T008 sequentially (same file)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Remove `ringTilt` (foundational)
3. Complete Phase 3: US1 Bohr model fix
4. **STOP and VALIDATE**: Load Hydrogen, Helium, Lithium — verify geometry visually
5. Demo if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Clean baseline with updated interface
2. Phase 3 (US1) → Correct Bohr geometry + camera → Visual demo milestone
3. Phase 4 (US2) → Two-panel layout + default selection → Layout milestone
4. Phase 5 (US3) → Segmented control → Controls polish milestone
5. Phase 6 (Polish) → Final acceptance criteria validation

### Suggested Execution Order (single developer, plan recommendation)

```
Step 1: T001 → T002                      (sequential)
Step 2: T003 + T004 + T005 + T006 + T007 (parallel, all after T002)
Step 3: T008 + T011 (parallel)
Step 4: T009 → T010 (sequential, same file as T008)
Step 5: T012                              (independent, any time)
Step 6: T013 + T014 (parallel)
Step 7: T015 (final validation)
```

---

## Notes

- No new dependencies, no new components, no new files — all tasks modify existing files
- [P] tasks touch different files and have no incomplete-task dependencies
- Commit after each phase checkpoint (T002, after T007, after T011, after T012)
- `ng test` after Phase 3 to confirm no TypeScript errors from ringTilt removal
- Verify quickstart.md acceptance scenarios before closing the feature branch
