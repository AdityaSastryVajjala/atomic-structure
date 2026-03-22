/**
 * AtomRendererService — owns the complete Three.js scene lifecycle.
 *
 * Responsibilities:
 *  - Creates WebGLRenderer, PerspectiveCamera, lights, Scene, and OrbitControls.
 *  - Runs the animation loop outside Angular's NgZone (prevents 60fps CD).
 *  - Subscribes to ViewerStateService.selectedElement$ and mode$ to drive scene updates.
 *  - Delegates electron rendering to the active RenderStrategy (Bohr or Quantum).
 *  - Delegates nucleus and shell rendering to NucleusRenderer and ShellRenderer.
 *
 * Lifecycle (called by ElementViewerComponent):
 *   ngAfterViewInit  → init(canvas)
 *   ngOnDestroy      → dispose()
 *
 * This service has NO knowledge of Angular component templates or the DOM beyond the
 * canvas element. It MUST NOT import any Angular component class.
 *
 * ── Architectural Rationale ────────────────────────────────────────────────
 *
 * AD-001 — Animation loop outside NgZone:
 *   requestAnimationFrame fires at ~60fps. If it ran inside Angular's zone, every
 *   frame would trigger Angular change detection, causing ~60 CD cycles/sec regardless
 *   of whether any Angular state changed. Running outside NgZone eliminates this
 *   overhead entirely: Three.js updates the GPU directly without touching the DOM,
 *   so CD is never needed inside the loop. State mutations that DO affect Angular
 *   (e.g. tickAnimation) call zone.run() explicitly via ViewerStateService.
 *
 * AD-002 — Strategy pattern for dual rendering modes:
 *   Bohr and Quantum produce entirely different Three.js object graphs (Mesh vs Points),
 *   different animation logic, and different GPU resource lifecycles. Encoding both
 *   in one class with conditionals would couple concerns that evolve independently.
 *   The RenderStrategy interface isolates each mode behind init/update/dispose,
 *   so AtomRendererService swaps strategies without caring about their internals.
 *   Adding a third mode (e.g. orbital wave-function) requires only a new class.
 *
 * AD-003 — Time accumulator instead of per-electron angle storage:
 *   Storing each electron's current angle and incrementing it per frame creates
 *   two problems: (a) pausing requires the loop to freeze the increment, adding
 *   conditional state to a hot path, and (b) the angle is not idempotent — calling
 *   update() twice with "the same frame" advances the angle twice. The accumulator
 *   approach passes a single `accumulatedTimeMs` value that freezes when paused
 *   (ViewerStateService.tickAnimation is a no-op when isPaused). Strategies compute
 *   positions as pure functions of time, making update() naturally idempotent and
 *   pause/resume correct by construction.
 *
 * See contracts/atom-renderer-service.md for the full public interface contract.
 */

import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { Element } from '../models/element.model';
import { ShellGeometryParams } from '../models/renderer-types';
import { ViewerStateService } from '../services/viewer-state.service';

import { NucleusRenderer } from './nucleus-renderer';
import { ShellRenderer } from './shell-renderer';
import { computeNucleusParams, computeShellGeometry } from './renderer-utils';
import { RenderStrategy } from './strategies/render-strategy.interface';
import { BohrStrategy } from './strategies/bohr-strategy';
import { QuantumStrategy } from './strategies/quantum-strategy';

// Camera defaults (contracts/atom-renderer-service.md — Camera Defaults table)
const CAM_FOV      = 45;
const CAM_NEAR     = 0.1;
const CAM_FAR      = 100;
const CAM_POSITION = new THREE.Vector3(0, 2, 14);
const CAM_TARGET   = new THREE.Vector3(0, 0, 0);
const MIN_DISTANCE = 3;
const MAX_DISTANCE = 25;

@Injectable({ providedIn: 'root' })
export class AtomRendererService implements OnDestroy {

  // Three.js core — null until init() is called
  private renderer: THREE.WebGLRenderer | null = null;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private clock!: THREE.Clock;

  // Sub-renderers
  private readonly nucleusRenderer = new NucleusRenderer();
  private readonly shellRenderer   = new ShellRenderer();

  // Active strategy (Bohr or Quantum)
  private activeStrategy: RenderStrategy | null = null;

  // Cached per-element data needed for mode switches
  private currentElement: Element | null = null;
  private currentShellParams: readonly ShellGeometryParams[] = [];

  // Animation loop control
  private running = false;
  private animFrameId: number | null = null;

  // RxJS subscriptions — set up in init(), torn down in dispose()
  private subs = new Subscription();

  constructor(
    private readonly ngZone: NgZone,
    private readonly viewerState: ViewerStateService,
  ) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Initialises the Three.js renderer on the provided canvas element.
   * Creates the WebGLRenderer, PerspectiveCamera, ambient and point lights,
   * OrbitControls, and starts the animation loop outside NgZone.
   *
   * MUST be called exactly once from ElementViewerComponent.ngAfterViewInit.
   *
   * @param canvas The HTMLCanvasElement to render into.
   */
  init(canvas: HTMLCanvasElement): void {
    if (this.renderer) return; // guard against double-init

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1117);

    // Camera
    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(CAM_FOV, aspect, CAM_NEAR, CAM_FAR);
    this.camera.position.copy(CAM_POSITION);
    this.camera.lookAt(CAM_TARGET);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const point   = new THREE.PointLight(0xffffff, 1.5, 60);
    point.position.set(5, 8, 10);
    this.scene.add(ambient, point);

