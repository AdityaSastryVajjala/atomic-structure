/**
 * PeriodicTableComponent — renders all 118 elements in standard periodic table layout.
 *
 * Uses CSS Grid with per-cell grid-column / grid-row positioning to match the
 * standard 18-column periodic table layout. Lanthanides (57–71) appear in row 9
 * and actinides (89–103) in row 10, separated from the main table by a gap row.
 *
 * Injects ElementDataService (element list) and ViewerStateService (selection state).
 * Emits elementSelected when the user clicks a cell.
 */

import { Component, Output, EventEmitter, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Element } from '../../models/element.model';
import { ElementDataService } from '../../services/element-data.service';
import { ViewerStateService } from '../../services/viewer-state.service';
import { ElementCellComponent } from './element-cell/element-cell.component';

/**
 * Standard periodic table grid positions [row, col] for atomic numbers 1–118.
 * Rows 1–7: main periods. Row 8: gap. Rows 9–10: lanthanides / actinides.
 * Columns 1–18 map directly to the 18 standard groups.
 */
const ELEMENT_POSITIONS: readonly [number, number][] = [
  [1,  1],  // 1   H
  [1, 18],  // 2   He
  [2,  1],  // 3   Li
  [2,  2],  // 4   Be
  [2, 13],  // 5   B
  [2, 14],  // 6   C
  [2, 15],  // 7   N
  [2, 16],  // 8   O
  [2, 17],  // 9   F
  [2, 18],  // 10  Ne
  [3,  1],  // 11  Na
  [3,  2],  // 12  Mg
  [3, 13],  // 13  Al
  [3, 14],  // 14  Si
  [3, 15],  // 15  P
  [3, 16],  // 16  S
  [3, 17],  // 17  Cl
  [3, 18],  // 18  Ar
  [4,  1],  // 19  K
  [4,  2],  // 20  Ca
  [4,  3],  // 21  Sc
  [4,  4],  // 22  Ti
  [4,  5],  // 23  V
  [4,  6],  // 24  Cr
  [4,  7],  // 25  Mn
  [4,  8],  // 26  Fe
  [4,  9],  // 27  Co
  [4, 10],  // 28  Ni
  [4, 11],  // 29  Cu
  [4, 12],  // 30  Zn
  [4, 13],  // 31  Ga
  [4, 14],  // 32  Ge
  [4, 15],  // 33  As
  [4, 16],  // 34  Se
  [4, 17],  // 35  Br
  [4, 18],  // 36  Kr
  [5,  1],  // 37  Rb
  [5,  2],  // 38  Sr
  [5,  3],  // 39  Y
  [5,  4],  // 40  Zr
  [5,  5],  // 41  Nb
  [5,  6],  // 42  Mo
  [5,  7],  // 43  Tc
  [5,  8],  // 44  Ru
  [5,  9],  // 45  Rh
  [5, 10],  // 46  Pd
  [5, 11],  // 47  Ag
  [5, 12],  // 48  Cd
  [5, 13],  // 49  In
  [5, 14],  // 50  Sn
  [5, 15],  // 51  Sb
  [5, 16],  // 52  Te
  [5, 17],  // 53  I
  [5, 18],  // 54  Xe
  [6,  1],  // 55  Cs
  [6,  2],  // 56  Ba
  [9,  3],  // 57  La  — lanthanide row
  [9,  4],  // 58  Ce
  [9,  5],  // 59  Pr
  [9,  6],  // 60  Nd
  [9,  7],  // 61  Pm
  [9,  8],  // 62  Sm
  [9,  9],  // 63  Eu
  [9, 10],  // 64  Gd
  [9, 11],  // 65  Tb
  [9, 12],  // 66  Dy
  [9, 13],  // 67  Ho
  [9, 14],  // 68  Er
  [9, 15],  // 69  Tm
  [9, 16],  // 70  Yb
  [9, 17],  // 71  Lu
  [6,  4],  // 72  Hf
  [6,  5],  // 73  Ta
  [6,  6],  // 74  W
  [6,  7],  // 75  Re
  [6,  8],  // 76  Os
  [6,  9],  // 77  Ir
  [6, 10],  // 78  Pt
  [6, 11],  // 79  Au
  [6, 12],  // 80  Hg
  [6, 13],  // 81  Tl
  [6, 14],  // 82  Pb
  [6, 15],  // 83  Bi
  [6, 16],  // 84  Po
  [6, 17],  // 85  At
  [6, 18],  // 86  Rn
  [7,  1],  // 87  Fr
  [7,  2],  // 88  Ra
  [10,  3], // 89  Ac  — actinide row
  [10,  4], // 90  Th
  [10,  5], // 91  Pa
  [10,  6], // 92  U
  [10,  7], // 93  Np
  [10,  8], // 94  Pu
  [10,  9], // 95  Am
  [10, 10], // 96  Cm
  [10, 11], // 97  Bk
  [10, 12], // 98  Cf
  [10, 13], // 99  Es
  [10, 14], // 100 Fm
  [10, 15], // 101 Md
  [10, 16], // 102 No
  [10, 17], // 103 Lr
  [7,  4],  // 104 Rf
  [7,  5],  // 105 Db
  [7,  6],  // 106 Sg
  [7,  7],  // 107 Bh
  [7,  8],  // 108 Hs
  [7,  9],  // 109 Mt
  [7, 10],  // 110 Ds
  [7, 11],  // 111 Rg
  [7, 12],  // 112 Cn
  [7, 13],  // 113 Nh
  [7, 14],  // 114 Fl
  [7, 15],  // 115 Mc
  [7, 16],  // 116 Lv
  [7, 17],  // 117 Ts
  [7, 18],  // 118 Og
];

export interface ElementCell {
  element: Element;
  row: number;
  col: number;
}

@Component({
  selector: 'app-periodic-table',
  standalone: true,
  imports: [ElementCellComponent],
  template: `
    <div class="pt-grid">
      @for (cell of elementCells; track cell.element.atomicNumber) {
        <app-element-cell
          [element]="cell.element"
          [isSelected]="selectedElement()?.atomicNumber === cell.element.atomicNumber"
          [style.grid-column]="cell.col"
          [style.grid-row]="cell.row"
          (selected)="elementSelected.emit($event)"
        />
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 8px;
    }

    .pt-grid {
      display: grid;
      grid-template-columns: repeat(18, minmax(36px, 1fr));
      grid-template-rows:
        repeat(7, auto)  /* rows 1–7: main periods */
        8px              /* row 8: gap */
        auto             /* row 9: lanthanides */
        auto;            /* row 10: actinides */
      gap: 2px;
    }
  `],
})
export class PeriodicTableComponent {
  @Output() elementSelected = new EventEmitter<Element>();

  private readonly elementData = inject(ElementDataService);
  private readonly viewerState = inject(ViewerStateService);

  readonly selectedElement = toSignal(this.viewerState.selectedElement$, {
    initialValue: null,
  });

  readonly elementCells: readonly ElementCell[] = this.elementData
    .getAllElements()
    .map((element) => {
      const [row, col] = ELEMENT_POSITIONS[element.atomicNumber - 1];
      return { element, row, col };
    });
}
