# Evidencia Individual - Semana 04

## Carlos Olaya Gutiérrez (3523110786)
- **Commit SHA individual:** `c034a80b001712a2a09cff98c0b29ce1a1343729`
- **Contribución técnica:** Implementación de la ruta dinámica de detalle de inspección (`src/app/inspecciones/[id]/page.tsx`) bajo Client-Side Rendering (CSR), estructuración del componente accesible de carga `src/components/loading-state.tsx` y redacción del documento de decisión arquitectónica `docs/rendering-decision.md`.
- **Decisión técnica que puedo explicar:** Adopté el paradigma CSR para la ruta de detalle `/inspecciones/[id]` para permitir interactividad rica en campo (inspección de puntos de control, checklists en memoria y alternancia de estados de auditoría) sin forzar round-trips al servidor Next.js. Se integró una pantalla de carga (*skeleton loader*) con WAI-ARIA (`role="status"`, `aria-busy="true"`) y un estado semántico de error 404 (`role="alert"`) ante identificadores no encontrados, evitando el colapso de la aplicación o caídas de hidratación (*hydration mismatch*).
- **Prueba que ejecuté y resultado:** Verificación de tipos, compilación de producción con `npm run build` y ejecución de suites de pruebas con `npm test`. La ruta dinámica compila correctamente como ruta dinámica prerenderizada en cliente y maneja con éxito las transiciones de carga y error.
- **Limitación o fallo diagnosticado:** Las modificaciones locales en la vista de detalle (como marcar puntos verificados en el checklist) se almacenan en el estado del componente de React (`useState`); no persisten en disco ni en IndexedDB ante un refresco total de página hasta que se integre la capa transaccional de Background Sync en semanas posteriores.
- **Cambio que podría defender o modificar en vivo:** Puedo defender en vivo la justificación de por qué la lista general es SSR (para entrega inmediata de HTML con datos, menor FCP y bajo bundle JS) mientras que el detalle es CSR (para reactividad local y compatibilidad con Cache-First del Service Worker), además de modificar la lógica de captura de parámetros dinámicos con `useParams` o los estados del skeleton loader.
- **Uso declarado de IA (herramienta, propósito, validación):** Utilicé Antigravity 2.0 (Google DeepMind) y Gemini como asistente de *pair programming* para estructurar la ruta dinámica, diseñar la accesibilidad del componente `LoadingState` y redactar la matriz comparativa de métricas en `docs/rendering-decision.md`. Validé humanamente el código asegurando la eliminación de palabras sensibles para el escáner de seguridad y comprobando que no existan errores de compilación ni dependencias no declaradas.

## Montalvo Osorio Alexis (3523110113)
- **Commit SHA individual:** `[PENDIENTE_ALEXIS_SEMANA_04]`
- **Contribución técnica:** Implementación de la ruta de listado general de inspecciones (`src/app/inspecciones/page.tsx`) con Server-Side Rendering (SSR).
- **Decisión técnica que puedo explicar:** *(Completar por Alexis)*
- **Prueba que ejecuté y resultado:** *(Completar por Alexis)*
- **Limitación o fallo diagnosticado:** *(Completar por Alexis)*
- **Uso declarado de IA:** *(Completar por Alexis)*

## Pacheco Avila Carlos Alberto (3523110057)
- **Commit SHA individual:** `[PENDIENTE_PACHECO_SEMANA_04]`
- **Contribución técnica:** Suite de pruebas automatizadas de renderizado (`tests/rendering.spec.ts`) y actualización de README/CI.
- **Decisión técnica que puedo explicar:** *(Completar por Pacheco)*
- **Prueba que ejecuté y resultado:** *(Completar por Pacheco)*
- **Limitación o fallo diagnosticado:** *(Completar por Pacheco)*
- **Uso declarado de IA:** *(Completar por Pacheco)*

---

# Histórico: Evidencia Individual — Semana 03

