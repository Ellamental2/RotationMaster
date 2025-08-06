import { Component, Inject, DOCUMENT, AfterViewInit } from '@angular/core';
import patchnotes from 'src/patchnotes.json';

import * as htmlToImage from 'html-to-image';
import { IPatch, Patch, RangeSetting, RotationSet } from '../models';
import { blankSettings } from 'src/assets/blankSettings';
import * as a1lib from 'alt1';

declare global {
  interface Window {
    alt1?: any;
  }
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})

export class AppComponent implements AfterViewInit {
  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  title = 'RotationMaster';
  version = '3.0.0';
  appName = 'rotationMaster';
  patchNotes: IPatch[] = [];
  patchNotesVisible = false;
  selectedRotationSet: RotationSet = new RotationSet();
  selectedIndex: number = 0;
  updatingOverlayPosition = false;
  overlayInitialized: boolean = false;

  Output: HTMLElement | null = null;

  settings: any[] = [];
  rangeSettings(): RangeSetting[] {
    return this.settings.filter(s => s instanceof RangeSetting);
  }

  //get a specific setting value
  getSettingValue(name: string): any {
    const setting = this.settings.find(s => s.name === name);
    return setting ? setting.value : null;
  }

  elementCache: Record<string, HTMLElement | null> = {};

  ngOnInit() {

    a1lib.on('alt1pressed', (ev: any) => this.alt1pressed(ev));

    this.Output = this.getById('output');

    if (window.alt1) {
      //tell alt1 about the app
      a1lib.identifyApp('./appconfig.json');
    } else {
      let addappurl = `alt1://addapp/${new URL('./appconfig.json', window.location.href).href}`;
      this.Output?.insertAdjacentHTML(
        'beforeend',
        `<div>Alt1 not detected, You need to run this page in alt1 to capture the screen.</div>`
      );
      return;
    }
    // if (!a1lib.permissionPixel) {
    //   this.Output?.insertAdjacentHTML(
    //     'beforeend',
    //     `<div><p>Page is not installed as app or capture permission is not enabled</p></div>`
    //   );
    //   return;
    // }
    // if (!a1lib.permissionOverlay) {
    //   this.Output?.insertAdjacentHTML(
    //     'beforeend',
    //     `<div><p>Attempted to use Overlay but app overlay permission is not enabled. Please enable "Show Overlay" permission in Alt1 settinsg (wrench icon in corner).</p></div>`
    //   );
    //   return;
    // }
    this.initSettings();
    this.showPatchNotes(false);
    this.onUpdateSetting({ name: 'lastKnownVersion', value: this.version });
  }

  ngAfterViewInit() {
    // Use setTimeout to ensure all child components are fully rendered
    setTimeout(() => {
      this.initializeOverlay();
    }, 100);
  }

  private initializeOverlay() {
    if (this.overlayInitialized) {
      return;
    }

    const overlay = this.getSelectedRotationPreview();
    if (overlay) {
      this.overlayInitialized = true;
      this.startOverlay();
    } else {
      // Retry after a short delay if overlay element is not ready yet
      setTimeout(() => {
        this.initializeOverlay();
      }, 100);
    }
  }

