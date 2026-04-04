import { getSettings } from "./storage";

type Lang = "es" | "en";

const translations: Record<string, Record<Lang, string>> = {
  // Navigation
  "nav.home": { es: "Inicio", en: "Home" },
  "nav.workout": { es: "Entreno", en: "Workout" },
  "nav.progress": { es: "Progreso", en: "Progress" },
  "nav.nutrition": { es: "Nutrición", en: "Nutrition" },
  "nav.profile": { es: "Perfil", en: "Profile" },

  // Settings
  "settings.title": { es: "Ajustes", en: "Settings" },
  "settings.subtitle": { es: "Configuración y datos", en: "Configuration & data" },
  "settings.appearance": { es: "Apariencia", en: "Appearance" },
  "settings.darkMode": { es: "Modo Oscuro", en: "Dark Mode" },
  "settings.lightMode": { es: "Modo Claro", en: "Light Mode" },
  "settings.tapToChange": { es: "Toca para cambiar", en: "Tap to change" },
  "settings.weightUnits": { es: "Unidades de Peso", en: "Weight Units" },
  "settings.sound": { es: "Sonido y Vibración", en: "Sound & Haptics" },
  "settings.vibration": { es: "Vibración", en: "Vibration" },
  "settings.sounds": { es: "Sonidos", en: "Sounds" },
  "settings.weightIncrement": { es: "Incremento de Peso", en: "Weight Increment" },
  "settings.phase": { es: "Fase de Entrenamiento", en: "Training Phase" },
  "settings.currentPhase": { es: "Fase actual", en: "Current phase" },
  "settings.autoDetect": { es: "Volver a detección automática", en: "Return to auto-detect" },
  "settings.data": { es: "Datos", en: "Data" },
  "settings.dataDesc": { es: "Exportá e importá todos tus datos (check-ins, sesiones, nutrición, notas, programas custom).", en: "Export and import all your data (check-ins, sessions, nutrition, notes, custom programs)." },
  "settings.export": { es: "Exportar", en: "Export" },
  "settings.import": { es: "Importar", en: "Import" },
  "settings.importSuccess": { es: "Datos importados correctamente. Recargá la página.", en: "Data imported successfully. Reload the page." },
  "settings.importError": { es: "Error al importar. Verificá el archivo.", en: "Import error. Check the file." },
  "settings.exportCSV": { es: "Exportar CSV", en: "Export CSV" },
  "settings.csvDesc": { es: "Exportá tus sesiones en formato CSV compatible con Strong y Hevy.", en: "Export sessions in CSV format compatible with Strong and Hevy." },
  "settings.androidApp": { es: "App Android", en: "Android App" },
  "settings.downloadAPK": { es: "Descargar APK", en: "Download APK" },
  "settings.about": { es: "Acerca de", en: "About" },
  "settings.language": { es: "Idioma", en: "Language" },
  "settings.backup": { es: "Backup Automático", en: "Auto Backup" },
  "settings.backupDesc": { es: "Respaldo diario automático de tus datos.", en: "Automatic daily backup of your data." },
  "settings.restoreBackup": { es: "Restaurar Backup", en: "Restore Backup" },
  "settings.lastBackup": { es: "Último backup", en: "Last backup" },
  "settings.noBackup": { es: "Sin backup aún", en: "No backup yet" },
  "settings.backupRestored": { es: "Backup restaurado. Recargá la página.", en: "Backup restored. Reload the page." },

  // Common
  "common.back": { es: "Volver", en: "Back" },
  "common.save": { es: "Guardar", en: "Save" },
  "common.cancel": { es: "Cancelar", en: "Cancel" },
  "common.delete": { es: "Eliminar", en: "Delete" },
  "common.loading": { es: "Cargando...", en: "Loading..." },
  "common.version": { es: "Versión", en: "Version" },
  "common.localData": { es: "Datos guardados localmente en tu dispositivo", en: "Data stored locally on your device" },

  // Dashboard
  "dashboard.greeting": { es: "Hola", en: "Hi" },
  "dashboard.today": { es: "Hoy", en: "Today" },
  "dashboard.startWorkout": { es: "Empezar Entreno", en: "Start Workout" },
  "dashboard.restDay": { es: "Día de Descanso", en: "Rest Day" },

  // Progress
  "progress.title": { es: "Progreso", en: "Progress" },
  "progress.body": { es: "Cuerpo", en: "Body" },
  "progress.strength": { es: "Fuerza", en: "Strength" },
  "progress.volume": { es: "Volumen", en: "Volume" },
  "progress.weight": { es: "Peso", en: "Weight" },
  "progress.sleep": { es: "Sueño", en: "Sleep" },
  "progress.energy": { es: "Energía", en: "Energy" },
  "progress.streak": { es: "Racha", en: "Streak" },
  "progress.weeklySummary": { es: "Resumen Semanal", en: "Weekly Summary" },

  // Session
  "session.weight": { es: "Peso", en: "Weight" },
  "session.reps": { es: "Reps", en: "Reps" },
  "session.rest": { es: "Descanso", en: "Rest" },
  "session.set": { es: "Serie", en: "Set" },
  "session.finish": { es: "Finalizar Sesión", en: "Finish Session" },

  // Splash
  "splash.tagline": { es: "Tu Personal Trainer", en: "Your Personal Trainer" },
};

/** Get a translated string by key */
export function t(key: string): string {
  const lang = getSettings().language;
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry["es"] || key;
}

/** Get current language */
export function getLang(): Lang {
  return getSettings().language;
}
