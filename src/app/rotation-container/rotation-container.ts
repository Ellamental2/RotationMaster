import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { transformAbilitySelectionsToString, transformStringToAbilitySelections } from '../../abilitiesLookup';
import { Ability, AbilitySelection, Rotation } from '../../models';
import { RotationPreview } from '../rotation-preview/rotation-preview';
import { AbilitySelector } from '../ability-selector/ability-selector';
import { FormsModule } from '@angular/forms';


@Component({
    selector: 'rm-rotation-container',
    templateUrl: './rotation-container.html',
    styleUrls: ['./rotation-container.scss'],
    imports: [CdkDropList, CdkDrag, FormsModule, RotationPreview, AbilitySelector],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RotationContainerComponent implements OnDestroy {
  @Input() rotation: Rotation = new Rotation();
  @Input() abilities: Ability[] = [];
  @Input() isSelected: boolean = false;
  @Input() rotationIndex: number = 0;
  @Input() previewOnly: boolean = false;
  
  @Input() showDetails: boolean = true;
  @Input() abilitiesPerRow: number = 10;
  @Input() lineBreakSpacing: number = 0;

  @Output() rotationChange = new EventEmitter<Rotation>();
  @Output() deleteRotation = new EventEmitter<number>();
  @Output() rotationSelected = new EventEmitter<number>();
  @Output() modalStateChange = new EventEmitter<boolean>();
  @Output() loading = new EventEmitter<boolean>();
  @Output() focusOnRotation = new EventEmitter<number>();
  // @Output() reorderRotation = new EventEmitter<{ previousIndex: number, newIndex: number }>();

  // Modal properties
  isEditModalVisible: boolean = false;
  rotationTextValue: string = '';
  previewRevision = 0;
  private changeTimeout: any;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {

  }

  onRotationSelected() {
    this.rotationSelected.emit(this.rotation.Id);
  }

  onDelete() {
    this.deleteRotation.emit(this.rotation.Id);
  }

  onRotationChange() {
    this.previewRevision++;
    this.cdr.markForCheck();

    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }
    
    this.changeTimeout = setTimeout(() => {
      this.rotationChange.emit(this.rotation);
    }, 50);
  }

  addAbilitySelection() {
    this.rotation.Data.push(new AbilitySelection());
    this.onRotationChange();
  }

  drop(event: CdkDragDrop<string[]>){
    moveItemInArray(this.rotation.Data, event.previousIndex, event.currentIndex);
    this.onRotationChange();
  }

  onAbilitySelectionChange(event: AbilitySelection, index: number) {
    this.rotation.Data[index] = event;
    this.onRotationChange();
  }
  onDeleteAbilitySelection(index: number) {
    this.rotation.Data.splice(index, 1);
    this.onRotationChange();
  }
  onShowDetails(): void {
    this.loading.emit(true);
    this.focusOnRotation.emit(this.rotation.Id);
    this.showDetails = true;
    this.loading.emit(false);
  }

  onCopyAbilitySelection(index: number, position: string = 'end') {
    // Create a deep copy of the ability selection
    const original = this.rotation.Data[index];
    const copy = new AbilitySelection(
      original.Separator,
      original.SelectedAbility,
      original.Notes
    );
    
    // Handle different copy positions based on the parameter
    switch (position) {
      case 'before':
        // Insert at the current position (pushing original down)
        this.rotation.Data.splice(index, 0, copy);
        break;
      case 'after':
        // Insert after the current position (original behavior)
        this.rotation.Data.splice(index + 1, 0, copy);
        break;
      case 'end':
      default:
        // Add to the end of the list (default behavior)
        this.rotation.Data.push(copy);
        break;
    }
    
    this.onRotationChange();
  }

  // Modal methods
  showEditModal() {
    this.rotationTextValue = transformAbilitySelectionsToString(this.rotation.Data);
    this.isEditModalVisible = true;
    this.modalStateChange.emit(true);
    this.cdr.markForCheck();
  }

  closeEditModal() {
    this.isEditModalVisible = false;
    this.rotationTextValue = '';
    this.modalStateChange.emit(false);
    this.cdr.markForCheck();
  }

  async saveRotationEdit() {
    // Emit loading state to parent
    this.modalStateChange.emit(true);
    this.loading.emit(true);
    
    try {
      // Use setTimeout to allow UI to update before heavy operation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const newAbilitySelections = transformStringToAbilitySelections(this.rotationTextValue);
      this.rotation.Data = newAbilitySelections;
      this.onRotationChange();
      
      // Focus on this rotation and hide details of others
      this.focusOnRotation.emit(this.rotation.Id);
      
      this.closeEditModal();
    } finally {
      // Always ensure modal state is cleared
      this.modalStateChange.emit(false);
      this.loading.emit(false);
    }
  }

  ngOnDestroy(): void {
    // Clean up timeouts to prevent memory leaks
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }
  }
}
 