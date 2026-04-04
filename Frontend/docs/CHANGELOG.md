# Changelog — MARK PT

Todas las modificaciones notables del proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [Unreleased] — Fase 1: Core Workout Experience

### Completado
- **1.1 Rest Timer Automático**: Componente circular SVG (`RestTimer.tsx`) con ring animado, auto-start al completar set, controles -15s/+15s/Skip, haptic feedback (`haptics.ts`), floating card con backdrop blur, transición slide-up
- **1.2 Tipos de Series**: `SetType` union (normal/warmup/dropset/failure/amrap) en `storage.ts`, `SetTypeBadge.tsx` tappable con colores (Normal=#, W=naranja, D=morado, F=rojo, A=verde), migración automática de sesiones antiguas, tipos mostrados en resumen post-workout
- **1.3 RPE + RIR por Set**: Select dropdown RPE (6-10 en pasos de 0.5) por cada set, RIR auto-calculado (10-RPE), columna RPE en grid 6-columnas, mostrado en resumen post-workout con formato "RPE (RIR RIR)"

### En Progreso
- (próximo feature)

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