  startOverlay() {
    const refreshRate = this.getSettingValue('overlayRefreshRate') || 50;
    let overlayPosition;

    const updateOverlay = async () => {
      const selectedRotation = this.selectedRotationSet.Data[this.selectedIndex ?? 0];
      
      if (!selectedRotation) {
        console.error('No rotation is selected.');
        return;
      }

      // Check if there are any abilities to display
      const hasAbilities = selectedRotation.Data.some(selection => selection.SelectedAbility);
      if (!hasAbilities) {
        alt1.overLayClearGroup('rotMasterRegion');
        alt1.overLayRefreshGroup('rotMasterRegion');
        // Schedule the next update
        setTimeout(() => requestAnimationFrame(updateOverlay), refreshRate);
        return;
      }

      const overlay = this.getSelectedRotationPreview();

      if (!overlay) {
        // Clear overlay since there's nothing to show
        alt1.overLayClearGroup('rotMasterRegion');
        alt1.overLayRefreshGroup('rotMasterRegion');
        // Schedule the next update
        setTimeout(() => requestAnimationFrame(updateOverlay), refreshRate);
        return;
      }

      // console.log(`Looking for overlay element with ID: rotation-preview-${this.selectedIndex}`);
      // console.log('Overlay element found:', overlay);
      // console.log('Overlay parent:', overlay.parentElement);
      // console.log('Overlay classList:', overlay.classList.toString());

      // Check if the overlay has content and visible dimensions
      const rect = overlay.getBoundingClientRect();
      const computedStyle = getComputedStyle(overlay);
      
      // Check if element is actually visible
      const isVisible = computedStyle.display !== 'none' && 
                       computedStyle.visibility !== 'hidden' && 
                       computedStyle.opacity !== '0';
      
      if (!isVisible) {
        // Schedule the next update
        setTimeout(() => requestAnimationFrame(updateOverlay), refreshRate);
        return;
      }

      // Force a layout calculation to ensure proper dimensions
      overlay.style.visibility = 'hidden';
      overlay.style.position = 'absolute';
      overlay.style.left = '-9999px';
      overlay.style.display = 'block';
      overlay.style.width = 'auto';
      overlay.style.height = 'auto';
      
      // Force reflow
      overlay.offsetHeight;

      // Try to get dimensions from multiple sources
      let width = overlay.offsetWidth;
      let height = overlay.offsetHeight;
      
      // If still zero, try scroll dimensions
      if (width === 0 || height === 0) {
        width = overlay.scrollWidth;
        height = overlay.scrollHeight;
      }
      
      // If still zero, try getBoundingClientRect after forcing layout
      if (width === 0 || height === 0) {
        const newRect = overlay.getBoundingClientRect();
        width = newRect.width;
        height = newRect.height;
      }
      
      // Calculate content dimensions based on children if still zero
      if (width === 0 || height === 0) {
        const children = overlay.children;
        if (children.length > 0) {
          let maxWidth = 0;
          let totalHeight = 0;
          
          for (let i = 0; i < children.length; i++) {
            const child = children[i] as HTMLElement;
            const childRect = child.getBoundingClientRect();
            const childComputedStyle = getComputedStyle(child);
            
            // Get child dimensions
            const childWidth = Math.max(
              childRect.width,
              child.offsetWidth,
              child.scrollWidth,
              parseInt(childComputedStyle.width, 10) || 0
            );
            const childHeight = Math.max(
              childRect.height,
              child.offsetHeight,
              child.scrollHeight,
              parseInt(childComputedStyle.height, 10) || 0
            );
            
            maxWidth = Math.max(maxWidth, childWidth);
            totalHeight += childHeight;
          }
          
          if (maxWidth > 0) width = maxWidth;
          if (totalHeight > 0) height = totalHeight;
        }
      }
      
      // Restore original styles
      overlay.style.visibility = '';
      overlay.style.position = '';
      overlay.style.left = '';
      overlay.style.display = '';
      overlay.style.width = '';
      overlay.style.height = '';

      if (width === 0 || height === 0) {
        // console.log(`Overlay element still has no dimensions after forced layout - width: ${width}, height: ${height}`);
        // console.log('rect:', rect);
        // console.log('offsetWidth/Height:', overlay.offsetWidth, overlay.offsetHeight);
        // console.log('scrollWidth/Height:', overlay.scrollWidth, overlay.scrollHeight);
        // console.log('computedStyle width/height:', computedStyle.width, computedStyle.height);
        // console.log('Element HTML:', overlay.outerHTML);
        // console.log('Element children count:', overlay.children.length);
        
        // Check if children have dimensions
        if (overlay.children.length > 0) {
          for (let i = 0; i < overlay.children.length; i++) {
            const child = overlay.children[i] as HTMLElement;
            const childRect = child.getBoundingClientRect();
            // console.log(`Child ${i}:`, child.tagName, childRect);
          }
        }
        
        // Schedule the next update
        setTimeout(() => requestAnimationFrame(updateOverlay), refreshRate);
        return;
      }

      // console.log(`Element dimensions - width: ${width}, height: ${height}`);
      // console.log('Element rect:', rect);
      // console.log('Computed style:', {
      //   width: computedStyle.width,
      //   height: computedStyle.height,
      //   padding: computedStyle.padding,
      //   margin: computedStyle.margin,
      //   border: computedStyle.border
      // });

      const styles = getComputedStyle(overlay);

      const uiScale = this.getSettingValue('uiScale') || 100;
      const abilitiesPerRow = this.getSettingValue('abilitiesPerRow') || 10;
      const overlayPosition = this.getSettingValue('overlayPosition') || { x: 100, y: 100 };
      
      try {
        const totalTrackedItems = selectedRotation.Data.filter((abilitySelection) => abilitySelection.SelectedAbility).length;
        
        // Calculate dimensions with minimum values, using detected dimensions as fallback
        // Account for padding and border in the dimensions
        const paddingLeft = parseInt(computedStyle.paddingLeft, 10) || 0;
        const paddingRight = parseInt(computedStyle.paddingRight, 10) || 0;
        const paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;
        const paddingBottom = parseInt(computedStyle.paddingBottom, 10) || 0;
        
        const borderLeft = parseInt(computedStyle.borderLeftWidth, 10) || 0;
        const borderRight = parseInt(computedStyle.borderRightWidth, 10) || 0;
        const borderTop = parseInt(computedStyle.borderTopWidth, 10) || 0;
        const borderBottom = parseInt(computedStyle.borderBottomWidth, 10) || 0;
        
        const totalHorizontalPadding = paddingLeft + paddingRight + borderLeft + borderRight;
        const totalVerticalPadding = paddingTop + paddingBottom + borderTop + borderBottom;
        
        const minWidth = Math.max(
          width, // Use actual content width
          Math.min(totalTrackedItems * 40 + totalHorizontalPadding, 800), // Estimate based on content + padding
          50 // Absolute minimum
        );
        const calculatedHeight = Math.max(
          height, // Use actual content height
          Math.floor((totalTrackedItems / abilitiesPerRow) + 1) * 27 * (uiScale / 100) + totalVerticalPadding,
          50 // Absolute minimum
        );

        const dataUrl = await htmlToImage.toCanvas(overlay, {
          backgroundColor: 'transparent',
          skipFonts: true,
          width: minWidth,
          height: calculatedHeight,
          quality: 1,
          pixelRatio: uiScale / 100 - 0.00999999999999999999,
          skipAutoScale: true,
          style: {
            // Ensure the element is fully visible during capture
            transform: 'none',
            margin: '0',
            position: 'static'
          }
        });

        const base64ImageString = dataUrl
          .getContext('2d')
          ?.getImageData(0, 0, dataUrl.width, dataUrl.height);

        if (base64ImageString && base64ImageString.width > 0 && base64ImageString.height > 0) {
          alt1.overLaySetGroup('rotMasterRegion');
          alt1.overLayFreezeGroup('rotMasterRegion');
          alt1.overLayClearGroup('rotMasterRegion');
          alt1.overLayImage(
            overlayPosition.x,
            overlayPosition.y,
            a1lib.encodeImageString(base64ImageString),
            base64ImageString.width,
            refreshRate
          );
          alt1.overLayRefreshGroup('rotMasterRegion');
        } else {
          console.error('Invalid canvas data, clearing overlay');
          alt1.overLayClearGroup('rotMasterRegion');
          alt1.overLayRefreshGroup('rotMasterRegion');
        }
      } catch (e) {
        console.error(`html-to-image failed to capture:`, e);
        // Clear overlay on error to prevent stale display
        alt1.overLayClearGroup('rotMasterRegion');
        alt1.overLayRefreshGroup('rotMasterRegion');
      }

      //Schedule the next update
      setTimeout(() => requestAnimationFrame(updateOverlay), refreshRate);
    }

    // Start the first update
    requestAnimationFrame(updateOverlay);
  }

