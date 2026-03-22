/**
 * ViewerStateService
 *
 * Single source of truth for all viewer state: selected element, visualization
 * mode, and animation state. Exposes state as RxJS observables; all mutations
 * go through explicit methods.
 *
 * State persistence across element changes:
 *  - Visualization mode: PRESERVED (FR-020)
 *  - Animation isPaused: PRESERVED (FR-030)
 *  - accumulatedTimeMs: PRESERVED (AD-003 — electrons resume from pause point)
 *  - Camera orientation: RESET by AtomRendererService (FR-014) — not managed here
 *
 * See contracts/viewer-state-service.md for the full public interface contract.
 */

import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { Element } from '../models/element.model';
import {
  AnimationState,
  INITIAL_VIEWER_STATE,
  VisualizationMode,
  ViewerState,
} from '../models/viewer-state.model';

@Injectable({ providedIn: 'root' })
export class ViewerStateService {
  private readonly _state$ = new BehaviorSubject<ViewerState>(INITIAL_VIEWER_STATE);

  // ── Observables ────────────────────────────────────────────────────────────

  /**
   * Emits the currently selected element, or null if none selected.
   * Starts with null. Emits on every element change.
   */
  readonly selectedElement$: Observable<Element | null> = this._state$.pipe(
    map((s) => s.selectedElement),
    distinctUntilChanged()
  );

  /**
   * Emits the active visualization mode whenever it changes.
   * Starts with 'bohr'.
   */
  readonly mode$: Observable<VisualizationMode> = this._state$.pipe(
    map((s) => s.mode),
    distinctUntilChanged()
  );

  /**
   * Emits the full AnimationState whenever isPaused or accumulatedTimeMs changes.
   * accumulatedTimeMs is updated by AtomRendererService via tickAnimation(),
   * so this observable emits frequently during playback. Components that only
   * need isPaused should use isPaused$ instead.
   */
  readonly animationState$: Observable<AnimationState> = this._state$.pipe(
    map((s) => s.animation)
  );

  /**
   * Emits only the isPaused boolean. Preferred for UI controls that show
   * play/pause state without re-rendering on every animation tick.
   */
  readonly isPaused$: Observable<boolean> = this._state$.pipe(
    map((s) => s.animation.isPaused),
    distinctUntilChanged()
  );

  constructor(private ngZone: NgZone) {}

  // ── Mutation Methods ───────────────────────────────────────────────────────

  /**
   * Sets the selected element.
   * Visualization mode and animation state are NOT reset (per FR-020, FR-030).
   * AtomRendererService observes selectedElement$ and resets camera on change (FR-014).
   */
  selectElement(element: Element): void {
    this.ngZone.run(() => {
      this._state$.next({
        ...this._state$.value,
        selectedElement: element,
      });
    });
  }

  /**
   * Clears the current element selection (returns to null state).
   */
  clearSelection(): void {
    this.ngZone.run(() => {
      this._state$.next({
        ...this._state$.value,
        selectedElement: null,
      });
    });
  }

  /**
   * Sets the active visualization mode.
   * Does NOT affect nucleus, shell rings, detail panel, or animation state (FR-021, FR-022).
   */
  setMode(mode: VisualizationMode): void {
    this.ngZone.run(() => {
      this._state$.next({
        ...this._state$.value,
        mode,
      });
    });
  }

  /**
   * Pauses electron animation. Sets isPaused = true.
   * Does NOT modify accumulatedTimeMs — electrons freeze at current position (FR-029).
   * No-op if already paused.
   */
  pause(): void {
    if (this._state$.value.animation.isPaused) return;
    this.ngZone.run(() => {
      this._state$.next({
        ...this._state$.value,
        animation: { ...this._state$.value.animation, isPaused: true },
      });
    });
  }

  /**
   * Resumes electron animation. Sets isPaused = false.
   * No-op if already playing.
   */
  resume(): void {
    if (!this._state$.value.animation.isPaused) return;
    this.ngZone.run(() => {
      this._state$.next({
        ...this._state$.value,
        animation: { ...this._state$.value.animation, isPaused: false },
      });
    });
  }

  /**
   * Toggles between paused and playing states.
   * Convenience method for the ViewerControlsComponent pause/resume button.
   */
  togglePlayPause(): void {
    if (this._state$.value.animation.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Called by AtomRendererService on each animation frame to advance the time accumulator.
   * MUST only be called from within the render loop (outside NgZone).
   * Only increments accumulatedTimeMs when !isPaused (AD-003).
   * @param deltaMs Milliseconds elapsed since last frame. Typically 16.7ms at 60fps.
   */
  tickAnimation(deltaMs: number): void {
    const current = this._state$.value.animation;
    if (current.isPaused) return;
    // Called outside NgZone — update BehaviorSubject directly without zone.run()
    // so change detection is not triggered on every frame.
    this._state$.next({
      ...this._state$.value,
      animation: {
        ...current,
        accumulatedTimeMs: current.accumulatedTimeMs + deltaMs,
      },
    });
  }

  // ── Snapshot Accessors ─────────────────────────────────────────────────────

  /**
   * Returns the current animation state snapshot.
   * Used by AtomRendererService to read accumulatedTimeMs each frame without subscribing.
   */
  getAnimationState(): AnimationState {
    return this._state$.value.animation;
  }

  /**
   * Returns the current visualization mode snapshot.
   * Used by AtomRendererService to select the active strategy.
   */
  getMode(): VisualizationMode {
    return this._state$.value.mode;
  }
}
