# Contract: AtomRendererService

**File**: `src/app/renderer/atom-renderer.service.ts`
**Consumer**: `ElementViewerComponent` (sole Angular consumer)
**Purpose**: Owns the complete Three.js scene lifecycle — WebGLRenderer, camera, lights,
OrbitControls, and the animation loop. Delegates electron rendering to the active
`RenderStrategy`. Subscribes to `ViewerStateService` observables to react to element
changes and mode switches. All Three.js work runs outside Angular's NgZone.

---

## TypeScript Interface

```typescript
/**
 * Manages the Three.js scene for atomic structure visualization.
 *
 * Lifecycle:
 *   1. ElementViewerComponent calls init(canvas) in ngAfterViewInit.
 *   2. AtomRendererService creates the WebGLRenderer, scene, camera, OrbitControls,
 *      and starts the animation loop.
 *   3. The service subscribes to ViewerStateService.selectedElement$ and mode$.
 *   4. On element change: clears scene, computes shell geometry, calls strategy.init().
 *   5. On mode change: calls strategy.dispose(), creates new strategy, calls strategy.init().
 *   6. ElementViewerComponent calls dispose() in ngOnDestroy.
 *
 * This service has NO knowledge of Angular component templates or the DOM outside
 * the canvas element. It must not import any Angular component.
 */
@Injectable({ providedIn: 'root' })
export class AtomRendererService {

  /**
   * Initializes the Three.js renderer on the provided canvas element.
   * Creates the WebGLRenderer, PerspectiveCamera, ambient and point lights,
   * and OrbitControls. Starts the animation loop (outside NgZone).
   *
   * MUST be called exactly once before any other method.
   * MUST be called from within ngAfterViewInit (canvas must be in the DOM).
   *
   * @param canvas The HTMLCanvasElement to render into.
   * @throws Error if canvas is null or WebGL context cannot be created.
   */
  init(canvas: HTMLCanvasElement): void;

  /**
   * Resets the camera to its default position and orientation.
   * Called by ViewerControlsComponent (reset button, FR-013) and internally
   * on every element change (FR-014).
   */
  resetCamera(): void;

  /**
   * Returns true if WebGL is available in the current browser environment.
   * Called by ElementViewerComponent before init() to decide whether to show
   * the error message (FR-023).
   */
  isWebGLSupported(): boolean;

  /**
   * Cleans up all Three.js resources: disposes geometries, materials, textures,
   * calls renderer.dispose(), and cancels the animation frame loop.
   * MUST be called from ngOnDestroy of ElementViewerComponent.
   */
  dispose(): void;
}
```

---

## Internal Behaviour (not part of the public interface, documented for maintainability)

### Animation Loop

```text
requestAnimationFrame(loop)
  deltaMs = clock.getDelta() * 1000
  viewerState.tickAnimation(deltaMs)            // advances accumulatedTimeMs if !isPaused
  animState = viewerState.getAnimationState()
  activeStrategy.update(animState.accumulatedTimeMs)
  orbitControls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(loop)                   // always re-schedules (no pause to RAF)
```

### Element Change Sequence

```text
selectedElement$ emits new element
  → activeStrategy.dispose(scene)
  → clearSceneExceptLights()
  → nucleusRenderer.render(element, scene)
  → shellParams = computeShellGeometry(element)
  → shellRenderer.renderAll(shellParams, scene)
  → activeStrategy.init(element, scene, shellParams)
  → resetCamera()
```

### Mode Switch Sequence

```text
mode$ emits new mode
  → activeStrategy.dispose(scene)
  → removeElectronsFromScene()               // nucleus + rings remain
  → activeStrategy = new BohrStrategy() | new QuantumStrategy()
  → activeStrategy.init(element, scene, shellParams)
  // accumulatedTimeMs is NOT reset (AD-003)
  // camera is NOT reset (FR-022)
```

---

## Camera Defaults

| Parameter | Value |
|-----------|-------|
| Type | PerspectiveCamera |
| FOV | 45° |
| Near clip | 0.1 |
| Far clip | 100 |
| Default position | (0, 2, 14) — slightly above, facing origin |
| OrbitControls target | (0, 0, 0) |
| Min distance | 3 |
| Max distance | 25 |

---

## WebGL Error Handling

If `isWebGLSupported()` returns false, `ElementViewerComponent` MUST NOT call `init()`.
It MUST display the error message required by FR-023. `AtomRendererService.init()` itself
will throw if called on an unsupported browser as a safety guard, but this path should
not be reached in normal usage.
