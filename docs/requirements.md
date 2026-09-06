# Requisitos del producto — completar en Semana 1

> Conserva estos encabezados y reemplaza las instrucciones por tu análisis. No uses datos reales.

## 1. Problema y contexto

Se requiere una aplicación web progresiva (PWA) para el registro, consulta y seguimiento de inspecciones de mantenimiento preventivo y correctivo en laboratorios de cómputo y talleres técnicos. 

*   **Contexto de conectividad:** Las inspecciones físicas suelen realizarse en áreas de laboratorios y sótanos donde la cobertura de red (WiFi o datos móviles) puede ser intermitente, inestable o inexistente durante los recorridos. La solución debe permitir consultar la información esencial y prepararse para la captura desconectada.
*   **Fuera del alcance (Semana 1):** Sincronización en tiempo real con bases de datos remotas multiusuario, autenticación federada institucional, generación de órdenes de compra/adquisición de repuestos y gestión de nóminas o personal.

## 2. Usuarios y escenarios

*   **Técnico / Inspector de Mantenimiento:** Responsable de realizar rondas de inspección física en las instalaciones, verificar el estado de los equipos y registrar hallazgos técnicos.
*   **Coordinador de Laboratorios y Soporte:** Responsable de supervisar el estado general de los laboratorios, priorizar incidencias y planificar mantenimientos.

### Escenarios observables
*   **Escenario 1 (Ronda en zona de conectividad intermitente):** El técnico realiza una inspección en el *Laboratorio de Redes*. Al entrar al área y perder señal de red, puede abrir la aplicación, visualizar el catálogo local precargado de inspecciones y revisar el histórico de observaciones sin interrupciones ni bloqueos de pantalla.
*   **Escenario 2 (Monitoreo de estado y hallazgos):** El coordinador accede a la aplicación desde su estación de trabajo para consultar el tablero de inspecciones, identificando de inmediato aquellas marcadas con estado *Requiere atención* y el número de hallazgos detectados para programar la intervención.

## 3. Requisitos funcionales

*   **RF-01 (Visualización de catálogo de inspecciones):** El sistema debe mostrar el listado de inspecciones con ID, ubicación simulada, fecha, inspector asignado, estado y resumen.
    *   *Condición de aceptación:* Renderizar en la vista principal las tarjetas/filas correspondientes a todas las inspecciones registradas en el catálogo local.
*   **RF-02 (Indicadores visuales de estado):** Cada inspección debe contar con un distintivo visual claro de su estado (`Sin incidencias` / `Requiere atención`).
    *   *Condición de aceptación:* El componente visual debe diferenciar cromática y textualmente el estado para facilitar su lectura rápida.
*   **RF-03 (Resumen y métricas de hallazgos):** La interfaz debe presentar el conteo numérico de hallazgos y una breve descripción sintética de las observaciones encontradas.
    *   *Condición de aceptación:* Se debe reflejar con precisión el número de observaciones asociadas a cada registro.
*   **RF-04 (Carga de datos desacoplada y tipada):** El modelo de datos debe estar fuertemente tipado en TypeScript y proveer registros sintéticos locales.
    *   *Condición de aceptación:* La aplicación compila sin errores de tipos y consume los datos locales definidos en `src/lib/data/inspections.ts`.

## 4. Requisitos no funcionales


