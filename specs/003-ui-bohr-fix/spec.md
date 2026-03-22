# Feature Specification: UI/UX Optimization and Bohr Model Correction

**Feature Branch**: `003-ui-bohr-fix`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "UI/UX Optimization and Bohr Model Correction"

---

## Background / Context

This project is a personal, browser-based atomic structure visualizer covering all 118 elements of the periodic table. Phase 1 establishes the core visualization experience: a periodic table for navigation and a Three.js-powered atom viewer showing the Bohr model of the selected element.

The current implementation is functionally operational but visually unpolished and scientifically inaccurate in its Bohr model rendering. The layout lacks hierarchy, the atom viewer is undersized, and the Bohr model geometry is incorrect — even Hydrogen, the simplest case, does not render correctly.

This feature addresses both concerns simultaneously because they are coupled: correcting the Bohr model geometry is most impactful when the viewer is the visual hero of the interface.

---

## Problem

### Layout and Hierarchy Issues

- The periodic table is pushed into the top-left corner and appears detached from the rest of the experience.
- The atom viewer is too small relative to the available screen space.
- The details panel at the bottom is oversized, unstructured, and disconnected from the viewer.
- Controls (Pause, Reset Camera, model selector) are visually disconnected from the content they control.
- The selected element and its atom visualization are not clearly the focal point of the application.

### Bohr Model Correctness Issues

- The nucleus is not centered relative to the shell/orbit system.
- Shell rendering is geometrically awkward.
- Electron placement does not correctly follow the shell circumference.
- Hydrogen — the simplest possible case — renders incorrectly, indicating a foundational geometry problem.
- The camera perspective over-dramatizes 3D depth at the cost of educational clarity.
- Electron animation does not clearly convey orbital motion.

---

## Goals

1. Adopt a two-panel desktop layout that makes the atom viewer the unambiguous visual hero.
2. Surface selected element information in a structured, integrated way adjacent to the viewer.
3. Group all viewer controls cohesively near the viewer.
4. Correct the Bohr model geometry so that Hydrogen, Helium, and Lithium all render correctly as validation targets.
5. Establish a canonical "educational" camera view for Bohr mode that prioritizes readability over 3D drama.
6. Improve visual polish: consistent spacing, card-based information layout, clear selected-state contrast.

---

## Non-Goals

- Implementing the quantum/orbital model (out of scope for Phase 1).
- Adding new element data fields beyond what is already available.
- Mobile or tablet layout optimization (desktop and laptop are the primary target).
- Internationalization or accessibility compliance beyond basic contrast standards.
- User accounts, persistence, or sharing features.

---

## User Scenarios & Testing

### User Story 1 — Explore an element's Bohr model (Priority: P1)

A learner opens the application, selects Hydrogen from the periodic table, and sees a correct Bohr model: one nucleus centered in the viewer, one circular shell around it, and one electron sitting on that shell. They can pause electron motion to study the position.

**Why this priority**: This is the core interaction the application exists to support. If Hydrogen is wrong, all elements are wrong. Fixing this is foundational.

**Independent Test**: Can be tested by loading the application, clicking Hydrogen, and visually verifying nucleus centering, one shell, and one electron on the circumference. No other features required.

**Acceptance Scenarios**:

1. **Given** the application is loaded, **When** the user clicks Hydrogen, **Then** the viewer shows one nucleus exactly centered, one circular shell, and one electron on the shell circumference.
2. **Given** Hydrogen is selected, **When** the user clicks Pause, **Then** the electron freezes immediately on the shell circumference.
3. **Given** Hydrogen is selected, **When** the user clicks Reset Camera, **Then** the view resets to a clean frontal/educational framing with the atom centered.
4. **Given** Helium is selected, **Then** the viewer shows two electrons evenly distributed on one shell.
5. **Given** Lithium is selected, **Then** the viewer shows two electrons on shell 1 and one electron on shell 2, both shells concentric.

---

### User Story 2 — Navigate the periodic table and study element details (Priority: P2)

A learner scans the periodic table on the left panel, selects an element of interest, and immediately sees the atom visualization dominate the right panel alongside a summary header and structured property cards.

**Why this priority**: The navigation and layout redesign unlocks the intended mental model — select left, study right. Without this, even a correct Bohr model is visually buried.

**Independent Test**: Can be tested by selecting any three elements and verifying that: the selected element is visually highlighted in the table, the right panel updates with a header, atom viewer, and information cards, and the layout feels balanced.

**Acceptance Scenarios**:

1. **Given** the application is loaded, **When** the user selects any element, **Then** that element is visually highlighted in the periodic table.
2. **Given** an element is selected, **Then** the right panel displays: element name and symbol as a header, the atom viewer as the dominant visual, and property cards below or around the viewer.
3. **Given** the application loads for the first time, **Then** a default element is pre-selected and the right panel is populated (not empty).
4. **Given** different elements are selected in sequence, **Then** the atom viewer and property cards update without layout shifts.

