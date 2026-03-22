import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { ElementViewerComponent } from './element-viewer.component';
import { AtomRendererService } from '../../renderer/atom-renderer.service';
import { ViewerStateService } from '../../services/viewer-state.service';
import { ElementDataService } from '../../services/element-data.service';
import { Element } from '../../models/element.model';

function makeAtomRenderer(webGLSupported = true): jasmine.SpyObj<AtomRendererService> {
  return {
    isWebGLSupported: jasmine.createSpy('isWebGLSupported').and.returnValue(webGLSupported),
    init:    jasmine.createSpy('init'),
    dispose: jasmine.createSpy('dispose'),
  } as unknown as jasmine.SpyObj<AtomRendererService>;
}

function makeViewerState(): { selectedElement$: Observable<Element | null> } {
  return { selectedElement$: of(null) };
}

function makeElementData(loadError: string | null = null): { loadError: string | null } {
  return { loadError };
}

async function setup(opts: {
  webGLSupported?: boolean;
  loadError?: string | null;
}): Promise<{
  fixture: ComponentFixture<ElementViewerComponent>;
  atomRenderer: jasmine.SpyObj<AtomRendererService>;
}> {
  const atomRenderer = makeAtomRenderer(opts.webGLSupported ?? true);

  await TestBed.configureTestingModule({
    imports: [ElementViewerComponent],
    providers: [
      { provide: AtomRendererService, useValue: atomRenderer },
      { provide: ViewerStateService,  useValue: makeViewerState() },
      { provide: ElementDataService,  useValue: makeElementData(opts.loadError ?? null) },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ElementViewerComponent);
  fixture.detectChanges();            // triggers ngAfterViewInit

  return { fixture, atomRenderer };
}

function text(fixture: ComponentFixture<ElementViewerComponent>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function hasCanvas(fixture: ComponentFixture<ElementViewerComponent>): boolean {
  return !!(fixture.nativeElement as HTMLElement).querySelector('canvas');
}

// ── T055: WebGL not supported ──────────────────────────────────────────────

describe('ElementViewerComponent — WebGL not supported (T055)', () => {
  it('shows the WebGL error message', async () => {
    const { fixture } = await setup({ webGLSupported: false });
    expect(text(fixture)).toContain('Your browser does not support 3D graphics (WebGL)');
    expect(text(fixture)).toContain('Please use a modern browser');
  });

  it('hides the canvas element', async () => {
    const { fixture } = await setup({ webGLSupported: false });
    expect(hasCanvas(fixture)).toBeFalse();
  });

  it('does not call atomRenderer.init()', async () => {
    const { atomRenderer } = await setup({ webGLSupported: false });
    expect(atomRenderer.init).not.toHaveBeenCalled();
  });
});

// ── T056: Element data load error ──────────────────────────────────────────

describe('ElementViewerComponent — data load error (T056)', () => {
  const LOAD_ERR = 'Element data file not found.';

  it('shows the data load error message', async () => {
    const { fixture } = await setup({ loadError: LOAD_ERR });
    expect(text(fixture)).toContain('Could not load element data');
    expect(text(fixture)).toContain(LOAD_ERR);
    expect(text(fixture)).toContain('Refresh the page to retry');
  });

  it('hides the canvas element when data load failed', async () => {
    const { fixture } = await setup({ loadError: LOAD_ERR });
    expect(hasCanvas(fixture)).toBeFalse();
  });

  it('does not call atomRenderer.init() when data load failed', async () => {
    const { atomRenderer } = await setup({ loadError: LOAD_ERR });
    expect(atomRenderer.init).not.toHaveBeenCalled();
  });

  it('includes the specific error reason in the message', async () => {
    const { fixture } = await setup({ loadError: 'Element data could not be parsed.' });
    expect(text(fixture)).toContain('Element data could not be parsed.');
  });
});

// ── Happy path (WebGL ok, data ok) ─────────────────────────────────────────

describe('ElementViewerComponent — happy path', () => {
  it('shows the canvas when WebGL is supported and data loaded', async () => {
    const { fixture } = await setup({});
    expect(hasCanvas(fixture)).toBeTrue();
  });

  it('calls atomRenderer.init() with the canvas element', async () => {
    const { fixture, atomRenderer } = await setup({});
    expect(atomRenderer.init).toHaveBeenCalledTimes(1);
    const arg = atomRenderer.init.calls.first().args[0];
    expect(arg).toBeInstanceOf(HTMLCanvasElement);
    void fixture;
  });

  it('calls atomRenderer.dispose() on destroy', async () => {
    const { fixture, atomRenderer } = await setup({});
    fixture.destroy();
    expect(atomRenderer.dispose).toHaveBeenCalledTimes(1);
  });
});
