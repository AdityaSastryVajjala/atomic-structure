/**
 * ViewerControlsComponent — playback, camera, and mode controls for the 3D viewer.
 *
 * Provides three controls:
 *   - Pause/Resume button: toggles electron animation via ViewerStateService.
 *   - Reset Camera button: restores the default camera position via AtomRendererService.
 *   - Mode toggle button: switches between Bohr and Quantum visualization modes.
 *
 * Reads isPaused$ and mode$ to keep button labels in sync with state.
 * No @Input / @Output — drives shared state through services only.
 */

import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ViewerStateService } from '../../services/viewer-state.service';
import { AtomRendererService } from '../../renderer/atom-renderer.service';

@Component({
  selector: 'app-viewer-controls',
  standalone: true,
  template: `
    <div class="controls-bar">
      <button class="ctrl-btn" (click)="togglePlayPause()" [attr.aria-label]="isPaused() ? 'Resume' : 'Pause'">
        {{ isPaused() ? '▶ Resume' : '⏸ Pause' }}
      </button>
      <button class="ctrl-btn" (click)="resetCamera()" aria-label="Reset camera">
        ⟳ Reset Camera
      </button>
      <button class="ctrl-btn mode-btn" (click)="toggleMode()" [attr.aria-label]="mode() === 'bohr' ? 'Switch to Quantum' : 'Switch to Bohr'">
        {{ mode() === 'bohr' ? '⚛ Bohr' : '☁ Quantum' }}
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .controls-bar {
      display: flex;
      gap: 8px;
      padding: 6px 8px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
    }

    .ctrl-btn {
      background: #21262d;
      color: #e6edf3;
      border: 1px solid #30363d;
      border-radius: 4px;
      padding: 5px 14px;
      font-size: 0.82rem;
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
    }

    .ctrl-btn:hover {
      background: #30363d;
    }

    .ctrl-btn:active {
      background: #3d444d;
    }

    .mode-btn {
      margin-left: auto;
      border-color: #388bfd44;
    }
  `],
})
export class ViewerControlsComponent {
  private readonly viewerState = inject(ViewerStateService);
  private readonly atomRenderer = inject(AtomRendererService);

  readonly isPaused = toSignal(this.viewerState.isPaused$, { initialValue: false });
  readonly mode     = toSignal(this.viewerState.mode$,     { initialValue: 'bohr' as const });

  togglePlayPause(): void {
    this.viewerState.togglePlayPause();
  }

  resetCamera(): void {
    this.atomRenderer.resetCamera();
  }

  toggleMode(): void {
    this.viewerState.setMode(this.mode() === 'bohr' ? 'quantum' : 'bohr');
  }
}
