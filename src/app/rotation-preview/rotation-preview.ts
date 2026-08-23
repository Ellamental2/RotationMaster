import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, TrackByFunction } from '@angular/core';
import { Ability, AbilitySelection } from '../../models';
import { isBlankSpacer } from '../../abilitiesLookup';

interface PreviewRow {
  selections: AbilitySelection[];
  fromLineBreak: boolean;
}

@Component({
    selector: 'rm-rotation-preview',
    templateUrl: './rotation-preview.html',
    styleUrls: ['./rotation-preview.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RotationPreview implements OnChanges {
  @Input() AbilitySelections: AbilitySelection[] = [];
  @Input() abilitiesPerRow: number = 10;
  @Input() lineBreakSpacing: number = 0;
  @Input() index: number = 0;
  @Input() revision: number = 0;

  abilityRows: PreviewRow[] = [];
  hasPreview = false;

  get lineBreakExtraGap(): string {
    const t = Math.min(100, Math.max(0, Number(this.lineBreakSpacing) || 0)) / 100;
    return `calc((2rem - 8px) * ${t})`;
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.abilityRows = this.calculateAbilityRows();
    this.hasPreview = this.abilityRows.some(row => row.selections.some(sel => !!sel.SelectedAbility));
  }

  private calculateAbilityRows(): PreviewRow[] {
    const abilityRows: PreviewRow[] = [{ selections: [], fromLineBreak: false }];
    let currentRow = 0;
    let itemsInCurrentRow = 0;

    for (let i = 0; i < this.AbilitySelections.length; i++) {
      const selection = this.AbilitySelections[i];

      if (selection.Separator?.includes('↵')) {
        if (itemsInCurrentRow > 0) {
          abilityRows.push({ selections: [], fromLineBreak: true });
          currentRow++;
          itemsInCurrentRow = 0;
        } else {
          abilityRows[currentRow].fromLineBreak = currentRow > 0;
        }
        const displaySelection = { ...selection };
        displaySelection.Separator = '';
        abilityRows[currentRow].selections.push(displaySelection);
        itemsInCurrentRow++;
      }
      else if (itemsInCurrentRow >= this.abilitiesPerRow && itemsInCurrentRow > 0) {
        abilityRows.push({ selections: [], fromLineBreak: false });
        currentRow++;
        itemsInCurrentRow = 0;
        abilityRows[currentRow].selections.push(selection);
        itemsInCurrentRow++;
      }
      else {
        abilityRows[currentRow].selections.push(selection);
        itemsInCurrentRow++;
      }
    }

    return abilityRows.filter(row => row.selections.length > 0);
  }

  trackByRowIndex: TrackByFunction<PreviewRow> = (index: number, _row: PreviewRow) => {
    return index;
  };

  trackByAbilitySelection: TrackByFunction<AbilitySelection> = (_index: number, selection: AbilitySelection) => {
    return selection.Id || (selection.SelectedAbility?.Title + '_' + selection.Separator + '_' + selection.Notes);
  };

  onImageError(event: Event, ability: Ability): void {
    console.error('Image failed to load:', {
      src: ability.Src,
      title: ability.Title,
      event
    });
    const img = event.target as HTMLImageElement;
    img.style.backgroundColor = '#ff0000';
    img.alt = `Failed to load: ${ability.Title}`;
  }

  onImageLoad(_event: Event, _ability: Ability): void {
  }

  isBlankSpacer = isBlankSpacer;
}
