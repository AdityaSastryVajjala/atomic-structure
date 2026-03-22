import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ElementDetailComponent } from './element-detail.component';
import { ViewerStateService } from '../../services/viewer-state.service';
import { Element } from '../../models/element.model';
import { VisualizationMode } from '../../models/viewer-state.model';

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

const oganesson: Element = {
  atomicNumber: 118,
  name: 'Oganesson',
  symbol: 'Og',
  atomicMass: 294.0,
  shells: [2, 8, 18, 32, 32, 18, 8],
};

describe('ElementDetailComponent', () => {
  let fixture: ComponentFixture<ElementDetailComponent>;
  let selectedElement$: BehaviorSubject<Element | null>;
  let mode$: BehaviorSubject<VisualizationMode>;

  beforeEach(async () => {
    selectedElement$ = new BehaviorSubject<Element | null>(null);
    mode$            = new BehaviorSubject<VisualizationMode>('bohr');

    await TestBed.configureTestingModule({
      imports: [ElementDetailComponent],
      providers: [
        {
          provide: ViewerStateService,
          useValue: {
            selectedElement$: selectedElement$.asObservable(),
            mode$: mode$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ElementDetailComponent);
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  // ── Null selection ─────────────────────────────────────────────────────────

  it('shows placeholder text when no element is selected', () => {
    fixture.detectChanges();
    expect(text()).toContain('Select an element');
  });

  it('shows no element name/symbol when nothing is selected', () => {
    fixture.detectChanges();
    expect(text()).not.toContain('Carbon');
    expect(text()).not.toContain('Sodium');
  });

  // ── Carbon selected ────────────────────────────────────────────────────────

  it('displays name for Carbon', () => {
    selectedElement$.next(carbon);
    fixture.detectChanges();
    expect(text()).toContain('Carbon');
  });

  it('displays symbol for Carbon', () => {
    selectedElement$.next(carbon);
    fixture.detectChanges();
    expect(text()).toContain('C');
  });

  it('displays atomic number for Carbon', () => {
    selectedElement$.next(carbon);
    fixture.detectChanges();
    expect(text()).toContain('6');
  });

  it('displays atomic mass with "u" unit for Carbon', () => {
    selectedElement$.next(carbon);
    fixture.detectChanges();
    expect(text()).toContain('12.011');
    expect(text()).toContain('u');
  });

  it('displays electron configuration "2, 4" for Carbon', () => {
    selectedElement$.next(carbon);
    fixture.detectChanges();
    expect(text()).toContain('2, 4');
  });

  // ── Switching elements ─────────────────────────────────────────────────────

  it('updates all fields when switching from Carbon to Sodium', () => {
    selectedElement$.next(carbon);
    fixture.detectChanges();

    selectedElement$.next(sodium);
    fixture.detectChanges();

    expect(text()).toContain('Sodium');
    expect(text()).toContain('Na');
    expect(text()).toContain('11');
    expect(text()).toContain('22.99');
    expect(text()).toContain('2, 8, 1');
    expect(text()).not.toContain('Carbon');
  });

  it('shows no residual Carbon data after switching to Sodium', () => {
    selectedElement$.next(carbon);
    fixture.detectChanges();
    selectedElement$.next(sodium);
    fixture.detectChanges();
    expect(text()).not.toContain('12.011');
  });

  // ── Oganesson configuration ────────────────────────────────────────────────

  it('displays electron configuration "2, 8, 18, 32, 32, 18, 8" for Oganesson', () => {
    selectedElement$.next(oganesson);
    fixture.detectChanges();
    expect(text()).toContain('2, 8, 18, 32, 32, 18, 8');
  });

  // ── Quantum-mode disclaimer (T052) ─────────────────────────────────────────

  it('hides disclaimer in Bohr mode', () => {
    selectedElement$.next(carbon);
    fixture.detectChanges();
    expect(text()).not.toContain('illustrative');
  });

  it('shows disclaimer when mode switches to quantum', () => {
    selectedElement$.next(carbon);
    mode$.next('quantum');
    fixture.detectChanges();
    expect(text()).toContain('illustrative');
    expect(text()).toContain('not physically exact');
  });

  it('hides disclaimer when mode switches back to bohr', () => {
    selectedElement$.next(carbon);
    mode$.next('quantum');
    fixture.detectChanges();
    mode$.next('bohr');
    fixture.detectChanges();
    expect(text()).not.toContain('illustrative');
  });

  it('does not show disclaimer when no element is selected even in quantum mode', () => {
    mode$.next('quantum');
    fixture.detectChanges();
    // placeholder state — disclaimer is inside the @if(selectedElement) block
    expect(text()).toContain('Select an element');
    expect(text()).not.toContain('illustrative');
  });
});
