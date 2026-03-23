/**
 * ElementDetailComponent — educational data panel for the selected element.
 *
 * Displays five fields for the currently selected element:
 *   Name, Symbol, Atomic Number, Atomic Mass (in u), Electron Configuration.
 * Shows a placeholder prompt when no element is selected.
 * Shows a disclaimer when quantum visualization mode is active (T052).
 *
 * Reads state from ViewerStateService only — no @Input / @Output.
 */

import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ViewerStateService } from '../../services/viewer-state.service';
import { getConfigurationString } from '../../models/element.model';

@Component({
  selector: 'app-element-detail',
  standalone: true,
  template: `
    @if (selectedElement(); as el) {
      <div class="detail-panel">
        <dl class="data-list">
          <div class="data-row">
            <dt>Atomic Number</dt>
            <dd>{{ el.atomicNumber }}</dd>
          </div>
          <div class="data-row">
            <dt>Atomic Mass</dt>
            <dd>{{ el.atomicMass }} u</dd>
          </div>
          <div class="data-row">
            <dt>Electron Config.</dt>
            <dd class="config">{{ configString(el) }}</dd>
          </div>
        </dl>
        @if (isQuantumMode()) {
          <p class="quantum-disclaimer">
            Quantum view is illustrative — not physically exact.
          </p>
        }
      </div>
    } @else {
      <div class="placeholder">
        Select an element to view its details
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 16px;
      min-height: 120px;
    }

    .placeholder {
      color: #484f58;
      font-size: 0.85rem;
      text-align: center;
      padding: 24px 0;
    }

    .data-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 16px;
    }

    .data-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }

    dt {
      font-size: 0.78rem;
      color: #8b949e;
      white-space: nowrap;
    }

    dd {
      font-size: 0.88rem;
      color: #e6edf3;
      text-align: right;
    }

    .config {
      font-family: monospace;
      letter-spacing: 0.02em;
    }

    .quantum-disclaimer {
      margin: 10px 0 0;
      padding: 6px 10px;
      background: #1c2128;
      border-left: 3px solid #388bfd;
      border-radius: 0 4px 4px 0;
      font-size: 0.78rem;
      color: #8b949e;
      font-style: italic;
    }
  `],
})
export class ElementDetailComponent {
  private readonly viewerState = inject(ViewerStateService);

  readonly selectedElement = toSignal(this.viewerState.selectedElement$, {
    initialValue: null,
  });

  readonly isQuantumMode = toSignal(
    this.viewerState.mode$.pipe(map((m) => m === 'quantum')),
    { initialValue: false },
  );

  readonly configString = getConfigurationString;
}
