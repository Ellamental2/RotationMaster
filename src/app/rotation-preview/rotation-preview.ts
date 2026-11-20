import { Component, Input, TrackByFunction } from '@angular/core';
import { Ability, AbilitySelection } from '../../models';

export interface DisplaySelection {
  selection: AbilitySelection;
  stepIndex: number;
}

@Component({
    selector: 'rm-rotation-preview',
    templateUrl: './rotation-preview.html',
    styleUrls: ['./rotation-preview.scss']
})
export class RotationPreview {
  @Input() AbilitySelections: AbilitySelection[] = [];
  @Input() abilitiesPerRow: number = 10;
  @Input() index: number = 0;
  @Input() activeStepIndex: number = -1;
  @Input() trackerEnabled: boolean = false;
  @Input() detectedAbilities: Set<string> = new Set();

  private isGroupingSeparator(sep: string): boolean {
    return sep.includes('+') || sep.includes('/');
  }

  /** Computes which step index each AbilitySelection belongs to.
   *  Abilities grouped by + or / share a step; all others start a new step. */
  private computeStepIndices(): number[] {
    const indices: number[] = [];
    let stepIndex = -1;

    for (const sel of this.AbilitySelections) {
      if (!sel.SelectedAbility) {
        indices.push(-1);
        continue;
      }
      if (stepIndex === -1 || !this.isGroupingSeparator(sel.Separator)) {
        stepIndex++;
      }
      indices.push(stepIndex);
    }
    return indices;
  }

  hasAnyTrackedSlot(): boolean {
    return this.trackerEnabled && this.AbilitySelections.some(
      s => s.SelectedAbility && this.detectedAbilities.has(s.SelectedAbility.Title)
    );
  }

  getDisplayRows(): DisplaySelection[][] {
    const stepIndices = this.computeStepIndices();
    let displayRows: DisplaySelection[][] = [[]];
    let currentRow = 0;
    let itemsInCurrentRow = 0;

    for (let i = 0; i < this.AbilitySelections.length; i++) {
      const selection = this.AbilitySelections[i];
      const stepIndex = stepIndices[i];

      if (selection.Separator.includes('↵')) {
        if (itemsInCurrentRow > 0) {
          displayRows.push([]);
          currentRow++;
          itemsInCurrentRow = 0;
        }
        const displaySel = { ...selection, Separator: selection.Separator.replace('↵', '').trim() };
        displayRows[currentRow].push({ selection: displaySel, stepIndex });
        itemsInCurrentRow++;
      } else if (itemsInCurrentRow >= this.abilitiesPerRow && itemsInCurrentRow > 0) {
        displayRows.push([]);
        currentRow++;
        itemsInCurrentRow = 0;
        displayRows[currentRow].push({ selection, stepIndex });
        itemsInCurrentRow++;
      } else {
        displayRows[currentRow].push({ selection, stepIndex });
        itemsInCurrentRow++;
      }
    }

    return displayRows.filter(row => row.length > 0);
  }

  showPreview(): boolean {
    return Array.isArray(this.AbilitySelections) && this.AbilitySelections.some(sel => !!sel.SelectedAbility);
  }

  trackByRowIndex: TrackByFunction<DisplaySelection[]> = (index: number) => index;

  trackByDisplaySelection: TrackByFunction<DisplaySelection> = (index: number, item: DisplaySelection) => {
    const s = item.selection;
    return s.SelectedAbility?.Title + '_' + s.Separator + '_' + s.Notes + '_' + index;
  };

  onImageError(event: Event, ability: Ability): void {
    const img = event.target as HTMLImageElement;
    img.style.backgroundColor = '#ff0000';
    img.alt = `Failed to load: ${ability.Title}`;
  }

  onImageLoad(_event: Event, _ability: Ability): void {}
}
