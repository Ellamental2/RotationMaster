import { RangeSetting, Setting, SettingTypeEnum } from '../models';

export const blankSettings: (Setting)[] = [
    new Setting('activeOverlay', SettingTypeEnum.Boolean, true),
    new RangeSetting('overlayRefreshRate', 20, 500, 50, 'ms', 'The rate that the overlay should refresh - in milliseconds. Requires reloading to take effect.'),
    new Setting('overlayPosition', SettingTypeEnum.Grid, { x: 100, y: 100 }, 'Set Overlay Position'),
    new RangeSetting('abilitiesPerRow', 1, 20, 10, undefined, 'The number of abilities to show per row in the overlay'),
    new RangeSetting('uiScale', 50, 200, 100, undefined, 'Adjusts the size of the Overlay'),
    new Setting('updatingOverlayPosition', SettingTypeEnum.Boolean, false),
    new Setting('lastKnownVersion', SettingTypeEnum.Text, '0.0.1')
];