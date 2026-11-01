# Modelo de amenazas — PWA de inspecciones de laboratorio

**Actividad:** Semana 09 — Seguridad, privacidad y prevención de abuso
**Responsable:** Alexis Montalvo Osorio
**Datos:** Exclusivamente sintéticos.

## 1. Contexto, alcance y escenario de amenaza

La aplicación web progresiva (PWA) permite registrar y consultar inspecciones de mantenimiento de laboratorios, incluso cuando el dispositivo pierde temporalmente la conexión a Internet.

Este modelo analiza los riesgos relacionados con la exposición, alteración y acceso no autorizado a los reportes de inspección, la identidad del inspector y su sesión de trabajo.

El análisis considera la interfaz de la aplicación, el almacenamiento local del navegador, las operaciones pendientes de sincronización, las rutas de comunicación con el servidor, los controles de acceso y la persistencia de los registros.

### Escenario obligatorio: tableta extraviada en el laboratorio

Un inspector utiliza una tableta para realizar una inspección dentro de un laboratorio. Durante el recorrido pierde la conexión a Internet y continúa registrando información.

Los reportes quedan guardados localmente en el dispositivo:

- `utt-local-inspections`: conserva las inspecciones registradas.
- `utt-lab-outbox`: mantiene las operaciones pendientes de sincronización.

Al terminar el recorrido, el inspector extravía la tableta antes de recuperar la conexión y cerrar su sesión.

Una persona encuentra el dispositivo y podría intentar consultar la pantalla que permanece abierta o acceder a los borradores almacenados localmente.

### Riesgo principal

La exposición de información ocurre si una persona no autorizada consigue acceder a una sesión todavía activa o a los reportes que permanecen almacenados en el dispositivo.

Aunque el Service Worker evita recuperar información privada desde la caché cuando no existe conexión, esto no elimina automáticamente los registros guardados en `localStorage`.

### Supuestos y límites

- Todos los registros, identidades y escenarios utilizados son ficticios.
- No se permite recolectar información personal real.
- El cliente se considera una superficie potencialmente manipulable.
- Los controles de seguridad deben comprobarse en el servidor y no depender únicamente de la interfaz.
- La implementación revisada utiliza persistencia local del servidor y un único proceso Node.js.
- El análisis corresponde al incremento de seguridad preparado por el equipo y deberá verificarse nuevamente en el commit de integración final.

El objetivo es identificar los riesgos, relacionarlos con controles técnicos existentes y establecer pruebas negativas que permitan comprobar su eficacia.

## 2. Fronteras de confianza

La arquitectura se divide en tres zonas: dispositivo, API y persistencia de datos. Cada zona tiene responsabilidades y niveles de confianza diferentes.

### Diagrama de fronteras

