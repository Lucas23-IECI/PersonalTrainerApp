# Changelog — MARK PT

Todas las modificaciones notables del proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [Unreleased] — Fase 1: Core Workout Experience

### Completado
- **1.1 Rest Timer Automático**: Componente circular SVG (`RestTimer.tsx`) con ring animado, auto-start al completar set, controles -15s/+15s/Skip, haptic feedback (`haptics.ts`), floating card con backdrop blur, transición slide-up
- **1.2 Tipos de Series**: `SetType` union (normal/warmup/dropset/failure/amrap) en `storage.ts`, `SetTypeBadge.tsx` tappable con colores (Normal=#, W=naranja, D=morado, F=rojo, A=verde), migración automática de sesiones antiguas, tipos mostrados en resumen post-workout
- **1.3 RPE + RIR por Set**: Select dropdown RPE (6-10 en pasos de 0.5) por cada set, RIR auto-calculado (10-RPE), columna RPE en grid 6-columnas, mostrado en resumen post-workout con formato "RPE (RIR RIR)"
- **1.4 Supersets / Circuitos Visuales**: Agrupación visual con borde izquierdo de color por superset (A-F), badge SS-{tag} con color dinámico, botón Link2 para ciclar tags de superset, paleta de 6 colores
- **1.5 Previous Values Inline**: Columna PREV ahora es tappable — toque para auto-rellenar peso/reps del workout anterior, resaltado en color accent cuando hay datos disponibles
- **1.6 Quick Start (Empty Workout)**: Botón "⚡ Quick Start" en la página de Plan Semanal, inicia sesión vacía inmediatamente, permite agregar ejercicios ad-hoc desde la librería
- **1.7 Reordenar Ejercicios en Vivo**: Flechas arriba/abajo en header de cada ejercicio durante sesión activa, swap instantáneo con feedback visual
- **1.8 Reemplazar Ejercicio Mid-Workout**: Botón RefreshCw en header de ejercicio abre modal en modo reemplazo, sustituye ejercicio manteniendo estructura de sets
- **1.9 Notas por Ejercicio/Set**: Icono MessageSquare por cada set para expandir input de nota inline, notas de sets se mergen al finalizar sesión, ejercicio-level notes ya existían
- **1.10 Post-Workout Summary Mejorado**: Rating de sesión 1-5 estrellas, sección de músculos trabajados con chips visuales, sección de notas del entrenamiento
- **1.11 Swipe Gestures en Sets**: Swipe izquierda en filas de sets revela zona roja de eliminación, threshold 80px para confirmar, feedback visual con icono Trash y fondo rojo

### FASE 1 COMPLETADA ✅

---

## [Unreleased] — Fase 2: Sistema de Progreso y Charts

### Completado
- **2.1 Gráfico 1RM por Ejercicio**: Recharts `LineChart` con selector de ejercicio (dropdown), fórmula Epley (w × (1+r/30)), indicador de tendencia (+/- kg), últimos 3 valores. Dynamic import sin SSR.
- **2.2 Volumen Semanal por Músculo**: `BarChart` horizontal por grupo muscular, distribución proporcional por músculos primarios, selector de rango temporal (7d/14d/30d), colores únicos por músculo.
- **2.3 Volumen Total por Sesión**: `AreaChart` con gradiente verde mostrando volumen total (kg×reps) por sesión, stats row (máximo/promedio/sesiones), indicador de tendencia.
- **2.4 Heatmap Frecuencia (GitHub-style)**: SVG puro estilo GitHub contributions, 16 semanas, intensidad verde por sesiones/día, leyenda y contador de días activos/sesiones totales.
- **2.5 Peso Corporal + PRs Superpuestos**: Recharts `ComposedChart` con dual Y-axes — Line para peso corporal + Bar para mejores e1RM, toggle mostrar/ocultar PRs, últimos 30 días.
- **2.6 Distribución Muscular Mejorada**: `RadarChart` con 10 grupos musculares, selector de rango temporal (7d/14d/30d/All), toggle sets vs volumen, normalizado a %, insights de músculo más fuerte/débil.
- **2.7 Training Streak (🔥)**: Card con racha actual/récord, semana/mes actual, promedio/semana, barra de consistencia 12 semanas, intensidad de fuego dinámica por nivel de racha.
- **2.8 PR System Completo (por rango reps)**: PRs categorizados por rango (1RM/3RM/5RM/8RM/10RM/12RM+), vista expandible por ejercicio, filtro all/recientes(14d), badges de PRs nuevos, e1RM calculado.

### FASE 2 COMPLETADA ✅

---

## [Unreleased] — Fase 3: Programas y Rutinas

### Completado
- **3.1 Biblioteca 15-20 Programas**: 20 programas pre-armados (PPL, Upper/Lower, Full Body, PHUL, Starting Strength, Arnold Split, 5/3/1, Bro Split, Calistenia, GZCLP, nSuns, StrongLifts, PHAT, etc.) con búsqueda, filtro por categoría/nivel, vista expandible con tablas de ejercicios. `program-library.ts`
- **3.2 Crear Rutinas Custom**: Editor completo de rutinas en `/routines/editor` — editar nombre, descripción, split, agregar/eliminar/reordenar días, agregar/eliminar/reordenar ejercicios con editor inline (nombre, sets, reps, descanso, RPE, notas). `routines-storage.ts` con CRUD completo.
- **3.3 Carpetas para Rutinas**: Sistema de carpetas con colores auto-asignados, crear/renombrar/eliminar carpetas, mover rutinas entre carpetas, vista agrupada por carpeta en tab "Mis Rutinas".
- **3.4 Duplicar/Clonar Rutinas**: Clonar desde biblioteca (convierte LibraryProgram → Routine), duplicar rutina existente con sufijo "(Copia)" y IDs regenerados, menú contextual de 3 puntos.
- **3.5 Progresión Automática**: 3 reglas configurables (Linear Beginner, Double Progression, RPE Conservative) con selector en editor de rutina. Sugerencias batch por ejercicio basadas en historial de sesiones y RPE. `progression.ts` extendido con `PROGRESSION_RULES`, `getBatchSuggestions()`.
- **3.6 Importar Rutinas por Link/Código**: Export a código base64 compacto (`exportRoutineCode`), import desde código pegado (`importRoutineCode`). Modal de compartir con botón copiar, modal de importar en tab Mis Rutinas.
- **3.7 Recomendación según Nivel**: Motor de recomendaciones rule-based. Estima nivel (beginner/intermediate/advanced) por cantidad de sesiones, puntúa programas por nivel, días, categoría. Carrusel horizontal "Recomendados para vos" en tab Biblioteca. `recommendations.ts`
- **3.8 Ejercicios Custom**: CRUD completo en `custom-exercises.ts`. Crear ejercicios personalizados con nombre, categoría y músculo. Formulario inline en AddExerciseModal. Badge "CUSTOM" en lista.
- **3.9 Ejercicios Alternativos**: Mapa curado de ~20 grupos de alternativas + scoring basado en músculos. Botón "Alternativas" en cada ejercicio del modal. Panel expandible con sugerencias. `exercise-alternatives.ts`
- **3.10 Clonar Ejercicios**: `cloneExerciseFromLibrary()` duplica ejercicio de la biblioteca como custom con sufijo "(Custom)". Botón "Clonar" en cada ejercicio del modal.

### FASE 3 COMPLETADA ✅ (3.1-3.10)

---

## [Unreleased] — Fase 3.11-3.14: Ejercicios Enriquecidos

### Completado
- **3.11 Historial Inline por Ejercicio**: Historial expandible en AddExerciseModal, últimas 5 sesiones con peso/reps/RPE por set.
- **3.12 Favoritos y Etiquetas**: Sistema de favoritos y tags por ejercicio. Tab "Favoritos" en modal, sort por favoritos. `exercise-favorites.ts`
- **3.13 Ordenar Librería Multi-criterio**: Sort multi-criterio (A-Z, categoría, músculo, favoritos, recientes, frecuencia) con selector de criterio en modal.
- **3.14 GIFs/Videos Ejercicios (wger API)**: Integración wger.de API para imágenes de ejercicios, cache de nombres, fallback a búsqueda por nombre. `wger-api.ts`

### FASE 3 COMPLETADA ✅ (3.1-3.14)

---

## [Unreleased] — Fase 4: Historial, Records y Mediciones (4.1-4.4)

### Completado
- **4.1 Calendario Mejorado**: Dots de intensidad coloreados por volumen (percentil 33/66 del usuario → ligero/medio/intenso), mini-resumen al seleccionar fecha (sesiones, sets, volumen), leyenda de intensidad.
- **4.2 Detalle Sesión Pasada**: Barra de métricas expandida con duración, sets, volumen (en k), RPE promedio. Pills de músculos trabajados con labels. Contador de ejercicios/saltados.
- **4.3 Búsqueda Avanzada Historial**: Panel avanzado con rango de fechas (desde/hasta), chips de grupo muscular (Pecho/Espalda/Hombros/Brazos/Piernas/Core), badges activos removibles.
- **4.4 Re-hacer Workout (Repeat)**: Botón RefreshCw en cada sesión del historial, crea ActiveSessionData con ejercicios pre-poblados del workout anterior, navega a quickstart con nombre "(Repetir)". Session page usa workoutName del active session.

---

## [1.2.0] — 2025-06-XX

### Added
- 206+ ejercicios en la base de datos clasificados por músculo
- AddExerciseModal estilo Hevy (full-screen, search, filter por músculo)
- Auto-update checker comparando versión con GitHub Release
- Dark theme UI completo (fondo puro negro #000000)

### Fixed
- Notification timer persistent fix (ahora funciona minimizada)
- Service Worker actualizado para Capacitor

---

## [1.1.0] — 2025-05-XX

### Added
- Sistema de fases de entrenamiento (5 fases)
- Progresión automática basada en RPE
- Warmup sets automáticos para compuestos
- Historial de sesiones con calendario
- Tracking de nutrición básico
- Galería de fotos de progreso
- Onboarding inicial

---

## [1.0.0] — 2025-04-XX

### Added
- Versión inicial de MARK PT
- Plan semanal de entrenamiento
- Sesión de workout con sets/reps/peso
- Dashboard con resumen
- Perfil de usuario
- Settings básicos
- Build APK con Capacitor
