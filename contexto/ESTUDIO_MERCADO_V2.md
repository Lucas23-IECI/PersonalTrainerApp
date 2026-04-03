# ESTUDIO DE MERCADO — MARK PT vs Las Mejores Apps del Mercado

## Apps Analizadas
1. **Hevy** — La más popular para lifters (4.9★, 10M+ downloads)
2. **Strong** — Clásica para tracking de gym (4.8★)
3. **SUSPENDED/Fitbod** — AI-based programming
4. **MyFitnessPal** — King de nutrición
5. **Alpha Progression** — Periodización avanzada
6. **MacroFactor** — Nutrición inteligente con TDEE adaptivo

---

## ANÁLISIS GAP: Lo que tienen TODOS y nosotros NO

### 🔴 PERFIL DE USUARIO (CRÍTICO — No existe)
**Todas las apps tienen esto:**
- Pantalla de perfil completa editable (foto, nombre, stats)
- Historial de mediciones corporales con gráficos
- Progreso visual: peso, grasa corporal, circunferencias over time
- Fotos de progreso (antes/después con slider)
- Objetivos editables (meta de peso, fecha límite)
- Calculadora de calorías integrada (no hardcoded)

**MARK PT:** Todo hardcoded en `profile.ts`. No hay página de perfil. No se pueden editar mediciones. No hay historial de body composition. Los 81.2kg, 26.5% BF del día 1 están congelados para siempre.

### 🔴 HOME/DASHBOARD (CRÍTICO — Desordenado)
**Hevy/Strong:**
- Dashboard LIMPIO: solo 3 cards máximo
  1. "Hoy" → Workout del día (tap to start)
  2. Quick stats (streak, última sesión, volumen semanal)
  3. Feed de actividad reciente (últimos 2-3 workouts)
- Sin check-in invasivo, sin radar, sin countdowns

**MARK PT:** 12+ secciones apiladas verticalmente. Check-in, macros, radar muscular, countdowns, weekly grid, notas, lifts históricos... todo mezclado. Un usuario promedio se pierde scrolleando.

### 🔴 ONBOARDING / EDITABLE PROFILE
**Todas:**
- Wizard de configuración inicial (nombre, peso, altura, objetivo)
- Perfil siempre editable
- Mediciones se registran como historial (no se sobreescriben)

**MARK PT:** Cero onboarding. Abrís la app y ya sos Lucas de 81.2kg.

### 🟡 WORKOUT TRACKING (Parcialmente hecho)
**Hevy (gold standard):**
- Template de workout → tap → timer empieza
- Cada ejercicio: sets en tabla (peso × reps × RPE) — NO una card gigante
- Swipe left/right entre ejercicios
- Add set es un simple "+" button
- Supersets enlazados visualmente
- Rest timer entre sets (no entre ejercicios)
- Previous performance visible INLINE en cada set row
- Notes por set individual
- Replace exercise mid-workout
- Reorder exercises mid-workout

**MARK PT:** Card-based, un ejercicio a la vez (no tabla). No se puede editar un set ya logueado. No se puede reemplazar ejercicio mid-workout. Rest timer funciona pero UX es tosca.

### 🟡 HISTORIAL / LOG
**Hevy/Strong:**
- Calendar view (tap fecha → ver workout)
- Estadísticas por período (semana/mes/año)
- Volumen total (tonnage = sets × reps × weight)
- Personal bests automáticos por ejercicio
- Filtro por ejercicio / grupo muscular / fecha

**MARK PT:** Lista cronológica simple. Sin calendar. Sin volumen/tonnage. Sin filtros.

### 🟡 PROGRESO / ANALYTICS
**Alpha Progression / Hevy Pro:**
- Gráfico de 1RM estimado por ejercicio (línea de tiempo)
- Volumen por grupo muscular por semana (barras apiladas)  
- Peso corporal overlay con tendencia suavizada
- Comparación mes-a-mes
- e1RM tracking automático

**MARK PT:** Tiene charts básicos SVG manuales. Sin tooltips. Sin comparaciones temporales. Charts no interactivos.

### 🟢 NUTRICIÓN (Ya está bien)
**MyFitnessPal:**
- Barcode scanner
- Database gigante de alimentos
- Macro tracking por comida

**MARK PT:** Tiene tracking de macros, plan de comidas, lista de compras, suplementos, recetas. Para ser una app de gym, la nutrición está bastante completa. Solo falta poder editar el plan.

### 🟢 EJERCICIOS (Ya está bien)
**Hevy:**
- Library de 1000+ ejercicios con GIFs
- Custom exercises
- Muscle group filter

**MARK PT:** 60+ ejercicios con instrucciones y tips. Falta: GIFs/videos, custom exercises.

---

## PLAN DE ACCIÓN PRIORIZADO

### FASE 1 — URGENTE (La app se siente rota sin esto)

#### 1.1 Página de Perfil (`/profile`)
- Foto de perfil (upload o avatar)
- Datos editables: nombre, edad, altura, peso actual, BF%
- Objetivos editables: meta peso, meta BF, fecha objetivo
- Sección mediciones: registro con fecha (historial, no sobreescribir)
- Gráfico de peso over time (de check-ins + mediciones)
- Gráfico de circunferencias over time
- Stats calculados: BMI, FFMI, peso a perder, % completado del objetivo

