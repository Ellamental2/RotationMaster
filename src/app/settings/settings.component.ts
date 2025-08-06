import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RangeSetting } from 'src/models';

@Component({
    selector: 'rm-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    standalone: false
})
export class SettingsComponent {
  @Input() version: string = '0.0.1';;
  @Input() settings: RangeSetting[] = [];

  @Output() updateSetting = new EventEmitter<{ name: string, value: any }>();
  @Output() setOverlayPosition = new EventEmitter();
}