---

### User Story 3 — Use viewer controls (Priority: P3)

A learner interacts with playback and camera controls while studying an element's atom. Controls feel cohesive, discoverable, and grouped near the viewer.

**Why this priority**: Controls are essential for interactive study but depend on the layout and Bohr fix being in place first.

**Independent Test**: Can be tested by loading any element and exercising Pause/Resume, Reset Camera, and the model selector independently.

**Acceptance Scenarios**:

1. **Given** an element is selected and electrons are animating, **When** the user clicks Pause, **Then** all electrons stop moving.
2. **Given** electrons are paused, **When** the user clicks Resume, **Then** electrons resume motion from their current positions.
3. **Given** any camera state, **When** the user clicks Reset Camera, **Then** the atom returns to a centered, educational framing appropriate for Bohr mode.
4. **Given** the model selector is visible, **Then** it is rendered as a segmented control or toggle, not a plain button, and "Bohr" is the default selection.
5. **Given** all controls are visible, **Then** they are grouped in a single cohesive region near the viewer, not scattered across the interface.

---

### Edge Cases

- What happens when an element with many shells (e.g., Uranium, 7 shells) is selected? Shells must not overlap each other or clip outside the viewer bounds.
- What happens when the user resizes the browser window? The left panel must retain its width; the right viewer must expand/contract gracefully.
- What happens when switching rapidly between elements? The atom viewer must clear and re-render correctly without visual artifacts.
- What happens when the user clicks Reset Camera after manually orbiting the view? The camera must snap back to the canonical Bohr view, not an arbitrary state.

---

## Requirements

### Functional Requirements

**Layout**

- **FR-001**: The application MUST adopt a two-panel layout: a fixed-width left panel containing the periodic table, and a main right panel containing the atom viewer and element information.
- **FR-002**: The left panel MUST have a controlled, fixed width (sidebar-style) so the periodic table does not dominate the viewport.
- **FR-003**: The right panel MUST be subdivided into: an element header section, the atom viewer as the dominant visual, a controls row, and property information cards below or flanking the viewer.
- **FR-004**: The atom viewer MUST occupy the majority of the right panel's vertical space.
- **FR-005**: The element detail panel MUST be replaced with structured information cards or grouped property blocks that appear in the right panel, attached contextually to the viewer.
- **FR-006**: A default element MUST be selected on initial load so the right panel is never empty.

**Controls**

- **FR-007**: All viewer controls (Pause/Resume, Reset Camera, model selector) MUST be grouped in a single cohesive control area near the atom viewer.
- **FR-008**: The model selector MUST be rendered as a segmented control or toggle switch, not a standalone button. "Bohr" MUST be the default and only active option in Phase 1.
- **FR-009**: Pause/Resume MUST toggle electron animation. When paused, all electron positions must freeze immediately.
- **FR-010**: Reset Camera MUST return the camera to a preset canonical view: atom centered, viewer from a slightly elevated frontal angle, shells clearly visible as near-circular rings.

**Bohr Model Geometry**

- **FR-011**: The nucleus MUST be positioned at the coordinate origin (0, 0, 0) of the scene.
- **FR-012**: Shells MUST be rendered as concentric rings centered on the nucleus, with radii increasing linearly by shell index.
- **FR-013**: Electrons MUST be placed on the circumference of their assigned shell, evenly distributed angularly within each shell.
- **FR-014**: For Hydrogen (Z=1): one nucleus, one shell, one electron on the shell circumference.
- **FR-015**: For Helium (Z=2): one nucleus, one shell, two electrons evenly distributed on the shell.
- **FR-016**: For Lithium (Z=3): one nucleus, two shells, two electrons on shell 1 and one electron on shell 2.
- **FR-017**: Electron animation MUST move each electron along its shell's circular path at a consistent, slow angular velocity.
- **FR-018**: The Bohr mode camera preset MUST be nearly orthographic or use a shallow perspective angle so shells read as near-circular rings, not dramatically elliptical.

**Visual Design**

- **FR-019**: The dark theme MUST be retained.
- **FR-020**: The selected element in the periodic table MUST have visually distinct contrast (highlight border, background tint, or equivalent) that is clearly different from hovered and unselected states.
- **FR-021**: Spacing, card sizing, button alignment, and typography MUST be consistent throughout the right panel.
- **FR-022**: The interface MUST look intentional and presentation-ready, not prototype-rough.

**Responsiveness**

- **FR-023**: The layout MUST be optimized for desktop and laptop screens (≥1024px width).
- **FR-024**: The left panel width MUST be fixed or capped to prevent the periodic table from growing disproportionately.
- **FR-025**: The right panel atom viewer MUST scale with available width/height.
- **FR-026**: Property information cards MUST wrap gracefully if the right panel width changes.

### Key Entities

