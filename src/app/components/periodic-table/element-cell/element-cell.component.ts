/**
 * ElementCellComponent — a single clickable cell in the periodic table grid.
 *
 * Purely presentational: displays the element's symbol and atomic number,
 * applies a selected highlight, and emits a click event. Has no service
 * dependencies.
 *
 * @Input  element    The chemical element this cell represents. Required.
 * @Input  isSelected Whether this cell is the currently selected element.
 * @Output selected   Emits this element when the user clicks the cell.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Element } from '../../../models/element.model';

@Component({
  selector: 'app-element-cell',
  standalone: true,
  template: `
    <button
      class="cell"
      [class.selected]="isSelected"
      (click)="selected.emit(element)"
      [title]="element.name"
    >
      <span class="atomic-number">{{ element.atomicNumber }}</span>
      <span class="symbol">{{ element.symbol }}</span>
    </button>
  `,
  styles: [`
    .cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      aspect-ratio: 1;
      min-width: 36px;
      background: #1c2128;
      border: 1px solid #30363d;
      border-radius: 3px;
      cursor: pointer;
      padding: 2px;
      color: #e6edf3;
      font-family: inherit;
      transition: background 0.15s, border-color 0.15s;
    }

    .cell:hover {
      background: #2d333b;
      border-color: #58a6ff;
    }

    .cell.selected {
      background: #1c2840;
      border: 2px solid #58a6ff;
    }

    .atomic-number {
      font-size: 0.5em;
      opacity: 0.7;
      line-height: 1;
    }

    .symbol {
      font-size: 0.85em;
      font-weight: 600;
      line-height: 1.2;
    }
  `],
})
export class ElementCellComponent {
  @Input({ required: true }) element!: Element;
  @Input() isSelected = false;
  @Output() selected = new EventEmitter<Element>();
}