#### 1.2 Redesign Dashboard (`/`)
**ANTES** (12+ secciones desordenadas):
```
Header → Check-in form (6 campos) → Macros → Weekly Grid → 
Today Workout → Muscle Radar → Countdown timers → Stats →
Weekly Notes → Historic Lifts → (scroll infinito)
```

**DESPUÉS** (Hevy-inspired, máximo 5 secciones claras):
```
Header (nombre + avatar + streak + settings gear)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[HOY] Card principal: Workout del día
  → Nombre, duración, ejercicios count
  → BIG button "EMPEZAR" 
  → O "✓ Completado" si ya entrenó
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quick Stats Row (3 cards inline):
  [🔥 Racha: 5]  [⚖️ 80.1kg]  [📊 Fase 1 S3]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Macros del Día (progress bar compacto)
  Proteína: ████████░░ 142/170g
  Calorías: ██████░░░░ 1800/2300
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Actividad Reciente (últimos 2 workouts)
  → Lun: Upper Push · 42min · 24 sets
  → Mar: Lower Quad · 38min · 20 sets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Semana (7 dots: ✓ ✓ ⚽ · · · ·)
```

**¿Qué pasa con lo que se elimina del dashboard?**
- Check-in → Se mueve a modal/bottom-sheet (tap en peso del header)
- Muscle Radar → Se queda solo en `/exercises`
- Countdown timers → Se mueve al perfil
- Weekly Notes → Se mueve al perfil o log
- Historic Lifts → Se mueve a `/progress`

#### 1.3 Perfil Dinámico (NO hardcoded)
- `profile.ts` exporta solo defaults iniciales
- Todo lo editable se guarda en localStorage
- `getProfile()` lee desde storage, fallback a defaults
- `saveProfile(data)` persiste cambios
- Onboarding wizard en primer uso (detecta si no hay perfil guardado)

### FASE 2 — CALIDAD DE VIDA

#### 2.1 Workout Session Mejorada
- Set logging en TABLA (no card gigante) — estilo Hevy
- Previous performance inline por cada set row
- Editar sets ya logueados (tap para editar)
- Reemplazar ejercicio mid-workout
- Auto-focus al campo de reps después del rest timer

#### 2.2 Log con Calendar View
- Vista calendario (mes) con dots en días entrenados
- Tap en fecha → ver workout de ese día
- Filtros: por ejercicio, grupo muscular
- Volumen total (tonnage) por sesión visible
- Resumen semanal: sets totales, volumen, duración

#### 2.3 Progress Mejorado
- Tabs: Cuerpo | Fuerza | Volumen
- **Cuerpo**: Peso, BF%, circunferencias (gráficos overlay)
- **Fuerza**: e1RM por ejercicio, PRs, comparación mensual
- **Volumen**: Sets/semana por grupo muscular (barras apiladas)
- Tooltips en charts (tap para ver valor exacto)

### FASE 3 — POLISH

#### 3.1 Onboarding Wizard
- Paso 1: Nombre, edad, altura, peso
- Paso 2: Objetivo (perder grasa / ganar músculo / recomp)
- Paso 3: Experiencia (principiante / intermedio / avanzado)
- Paso 4: Equipamiento disponible
- Paso 5: Días disponibles para entrenar
- Auto-genera programa basado en respuestas

#### 3.2 Mediciones Corporales
- Registrar mediciones con fecha
- Comparar last vs current
- Gráfico de cada circunferencia over time
- Fotos de progreso (antes/después) — save to localStorage como base64

#### 3.3 UX & Animation
- Page transitions (slide left/right)
- Skeleton loaders mientras carga data
- Haptic feedback en acciones key
- Pull-to-refresh en dashboard
- Swipe gestures en workout session

---

## RESUMEN EJECUTIVO

| Categoría | MARK PT Actual | Apps Top | Gap |
|-----------|---------------|----------|-----|
| **Perfil** | ❌ Hardcoded | ✅ Editable + historial | 🔴 CRÍTICO |
| **Dashboard** | ⚠️ 12+ secciones | ✅ 3-5 limpio | 🔴 CRÍTICO |
| **Mediciones** | ❌ No existe | ✅ Con gráficos | 🔴 CRÍTICO |
| **Workout Track** | ✅ Funcional | ✅ Tabla-based | 🟡 MEJORABLE |
| **Historial** | ⚠️ Lista simple | ✅ Calendar + filtros | 🟡 MEJORABLE |
| **Progreso** | ⚠️ Charts básicos | ✅ Multi-tab + tooltips | 🟡 MEJORABLE |
| **Nutrición** | ✅ Completa | ✅ Similar | 🟢 OK |
| **Ejercicios** | ✅ 60+ library | ✅ +GIFs +custom | 🟢 OK |
| **Settings** | ✅ Funcional | ✅ Similar | 🟢 OK |
| **Dark Mode** | ✅ Toggle | ✅ Similar | 🟢 OK |
