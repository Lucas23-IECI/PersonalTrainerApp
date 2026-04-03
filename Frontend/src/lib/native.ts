import { Capacitor } from '@capacitor/core';

const WORKOUT_NOTIFICATION_ID = 99999;

export function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function sendWorkoutNotification(title: string, body: string) {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }
      await LocalNotifications.schedule({
        notifications: [{
          id: WORKOUT_NOTIFICATION_ID,
          title,
          body,
          ongoing: true,
          autoCancel: false,
        }],
      });
    } catch { /* silently fail */ }
  } else {
    // Web fallback via Service Worker
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({ type: 'WORKOUT_NOTIFICATION', title, body });
      } catch { /* no SW */ }
    }
  }
}

export async function clearWorkoutNotification() {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: [{ id: WORKOUT_NOTIFICATION_ID }] });
    } catch { /* silently fail */ }
  } else {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({ type: 'CLEAR_WORKOUT_NOTIFICATION' });
      } catch { /* no SW */ }
    }
  }
}

export async function requestNotificationPermission() {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.requestPermissions();
    } catch { /* silently fail */ }
  } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
