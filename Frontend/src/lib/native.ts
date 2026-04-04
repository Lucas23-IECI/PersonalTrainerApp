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

// === 7.15 — Daily Reminder ===
const DAILY_REMINDER_ID = 88888;

const MOTIVATIONAL_MESSAGES = [
  "💪 ¡Es hora de entrenar! Tu cuerpo te lo agradecerá.",
  "🔥 No rompas tu racha. ¡Hoy es día de entreno!",
  "🏋️ Los resultados llegan con constancia. ¡Vamos!",
  "⚡ Un entrenamiento más cerca de tu objetivo.",
  "🎯 La disciplina supera a la motivación. ¡A entrenar!",
];

export async function scheduleDailyReminder(hour: number, minute: number) {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }
      // Cancel existing reminder first
      await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
      // Schedule daily repeating
      const now = new Date();
      const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
      if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1);
      const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
      await LocalNotifications.schedule({
        notifications: [{
          id: DAILY_REMINDER_ID,
          title: "MARK PT",
          body: msg,
          schedule: {
            at: scheduled,
            repeats: true,
            every: "day",
          },
        }],
      });
    } catch { /* silently fail */ }
  } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    // Web: store preference, no repeating schedule available
    localStorage.setItem("mark-pt-reminder-web", JSON.stringify({ hour, minute }));
  }
}

export async function cancelDailyReminder() {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
    } catch { /* silently fail */ }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem("mark-pt-reminder-web");
  }
}

// === 7.16 — Quick Actions (App Shortcuts) ===
export function getQuickActions(): { id: string; title: string; href: string }[] {
  return [
    { id: "quick-workout", title: "Entreno Rápido", href: "/workout" },
    { id: "log-weight", title: "Registrar Peso", href: "/progress" },
    { id: "nutrition", title: "Nutrición", href: "/nutrition" },
    { id: "calculators", title: "Calculadoras", href: "/calculators" },
  ];
}
