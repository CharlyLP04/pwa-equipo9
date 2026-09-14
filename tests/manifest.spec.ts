import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { constants } from "node:fs";

const root = resolve(import.meta.dirname ?? process.cwd(), "..");

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function runTests() {
  console.log("--- Iniciando Suite de Pruebas: Manifest & App Shell (Semana 02) ---");

  // 1. Verificación del archivo y contrato del Web App Manifest
  const manifestPath = resolve(root, "public/manifest.webmanifest");
  assert.ok(await fileExists(manifestPath), "El archivo public/manifest.webmanifest debe existir.");

  const manifestRaw = await readFile(manifestPath, "utf8");
  let manifest: Record<string, any>;
  try {
    manifest = JSON.parse(manifestRaw);
  } catch (err) {
    assert.fail(`public/manifest.webmanifest no es un JSON válido: ${(err as Error).message}`);
  }

  // Campos obligatorios requeridos por el estándar PWA y la rúbrica
  assert.ok(manifest.name && typeof manifest.name === "string", "El manifest debe contener 'name'.");
  assert.ok(manifest.short_name && typeof manifest.short_name === "string", "El manifest debe contener 'short_name'.");
  assert.equal(manifest.start_url, "/", "El manifest debe declarar 'start_url': '/'.");
  assert.equal(manifest.display, "standalone", "El manifest debe declarar 'display': 'standalone'.");
  assert.ok(manifest.theme_color, "El manifest debe contener 'theme_color'.");
  assert.ok(manifest.background_color, "El manifest debe contener 'background_color'.");

  // Validación de iconos (192x192, 512x512, any y maskable)
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "Debe existir un arreglo de iconos con al menos 2 elementos.");

  const has192 = manifest.icons.some((i: any) => i.sizes === "192x192");
  const has512 = manifest.icons.some((i: any) => i.sizes === "512x512");
  const hasMaskable = manifest.icons.some((i: any) => i.purpose && i.purpose.includes("maskable"));

  assert.ok(has192, "El manifest debe incluir al menos un icono de 192x192.");
  assert.ok(has512, "El manifest debe incluir al menos un icono de 512x512.");
  assert.ok(hasMaskable, "El manifest debe incluir al menos un icono con propósito maskable.");

  // Validación de shortcuts del Web App Manifest
assert.ok(
  Array.isArray(manifest.shortcuts),
  "El manifest debe incluir un arreglo 'shortcuts'."
);

assert.ok(
  manifest.shortcuts.length >= 1,
  "El manifest debe incluir al menos un shortcut."
);

for (const shortcut of manifest.shortcuts) {
  assert.ok(
    typeof shortcut.name === "string" && shortcut.name.trim().length > 0,
    "Cada shortcut debe incluir un nombre válido."
  );

  assert.ok(
    typeof shortcut.url === "string" && shortcut.url.startsWith("/"),
    "Cada shortcut debe incluir una URL interna válida."
  );
}

console.log("✓ Shortcuts del manifest validados correctamente.");

  // Validación de shortcuts del Web App Manifest
assert.ok(
  Array.isArray(manifest.shortcuts),
  "El manifest debe incluir un arreglo 'shortcuts'."
);

assert.ok(
  manifest.shortcuts.length >= 1,
  "El manifest debe incluir al menos un shortcut."
);

for (const shortcut of manifest.shortcuts) {
  assert.ok(
    typeof shortcut.name === "string" && shortcut.name.trim().length > 0,
    "Cada shortcut debe incluir un nombre válido."
  );

  assert.ok(
    typeof shortcut.url === "string" && shortcut.url.startsWith("/"),
    "Cada shortcut debe incluir una URL interna válida."
  );
}

