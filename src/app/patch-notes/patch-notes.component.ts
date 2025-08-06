import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IPatch } from 'src/models';

@Component({
    selector: 'rm-patch-notes',
    templateUrl: './patch-notes.component.html',
    styleUrls: ['./patch-notes.component.scss'],
    standalone: false
})
export class PatchNotesComponent {
  @Input() patchNotes: IPatch[] = [];
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
}

