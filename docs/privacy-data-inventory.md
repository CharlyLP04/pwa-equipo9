
# Inventario de privacidad — PWA de inspecciones de laboratorio

**Actividad:** Semana 09 — Seguridad, privacidad y prevención de abuso
**Responsable:** Alexis Montalvo Osorio
**Datos utilizados:** 100 % sintéticos.
**Alcance:** Prototipo académico de inspecciones de laboratorio.

## 1. Marco normativo y contexto institucional

La Universidad Tecnológica de Tehuacán cuenta con un decreto de creación que la constituye como organismo público descentralizado del Gobierno del Estado de Puebla.

Por su naturaleza como entidad pública, este ejercicio toma como referencia la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados (LGPDPPSO), considerando sus disposiciones sobre finalidad, proporcionalidad, tratamiento adecuado y conservación de datos personales.

Este documento corresponde a una actividad académica y no representa una declaración de cumplimiento institucional ni una autorización para tratar información personal real.

### Fundamento normativo

Se consideran los siguientes artículos:

| Artículo | Disposición | Aplicación en el proyecto |
|---|---|---|
| 10 | Principios de protección de datos personales, entre ellos finalidad y proporcionalidad | Justificar el uso de cada dato y evitar tratamientos innecesarios |
| 12 | Las finalidades deben ser concretas, lícitas, explícitas y legítimas | Limitar los datos a las inspecciones sintéticas de laboratorio |
| 17 | Conservación limitada al tiempo necesario para cumplir la finalidad | Evitar conservar información después de concluir su propósito |
| 18 | Documentar procedimientos y plazos de conservación, bloqueo y supresión | Definir cuándo y cómo se eliminan los registros |
| 19 | Tratar únicamente datos adecuados, relevantes y estrictamente necesarios | Aplicar minimización de datos |
| 27 | Gestión de medidas de seguridad, inventario y análisis de riesgos | Mantener identificados los datos, sus sistemas de tratamiento y sus riesgos |

**Referencias oficiales:**

- Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados: https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPDPPSO.pdf
- Marco normativo de la Universidad Tecnológica de Tehuacán: https://uttehuacan.edu.mx/web/seccion.php?id=428

## 2. Finalidad y alcance del tratamiento

El propósito del prototipo es demostrar el registro, almacenamiento, consulta y sincronización de inspecciones de mantenimiento en laboratorios universitarios.

La información utilizada permite probar:

- La creación de inspecciones con identificadores ficticios.
- La asignación de reportes a laboratorios mediante etiquetas.
- La identificación de roles y permisos.
- El almacenamiento temporal de operaciones offline.
- La generación de evidencia fotográfica sintética.
- La aplicación de controles de acceso y cierre de sesión.

No se contempla la creación de expedientes reales de estudiantes, docentes, personal administrativo ni técnicos.

## 3. Inventario obligatorio de datos

La siguiente tabla identifica los datos, su finalidad, el flujo dentro de la aplicación, el almacenamiento observado y su tratamiento al concluir la actividad.

| Dato o categoría | Finalidad | Origen y flujo | Almacenamiento observado | Conservación y eliminación |
|---|---|---|---|---|
| **ID sintético de inspección** | Asociar de manera única una inspección de prueba | Se genera en el cliente y se envía a la API durante la sincronización | `localStorage`: `utt-local-inspections` y `utt-lab-outbox`. En el servidor local: `.local/inspections.json` y `Map` en memoria | Conservar durante la evaluación. La cola elimina operaciones confirmadas; los reportes locales requieren limpieza al cerrar sesión o al concluir la práctica |
| **Evidencia fotográfica sintética** | Representar visualmente un hallazgo de mantenimiento | Se genera mediante el módulo de cámara y su mecanismo de respaldo sintético | Estado temporal de React, mediante `cameraResult`. No se incorpora al registro enviado a la API ni a la cola revisada | Descartar después de guardar o cambiar la sesión. Revisar el plazo si se incorpora posteriormente a un flujo persistente |
| **Coordenadas GPS precisas** | Identificar el laboratorio más cercano | La Geolocation API puede obtener coordenadas y asociarlas con un laboratorio | Se procesan temporalmente en el módulo de geolocalización. El flujo de inspección conserva únicamente `laboratoryTag` | No almacenar coordenadas crudas permanentemente. Minimizar la información y descartarla después de identificar el laboratorio |
| **Credencial de sesión** | Permitir el control de acceso autorizado | Se genera al iniciar sesión y se utiliza para identificar la sesión ante el servidor | Contexto de sesión en un `Map` de memoria del servidor. La credencial se transporta mediante una cookie `HttpOnly` | No guardar en `localStorage` ni `sessionStorage`. Revocar la sesión y eliminar la cookie al cerrar sesión |
| **Datos personales reales (PII)** | Ninguna finalidad autorizada en el prototipo | No deben introducirse en formularios, registros, pruebas ni evidencias | No debe existir almacenamiento de información personal real | Prohibido recolectar. Rechazar su utilización en fixtures y sanitizar el contenido cuando corresponda |
| **Identidad sintética y rol** | Distinguir los permisos de inspector, supervisor y visitante | Se obtiene del contexto de sesión comprobado por el servidor | Contexto de sesión en memoria y cuentas sintéticas de práctica | Conservar únicamente durante la prueba. Eliminar el estado de sesión al cerrar o expirar la sesión |

