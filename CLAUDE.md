# atomic-structure Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-22

## Active Technologies

- TypeScript 5.x (via Angular 19, standalone component architecture) + Angular 19, Three.js (latest stable, 0.170+), RxJS 7.x (bundled) (002-atomic-structure-viewer)

## Project Structure

```text
src/app/
  components/     # Angular standalone components (periodic-table, element-viewer, element-detail, viewer-controls)
  renderer/       # Pure Three.js layer — NO Angular imports (atom-renderer.service, strategies/, nucleus-renderer, shell-renderer)
  services/       # Angular services (element-data.service, viewer-state.service)
  models/         # TypeScript types (element.model, viewer-state.model)
src/assets/data/
  elements.json   # Bundled static element data (118 elements)
specs/
  002-atomic-structure-viewer/  # Plan, research, data-model, contracts, quickstart
```

## Commands

```bash
ng serve          # Dev server at localhost:4200
ng test           # Jasmine + Karma unit tests
ng build --configuration production  # Static build → dist/
```

## Code Style

- Angular 19 standalone components (no NgModules)
- Three.js renderer layer must have zero Angular imports
- Animation loop must run outside NgZone: ngZone.runOutsideAngular(() => ...)
- RxJS observables for all cross-component state (via ViewerStateService)
- Strategy pattern for dual rendering modes (BohrStrategy / QuantumStrategy)

## Recent Changes

- 002-atomic-structure-viewer: Added TypeScript 5.x (via Angular 19, standalone component architecture) + Angular 19, Three.js (latest stable, 0.170+), RxJS 7.x (bundled)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
