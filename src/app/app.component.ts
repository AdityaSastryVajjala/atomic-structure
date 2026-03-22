/**
 * AppComponent — root layout shell.
 *
 * Two-column layout: periodic table on the left, 3D viewer panel on the right.
 * Listens for element-selection events from PeriodicTableComponent and forwards
 * them to ViewerStateService. No @Input / @Output — root component.
 */

import { Component, inject } from '@angular/core';
import { Element } from './models/element.model';
import { ViewerStateService } from './services/viewer-state.service';
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
      flex: 0 0 auto;
      overflow-x: auto;
      overflow-y: auto;
    }

    .panel-right {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 320px;
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
export class AppComponent {
  private readonly viewerState = inject(ViewerStateService);

  onElementSelected(element: Element): void {
    this.viewerState.selectElement(element);
  }
}
