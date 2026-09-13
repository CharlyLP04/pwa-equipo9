# Evidencia Individual - Semana 02

- **Nombre:** Carlos Olaya Gutiérrez
- **Matrícula:** 3523110786
- **Commit SHA:** `2c05fab694794e3c2f072780e109dc51ae7a8793`

### 1. Decisión Técnica
Se implementó un App Shell desacoplado mediante `src/components/app-shell.tsx` soportando estados de carga (skeleton), error y vacío. Se optó por renderizar estos estados dentro del mismo layout para garantizar que la navegación de la PWA permanezca accesible aun si el flujo de datos falla.

### 2. Prueba Ejecutada
- Ejecución de `npm run test` validando el renderizado de los componentes del Shell.
- Comprobación manual de cambio de estados (carga/vacío/error) en navegador Chromium y simulación móvil en DevTools.

### 3. Limitación Encontrada
Actualmente los estados dependen de un booleano local y datos sintéticos en memoria; la persistencia offline real mediante Service Worker se integrará en la Semana 03.

### 4. Uso Declarado de IA
- **Herramienta:** Gemini
- **Propósito:** Estructuración de la arquitectura de componentes para el App Shell y división modular del equipo.
- **Validación:** Se revisó manualmente la sintaxis de TypeScript, compatibilidad con Next.js App Router y se verificó en compilación local.

---

# Histórico: Evidencia Individual — Semana 1

## 3523110786 Olaya Gutiérrez Carlos
- **Nombre:** Carlos Olaya Gutiérrez (3523110786)
- **Repositorio y commit evaluado:** Pull Request #1 fusionado en `main`: https://github.com/CharlyLP04/pwa-equipo9/pull/1
- **Mi contribución concreta:** Creación del repositorio base, configuración inicial del entorno reproducible, redacción de `docs/decision-record.md` (ADR-001) y definición de requisitos.
- **Decisión técnica:** Selección de PWA sobre aplicaciones nativas para operar en laboratorios con conectividad intermitente.
- **Comando ejecutado:** `npm ci`, `npm test` y `npm run verify` con salida `PASS`.

## 3523110057 Pacheco Avila Carlos Alberto
- **Nombre:** Carlos Alberto Pacheco Avila (3523110057)
- **Repositorio y commit evaluado:** Pull Request #3 fusionado en `main`: https://github.com/CharlyLP04/pwa-equipo9/pull/3
- **Mi contribución concreta:** Redacción de RNF en `docs/requirements.md`, criterios de aceptación y política de datos sintéticos.

## 3523110113 Montalvo Osorio Alexis
- **Nombre:** Alexis Montalvo Osorio (3523110113)
- **Repositorio y commit evaluado:** Pull Request #2 fusionado en `main`: https://github.com/CharlyLP04/pwa-equipo9/pull/2
- **Mi contribución concreta:** Redacción de problema, contexto y escenarios de conectividad intermitente en `docs/requirements.md`.