### Consideraciones sobre el almacenamiento observado

**Identificadores y reportes:** las inspecciones se conservan en `localStorage` y se sincronizan con el servidor local. La cola de operaciones utiliza la clave `utt-lab-outbox`. Los registros del servidor se guardan en `.local/inspections.json`.

**Evidencia fotográfica:** el módulo permite utilizar la cámara del dispositivo cuando se concede el permiso. Como la actividad exige datos 100 % sintéticos, durante la evaluación debe utilizarse la evidencia sintética y evitar capturas reales. En el flujo revisado, el resultado de cámara permanece en memoria y no se agrega al objeto enviado al servidor.

**Ubicación:** el módulo puede obtener coordenadas reales de forma temporal. Antes de utilizar el resultado en la inspección, `minimizeLocationData` conserva únicamente la etiqueta del laboratorio. No se debe incorporar la posición precisa al reporte.

**Sesión:** el servidor mantiene el contexto de autorización en memoria y utiliza una cookie con propiedades `HttpOnly` y `SameSite=Strict`. En conexiones HTTPS también establece `Secure`. La sesión tiene una vigencia de 30 minutos.

**Información personal real:** la validación de campos comprueba tipos, rangos y longitudes, pero no identifica por sí sola todos los datos personales. Por ello, la prohibición de utilizar información real también debe respetarse en la captura, los datos de prueba y la revisión humana.

## 4. Sistemas y superficies de almacenamiento

| Superficie | Información relacionada | Tratamiento aplicado |
|---|---|---|
| localStorage | Inspecciones locales y operaciones pendientes | Eliminar las claves que comienzan con `utt-` al cerrar sesión |
| sessionStorage | Estado temporal del navegador | Limpiar las claves administradas con el prefijo `utt-` |
| Cache Storage | Recursos administrados por el Service Worker | Eliminar cachés cuyo nombre comienza con `utt-lab-` durante la limpieza de sesión |
| Memoria de React | Evidencia fotográfica y resultados temporales de ubicación | Reiniciar los estados al guardar o cambiar de sesión |
| Memoria del servidor | Contextos de sesión y registros cargados | Revocar sesiones y limitar el alcance de las consultas |
| Persistencia local del servidor | Reportes de prueba en `.local/inspections.json` | Mantener únicamente datos sintéticos y realizar limpieza controlada al terminar la actividad |
| IndexedDB | Base pwa_offline_db contemplada preventivamente; las inspecciones y outbox activas usan localStorage | security-session-panel.tsx invoca la limpieza y espera indexedDB.deleteDatabase("pwa_offline_db"); bloqueos o errores producen aviso de limpieza incompleta |

## 5. Principios de privacidad por diseño

### 5.1 Finalidad

Cada dato utilizado debe tener un propósito específico relacionado con la demostración de las inspecciones de laboratorio.

Los identificadores permiten distinguir los registros; las etiquetas identifican el laboratorio; los roles permiten comprobar los permisos y las evidencias sintéticas representan hallazgos.

No se permite reutilizar esta información para identificar personas, realizar seguimiento de usuarios ni generar expedientes institucionales.

**Evidencia técnica:**

- `src/components/inspection-sync-manager.tsx`
- `src/app/api/secure-inspections/route.ts`
- `src/lib/security/server-auth.ts`

### 5.2 Minimización

Se conserva únicamente la información necesaria para cumplir con la finalidad de la práctica.

El caso más importante es la ubicación: la aplicación puede obtener coordenadas, pero la función `minimizeLocationData` devuelve exclusivamente la etiqueta del laboratorio.

También se evita incorporar la evidencia fotográfica temporal al registro enviado al servidor.

**Evidencia técnica:**

- `src/lib/security/validation.ts`
- `src/lib/device/geolocation.ts`
- `src/lib/device/camera.ts`

### 5.3 Proporcionalidad

