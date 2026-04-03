# PLAN DE IMPLEMENTACIÓN — MARK PT Dynamic Training System

## Resumen
Transformar MARK PT de un visor estático de rutinas a un sistema dinámico de entrenamiento con fases/mesociclos, progresión inteligente de pesos, editor de rutina, PWA móvil, y 12+ features.

---

## FASE A — Cimientos (Data Models + Storage)

### A1. Sistema de Fases (`phases.ts`)
- [x] Tipo `Phase` con id, nombre, fechas, RPE range, descripción, tipo de split
- [x] 7 fases predefinidas (Reactivación → Brasil)
- [x] `getCurrentPhase()` automático por fecha
- [x] `getPhaseProgress()` porcentaje completado
- [x] Transición: automática por fecha + confirmación manual

### A2. Programas Dinámicos (`programs.ts`)
- [x] Tipo `Program` con fases, días, ejercicios
- [x] Tipo `ProgramDay` con id, nombre, tipo, ejercicios
- [x] Tipo `ProgramExercise` con sets, reps, RPE, notas, muscles
- [x] Programa Fase 0 (actual: Upper/Lower 3-4 días)
- [x] Programa Fase 1 (split 5 días del Excel)
- [x] `getProgramForPhase()` retorna programa activo
- [x] `getTodayWorkout()` refactorizado → lee del programa de fase actual

### A3. Motor de Progresión (`progression.ts`)
- [x] Buscar última sesión del mismo ejercicio
- [x] Reglas: +2.5kg compuestos upper, +5kg compuestos lower
- [x] Accesorios: subir reps primero, luego peso
- [x] RPE-based: si RPE<7 → sugerir +peso, si RPE>9 → mantener/bajar
- [x] Nunca saltos estúpidos (5→10kg)
- [x] `getSuggestion(exerciseName)` → { weight, reps, reason }

### A4. Storage Actualizado (`storage.ts`)
- [x] Nuevo key `mark-pt-active-program` para programa custom
- [x] Nuevo key `mark-pt-phase-override` para override manual de fase
- [x] Nuevo key `mark-pt-prs` para PRs automáticos
- [x] `getExerciseHistory(name)` → últimas N sesiones de ese ejercicio
- [x] `getPersonalRecords()` → PRs por ejercicio
- [x] `saveCustomProgram()` para guardar ediciones

---

## FASE B — Rutina Dinámica

### B1. Refactor `workouts.ts`
- [x] Eliminar `weeklyPlan` hardcodeado
- [x] `getTodayWorkout()` lee de `programs.ts` según fase actual
- [x] `getWorkoutById()` busca en programa activo
- [x] Mantener tipos `Exercise`, `WorkoutDay` compatibles

### B2. Refactor `profile.ts`
- [x] `getCurrentPhaseLabel()` usa sistema de fases real
- [x] `getCurrentPhase()` retorna `Phase` completo
- [x] Remover hardcoded phase 0/1

### B3. Página Workout (`workout/page.tsx`)
- [x] Mostrar nombre de fase actual + progreso
- [x] Plan semanal dinámico según programa
- [x] Badge de "Semana X de Y"
- [x] Indicador de deload automático cada 6 semanas

### B4. Editor de Rutina (nueva página)
- [x] `/workout/editor` — editar programa activo
- [x] Agregar/quitar/reordenar ejercicios
- [x] Cambiar sets, reps, RPE por ejercicio
- [x] Guardar como programa custom en localStorage
- [x] Reset a programa original de la fase

---

## FASE C — Sesión Inteligente

### C1. Progresión Inline (`session/page.tsx`)
- [x] Al cargar ejercicio, mostrar sugerencia de peso/reps
- [x] Comparar vs última sesión (↑↓=)
- [x] Tag "PR!" si supera máximo histórico
- [x] Input prefill con sugerencia (editable)

### C2. Warmup Automático
- [x] Popup pre-ejercicio con sets de calentamiento
- [x] Regla: 1 set vacío + 1 set 50% + 1 set 70% para compuestos
- [x] Skip para accesorios <10kg

### C3. Rest Timer con Vibración
- [x] Vibración al terminar descanso (navigator.vibrate)
- [x] Duración configurable (60s/90s/120s/180s)
- [x] Auto-start después de loguear set

### C4. Historial por Ejercicio
- [x] Drawer/modal al tap en nombre del ejercicio
- [x] Últimas 5 sesiones: fecha, sets×reps@peso, RPE
- [x] Gráfico mini de progresión

---

## FASE D — Extras

### D1. PRs Automáticos
- [x] Detectar PR al guardar sesión
- [x] Tipos: 1RM estimado, peso×reps máximo, volumen máximo
- [x] Animación/notificación al romper PR
- [x] Tabla de PRs en sección progreso

### D2. Gráficos de Progresión
- [x] Peso corporal over time (de check-ins)
- [x] Volumen semanal por grupo muscular
- [x] Peso máximo por ejercicio over time
- [x] Usando Canvas/SVG (sin librería extra)

### D3. Notas Semanales
- [x] Input en dashboard o página aparte
- [x] Guardar en localStorage `mark-pt-weekly-notes`
- [x] Historial de notas

### D4. Deload Automático
- [x] Contador de semanas desde último deload
- [x] Al llegar a semana 6 → sugerir deload
- [x] Deload = -40% volumen, mantener intensidad
- [x] Marcar semana como deload en UI

### D5. PWA + Offline
- [ ] manifest.json con name, icons, theme
- [ ] Service Worker para cache offline
- [ ] Meta tags en layout.tsx
- [ ] Sync manager: localStorage ↔ backend cuando hay conexión

---

## Orden de Ejecución

```
1. Documentación MDs ✅ (este archivo)
2. PWA Setup (manifest + SW + meta tags)
3. phases.ts — sistema de fases
4. programs.ts — programas por fase con split real
5. progression.ts — motor de sugerencias
6. storage.ts — nuevos keys y funciones
7. workouts.ts — refactor para usar programs
8. profile.ts — usar fases dinámicas
9. workout/page.tsx — plan dinámico
10. session/page.tsx — progresión inline + warmup + vibración
11. PRs automáticos
12. Gráficos
13. Editor de rutina
14. Deload + notas
```

---

## Verificación por Fase

| Fase | Test | Estado |
|------|------|--------|
| A | `npm run build` pasa, tipos correctos | ⬜ |
| B | Rutina se carga dinámicamente según fase | ⬜ |
| C | Sesión muestra sugerencias, timer vibra | ⬜ |
| D | PRs detectados, gráficos visibles, PWA instalable | ⬜ |
