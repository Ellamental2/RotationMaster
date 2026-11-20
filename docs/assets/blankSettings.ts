import { BoolSettingConfig, RangeSettingConfig, SettingConfig, SettingTypeEnum } from '../models';

export const blankSettings: (SettingConfig)[] = [
    new SettingConfig('activeOverlay', SettingTypeEnum.Boolean, true, true),
    new RangeSettingConfig('overlayRefreshRate', 'Overlay Refresh Rate', 20, 500, 50, 'ms', false, 'The rate that the overlay should refresh - in milliseconds. Requires reloading to take effect.'),
    new SettingConfig('overlayPosition', SettingTypeEnum.Grid, { x: 100, y: 100 }, false, 'Set Overlay Position'),
    new RangeSettingConfig('abilitiesPerRow', 'Abilities Per Row', 1, 20, 10, undefined, false, 'The number of abilities to show per row in the overlay'),
    new RangeSettingConfig('uiScale', 'UI Scale', 50, 200, 100, undefined, false, 'Adjusts the size of the Overlay'),
    new BoolSettingConfig('previewOnly', 'Preview Only Mode', false, false, 'Show only the selected rotation preview and hide other UI elements'),
    new BoolSettingConfig('useKeybinds', 'Action Bar Tracker', false, false, 'Enable the action bar tracker — auto-detects abilities on your action bar and highlights the current step in the overlay as you activate abilities in-game'),
    new SettingConfig('updatingOverlayPosition', SettingTypeEnum.Boolean, false, true),
    new SettingConfig('lastKnownVersion', SettingTypeEnum.Text, '0.0.1', true)
];