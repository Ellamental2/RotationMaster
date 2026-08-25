import { Ability, AbilitySelection } from "./models";
import abilitiesData from "./assets/abilities.json";

const abilities = abilitiesData as Ability[];

const abilitiesByTitle = new Map<string, Ability>();
const abilitiesByEmoji = new Map<string, Ability>();
const abilitySearchIndex: { ability: Ability; key: string }[] = [];

for (const ability of abilities) {
  abilitiesByTitle.set(ability.Title.toLowerCase(), ability);
  abilitiesByEmoji.set(ability.Emoji.toLowerCase(), ability);
  const extra = ability.Title === 'blankspace'
    ? ' spacer empty gap skip line linha espaço vazio pular layout'
    : '';
  abilitySearchIndex.push({
    ability,
    key: `${ability.Title} ${ability.Emoji} ${ability.Category}${extra}`.toLowerCase()
  });
}

export const allAbilitiesCatalog: Ability[] = abilities;

export function isBlankSpacer(ability: Ability | null | undefined): boolean {
  return ability?.Title === 'blankspace';
}

export function lookupAbilityByTitle(emojiString: string) : Ability | null {
  return abilitiesByTitle.get(emojiString.toLowerCase()) ?? null;
}

export function lookupAbilityByEmoji(emojiString: string) : Ability | null {
  return abilitiesByEmoji.get(emojiString.toLowerCase()) ?? null;
}

export function searchAbilities(query: string, source?: Ability[] | null): Ability[] {
  const catalog = source?.length ? source : abilities;
  const val = query.toLowerCase().trim();
  let results: Ability[];

  if (!val) {
    results = catalog;
  } else if (!source || source === abilities || source.length === abilities.length) {
    results = abilitySearchIndex
      .filter(entry => entry.key.includes(val))
      .map(entry => entry.ability);
  } else {
    results = catalog.filter(ability =>
      ability.Title.toLowerCase().includes(val) ||
      ability.Emoji.toLowerCase().includes(val) ||
      ability.Category.toLowerCase().includes(val)
    );
  }

  return pinBlankSpace(results);
}

function pinBlankSpace(list: Ability[]): Ability[] {
  const spacerIndex = list.findIndex(ability => ability.Title === 'blankspace');
  if (spacerIndex <= 0) {
    return list;
  }

  const pinned = list[spacerIndex];
  return [pinned, ...list.slice(0, spacerIndex), ...list.slice(spacerIndex + 1)];
}

const blank = lookupAbilityByTitle('literallynothing') as Ability;

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

function isSeparator(character: string) : boolean {
  return character === '+' || character === '→' || character === '/' || character === 's' || character === 'r' || character === 'tc';
}
