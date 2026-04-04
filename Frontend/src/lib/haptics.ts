/**
 * Haptic feedback utilities.
 * Uses navigator.vibrate (Android WebView / Chrome).
 * Can be upgraded to @capacitor/haptics for richer patterns.
 */

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.vibrate;
}

/** Strong double-pulse vibration for timer completion */
export function vibrateTimerComplete() {
  if (canVibrate()) navigator.vibrate([200, 100, 200]);
}

/** Light tap for button presses */
export function vibrateLight() {
  if (canVibrate()) navigator.vibrate(10);
}
