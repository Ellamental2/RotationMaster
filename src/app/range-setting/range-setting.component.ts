import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RangeSetting } from 'src/models';

@Component({
    selector: 'rm-range-setting',
    templateUrl: './range-setting.component.html',
    styleUrls: ['./range-setting.component.scss'],
    standalone: false
})
export class RangeSettingComponent {
  @Input() setting!: RangeSetting;

  @Output() onUpdate = new EventEmitter<number>();

  ngOninit() {
    //find the container div by id
    const container = document.getElementById("container");
    if (container) {
      this.setting.classes?.forEach((className: string) => {
        container.classList.add(className);
      });
    }
  }

  valueChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    if (!isNaN(value)) {
      this.onUpdate.emit(value);
    } else {
      console.warn(`Invalid value for setting ${this.setting.name}: ${target.value}`);
    }
  }
}
