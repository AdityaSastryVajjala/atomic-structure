<!--
## Sync Impact Report

**Version Change**: N/A → 1.0.0 (initial ratification — template was unfilled)

### Modified Principles
None (initial ratification; no prior principles existed)

### Added Sections
- Core Principles (9 principles: I through IX)
- Scope & Phasing
- Governance

### Removed Sections
None (template placeholder sections collapsed into final structure)

### Templates Requiring Updates
- `.specify/templates/plan-template.md`   ✅ No update required — Constitution Check section references constitution generically and remains valid.
- `.specify/templates/spec-template.md`   ✅ No update required — structure is compatible with all 9 principles.
- `.specify/templates/tasks-template.md`  ✅ No update required — phase-based task organization aligns with Principle III (Incremental Delivery).
- `.specify/templates/agent-file-template.md` ✅ No update required — project-agnostic template.
- `.specify/templates/commands/`          ⚠ Directory does not exist — skipped.

### Deferred TODOs
- None. RATIFICATION_DATE set to 2026-03-22 (today); update if an earlier project start date is confirmed.
-->

# Atomic Structure Visualizer Constitution

## Core Principles

### I. User Experience First

The application MUST prioritize clarity, visual learning, and smooth interaction over feature
quantity. Every rendering and interaction decision MUST be evaluated against how well it helps
a user understand atomic structure — not merely how impressive it looks.

**Non-negotiable rules**:
- Features MUST NOT be added unless they improve user comprehension or interactivity.
- Smooth, responsive controls MUST be preserved over adding visual complexity.
- All UI elements MUST be legible, labeled, and purposeful.

### II. Scientific Correctness

All atomic structure representations, labels, and educational content MUST be scientifically
accurate and easy to understand. Simplification is acceptable; inaccuracy is not.

**Non-negotiable rules**:
- Electron shell counts, atomic numbers, and element data MUST match established scientific references.
- Visual approximations (e.g., orbital shapes) MUST be clearly labeled as illustrative.
- Labels and tooltips MUST use correct terminology without jargon overload.

### III. Incremental Delivery

Development MUST follow a phase-based scope. Phase 1 covers only periodic table navigation
and atomic structure visualization for individual elements. Bonding, energy transfer, and
reaction animations belong to later phases and MUST NOT influence Phase 1 architecture
beyond zero-cost reusability hooks.

**Non-negotiable rules**:
- No Phase 2+ feature MUST be built or scaffolded during Phase 1 unless it is a zero-cost
  by-product of a required Phase 1 component.
- Every deliverable MUST be demonstrable and testable at the end of each phase.
- Phase boundaries MUST be documented and agreed upon before implementation begins.

### IV. Simplicity Over Complexity

Architecture MUST be kept simple, modular, and maintainable. Unnecessary frameworks,
abstractions, and indirections MUST be avoided.

**Non-negotiable rules**:
- Any added abstraction or framework MUST justify a concrete educational or maintenance benefit.
- Complexity MUST NOT be introduced speculatively for future phases.
- The simplest solution that satisfies current requirements MUST be preferred.

### V. Performance Matters

3D rendering MUST remain responsive on modern desktop browsers. The application SHOULD
degrade gracefully on lower-end devices rather than failing entirely.

**Non-negotiable rules**:
- Frame rate MUST target 60 fps for single-element atomic visualizations on mid-range desktops.
- Large or expensive renders MUST include fallback quality settings or loading indicators.
- Performance regressions introduced by new features MUST be identified and justified before merging.

### VI. Separation of Concerns

Rendering, element data, UI controls, animations, and educational content MUST be kept in
separate modules. Cross-module coupling MUST be minimized and explicitly justified when present.

**Non-negotiable rules**:
- Rendering code MUST NOT contain element data logic.
- UI control code MUST NOT embed Three.js scene management directly.
- Each module MUST expose a clear, documented interface to its consumers.

### VII. Reusability

Atomic visualization components MUST be designed so they can later support bonds, molecules,
and energy animations in future phases — without requiring rewrites of Phase 1 code.

**Non-negotiable rules**:
- Components MUST accept element data as input rather than hard-coding element-specific logic.
- Public interfaces of visualization modules MUST remain stable across phases.
- Reusability considerations MUST be documented in architectural decision notes.

### VIII. Explain Before Impress

Visuals MUST support understanding, not just look attractive. Every visual effect MUST serve
an educational purpose that can be articulated in plain language.

**Non-negotiable rules**:
- Any animation or visual flourish without a stated educational rationale MUST be removed or deferred.
- Labels, tooltips, and legends MUST accompany all visual elements.
- User-facing explanations MUST be authored before visual effects are finalized.

### IX. Documentation Required

Every major feature, rendering decision, and data model MUST be documented so that future
contributors can understand intent and constraints without reading all source code.

**Non-negotiable rules**:
- Each module MUST have a header comment describing its purpose, inputs, and outputs.
- Non-obvious architectural decisions MUST include a rationale comment or a linked design note.
- The element data model MUST be fully documented before implementation begins.

## Scope & Phasing

**Phase 1 (current)**: Periodic table navigation and atomic structure visualization for
individual elements. This phase produces a functional, accurate, and visually clear interactive
viewer for all 118 elements.

**Phase 2+ (future)**: Bonding animations, molecular visualization, energy level transitions,
and chemical reaction simulations. These phases MUST NOT influence Phase 1 design decisions
beyond what is required by Principle VII (Reusability).

Any feature request that expands beyond Phase 1 scope MUST be documented as a future
enhancement and MUST NOT be implemented until Phase 1 is complete and reviewed.

## Governance

This constitution supersedes all other development practices for this project. All features
and implementation decisions MUST align with the principles above.

**Amendment procedure**:
1. Propose the amendment with a rationale referencing the affected principle(s).
2. Determine the version bump type per semantic versioning:
   - MAJOR: Principle removal, redefinition, or backward-incompatible governance change.
   - MINOR: New principle added or materially expanded guidance.
   - PATCH: Clarifications, wording fixes, non-semantic refinements.
3. Update `LAST_AMENDED_DATE` to the ISO date of change.
4. Re-run consistency propagation across dependent templates.

**Compliance expectations**:
- All new features MUST align with the phase-based scope defined in Scope & Phasing.
- Any feature that increases complexity MUST explicitly justify its educational value.
- Future plans for bonds and reactions MUST NOT complicate Phase 1 unnecessarily.
- Implementation plans MUST include a Constitution Check gate before Phase 0 research begins.

**Version**: 1.0.0 | **Ratified**: 2026-03-22 | **Last Amended**: 2026-03-22
