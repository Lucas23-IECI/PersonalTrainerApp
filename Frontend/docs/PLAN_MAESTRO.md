# Plan Maestro: MARK PT v2.0 — Feature Parity con Hevy/Strong/Boostcamp

## TL;DR
Transformar MARK PT de un tracker básico a una app de fitness de nivel profesional (Hevy/Strong/Boostcamp) implementando ~81 funcionalidades organizadas en 7 fases. Todo corre en localStorage (sin backend), con IA opcional vía modelos locales/gratis. Cada fase es independientemente verificable.

**Stack**: Next.js 15.5, React 19, Tailwind CSS 4, Capacitor 8, TypeScript 5.7, output: "export" (static)

---

## FASE 1: Core Workout Experience (PRIORIDAD MÁXIMA)
*Depende de: nada. Es la base de todo.*

| # | Feature | Estado |
|---|---------|--------|
| 1.1 | Rest Timer Automático (circular SVG, vibración, configurable) | ✅ COMPLETADO |
| 1.2 | Tipos de Series (Normal/Warmup/Drop/Failure/AMRAP) | ✅ COMPLETADO |
| 1.3 | RPE + RIR por Set Individual | ⬜ |
| 1.4 | Supersets / Circuitos Visuales | ⬜ |
| 1.5 | Previous Values Inline | ⬜ |
| 1.6 | Quick Start (Empty Workout) | ⬜ |
| 1.7 | Reordenar Ejercicios en Vivo | ⬜ |
| 1.8 | Reemplazar Ejercicio Mid-Workout | ⬜ |
| 1.9 | Notas por Ejercicio/Set | ⬜ |
| 1.10 | Post-Workout Summary | ⬜ |
| 1.11 | Swipe Gestures en Sets | ⬜ |

---

## FASE 2: Sistema de Progreso y Charts
*Depende de: Fase 1 parcial*

| # | Feature | Estado |
|---|---------|--------|
| 2.1 | Gráfico 1RM por Ejercicio (recharts) | ⬜ |
| 2.2 | Volumen Semanal por Músculo | ⬜ |
| 2.3 | Volumen Total por Sesión | ⬜ |
| 2.4 | Heatmap Frecuencia (GitHub-style) | ⬜ |
| 2.5 | Peso Corporal + PRs Superpuestos | ⬜ |
| 2.6 | Distribución Muscular Mejorada | ⬜ |
| 2.7 | Training Streak (🔥) | ⬜ |
| 2.8 | PR System Completo (por rango reps) | ⬜ |

---

## FASE 3: Programas, Rutinas y Ejercicios Enriquecidos
*Paralela a Fase 2*

| # | Feature | Estado |
|---|---------|--------|
| 3.1 | Biblioteca 15-20 Programas | ⬜ |
| 3.2 | Crear Rutinas Custom | ⬜ |
| 3.3 | Carpetas para Rutinas | ⬜ |
| 3.4 | Duplicar/Clonar Rutinas | ⬜ |
| 3.5 | Progresión Automática | ⬜ |
| 3.6 | Importar Rutinas por Link/Código | ⬜ |
| 3.7 | Recomendación según Nivel | ⬜ |
| 3.8 | Ejercicios Custom | ⬜ |
| 3.9 | Ejercicios Alternativos | ⬜ |
| 3.10 | Clonar Ejercicios | ⬜ |
| 3.11 | Historial Inline por Ejercicio | ⬜ |
| 3.12 | Favoritos y Etiquetas | ⬜ |
| 3.13 | Ordenar Librería Multi-criterio | ⬜ |
| 3.14 | GIFs/Videos Ejercicios (wger API) | ⬜ |

---

## FASE 4: Historial, Records y Mediciones
*Depende de: Fases 1-2 parcial*

| # | Feature | Estado |
|---|---------|--------|
| 4.1 | Calendario Mejorado | ⬜ |
| 4.2 | Detalle Sesión Pasada | ⬜ |
| 4.3 | Búsqueda Avanzada Historial | ⬜ |
| 4.4 | Re-hacer Workout (Repeat) | ⬜ |
| 4.5 | Editar Workouts Pasados | ⬜ |
| 4.6 | Notas/Rating Post-Workout en Historial | ⬜ |
| 4.7 | Resumen Estadístico | ⬜ |
| 4.8 | Mediciones Corporales Completas | ⬜ |

