import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Ability, AbilitySelection } from '../../models';
import { SearchDropdown } from '../search-dropdown/search-dropdown';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { isBlankSpacer } from '../../abilitiesLookup';

@Component({
    selector: 'rm-ability-selector',
    templateUrl: './ability-selector.html',
    styleUrls: ['./ability-selector.scss'],
    imports: [SearchDropdown, FormsModule, NgIf],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbilitySelector {
  @Input() abilitySelection: AbilitySelection = new AbilitySelection();
  @Input() abilities: Ability[] = [];
  @Input() isFirst: boolean = false;
  @Input() isOnly: boolean = false;

  @Output() abilitySelectionChange = new EventEmitter<AbilitySelection>();
  @Output() delete = new EventEmitter();
  @Output() copyAbility = new EventEmitter<string>();

  copyMenuVisible = false;

  constructor(private cdr: ChangeDetectorRef) {}

  separators: string[] = ['→', '+', '/', 's', 'r', 'tc',
                          '↵ →', '↵ +', '↵ /', '↵ s', '↵ r', '↵ tc',
                          '↵',''];

  onAbilityChange(event: Ability) {
    this.abilitySelection.SelectedAbility = event;
    this.abilitySelectionChange.emit(this.abilitySelection);
    this.cdr.markForCheck();
  }

  onSeparatorChange(event: string) {
    this.abilitySelection.Separator = event;
    this.abilitySelectionChange.emit(this.abilitySelection);
  }

  onNotesChange(event: string) {
    this.abilitySelection.Notes = event;
    this.abilitySelectionChange.emit(this.abilitySelection);
  }

  isBlankSpacer = isBlankSpacer;
}
