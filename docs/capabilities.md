# Política de Capacidades del Dispositivo, Permisos Mínimos y Fallback Progresivo

**Proyecto:** PWA de Inspecciones de Laboratorio — Universidad Tecnológica de Tehuacán  
**Módulo:** Capacidades Nativas del Dispositivo y Notificaciones (Semana 06)  
**Autor:** Carlos Olaya Gutiérrez (3523110786) — Equipo 9  
**Datos:** Estrictamente sintéticos, sin PII ni credenciales sensibles.

---

## 1. Propósito y Alcance de Ingeniería

El objetivo de esta entrega es integrar capacidades periféricas del dispositivo físico (cámara fotográfica y geolocalización) y un canal de comunicación asíncrono (notificaciones push y locales) en la PWA de inspecciones de laboratorio, satisfaciendo tres restricciones no funcionales críticas:

1. **Permisos Mínimos Just-In-Time (JIT):** Nunca solicitar permisos intrusivos al cargar la aplicación. Las solicitudes se disparan única y exclusivamente cuando el usuario realiza una acción deliberada (ej. pulsar *"Capturar fotografía del hallazgo"* o *"Verificar laboratorio por GPS"*).
2. **Degradación Elegante y Fallback Funcional:** Si el usuario deniega un permiso, si el hardware no existe (entornos de pruebas o escritorio), o si la API no está soportada en el navegador, la aplicación debe continuar operando sin arrojar excepciones no controladas ni bloquear la finalización de una inspección.
3. **Privacidad y Liberación Inmediata de Recursos:** No retener el sensor de la cámara tras la captura (invocación inmediata de `track.stop()`) y no realizar seguimiento continuo de ubicación en segundo plano (`watchPosition` prohibido; únicamente lecturas puntuales con `getCurrentPosition`).

---

## 2. Matriz de Capacidades y Niveles de Fallback

| Capacidad | API Nativa Primaria | Nivel de Permiso | Estrategia de Fallback Primaria | Estrategia de Fallback Final (Contingencia) |
|---|---|---|---|---|
| **Cámara** | `navigator.mediaDevices.getUserMedia({ video })` | `camera` (Prompt bajo acción) | Selector de archivos HTML5 `<input type="file" capture="environment">` | Generación de evidencia vectorial sintética (`createSyntheticPhotoEvidence`) para CI y offline |
| **Geolocalización** | `navigator.geolocation.getCurrentPosition()` | `geolocation` (Prompt bajo acción) | Geolocalización aproximada de red (`enableHighAccuracy: false`, cache de 60s) | Selector manual del catálogo de laboratorios del campus (`SYNTHETIC_CAMPUS_LABS`) |
| **Notificaciones** | `Notification` / `ServiceWorkerRegistration.showNotification()` | `notifications` (Prompt tras guardar) | Notificación local en Service Worker activo | Banner accesible en DOM (`role="alert"` o `role="status"`) integrado en App Shell |

---

## 3. Arquitectura del Módulo de Cámara (`src/lib/device/camera.ts`)

### 3.1 Detección Segura e Invocación Just-in-Time
La función `isCameraSupported()` valida la existencia del objeto `window.navigator.mediaDevices` y del método `getUserMedia`. La consulta de permisos mediante `queryCameraPermission()` utiliza la `Permissions API` de forma no invasiva, devolviendo `"prompt"`, `"granted"`, `"denied"` o `"unsupported"` sin desplegar diálogos invasivos en pantalla.

### 3.2 Liberación Incondicional del Sensor
Uno de los fallos más comunes en aplicaciones web es mantener abierto el `MediaStream`, lo que deja encendido el indicador LED de la cámara y drena la batería del dispositivo móvil. La función `stopMediaStream(stream)` recorre todas las pistas de video (`stream.getTracks()`) e invoca `track.stop()`, garantizando la desconexión física inmediata del hardware tras pintar el fotograma en el `Canvas`.

