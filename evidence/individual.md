# Evidencia Individual

- **Estudiante:** Carlos Olaya Gutierrez
- **Commit SHA evaluado:** `23ea6e84d72d2be653f5387d8cb27aa8961be4e8`
- **Decisión técnica que puedo explicar:**  
  Implementé una arquitectura híbrida de almacenamiento en caché en el Service Worker con la API nativa de W3C, priorizando Network-First con fallback a datos sintéticos para las inspecciones de laboratorio. Esta decisión garantiza que los técnicos reciban siempre datos actualizados cuando hay conexión y, en caso de corte, la interfaz se mantenga operativa sin colapsar mediante registros sintéticos preconstruidos. Para los recursos estáticos del App Shell (estilos, scripts, manifest, iconos), apliqué Cache-First para acelerar el renderizado inicial y minimizar el consumo de red.

- **Prueba que ejecuté y resultado:**  
  Ejecución de validación de estructura y ciclo de vida mediante el script de evaluación académica `public-tests/check.sh` y pruebas automatizadas de Service Worker y funcionamiento offline. El Service Worker intercepta correctamente las peticiones de navegación y datos, sirviendo `offline.html` y la respuesta sintética JSON ante fallos forzados de red, logrando código de salida 0 en los quality gates de integración continua.


- **Limitación o fallo diagnosticado:**  
  El Service Worker actual procesa de forma idempotente únicamente solicitudes HTTP con método `GET`. Si un técnico intenta enviar una mutación o registro de incidencia nuevo mediante `POST` estando desconectado, la solicitud no se almacena en caché pasiva para evitar inconsistencias; dicha limitación requerirá implementar una cola de persistencia transaccional con IndexedDB y Background Sync en la siguiente iteración de arquitectura. Asimismo, existe una dependencia de cuota disponible en la Cache API del dispositivo cliente.

- **Cambio que podría defender o modificar en vivo:**  
  Puedo ajustar y defender en vivo el ciclo de vida del Service Worker: la inclusión de `self.skipWaiting()` durante el evento `install` para forzar la activación inmediata del worker sin esperar el cierre de pestañas, el uso de `self.clients.claim()` en `activate` para tomar control inmediato de los clientes abiertos, y el mecanismo de purgado atómico de depósitos de caché anteriores comparando contra `CURRENT_CACHES` para prevenir colisiones de versiones.

- **Uso declarado de IA (herramienta, propósito, validación):**  
  Utilicé Antigravity 2.0 (Google DeepMind) y Gemini como asistente de *pair programming* con el propósito de estructurar el andamiaje del Service Worker con APIs nativas (Cache API y Fetch API), redactar la documentación técnica de trade-offs en `docs/cache-strategy.md` y revisar las reglas del ciclo de vida. Realicé la validación humana inspeccionando línea por línea la gestión de eventos (`install`, `activate`, `fetch`), comprobando la eliminación de palabras sensibles para el escáner de seguridad y corroborando que los datos de contingencia fueran estrictamente sintéticos sin PII.

---

# Evidencia Individual - Semana 03

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


## Evidencia Individual — Semana 03

**Nombre:** Carlos Alberto Pacheco Avila

**Matrícula:** 3523110057

**Rol:** Pruebas automatizadas y QA Offline.

**Commit SHA:** `1bcb0a8d5f2d8b9aaac9bc16a6bfdf16cd703734`

### 1. Contribución realizada

Se implementaron dos suites de pruebas automatizadas:

* `tests/service-worker.spec.ts`: validación de los eventos del Service Worker, configuración de cachés, precarga de recursos y mecanismos de contingencia.
* `tests/offline.spec.ts`: validación de la página offline, presencia de datos sintéticos y simulación de una navegación sin conexión.

También se actualizó `package.json` para incorporar las pruebas al comando `npm test` y se documentó su ejecución en `README.md`.

### 2. Decisión técnica

Se utilizó `tsx` para ejecutar las pruebas TypeScript y el módulo `node:vm` para simular el entorno del Service Worker sin depender de un navegador.

Las pruebas permiten detectar regresiones en la configuración de cachés, eventos y mecanismos de contingencia.

### 3. Pruebas ejecutadas

* `npm test`: PASS. Cuatro suites completadas.
* `npm run build`: PASS. Compilación de producción exitosa.
* `npm run verify`: PASS. Verificación de artefactos correcta.

### 4. Limitación encontrada

Las pruebas verifican principalmente la estructura del Service Worker y simulan una navegación sin red. No se realizó una auditoría completa de funcionamiento offline en un navegador real.

### 5. Uso declarado de IA

**Herramienta:** ChatGPT.

**Propósito:** Apoyo para el diseño de pruebas automatizadas, simulación de contingencia offline y resolución de errores de ejecución de TypeScript.

**Validación humana:** Se revisaron los archivos implementados y se ejecutaron las pruebas, compilación y verificación en el entorno local, obteniendo resultados PASS.

