# PWA de Inspecciones de Laboratorio — Universidad Tecnológica de Tehuacán

Aplicación Web Progresiva para el registro y auditoría de mantenimiento preventivo en laboratorios de cómputo e informática de la Universidad Tecnológica de Tehuacán (UTT).

**Equipo 9:**
- Carlos Olaya Gutiérrez (3523110786)
- Alexis Montalvo Osorio (3523110113)
- Carlos Alberto Pacheco Avila (3523110057)

---

## 🚀 Semana 02: App Shell Instalable y Web App Manifest

En esta entrega se implementa la arquitectura base del **App Shell** desacoplado y el **Web App Manifest**, garantizando una experiencia instalable (`standalone`) y resiliente ante conectividad intermitente, evitando pantallas en blanco en cualquier circunstancia.

### 🏛️ Decisiones de Arquitectura

1. **App Shell Desacoplado (`src/components/app-shell.tsx`):**
   - **Header Superior Fijo:** Branding institucional de la UTT, título del laboratorio e indicador visual de estado PWA en tiempo real.
   - **Barra de Navegación Accesible (`<nav>`):** Accesibilidad por teclado (`:focus-visible`, landmarks semánticos, `aria-current="page"`). Diseño responsivo: barra inferior fija (bottom-nav) en dispositivos móviles (<860px) y barra lateral en escritorio.
   - **Contenedor Principal (`<main id="main-content" role="main">`):** Punto de inyección del contenido dinámico y los estados de resiliencia.

2. **Estados de Resiliencia (Tolerancia a Fallos):**
   - **Carga (`LoadingState`):** Skeleton loader animado con efecto *shimmer* que simula la lectura asíncrona de inspecciones sin saltos de maquetación (evita Cumulative Layout Shift - CLS).
   - **Vacío (`EmptyState`):** Mensaje accesible `"Sin inspecciones pendientes"` con ilustración contextual y botón de acción para restablecer o actualizar los datos.
   - **Error (`ErrorState`):** Manejo controlado de fallos de lectura en almacenamiento local o desconexión de red, proporcionando retroalimentación clara y un botón interactivo de **reintento**.

3. **Web App Manifest (`public/manifest.webmanifest`):**
   - Configurado con `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `theme_color: "#3156d3"` y `background_color: "#f4f7fb"`.
   - Incluye iconos PNG válidos en `public/icons/` en resoluciones 192x192 y 512x512 con propósito `any` y `maskable` (compatibles con Android Adaptive Icons y Chrome PWA install criteria).
   - Metadatos PWA y enlaces integrados en `src/app/layout.tsx` mediante Next.js Metadata & Viewport API.

---

## 🛠️ Requisitos de Entorno

- **Node.js:** v20.x LTS o superior (desarrollado y probado en Node v24).
- **npm:** 10.x o superior.
- **Git:** para clonación y control de versiones.

---

## 💻 Guía de Ejecución Local

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/CharlyLP04/pwa-equipo9.git
cd pwa-equipo9
npm ci
```

### 2. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador Chromium (Chrome, Edge o Brave).
Podrás interactuar con el interruptor de diagnóstico para comprobar en vivo el estado **Normal**, **Carga (Skeleton)**, **Vacío** y **Error**, así como simular conectividad offline.

### 3. Compilar para producción

```bash
npm run build
```

Valida la compilación limpia del proyecto con Next.js App Router y TypeScript sin errores.

### 4. Ejecutar la suite de pruebas automatizadas

```bash
npm test
```

Ejecuta:
- `tests/starter.spec.mjs`: Verificación de scripts del starter y datos sintéticos.
- `tests/manifest.spec.ts`: Validación exhaustiva del contrato de `manifest.webmanifest` (JSON válido, campos requeridos, iconos en disco, cabecera de contenido) y del DOM del App Shell (landmarks semánticos `<main>`, `<header>`, `<nav>` y componentes de resiliencia).

### 5. Verificación reproducible y checks públicos

```bash
# Verificación de artefactos requeridos (genera reports/verification.json)
npm run verify
# O alternativamente usando Make:
make verify

# Ejecución de checks públicos oficiales de la Semana 02:
bash public-tests/check.sh
```

---

## 📂 Estructura del Proyecto