```text
┌──────────────────────── DISPOSITIVO ────────────────────────┐
│                                                             │
│  Pantalla / Interfaz                                        │
│                                                             │
│  localStorage                                               │
│  - utt-local-inspections                                    │
│  - utt-lab-outbox                                           │
│                                                             │
│  Cache Storage                                              │
│  - Recursos públicos y cachés utt-lab-*                     │
│                                                             │
│  IndexedDB                                                  │
│  - Superficie contemplada para el análisis                  │
│  - No se identificó uso en el flujo revisado                │
│                                                             │
│  EL CLIENTE NO ES CONFIABLE                                 │
└───────────────────────────┬─────────────────────────────────┘
                            ⇅
                 FRONTERA DE CONFIANZA 1
                            ⇅
┌───────────────────────────┴─────────────────────────────────┐
│                         API                                 │
│                                                             │
│  Autenticación: /api/session                                │
│  Autorización: /api/secure-inspections                      │
│                                                             │
│  - Verificación de sesión                                   │
│  - Validación de entradas                                   │
│  - Comprobación de roles y permisos                         │
│  - Restricción por propietario y laboratorio asignado       │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            ⇅
                 FRONTERA DE CONFIANZA 2
                            ⇅
┌───────────────────────────┴─────────────────────────────────┐
│              PERSISTENCIA DE DATOS                          │
│                                                             │
│  Implementación observada:                                  │
│  - .local/inspections.json                                  │
│  - Map en memoria del proceso Node.js                       │
│                                                             │
│  Uso local de un único proceso.                             │
│  No corresponde a una base de datos administrada.           │
└─────────────────────────────────────────────────────────────┘


## 3. Las cinco preguntas de ingeniería

### 3.1 ¿Qué protegemos?

El sistema debe proteger los siguientes activos para mantener la confidencialidad, integridad y disponibilidad de los registros de inspección.

| Activo | Información que contiene | Riesgo si se compromete |
|---|---|---|
| Reportes de laboratorio | ID sintético, laboratorio, fecha, inspector, hallazgos, nivel de riesgo, estado y resumen | Lectura no autorizada, alteración de hallazgos o decisiones de mantenimiento incorrectas |
| Identidad del inspector | Identificador sintético, rol y laboratorios asignados | Suplantación de identidad o acceso fuera de los permisos establecidos |
| Sesión de trabajo | Cookie de sesión, vigencia y contexto de autorización | Uso no autorizado de una sesión que permanezca activa en una tableta extraviada |
| Borradores offline | Registros almacenados en `utt-local-inspections` | Exposición de inspecciones todavía no sincronizadas |
| Cola de sincronización | Operaciones pendientes almacenadas en `utt-lab-outbox` | Lectura o alteración de información pendiente de envío |
| Evidencia fotográfica | Resultado temporal de captura o imagen sintética | Exposición de imágenes capturadas durante una inspección |
| Información de ubicación | Coordenadas obtenidas temporalmente y etiqueta del laboratorio | Exposición de ubicación precisa innecesaria |

**Criterio de protección:** utilizar exclusivamente datos sintéticos, limitar la información almacenada a la necesaria para realizar las inspecciones y evitar que una persona sin autorización pueda consultar o alterar los registros.

La identidad, los permisos y la propiedad de cada reporte deben comprobarse en el servidor, independientemente de lo que muestre la interfaz.

### 3.2 ¿Quién interactúa?

La aplicación contempla tres roles principales. Cada uno tiene permisos específicos que se comprueban mediante el módulo `src/lib/security/rbac.ts`.

| Actor | Permisos | Restricciones |
|---|---|---|
| Inspector | Crear, consultar y actualizar sus propias inspecciones | No puede consultar reportes de otros inspectores ni aprobar inspecciones |
| Supervisor | Consultar, actualizar y aprobar inspecciones de laboratorios asignados | No puede operar sobre reportes fuera de su alcance |
| Visitante | Acceder únicamente a la vista pública de la aplicación | No puede crear, consultar ni aprobar reportes protegidos |

### Actores adicionales del análisis

| Actor | Interacción | Riesgo asociado |
|---|---|---|
| Persona que encuentra la tableta | Puede intentar utilizar una sesión que permanezca abierta o consultar información local | Exposición de reportes y borradores offline |
| Cliente o navegador | Envía solicitudes, presenta información y mantiene almacenamiento local | Puede manipular datos, solicitudes y valores enviados a la API |
| Servidor | Comprueba la identidad, valida los datos y aplica los permisos | Una autorización incorrecta podría permitir operaciones no permitidas |

### Regla de autorización

La identidad se obtiene del contexto de sesión validado por el servidor. El rol, el propietario del reporte y el laboratorio asignado determinan si una operación puede realizarse.

El cliente no tiene autoridad para concederse permisos ni modificar su rol mediante los datos enviados en una solicitud.

**Nota de implementación:** el módulo actual permite al supervisor crear una inspección cuando el propietario coincide con su identidad. La comprobación del laboratorio asignado se aplica a las operaciones de consulta, actualización y aprobación. Esta diferencia se considera una limitación que debe revisarse en la integración.


### 3.3 ¿Qué podría pasar?

Se identifican las siguientes amenazas a partir del escenario de la tableta extraviada y de las superficies de interacción de la aplicación.

**Amenaza 01 — Exposición de reportes offline**

Una persona encuentra una tableta con una sesión todavía activa y consulta los borradores almacenados en el navegador antes de que el inspector pueda cerrar sesión.

Los registros locales y las operaciones pendientes contienen información de inspecciones que todavía pueden no haberse sincronizado.

**Consecuencia:** exposición de reportes, hallazgos, etiquetas de laboratorio e identidad sintética del inspector.

**Amenaza 02 — Acceso a reportes de otro inspector**

Un inspector modifica la solicitud enviada desde el navegador para consultar o actualizar un reporte cuyo propietario es otro usuario.

**Consecuencia:** lectura o alteración de información fuera de los permisos establecidos.

**Amenaza 03 — Uso de acciones no autorizadas**

Un inspector intenta aprobar una inspección o un visitante intenta crear o consultar reportes protegidos.

**Consecuencia:** ejecución de operaciones que no corresponden al rol de la persona.

**Amenaza 04 — Inyección de contenido en comentarios o resúmenes**

Una persona introduce contenido como `<b>Urgente</b>` o `<script>alert(1)</script>` en los campos de texto.

Si el contenido se interpreta como código o marcado ejecutable, podría alterar la interfaz o ejecutar instrucciones no deseadas.

**Consecuencia:** manipulación de la presentación, exposición de información y posible ejecución de contenido dentro de la sesión de otro usuario.

**Amenaza 05 — Alteración de valores desde el cliente**

Una persona modifica directamente la solicitud enviada al servidor para cambiar el nivel de riesgo, introducir hallazgos negativos o enviar valores fuera del contrato establecido.

**Consecuencia:** registros inconsistentes y decisiones incorrectas sobre el mantenimiento de los laboratorios.

**Amenaza 06 — Exposición de ubicación precisa**

La aplicación solicita la posición del dispositivo para identificar el laboratorio más cercano. Si las coordenadas se conservan o transmiten sin necesidad, podría recopilarse información de ubicación más precisa de la requerida.

**Consecuencia:** tratamiento desproporcionado de información de ubicación.

**Amenaza 07 — Denegación de permisos del dispositivo**

El usuario rechaza el acceso a la cámara o a la ubicación, o el navegador no dispone de esas capacidades.

**Consecuencia:** interrupción del registro si la aplicación depende obligatoriamente de esos permisos.

**Amenaza 08 — Exposición mediante rastreadores**

Un buscador intenta indexar páginas operativas o rutas internas de la aplicación.

**Consecuencia:** exposición accidental de rutas y mayor visibilidad de superficies que no están destinadas a consulta pública.

---

### 3.4 ¿Cómo lo reducimos?

Los controles se aplican en distintas capas. La interfaz facilita el uso, pero la validación de autoridad y los permisos se comprueban en el servidor.

| Amenaza | Control aplicado | Archivo relacionado |
|---|---|---|
| Exposición de reportes offline | Limpieza de almacenamiento local, eliminación de cachés privadas y cierre de sesión con revocación remota | `src/lib/security/session-cleanup.ts`, `src/components/security-session-panel.tsx` |
| Consulta de reportes ajenos | Comprobación del propietario y del laboratorio asignado | `src/lib/security/rbac.ts`, `src/app/api/secure-inspections/route.ts` |
| Acciones no autorizadas | RBAC de mínimo privilegio y denegación por defecto | `src/lib/security/rbac.ts` |
| Inyección de contenido | Escape de caracteres especiales, renderizado textual seguro en JSX y política CSP | `src/lib/security/validation.ts`, `src/lib/security/csp-policy.mjs` |
| Alteración de valores | Validación estricta de entradas en servidor y comprobación independiente de permisos | `src/lib/security/validation.ts`, `src/app/api/secure-inspections/route.ts` |
| Exposición de ubicación | Conversión de coordenadas a etiqueta de laboratorio y descarte de coordenadas antes de preparar el registro | `src/lib/security/validation.ts`, `src/lib/device/geolocation.ts` |
| Denegación de permisos | Fallback sintético de cámara y selección alternativa de laboratorio | `src/lib/device/camera.ts`, `src/lib/device/geolocation.ts` |
| Rastreo de rutas internas | Directivas de mínima exposición para rastreadores | `public/robots.txt` |

#### Validación y autoridad

La función `validateInspectionInput` comprueba que el nivel de riesgo sea un entero entre 1 y 5 y que el número de hallazgos sea un entero no negativo.

La función `prepareInspection` valida los datos y posteriormente comprueba la autorización mediante `authorizeAction`.

La identidad del inspector se obtiene del contexto de sesión del servidor y no se acepta como autoridad el valor enviado por el navegador.

#### Control de acceso

El módulo RBAC aplica los siguientes criterios:

- El inspector puede crear y consultar o actualizar sus propios reportes.
- El inspector no puede aprobar inspecciones.
- El supervisor puede consultar, actualizar y aprobar reportes dentro de sus laboratorios asignados.
- El visitante no puede ejecutar operaciones protegidas.

#### Protección del contenido

`sanitizeLiteralText` escapa los caracteres especiales que podrían interpretarse como marcado HTML.

React también escapa los valores dinámicos representados mediante JSX. La política CSP establece `default-src 'self'`, `object-src 'none'` y `base-uri 'self'`, además de limitar la ejecución de scripts mediante las directivas configuradas.

La política permite estilos en línea y una excepción de evaluación dinámica únicamente durante el desarrollo. Estas decisiones representan límites que deben considerarse en la evaluación del endurecimiento de la política.

#### Protección del almacenamiento

Durante el cierre de sesión se eliminan las claves que comienzan con `utt-` de `localStorage` y `sessionStorage`, así como las cachés administradas cuyo nombre comienza con `utt-lab-`.

El Service Worker evita almacenar o recuperar respuestas de las rutas privadas `/inspecciones` y `/api/`. Cuando no existe conexión, presenta una respuesta de contingencia sin mostrar reportes privados anteriores.

La revocación remota requiere conectividad. Si no puede completarse, la interfaz informa que la tableta no debe compartirse hasta terminar el cierre de sesión con conexión.

#### Minimización de ubicación

La función `minimizeLocationData` conserva únicamente la etiqueta del laboratorio. Las coordenadas no forman parte del objeto que se prepara para persistencia.

El flujo debe utilizar los valores sintéticos de prueba y no conservar posiciones reales del dispositivo.

#### Permisos del dispositivo

La cámara y la geolocalización cuentan con mecanismos alternativos. Cuando el usuario rechaza los permisos o la capacidad no está disponible, el registro puede continuar mediante evidencia sintética o selección manual del laboratorio.

#### Rastreo de rutas

El archivo `public/robots.txt` permite el rastreo de la raíz pública y excluye `/inspecciones` y `/api/`.

Esta configuración reduce la exposición accidental ante rastreadores respetuosos, pero no sustituye la autenticación ni la autorización del servidor.

---

### 3.5 ¿Cómo lo probamos?

Los controles deben comprobarse mediante pruebas negativas reproducibles con datos exclusivamente sintéticos.

La suite asignada a Pacheco es `tests/security.spec.ts`. Los siguientes escenarios establecen los resultados que deberán verificarse cuando la suite y los controles se encuentren integrados.

| ID | Preparación y acción | Resultado esperado | Control relacionado |
|---|---|---|---|
| PR-01 | Inspector A intenta consultar o actualizar un reporte de Inspector B | 403 Forbidden | `rbac.ts` y API de inspecciones |
| PR-02 | Inspector intenta aprobar una inspección | 403 Forbidden | `rbac.ts` |
| PR-03 | Visitante intenta crear o consultar un reporte protegido | Operación denegada, según el endpoint | `rbac.ts` y API de inspecciones |
| PR-04 | Supervisor consulta y aprueba un reporte dentro de su laboratorio asignado | 200 OK | `rbac.ts` |
| PR-05 | Enviar nivel de riesgo 99, 0, decimal o negativo, o hallazgos negativos | 400 Bad Request con mensaje claro | `validation.ts` |
| PR-06 | Enviar información válida desde un rol sin permisos | 403 Forbidden | `validation.ts` y `rbac.ts` |
| PR-07 | Introducir etiquetas HTML y contenido de script en los campos de texto | Contenido neutralizado como texto literal seguro | `sanitizeLiteralText` y CSP |
| PR-08 | Simular sesión activa, borradores y cachés; cerrar sesión y consultar sin conexión | Almacenamiento privado limpiado y ausencia de reportes anteriores en el fallback | `session-cleanup.ts`, `security-session-panel.tsx` y `sw.js` |
| PR-09 | Denegar permisos de cámara y ubicación | Fallback recuperable sin bloquear el registro | `camera.ts` y `geolocation.ts` |
| PR-10 | Verificar existencia y contenido de los artefactos obligatorios | Archivos existentes y no vacíos | Documentación y `robots.txt` |

**Criterio de aceptación:** cada prueba debe utilizar una entrada conocida, ejecutar el comportamiento real del control y comprobar un resultado observable. No se considera suficiente que una prueba solamente invoque una función sin verificar su resultado.

Los resultados deberán documentarse con el comando ejecutado y la salida real. No se declara ninguna prueba como aprobada hasta que se ejecute sobre el commit correspondiente.

---

## 4. Matriz de riesgos priorizada

La prioridad se establece mediante el impacto potencial y la probabilidad de ocurrencia. Se utilizan tres niveles: alto, medio y bajo.

| ID | Amenaza | Probabilidad | Impacto | Prioridad | Control | Prueba relacionada |
|---|---|---|---|---|---|---|
| R-01 | Tableta extraviada con sesión y borradores activos | Media | Alto | Crítica | Limpieza local, revocación y exclusión de cachés privadas | PR-08 |
| R-02 | Consulta o actualización de reportes ajenos | Media | Alto | Crítica | Comprobación de propietario y laboratorio | PR-01 |
| R-03 | Aprobación o creación fuera de los permisos del rol | Media | Alto | Crítica | RBAC de mínimo privilegio | PR-02, PR-03 y PR-04 |
| R-04 | Inyección de contenido en campos de texto | Media | Alto | Alta | Escape textual y CSP | PR-07 |
| R-05 | Alteración del nivel de riesgo o los hallazgos | Alta | Medio | Alta | Validación estricta en servidor | PR-05 y PR-06 |
| R-06 | Conservación innecesaria de coordenadas | Media | Medio | Media | Minimización a etiqueta de laboratorio | PR-09 |
| R-07 | Denegación de permisos de cámara o ubicación | Media | Bajo | Media | Fallback de cámara y selección manual de laboratorio | PR-09 |
| R-08 | Rastreo accidental de rutas operativas | Baja | Medio | Baja | Directivas `robots.txt` y controles de acceso del servidor | PR-10 |

**Criterio de priorización:** los riesgos con impacto alto reciben atención prioritaria porque pueden comprometer la confidencialidad de los reportes, la identidad de los usuarios o la integridad de las operaciones.

La probabilidad es una estimación cualitativa para el escenario académico, no una frecuencia medida en producción.

---

## 5. Riesgos residuales y limitaciones

Los controles reducen la exposición, pero no eliminan todos los riesgos.

1. **Dispositivo extraviado:** si la tableta permanece desbloqueada y con una sesión activa, los reportes locales pueden seguir disponibles hasta que se ejecute la limpieza. La revocación remota necesita conexión.

2. **Persistencia local:** los reportes del servidor se guardan en `.local/inspections.json` y se mantienen en memoria dentro de un único proceso Node.js. Esta implementación no está preparada para múltiples instancias ni constituye una base de datos institucional.

3. **Sesiones en memoria:** el estado de sesión y el control de intentos fallidos se mantienen en memoria. Un reinicio del proceso elimina ese estado.

4. **Cuentas de demostración:** las cuentas sintéticas predeterminadas son exclusivamente para prácticas locales. No deben utilizarse como acceso institucional ni desplegarse públicamente.

5. **Permisos del dispositivo:** la aplicación puede obtener una fotografía o coordenadas reales cuando se conceden los permisos. El ejercicio debe utilizar únicamente datos sintéticos y no conservar esa información real.

6. **Sanitización:** el helper de escape existe y cuenta con una comprobación unitaria, pero debe revisarse su utilización en cualquier nuevo punto donde se presente contenido proporcionado por el usuario.

7. **Política CSP:** se permiten estilos en línea y existe una excepción de ejecución dinámica en desarrollo. Estas decisiones reducen el nivel de restricción de determinadas directivas.

8. **Rastreo:** `robots.txt` comunica instrucciones a los rastreadores, pero no impide que una persona solicite directamente una ruta. La protección efectiva depende de los controles de acceso de la API.

9. **Almacenamiento adicional:** no se identificó uso de IndexedDB en el flujo revisado. Si posteriormente se incorpora, deberá añadirse una rutina de limpieza y una prueba específica.

10. **Alcance de evaluación:** los resultados de las pruebas deben volver a comprobarse en el commit integrado, debido a que los cambios del núcleo de seguridad, los artefactos documentales y la suite final pertenecen a ramas diferentes.

### Conclusión

El modelo de amenazas identifica los activos, actores, fronteras de confianza, amenazas, controles y pruebas necesarias para la PWA de inspecciones de laboratorio.

La decisión principal consiste en considerar el cliente como NO CONFIABLE y comprobar la identidad, validación y autorización en el servidor.

El escenario de la tableta extraviada demuestra que la protección no depende únicamente del cierre de sesión: también requiere controlar la persistencia offline, impedir la recuperación de información privada desde cachés y reconocer las limitaciones de la revocación cuando no existe conexión.
