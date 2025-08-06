export interface IPatch {
    version: string;
    description: string;
    changes: string[];
}

export class Patch implements IPatch {
    version: string;
    description: string;
    changes: string[];

    constructor(version: string, description: string, changes: string[]) {
        this.version = version;
        this.description = description;
        this.changes = changes;
    }
}

export class Setting {
    name: string;
    type: SettingTypeEnum;
    value?: string | boolean | number | { x: number, y: number };
    description?: string;
    classes?: string[];

    constructor(name: string, type: SettingTypeEnum, value?: string | boolean | number | { x: number, y: number }, description?: string, classes?: string[]) {
        this.name = name;
        this.type = type;
        this.value = value;
        this.description = description;
        this.classes = classes;
    }
}

export class RangeSetting extends Setting {
    minValue: number;
    maxValue: number;
    unit?: string;

    constructor(name: string,  minValue: number, maxValue: number, value?: number, unit?:string, description?: string, classes?: string[]) {
        super(name, SettingTypeEnum.Range, value, description, classes);
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.unit = unit;
    }
}
export enum SettingTypeEnum {
    Text = 'text',
    Number = 'number',
    Boolean = 'boolean',
    Range = 'range',
    Grid = 'grid'
}

export class RotationSet {
    Name: string;
    Data: Rotation[];

    constructor(name: string | null = null, data: Rotation[] | null = null) {
        this.Name = name ?? 'New Rotation Set';
        this.Data = data ?? [new Rotation()];
    }
}

export class Rotation {
    Id: number;
    Name: string;
    Data: AbilitySelection[];

    constructor(id: number | null = null, name: string | null = null, data: AbilitySelection[] | null = null) {
        this.Id = id ?? 0;
        this.Name = name ?? 'New Rotation';
        this.Data = data ?? [new AbilitySelection()];
    }
}

export class AbilitySelection {
    Separator: string;
    SelectedAbility: Ability | null;
    Notes: string | null;

    constructor(separator: string = '→', selectedAbility: Ability | null = null, notes: string | null = null) {
        this.Separator = separator;
        this.SelectedAbility = selectedAbility;
        this.Notes = notes;
    }
}

export class Ability {
    Title: string;
    Emoji: string;
    EmojiId: string;
    Category: string;
    Src: string;      
    
    constructor(title: string, emoji: string, emojiId: string, category: string, src: string) {
        this.Title = title;
        this.Emoji = emoji;
        this.EmojiId = emojiId;
        this.Category = category;
        this.Src = src;
    }
}

