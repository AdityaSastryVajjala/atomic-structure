import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { PeriodicTableComponent } from './periodic-table.component';
import { ElementCellComponent } from './element-cell/element-cell.component';
import { ElementDataService } from '../../services/element-data.service';
import { ViewerStateService } from '../../services/viewer-state.service';
import { Element } from '../../models/element.model';

// Build a minimal set of 118 fake elements for testing
function buildFakeElements(): Element[] {
  return Array.from({ length: 118 }, (_, i) => ({
    atomicNumber: i + 1,
    name: `Element${i + 1}`,
    symbol: `E${i + 1}`.slice(0, 3),
    atomicMass: (i + 1) * 2,
    shells: [i + 1],
  }));
}

const FAKE_ELEMENTS = buildFakeElements();
const CARBON = FAKE_ELEMENTS[5]; // atomicNumber 6

const mockElementDataService = {
  getAllElements: () => FAKE_ELEMENTS,
};

describe('PeriodicTableComponent', () => {
  let fixture: ComponentFixture<PeriodicTableComponent>;
  let component: PeriodicTableComponent;
  let selectedElement$: BehaviorSubject<Element | null>;

  beforeEach(async () => {
    selectedElement$ = new BehaviorSubject<Element | null>(null);

    await TestBed.configureTestingModule({
      imports: [PeriodicTableComponent],
      providers: [
        { provide: ElementDataService, useValue: mockElementDataService },
        { provide: ViewerStateService, useValue: { selectedElement$: selectedElement$.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PeriodicTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Cell count ─────────────────────────────────────────────────────────────

  it('renders exactly 118 ElementCellComponent instances', () => {
    const cells = fixture.debugElement.queryAll(By.directive(ElementCellComponent));
    expect(cells.length).toBe(118);
  });

  // ── elementSelected output ─────────────────────────────────────────────────

  it('emits elementSelected when a cell fires its selected output', () => {
    let emitted: Element | undefined;
    component.elementSelected.subscribe((el) => (emitted = el));

    const firstCell = fixture.debugElement.query(By.directive(ElementCellComponent));
    firstCell.componentInstance.selected.emit(CARBON);

    expect(emitted).toBe(CARBON);
  });

  // ── isSelected binding ─────────────────────────────────────────────────────

  it('passes isSelected=false to all cells when nothing is selected', () => {
    const cells = fixture.debugElement.queryAll(By.directive(ElementCellComponent));
    const anySelected = cells.some((c) => c.componentInstance.isSelected);
    expect(anySelected).toBeFalse();
  });

  it('passes isSelected=true only to the cell matching the selected element', () => {
    selectedElement$.next(CARBON);
    fixture.detectChanges();

    const cells = fixture.debugElement.queryAll(By.directive(ElementCellComponent));
    const selected = cells.filter((c) => c.componentInstance.isSelected);

    expect(selected.length).toBe(1);
    expect(selected[0].componentInstance.element.atomicNumber).toBe(CARBON.atomicNumber);
  });
});
