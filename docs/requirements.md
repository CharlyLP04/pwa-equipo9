# Requisitos del producto — completar en Semana 1

> Conserva estos encabezados y reemplaza las instrucciones por tu análisis. No uses datos reales.

## 1. Problema y contexto

Describe qué problema de inspecciones de mantenimiento se quiere resolver, en qué contexto de conectividad y qué queda fuera del alcance.

## 2. Usuarios y escenarios

Identifica los usuarios principales y escribe al menos dos escenarios observables, incluyendo uno con conectividad intermitente.

## 3. Requisitos funcionales

Escribe requisitos numerados con formato verificable (por ejemplo, RF-01). Cada requisito debe incluir una condición de aceptación.

## 4. Requisitos no funcionales

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