- **Element**: An entry in the periodic table with properties (symbol, name, atomic number, electron shell configuration, atomic mass, etc.). The shell configuration drives Bohr model rendering.
- **Shell**: A concentric ring in the Bohr model at a defined radius. Each shell has an electron count capacity and an assigned set of electrons.
- **Electron**: A particle placed on a shell circumference. In animated mode, it has an angular position that advances each frame.
- **Atom Scene**: The Three.js scene containing nucleus, shells, and electrons for the selected element.
- **Camera Preset**: A named, stored camera position and orientation for a given model mode. "Bohr-canonical" is the reset target.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Hydrogen renders with one nucleus, one shell, and one electron on the shell circumference — verifiable by visual inspection with no geometry error.
- **SC-002**: Helium and Lithium render correctly per their electron configurations — verifiable by visual inspection.
- **SC-003**: The atom viewer occupies more than 50% of the right panel's vertical space in the default layout.
- **SC-004**: All viewer controls are reachable within one visual grouping — no control is isolated from the others.
- **SC-005**: Reset Camera returns the atom to a centered, readable educational framing in a single click, regardless of prior camera state.
- **SC-006**: Pause freezes all electron motion within one animation frame of the click — no delayed or partial freeze.
- **SC-007**: Selecting any element updates the atom viewer and property cards without visible layout shift or rendering artifact.
- **SC-008**: The periodic table remains readable (element symbols and numbers legible) at the constrained left panel width.
- **SC-009**: The right panel information area presents element data in structured cards or blocks — no full-width unbroken footer strip.
- **SC-010**: Elements with up to 7 shells render without shells overlapping or clipping outside the visible viewer area.

---

## Technical Considerations

These are guidance notes for implementers, not requirements. The spec does not mandate specific implementation choices.

- **Nucleus centering**: The nucleus mesh should be created at (0, 0, 0). All shell and electron geometry must be constructed relative to that origin. Any offset applied to the scene group must be zero by default in Bohr mode.
- **Shell radii**: A linear scale (e.g., shell 1 = radius r, shell 2 = radius 2r, ...) is acceptable for Bohr mode. The base radius `r` should be chosen so that all shells of common elements (up to shell 7) fit within the viewer's default camera frustum.
- **Electron angular distribution**: For N electrons on a shell, place them at angles `(2π / N) * i` for `i = 0..N-1`. This ensures even distribution without requiring physics simulation.
- **Camera for Bohr mode**: A near-top-down or slightly tilted orthographic-style view (low field of view, camera looking from above along the Z-axis) makes shells appear as clean circles. The reset function should restore `camera.position`, `camera.target`, and `camera.fov` to these canonical values.
- **Animation outside NgZone**: Electron animation loop must run outside Angular's change detection (via `NgZone.runOutsideAngular`) to prevent performance issues — this is already required by the project architecture.
- **Strategy pattern**: The existing `BohrStrategy` class should be the sole implementation target for geometry corrections. Do not scatter geometry logic into renderer services.
- **Left panel width**: A fixed pixel or `rem` width (e.g., `280px–320px`) for the sidebar prevents layout instability. CSS grid or flexbox with `flex-shrink: 0` on the sidebar is appropriate.

---

## Assumptions

- The element data (`elements.json`) already contains correct electron shell configurations for all 118 elements. No data changes are required.
- The application already has a working Three.js rendering pipeline; this spec addresses geometry correctness and layout, not a rewrite.
- "Bohr mode" is the only rendering mode in Phase 1. The model selector segmented control should render with "Bohr" as the sole enabled option; other options may be shown as disabled/coming-soon placeholders.
- A "slightly elevated frontal angle" for the canonical camera means roughly 15–30 degrees off the XY plane, not a dramatic isometric perspective.

---

## Open Questions / Decisions

None — all scope questions were resolved by the feature description. If electron animation speed becomes a point of debate during implementation, a sensible default is one full orbit per 4–8 seconds for shell 1, with outer shells moving proportionally slower.

---

## Acceptance Checklist

Before this feature is considered complete, verify:

- [ ] Hydrogen renders with one nucleus, one concentric shell, one electron on the circumference.
- [ ] Helium renders with two electrons evenly spaced on one shell.
- [ ] Lithium renders with two shells and correct electron counts per shell.
- [ ] The atom viewer is the dominant visual element on screen.
- [ ] Element details appear as structured cards, not a flat footer strip.
- [ ] Pause freezes electron motion; Resume restarts it.
- [ ] Reset Camera returns to the canonical Bohr educational framing.
- [ ] The model selector is rendered as a segmented control with "Bohr" as the active state.
- [ ] All controls are grouped in a single cohesive area near the viewer.
- [ ] The periodic table fits within a constrained sidebar and remains readable.
- [ ] Elements with 7 shells render without visual clipping or shell overlap.
- [ ] The interface looks polished and presentation-ready on a 1080p or 1440p desktop screen.
