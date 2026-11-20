/**
 * Produces a compact keybind string from a KeyboardEvent.
 * Modifier prefixes: a- = Alt, c- = Ctrl, s- = Shift  (order is always a-c-s-).
 * Returns null when the event is a bare modifier keypress (nothing to bind to).
 *
 * Examples:
 *   Ctrl + 1          → "c-1"
 *   Shift + F1        → "s-F1"
 *   Alt + Ctrl + A    → "a-c-A"
 *   Just "A"          → "A"
 */
export function formatKeyCombination(event: KeyboardEvent): string | null {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) return null;

  let prefix = '';
  if (event.altKey)   prefix += 'a-';
  if (event.ctrlKey)  prefix += 'c-';
  if (event.shiftKey) prefix += 's-';

  // Derive a clean base-key name from event.code so it is layout-independent
  // (Shift+1 gives event.key="!" on US layout but event.code="Digit1" → "1").
  let base = event.code;
  if      (base.startsWith('Key'))    base = base.slice(3);         // KeyA → A
  else if (base.startsWith('Digit'))  base = base.slice(5);         // Digit1 → 1
  else if (base.startsWith('Numpad')) base = 'Num' + base.slice(6); // Numpad1 → Num1
  // F1-F12, Arrow*, Space, Enter, etc. keep their event.code name as-is

  return prefix + base;
}
