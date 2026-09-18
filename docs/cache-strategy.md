# Estrategia de Almacenamiento en Caché y Resiliencia Offline

**Proyecto:** PWA de Inspecciones de Laboratorio  
**Institución:** Universidad Tecnológica de Tehuacán (UTT)  
**Módulo:** Service Worker Core & Estrategias de Caché  
**Versión de Especificación:** 1.0.0 (Semana 03)

---

## 1. Objetivo del Documento

Este documento describe formalmente la arquitectura de almacenamiento en caché y la lógica de ciclo de vida del Service Worker para la Progressive Web App (PWA) de inspección y mantenimiento de laboratorios universitarios.

El objetivo primario es dotar a la aplicación de **alta resiliencia operativa en entornos de conectividad intermitente o nula** (como sótanos técnicos, talleres o laboratorios blindados), garantizando la disponibilidad del App Shell, la integridad de las vistas de inspección y la entrega predecible de datos sintéticos ante fallos de enlace.

---

## 2. Arquitectura de Almacenamiento y Ciclo de Vida

La solución utiliza exclusivamente las interfaces nativas **Cache API** y **Fetch API** del estándar de Service Workers del W3C, evitando dependencias externas o abstracciones pesadas (como Workbox). Esto permite un control granular de cada fase del ciclo de vida:

```
[ Registro de SW ]
        │
        ▼
   [ install ] ──────> Pre-caching del App Shell, offline.html y datos sintéticos.
        │              Invocación obligatoria de self.skipWaiting()
        ▼
   [ activate ] ─────> Purgado determinista de depósitos obsoletos (versión previa).
        │              Invocación obligatoria de self.clients.claim()
        ▼
    [ fetch ] ───────> Orquestación de estrategias híbridas según tipo de recurso.
```

### 2.1 Depósitos de Caché Gestionados (Buckets)

Para evitar contaminación cruzada de recursos y permitir invalidaciones independientes, se definen tres almacenes versionados:

| Depósito | Identificador | Propósito Técnico |
|---|---|---|
| **Estático** | `utt-lab-static-v1.0.0` | Recursos críticos del App Shell (`/`, manifest, estilos, scripts, iconos, `offline.html`). |
| **Datos en Ejecución** | `utt-lab-data-v1.0.0` | Respuestas dinámicas obtenidas en tiempo de ejecución para consultas a `/api/` e inspecciones. |
| **Contingencia (Fallback)** | `utt-lab-fallback-v1.0.0` | Respuestas sintéticas preconstruidas para alimentar componentes cuando la red y la caché primaria fallan. |

---

## 3. Estrategias Implementadas por Tipo de Recurso

```
                       Petición HTTP entrante (fetch)
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
          [ Navegación ]      [ Datos / API ]    [ Assets Estáticos ]
         (Páginas HTML)      (Inspecciones)     (CSS, JS, Fonts, Img)
                 │                   │                   │
                 ▼                   ▼                   ▼
           Network-First       Network-First        Cache-First
                 │                   │                   │
                 ▼                   ▼                   ▼
          Fallback HTML       Fallback JSON         Fallback 504
          (offline.html)      (Sintético UTT)      (Seguro sin crash)
```

### 3.1 Datos de Inspección y API: *Network-First con Fallback Sintético*

- **Rutas interceptadas:** `/api/*` o peticiones que incluyan identificadores de inspección de laboratorio.
- **Mecanismo:**
  1. El Service Worker despacha la petición primero a la red física (`fetch(request)`).
  2. Si la respuesta es exitosa (HTTP 200), se guarda una copia en `utt-lab-data-v1.0.0` y se retorna al cliente.
  3. Si ocurre una excepción de red (falla de conectividad o DNS), se captura en el bloque `catch`.
  4. Se consulta si existe una respuesta previa en la caché de datos en ejecución.
  5. Si tampoco existe registro previo en caché, se genera y retorna una respuesta HTTP 200 sintética estructurada (`SYNTHETIC_OFFLINE_INSPECTIONS`), marcando la cabecera `X-PWA-Fallback: true`.
- **Justificación:** Los datos de mantenimiento e infraestructura requieren máxima exactitud y actualidad. Mostrar información obsoleta en campo podría provocar que un técnico duplique un reporte o pase por alto una condición de riesgo. Por ello, la red siempre tiene precedencia absoluta.

### 3.2 Recursos Estáticos (Assets): *Cache-First con Actualización de Red*

- **Rutas interceptadas:** Archivos con extensión `.css`, `.js`, `.mjs`, `.png`, `.jpg`, `.svg`, `.webmanifest`, fuentes tipográficas o destinos W3C (`style`, `script`, `image`, `font`).
- **Mecanismo:**
  1. Se verifica inmediatamente la presencia del recurso en `utt-lab-static-v1.0.0`.
  2. Si existe un acierto de caché (*cache hit*), se entrega instantáneamente sin consultar la red.
  3. Si no existe (*cache miss*), se solicita por red, se almacena en el depósito estático y se entrega al cliente.
  4. Si la red no está disponible y el recurso no estaba en caché, se devuelve un código 504 (*Gateway Timeout*) controlado que no derriba la ejecución global del navegador.