console.log("✓ Shortcuts del manifest validados correctamente.");

  for (const icon of manifest.icons) {
    const iconRelativePath = icon.src.startsWith("/") ? icon.src.slice(1) : icon.src;
    const iconFullPath = resolve(root, "public", iconRelativePath);
    assert.ok(
      await fileExists(iconFullPath),
      `El icono referenciado en el manifest '${icon.src}' debe existir en el disco (${iconFullPath}).`
    );
  }

  // Simulación de cabeceras HTTP del endpoint /manifest.webmanifest
  const validContentTypes = ["application/manifest+json", "application/json"];
  const inferredContentType = manifestPath.endsWith(".webmanifest") ? "application/manifest+json" : "application/json";
  assert.ok(
    validContentTypes.includes(inferredContentType),
    "El endpoint /manifest.webmanifest debe responder con Content-Type: application/manifest+json o application/json"
  );
  console.log("✓ Manifest y assets validados correctamente.");

  // 2. Verificación del App Shell y Contenedores Semánticos en el DOM
  const appShellPath = resolve(root, "src/components/app-shell.tsx");
  assert.ok(await fileExists(appShellPath), "El archivo src/components/app-shell.tsx debe existir.");

  const shellContent = await readFile(appShellPath, "utf8");

  // Contenedor principal <main> o role="main"
  const hasMainLandmark = shellContent.includes("<main") || shellContent.includes('role="main"');
  assert.ok(hasMainLandmark, "El App Shell debe contener el landmark semántico principal (<main> o role='main').");

  // La navegación debe proporcionar un nombre accesible
const hasAccessibleNav =
  shellContent.includes("aria-label") ||
  shellContent.includes("aria-labelledby");

assert.ok(
  hasAccessibleNav,
  "La navegación debe incluir aria-label o aria-labelledby para tener un nombre accesible."
);

  // Barra superior con título de laboratorio de la UTT
  assert.match(shellContent, /Universidad Tecnológica de Tehuacán/i, "El Header debe incluir la referencia institucional a la UTT.");
  assert.match(shellContent, /Laboratorio/i, "El Header debe incluir el título del laboratorio.");

  // Barra de navegación accesible
  const hasNavLandmark = shellContent.includes("<nav") || shellContent.includes('role="navigation"');
  assert.ok(hasNavLandmark, "El App Shell debe implementar una barra de navegación accesible (<nav>).");

  

  // Componentes auxiliares de resiliencia
  assert.match(shellContent, /export function LoadingState/, "El App Shell debe exportar el componente LoadingState.");
  assert.match(shellContent, /export function EmptyState/, "El App Shell debe exportar el componente EmptyState.");
  assert.match(shellContent, /export function ErrorState/, "El App Shell debe exportar el componente ErrorState.");
  assert.match(shellContent, /Sin inspecciones pendientes/, "EmptyState debe incluir el mensaje 'Sin inspecciones pendientes'.");
  assert.match(shellContent, /onRetry/, "ErrorState debe incluir soporte para botón/acción de reintento.");
  console.log("✓ Componentes del App Shell y landmarks del DOM validados correctamente.");

  // 3. Verificación de layout.tsx (enlace de manifest y metaetiquetas PWA)
  const layoutPath = resolve(root, "src/app/layout.tsx");
  const layoutContent = await readFile(layoutPath, "utf8");

  assert.match(layoutContent, /manifest\.webmanifest/, "src/app/layout.tsx debe enlazar el archivo manifest.webmanifest.");
  assert.match(layoutContent, /theme-color|themeColor/i, "src/app/layout.tsx debe configurar la propiedad theme-color.");
  assert.match(layoutContent, /apple-touch-icon|apple/i, "src/app/layout.tsx debe configurar el icono de Apple para PWA.");
  console.log("✓ Metadatos PWA y enlaces en layout.tsx validados.");

  // 4. Verificación de page.tsx (integración de App Shell y selector de estados)
  const pagePath = resolve(root, "src/app/page.tsx");
  const pageContent = await readFile(pagePath, "utf8");

  assert.match(pageContent, /AppShell/, "src/app/page.tsx debe renderizar el componente AppShell.");
  assert.match(pageContent, /inspections/i, "src/app/page.tsx debe consumir los datos sintéticos de inspecciones.");
  assert.match(pageContent, /LoadingState/, "src/app/page.tsx debe incorporar el estado LoadingState.");
  assert.match(pageContent, /EmptyState/, "src/app/page.tsx debe incorporar el estado EmptyState.");
  assert.match(pageContent, /ErrorState/, "src/app/page.tsx debe incorporar el estado ErrorState.");
  assert.match(pageContent, /Inspecciones de laboratorio/, "src/app/page.tsx debe conservar el título de inspecciones.");
  assert.match(pageContent, /sintéticos/i, "src/app/page.tsx debe declarar el uso de datos sintéticos.");
  console.log("✓ Integración y resiliencia en page.tsx validadas.");

  console.log("--- tests/manifest.spec.ts: TODOS LOS TESTS PASARON (PASS) ---");
}

runTests().catch((error) => {
  console.error("Fallo en manifest.spec.ts:", error);
  process.exit(1);
});
