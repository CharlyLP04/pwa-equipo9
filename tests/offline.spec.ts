import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");

const sw = readFileSync(resolve(root, "public/sw.js"), "utf8");
const offline = readFileSync(resolve(root, "public/offline.html"), "utf8");

// Validar página de contingencia
assert.match(offline, /<!DOCTYPE html>/i);
assert.match(offline, /<main\b/i);
assert.match(offline, /Inspecciones de Laboratorio/i);
assert.match(offline, /Sin Conexion/i);
assert.match(offline, /Reintentar conexion/i);
assert.match(offline, /window\.location\.reload\(\)/);

// Validar contenido sintético y respaldo
assert.match(offline, /sintetico/i);
assert.match(sw, /SYNTHETIC_OFFLINE_INSPECTIONS/);
assert.match(sw, /synthetic-runtime-fallback/);

// Simular una falla de red para una navegación.
// Se evalúa el Service Worker con APIs simuladas.
const handlers = new Map<string, Function>();

const context = {
  self: {
    addEventListener(name: string, handler: Function) {
      handlers.set(name, handler);
    }
  },
  caches: {
    async match() {
      return undefined;
    }
  },
  fetch: async () => {
    throw new Error("Red desconectada");
  },
  Response,
  URL,
  Promise,
  console
};

vm.runInNewContext(sw, context);

const fetchHandler = handlers.get("fetch");
assert.ok(fetchHandler, "Debe registrarse el evento fetch");

let responsePromise: Promise<Response> | undefined;

const request = {
  url: "https://example.com/inspecciones",
  mode: "navigate",
  method: "GET",
  destination: "document"
};

fetchHandler({
  request,
  respondWith(promise: Promise<Response>) {
    responsePromise = promise;
  }
});

assert.ok(responsePromise, "El SW debe responder a la navegación");

async function verificarRespuestaOffline() {
  assert.ok(responsePromise, "El SW debe responder a la navegación");

  const response = await responsePromise;
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Modo Desconectado/);

  console.log("offline.spec.ts: PASS");
}

verificarRespuestaOffline().catch((error) => {
  console.error("offline.spec.ts: FAIL", error);
  process.exitCode = 1;
});