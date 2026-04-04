# Flujo de trabajo Git (Git Flow) — MARK PT

Variante profesional de GitHub Flow con rama intermedia de pruebas (`test`) antes de producción (`main`).

## Ramas principales

| Rama | Propósito |
|------|-----------|
| `main` | Producción estable. Solo recibe merges desde `test`. Tag de versión aquí. |
| `test` | Pre-producción / QA. Toda funcionalidad se valida aquí antes de `main`. |

## Ramas de trabajo

| Prefijo | Uso |
|---------|-----|
| `feature/<nombre>` | Nuevas funcionalidades |
| `fix/<nombre>` | Correcciones de bugs |
| `refactor/<nombre>` | Mejoras internas sin cambiar funcionalidad |

## Flujo de trabajo

### 1. Crear rama de trabajo desde `test`
```bash
git checkout test
git pull origin test
git checkout -b feature/nombre-descriptivo
```

### 2. Desarrollar en la rama
```bash
# Commits atómicos con prefijo
git add .
git commit -m "feat: descripción breve del cambio"
```

### 3. Push y Pull Request a `test`
```bash
git push -u origin feature/nombre-descriptivo
# Crear PR → test en GitHub
```

### 4. Merge a `test` (tras review/aprobación)
```bash
git checkout test
git pull origin test
git merge feature/nombre-descriptivo
git push origin test
```

### 5. Validar en `test`, luego merge a `main`
```bash
git checkout main
git pull origin main
git merge test
git push origin main
git tag -a v1.X.0 -m "Release v1.X.0"
git push origin --tags
```

## Convenciones de Commits

```
feat:     Nueva funcionalidad
fix:      Corrección de bug
refactor: Refactor de código
docs:     Solo documentación
style:    Formato (sin cambiar lógica)
chore:    Tareas de mantenimiento
perf:     Mejoras de rendimiento
test:     Agregar o modificar tests
```

## Ejemplo completo

```bash
# 1. Empezar feature
git checkout test && git pull
git checkout -b feature/rest-timer

# 2. Trabajar...
git add . && git commit -m "feat: add circular rest timer with auto-start"
git add . && git commit -m "feat: add haptic feedback on timer complete"

# 3. Push
git push -u origin feature/rest-timer

# 4. Merge a test
git checkout test && git pull
git merge feature/rest-timer
git push origin test

# 5. Si todo ok → main
git checkout main && git pull
git merge test
git push origin main
git tag -a v1.3.0 -m "v1.3.0 - Rest Timer"
git push origin --tags

# 6. Limpiar
git branch -d feature/rest-timer
git push origin --delete feature/rest-timer
```
