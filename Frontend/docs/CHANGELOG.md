# Changelog — MARK PT

Todas las modificaciones notables del proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [Unreleased] — Fase 1: Core Workout Experience

### Completado
- **1.1 Rest Timer Automático**: Componente circular SVG (`RestTimer.tsx`) con ring animado, auto-start al completar set, controles -15s/+15s/Skip, haptic feedback (`haptics.ts`), floating card con backdrop blur, transición slide-up

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
