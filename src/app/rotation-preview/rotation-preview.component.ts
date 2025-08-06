import { Component, Input, TrackByFunction } from '@angular/core';
import { Ability, AbilitySelection } from 'src/models';

@Component({
    selector: 'rm-rotation-preview',
    templateUrl: './rotation-preview.component.html',
    styleUrls: ['./rotation-preview.component.scss'],
    standalone: false
})
export class RotationPreviewComponent {
  @Input() AbilitySelections: AbilitySelection[] = [];
  @Input() abilitiesPerRow: number = 10;
  @Input() index: number = 0;

  getAbilityRows(): AbilitySelection[][] {
    return this.calculateAbilityRows();
  }

  private calculateAbilityRows(): AbilitySelection[][] {
    // convert AbilitySelections into an array of ability-rows
    let abilityRows: AbilitySelection[][] = [];

    let currentRow = -1;

    for(let i = 0; i < this.AbilitySelections.length; i++) {
      const selection = this.AbilitySelections[i];
      if (i % this.abilitiesPerRow === 0) {
        abilityRows.push([]);
        currentRow++;
      } else if (selection.Separator.includes('↵')) {
        // If the separator includes a newline, start a new row, remove the new line separator
        abilityRows.push([]);
        currentRow++;
        // Create a copy to avoid mutating the original
        const displaySelection = { ...selection };
        displaySelection.Separator = selection.Separator.replace('↵', '').trim();
        abilityRows[currentRow].push(displaySelection);
        continue;
      }
      abilityRows[currentRow].push(selection);
    }
    return abilityRows;
  }

  showPreview(): boolean {
    return Array.isArray(this.AbilitySelections) && this.AbilitySelections.some(sel => !!sel.SelectedAbility);
  }

  // TrackBy functions for better performance
  trackByRowIndex: TrackByFunction<AbilitySelection[]> = (index: number, row: AbilitySelection[]) => {
    return index;
  };

  trackByAbilitySelection: TrackByFunction<AbilitySelection> = (index: number, selection: AbilitySelection) => {
    return selection.SelectedAbility?.Title + '_' + selection.Separator + '_' + selection.Notes + '_' + index;
  };
}