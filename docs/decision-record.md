# ADR-001 — Estrategia de aplicación

> Completa esta decisión en Semana 1. Una decisión no es solo una preferencia: relaciona restricciones, alternativas, consecuencias y una forma de validación.

## Estado

Aceptada — 2026-09-06.

## Contexto y restricciones

El proyecto consiste en una herramienta para el registro, consulta y seguimiento de inspecciones de mantenimiento en laboratorios de cómputo y talleres técnicos. El análisis arquitectónico debe responder a las siguientes restricciones operativas y de proyecto:

*   **Conectividad intermitente:** "La operación no puede depender de una conexión perfecta". En entornos reales de inspección (sótanos, laboratorios blindados o zonas alejadas de los routers WiFi), la señal de red es inestable o nula. El técnico debe ser capaz de consultar datos previos y navegar por la interfaz sin caídas del sistema.
*   **Dispositivos heterogéneos y uso móvil:** Las inspecciones se realizan en movimiento mediante teléfonos móviles o tabletas de diversos fabricantes (Android, iOS) y se supervisan posteriormente desde computadoras de escritorio.
*   **Alcance temporal y agilidad:** El proyecto se desarrolla en un ciclo académico de 14 semanas, lo que exige optimizar la curva de aprendizaje, minimizar la fricción de configuración y maximizar la entrega de valor funcional.
*   **Reproducibilidad y despliegue:** La solución debe ser verificable en cualquier equipo mediante herramientas estándar (`npm ci`, `npm run build`), sin requerir SDKs pesados ni configuraciones propietarias de hardware.
*   **Seguridad y datos sintéticos:** No se utilizan datos reales ni PII, concentrando los esfuerzos en una arquitectura limpia y desacoplada.

## Alternativas consideradas

| Criterio | 1. Web Tradicional (SSR / SPA estándar) | 2. App Nativa (Android/iOS con Kotlin/Swift) | 3. Solución Multiplataforma (Flutter / React Native) | 4. Progressive Web App (PWA con Next.js) |
| :--- | :--- | :--- | :--- | :--- |
| **Soporte Offline** | Inexistente (pantalla de error al perder red) | Excelente (gestión local nativa) | Excelente (acceso a almacenamiento local) | Muy bueno (Service Workers y Cache API) |
| **Instalación y Distribución** | No instalable; solo vía URL | Mediante App Stores (Google Play / App Store) con procesos de revisión y costo | Mediante App Stores o compilación de binarios (APK/IPA) | Instalable directamente desde el navegador en un clic |
| **Costo y Tiempo de Desarrollo** | Bajo | Muy alto (dos bases de código distintas) | Medio-Alto (configuración de emuladores y SDKs) | Bajo-Medio (código base único en TypeScript/React) |
| **Reproducibilidad en Entorno Local** | Alta (`npm install`) | Baja (requiere Android Studio, Xcode, macOS) | Media-Baja (requiere toolchain nativo pesado) | Muy alta (ejecución directa con `npm ci` y navegador) |
| **Acceso a Hardware** | Limitado | Total y directo | Casi total a través de puentes | Suficiente para inspecciones (cámara, almacenamiento local) |
| **Riesgo en ciclo de 14 semanas** | Alto (no cumple requisito de resiliencia offline) | Crítico (riesgo de no finalizar por complejidad técnica) | Alto (fricción en configuración y compilación de binarios) | Mínimo (balance ideal entre capacidades y agilidad) |

## Decisión

Se decide implementar una **Progressive Web App (PWA) utilizando Next.js, React y TypeScript**.

### Justificación:
1. **Resiliencia ante desconexión:** Permite utilizar Service Workers para almacenar en caché el shell de la aplicación (HTML, CSS y bundles JS) y datos de inspecciones, garantizando operatividad cuando el técnico entra a zonas sin señal.
2. **Distribución sin fricciones:** Al no depender de tiendas de aplicaciones (App Stores), los usuarios y evaluadores pueden acceder e instalar la aplicación al instante desde cualquier navegador moderno.
3. **Eficiencia de desarrollo:** Mantiene una única base de código en TypeScript, facilitando el tipado estricto de los modelos de inspección y reutilizando componentes en escritorio y móvil.
4. **Reproducibilidad:** Cualquier evaluador o miembro del equipo puede clonar el repositorio y ejecutar el proyecto con comandos estándar sin necesidad de emuladores ni licencias de desarrollador.

### Qué no resuelve todavía:
En esta primera entrega (Semana 1) se establece la estructura base, el modelo de datos sintéticos y la arquitectura inicial de Next.js; la sincronización bidireccional en segundo plano (*Background Sync*) y la persistencia avanzada con IndexedDB se implementarán en las fases posteriores.

## Consecuencias y riesgos

*   **Consecuencias positivas:**
    *   Entrega rápida de interfaces accesibles y responsivas.
    *   Reducción drástica del tiempo de despliegue y pruebas continuas.
    *   Cumplimiento total con los estándares de la materia y facilidad de auditoría mediante CI/CD.
*   **Costos y riesgos técnicos:**
    *   *Gestión de caché:* Requiere diseñar cuidadosamente la estrategia del Service Worker (ej. *Stale-While-Revalidate*) para evitar servir datos obsoletos una vez que se restablezca la conexión.
    *   *Limitaciones en iOS Safari:* Ciertas APIs avanzadas de PWA tienen soporte más restringido en iOS en comparación con Chromium, lo que requiere pruebas cruzadas en distintos navegadores.
*   **Mitigaciones:**
    *   Uso de patrones estándar de almacenamiento en caché y diseño progresivo.
    *   Validación periódica con auditorías de Lighthouse y pruebas automatizadas.

## Validación

La validez de esta decisión se comprobará a lo largo del proyecto mediante:
*   Comprobación del pipeline con `npm run verify` y `npm test` en cada commit.
*   Pruebas en modo desconectado (*Offline mode*) en las herramientas de desarrollo del navegador comprobando la persistencia de la interfaz.
*   Métricas de rendimiento y PWA en auditorías de Lighthouse ($\ge 90$ en Accesibilidad y Buenas Prácticas).

