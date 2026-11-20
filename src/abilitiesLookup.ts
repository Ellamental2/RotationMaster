import { Ability, AbilitySelection } from "./models";
import abilitiesData from "./assets/abilities.json";


export function lookupAbilityByTitle(emojiString: string) : Ability | null {
  const abilities = abilitiesData as Ability[];

  const ability = abilities.find((ability : Ability) => ability.Title.toLowerCase() === emojiString.toLowerCase());
  if (ability) {
    return ability;
  }
  return null
}

export function lookupAbilityByEmoji(emojiString: string) : Ability | null {
  const ability = abilitiesData.find((ability : Ability) => ability.Emoji.toLowerCase() === emojiString.toLowerCase());
  if (ability) {
    return ability;
  }
  return null;
}

const blank = lookupAbilityByTitle('literallynothing') as Ability;

const separators = ['\\+', '→', '>', '/', 's', 'r', 'tc'];
const regex = new RegExp(`\\s*(${separators.join('|')})\\s*([^${separators.join('')}]+)`, 'g');

export function transformStringToAbilitySelections(inputString: string): AbilitySelection[] {
  let result = [] as AbilitySelection[];

  const pairs = extractPairs(inputString);

  for (const [separator, abilityString] of pairs) {
    const abilitySelection = new AbilitySelection(separator ?? '→', null, '');

    let string = abilityString;

    // check if abilityString contains a :...: pattern
    const colonMatch = abilityString.match(/:[^:]+:/);
    if (colonMatch) {
      // abilityString contains a :...: pattern
      // put the contents of the :...: pattern into lookupAbilityByTitle
      const abilityName = colonMatch[0].slice(1, -1); // remove surrounding colons
      const ability = lookupAbilityByTitle(abilityName);
      if (ability) {
        abilitySelection.SelectedAbility = ability;
        // Remove all :...: patterns from notes
        string = abilityString.replace(/:[^:]+:/g, '').trim();
      }
    }
    if (string.length > 0) {
      {
        abilitySelection.Notes = string;
      }
    }

    result.push(abilitySelection);
  }

  for (const abilitySelection of result) {
    if (abilitySelection.SelectedAbility === null && abilitySelection.Notes?.trim() !== '') {
      abilitySelection.SelectedAbility = blank;
    }
  }

  return result;
}

function splitColonSegments(input: string, seperator: string): [string, string][] {
  const regex = /(:[^:]+:)(.*?)(?=:[^:]+:|$)/g;
  const pairs: [string, string][] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    // match[1] is the :...: pattern, match[2] is the content after it (may be empty)
    const segment = (match[1] + (match[2] || '')).trim();
    pairs.push([seperator, segment]);
    seperator = '';
  }

  return pairs;
}

function extractPairs(input: string): [string, string][] {
  input = input.replace(/[()]/g, '').replace('→ tc +', 'tc').trim();

  // Stage 1: Symbol separators (no boundaries)
  const symbolSeparators = ['\\+', '→', '/', '>'];
  const symbolSplitRegex = new RegExp(`\\s*(${symbolSeparators.join('|')})\\s*`);
  const symbolTokens = input.split(symbolSplitRegex).filter(token => token !== undefined && token.trim() !== '');

  // Stage 2: Word separators (with boundaries)
  const wordSeparators = ['s', 'r', 'tc'];
  const wordSplitRegex = new RegExp(`\\b(${wordSeparators.join('|')})\\b`);

  const pairs: [string, string][] = [];
  let currentSeparator = '→';

  for (let token of symbolTokens) {
    if (symbolSeparators.includes(token) || token === '+') {
      currentSeparator = token;
      continue;
    }

    // Split by word separators inside each symbol token
    let wordTokens = token.split(wordSplitRegex).filter(t => t !== undefined && t.trim() !== '');

    for (let wt of wordTokens) {
      if (wordSeparators.includes(wt)) {
        currentSeparator = wt;
      } else {
        const colonSegments = splitColonSegments(wt.trim(), currentSeparator);
        if (colonSegments.length > 0) {
          for (const segment of colonSegments) {
            pairs.push(segment);
          }
        } else if (wt.trim().length > 0) {
          pairs.push([currentSeparator, wt.trim()]);
        }
      }
    }
  }

  return pairs;
}