    // OrbitControls (T022)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(CAM_TARGET);
    this.controls.minDistance = MIN_DISTANCE;
    this.controls.maxDistance = MAX_DISTANCE;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.update();

    // Clock
    this.clock = new THREE.Clock();

    // State subscriptions (T026)
    this.subs.add(
      this.viewerState.selectedElement$.subscribe((el) => {
        if (el) this.onElementChange(el);
      })
    );
    this.subs.add(
      this.viewerState.mode$.subscribe(() => {
        if (this.currentElement) this.onModeChange();
      })
    );

    // Animation loop (T023)
    this.startAnimationLoop();
  }

  /**
   * Resets the camera to its default position (0, 2, 14) and target (0, 0, 0).
   * Called by ViewerControlsComponent (reset button) and internally on element change.
   */
  resetCamera(): void {
    if (!this.camera || !this.controls) return;
    this.camera.position.copy(CAM_POSITION);
    this.controls.target.copy(CAM_TARGET);
    this.controls.update();
  }

  /**
   * Returns true if WebGL is available in the current browser.
   * ElementViewerComponent calls this before init() to decide whether to display
   * the no-WebGL error message (FR-023).
   */
  isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }

  /**
   * Cleans up all Three.js and RxJS resources.
   * MUST be called from ElementViewerComponent.ngOnDestroy.
   */
  dispose(): void {
    this.running = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.subs.unsubscribe();
    this.subs = new Subscription();

    this.activeStrategy?.dispose(this.scene);
    this.nucleusRenderer.dispose(this.scene);
    this.shellRenderer.dispose(this.scene);

    this.renderer?.dispose();
    this.renderer = null;

    this.activeStrategy     = null;
    this.currentElement     = null;
    this.currentShellParams = [];
  }

  ngOnDestroy(): void {
    this.dispose();
  }

  // ── Animation Loop ─────────────────────────────────────────────────────────

  /**
   * Starts the requestAnimationFrame loop outside Angular's zone (AD-001).
   * Each frame: advances the time accumulator (AD-003), updates the active
   * strategy with the new accumulatedTimeMs, updates OrbitControls damping,
   * and renders the scene.
   */
  private startAnimationLoop(): void {
    this.running = true;
    // AD-001: runOutsideAngular prevents 60fps change-detection cycles.
    this.ngZone.runOutsideAngular(() => {
      this.clock.start();
      const loop = () => {
        if (!this.running) return;
        this.animFrameId = requestAnimationFrame(loop);

        const deltaMs = this.clock.getDelta() * 1000;
        // AD-003: tickAnimation is a no-op when paused; strategies receive a
        // frozen accumulatedTimeMs and therefore produce frozen positions.
        this.viewerState.tickAnimation(deltaMs);

        const animState = this.viewerState.getAnimationState();
        this.activeStrategy?.update(animState.accumulatedTimeMs);

        this.controls?.update();
        this.renderer?.render(this.scene, this.camera);
      };
      this.animFrameId = requestAnimationFrame(loop);
    });
  }

  // ── State Change Handlers (T026) ───────────────────────────────────────────

  /**
   * Full scene rebuild for a newly selected element.
   * Sequence per contracts/atom-renderer-service.md (Element Change Sequence):
   *   1. Dispose active strategy (electrons removed).
   *   2. Dispose nucleus and shell renderers (scene down to lights only).
   *   3. Render nucleus.
   *   4. Compute and render shell rings.
   *   5. Init strategy for current mode.
   *   6. Reset camera.
   */
  private onElementChange(element: Element): void {
    this.activeStrategy?.dispose(this.scene);
    this.nucleusRenderer.dispose(this.scene);
    this.shellRenderer.dispose(this.scene);

    this.currentElement     = element;
    this.currentShellParams = computeShellGeometry(element);

    this.nucleusRenderer.render(computeNucleusParams(element), this.scene);
    this.shellRenderer.renderAll(this.currentShellParams, this.scene);

    this.activeStrategy = this.buildStrategy(this.viewerState.getMode());
    this.activeStrategy.init(element, this.scene, this.currentShellParams);

    this.resetCamera();
  }

  /**
   * Electron-only rebuild for a visualization mode switch.
   * Sequence per contracts/atom-renderer-service.md (Mode Switch Sequence):
   *   1. Dispose active strategy (electrons removed; nucleus + shells untouched).
   *   2. Construct new strategy for the new mode.
   *   3. Init new strategy with cached element and shellParams.
   *   accumulatedTimeMs and camera are NOT reset.
   */
  private onModeChange(): void {
    if (!this.currentElement) return;
    this.activeStrategy?.dispose(this.scene);
    this.activeStrategy = this.buildStrategy(this.viewerState.getMode());
    this.activeStrategy.init(this.currentElement, this.scene, this.currentShellParams);
  }

  // ── Strategy Factory ───────────────────────────────────────────────────────

  /**
   * Constructs the appropriate RenderStrategy for the given mode (AD-002).
   * Returns BohrStrategy for 'bohr', QuantumStrategy for 'quantum'.
   */
  private buildStrategy(mode: string): RenderStrategy {
    return mode === 'quantum' ? new QuantumStrategy() : new BohrStrategy();
  }
}