```text
[Acción de Usuario: Botón Captura]
          │
          ▼
┌─────────────────────────────────┐
│ requestCameraStream()           │ ── (Rechazo / Hardware Ausente) ──┐
└─────────────────────────────────┘                                    │
          │ (Éxito)                                                    ▼
          ▼                                            ┌───────────────────────────────┐
┌─────────────────────────────────┐                    │ captureWithFallback()         │
│ capturePhotoFromStream()        │                    │ -> createSyntheticPhotoEvidence│
└─────────────────────────────────┘                    └───────────────────────────────┘
          │                                                            │
          ▼                                                            ▼
┌─────────────────────────────────┐                    ┌───────────────────────────────┐
│ stopMediaStream(stream)         │                    │ Retorno de Evidencia Segura   │
│ (LED de cámara apagado)         │                    │ (fallbackUsed: true)          │
└─────────────────────────────────┘                    └───────────────────────────────┘
```

---

## 4. Arquitectura del Módulo de Geolocalización (`src/lib/device/geolocation.ts`)

### 4.1 Principio de Permisos Mínimos y Consumo Energético
A diferencia de aplicaciones de navegación en tiempo real, el registro de auditoría en laboratorios solo requiere una lectura puntual para asociar la inspección a un edificio o sala del campus. Se aplican las siguientes directrices:
- `enableHighAccuracy: false`: Utiliza antenas de telefonía o puntos de acceso Wi-Fi cercanos, evitando la activación intensiva del chip GPS y acelerando la respuesta en interiores.
- `maximumAge: 60000`: Reutiliza una lectura reciente (hasta 1 minuto) si el navegador ya la tiene disponible en memoria.
- `timeout: 10000`: Si el dispositivo tarda más de 10 segundos en responder, se cancela la espera y se conmuta automáticamente al fallback.

### 4.2 Despacho Determinista por Proximidad y Selección Manual
Las coordenadas obtenidas se comparan mediante `matchLaboratoryFromCoordinates()` contra el catálogo sintético `SYNTHETIC_CAMPUS_LABS`. Si la API arroja `PERMISSION_DENIED` o `TIMEOUT`, la función `getLocationWithFallback()` no interrumpe el registro; en su lugar, devuelve la etiqueta manual seleccionada por el técnico (o el laboratorio por defecto `Laboratorio de Redes y Telecomunicaciones`) marcando `fallbackUsed: true`.

---

## 5. Prevención de Riesgos de Seguridad y Privacidad

1. **Entorno Seguro (HTTPS):** Tanto la cámara como la geolocalización requieren un contexto seguro (`isSecureContext === true`). En entornos de desarrollo local (`localhost`), los navegadores modernos permiten la ejecución para fines de prueba.
2. **Datos Sintéticos y Privacidad del Personal:** No se capturan metadatos EXIF sensibles de personas ni rostros reales. La evidencia fotográfica de contingencia generada en `createSyntheticPhotoEvidence` genera imágenes vectoriales estructuradas con el identificador de la inspección y su marca de tiempo.
3. **Escaneo de Patrones Prohibidos:** Se cumple rigurosamente con la regla de calidad que prohíbe palabras reservadas y credenciales en el código fuente.

---

## 6. Supuestos, Límites y Fallos Diagnosticados

- **Supuesto 1:** Los navegadores en modo escritorio pueden no tener cámaras orientadas al entorno (`facingMode: "environment"`). El sistema degrada suavemente a cualquier cámara disponible o al generador sintético.
- **Supuesto 2:** En aulas o laboratorios cerrados sin cobertura satelital, la Geolocation API suele disparar el error de código 3 (`TIMEOUT`) o código 2 (`POSITION_UNAVAILABLE`). La inclusión del fallback manual garantiza que el técnico nunca quede imposibilitado para guardar su auditoría.
- **Límite Actual:** Las imágenes en Data URI consumen memoria en almacenamiento local; para una escala mayor de auditorías se requerirá persistencia en IndexedDB con compresión WebP y purga programada.
