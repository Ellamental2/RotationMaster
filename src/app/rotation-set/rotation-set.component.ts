import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Ability, AbilitySelection, Rotation, RotationSet } from 'src/models';
import {CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray} from '@angular/cdk/drag-drop';
import abilities from 'src/assets/abilities.json'; // Assuming you have an abilities.json file in assets
import { lookupAbilityByEmoji } from 'src/abilitiesLookup';

@Component({
    selector: 'rm-rotation-set',
    templateUrl: './rotation-set.component.html',
    styleUrls: ['./rotation-set.component.scss'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RotationSetComponent implements OnDestroy {
  @Input() abilitiesPerRow: number = 10;
  @Input() selectedRotationIndex: number = 0;

  @Output() changeSelectedRotation = new EventEmitter<number>();
  @Output() rotationSetChange = new EventEmitter<RotationSet>();

  savedRotationSets: RotationSet[] = [];
  rotationSet: RotationSet = new RotationSet();
  selectedId: number = 0;
  allAbilities: Ability[] = [];
  isAnyModalOpen: boolean = false;
  isLoading: boolean = false;
  rotationDetailsVisibility: { [rotationId: number]: boolean } = {};

  savedRotationsKey = 'savedRotations';
  private updateTimeout: any;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadSavedRotationSets();
    this.loadAllAbilities();
    // Emit the initial rotation set
    this.rotationSetChange.emit(this.rotationSet);
  }

  async loadAllAbilities() {
    //load the abilities.json file as an array of Ability objects and assign to the abilities property
    this.allAbilities = abilities as Ability[];
  }

  newRotation(): void {
    this.rotationSet = new RotationSet('New Rotation Set');
    // Initialize visibility for any existing rotations
    this.rotationDetailsVisibility = {};
    this.rotationSet.Data.forEach(rotation => {
      this.rotationDetailsVisibility[rotation.Id] = true;
    });
    this.rotationSetChange.emit(this.rotationSet);
  }

  loadSavedRotationSets(): void {
    const cachedRotations = localStorage.getItem(this.savedRotationsKey);

    if (cachedRotations) {
      const parsedRotations = JSON.parse(cachedRotations);

      if (Array.isArray(parsedRotations) && parsedRotations.length > 0) {
        // Check for 'Data' property (capital D)
        if ('Data' in parsedRotations[0]) {
          // Already RotationSet[] structure, revive to class instances
          this.savedRotationSets = parsedRotations.map((obj: any) => this.reviveRotationSet(obj));
        } else {
          // If it's an array of Rotation, wrap each in a RotationSet (legacy support)
          this.savedRotationSets = parsedRotations.map((rotation: any) =>
            new RotationSet(rotation.Name, [this.reviveRotation(rotation)])
          );
          // Optionally: update localStorage to new format
          localStorage.setItem(this.savedRotationsKey, JSON.stringify(this.savedRotationSets));
        }
        return;
      }
    }

    this.savedRotationSets = [];
  }

  setRotationName(newName: string): void {
    const trimmedName = newName.trim();
    if (trimmedName !== '') {
      this.rotationSet.Name = trimmedName;
    } else {
      this.rotationSet.Name = 'New Rotation Set';
    }
    this.rotationSetChange.emit(this.rotationSet);
  }

  // Utility functions to revive class instances from plain objects
  reviveAbility(obj: any): Ability {
    return new Ability(obj.Title, obj.Emoji, obj.EmojiId, obj.Category, obj.Src);
  }

  reviveAbilitySelection(obj: any): AbilitySelection {
    return new AbilitySelection(
      obj.Separator,
      obj.SelectedAbility ? this.reviveAbility(obj.SelectedAbility) : null,
      obj.Notes
    );
  }

  reviveRotation(obj: any): Rotation {
    return new Rotation(
      obj.Id,
      obj.Name,
      obj.Data?.map((obj: any) => this.reviveAbilitySelection(obj))
    );
  }

  reviveRotationSet(obj: any): RotationSet {
    return new RotationSet(
      obj.Name,
      obj.Data?.map((obj: any) => this.reviveRotation(obj))
    );
  }

  saveRotationSet(): void {
    const savedRotationsRaw = localStorage.getItem(this.savedRotationsKey);
    const savedRotations = savedRotationsRaw ? JSON.parse(savedRotationsRaw) : [];
    const existingIndex = savedRotations.findIndex((rs: any) => rs.Name === this.rotationSet.Name);
    if (existingIndex !== -1) {
      savedRotations[existingIndex] = this.rotationSet;
    } else {
      savedRotations.push(this.rotationSet);
    }
    localStorage.setItem(this.savedRotationsKey, JSON.stringify(savedRotations));
    this.savedRotationSets = savedRotations.map((obj: any) => this.reviveRotationSet(obj));
  }

  onSetSelectionChange(event: any): void {
    const selectedName = (event.target as HTMLSelectElement).value;
    this.setLoadingState(true);
    this.loadRotationSet(selectedName);
    this.setLoadingState(false);
  }

  newRotationSet(): void {
    this.rotationSet = new RotationSet();
    // Initialize visibility for any existing rotations  
    this.rotationDetailsVisibility = {};
    this.rotationSet.Data.forEach(rotation => {
      this.rotationDetailsVisibility[rotation.Id] = true;
    });
    this.rotationSetChange.emit(this.rotationSet);
  }

  loadRotationSet(name: string): void {
    const found = this.savedRotationSets.find(set => set.Name === name);
    if (found) {
      // Deep clone and revive to ensure class instances
      this.rotationSet = this.reviveRotationSet(JSON.parse(JSON.stringify(found)));
      
      // Initialize visibility for all rotations (default to false when switching)
      this.rotationDetailsVisibility = {};
      this.rotationSet.Data.forEach(rotation => {
        this.rotationDetailsVisibility[rotation.Id] = false;
      });
      
      this.rotationSetChange.emit(this.rotationSet);
    }
  }

  addRotation(): void {
    this.isLoading = true;
    try {
      const maxId = this.rotationSet.Data.reduce((max, r) => r.Id > max ? r.Id : max, 0);
      const newRotation = new Rotation(maxId + 1);
      this.rotationSet.Data.push(newRotation);
      
      // Initialize visibility for new rotation
      this.rotationDetailsVisibility[newRotation.Id] = true;
      
      // If this is the first rotation, automatically select it
      if (this.rotationSet.Data.length === 1) {
        this.onRotationSelected(newRotation.Id);
      }
      
      this.onFocusOnRotation(newRotation.Id);
      this.rotationSetChange.emit(this.rotationSet);
    }
    finally {
      this.isLoading = false;
    }
  }

  updateRotation(rotation: Rotation): void {
    // update the rotation in the rotation set
    const index = this.rotationSet.Data.findIndex(r => r.Id === rotation.Id);
    if (index !== -1) {
      this.rotationSet.Data[index] = rotation;
      
      // Debounce the emission to reduce change detection cycles
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
      }
      
      this.updateTimeout = setTimeout(() => {
        this.rotationSetChange.emit(this.rotationSet);
        this.cdr.markForCheck();
      }, 100); // 100ms debounce
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.rotationSet.Data, event.previousIndex, event.currentIndex);
  }

  deleteRotation(id: number): void {
    this.rotationSet.Data = this.rotationSet.Data.filter(r => r.Id !== id);
    this.rotationSetChange.emit(this.rotationSet);
  }

  onRotationSelected(id: number): void {
    // Find the index of the rotation with the given ID
    const index = this.rotationSet.Data.findIndex(r => r.Id === id);
    if (index !== -1) {
      this.setLoadingState(true);
      this.selectedId = id;
      this.changeSelectedRotation.emit(index);
      this.setLoadingState(false);
    }
  }

  private setLoadingState(loading: boolean): void {
    this.isLoading = loading;
    this.cdr.markForCheck();
  }

  onModalStateChange(isModalOpen: boolean): void {
    this.isAnyModalOpen = isModalOpen;
    this.cdr.markForCheck();
  }

  onFocusOnRotation(rotationId: number): void {
    // Hide details for all rotations
    Object.keys(this.rotationDetailsVisibility).forEach(key => {
      this.rotationDetailsVisibility[+key] = false;
    });
    
    // Show details only for the focused rotation
    this.rotationDetailsVisibility[rotationId] = true;
    this.cdr.markForCheck();
  }

  getRotationDetailsVisibility(rotationId: number): boolean {
    return this.rotationDetailsVisibility[rotationId] ?? true;
  }

  onChildLoading(loading: boolean): void {
    this.setLoadingState(loading);
  }

  deleteRotationSet(): void {
    const savedRotations = (JSON.parse(localStorage.getItem(this.savedRotationsKey) || '[]') as RotationSet[])
      .filter(rs => rs.Name !== this.rotationSet.Name);

    localStorage.setItem(this.savedRotationsKey, JSON.stringify(savedRotations));

    this.newRotation();
  }

  trackByRotationId(index: number, rotation: Rotation): number {
    return rotation.Id;
  }

  exportRotationSet(): void {
    if (!this.rotationSet.Name?.trim()) {
      console.error('Rotation Set name is required for export.');
      return;
    }

    const rotationSetJson = JSON.stringify(this.rotationSet, null, 2);
    const fileName = `${this.rotationSet.Name.trim().replace(/\s+/g, '_')}_RotationSet.json`;
    
    // More Angular-friendly approach
    this.downloadFile(rotationSetJson, fileName, 'application/json');
  }

  private downloadFile(data: string, fileName: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    
    // Append to body, click, and remove
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    
    // Clean up the object URL
    URL.revokeObjectURL(url);
  }

  importRotationSet(): void {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';
    
    // Handle file selection
    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) {
        return;
      }
      
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
        console.error('Invalid file type selected');
        alert('Please select a valid JSON file');
        return;
      }
      
      // Set loading state before starting import
      this.setLoadingState(true);
      
      // Read the file
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        try {
          const fileContent = e.target.result;
          
          // Parse the rotation set data (now async with concurrent processing)
          const importedRotationSet = await this.parseRotationSetData(fileContent);
          
          // Set the imported rotation set as the current rotation set
          this.rotationSet = this.reviveRotationSet(importedRotationSet);
          
          // Initialize visibility for all imported rotations (default to false)
          this.rotationDetailsVisibility = {};
          this.rotationSet.Data.forEach(rotation => {
            this.rotationDetailsVisibility[rotation.Id] = false;
          });
          
          this.rotationSetChange.emit(this.rotationSet);
          
          alert(`Successfully imported rotation set: ${this.rotationSet.Name}`);
          
        } catch (error) {
          console.error('Error importing rotation set:', error);
          alert(`Error importing rotation set: ${error}`);
        } finally {
          // Always clear loading state
          this.setLoadingState(false);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Error reading file');
        this.setLoadingState(false);
      };
      
      // Read the file as text
      reader.readAsText(file);
      
      // Clean up
      document.body.removeChild(fileInput);
    };
    
    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
  }

  ngOnDestroy(): void {
    // Clean up timeouts to prevent memory leaks
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
  }

  defaultRotationSetName: string = "Imported Rotation Set";
  defaultRotationName: string = "Imported Rotation";

  async parseRotationSetData(rawData: any): Promise<RotationSet> {

    // If rawData is a string, parse it as JSON
    if (typeof rawData === "string") {
      try {
        rawData = JSON.parse(rawData);
      } catch {
        throw new Error("Invalid JSON string for rotation data.");
      }
    }

    // Helper function to normalize ability selection properties with concurrent lookup
    const normalizeAbilitySelection = async (selection: any): Promise<AbilitySelection> => {
      const selectedAbility = selection.selectedAbility || selection.SelectedAbility;
      let ability: Ability | null = null;
      
      if (selectedAbility && selectedAbility.Emoji) {
        // Use lookup to find the ability by emoji for better consistency
        ability = lookupAbilityByEmoji(selectedAbility.Emoji) || selectedAbility;
      } else if (selectedAbility) {
        ability = selectedAbility;
      }

      return {
        Separator: selection.seperator || selection.Separator || '→',
        SelectedAbility: ability,
        Notes: selection.notes || selection.Notes || null
      };
    };

    // Helper function to normalize rotation properties with concurrent processing
    const normalizeRotation = async (rotation: any): Promise<Rotation> => {
      const abilitySelections = rotation.data || rotation.Data || [];
      
      // Process all ability selections concurrently
      const normalizedSelections = await Promise.all(
        abilitySelections.map((selection: any) => normalizeAbilitySelection(selection))
      );

      return {
        Id: rotation.id || rotation.Id || 0,
        Name: rotation.name || rotation.Name || this.defaultRotationName,
        Data: normalizedSelections
      };
    };

    // Format 0: Current model with proper casing (Name, Data)
    if (
      typeof rawData === "object" &&
      rawData !== null &&
      typeof rawData.Name === "string" &&
      Array.isArray(rawData.Data)
    ) {
      // Check if Data contains rotations or raw abilities
      if (rawData.Data.length === 0) {
        return new RotationSet(rawData.Name, []);
      } else if (rawData.Data[0].hasOwnProperty('Emoji')) {
        // Array of abilities, wrap in a rotation - process concurrently
        const abilitySelections = await Promise.all(
          rawData.Data.map(async (ability: Ability) => {
            const lookupAbility = lookupAbilityByEmoji(ability.Emoji) || ability;
            return {
              Separator: '→',
              SelectedAbility: lookupAbility,
              Notes: null
            };
          })
        );
        return new RotationSet(rawData.Name, [new Rotation(0, this.defaultRotationName, abilitySelections)]);
      } else {
        // Array of rotations, normalize each one concurrently
        const normalizedRotations = await Promise.all(
          rawData.Data.map((rotation: any) => normalizeRotation(rotation))
        );
        return new RotationSet(rawData.Name, normalizedRotations);
      }
    }

    // Format 1: Legacy format with lowercase properties (name, data)
    if (
      typeof rawData === "object" &&
      rawData !== null &&
      typeof rawData.name === "string" &&
      Array.isArray(rawData.data)
    ) {
      // Check if data contains rotations or raw abilities
      if (rawData.data.length === 0) {
        return new RotationSet(rawData.name, []);
      } else if (rawData.data[0].hasOwnProperty('Emoji')) {
        // Array of abilities, wrap in a rotation - process concurrently
        const abilitySelections = await Promise.all(
          rawData.data.map(async (ability: Ability) => {
            const lookupAbility = lookupAbilityByEmoji(ability.Emoji) || ability;
            return {
              Separator: '→',
              SelectedAbility: lookupAbility,
              Notes: null
            };
          })
        );
        return new RotationSet(rawData.name, [new Rotation(0, this.defaultRotationName, abilitySelections)]);
      } else {
        // Array of rotations, normalize each one concurrently
        const normalizedRotations = await Promise.all(
          rawData.data.map((rotation: any) => normalizeRotation(rotation))
        );
        return new RotationSet(rawData.name, normalizedRotations);
      }
    }

    // Format 2: Object with abilities in data property
    if (
      typeof rawData === "object" &&
      rawData !== null &&
      Array.isArray(rawData.data) &&
      rawData.data.length > 0 &&
      typeof rawData.data[0].Title === "string"
    ) {
      const abilitySelections = await Promise.all(
        rawData.data.map(async (ability: Ability) => {
          const lookupAbility = lookupAbilityByEmoji(ability.Emoji) || ability;
          return {
            Separator: '→',
            SelectedAbility: lookupAbility,
            Notes: null
          };
        })
      );

      return new RotationSet(
        rawData.name || this.defaultRotationSetName,
        [new Rotation(0, this.defaultRotationName, abilitySelections)]
      );
    }

    // Format 3: Array of Dropdowns or Abilities
    if (Array.isArray(rawData) && rawData.length > 0) {
      // If it's an array of abilities
      if (typeof rawData[0].Title === "string") {
        const abilitySelections = await Promise.all(
          rawData.map(async (ability: Ability) => {
            const lookupAbility = lookupAbilityByEmoji(ability.Emoji) || ability;
            return {
              Separator: '→',
              SelectedAbility: lookupAbility,
              Notes: null
            };
          })
        );

        return new RotationSet(
          this.defaultRotationSetName,
          [new Rotation(0, `${this.defaultRotationName} 1`, abilitySelections)]
        );
      }
      // If it's an array of ability selections
      if (rawData[0].selectedAbility || rawData[0].SelectedAbility) {
        const normalizedSelections = await Promise.all(
          rawData.map((selection: any) => normalizeAbilitySelection(selection))
        );
        return new RotationSet(
          this.defaultRotationSetName,
          [new Rotation(0, "Rotation 1", normalizedSelections)]
        );
      }
    }

    throw new Error("Invalid rotation data format.");
  }
}