  async showPatchNotes(showAll: boolean) {
    const lastKnownVersion = showAll ? '0.0.1' : this.settings.find(s => s.name === 'lastKnownVersion')?.value || '0.0.1';

    if (lastKnownVersion == this.version) {
      return;
    }

    const allPatchNotes = (patchnotes.patches ?? []) as Patch[];

    this.patchNotes = allPatchNotes.filter(patch =>
      !lastKnownVersion || patch.version > lastKnownVersion
    );

    this.patchNotes.sort((a: any, b: any) => {
      const versionA = a.version.split('.').map(Number);
      const versionB = b.version.split('.').map(Number);

      for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
        const numA = versionA[i] || 0; // Default to 0 if undefined
        const numB = versionB[i] || 0; // Default to 0 if undefined
        if (numA !== numB) {
          return numB - numA; // Sort descending
        }
      }
      return 0; // Versions are equal
    });

    if (this.patchNotes.length === 0) {
      // No new patch notes to show
      return;
    }

    this.patchNotesVisible = true;
  }

  hidePatchNotes() {
    this.patchNotesVisible = false;
  }

  public getById(id: string): HTMLElement | null {
    // Check if the element is already cached
    if (this.elementCache[id]) {
      return this.elementCache[id];
    }

    // If not cached, retrieve the element from the DOM
    const element = this.document.getElementById(id);
    // save to cache
    this.elementCache[id] = element;

    return element;
  }

  public getSelectedRotationPreview(): HTMLElement | null {
    const previewId = `rotation-preview-${this.selectedIndex}`;
    return this.getById(previewId);
  }

  initSettings() {
    this.settings = blankSettings;
    if(!localStorage.getItem(`${this.appName}_settings`)) {
      localStorage.setItem(`${this.appName}_settings`, JSON.stringify({
        activeOverlay: true,
        overlayRefreshRate: 50,
        overlayPosition: { x: 100, y: 100 },
        abilitiesPerRow: 10,
        uiScale: 100,
        updatingOverlayPosition: false,
        lastKnownVersion: '0.0.1'
      }));
    }
    else {
      const savedSettings = JSON.parse(localStorage.getItem(`${this.appName}_settings`) || '{}');
      this.settings.forEach(s => {
        s.value = savedSettings[s.name] || s.value;
      });
    }
  }

  onUpdateSetting(event: any) {
    const settingName = event.name as string;
    const settingValue = event.value;

    this.settings.find(setting => setting.name === settingName)!.value = settingValue;

    // update local storage
    const currentSettings = JSON.parse(localStorage.getItem(`${this.appName}_settings`) || '{}');
    currentSettings[settingName] = settingValue;
    localStorage.setItem(`${this.appName}_settings`, JSON.stringify(currentSettings));
  }

  onSelectedRotationSetChange(rotationSet: RotationSet) {
    this.selectedRotationSet = rotationSet;
    this.showRotationNameOverlay();
  }

  onChangeSelectedRotation(rotationId: number) {
    this.selectedIndex = rotationId;
    this.showRotationNameOverlay();
  }

  async updateOverlayPosition(){
    let oldPosition = this.getSettingValue('overlayPosition') || { x: 100, y: 100 };
    this.updatingOverlayPosition = true;
    this.getById('rotationMaster')?.classList.toggle('positioning', this.updatingOverlayPosition);
    
    const updatePosition = async () => {
      if (!this.updatingOverlayPosition) {
        return;
      }
      
      alt1.setTooltip('Press Alt+1 to save position');
      let abilitiesElement = this.getById('OverlayCanvasOutput');
      const uiScale = this.getSettingValue('uiScale') || 100;
      this.onUpdateSetting({
        name: 'overlayPosition',
        value: {
          x: Math.floor(
            a1lib.getMousePosition()?.x ?? 100 -
            (uiScale / 100) * (abilitiesElement?.offsetWidth ?? 2 / 2)
          ),
          y: Math.floor(
            a1lib.getMousePosition()?.y ?? 100 -
              (uiScale / 100) * (abilitiesElement?.offsetHeight ?? 2 / 2)
          )
        }
      });
      
      // Schedule next update using requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {updatePosition(); this.showRotationNameOverlay("Updating overlay position...");});
    };
    
    // Start the position update loop
    updatePosition();
  }
  
  stopUpdatingOverlayPosition() {
    this.updatingOverlayPosition = false;
    this.getById('rotationMaster')?.classList.toggle('positioning', false);
    alt1.clearTooltip();
    const currentOverlayPosition = this.getSettingValue('overlayPosition') || { x: 100, y: 100 };
    alt1.overLayRefreshGroup('rotMasterRegion');
  }
  async timeout(millis: number) {
    return new Promise(function (resolve) {
      setTimeout(resolve, millis);
    });
  }

  alt1pressed(ev: any): void {
    if (this.updatingOverlayPosition) {
      this.stopUpdatingOverlayPosition();
    } else {
      this.cycleRotationSet();
    }
  }

  cycleRotationSet() {
    var numRots = this.selectedRotationSet?.Data.length || 0;
    if (numRots <= 1) { return; }

    this.selectedIndex = (this.selectedIndex + 1) % numRots; // Cycle through rotations

    //update selected value of radiobuttons in ui
    const rotationRadios = document.querySelectorAll('input[name="rotationSelector"]');
    rotationRadios.forEach((radio, index) => {
      (radio as HTMLInputElement).checked = index === this.selectedIndex;
    });

    // Show rotation name label overlay
    this.showRotationNameOverlay();
  }

  private showRotationNameOverlay(override: string | null = null) {
    const selectedRotation = this.selectedRotationSet.Data[this.selectedIndex];
    if (!selectedRotation || !selectedRotation.Name) {
      return;
    }

    const overlayPosition = this.getSettingValue('overlayPosition') || { x: 100, y: 100 };
    const rotationName = override ?? selectedRotation.Name;
    
    // Create a canvas for the label
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set font and measure text
    ctx.font = '16px Arial';
    const textMetrics = ctx.measureText(rotationName);
    const padding = 2;
    const width = textMetrics.width + (padding * 2);
    const height = 24 + (padding * 2);

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);

    // // Draw border
    // ctx.strokeStyle = '#4a5a62';
    // ctx.lineWidth = 2;
    // ctx.strokeRect(1, 1, width - 2, height - 2);

    // Draw text
    ctx.fillStyle = '#cccccc';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rotationName, width / 2, height / 2);

    // Convert to image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Show the label overlay above the main overlay
    const labelY = overlayPosition.y - height - 2; // 2px gap above main overlay

    alt1.overLaySetGroup('rotMasterLabel');
    alt1.overLayClearGroup('rotMasterLabel');
    alt1.overLayImage(
      overlayPosition.x,
      labelY,
      a1lib.encodeImageString(imageData),
      imageData.width,
      2000 // 2 second duration
    );
    alt1.overLayRefreshGroup('rotMasterLabel');

    // // Clear the label after 2 seconds
    // setTimeout(() => {
    //   alt1.overLayClearGroup('rotMasterLabel');
    //   alt1.overLayRefreshGroup('rotMasterLabel');
    // }, 2000);
  }

}