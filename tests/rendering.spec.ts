import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const listPagePath = resolve(root, "src/app/inspecciones/page.tsx");
const detailPagePath = resolve(root, "src/app/inspecciones/[id]/page.tsx");
const loadingStatePath = resolve(root, "src/components/loading-state.tsx");

// 1. Las dos rutas obligatorias deben existir.
assert.ok(
  existsSync(listPagePath),
  "Debe existir la ruta SSR /inspecciones"
);

assert.ok(
  existsSync(detailPagePath),
  "Debe existir la ruta CSR /inspecciones/[id]"
);

const listPage = readFileSync(listPagePath, "utf8");
const detailPage = readFileSync(detailPagePath, "utf8");
const loadingState = readFileSync(loadingStatePath, "utf8");

// 2. El listado debe mantenerse como Server Component.
// No debe declarar "use client".
assert.doesNotMatch(
  listPage,
  /^\s*["']use client["'];?/m,
  "La ruta /inspecciones debe permanecer como Server Component"
);

// Debe generar enlaces hacia el detalle.
assert.match(
  listPage,
  /href=.*\/inspecciones\//,
  "El listado debe incluir enlaces hacia /inspecciones/[id]"
);

// 3. El detalle debe implementarse mediante CSR.
assert.match(
  detailPage,
  /^\s*["']use client["'];?/m,
  "La ruta de detalle debe ser un Client Component"
);

// 4. Debe existir un estado de carga accesible.
assert.match(
  loadingState,
  /aria-busy=["']true["']/,
  'LoadingState debe incluir aria-busy="true"'
);

assert.match(
  loadingState,
  /role=["']status["']/,
  'LoadingState debe incluir role="status"'
);

// 5. El detalle debe utilizar LoadingState.
assert.match(
  detailPage,
  /<LoadingState\b/,
  "La ruta de detalle debe utilizar LoadingState"
);

// 6. Un ID inválido debe producir un estado de error controlado.
assert.match(
  detailPage,
  /Inspección no encontrada/i,
  "Debe existir un mensaje para IDs inválidos"
);

assert.match(
  detailPage,
  /role=["']alert["']/,
  'El estado de error debe utilizar role="alert"'
);

console.log("rendering.spec.ts: PASS");