# Registro de Decisión Arquitectónica (ADR-002): Estrategias de Renderizado CSR vs SSR

**Proyecto:** PWA Inspecciones de Mantenimiento de Laboratorios  
**Institución:** Universidad Tecnológica de Tehuacán (UTT)  
**Actividad:** Semana 04 — Renderizado CSR/SSR con Estados Verificables  
**Estado:** Aceptado  
**Fecha:** 2026-09-26  

---

## 1. Contexto y Problema de Ingeniería

La aplicación progresiva de la Universidad Tecnológica de Tehuacán (UTT) gestiona el relevamiento y diagnóstico técnico de infraestructura en laboratorios especializados (Redes, Electrónica, Software, Cómputo). Los técnicos de mantenimiento operan frecuentemente en ubicaciones con enlace inalámbrico deficiente o nulo (sótanos de servidores, talleres blindados).

El dilema de ingeniería consiste en determinar **dónde y cómo ejecutar el renderizado** de las interfaces principales:
1. **Ruta de Listado General:** `/inspecciones`
2. **Ruta de Detalle Específico:** `/inspecciones/[id]`

Una arquitectura monolítica de solo cliente (CSR puro) retrasa la primera pintura con contenido (FCP) debido a la descarga obligada de scripts antes de ver datos. Por otro lado, una arquitectura exclusiva de servidor (SSR puro) añade latencia en cada interacción de campo y falla por completo si no hay conectividad viva con el servidor Next.js.

---

## 2. Decisión Arquitectónica: Modelo Híbrido Asignado por Dominio

Se adopta una arquitectura de renderizado complementaria basada en los patrones nativos de Next.js App Router:

```
                              PWA Inspecciones (UTT)
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
    Ruta /inspecciones                                    Ruta /inspecciones/[id]
   [ Server Component ]                                   [ Client Component ]
          (SSR)                                                  (CSR)
             │                                                     │
   • Pre-renderizado en servidor                         • Renderizado reactivo en navegador
   • HTML listo sin cascada de fetch                     • Estado local de checklist interactivo
   • FCP inmediato y bajo JS                             • Manejo resiliente de carga y error 404
   • Ideal para consulta de catálogo                     • Integración con Cache API en offline
```

### 2.1 Especificación de Rutas

| Ruta | Paradigma | Componente | Razón Principal |
|---|---|---|---|
| `/inspecciones` | **SSR** (*Server-Side Rendering*) | Server Component | Generación inmediata de la tabla/tarjetas de laboratorios en el servidor, eliminando latencia de hidratación inicial y reduciendo el paquete JS en cliente. |
| `/inspecciones/[id]` | **CSR** (*Client-Side Rendering*) | Client Component (`"use client"`) | Interactividad local en el laboratorio: checklist dinámico de verificación, alternancia de estados de auditoría y captura de incidencias en memoria. |

---

## 3. Matriz Comparativa de Rendimiento y Métricas

A continuación se contrastan ambos paradigmas para los flujos de inspección técnica:

| Métrica / Dimensión | Server-Side Rendering (SSR) | Client-Side Rendering (CSR) | Impacto en la PWA de Laboratorios |
|---|---|---|---|
| **TTFB (Time to First Byte)** | Mayor (espera procesamiento del servidor). | Menor (sirve HTML estático base casi de inmediato). | SSR consume unos milisegundos más en servidor pero entrega el documento con datos inyectados. |
| **FCP (First Contentful Paint)** | Ultrarrápido (el navegador dibuja datos en el primer frame). | Más lento (requiere descargar, parsear JS y ejecutar consulta). | El listado SSR muestra los laboratorios de inmediato al abrir la vista. |
| **TTI (Time to Interactive)** | Depende de la hidratación del bundle. | Coincide con la resolución del ciclo de vida del cliente. | El detalle CSR habilita botones interactivos en cuanto el componente monta. |
| **Peso del Bundle JS en Cliente** | Cero código de servidor viaja al cliente. | Incluye la lógica de estado (`useState`, `useEffect`). | Se mantiene un tamaño de paquete óptimo (<95 kB compartido). |
| **Comportamiento Desconectado** | Requiere contingencia de Service Worker / caché. | Opera localmente con datos precacheados o en memoria. | La ruta CSR de detalle tolera intermitencias sin desconectar la vista. |

---

## 4. Gestión de Estados de Transición y Resiliencia

Ambas rutas implementan de manera obligatoria los estados canónicos de UX accesible:

### 4.1 Estado de Carga (Loading / Skeleton State)
- Implementado en `src/components/loading-state.tsx`.
- Utiliza marcas de accesibilidad WAI-ARIA:
  - `role="status"`
  - `aria-busy="true"`
  - `aria-live="polite"`
- Proporciona siluetas reflectivas (*shimmer*) que anticipan la estructura del detalle sin causar saltos de diseño acumulados (CLS ≈ 0).

### 4.2 Estado de Error y Recuperación ante IDs Inexistentes
- Si el técnico accede a un identificador que no existe en la base sintética (ejemplo: `/inspecciones/inspection-999`):
  - La ruta CSR captura el caso nulo sin arrojar excepciones no controladas en consola.
  - Presenta un contenedor semántico con `role="alert"`.
  - Ofrece navegación explícita de retorno (`Volver al Listado` o `Ir a Inicio`).

---

## 5. Interacción con el Service Worker (Semana 03)

El modelo de renderizado interactúa de forma predecible con el Service Worker previamente desplegado (`public/sw.js`):

1. **Recursos Estáticos del Cliente (CSR):**
   - El código compilado de la ruta dinámica `/inspecciones/[id]` es interceptado por la estrategia **Cache-First**, cargando instantáneamente desde el depósito `utt-lab-static-v1.0.0`.
2. **Navegación sin Conexión:**
   - Si se intenta solicitar la ruta SSR `/inspecciones` sin señal de red y no está en caché HTTP, el Service Worker ejecuta la estrategia de navegación con fallback hacia `/offline.html`, garantizando que la PWA nunca muestre la pantalla de error genérica del sistema operativo.
3. **Persistencia de Datos Sintéticos:**
   - La respuesta ante fallos de red entrega los registros sintéticos preconfigurados, preservando la continuidad de la auditoría en campo.

---

## 6. Supuestos, Límites y Trabajo Futuro

- **Supuesto de Datos Sintéticos:** Toda la información proviene de estructuras sintéticas controladas en `src/lib/data/inspections.ts`. No se consume información confidencial ni bases de datos de producción.
- **Límite Actual:** Las mutaciones realizadas en la vista CSR de detalle (ejemplo: marcar un punto de control del checklist o alternar estado) se conservan temporalmente en el estado del componente React. En la siguiente iteración se conectarán a persistencia transaccional indexada (IndexedDB) para sincronización en segundo plano (*Background Sync*).
- **Control de Hidratación:** Se previene el error común de *hydration mismatch* evitando el renderizado condicional dependiente de APIs no disponibles en servidor (como `window` o `navigator`) antes del montaje (`useEffect`).