---

## FASE 5: Gamificación, Social y Motivación
*Depende de: Fases 2, 4*

| # | Feature | Estado |
|---|---------|--------|
| 5.1 | Sistema Logros/Badges (~30-40) | ⬜ |
| 5.2 | Weekly Report | ⬜ |
| 5.3 | Year in Review (Spotify Wrapped) | ⬜ |
| 5.4 | Workout Summary Shareable | ⬜ |
| 5.5 | PR Card Shareable | ⬜ |
| 5.6 | Export CSV (Strong/Hevy compatible) | ⬜ |
| 5.7 | Copiar Summary como Texto | ⬜ |
| 5.8 | Notificaciones Motivacionales | ⬜ |

---

## FASE 6: UX Polish y Configuración
*Paralela a Fases 3-5*

| # | Feature | Estado |
|---|---------|--------|
| 6.1 | Animaciones/Transiciones (framer-motion) | ⬜ |
| 6.2 | Haptic Feedback (@capacitor/haptics) | ⬜ |
| 6.3 | Smooth Scrolling | ⬜ |
| 6.4 | Weight Stepper (+/- buttons) | ⬜ |
| 6.5 | Swipe entre Tabs | ⬜ |
| 6.6 | Unidades kg/lbs toggle | ⬜ |
| 6.7 | Timer Default por Tipo ejercicio | ⬜ |
| 6.8 | Configurar Sonidos/Vibración | ⬜ |
| 6.9 | Teclado Numérico optimizado | ⬜ |
| 6.10 | Incrementos Peso Configurables | ⬜ |
| 6.11 | Backup/Restore Auto | ⬜ |
| 6.12 | i18n ES/EN | ⬜ |
| 6.13 | Splash Screen | ⬜ |

---

## FASE 7: Features Avanzados
*Depende de: Fases 1-5*

| # | Feature | Estado |
|---|---------|--------|
| 7.1 | IA: Generador Rutinas (rule-based local) | ⬜ |
| 7.2 | IA: Sugerencia Peso | ⬜ |
| 7.3 | IA: Coach Tips | ⬜ |
| 7.4 | IA: Recuperación Muscular | ⬜ |
| 7.5 | IA: Análisis Debilidades | ⬜ |
| 7.6 | IA: Chat Fitness (FAQ local + GPT opcional) | ⬜ |
| 7.7 | Nutrición: Food DB (Open Food Facts) | ⬜ |
| 7.8 | Nutrición: Barcode Scanner | ⬜ |
| 7.9 | Nutrición: Meal Templates | ⬜ |
| 7.10 | Nutrición: Water Tracker | ⬜ |
| 7.11 | Nutrición: Balance Calórico | ⬜ |
| 7.12 | Calculadoras (1RM/TDEE/Macros/Wilks) | ⬜ |
| 7.13 | Cloud Sync (Google Drive) | ⬜ |
| 7.14 | Widgets Android | ⬜ |
| 7.15 | Recordatorio Diario | ⬜ |
| 7.16 | Quick Action Home (App Shortcuts) | ⬜ |
| 7.17 | Onboarding Mejorado (7 steps) | ⬜ |

---

## Resumen

| Fase | Features | Estado |
|------|----------|--------|
| 1 Core Workout | 11 | 🔄 |
| 2 Charts/Progreso | 8 | ⬜ |
| 3 Programas/Ejercicios | 14 | ⬜ |
| 4 Historial/Mediciones | 8 | ⬜ |
| 5 Gamificación/Social | 8 | ⬜ |
| 6 UX Polish/Config | 13 | ⬜ |
| 7 Avanzados | 17 | ⬜ |
| **TOTAL** | **~81** | |

## Decisiones Técnicas

- **Charts**: `recharts` o SVG custom
- **Drag-drop**: `@dnd-kit/core` (11KB gzipped)
- **IA**: Rule-based local + opcional API key usuario
- **Food API**: Open Food Facts (gratis, 2M+ productos)
- **GIFs**: wger.de API (open source)
- **Shareables**: `html2canvas` → PNG
- **i18n**: Custom ligero `t(key)`
- **Datos internos**: Siempre en kg, conversión solo en display
- **Haptics**: `@capacitor/haptics`
- **Animaciones**: `framer-motion` o CSS transitions
