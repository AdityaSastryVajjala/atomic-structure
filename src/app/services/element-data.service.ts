/**
 * ElementDataService
 *
 * Provides read-only access to all 118 chemical elements.
 *
 * Data is loaded from assets/data/elements.json via Angular's HttpClient
 * during APP_INITIALIZER. After initialization, all methods are synchronous.
 *
 * This service has no write operations — element data is immutable at runtime.
 *
 * See contracts/element-data-service.md for the full public interface contract.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { Element } from '../models/element.model';

/** Raw record shape from the JSON file — matches ElementRecord in elements-json-schema.md. */
interface ElementRecord {
  atomicNumber: number;
  name: string;
  symbol: string;
  atomicMass: number;
  shells: number[];
  summary?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ElementDataService {
  private _elements: readonly Element[] = [];
  private _isLoaded = false;
  private _loadError: string | null = null;
  private _elements$ = new ReplaySubject<readonly Element[]>(1);

  /**
   * Observable that emits the full element list once loading is complete.
   * Emits exactly once and completes. Useful for components that initialize
   * before APP_INITIALIZER finishes in edge cases.
   */
  readonly elements$: Observable<readonly Element[]> = this._elements$.asObservable();

  /** True after the JSON file has been loaded and parsed successfully. */
  get isLoaded(): boolean {
    return this._isLoaded;
  }

  /** Error message if loading failed, otherwise null. */
  get loadError(): string | null {
    return this._loadError;
  }

  constructor(private http: HttpClient) {}

  /**
   * Loads assets/data/elements.json, validates all 118 records, and populates
   * the internal cache. Called once by APP_INITIALIZER before any component mounts.
   *
   * On failure: sets loadError and resolves (does NOT throw) so the app can
   * render an error message via FR-024.
   */
  load(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.http.get<ElementRecord[]>('assets/data/elements.json').subscribe({
        next: (data) => {
          try {
            this._elements = this.validateAndParse(data);
            this._isLoaded = true;
            this._loadError = null;
            this._elements$.next(this._elements);
            this._elements$.complete();
          } catch (err: unknown) {
            this._isLoaded = false;
            this._loadError = err instanceof Error ? err.message : 'Element data is incomplete (missing fields).';
          }
          resolve();
        },
        error: (err: HttpErrorResponse) => {
          this._isLoaded = false;
          if (err.status === 404) {
            this._loadError = 'Element data file not found.';
          } else if (err.status === 0 || err.error instanceof SyntaxError) {
            this._loadError = 'Element data could not be parsed.';
          } else {
            this._loadError = 'Element data file not found.';
          }
          resolve();
        },
      });
    });
  }

  /**
   * Returns all 118 elements in order of atomic number (1–118).
   * Must not be called before initialization is complete.
   * Returns a readonly reference; callers must not mutate the result.
   */
  getAllElements(): readonly Element[] {
    return this._elements;
  }

  /**
   * Returns the element with the given atomic number, or undefined if not found.
   * @param atomicNumber Integer from 1 to 118.
   */
  getElementById(atomicNumber: number): Element | undefined {
    return this._elements.find((e) => e.atomicNumber === atomicNumber);
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private validateAndParse(data: unknown): readonly Element[] {
    if (!Array.isArray(data)) {
      throw new Error('Element data is incomplete (missing fields).');
    }

    if (data.length !== 118) {
      throw new Error('Element data is incomplete (missing fields).');
    }

    const elements: Element[] = data.map((record: ElementRecord, idx: number) =>
      this.validateRecord(record, idx)
    );

    // Verify ascending atomic number order
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].atomicNumber !== i + 1) {
        throw new Error('Element data is incomplete (missing fields).');
      }
    }

    return elements;
  }

  private validateRecord(record: ElementRecord, idx: number): Element {
    if (
      !record ||
      typeof record !== 'object' ||
      !Number.isInteger(record.atomicNumber) ||
      record.atomicNumber < 1 ||
      record.atomicNumber > 118 ||
      typeof record.name !== 'string' ||
      !record.name.trim() ||
      typeof record.symbol !== 'string' ||
      record.symbol.length < 1 ||
      record.symbol.length > 3 ||
      typeof record.atomicMass !== 'number' ||
      record.atomicMass <= 0 ||
      !Array.isArray(record.shells) ||
      record.shells.length === 0 ||
      record.shells.length > 7
    ) {
      throw new Error('Element data is incomplete (missing fields).');
    }

    const shellSum = record.shells.reduce((a: number, b: number) => a + b, 0);
    if (shellSum !== record.atomicNumber) {
      throw new Error('Element data is incomplete (missing fields).');
    }

    for (const s of record.shells) {
      if (!Number.isInteger(s) || s <= 0) {
        throw new Error('Element data is incomplete (missing fields).');
      }
    }

    const element: Element = {
      atomicNumber: record.atomicNumber,
      name: record.name.trim(),
      symbol: record.symbol,
      atomicMass: record.atomicMass,
      shells: record.shells,
    };

    if (record.summary && typeof record.summary === 'string') {
      element.summary = record.summary;
    }

    return element;
  }
}