*   **Reproducibilidad:** La aplicación debe poder ser clonada, instalada y ejecutada en cualquier entorno con Node.js (v20+ LTS) mediante el comando estándar `npm ci` y compilada con `npm run build` sin depender de configuraciones globales o rutas absolutas de la máquina local.
*   **Accesibilidad:** Cumplimiento con las pautas WCAG 2.1 nivel AA. Se garantizará una relación de contraste mínima de 4.5:1 en textos estándar, soporte completo de navegación por teclado (`Tab`, `Shift+Tab`, `Enter`) y uso de HTML semántico accesible evaluado mediante Lighthouse con puntaje $\ge 90$.
*   **Seguridad y Privacidad:** Protección estricta de secretos y privacidad. No se incluirán archivos `.env`, tokens, contraseñas ni claves API en el código fuente. Queda prohibida la captura y exposición de Información de Identificación Personal (PII).
*   **Rendimiento:** Tiempos de carga optimizados con First Contentful Paint (FCP) $\le 1.5$ s y Largest Contentful Paint (LCP) $\le 2.5$ s en simulaciones de red móvil estándar 3G/4G, optimizado a través del renderizado y división de código de Next.js.
*   **Offline futuro:** Arquitectura desacoplada y lista para PWA; la aplicación estructurará su capa visual para retener el shell de la aplicación (HTML, CSS y bundles JS) y responder adecuadamente ante la pérdida de conexión a través de Service Workers y estrategias de almacenamiento en caché.

## 5. Datos sintéticos y límites

*   **Datos ficticios a usar:** Únicamente se emplearán datos simulados e inventados con fines de desarrollo y prueba:
    *   Nombres ficticios de inspectores: `Técnica A`, `Técnico B`, `Técnica C`.
    *   Ubicaciones de prueba simuladas: `Laboratorio de Redes`, `Laboratorio de Electrónica`, `Laboratorio de Software`.
    *   Identificadores simulados: `inspection-001`, `inspection-002`, `inspection-003`.
    *   Fechas de prueba y descripciones de mantenimiento ficticias.
*   **Datos reales excluidos:** Queda estrictamente prohibido solicitar, capturar, almacenar o versionar en el repositorio registros reales de personas, nombres, matrículas o correos de estudiantes, docentes, personal técnico o administrativo de la UTT, así como inventarios reales de infraestructura, contraseñas o secretos institucionales.

## 6. Criterios de aceptación de la Semana 1

*   **Entrega actual:**
    *   El comando `npm run verify` debe ejecutarse con código de salida 0 (`PASS`) y generar el archivo de reporte `reports/verification.json` con `status: "pass"`.
    *   El comando `npm test` debe validar correctamente los artefactos base y la presencia de la estructura sintética requerida.
    *   El comando `npm run build` debe generar el build de producción de Next.js de manera exitosa y sin advertencias bloqueantes.
    *   Los archivos `docs/requirements.md` y `docs/decision-record.md` deben estar completamente diligenciados sin textos guía ni marcadores de posición.
=======
* **RNF-01 — Reproducibilidad:** El proyecto deberá poder instalar todas sus dependencias utilizando `npm ci` a partir del archivo `package-lock.json`, sin requerir modificaciones manuales.

  * **Cómo se comprobará:** Ejecutando `npm ci` desde una instalación limpia.
  * **Cuándo:** Antes de cada entrega semanal.
  * **Aceptación:** El comando finaliza correctamente y las dependencias se instalan sin errores que impidan ejecutar el proyecto.

* **RNF-02 — Accesibilidad:** La interfaz deberá permitir navegar por los elementos interactivos principales mediante teclado y deberá mantener una legibilidad adecuada entre texto y fondo.

  * **Cómo se comprobará:** Realizando navegación con la tecla `Tab` y utilizando las herramientas de accesibilidad de DevTools.
  * **Cuándo:** Durante las revisiones de interfaz y antes de cada entrega que incluya cambios visuales.
  * **Aceptación:** Los controles principales pueden recibir foco mediante teclado y no se detectan problemas críticos de contraste en la interfaz evaluada.

* **RNF-03 — Seguridad:** El repositorio no deberá contener contraseñas, tokens, claves API, credenciales ni archivos `.env` con información sensible.

  * **Cómo se comprobará:** Revisando los archivos versionados con Git y verificando que los archivos sensibles estén excluidos mediante `.gitignore`.
  * **Cuándo:** Antes de realizar el push de cada entrega.
  * **Aceptación:** No existen secretos ni credenciales reales dentro de los archivos versionados.

