# Contract: Component Inputs, Outputs & Responsibilities

**Branch**: `002-atomic-structure-viewer` | **Date**: 2026-03-22
**Purpose**: Documents the Angular component tree, each component's single responsibility,
and all `@Input`/`@Output` bindings. All components are standalone (no NgModules).

---

## Component Tree

```text
AppComponent                        # Layout shell
├── PeriodicTableComponent          # Full 118-element grid
│   └── ElementCellComponent        # Single clickable element cell (×118)
└── [Right panel]
    ├── ElementViewerComponent      # Three.js canvas host
    ├── ViewerControlsComponent     # Pause/resume, reset, mode toggle
    └── ElementDetailComponent      # Educational data panel
```

---

## AppComponent

**File**: `src/app/app.component.ts`
**Responsibility**: Root layout shell. Arranges the periodic table on the left and the
viewer panel (viewer + controls + detail) on the right. Listens for element selection
events from `PeriodicTableComponent` and forwards them to `ViewerStateService`.

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  // No @Input / @Output — root component
})
export class AppComponent {
  // Injects: ViewerStateService
  // Template binds: (elementSelected) from PeriodicTableComponent → selectElement()
}
```

---

## PeriodicTableComponent

**File**: `src/app/components/periodic-table/periodic-table.component.ts`
**Responsibility**: Renders the 118-element grid in standard periodic table layout.
Tracks which element is currently selected (to highlight the active cell). Emits
`elementSelected` when the user clicks a cell.

```typescript
@Component({
  selector: 'app-periodic-table',
  standalone: true,
  imports: [ElementCellComponent],
})
export class PeriodicTableComponent {
  // Injects: ElementDataService (to get all 118 elements)
  //          ViewerStateService (to observe selectedElement$ for highlight state)

  /** Emits the clicked element to the parent (AppComponent). */
  @Output() elementSelected = new EventEmitter<Element>();

  // No @Input — data comes entirely from ElementDataService.
}
```

---

## ElementCellComponent

**File**: `src/app/components/periodic-table/element-cell/element-cell.component.ts`
**Responsibility**: Renders one element cell showing symbol and atomic number.
Emits a click event. Applies a selected visual style when `isSelected` is true.
This is a pure presentational component with no service dependencies.

```typescript
@Component({
  selector: 'app-element-cell',
  standalone: true,
})
export class ElementCellComponent {
  /** The element this cell represents. Required. */
  @Input({ required: true }) element!: Element;

  /** Whether this cell is the currently selected element. Drives CSS highlight. */
  @Input() isSelected = false;

  /** Emits this cell's element when the user clicks it. */
  @Output() selected = new EventEmitter<Element>();
}
```

---

## ElementViewerComponent

**File**: `src/app/components/element-viewer/element-viewer.component.ts`
**Responsibility**: Hosts the `<canvas>` element used by Three.js. Checks WebGL
support; shows error message if unsupported. Passes canvas reference to
`AtomRendererService.init()` in `ngAfterViewInit`. Calls `dispose()` in `ngOnDestroy`.
Listens to `ElementDataService.loadError` to show data load errors.

```typescript
@Component({
  selector: 'app-element-viewer',
  standalone: true,
  template: `
    <canvas #viewerCanvas [hidden]="hasError"></canvas>
    <div class="error-overlay" *ngIf="hasError">{{ errorMessage }}</div>
    <div class="nucleus-label" *ngIf="!hasError && elementSelected">Nucleus (simplified)</div>
  `,
})
export class ElementViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('viewerCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // Injects: AtomRendererService, ElementDataService, NgZone
  // No @Input / @Output — reads state from services, not from parent

  protected hasError = false;
  protected errorMessage = '';
}
```

**Note**: The "Nucleus (simplified)" overlay label is rendered as HTML over the canvas
(not as Three.js text) per research decision R-006. It is only shown when an element is
selected and no error is present.

---

## ViewerControlsComponent

**File**: `src/app/components/viewer-controls/viewer-controls.component.ts`
**Responsibility**: Renders the three viewer controls: pause/resume toggle, camera reset,
and visualization mode toggle. Reads state from `ViewerStateService`; writes back via
service methods. No service dependencies on the renderer directly.

```typescript
@Component({
  selector: 'app-viewer-controls',
  standalone: true,
})
export class ViewerControlsComponent {
  // Injects: ViewerStateService, AtomRendererService (for resetCamera() only)

  // Observes: isPaused$ (for button icon/label), mode$ (for toggle state)
  // Calls:    viewerState.togglePlayPause(), viewerState.setMode(), renderer.resetCamera()

  // No @Input / @Output — communicates only via services
}
```

**Control descriptions**:

| Control | Behaviour | FR |
|---------|-----------|-----|
| Pause/Resume button | Calls `viewerState.togglePlayPause()`; label/icon reflects `isPaused$` | FR-028, FR-029 |
| Reset Camera button | Calls `atomRenderer.resetCamera()` | FR-013 |
| Mode toggle | Calls `viewerState.setMode('bohr' \| 'quantum')`; reflects current `mode$` | FR-017 |

---

## ElementDetailComponent

**File**: `src/app/components/element-detail/element-detail.component.ts`
**Responsibility**: Displays the educational data panel for the selected element.
Shows name, symbol, atomic number, atomic mass, and simplified electron configuration.
Shows a placeholder/empty state when no element is selected.
Also shows the quantum-mode disclaimer when mode is 'quantum'.

```typescript
@Component({
  selector: 'app-element-detail',
  standalone: true,
})
export class ElementDetailComponent {
  // Injects: ViewerStateService

  // Observes: selectedElement$ (for all five data fields)
  //           mode$ (to show quantum disclaimer)

  // No @Input / @Output — communicates only via ViewerStateService
}
```

**Displayed fields** (all sourced from the selected `Element`):

| Field | Source | Display example |
|-------|--------|-----------------|
| Name | `element.name` | "Sodium" |
| Symbol | `element.symbol` | "Na" |
| Atomic Number | `element.atomicNumber` | "11" |
| Atomic Mass | `element.atomicMass` | "22.990 u" |
| Electron Configuration | `getConfigurationString(element)` | "2, 8, 1" |
| Quantum disclaimer | Shown when `mode === 'quantum'` | "Quantum view is illustrative — not physically exact" |

---

## Data Flow Summary

```text
User clicks element cell
  → ElementCellComponent emits selected(element)
  → PeriodicTableComponent emits elementSelected(element)
  → AppComponent calls viewerState.selectElement(element)
  → ViewerStateService.selectedElement$ emits
  → AtomRendererService (subscriber): re-renders scene
  → ElementDetailComponent (subscriber): updates panel
  → PeriodicTableComponent (subscriber): updates highlight

User clicks pause button
  → ViewerControlsComponent calls viewerState.togglePlayPause()
  → ViewerStateService.isPaused$ emits
  → ViewerControlsComponent: updates button icon
  → AtomRendererService: render loop reads isPaused from getAnimationState()

User clicks mode toggle
  → ViewerControlsComponent calls viewerState.setMode('quantum')
  → ViewerStateService.mode$ emits
  → AtomRendererService (subscriber): switches strategy
  → ElementDetailComponent (subscriber): shows quantum disclaimer
```
