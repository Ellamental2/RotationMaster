import * as a1base from 'alt1/base';

/** RS-window-relative position of an action bar slot. */
export interface SlotPosition { x: number; y: number; }

// ── Icon loading ──────────────────────────────────────────────────────────────

/** Load an ability icon URL as ImageData via an offscreen canvas. */
export async function loadAbilityIconImageData(src: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** Scale ImageData to a target size using an offscreen canvas. */
export function scaleImageData(imgData: ImageData, targetW: number, targetH: number): ImageData {
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = imgData.width;
  srcCanvas.height = imgData.height;
  srcCanvas.getContext('2d')!.putImageData(imgData, 0, 0);

  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = targetW;
  dstCanvas.height = targetH;
  const dstCtx = dstCanvas.getContext('2d')!;
  dstCtx.drawImage(srcCanvas, 0, 0, targetW, targetH);
  return dstCtx.getImageData(0, 0, targetW, targetH);
}

/**
 * Crop ImageData to keep only the top fraction of the image.
 * RS overlays a keybind label on the bottom ~35% of each action bar slot,
 * so we compare only the unobscured top portion.
 */
export function cropTopFraction(imgData: ImageData, fraction: number = 0.65): ImageData {
  const newH = Math.max(1, Math.floor(imgData.height * fraction));
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = imgData.width;
  srcCanvas.height = imgData.height;
  srcCanvas.getContext('2d')!.putImageData(imgData, 0, 0);

  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = imgData.width;
  dstCanvas.height = newH;
  dstCanvas.getContext('2d')!.drawImage(srcCanvas, 0, 0);
  return dstCanvas.getContext('2d')!.getImageData(0, 0, imgData.width, newH);
}

/**
 * Returns a desaturated (greyed-out) version of an ImageData to help match
 * faded/unavailable abilities that RS dims on the action bar.
 */
export function desaturateImageData(imgData: ImageData): ImageData {
  const out = new ImageData(
    new Uint8ClampedArray(imgData.data),
    imgData.width,
    imgData.height
  );
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // Blend 70% toward gray to approximate RS's faded ability look
    d[i]     = Math.round(gray * 0.7 + d[i]     * 0.3);
    d[i + 1] = Math.round(gray * 0.7 + d[i + 1] * 0.3);
    d[i + 2] = Math.round(gray * 0.7 + d[i + 2] * 0.3);
  }
  return out;
}

// ── Auto-detection ────────────────────────────────────────────────────────────

/**
 * Attempt to locate an ability icon in the RS action bar by template matching.
 *
 * Two-pass strategy:
 *  1. Normal template cropped to the top 65% — avoids the keybind letter
 *     that RS overlays on the bottom of each action bar slot.
 *  2. Desaturated template (same crop) — catches abilities that are faded/
 *     unavailable and therefore heavily greyed out in-game.
 *
 * Searches the bottom 40% of the RS window at multiple common slot sizes.
 * Returns RS-window-relative {x, y} of the slot top-left, or null if not found.
 */
export async function detectAbilityInActionBar(
  src: string,
  slotSizes: number[] = [36, 32, 28, 40, 24]
): Promise<SlotPosition | null> {
  if (!window.alt1) return null;

  let iconData: ImageData;
  try {
    iconData = await loadAbilityIconImageData(src);
  } catch {
    return null;
  }

  const screen = a1base.captureHoldFullRs();

  // Limit search to bottom 40% of screen — action bars live there
  const searchY = Math.floor(alt1.rsHeight * 0.6);
  const searchH = alt1.rsHeight - searchY;

  for (const size of slotSizes) {
    // Scale to target slot size, then crop to top 65% to exclude keybind label
    const scaled  = scaleImageData(iconData, size, size);
    const cropped = cropTopFraction(scaled, 0.65);

    // Pass 1: normal colours
    let matches = screen.findSubimage(cropped, 0, searchY, alt1.rsWidth, searchH);
    if (matches.length > 0) {
      return { x: matches[0].x, y: matches[0].y };
    }

    // Pass 2: desaturated — handles faded/unavailable abilities
    const faded = desaturateImageData(cropped);
    matches = screen.findSubimage(faded, 0, searchY, alt1.rsWidth, searchH);
    if (matches.length > 0) {
      return { x: matches[0].x, y: matches[0].y };
    }
  }

  return null;
}

// ── Slot monitoring ───────────────────────────────────────────────────────────

/** Capture the pixel data for an action bar slot (RS-window-relative coordinates). */
export function captureSlotBaseline(slot: SlotPosition, size: number = 36): ImageData | null {
  if (!window.alt1) return null;
  try {
    return a1base.capture(slot.x, slot.y, size, size);
  } catch {
    return null;
  }
}

/** Average RGB brightness (0–255) of an ImageData. */
function averageBrightness(data: ImageData): number {
  const d = data.data;
  const pixels = d.length / 4;
  let total = 0;
  for (let i = 0; i < d.length; i += 4) {
    total += (d[i] + d[i + 1] + d[i + 2]) / 3;
  }
  return total / pixels;
}

/**
 * Returns true when the slot looks significantly darker than its baseline,
 * indicating the ability has just been activated and is on cooldown.
 * threshold: brightness ratio below which activation is detected (default 0.65 = 35% drop).
 */
export function isSlotActivated(
  slot: SlotPosition,
  baseline: ImageData,
  size: number = 36,
  threshold: number = 0.65
): boolean {
  if (!window.alt1) return false;
  try {
    const current = a1base.capture(slot.x, slot.y, size, size);
    const baselineBrightness = averageBrightness(baseline);
    if (baselineBrightness < 10) return false; // empty / unrecognisable slot
    return averageBrightness(current) < baselineBrightness * threshold;
  } catch {
    return false;
  }
}

// ── Calibration screenshot ────────────────────────────────────────────────────

/**
 * Capture the full RS screen and render it scaled down to a canvas element
 * suitable for display in the calibration modal.
 * Returns the canvas and the scale factors applied (canvas px / RS px).
 */
export function captureRsScreen(): { canvas: HTMLCanvasElement; scaleX: number; scaleY: number } | null {
  if (!window.alt1) return null;
  try {
    const imgData = a1base.capture(0, 0, alt1.rsWidth, alt1.rsHeight);

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = alt1.rsWidth;
    srcCanvas.height = alt1.rsHeight;
    srcCanvas.getContext('2d')!.putImageData(imgData, 0, 0);

    // Scale to fit a reasonable display size
    const maxW = 860;
    const maxH = 520;
    const scale = Math.min(1, maxW / alt1.rsWidth, maxH / alt1.rsHeight);

    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = Math.round(alt1.rsWidth * scale);
    dstCanvas.height = Math.round(alt1.rsHeight * scale);
    dstCanvas.getContext('2d')!.drawImage(srcCanvas, 0, 0, dstCanvas.width, dstCanvas.height);

    return { canvas: dstCanvas, scaleX: scale, scaleY: scale };
  } catch {
    return null;
  }
}