* **RNF-04 — Privacidad:** El sistema utilizará únicamente información ficticia durante su desarrollo y pruebas, evitando almacenar información personal identificable real.

  * **Cómo se comprobará:** Revisando los datos utilizados en formularios, pruebas, ejemplos y documentación.
  * **Cuándo:** Durante cada revisión de contenido y antes de la entrega.
  * **Aceptación:** Todos los datos utilizados son sintéticos y no permiten identificar a estudiantes, docentes, técnicos o personal real.

* **RNF-05 — Rendimiento:** La pantalla inicial deberá mostrarse en un tiempo máximo de 3 segundos en el entorno local de desarrollo, una vez iniciado correctamente el servidor.

  * **Cómo se comprobará:** Ejecutando `npm run dev`, abriendo `http://localhost:3000` y observando el tiempo de carga desde DevTools.
  * **Cuándo:** Durante la revisión técnica de cada entrega que modifique la interfaz o el flujo inicial.
  * **Aceptación:** La pantalla inicial se muestra en un máximo de 3 segundos y no presenta errores que impidan su uso.


* **RNF-06 — Operación offline futura:** En etapas posteriores, el flujo crítico de registro de inspecciones deberá tolerar pérdidas temporales de conectividad y permitir conservar información pendiente hasta recuperar la conexión.

  * **Cómo se comprobará:** En las semanas correspondientes se utilizará DevTools en modo `Offline` para simular la pérdida de red y verificar la persistencia y posterior sincronización.
  * **Cuándo:** Cuando se implemente la funcionalidad PWA y almacenamiento offline.
  * **Aceptación futura:** Un registro realizado sin conexión permanece disponible localmente y puede sincronizarse después de recuperar la conectividad.
  * **Nota:** Esta funcionalidad se documenta como requisito futuro y no se implementa durante la Semana 1.

## 5. Datos sintéticos y límites

Durante el desarrollo y las pruebas se utilizarán exclusivamente datos sintéticos.

Ejemplos de datos permitidos:

* Técnico: `Técnico Demo 01`.
* Laboratorio: `Laboratorio Alpha`.
* Identificador de inspección: `INS-001`.
* Hallazgo: `Cable de prueba fuera de canaleta`.
* Fecha: fechas ficticias utilizadas únicamente con fines de prueba.

Queda excluido el uso de:

* Nombres reales de estudiantes, docentes, técnicos o personal administrativo.
* Correos electrónicos personales o institucionales reales.
* Números telefónicos reales.
* Matrículas, números de empleado u otros identificadores personales reales.
* Contraseñas, tokens, claves API o credenciales.
* Información institucional confidencial.
* Cualquier otro dato personal identificable real (PII).

Esta restricción aplica tanto al código como a la documentación, pruebas, capturas y datos de ejemplo del proyecto.

## 6. Criterios de aceptación de la Semana 1

* **Instalación reproducible**

  * **Verificación:** `npm ci`
  * **Aceptación:** Las dependencias definidas en `package-lock.json` se instalan correctamente.

* **Ejecución local del starter**

  * **Verificación:** `npm run dev`
  * **Aceptación:** La aplicación inicia y puede abrirse en `http://localhost:3000`.

* **Documentación de requisitos**

  * **Verificación:** Revisión de `docs/requirements.md`.
  * **Aceptación:** El documento contiene problema, usuarios, escenarios, requisitos funcionales, requisitos no funcionales medibles, datos sintéticos y criterios de aceptación.

* **Decisión de estrategia tecnológica**

  * **Verificación:** Revisión de `docs/decision-record.md`.
  * **Aceptación:** El documento compara PWA, web tradicional, aplicación nativa y multiplataforma, y justifica la elección del enfoque PWA.

* **Evidencia individual**

  * **Verificación:** Revisión de `evidence/individual.md`.
  * **Aceptación:** Cada integrante identifica su contribución, decisión, prueba ejecutada, resultado, alcance de la prueba, limitación y uso de IA.

* **Verificación técnica final**

  * **Verificación:** `npm run verify`
  * **Aceptación:** El comando ejecuta las comprobaciones proporcionadas, compila correctamente el proyecto y genera `reports/verification.json`.



