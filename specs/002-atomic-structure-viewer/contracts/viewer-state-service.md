# Contract: ViewerStateService

**File**: `src/app/services/viewer-state.service.ts`
**Consumers**: All viewer-related components (`ElementViewerComponent`,
`ElementDetailComponent`, `ViewerControlsComponent`, `PeriodicTableComponent`)
**Purpose**: Single source of truth for all viewer state. Manages which element is
selected, the active visualization mode, and the animation state. Exposes state as
RxJS observables; all mutations go through explicit methods.

---

## TypeScript Interface

```typescript
/**
 * Manages all viewer state: selected element, visualization mode, and animation.
 *
 * Components MUST NOT hold local copies of viewer state. All state reads go through
 * observables; all state writes go through the mutation methods below.
 *
 * State persistence across element changes:
 *  - Visualization mode: PRESERVED (FR-020)
 *  - Animation isPaused: PRESERVED (FR-030)
 *  - accumulatedTimeMs: PRESERVED (AD-003 — electrons resume from pause point)
 *  - Camera orientation: RESET by AtomRendererService (FR-014) — not managed here
 */
@Injectable({ providedIn: 'root' })
export class ViewerStateService {

  // ── Observables (read-only state streams) ──────────────────────────────────

  /**
   * Emits the currently selected element, or null if none selected.
   * Starts with null. Emits on every element change.
   */
  readonly selectedElement$: Observable<Element | null>;

  /**
   * Emits the active visualization mode whenever it changes.
   * Starts with 'bohr'.
   */
  readonly mode$: Observable<VisualizationMode>;

  /**
   * Emits the full AnimationState whenever isPaused or accumulatedTimeMs changes.
   * accumulatedTimeMs is updated by AtomRendererService via tickAnimation(),
   * so this observable emits frequently during playback. Components that only
   * need isPaused should use isPaused$ instead.
   */
  readonly animationState$: Observable<AnimationState>;

  /**
   * Emits only the isPaused boolean. Preferred for UI controls that show
   * play/pause state without re-rendering on every animation tick.
   */
  readonly isPaused$: Observable<boolean>;

  // ── Mutation Methods ───────────────────────────────────────────────────────

  /**
   * Sets the selected element.
   * Visualization mode and animation state are NOT reset (per FR-020, FR-030).
   * AtomRendererService observes selectedElement$ and resets camera on change (FR-014).
   * @param element The element to select. Must not be null; use clearSelection() to deselect.
   */
  selectElement(element: Element): void;

  /**
   * Clears the current element selection (returns to null state).
   * Used to reset the viewer to its empty state (e.g., on error).
   */
  clearSelection(): void;

  /**
   * Sets the active visualization mode.
   * Does NOT affect nucleus, shell rings, detail panel, or animation state (FR-021, FR-022).
   * @param mode 'bohr' | 'quantum'
   */
  setMode(mode: VisualizationMode): void;

  /**
   * Pauses electron animation. Sets isPaused = true.
   * Does NOT modify accumulatedTimeMs — electrons freeze at current position (FR-029).
   * No-op if already paused.
   */
  pause(): void;

  /**
   * Resumes electron animation. Sets isPaused = false.
   * No-op if already playing.
   */
  resume(): void;

  /**
   * Toggles between paused and playing states.
   * Convenience method for the ViewerControlsComponent pause/resume button.
   */
  togglePlayPause(): void;

  /**
   * Called by AtomRendererService on each animation frame to advance the time accumulator.
   * MUST only be called from within the render loop (outside NgZone).
   * @param deltaMs Milliseconds elapsed since last frame. Typically 16.7ms at 60fps.
   */
  tickAnimation(deltaMs: number): void;

  // ── Snapshot Accessors (synchronous) ──────────────────────────────────────

  /**
   * Returns the current animation state snapshot.
   * Used by AtomRendererService to read accumulatedTimeMs each frame without subscribing.
   */
  getAnimationState(): AnimationState;

  /**
   * Returns the current visualization mode snapshot.
   * Used by AtomRendererService to select the active strategy.
   */
  getMode(): VisualizationMode;
}
```

---

## State Transition Rules

| Event | selectedElement | mode | isPaused | accumulatedTimeMs |
|-------|----------------|------|----------|-------------------|
| `selectElement(e)` | → `e` | unchanged | unchanged | unchanged |
| `setMode('quantum')` | unchanged | → 'quantum' | unchanged | unchanged |
| `pause()` | unchanged | unchanged | → true | unchanged |
| `resume()` | unchanged | unchanged | → false | unchanged |
| `tickAnimation(dt)` | unchanged | unchanged | unchanged | → +dt (if !isPaused) |
| App load | null | 'bohr' | false | 0 |

---

## Threading Note

`tickAnimation()` is called from inside `ngZone.runOutsideAngular()` in the render loop.
The `isPaused$` observable must emit inside NgZone when `pause()` / `resume()` are called
from Angular components. BehaviorSubject combined with `ngZone.run()` in the mutation
methods achieves this correctly.
