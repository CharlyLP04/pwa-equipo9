/**
 * Service Worker: Inspecciones de Laboratorio (PWA)
 * Universidad Tecnológica de Tehuacán (UTT)
 *
 * Propósito Académico y de Producción:
 * Gestionar el ciclo de vida (install, activate, fetch) y orquestar
 * estrategias de almacenamiento en caché para permitir la inspección de
 * laboratorios universitarios con conectividad intermitente o nula.
 *
 * Cumplimiento de Reglas:
 * 1. API Nativa pura (Cache API y Fetch API, sin librerías externas ni Workbox).
 * 2. Datos sintéticos exclusivos para contingencia offline.
 * 3. Tolerancia a fallos: Todas las rutas de red cuentan con bloque de captura (catch)
 *    y fallback de contingencia.
 * 4. Cero almacenamiento de credenciales o información confidencial.
 */

// Versión del Service Worker y nombres de depósitos de caché
const SW_VERSION = 'v1.0.0';
const STATIC_CACHE = `utt-lab-static-${SW_VERSION}`;
const DATA_CACHE = `utt-lab-data-${SW_VERSION}`;
const FALLBACK_CACHE = `utt-lab-fallback-${SW_VERSION}`;

// Conjunto de cachés administradas por esta versión
const CURRENT_CACHES = [STATIC_CACHE, DATA_CACHE, FALLBACK_CACHE];

/**
 * Recursos mínimos indispensables del App Shell para arranque offline.
 * Se descargan y almacenan durante la fase de instalación.
 */