- **Justificación:** Los paquetes de código compilado, las fuentes y los logotipos de la universidad son invariables dentro de una misma versión de release. Servirlos desde memoria local optimiza radicalmente las métricas Core Web Vitals (FCP y LCP) y elimina latencia innecesaria.

### 3.3 Navegación (HTML de Páginas): *Network-First con Fallback a `offline.html`*

- **Rutas interceptadas:** Peticiones donde `request.mode === 'navigate'`.
- **Mecanismo:**
  1. Intento primario contra el servidor web para recibir la vista más reciente del App Shell.
  2. Ante cualquier fallo de red, se busca la ruta solicitada en la caché estática o la raíz `/`.
  3. Como última línea de defensa garantizada, se retorna el documento estático `/offline.html` pre-cacheado en la instalación.
  4. Si por alguna anomalía extrema tampoco estuviese disponible dicho archivo, el Service Worker genera una estructura HTML sintética en memoria, garantizando que el usuario jamás visualice la pantalla de error genérica del navegador ("Sin conexión / Dinosaurio").

---

## 4. Análisis de Trade-Offs (Decisiones Arquitectónicas)

### 4.1 ¿Por qué descartamos *Stale-While-Revalidate* (SWR) para los datos de inspección?

| Criterio | Stale-While-Revalidate | Network-First (Elegida) |
|---|---|---|
| **Velocidad de carga inicial** | Muy rápida (sirve de inmediato el dato viejo). | Depende de la latencia de red. |
| **Consistencia de datos** | Débil: el inspector ve datos desactualizados mientras se actualiza en segundo plano. | Fuerte: el inspector siempre ve el estado más reciente disponible. |
| **Riesgo de operación en campo** | Alto: un técnico podría registrar una anomalía ya solventada o ignorar una advertencia crítica reciente. | Nulo: si la red falla, el sistema explicita que opera en contingencia local. |
| **Complejidad de sincronización** | Requiere lógica reactiva en el cliente para redibujar el DOM cuando la petición en segundo plano concluye. | Predecible: flujo unificado mediante promesas nativas. |

*Conclusión de Ingeniería:* En aplicaciones de monitoreo físico de laboratorios, **la corrección y consistencia de los datos supera a la velocidad marginal de renderizado**. Por esta razón, se descartó SWR para los endpoints de negocio.

### 4.2 ¿Por qué se implementó `self.skipWaiting()` y `self.clients.claim()`?

- **`self.skipWaiting()`**: Evita que una nueva versión del Service Worker quede atrapada en estado de espera (*waiting*) cuando el usuario mantiene pestañas activas. Esto es crucial en entornos de evaluación y soporte técnico donde los despliegues de corrección deben surtir efecto inmediato.
- **`self.clients.claim()`**: Toma el control inmediato de todos los clientes dentro del alcance del SW desde el primer ciclo de activación, asegurando que las peticiones subsiguientes se intercepten sin necesidad de que el usuario cierre y vuelva a abrir la aplicación.

---

## 5. Límites, Supuestos y Fallos Prevenidos

1. **Inmutabilidad y Limpieza Atómica:**  
   Durante el evento `activate`, cualquier depósito que no pertenezca a `CURRENT_CACHES` es eliminado de forma atómica mediante `Promise.all()`. Esto evita la mezcla de assets compilados de versiones incompatibles (evita errores tipo *chunk load error*).

2. **Supuesto de Almacenamiento en el Dispositivo:**  
   Se asume una cuota disponible mínima de 10 MB para la Cache API del navegador del dispositivo. Dado que el App Shell y los datos sintéticos ocupan menos de 2 MB combinados, el riesgo de desalojo por cuota (*cache eviction*) es marginal.

3. **Prevención de Fallas en Navegadores con Soporte Parcial:**  
   El registro en el cliente debe estar condicionado a la existencia de `'serviceWorker' in navigator`. Si el cliente no soporta la tecnología, la aplicación continuará funcionando como una aplicación web tradicional dependiente de la red, sin arrojar excepciones bloqueantes.

4. **Tratamiento Exclusivo de Peticiones Idempotentes (`GET`):**  
   El Service Worker descarta activamente peticiones `POST`, `PUT` o `DELETE`. Las mutaciones de datos no deben ser cacheadas pasivamente; su tratamiento requiere colas de sincronización en segundo plano (Background Sync) para fases posteriores de la arquitectura.

5. **Protección de Datos e Información Sensible:**  
   En estricto apego a las políticas de seguridad institucional, el Service Worker no almacena claves privadas, credenciales de acceso ni identificadores de personas en ningún depósito de caché persistente.
