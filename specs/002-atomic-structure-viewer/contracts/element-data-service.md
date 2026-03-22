# Contract: ElementDataService

**File**: `src/app/services/element-data.service.ts`
**Consumers**: `PeriodicTableComponent`, `AtomRendererService` (indirectly via ViewerStateService)
**Purpose**: Load, validate, and provide read-only access to the bundled elements dataset.
Loads `assets/data/elements.json` once at application startup and caches the result.

---

## TypeScript Interface

```typescript
/**
 * Provides read-only access to all 118 chemical elements.
 *
 * Data is loaded from assets/data/elements.json via Angular's HttpClient
 * during APP_INITIALIZER. After initialization, all methods are synchronous.
 *
 * This service has no write operations — element data is immutable at runtime.
 */
@Injectable({ providedIn: 'root' })
export class ElementDataService {

  /**
   * Returns all 118 elements in order of atomic number (1–118).
   * MUST NOT be called before initialization is complete.
   * Returns a readonly reference; callers MUST NOT mutate the result.
   */
  getAllElements(): readonly Element[];

  /**
   * Returns the element with the given atomic number, or undefined if not found.
   * @param atomicNumber Integer from 1 to 118.
   */
  getElementById(atomicNumber: number): Element | undefined;

  /**
   * Observable that emits the full element list once loading is complete.
   * Emits exactly once and completes. Useful for components that initialize
   * before APP_INITIALIZER finishes in edge cases.
   */
  readonly elements$: Observable<readonly Element[]>;

  /**
   * True after the JSON file has been loaded and parsed successfully.
   * False during and after a load failure.
   */
  readonly isLoaded: boolean;

  /**
   * Error message if loading failed, otherwise null.
   * Populated after a failed HTTP request or JSON parse error.
   */
  readonly loadError: string | null;
}
```

---

## Initialization Contract

`ElementDataService` MUST be registered as an `APP_INITIALIZER` provider so that element
data is available before any component renders. The initializer returns a `Promise` that
resolves after the JSON is loaded and validated.

```typescript
// In app.config.ts:
{
  provide: APP_INITIALIZER,
  useFactory: (svc: ElementDataService) => () => svc.load(),
  deps: [ElementDataService],
  multi: true
}
```

The `load()` method (internal, not part of the public interface) fetches
`assets/data/elements.json`, validates all 118 records, sets `isLoaded = true`,
and populates the internal cache. On failure, it sets `loadError` and does NOT throw
(the error is surfaced via the `loadError` property and displayed via FR-024).

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| JSON file not found (404) | Sets `loadError = 'Element data file not found.'`; `isLoaded = false` |
| Malformed JSON | Sets `loadError = 'Element data could not be parsed.'`; `isLoaded = false` |
| Missing required fields | Sets `loadError = 'Element data is incomplete (missing fields).'`; `isLoaded = false` |
| Successful load | Sets `isLoaded = true`; `loadError = null` |

All callers MUST check `isLoaded` before calling `getAllElements()` or `getElementById()`.
The `ElementViewerComponent` displays the `loadError` string when `!isLoaded`.
