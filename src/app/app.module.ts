import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { SettingsComponent } from './settings/settings.component';
import { FormsModule } from '@angular/forms';
import { PatchNotesComponent } from './patch-notes/patch-notes.component';
import { RangeSettingComponent } from './range-setting/range-setting.component';
import { RotationSetComponent } from './rotation-set/rotation-set.component';
import { RotationContainerComponent } from './rotation-container/rotation-container.component';
import { CdkDrag, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { AbilitySelectorComponent } from './ability-selector/ability-selector.component';
import { SearchDropdownComponent } from './search-dropdown/search-dropdown.component';
import { RotationPreviewComponent } from './rotation-preview/rotation-preview.component';

@NgModule({
  declarations: [
    AppComponent,
    SettingsComponent,
    PatchNotesComponent,
    RangeSettingComponent,
    RotationSetComponent,
    RotationContainerComponent,
    AbilitySelectorComponent,
    SearchDropdownComponent,
    RotationPreviewComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    DragDropModule,
    CdkDropList,
    CdkDrag,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
