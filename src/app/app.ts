import { AfterViewInit, Component, DOCUMENT, Inject, signal } from '@angular/core';
import {
  AbilitySelection, BoolSettingConfig, IPatch, Patch, Position, RangeSettingConfig, RotationSet, SettingConfig,
  SettingTypeEnum, TriggerTypeEnum
} from '../models';
import {
  captureRsScreen, captureSlotBaseline, detectAbilityInActionBar, isSlotActivated, SlotPosition
} from '../actionBarMonitor';
import { blankSettings } from '../assets/blankSettings';
import patchnotes from '../patchnotes.json';
import { PatchNotesComponent } from './patch-notes/patch-notes';
import { RotationSetComponent } from './rotation-set/rotation-set';
import { Settings } from './settings/settings';
import { toCanvas } from 'html-to-image';
import * as a1lib from 'alt1';
import * as chatbox from 'alt1/chatbox'
import * as a1base from 'alt1/base';
import * as ocr from 'alt1/ocr';
import Tesseract from 'tesseract.js';

@Component({
  selector: 'app-root',
  imports: [RotationSetComponent, Settings, PatchNotesComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit {


  imgs: any = {};

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  protected readonly title = signal('RotationMaster');
  protected readonly version = signal('3.3.0');
  protected readonly appName = signal('rotationMaster');

  patchNotes: IPatch[] = [];
  patchNotesVisible = false;
  selectedRotationSet: RotationSet = new RotationSet();
  selectedIndex: number = 0;
  updatingOverlayPosition = false;
  overlayInitialized: boolean = false;

  // Settings related properties
  settings: SettingConfig[] = [];
  elementCache: Record<string, HTMLElement | null> = {};
  Output: HTMLElement | null = null;

  // Settings signals
  protected readonly rangeSettings = signal<RangeSettingConfig[]>([]);
  protected readonly boolSettings = signal<BoolSettingConfig[]>([]);

  //get a specific setting value
  getSettingValue(name: string): any {
    const setting = this.settings.find(s => s.name === name);
    return setting ? setting.value : null;
  }

  async ngOnInit() {

    this.Output = this.getById('output');

    this.initSettings();
    this.showPatchNotes(false);
    this.onUpdateSetting({ name: 'lastKnownVersion', value: this.version() })

    this.loadSlotPositions();

    if (window.alt1) {
      a1lib.identifyApp('./appconfig.json');
      // Use Alt1 global API if available
      a1lib.on('alt1pressed', (ev: any) => this.alt1pressed(ev));

      // Check the alt1 version is > 1.6.0
      if(!a1lib.hasAlt1Version('1.6.0')) {
        this.Output?.insertAdjacentHTML(
          'beforeend',
          `<div>Alt1 version is too old. Please update to the latest version.</div>`
        );
      }

    } else {
      this.Output?.insertAdjacentHTML(
        'beforeend',
        `<div>Alt1 not detected, You need to run this page in alt1 to show the overlay.</div>`
      );
      return;
    }

    if (!alt1.permissionOverlay) {
      this.Output?.insertAdjacentHTML(
        'beforeend',
        `<div><p>Attempted to use Overlay but app overlay permission is not enabled. Please enable "Show Overlay" permission in Alt1 settinsg (wrench icon in corner).</p></div>`
      );
      return;
    }

    const waveImg = this.loadImage('assets/wave.data.png');
    const kilnWaveImg = this.loadImage('assets/kiln_wave.data.png');
    const phaseImg = this.loadImage('assets/phase.data.png');
    const healthImg = this.loadImage('assets/boss_health.data.png');

    this.imgs = a1lib.ImageDetect.webpackImages({
      "wave": waveImg,
      "kiln_wave": kilnWaveImg,
      "phase": phaseImg,
      "health": healthImg
    });
  }

  ngAfterViewInit() {
    // Use setTimeout to ensure all child components are fully rendered
    setTimeout(() => {
      this.initializeOverlay();
      this.startActionBarMonitoring();
    }, 100);
  }

  onUpdateSetting(event: any) {
    const settingName = event.name as string;
    const settingValue = event.value;

    const settingToUpdate = this.settings.find(setting => setting.name === settingName);
    if (settingToUpdate) {
      settingToUpdate.value = settingValue;

      // Update signals if needed
      if (settingToUpdate.type === SettingTypeEnum.Range) {
        this.rangeSettings.set(this.settings.filter(s => s.type === SettingTypeEnum.Range) as RangeSettingConfig[]);
      } else if (settingToUpdate.type === SettingTypeEnum.Boolean) {
        this.boolSettings.set(this.settings.filter(s => s.type === SettingTypeEnum.Boolean) as BoolSettingConfig[]);
      }
    }

    // Trigger auto-detection when tracker is enabled
    if (settingName === 'useKeybinds' && settingValue === true) {
      this.detectAbilitiesInCurrentRotation();
    }

    // update local storage
    const currentSettings = JSON.parse(localStorage.getItem(`${this.appName}_settings`) || '{}');
    currentSettings[settingName] = settingValue;
    localStorage.setItem(`${this.appName}_settings`, JSON.stringify(currentSettings));
  }

  async showPatchNotes(showAll: boolean) {
    const lastKnownVersion = showAll ? '0.0.1' : this.settings.find(s => s.name === 'lastKnownVersion')?.value || '0.0.1';

    if (lastKnownVersion == this.version()) {
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
        lastKnownVersion: '0.0.1',
        previewOnly: false
      }));
    }
    else {
      const savedSettings = JSON.parse(localStorage.getItem(`${this.appName}_settings`) || '{}');
      this.settings.forEach(s => {
        s.value = savedSettings[s.name] || s.value;
      });
    }

    // Initialize range and bool settings signals
    this.rangeSettings.set(this.settings.filter(s => s.type === SettingTypeEnum.Range && !s.hidden) as RangeSettingConfig[]);
    this.boolSettings.set(this.settings.filter(s => s.type === SettingTypeEnum.Boolean && !s.hidden) as BoolSettingConfig[]);
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

  alt1pressed(ev: any): void {
    if (this.updatingOverlayPosition) {
      this.stopUpdatingOverlayPosition();
    } else {
      this.cycleRotationSet();
    }
  }

  exitPreviewMode(): void {
    this.onUpdateSetting({ name: 'previewOnly', value: false });
  }

  cycleRotationSet() {
    var numRots = this.selectedRotationSet?.Data.length || 0;
    if (numRots <= 1) { return; }

    this.selectedIndex = (this.selectedIndex + 1) % numRots; // Cycle through rotations
    this.activeStepIndex.set(0);

    //update selected value of radiobuttons in ui
    const rotationRadios = document.querySelectorAll('input[name="rotationSelector"]');
    rotationRadios.forEach((radio, index) => {
      (radio as HTMLInputElement).checked = index === this.selectedIndex;
    });

    // Show rotation name label overlay
    this.showRotationNameOverlay();

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

  private findHealth(): Position | null {
    let img = a1base.captureHoldFullRs();
    var poslist = img.findSubimage(this.imgs['health']);

    if (poslist.length > 0){
      var posx = poslist[0].x;
      var posy = poslist[0].y;
      var posw = 389;
      var posh = 27;

      return new Position(
        posx,
        posy,
        posw,
        posh,
        24,
        12
      )
    };

    console.log("No healthbar found");
    return null;
  }

  private findWave(): Position | null {
    let img = a1base.captureHoldFullRs();

    // Declare poslist once at the top
    let poslist = img.findSubimage(this.imgs['phase']);

    if (poslist.length > 0) {
      return new Position(
        poslist[0].x,
        poslist[0].y,
        90,
        24,
        24,
        12
      );
    }

    poslist = img.findSubimage(this.imgs['wave']);
    if (poslist.length > 0) {
      return new Position(
        poslist[0].x - 10,
        poslist[0].y - 24,
        90,
        24,
        24,
        12
      );
    }

    poslist = img.findSubimage(this.imgs['kiln_wave']);
    if (poslist.length > 0) {
      return new Position(
        poslist[0].x + 21,
        poslist[0].y - 15,
        74,
        18,
        21,
        -15
      );
    }

    console.log("No wave found");
    return null;
  }

  private waveCountFont: ocr.FontDefinition | null = null;

  private async readImageNum(pos: Position): Promise<number | null> {

    let img = a1base.captureHold(pos.x, pos.y, pos.w, pos.h);

    var str = alt1.bindReadColorString(img.handle, "chat", a1base.mixColor(255,255,255), pos.xos, pos.yos);

    let imgData = img.toData(pos.x, pos.y, pos.w, pos.h);

    const canvas = this.document.createElement('canvas');
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    const ctx = canvas.getContext('2d');

    ctx?.putImageData(imgData, 0, 0);

    const imgDataUrl = canvas.toDataURL();

    if (str == null || str.length == 0) {
      //if (!this.waveCountFont) { this.waveCountFont = await fetch("../assets/fonts/aa_10px-mono.fontmeta.json").then(res => res.json()); }
      //str = ocr.findReadLine(imgData, this.waveCountFont!, [[227,204,207]], 0, 14, pos.w, 10).text;
      await Tesseract.recognize(imgDataUrl,'eng').then(({ data: { text } }) => { str = text; });
      if (str == null || str.length == 0) {
        console.log("No wave text found");
        return null;
      }
    }

    var match = str.match(/(\d{1,3}(?:,\d{3})+|\d+)/g);
    if (match) {
      return +match[0].replace(',','');
    }

    return null;
  }

  async updateOverlayPosition() {
    this.updatingOverlayPosition = true;
    this.getById('rotationMaster')?.classList.toggle('positioning', true);

    const updatePosition = async () => {
      if (!this.updatingOverlayPosition) return;

      alt1.setTooltip('Press Alt+1 to save position');

      const abilitiesElement = this.getById('OverlayCanvasOutput');
      const uiScale = this.getSettingValue('uiScale') || 100;
      const mouse = a1lib.getMousePosition();

      const mouseX = mouse?.x ?? 100;
      const mouseY = mouse?.y ?? 100;
      const elementWidth = abilitiesElement?.offsetWidth ?? 0;
      const elementHeight = abilitiesElement?.offsetHeight ?? 0;

      this.onUpdateSetting({
        name: 'overlayPosition',
        value: {
          x: Math.floor(mouseX - (uiScale / 100) * (elementWidth / 2)),
          y: Math.floor(mouseY - (uiScale / 100) * (elementHeight / 2))
        }
      });

      requestAnimationFrame(() => {
        const selectedRotation = this.selectedRotationSet.Data[this.selectedIndex ?? 0];
        const hasAbilities = selectedRotation?.Data.some(s => s.SelectedAbility);
        const message = hasAbilities
          ? "Updating overlay position..."
          : "Populate a rotation for better positioning...";

        this.showRotationNameOverlay(message);
        updatePosition();
      });
    };

    updatePosition();
  }

  stopUpdatingOverlayPosition() {
    this.updatingOverlayPosition = false;
    this.getById('rotationMaster')?.classList.toggle('positioning', false);
    alt1.clearTooltip();
    const currentOverlayPosition = this.getSettingValue('overlayPosition') || { x: 100, y: 100 };
    alt1.overLayRefreshGroup('rotMasterRegion');
  }

  public getSelectedRotationPreview(): HTMLElement | null {
    const previewId = `rotation-preview-${this.selectedIndex}`;
    return this.getById(previewId);
  }

  private chatReader = new chatbox.default();

  private async readChatbox(): Promise<string | null> {
    try {
      let img = a1base.captureHoldFullRs();
      if (!this.chatReader.find(img)) return this.currentChatLine; // keep last known
      let lines = this.chatReader.read(img);
      if (!lines || lines.length === 0) return this.currentChatLine;
      return lines[lines.length - 1]?.text ?? this.currentChatLine;
    } catch {
      return this.currentChatLine;
    }
  }

  private currentBossHealth: number | null = null;
  private currentWave: number | null = null;
  protected currentChatLine: string | null = null;

  readonly activeStepIndex = signal<number>(0);
  readonly detectedAbilities = signal<Set<string>>(new Set());

  private slotPositions: Map<string, SlotPosition> = new Map();

  // ── Action bar monitoring ─────────────────────────────────────────────────
  private actionBarMonitorHandle: any;
  private slotBaseline: ImageData | null = null;
  private lastMonitoredStep: number = -1;

  // ── Calibration state ─────────────────────────────────────────────────────
  readonly calibrationState = signal<{ abilityTitle: string; canvasScaleX: number; canvasScaleY: number } | null>(null);

  private lastRenderedHash: string = '';
  private lastRenderedImage: { encoded: string, width: number } | null = null;

  private getRotationHash(rotationIndex: number): string {
    const rotation = this.selectedRotationSet.Data[rotationIndex];
    if (!rotation) return '';
    const useTracker = !!this.getSettingValue('useKeybinds');
    const abilityStr = rotation.Data
      .filter(s => s.SelectedAbility)
      .map(s => `${s.Separator}:${s.SelectedAbility!.Title}:${s.Notes ?? ''}`)
      .join(',');
    const pos = this.getSettingValue('overlayPosition') || { x: 0, y: 0 };
    const stepPart = useTracker ? `|${this.activeStepIndex()}` : '';
    return `${rotationIndex}|${rotation.Name}|${abilityStr}|${this.getSettingValue('uiScale')}|${(pos as any).x},${(pos as any).y}|tracker:${useTracker}${stepPart}`;
  }

  startOverlay() {
    const refreshRate = this.getSettingValue('overlayRefreshRate') || 50;
    let overlayPosition;

    const updateOverlay = async () => {
      // Trigger detection runs every tick regardless of render state
      let wavePos = this.findWave();
      if (wavePos) {
        let waveNum = await this.readImageNum(wavePos);
        if (waveNum && this.currentWave !== waveNum) {
          this.currentWave = waveNum;
          console.log("Current wave/phase: " + waveNum);
        }
      }

      this.currentChatLine = await this.readChatbox();

      const matchedIndex = this.findRotationIndexByTrigger(
        this.currentWave,
        this.currentChatLine,
        this.currentBossHealth
      );

      if (this.shouldSwitchRotation(matchedIndex)) {
        this.selectedIndex = matchedIndex;
        this.activeStepIndex.set(0);
        this.lastRenderedHash = ''; // force re-render on switch
        this.showRotationNameOverlay();
      }

      // Skip expensive re-render if nothing has changed — but still re-push cached image to keep overlay alive
      const currentHash = this.getRotationHash(this.selectedIndex);
      if (currentHash === this.lastRenderedHash) {
        if (this.lastRenderedImage) {
          alt1.overLaySetGroup('rotMasterRegion');
          alt1.overLayFreezeGroup('rotMasterRegion');
          alt1.overLayClearGroup('rotMasterRegion');
          alt1.overLayImage(
            this.getSettingValue('overlayPosition')?.x ?? 100,
            this.getSettingValue('overlayPosition')?.y ?? 100,
            this.lastRenderedImage.encoded,
            this.lastRenderedImage.width,
            refreshRate
          );
          alt1.overLayRefreshGroup('rotMasterRegion');
        }
        setTimeout(() => requestAnimationFrame(updateOverlay), refreshRate);
        return;
      }
      this.lastRenderedHash = currentHash;

      const selectedRotation = this.selectedRotationSet.Data[this.selectedIndex ?? 0] || this.selectedRotationSet;

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

      // Check if the overlay has content and visible dimensions
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

        // Significantly improve height calculation to ensure all images are visible
        // Get actual row count based on the layout in rotation-preview component
        const rowCount = Math.ceil(totalTrackedItems / abilitiesPerRow);

        // Get the actual rows from the DOM if possible for more accurate measurement
        const rowElements = overlay.querySelectorAll('.rotation-preview-row');

        // Determine the scaled row height based on UI scale
        // At lower UI scales, we need relatively more pixels per row
        const baseRowHeight = 60; // Increased base height per row
        const scaleFactor = Math.max(2.0, 100 / Math.max(uiScale, 10)); // Inverse scale factor, with minimum
        const scaledRowHeight = baseRowHeight * scaleFactor;

        let totalRowHeight = 0;

        // Calculate total height by measuring actual row elements if available
        if (rowElements && rowElements.length > 0) {
          // Count the total number of ability images to handle more complex layouts
          let totalImages = 0;
          for (let i = 0; i < rowElements.length; i++) {
            const rowElement = rowElements[i] as HTMLElement;
            const imagesInRow = rowElement.querySelectorAll('.ability-image').length;
            totalImages += imagesInRow;

            // Get the measured height or use our scaled calculation
            const measuredHeight = Math.max(rowElement.offsetHeight, rowElement.scrollHeight);
            totalRowHeight += measuredHeight > 0 ? measuredHeight : scaledRowHeight;
          }

          // Add extra buffer for each row and scale it properly
          totalRowHeight += rowElements.length * 20 * scaleFactor;

          // Apply additional scaling for large numbers of images
          if (totalImages > 50) {
            totalRowHeight *= 1.2; // Add 20% more height for very large rotations
          }
        } else {
          // Fallback calculation with generous spacing
          totalRowHeight = rowCount * scaledRowHeight;
        }

        // Ensure we never go below the measured height, apply UI scaling and add extra bottom padding
        // The scaling divisor compensates for the pixelRatio in the toCanvas function
        const calculatedHeight = Math.max(
          height * 1.2, // Use actual content height with 20% buffer
          totalRowHeight + totalVerticalPadding + (100 * scaleFactor), // Add extra scaled padding at bottom
          100 // Increased absolute minimum
        );

        const dataUrl = await toCanvas(overlay, {
          backgroundColor: 'transparent',
          skipFonts: true,
          width: minWidth,
          height: calculatedHeight,
          quality: 1,
          pixelRatio: Math.max(0.5, uiScale / 100), // Ensure minimum pixelRatio of 0.5 to prevent scaling issues
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
          const encoded = a1lib.encodeImageString(base64ImageString);
          this.lastRenderedImage = { encoded, width: base64ImageString.width };
          alt1.overLaySetGroup('rotMasterRegion');
          alt1.overLayFreezeGroup('rotMasterRegion');
          alt1.overLayClearGroup('rotMasterRegion');
          alt1.overLayImage(
            overlayPosition.x,
            overlayPosition.y,
            encoded,
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
  }

  async timeout(millis: number) {
    return new Promise(function (resolve) {
      setTimeout(resolve, millis);
    });
  }

  onSelectedRotationSetChange(rotationSet: RotationSet) {
    this.selectedRotationSet = rotationSet;
    this.showRotationNameOverlay();
    if (this.getSettingValue('useKeybinds')) {
      this.detectAbilitiesInCurrentRotation();
    }
  }

  onChangeSelectedRotation(rotationId: number) {
    this.selectedIndex = rotationId;
    this.activeStepIndex.set(0);
    this.lastRenderedHash = '';
    this.showRotationNameOverlay();
  }

  getBossHealth(): number {
    return 100;
  }

  async loadImage(src: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve(imageData);
      };
      img.onerror = reject;
    });
  }

  // ── Step grouping ─────────────────────────────────────────────────────────

  private isGroupingSeparator(sep: string): boolean {
    return sep.includes('+') || sep.includes('/');
  }

  private getRotationSteps(data: AbilitySelection[]): AbilitySelection[][] {
    const steps: AbilitySelection[][] = [];
    let current: AbilitySelection[] = [];
    for (const sel of data) {
      if (!sel.SelectedAbility) continue;
      if (current.length === 0 || !this.isGroupingSeparator(sel.Separator)) {
        if (current.length > 0) steps.push(current);
        current = [sel];
      } else {
        current.push(sel);
      }
    }
    if (current.length > 0) steps.push(current);
    return steps;
  }

  // ── Action bar monitoring ─────────────────────────────────────────────────

  private startActionBarMonitoring(): void {
    const poll = () => {
      this.pollActionBarStep();
      this.actionBarMonitorHandle = setTimeout(poll, 150);
    };
    poll();
  }

  private pollActionBarStep(): void {
    if (!this.getSettingValue('useKeybinds') || !window.alt1) return;

    const rotation = this.selectedRotationSet?.Data[this.selectedIndex];
    if (!rotation) return;

    const steps = this.getRotationSteps(rotation.Data);
    if (steps.length === 0) return;

    const currentStep = this.activeStepIndex();

    // Reset baseline whenever the active step changes
    if (currentStep !== this.lastMonitoredStep) {
      this.slotBaseline = null;
      this.lastMonitoredStep = currentStep;
    }

    const activeGroup = steps[currentStep];
    if (!activeGroup) return;

    // Find the first ability in the group that has a known slot position
    const target = activeGroup.find(s => s.SelectedAbility && this.slotPositions.has(s.SelectedAbility.Title));
    if (!target?.SelectedAbility) return;

    const slot = this.slotPositions.get(target.SelectedAbility.Title)!;

    // Capture a fresh baseline on the first tick for this step
    if (!this.slotBaseline) {
      this.slotBaseline = captureSlotBaseline(slot);
      return;
    }

    if (isSlotActivated(slot, this.slotBaseline)) {
      this.slotBaseline = null;
      this.advanceStep(steps.length);
    }
  }

  private advanceStep(totalSteps: number): void {
    const step = this.activeStepIndex();
    if (step < totalSteps - 1) {
      this.activeStepIndex.set(step + 1);
      this.lastRenderedHash = '';
    } else {
      const switched = this.switchToOnCompletionRotation();
      if (!switched) {
        this.activeStepIndex.set(0);
        this.lastRenderedHash = '';
      }
    }
  }

  private switchToOnCompletionRotation(): boolean {
    const targetIndex = this.selectedRotationSet?.Data.findIndex(
      r => r.Trigger?.Type === TriggerTypeEnum.OnCompletion
    ) ?? -1;
    if (targetIndex !== -1 && targetIndex !== this.selectedIndex) {
      this.selectedIndex = targetIndex;
      this.activeStepIndex.set(0);
      this.lastRenderedHash = '';
      this.showRotationNameOverlay();
      return true;
    }
    return false;
  }

  // ── Auto-detection ────────────────────────────────────────────────────────

  async detectAbilitiesInCurrentRotation(): Promise<void> {
    if (!window.alt1) return;
    const rotation = this.selectedRotationSet?.Data[this.selectedIndex];
    if (!rotation) return;

    const seen = new Set<string>();
    for (const sel of rotation.Data) {
      if (!sel.SelectedAbility) continue;
      const title = sel.SelectedAbility.Title;
      if (this.slotPositions.has(title) || seen.has(title)) continue;
      seen.add(title);
      const pos = await detectAbilityInActionBar(sel.SelectedAbility.Src);
      if (pos) this.slotPositions.set(title, pos);
    }

    this.saveSlotPositions();
    this.detectedAbilities.set(new Set(this.slotPositions.keys()));
    this.lastRenderedHash = '';
  }

  // ── Calibration ───────────────────────────────────────────────────────────

  onCalibrateSlot(abilityTitle: string): void {
    const result = captureRsScreen();
    if (!result) {
      alert('Alt1 not available — cannot capture RS screen.');
      return;
    }
    this.calibrationState.set({
      abilityTitle,
      canvasScaleX: result.scaleX,
      canvasScaleY: result.scaleY
    });
    // Draw the screenshot into the modal canvas after Angular renders it
    setTimeout(() => {
      const canvas = document.getElementById('calibration-canvas') as HTMLCanvasElement | null;
      if (!canvas) return;
      canvas.width = result.canvas.width;
      canvas.height = result.canvas.height;
      canvas.getContext('2d')!.drawImage(result.canvas, 0, 0);
    }, 50);
  }

  onCalibrationCanvasClick(event: MouseEvent): void {
    const state = this.calibrationState();
    if (!state) return;
    const canvas = event.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const rsX = Math.round((event.clientX - rect.left) / state.canvasScaleX);
    const rsY = Math.round((event.clientY - rect.top) / state.canvasScaleY);
    this.slotPositions.set(state.abilityTitle, { x: rsX, y: rsY });
    this.saveSlotPositions();
    this.detectedAbilities.set(new Set(this.slotPositions.keys()));
    this.calibrationState.set(null);
    this.lastRenderedHash = '';
  }

  cancelCalibration(): void {
    this.calibrationState.set(null);
  }

  // ── Slot position persistence ─────────────────────────────────────────────

  private loadSlotPositions(): void {
    try {
      const raw = localStorage.getItem(`${this.appName()}_slotPositions`);
      if (raw) {
        const obj = JSON.parse(raw) as Record<string, SlotPosition>;
        this.slotPositions = new Map(Object.entries(obj));
        this.detectedAbilities.set(new Set(this.slotPositions.keys()));
      }
    } catch { /* ignore corrupt data */ }
  }

  private saveSlotPositions(): void {
    const obj: Record<string, SlotPosition> = {};
    this.slotPositions.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(`${this.appName()}_slotPositions`, JSON.stringify(obj));
  }

  // ── Trigger detection ──────────────────────────────────────────────────────

  private findRotationIndexByTrigger(wave: number | null, chatLine: string | null, health: number | null): number {
    return this.selectedRotationSet.Data.findIndex(rotation => {
      const trigger = rotation.Trigger;
      if (!trigger) return false;

      switch (trigger.Type) {
        case TriggerTypeEnum.Wave:
          return wave !== null && +trigger.Value === wave;

        case TriggerTypeEnum.Chat:
          return chatLine !== null &&
            chatLine.toLowerCase().includes(trigger.Value.toLowerCase());

        case TriggerTypeEnum.Health:
          return health !== null && health <= +trigger.Value;

        default:
          return false;
      }
    });
  }

  private shouldSwitchRotation(matchedIndex: number): boolean {
    return matchedIndex !== -1 && matchedIndex !== this.selectedIndex;
  }

}
