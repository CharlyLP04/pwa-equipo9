# Evidencia Individual

- **Estudiante:** Carlos Olaya Gutierrez
- **Commit SHA evaluado:** `[ESPACIO_PARA_EL_HASH]`
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
