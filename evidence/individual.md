# Evidencia Individual - Semana 02

## Carlos Olaya Gutiérrez (3523110786)
- **Commit SHA individual:** `63850e588424ae256860d4b9f2d5930773d42bc1`
- **Contribución técnica:** Diseño e implementación del App Shell modular desacoplado (`src/components/app-shell.tsx`), soporte de estados de resiliencia (skeleton loading, error, vacío), configuración inicial del Web App Manifest y generación de íconos PWA (`scripts/generate-icons.mjs`).
- **Decisión técnica explicada:** Se desacopló el App Shell de la lógica de datos y se integró dentro del layout principal con estructura semántica ARIA para garantizar que los elementos de navegación y la identidad de la aplicación permanezcan visibles e interactivos aun ante caídas en la carga de datos.
- **Comandos ejecutados y pruebas:** `npm run build`, `npm test` y `node scripts/verify.mjs` con resultado exitoso (PASS). Inspección visual y simulación en DevTools de Chromium.
- **Limitación encontrada:** La simulación de estados offline depende de banderas locales en memoria; la persistencia y control de red en caché se integrará en la siguiente fase mediante Service Workers.
- **Uso declarado de IA:** Asistencia con Gemini para la estructuración de componentes React y CSS modular; validado y adaptado manualmente para Next.js 14 App Router.

## Montalvo Osorio Alexis (3523110113)
- **Commit SHA individual:** `571c584b9650e9e1cce464e66843f855fe2e51fc`
- **Contribución técnica:** Implementación de accesos directos estándar (shortcuts) en el Web App Manifest (`public/manifest.webmanifest`) para acciones rápidas ("Nueva inspección", "Inspecciones recientes", "Historial") y adición de metadatos de compatibilidad para Safari/WebKit en iOS (`apple-mobile-web-app-capable`, `apple-touch-icon` 180x180) en `src/app/layout.tsx`.
- **Decisión técnica explicada:** Se configuraron shortcuts W3C para habilitar accesos directos desde la pantalla de inicio del dispositivo móvil sin sobrecargar el tiempo de inicio de la aplicación, complementando la compatibilidad de instalación en navegadores iOS mediante metaetiquetas específicas de WebKit.
- **Comandos ejecutados y pruebas:** Validación sintáctica de manifest JSON y ejecución de suite de pruebas `npm test` con comprobación de shortcuts y metadatos en verde (PASS).
- **Limitación encontrada:** Los shortcuts dependen del soporte nativo del sistema operativo y navegador (óptimo en Chromium/Android); en Safari de iOS el comportamiento de atajos tiene soporte restringido.
- **Uso declarado de IA:** Asistencia de IA para consultar especificaciones de Web App Manifest y estándares de compatibilidad móvil; verificado mediante pruebas automáticas.

## Pacheco Avila Carlos Alberto (3523110057)
- **Commit SHA individual:** `f6cfd4f668c6eaebef17c967e2c48b2b6f4f0ac9`
- **Contribución técnica:** Implementación y ampliación de la suite de pruebas automatizadas en `tests/manifest.spec.ts` para verificar shortcuts del manifest, metadatos PWA de Apple, landmarks semánticos del App Shell y accesibilidad accesible para lectores de pantalla.
- **Decisión técnica explicada:** Se utilizó `tsx` como runner ligero en `package.json` para ejecutar tests nativos en TypeScript directamente, asegurando que los contratos de entrega se verifiquen sin dependencias pesadas de navegador completo en CI.
- **Comandos ejecutados y pruebas:** `npm test`, `npm run build` y `node scripts/verify.mjs`. Resultado: PASS en todos los casos de prueba de manifest, accesibilidad y estados del shell.
- **Limitación encontrada:** Las pruebas automáticas validan estructura, código fuente y metadatos de accesibilidad (landmarks, roles ARIA), pero no reemplazan una prueba con tecnologías de asistencia reales en hardware físico.
- **Uso declarado de IA:** Asistencia con ChatGPT para el diseño de casos de prueba y resolución de tipos en TypeScript; revisado y validado en local antes de fusionar.

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



