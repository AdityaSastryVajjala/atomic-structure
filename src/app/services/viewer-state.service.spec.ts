import { TestBed } from '@angular/core/testing';
import { ViewerStateService } from './viewer-state.service';
import { Element } from '../models/element.model';

const carbon: Element = {
  atomicNumber: 6,
  name: 'Carbon',
  symbol: 'C',
  atomicMass: 12.011,
  shells: [2, 4],
};

const sodium: Element = {
  atomicNumber: 11,
  name: 'Sodium',
  symbol: 'Na',
  atomicMass: 22.990,
  shells: [2, 8, 1],
};

describe('ViewerStateService', () => {
  let service: ViewerStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewerStateService);
  });

  // ── Initial state ────────────────────────────────────────────────────────

  it('initialises with null selectedElement, bohr mode, not paused, accumulatedTimeMs=0', () => {
    let element: Element | null | undefined;
    service.selectedElement$.subscribe((e) => (element = e));
    expect(element).toBeNull();

    let mode: string | undefined;
    service.mode$.subscribe((m) => (mode = m));
    expect(mode).toBe('bohr');

    const anim = service.getAnimationState();
    expect(anim.isPaused).toBeFalse();
    expect(anim.accumulatedTimeMs).toBe(0);
  });

  // ── selectElement ────────────────────────────────────────────────────────

  it('selectElement() updates selectedElement$', () => {
    let emitted: Element | null | undefined;
    service.selectedElement$.subscribe((e) => (emitted = e));

    service.selectElement(carbon);
    expect(emitted).toBe(carbon);
  });

  it('selectElement() does not change mode', () => {
    service.setMode('quantum');
    service.selectElement(carbon);
    expect(service.getMode()).toBe('quantum');
  });

  it('selectElement() does not change isPaused', () => {
    service.pause();
    service.selectElement(carbon);
    expect(service.getAnimationState().isPaused).toBeTrue();
  });

  it('selectElement() does not change accumulatedTimeMs', () => {
    service.tickAnimation(100);
    service.selectElement(carbon);
    expect(service.getAnimationState().accumulatedTimeMs).toBe(100);
  });

  it('selectElement() can switch between elements', () => {
    service.selectElement(carbon);
    service.selectElement(sodium);

    let emitted: Element | null | undefined;
    service.selectedElement$.subscribe((e) => (emitted = e));
    expect(emitted).toBe(sodium);
  });

  // ── clearSelection ───────────────────────────────────────────────────────

  it('clearSelection() sets selectedElement$ to null', () => {
    service.selectElement(carbon);
    service.clearSelection();

    let emitted: Element | null | undefined;
    service.selectedElement$.subscribe((e) => (emitted = e));
    expect(emitted).toBeNull();
  });

  // ── setMode ──────────────────────────────────────────────────────────────

  it('setMode("quantum") changes mode$', () => {
    let mode: string | undefined;
    service.mode$.subscribe((m) => (mode = m));

    service.setMode('quantum');
    expect(mode).toBe('quantum');
  });

  it('setMode() does not affect selectedElement', () => {
    service.selectElement(carbon);
    service.setMode('quantum');

    let emitted: Element | null | undefined;
    service.selectedElement$.subscribe((e) => (emitted = e));
    expect(emitted).toBe(carbon);
  });

  it('setMode() does not affect isPaused', () => {
    service.pause();
    service.setMode('quantum');
    expect(service.getAnimationState().isPaused).toBeTrue();
  });

  it('setMode() does not affect accumulatedTimeMs', () => {
    service.tickAnimation(50);
    service.setMode('quantum');
    expect(service.getAnimationState().accumulatedTimeMs).toBe(50);
  });

  // ── pause ────────────────────────────────────────────────────────────────

  it('pause() sets isPaused to true', () => {
    service.pause();
    expect(service.getAnimationState().isPaused).toBeTrue();
  });

  it('pause() emits on isPaused$', () => {
    const states: boolean[] = [];
    service.isPaused$.subscribe((v) => states.push(v));

    service.pause();
    expect(states).toContain(true);
  });

  it('pause() does not change accumulatedTimeMs', () => {
    service.tickAnimation(200);
    service.pause();
    expect(service.getAnimationState().accumulatedTimeMs).toBe(200);
  });

  it('pause() is a no-op when already paused', () => {
    service.pause();
    const states: boolean[] = [];
    service.isPaused$.subscribe((v) => states.push(v));

    service.pause(); // second call
    // distinctUntilChanged means no second emission
    expect(states.length).toBe(1);
  });

  // ── resume ───────────────────────────────────────────────────────────────

  it('resume() sets isPaused to false', () => {
    service.pause();
    service.resume();
    expect(service.getAnimationState().isPaused).toBeFalse();
  });

  it('resume() is a no-op when already playing', () => {
    // already playing at init
    const states: boolean[] = [];
    service.isPaused$.subscribe((v) => states.push(v));

    service.resume(); // should be no-op
    expect(states.length).toBe(1); // only the initial emit
  });

  // ── togglePlayPause ──────────────────────────────────────────────────────

  it('togglePlayPause() pauses when playing', () => {
    service.togglePlayPause();
    expect(service.getAnimationState().isPaused).toBeTrue();
  });

  it('togglePlayPause() resumes when paused', () => {
    service.pause();
    service.togglePlayPause();
    expect(service.getAnimationState().isPaused).toBeFalse();
  });

  it('togglePlayPause() alternates state correctly on repeated calls', () => {
    expect(service.getAnimationState().isPaused).toBeFalse();
    service.togglePlayPause();
    expect(service.getAnimationState().isPaused).toBeTrue();
    service.togglePlayPause();
    expect(service.getAnimationState().isPaused).toBeFalse();
  });

  // ── tickAnimation ────────────────────────────────────────────────────────

  it('tickAnimation() increments accumulatedTimeMs when playing', () => {
    service.tickAnimation(16);
    expect(service.getAnimationState().accumulatedTimeMs).toBe(16);
  });

  it('tickAnimation() accumulates across multiple calls', () => {
    service.tickAnimation(16);
    service.tickAnimation(16);
    service.tickAnimation(16);
    expect(service.getAnimationState().accumulatedTimeMs).toBe(48);
  });

  it('tickAnimation() does NOT increment when paused', () => {
    service.tickAnimation(100); // playing → 100
    service.pause();
    service.tickAnimation(16); // paused → no change
    expect(service.getAnimationState().accumulatedTimeMs).toBe(100);
  });

  it('tickAnimation() does not change selectedElement, mode, or isPaused', () => {
    service.selectElement(carbon);
    service.setMode('quantum');
    service.tickAnimation(32);

    let el: Element | null | undefined;
    service.selectedElement$.subscribe((e) => (el = e));
    expect(el).toBe(carbon);
    expect(service.getMode()).toBe('quantum');
    expect(service.getAnimationState().isPaused).toBeFalse();
  });

  // ── getAnimationState / getMode snapshots ────────────────────────────────

  it('getAnimationState() returns current snapshot synchronously', () => {
    service.tickAnimation(42);
    const snap = service.getAnimationState();
    expect(snap.accumulatedTimeMs).toBe(42);
    expect(snap.isPaused).toBeFalse();
  });

  it('getMode() returns current mode synchronously', () => {
    service.setMode('quantum');
    expect(service.getMode()).toBe('quantum');
  });
});