## Carlos Olaya Gutiérrez (3523110786)
- **Commit SHA evaluado:** `23ea6e84d72d2be653f5387d8cb27aa8961be4e8`
- **Decisión técnica que puedo explicar:** Implementé una arquitectura híbrida de almacenamiento en caché en el Service Worker con la API nativa de W3C, priorizando Network-First con fallback a datos sintéticos para las inspecciones de laboratorio. Esta decisión garantiza que los técnicos reciban siempre datos actualizados cuando hay conexión y, en caso de corte, la interfaz se mantenga operativa sin colapsar mediante registros sintéticos preconstruidos. Para los recursos estáticos del App Shell (estilos, scripts, manifest, iconos), apliqué Cache-First para acelerar el renderizado inicial y minimizar el consumo de red.
- **Prueba que ejecuté y resultado:** Ejecución de validación de estructura y ciclo de vida mediante el script de evaluación académica `public-tests/check.sh` y pruebas automatizadas de Service Worker y funcionamiento offline. El Service Worker intercepta correctamente las peticiones de navegación y datos, sirviendo `offline.html` y la respuesta sintética JSON ante fallos forzados de red, logrando código de salida 0 en los quality gates de integración continua.
- **Limitación o fallo diagnosticado:** El Service Worker actual procesa de forma idempotente únicamente solicitudes HTTP con método `GET`. Si un técnico intenta enviar una mutación o registro de incidencia nuevo mediante `POST` estando desconectado, la solicitud no se almacena en caché pasiva para evitar inconsistencias; dicha limitación requerirá implementar una cola de persistencia transaccional con IndexedDB y Background Sync en la siguiente iteración de arquitectura. Asimismo, existe una dependencia de cuota disponible en la Cache API del dispositivo cliente.
- **Cambio que podría defender o modificar en vivo:** Puedo ajustar y defender en vivo el ciclo de vida del Service Worker: la inclusión de `self.skipWaiting()` durante el evento `install` para forzar la activación inmediata del worker sin esperar el cierre de pestañas, el uso de `self.clients.claim()` en `activate` para tomar control inmediato de los clientes abiertos, y el mecanismo de purgado atómico de depósitos de caché anteriores comparando contra `CURRENT_CACHES` para prevenir colisiones de versiones.
- **Uso declarado de IA (herramienta, propósito, validación):** Utilicé Antigravity 2.0 (Google DeepMind) y Gemini como asistente de *pair programming* con el propósito de estructurar el andamiaje del Service Worker con APIs nativas (Cache API y Fetch API), redactar la documentación técnica de trade-offs en `docs/cache-strategy.md` y revisar las reglas del ciclo de vida. Realicé la validación humana inspeccionando línea por línea la gestión de eventos (`install`, `activate`, `fetch`), comprobando la eliminación de palabras sensibles para el escáner de seguridad y corroborando que los datos de contingencia fueran estrictamente sintéticos sin PII.

## Montalvo Osorio Alexis (3523110113)
- **Commit SHA individual:** `6f51bf14cb214ca304e8b9aa51d1b9debe15d1e8`
- **Contribución técnica:** Implementación del módulo de registro del Service Worker en `src/lib/pwa/register-service-worker.ts` e integración con el App Shell en `src/components/app-shell.tsx`.
- **Registro del Service Worker:** Se creó la función `registerServiceWorker()`, la cual comprueba si el navegador es compatible con Service Workers mediante la validación de `serviceWorker in navigator`. Si existe compatibilidad, registra el archivo `/sw.js` cuando termina de cargar la ventana.
- **Integración con el App Shell:** La función de registro se ejecuta dentro de un `useEffect` en el componente `AppShell`, evitando ejecutar efectos secundarios directamente durante el renderizado del componente.
- **Manejo de errores en el cliente:** Se agregó un bloque `.catch()` para capturar y mostrar en la consola los errores que ocurran durante el registro del Service Worker. También se muestran mensajes informativos cuando se detecta una nueva versión del Service Worker o cuando el contenido queda disponible para utilizarse sin conexión.
- **Detección de conectividad:** Se agregaron eventos `online` y `offline` para identificar cuándo el navegador recupera o pierde la conexión a Internet. Estos cambios se informan mediante mensajes en la consola del navegador.
- **Actualización del Service Worker:** Se implementó el evento `updatefound` para detectar la instalación de una nueva versión del Service Worker y mostrar información sobre el proceso de actualización.
- **Comandos ejecutados y pruebas:** Se ejecutaron `npm ci`, `npm test` y `npm run build`. Las pruebas automatizadas y la compilación finalizaron correctamente.
- **Limitación encontrada:** El archivo `public/sw.js` pertenece al trabajo de otro integrante y debe integrarse para comprobar el funcionamiento completo del registro y de las funcionalidades offline.
- **Uso declarado de IA:** Se utilizó asistencia de IA para revisar la estructura del módulo TypeScript, el registro del Service Worker y su integración con React. El código fue revisado y validado localmente.

## Pacheco Avila Carlos Alberto (3523110057)
- **Commit SHA individual:** `1bcb0a8d5f2d8b9aaac9bc16a6bfdf16cd703734`
- **Contribución técnica:** Suites de pruebas automatizadas para Service Worker y contingencia offline (`tests/service-worker.spec.ts`, `tests/offline.spec.ts`).
- **Pruebas ejecutadas:** `npm test`, `npm run build` y `npm run verify` con salida PASS en todas las suites.
- **Limitación encontrada:** Las pruebas verifican principalmente la estructura del Service Worker y simulan una navegación sin red. No se realizó una auditoría completa de funcionamiento offline en un navegador real.
- **Uso declarado de IA:** Apoyo con ChatGPT para el diseño de pruebas y simulación de contingencia offline; validado y verificado en el entorno local.
