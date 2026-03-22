import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ElementDataService } from './element-data.service';

/** Build a minimal valid ElementRecord array of exactly 118 entries. */
function buildValidRecords(): object[] {
  const records = [];
  for (let z = 1; z <= 118; z++) {
    // Symbol must be 1–3 chars; slice keeps it within bounds for all z 1–118.
    const symbol = `E${z}`.slice(0, 3);
    records.push({
      atomicNumber: z,
      name: `Element ${z}`,
      symbol,
      atomicMass: z * 2.0,
      shells: [z], // single-shell with all electrons — simplest valid config
    });
  }
  return records;
}

describe('ElementDataService', () => {
  let service: ElementDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ElementDataService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ElementDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // -------------------------------------------------------------------------
  // Successful load
  // -------------------------------------------------------------------------

  it('populates cache and sets isLoaded=true after successful load', async () => {
    const loadPromise = service.load();

    const req = httpMock.expectOne('assets/data/elements.json');
    req.flush(buildValidRecords());

    await loadPromise;

    expect(service.isLoaded).toBeTrue();
    expect(service.loadError).toBeNull();
  });

  it('getAllElements() returns 118 elements after successful load', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('assets/data/elements.json').flush(buildValidRecords());
    await loadPromise;

    expect(service.getAllElements().length).toBe(118);
  });

  it('getAllElements() returns elements in ascending atomic number order', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('assets/data/elements.json').flush(buildValidRecords());
    await loadPromise;

    const elements = service.getAllElements();
    for (let i = 0; i < elements.length; i++) {
      expect(elements[i].atomicNumber).toBe(i + 1);
    }
  });

  it('getElementById(1) returns element with atomicNumber 1', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('assets/data/elements.json').flush(buildValidRecords());
    await loadPromise;

    const el = service.getElementById(1);
    expect(el).toBeDefined();
    expect(el!.atomicNumber).toBe(1);
  });

  it('getElementById(999) returns undefined', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('assets/data/elements.json').flush(buildValidRecords());
    await loadPromise;

    expect(service.getElementById(999)).toBeUndefined();
  });

  it('elements$ emits once after successful load', async () => {
    let emittedCount = -1;
    service.elements$.subscribe((els) => (emittedCount = els.length));

    const loadPromise = service.load();
    httpMock.expectOne('assets/data/elements.json').flush(buildValidRecords());
    await loadPromise;

    expect(emittedCount).toBe(118);
  });

  // -------------------------------------------------------------------------
  // HTTP 404
  // -------------------------------------------------------------------------

  it('sets loadError and isLoaded=false on HTTP 404', async () => {
    const loadPromise = service.load();

    httpMock.expectOne('assets/data/elements.json').flush(null, {
      status: 404,
      statusText: 'Not Found',
    });

    await loadPromise;

    expect(service.isLoaded).toBeFalse();
    expect(service.loadError).toBe('Element data file not found.');
  });

  // -------------------------------------------------------------------------
  // Malformed JSON / missing fields
  // -------------------------------------------------------------------------

  it('sets loadError and isLoaded=false when response is not an array', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('assets/data/elements.json').flush({ not: 'an array' });
    await loadPromise;

    expect(service.isLoaded).toBeFalse();
    expect(service.loadError).toBeTruthy();
  });

  it('sets loadError and isLoaded=false when record count is not 118', async () => {
    const loadPromise = service.load();
    httpMock.expectOne('assets/data/elements.json').flush([{ atomicNumber: 1 }]);
    await loadPromise;

    expect(service.isLoaded).toBeFalse();
    expect(service.loadError).toBeTruthy();
  });

  it('sets loadError and isLoaded=false when a record has missing required fields', async () => {
    const records = buildValidRecords();
    // Corrupt one record
    (records[5] as Record<string, unknown>)['name'] = '';

    const loadPromise = service.load();
    httpMock.expectOne('assets/data/elements.json').flush(records);
    await loadPromise;

    expect(service.isLoaded).toBeFalse();
    expect(service.loadError).toBeTruthy();
  });
});