La cantidad y el tipo de información deben ser adecuados al objetivo académico.

Por ejemplo:

- No es necesario registrar nombres reales para identificar a un inspector.
- No es necesario conservar coordenadas GPS precisas para identificar un laboratorio.
- No es necesario almacenar fotografías reales para demostrar el funcionamiento de la cámara.
- No se requiere recopilar información personal para probar los permisos de acceso.

**Decisión:** utilizar identificadores, ubicaciones y evidencias sintéticas para reducir la exposición y mantener el alcance del proyecto.

### 5.4 Temporalidad

La información debe conservarse únicamente mientras sea necesaria para la actividad y eliminarse cuando concluya su finalidad, respetando los plazos aplicables.

En el prototipo:

- Las operaciones confirmadas se retiran de la cola de sincronización.
- El cierre de sesión elimina las claves administradas del almacenamiento local y las cachés privadas.
- Los resultados temporales de cámara y ubicación se reinician en la interfaz.
- Las sesiones tienen una vigencia máxima de 30 minutos.
- Los registros de `.local/inspections.json` requieren limpieza controlada al finalizar la demostración.

La eliminación local no equivale a la eliminación automática de los registros persistidos en el servidor. Por ello, debe realizarse una revisión final del almacenamiento local del servidor.

**Evidencia técnica:**

- `src/lib/security/session-cleanup.ts`
- `src/components/security-session-panel.tsx`
- `src/lib/security/client-session.ts`
- `src/lib/sync/queue.ts`
- `public/sw.js`

## 6. Medidas y responsabilidades de protección

| Medida | Propósito | Evidencia |
|---|---|---|
| Uso exclusivo de datos sintéticos | Evitar la exposición de personas reales | Fixtures y revisión de formularios |
| Validación de entradas | Rechazar datos fuera del contrato | `validateInspectionInput` |
| Control por roles | Restringir operaciones según permisos | `authorizeAction` |
| Minimización de ubicación | Evitar conservar coordenadas innecesarias | `minimizeLocationData` |
| Cierre de sesión | Reducir exposición de información local | `clearPrivateSessionStorage` |
| Protección de rutas privadas | Evitar almacenamiento de respuestas privadas en caché | `public/sw.js` y encabezados HTTP |
| Conservación limitada | Eliminar datos al concluir su finalidad | Procedimiento de limpieza local y del servidor |

## 7. Limitaciones y acciones pendientes

1. El prototipo utiliza persistencia local en un único proceso Node.js; no representa una infraestructura institucional ni una base de datos administrada.

2. Los reportes locales pueden permanecer en el dispositivo después de sincronizarse. Deben limpiarse cuando termine su periodo de utilización.

3. La revocación remota de una sesión requiere conexión. Si no existe conectividad, debe completarse el cierre antes de compartir el dispositivo.

4. La cámara permite captura real cuando se concede el permiso. Para esta actividad se debe utilizar exclusivamente evidencia sintética.

5. Las coordenadas obtenidas por la Geolocation API pueden ser reales. Debe utilizarse selección sintética o manual y evitar conservar la ubicación precisa.

6. La persistencia activa usa localStorage: utt-local-inspections y utt-lab-outbox. IndexedDB no almacena las inspecciones del flujo actual; se elimina preventivamente pwa_offline_db al cerrar sesión. Si otra pestaña bloquea el borrado, se informa limpieza incompleta.

7. La validación de entradas no garantiza por sí sola la detección de información personal real. Se necesita mantener la prohibición de captura de dichos datos y realizar revisión humana.

8. Los registros del servidor local requieren un procedimiento de limpieza independiente del cierre de sesión del navegador.

## 8. Conclusión

El inventario identifica los datos utilizados por la PWA, su finalidad, origen, almacenamiento y tratamiento al terminar la actividad.

La decisión principal de privacidad consiste en utilizar información sintética, reducir la ubicación a una etiqueta de laboratorio y limitar la conservación de los registros al periodo necesario para las pruebas.

La protección no depende solamente de ocultar información en la interfaz. También requiere revisar el almacenamiento local, la cola offline, las cachés administradas y la persistencia del servidor.

El inventario deberá actualizarse cuando cambien los datos tratados, los mecanismos de almacenamiento o los controles implementados.

---

## Referencias

- Cámara de Diputados del H. Congreso de la Unión. (2025). *Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados*. Última reforma publicada en el Diario Oficial de la Federación el 14 de noviembre de 2025. https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPDPPSO.pdf
- Universidad Tecnológica de Tehuacán. (s. f.). *Marco normativo*. https://uttehuacan.edu.mx/web/seccion.php?id=428
