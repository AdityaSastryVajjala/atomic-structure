/**
 * AppComponent — root layout shell.
 *
 * Two-column layout: periodic table on the left, 3D viewer panel on the right.
 * Listens for element-selection events from PeriodicTableComponent and forwards
 * them to ViewerStateService. No @Input / @Output — root component.
 */

import { Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Element } from './models/element.model';
import { ViewerStateService } from './services/viewer-state.service';
import { ElementDataService } from './services/element-data.service';
import { PeriodicTableComponent } from './components/periodic-table/periodic-table.component';
import { ElementViewerComponent } from './components/element-viewer/element-viewer.component';
import { ElementDetailComponent } from './components/element-detail/element-detail.component';
import { ViewerControlsComponent } from './components/viewer-controls/viewer-controls.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PeriodicTableComponent, ElementViewerComponent, ElementDetailComponent, ViewerControlsComponent],
  template: `
    <div class="app-layout">
      <aside class="panel-left">
        <app-periodic-table (elementSelected)="onElementSelected($event)" />
      </aside>
      <main class="panel-right">
        @if (selectedElement(); as el) {
          <div class="element-header">
            <span class="eh-symbol">{{ el.symbol }}</span>
            <span class="eh-name">{{ el.name }}</span>
            <span class="eh-number">{{ el.atomicNumber }}</span>
          </div>
        }
        <app-element-viewer class="viewer" />
        <app-viewer-controls class="controls" />
        <app-element-detail class="detail" />
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background: #0d1117;
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .app-layout {
      display: flex;
      height: 100%;
      gap: 8px;
      padding: 8px;
      box-sizing: border-box;
    }

    .panel-left {
      width: 300px;
      flex-shrink: 0;
      overflow-x: auto;
      overflow-y: auto;
    }

    .panel-right {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    .element-header {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
    }

    .eh-symbol {
      font-size: 1.4rem;
      font-weight: 700;
      color: #58a6ff;
      min-width: 2ch;
    }

    .eh-name {
      font-size: 1rem;
      font-weight: 600;
      color: #e6edf3;
    }

    .eh-number {
      font-size: 0.82rem;
      color: #8b949e;
      margin-left: auto;
    }

    .viewer {
      flex: 1 1 auto;
      min-height: 300px;
    }

    .controls {
      flex: 0 0 auto;
    }

    .detail {
      flex: 0 0 auto;
    }
  `],
})
export class AppComponent implements OnInit {
  private readonly viewerState = inject(ViewerStateService);
  private readonly elementData = inject(ElementDataService);

  readonly selectedElement = toSignal(this.viewerState.selectedElement$, { initialValue: null });

  ngOnInit(): void {
    const hydrogen = this.elementData.getAllElements().find(e => e.atomicNumber === 1);
    if (hydrogen) {
      this.viewerState.selectElement(hydrogen);
    }
  }

  onElementSelected(element: Element): void {
    this.viewerState.selectElement(element);
  }
}
