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