export function transformAbilitySelectionsToString(abilitySelections: AbilitySelection[]): string {
  let result = '';

  for (const abilitySelection of abilitySelections) {
    let separator = abilitySelection.Separator || '→';
    if (separator.includes('↵')) {
      result += '\n';
      separator.replace('↵ ', '');
    }
    separator.replace('tc', '→ (tc) +')

    result += (separator === "" ? " " : ` ${separator} `);

    if (abilitySelection.SelectedAbility) {
      if (abilitySelection.SelectedAbility.Title == blank.Title && abilitySelection.Notes && abilitySelection.Notes.length > 0) {
        result += abilitySelection.Notes;
      }
      else {
        result += `:${abilitySelection.SelectedAbility.Title}:`
        if (abilitySelection.Notes && abilitySelection.Notes.length > 0) {
          result += ` ${abilitySelection.Notes}`;
        }
      }
    }
  }

  return result.trim();
}

// Legacy separator → the new plugin's share separator ('' = side by side).
const pluginSeparators: { [legacy: string]: string } = {
  '→': '>', '>': '>', '+': '+', '/': '/', 's': 's', 'r': 'r', 'tc': 'tc', '': ''
};

// Separators, colons and brackets in notes would be read back as new steps,
// icons, rotations or sets by the plugin, so they become spaces.
function cleanPluginNote(note: string): string {
  return note.replace(/[>→+\/,:|\[\]{}()]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Brackets in a name would end the plugin's [name] or {name} early.
function cleanPluginName(name: string | null | undefined): string {
  return (name ?? '').replace(/[\[\]{}]/g, '').trim();
}

// One rotation in the native RuneScape plugin's share format:
//   [Name] :a: > :b: + :c: note | > :d:
export function transformRotationToPluginString(name: string, abilitySelections: AbilitySelection[]): string {
  const parts: string[] = [`[${cleanPluginName(name)}]`];
  let stepCount = 0;

  for (const selection of abilitySelections) {
    const ability = selection.SelectedAbility;
    const notes = selection.Notes ? cleanPluginNote(selection.Notes) : '';

    let piece: string;
    if (!ability || ability.Title === blank.Title) {
      if (!notes) continue;
      piece = notes; // text-only step
    } else {
      piece = `:${ability.Title.replace(/[^A-Za-z0-9_-]/g, '')}:`;
      if (notes) piece += ` ${notes}`;
    }

    let separator = (selection.Separator ?? '→').trim();
    const rowBreak = separator.includes('↵');
    if (rowBreak) separator = separator.replace('↵', '').trim();
    separator = pluginSeparators[separator] ?? '>';

    if (stepCount > 0) {
      // The plugin marks a new row with "|" after the previous step.
      if (rowBreak) parts.push('|');
      if (separator !== '') piece = `${separator} ${piece}`;
    }
    parts.push(piece);
    stepCount++;
  }

  return parts.join(' ');
}

// A whole rotation set in the native plugin's share format:
//   {Set name} [Rotation 1] :a: > :b: [Rotation 2] :c:
export function transformRotationSetToPluginString(setName: string, rotations: { Name: string, Data: AbilitySelection[] }[]): string {
  const parts = [`{${cleanPluginName(setName)}}`];
  for (const rotation of rotations) {
    parts.push(transformRotationToPluginString(rotation.Name, rotation.Data ?? []));
  }
  return parts.join(' ');
}

function isSeparator(character: string) : boolean {
  return character === '+' || character === '→' || character === '/' || character === 's' || character === 'r' || character === 'tc';
}