/**
 * Haptic feedback utilities.
 * Uses @capacitor/haptics on native, falls back to navigator.vibrate on web.
 * Respects user settings (hapticsEnabled).
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { getSettings } from './storage';

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.vibrate;
}

function isEnabled(): boolean {
  return getSettings().hapticsEnabled;
}

async function isNative(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Strong double-pulse vibration for timer completion */
export async function vibrateTimerComplete() {
  if (!isEnabled()) return;
  if (await isNative()) {
    await Haptics.notification({ type: NotificationType.Warning });
  } else if (canVibrate()) {
    navigator.vibrate([200, 100, 200]);
  }
}

/** Light tap for button presses & UI interactions */
export async function vibrateLight() {
  if (!isEnabled()) return;
  if (await isNative()) {
    await Haptics.impact({ style: ImpactStyle.Light });
  } else if (canVibrate()) {
    navigator.vibrate(10);
  }
}

/** Medium impact — set completion, weight stepper taps */
export async function vibrateMedium() {
  if (!isEnabled()) return;
  if (await isNative()) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } else if (canVibrate()) {
    navigator.vibrate(25);
  }
}

/** Heavy impact — PR alerts, important events */
export async function vibrateHeavy() {
  if (!isEnabled()) return;
  if (await isNative()) {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } else if (canVibrate()) {
    navigator.vibrate(50);
  }
}

/** Success notification — session complete, badge unlock */
export async function vibrateSuccess() {
  if (!isEnabled()) return;
  if (await isNative()) {
    await Haptics.notification({ type: NotificationType.Success });
  } else if (canVibrate()) {
    navigator.vibrate([30, 50, 30]);
  }
}

/** Selection change — tab switches, picker changes */
export async function vibrateSelection() {
  if (!isEnabled()) return;
  if (await isNative()) {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } else if (canVibrate()) {
    navigator.vibrate(5);
  }
}
