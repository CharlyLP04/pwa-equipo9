import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sw = readFileSync(resolve(root, "public/sw.js"), "utf8");

// Ciclo de vida del Service Worker
for (const event of ["install", "activate", "fetch"]) {
  assert.match(
    sw,
    new RegExp(`self\\.addEventListener\\(['"]${event}['"]`),
    `Falta el evento ${event}`
  );
}

// Cachés requeridas
for (const cache of [
  "STATIC_CACHE",
  "DATA_CACHE",
  "FALLBACK_CACHE",
  "CURRENT_CACHES"
]) {
  assert.match(sw, new RegExp(`\\b${cache}\\b`), `Falta ${cache}`);
}

// Recursos esenciales para contingencia
assert.match(sw, /PRECACHE_RESOURCES/);
assert.match(sw, /\/offline\.html/);
assert.match(sw, /cache\.add|staticCache\.addAll/);

// Limpieza de cachés antiguas
assert.match(sw, /caches\.keys\(\)/);
assert.match(sw, /caches\.delete\(/);

// Estrategias de red y caché
assert.match(sw, /handleNavigationRequest/);
assert.match(sw, /handleDataRequest/);
assert.match(sw, /handleStaticAssetRequest/);

// Respaldo sintético
assert.match(sw, /SYNTHETIC_OFFLINE_INSPECTIONS/);
assert.match(sw, /synthetic-001/);
assert.match(sw, /synthetic-002/);

console.log("service-worker.spec.ts: PASS");