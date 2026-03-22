/**
 * ElementViewerComponent — hosts the Three.js canvas for 3D atomic structure rendering.
 *
 * Checks WebGL support on init. If supported, passes the canvas element to
 * AtomRendererService.init(); otherwise shows a human-readable error message (FR-023).
 * Calls AtomRendererService.dispose() on destroy to clean up GPU resources.
 *
 * No @Input / @Output — reads all state from services.
 * Shows a data-load error if ElementDataService.loadError is set after APP_INITIALIZER (FR-024).
 */

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AtomRendererService } from '../../renderer/atom-renderer.service';
import { ViewerStateService } from '../../services/viewer-state.service';
import { ElementDataService } from '../../services/element-data.service';

@Component({
  selector: 'app-element-viewer',
  standalone: true,
  template: `
    @if (hasError) {
      <div class="error-overlay">{{ errorMessage }}</div>
    } @else {
      <canvas #viewerCanvas class="viewer-canvas"></canvas>
      @if (selectedElement()) {
        <div class="nucleus-label">Nucleus (simplified)</div>
      }
    }
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      background: #0d1117;
      border-radius: 6px;
      overflow: hidden;
    }

    .viewer-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .error-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #f85149;
      font-size: 0.95rem;
      text-align: center;
      background: #0d1117;
    }

    .nucleus-label {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.55);
      color: #8b949e;
      font-size: 0.72rem;
      padding: 3px 8px;
      border-radius: 3px;
      pointer-events: none;
      white-space: nowrap;
    }
  `],
})
export class ElementViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('viewerCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly atomRenderer  = inject(AtomRendererService);
  private readonly viewerState   = inject(ViewerStateService);
  private readonly elementData   = inject(ElementDataService);
  private readonly cdr           = inject(ChangeDetectorRef);

  protected hasError     = false;
  protected errorMessage = '';

  readonly selectedElement = toSignal(this.viewerState.selectedElement$, {
    initialValue: null,
  });

  ngAfterViewInit(): void {
    // FR-023: WebGL not supported
    if (!this.atomRenderer.isWebGLSupported()) {
      this.hasError     = true;
      this.errorMessage = 'Your browser does not support 3D graphics (WebGL). Please use a modern browser.';
      this.cdr.detectChanges();
      return;
    }

    // FR-024: Element data failed to load
    if (this.elementData.loadError !== null) {
      this.hasError     = true;
      this.errorMessage = `Could not load element data: ${this.elementData.loadError}. Refresh the page to retry.`;
      this.cdr.detectChanges();
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    // Ensure the canvas pixel buffer matches its CSS-rendered size
    canvas.width  = canvas.clientWidth  || canvas.offsetWidth;
    canvas.height = canvas.clientHeight || canvas.offsetHeight;

    this.atomRenderer.init(canvas);
  }

  ngOnDestroy(): void {
    this.atomRenderer.dispose();
  }
}