const PRECACHE_RESOURCES = [
  '/',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

/**
 * Datos sintéticos de contingencia para llamadas al API de inspecciones.
 * Se entregan cuando la red y la caché en tiempo de ejecución no responden.
 */
const SYNTHETIC_OFFLINE_INSPECTIONS = [
  {
    id: 'synthetic-001',
    location: 'Laboratorio de Redes (Contingencia Offline)',
    date: '2026-08-28',
    inspector: 'Técnica A (Modo Sintético)',
    status: 'ok',
    statusLabel: 'Sin incidencias reportadas',
    findings: 0,
    summary: 'Datos sintéticos locales: comprobación rutinaria de nodos de telecomunicación.'
  },
  {
    id: 'synthetic-002',
    location: 'Laboratorio de Electrónica (Contingencia Offline)',
    date: '2026-08-27',
    inspector: 'Técnico B (Modo Sintético)',
    status: 'attention',
    statusLabel: 'Observación en sitio',
    findings: 1,
    summary: 'Datos sintéticos locales: calibración requerida en osciloscopios de mesa 3.'
  }
];

/* =========================================================================
   1. FASE DE INSTALACIÓN (INSTALL)
   ========================================================================= */
/**
 * Durante el evento 'install':
 * 1. Abrimos la caché estática y descargamos el App Shell crítico.
 * 2. Preparamos la respuesta sintética de fallback en la caché de contingencia.
 * 3. Invocamos self.skipWaiting() para que el nuevo SW pase directamente
 *    a la fase de activación sin esperar a que el usuario cierre todas las pestañas.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Pre-caching del App Shell y fallback estático
      const staticCache = await caches.open(STATIC_CACHE);
      try {
        await staticCache.addAll(PRECACHE_RESOURCES);
      } catch (error) {
        // En caso de que algún recurso secundario no esté listo, garantizamos al menos offline.html
        await staticCache.add('/offline.html').catch(() => null);
      }

      // Pre-almacenamiento de respuesta sintética para el API de inspecciones
      const fallbackCache = await caches.open(FALLBACK_CACHE);
      const syntheticResponse = new Response(
        JSON.stringify({
          source: 'synthetic-service-worker-fallback',
          offline: true,
          data: SYNTHETIC_OFFLINE_INSPECTIONS
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-PWA-Fallback': 'true'
          }
        }
      );
      await fallbackCache.put('/api/inspections/fallback', syntheticResponse);

      // Activación inmediata forzada (elimina tiempo en cola 'waiting')
      return self.skipWaiting();
    })()
  );
});

/* =========================================================================
   2. FASE DE ACTIVACIÓN (ACTIVATE)
   ========================================================================= */
/**
 * Durante el evento 'activate':
 * 1. Purgamos depósitos de caché pertenecientes a versiones obsoletas del SW.
 * 2. Invocamos self.clients.claim() para que este SW asuma el control inmediato
 *    de todas las pestañas y clientes abiertos en su ámbito (scope), sin requerir
 *    una recarga manual de la página por el usuario.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpieza atómica de cachés obsoletas
      const cacheNames = await caches.keys();
      const deletionPromises = cacheNames.map((name) => {
        if (!CURRENT_CACHES.includes(name)) {
          return caches.delete(name);
        }
        return Promise.resolve();
      });
      await Promise.all(deletionPromises);

      // Reclamo inmediato de todos los clientes abiertos en el ámbito
      return self.clients.claim();
    })()
  );
});

/* =========================================================================
   3. FASE DE INTERCEPCIÓN DE RED (FETCH)
   ========================================================================= */
/**
 * Orquestador de estrategias híbridas según el destino y tipo de recurso:
 * A. Peticiones de Navegación (HTML de páginas): Network-First con Fallback a App Shell / offline.html.
 * B. Datos del API de Inspecciones: Network-First con Fallback a datos en caché y respuesta sintética.
 * C. Recursos Estáticos (CSS, JS, imágenes, fuentes, iconos): Cache-First con actualización de red.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Excluir peticiones que no sean GET (mutaciones no deben pasar por la caché GET del SW)
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar extensiones del navegador y orígenes externos fuera del alcance
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // --- Estrategia A: Navegación de páginas HTML ---
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // --- Estrategia B: Peticiones de datos (API de inspecciones) ---
  if (url.pathname.startsWith('/api/') || url.pathname.includes('inspection')) {
    event.respondWith(handleDataRequest(request));
    return;
  }

  // --- Estrategia C: Recursos estáticos (App Shell, scripts, estilos, imágenes) ---
  if (isStaticAsset(request, url)) {
    event.respondWith(handleStaticAssetRequest(request));
    return;
  }

  // Estrategia por defecto para cualquier otro recurso: Network con Fallback a caché
  event.respondWith(handleDefaultRequest(request));
});

/**
 * Estrategia para Navegación:
 * Intenta obtener la página fresca desde la red para garantizar el contenido más reciente.
 * Si la red falla (desconectado o error HTTP severo), recurre a la versión almacenada en caché
 * o, como última contingencia, al archivo 'offline.html' pre-cacheados.
 */
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (networkError) {
    // Red no disponible: buscar en caché la ruta solicitada o la raíz
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const cachedRoot = await caches.match('/');
    if (cachedRoot) {
      return cachedRoot;
    }

    // Fallback garantizado de contingencia offline
    const fallbackOffline = await caches.match('/offline.html');
    if (fallbackOffline) {
      return fallbackOffline;
    }

    // Respuesta sintética inline si el archivo offline tampoco se encontró
    return new Response(
      '<!DOCTYPE html><html lang="es"><body><h1>Modo Desconectado</h1><p>Inspecciones de Laboratorio UTT temporalmente fuera de línea.</p></body></html>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

/**
 * Estrategia Network-First para Datos de Inspecciones:
 * Justificación técnica: Los registros de mantenimiento y condiciones de laboratorio
 * requieren frescura para evitar decisiones basadas en datos obsoletos.
 * Si la red falla, se sirve la última copia guardada en caché; si no existe,
 * se retorna la estructura de datos sintéticos definida para garantizar que la UI no colapse.
 */
async function handleDataRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const dataCache = await caches.open(DATA_CACHE);
      dataCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (networkError) {
    // Fallback nivel 1: Última respuesta válida en caché
    const cachedData = await caches.match(request);
    if (cachedData) {
      return cachedData;
    }

    // Fallback nivel 2: Datos sintéticos precacheados
    const fallbackCache = await caches.open(FALLBACK_CACHE);
    const syntheticStored = await fallbackCache.match('/api/inspections/fallback');
    if (syntheticStored) {
      return syntheticStored;
    }

    // Fallback nivel 3: Generación en memoria garantizada
    return new Response(
      JSON.stringify({
        source: 'synthetic-runtime-fallback',
        offline: true,
        data: SYNTHETIC_OFFLINE_INSPECTIONS
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-PWA-Fallback': 'runtime-synthetic'
        }
      }
    );
  }
}

/**
 * Estrategia Cache-First para Recursos Estáticos (Assets):
 * Justificación técnica: Fuentes, hojas de estilo, scripts compilados e iconos
 * raramente mutan dentro de una misma versión. Servirlos desde la caché maximiza la
 * velocidad de renderizado (FCP/LCP) y minimiza el consumo de ancho de banda.
 */
async function handleStaticAssetRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const staticCache = await caches.open(STATIC_CACHE);
      staticCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (networkError) {
    // Si falla la red y no está en caché, devolvemos error seguro sin romper el worker
    return new Response(null, { status: 504, statusText: 'Gateway Timeout (Offline)' });
  }
}

/**
 * Estrategia por defecto para recursos auxiliares (Network con fallback a Cache).
 */
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(null, { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Función auxiliar para clasificar si un recurso es un asset estático.
 */
function isStaticAsset(request, url) {
  const staticDestinations = ['style', 'script', 'image', 'font'];
  if (staticDestinations.includes(request.destination)) {
    return true;
  }

  const staticExtensions = [
    '.css',
    '.js',
    '.mjs',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.webmanifest'
  ];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}