```text
pwa-equipo9/
├── .github/workflows/
│   ├── week-01-starter-feedback.yml      # CI Semana 01
│   └── week-02-w02-shell-manifest.yml    # CI Oficial Semana 02
├── evidence/
│   └── individual.md                     # Evidencias individuales del equipo (S01 y S02)
├── public/
│   ├── manifest.webmanifest              # Web App Manifest W3C
│   └── icons/                            # Iconos PWA (192x192, 512x512, any y maskable)
│       ├── apple-touch-icon.png
│       ├── icon-192x192.png
│       ├── icon-192x192-maskable.png
│       ├── icon-512x512.png
│       └── icon-512x512-maskable.png
├── public-tests/
│   ├── README.md
│   └── check.sh                          # Script de verificación pública
├── scripts/
│   ├── generate-icons.mjs                # Generador programático de iconos PWA
│   └── verify.mjs                        # Verificador reproducible de artefactos
├── src/
│   ├── app/
│   │   ├── globals.css                   # Sistema de diseño, variables CSS, animaciones y responsive
│   │   ├── layout.tsx                    # Root Layout con viewport y metadata PWA
│   │   └── page.tsx                      # Vista de inspecciones con toolbar de diagnóstico
│   ├── components/
│   │   └── app-shell.tsx                 # App Shell (Header UTT, Nav accesible, Main, Loading, Empty, Error)
│   └── lib/data/
│       └── inspections.ts                # Datos sintéticos de mantenimiento de laboratorios
├── tests/
│   ├── manifest.spec.ts                  # Pruebas automatizadas de la Semana 02
│   ├── starter.spec.mjs                  # Pruebas base de la Semana 01
│   └── README.md                         # Contrato de pruebas
├── ASSIGNMENT.md                         # Rúbrica y especificación oficial Semana 02
├── evaluation.json                       # Contrato de evaluación automatizada AC-01 a AC-04
├── Makefile                              # Automatización de tareas estándar
├── package.json                          # Dependencias y scripts
└── tsconfig.json                         # Configuración de TypeScript
```

---

## 🔒 Política de Datos Sintéticos y Seguridad

- Todo registro mostrado (nombres de técnicos, laboratorios, fechas, fallas y observaciones) es estrictamente **sintético**.
- El proyecto no contiene llaves privadas, credenciales reales ni información sensible o PII.

---

## 🔮 Hoja de Ruta (Siguiente Entrega: Semana 03)

- Integración del **Service Worker** con Workbox / Serwist o vanilla Service Worker.
- Estrategias de caché (`CacheFirst` para assets estáticos y shell, `StaleWhileRevalidate` para inspecciones).
- Sincronización en segundo plano (*Background Sync*) y persistencia en IndexedDB.


## Semana 03 — Service Worker y QA Offline

### Ejecución y verificación

Instalar las dependencias:

```bash
npm ci
```

Ejecutar las pruebas automatizadas:

```bash
npm test
```

Generar la compilación de producción:

```bash
npm run build
```

Ejecutar la verificación del proyecto:

```bash
make verify
```

Si `make` no está disponible en Windows, utilizar el comando equivalente:

```bash
npm run verify
```

### Pruebas automatizadas

* `tests/service-worker.spec.ts`: verifica los eventos `install`, `activate` y `fetch`, las cachés, los recursos de precarga y las estrategias del Service Worker.
* `tests/offline.spec.ts`: valida la página de contingencia, los datos sintéticos y simula una navegación sin conexión ni recursos almacenados.

### Resultados de verificación

* `npm test`: PASS.
* `npm run build`: PASS.
* `npm run verify`: PASS.

### Limitaciones

Las pruebas incluyen validaciones estructurales y una simulación del Service Worker mediante APIs controladas. No sustituyen las pruebas manuales de instalación y funcionamiento offline en un navegador real.


## Semana 04 — Renderizado CSR y Server Component

### Implementación

Durante la Semana 04 se implementaron y compararon dos estrategias de renderizado para las rutas de inspecciones:

- `/inspecciones`: listado implementado como Server Component y prerenderizado por Next.js.
- `/inspecciones/[id]`: detalle implementado como Client Component (CSR) para permitir interacción y manejo de estado local.
- `LoadingState`: estado de carga accesible mediante `role="status"` y `aria-busy="true"`.
- Manejo controlado de identificadores de inspección inexistentes.
- Todos los datos utilizados son sintéticos.

### Instalación limpia

```bash
npm ci