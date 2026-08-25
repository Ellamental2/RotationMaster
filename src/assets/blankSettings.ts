import { BoolSettingConfig, RangeSettingConfig, SettingConfig, SettingTypeEnum } from '../models';

export const blankSettings: (SettingConfig)[] = [
    new SettingConfig('activeOverlay', SettingTypeEnum.Boolean, true, true),
    new RangeSettingConfig('overlayRefreshRate', 'Overlay Refresh Rate', 20, 500, 50, 'ms', false, 'The rate that the overlay should refresh - in milliseconds. Requires reloading to take effect.'),
    new SettingConfig('overlayPosition', SettingTypeEnum.Grid, { x: 100, y: 100 }, false, 'Set Overlay Position'),
    new RangeSettingConfig('abilitiesPerRow', 'Abilities Per Row', 1, 20, 10, undefined, false, 'The number of abilities to show per row in the overlay'),
    new RangeSettingConfig('lineBreakSpacing', 'Line Break Spacing', 0, 100, 0, '%', false, 'Vertical space between rows after a line break. Left keeps the current gap; right is one full row of icons.'),
    new RangeSettingConfig('uiScale', 'UI Scale', 50, 200, 100, undefined, false, 'Adjusts the size of the Overlay'),
    new BoolSettingConfig('previewOnly', 'Preview Only Mode', false, false, 'Show only the selected rotation preview and hide other UI elements'),
    new SettingConfig('updatingOverlayPosition', SettingTypeEnum.Boolean, false, true),
    new SettingConfig('lastKnownVersion', SettingTypeEnum.Text, '0.0.1', true)
];