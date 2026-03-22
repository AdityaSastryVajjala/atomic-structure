import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ViewerControlsComponent } from './viewer-controls.component';
import { ViewerStateService } from '../../services/viewer-state.service';
import { AtomRendererService } from '../../renderer/atom-renderer.service';
import { VisualizationMode } from '../../models/viewer-state.model';

describe('ViewerControlsComponent', () => {
  let fixture: ComponentFixture<ViewerControlsComponent>;
  let isPaused$: BehaviorSubject<boolean>;
  let mode$: BehaviorSubject<VisualizationMode>;
  let mockViewerState: {
    isPaused$: unknown;
    mode$: unknown;
    togglePlayPause: jasmine.Spy;
    setMode: jasmine.Spy;
  };
  let mockAtomRenderer: { resetCamera: jasmine.Spy };

  beforeEach(async () => {
    isPaused$ = new BehaviorSubject<boolean>(false);
    mode$     = new BehaviorSubject<VisualizationMode>('bohr');

    mockViewerState = {
      isPaused$:        isPaused$.asObservable(),
      mode$:            mode$.asObservable(),
      togglePlayPause:  jasmine.createSpy('togglePlayPause'),
      setMode:          jasmine.createSpy('setMode'),
    };

    mockAtomRenderer = {
      resetCamera: jasmine.createSpy('resetCamera'),
    };

    await TestBed.configureTestingModule({
      imports: [ViewerControlsComponent],
      providers: [
        { provide: ViewerStateService, useValue: mockViewerState },
        { provide: AtomRendererService, useValue: mockAtomRenderer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewerControlsComponent);
    fixture.detectChanges();
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
  }

  // ── Initial state (playing, Bohr mode) ────────────────────────────────────

  it('shows Pause label when animation is playing', () => {
    expect(text()).toContain('Pause');
    expect(text()).not.toContain('Resume');
  });

  it('shows Reset Camera button', () => {
    expect(text()).toContain('Reset Camera');
  });

  it('shows Bohr mode label when in Bohr mode', () => {
    expect(text()).toContain('Bohr');
    expect(text()).not.toContain('Quantum');
  });

  // ── Pause/resume label toggles ─────────────────────────────────────────────

  it('shows Resume label when isPaused$ emits true', () => {
    isPaused$.next(true);
    fixture.detectChanges();
    expect(text()).toContain('Resume');
    expect(text()).not.toContain('Pause');
  });

  it('switches back to Pause label when isPaused$ emits false again', () => {
    isPaused$.next(true);
    fixture.detectChanges();
    isPaused$.next(false);
    fixture.detectChanges();
    expect(text()).toContain('Pause');
    expect(text()).not.toContain('Resume');
  });

  // ── Mode label toggles ────────────────────────────────────────────────────

  it('shows Quantum label when mode$ emits quantum', () => {
    mode$.next('quantum');
    fixture.detectChanges();
    expect(text()).toContain('Quantum');
    expect(text()).not.toContain('Bohr');
  });

  it('switches back to Bohr label when mode$ returns to bohr', () => {
    mode$.next('quantum');
    fixture.detectChanges();
    mode$.next('bohr');
    fixture.detectChanges();
    expect(text()).toContain('Bohr');
    expect(text()).not.toContain('Quantum');
  });

  // ── Button interactions ───────────────────────────────────────────────────

  it('calls togglePlayPause() when pause/resume button is clicked', () => {
    buttons()[0].click();
    expect(mockViewerState.togglePlayPause).toHaveBeenCalledTimes(1);
  });

  it('calls resetCamera() when reset camera button is clicked', () => {
    buttons()[1].click();
    expect(mockAtomRenderer.resetCamera).toHaveBeenCalledTimes(1);
  });

  it('calls setMode("quantum") when mode button clicked in Bohr mode', () => {
    buttons()[2].click();
    expect(mockViewerState.setMode).toHaveBeenCalledWith('quantum');
  });

  it('calls setMode("bohr") when mode button clicked in Quantum mode', () => {
    mode$.next('quantum');
    fixture.detectChanges();
    buttons()[2].click();
    expect(mockViewerState.setMode).toHaveBeenCalledWith('bohr');
  });

  it('does not call resetCamera() when pause button is clicked', () => {
    buttons()[0].click();
    expect(mockAtomRenderer.resetCamera).not.toHaveBeenCalled();
  });

  it('does not call togglePlayPause() when reset button is clicked', () => {
    buttons()[1].click();
    expect(mockViewerState.togglePlayPause).not.toHaveBeenCalled();
  });
});
