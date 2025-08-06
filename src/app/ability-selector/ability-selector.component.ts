import { Component, EventEmitter, Input, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Ability, AbilitySelection } from 'src/models';

@Component({
    selector: 'rm-ability-selector',
    templateUrl: './ability-selector.component.html',
    styleUrls: ['./ability-selector.component.scss'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbilitySelectorComponent {
  @Input() abilitySelection: AbilitySelection = new AbilitySelection();
  @Input() abilities: Ability[] = [];
  @Input() isFirst: boolean = false;
  @Input() isOnly: boolean = false;

  @Output() abilitySelectionChange = new EventEmitter<AbilitySelection>();
  @Output() delete = new EventEmitter();
  @Output() copy = new EventEmitter();

  separators: string[] = ['→', '+', '/', 's', 'r', 'tc',
                          '↵ →', '↵ +', '↵ /', '↵ s', '↵ r', '↵ tc',
                          ''];

  onAbilityChange(event: Ability) {
    this.abilitySelection.SelectedAbility = event;
    this.abilitySelectionChange.emit(this.abilitySelection);
  }

  onSeparatorChange(event: string) {
    this.abilitySelection.Separator = event;
    this.abilitySelectionChange.emit(this.abilitySelection);
  }

  onNotesChange(event: string) {
    this.abilitySelection.Notes = event;
    this.abilitySelectionChange.emit(this.abilitySelection);
  }
}
