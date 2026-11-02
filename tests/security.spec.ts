import { captureWithFallback } from "../src/lib/device/camera";
import { getLocationWithFallback } from "../src/lib/device/geolocation";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import {
  authorizeAction,
  validateInspectionInput,
  prepareInspection,
  sanitizeLiteralText,
  logoutSession,
  buildContentSecurityPolicy,
} from "../src/lib/security";

async function main() {
  let checks = 0;

  const check = (name: string, test: () => void | Promise<void>) =>
    Promise.resolve()
      .then(test)
      .then(() => {
        checks++;
        console.log(`PASS: ${name}`);
      });

  const inspectorA = {
    userId: "inspector-a",
    role: "inspector" as const,
    assignedLaboratories: ["LAB-A"],
  };

  const inspectorB = {
    userId: "inspector-b",
    role: "inspector" as const,
    assignedLaboratories: ["LAB-B"],
  };

  const supervisor = {
    userId: "supervisor-a",
    role: "supervisor" as const,
    assignedLaboratories: ["LAB-A"],
  };

  const visitor = {
    userId: "visitor-a",
    role: "visitor" as const,
    assignedLaboratories: [],
  };

  const report = {
    ownerId: inspectorB.userId,
    laboratoryTag: "LAB-A",
  };

  // 01. Autorización y control de acceso

  await check("Inspector no consulta reportes ajenos", () => {
    assert.equal(authorizeAction(inspectorA, "view", report).status, 403);
  });

  await check("Inspector no modifica reportes ajenos", () => {
    assert.equal(authorizeAction(inspectorA, "update", report).status, 403);
  });

  await check("Inspector no aprueba inspecciones", () => {
    assert.equal(authorizeAction(inspectorA, "approve", report).status, 403);
  });

  await check("Visitante no crea ni consulta reportes", () => {
    assert.equal(authorizeAction(visitor, "create", report).status, 403);
    assert.equal(authorizeAction(visitor, "view", report).status, 403);
  });

  await check("Supervisor autorizado consulta y aprueba", () => {
    assert.equal(authorizeAction(supervisor, "view", report).status, 200);
    assert.equal(authorizeAction(supervisor, "approve", report).status, 200);
    assert.equal(
      authorizeAction(supervisor, "approve", {
        ...report,
        laboratoryTag: "LAB-B",
      }).status,
      403
    );
  });

  // 02. Validación de autoridad

  const validInput = {
    location: "LAB-A",
    inspector: "Inspector sintético",
    summary: "Revisión sintética de laboratorio",
    findings: 2,
    riskLevel: 3,
  };

  await check("Niveles inválidos generan 400", () => {
    for (const riskLevel of [99, 0, -1, 2.5]) {
      const result = validateInspectionInput({ ...validInput, riskLevel });
      assert.equal(result.status, 400);
      assert.ok("error" in result && result.error.length > 0);
    }
  });

  await check("Hallazgos negativos generan 400", () => {
    const result = validateInspectionInput({
      ...validInput,
      findings: -3,
    });
    assert.equal(result.status, 400);
  });

  await check("Dato válido no concede autorización", () => {
    assert.equal(validateInspectionInput(validInput).status, 200);
    assert.equal(prepareInspection(visitor, validInput).status, 403);
  });

  // 03. Limpieza de información offline

  await check("Cierre de sesión elimina datos privados", async () => {
    const local = new Map([
      ["utt-inspection-draft", "borrador sintético"],
      ["utt-session", "credencial-sintetica"],
      ["public-theme", "light"],
    ]);

    const session = new Map([
      ["utt-active-session", "sesion-sintetica"],
    ]);

    const caches = new Map([
      ["utt-lab-private-cache", "reporte sintético"],
      ["public-assets", "recurso público"],
    ]);

    const adapter = (data: Map<string, string>) => ({
      get length() {
        return data.size;
      },
      key(index: number) {
        return Array.from(data.keys())[index] ?? null;
      },
      removeItem(key: string) {
        data.delete(key);
      },
    });

    let queueCleared = false;

    await logoutSession({
      storage: adapter(local),
      sessionStorage: adapter(session),
      cacheStorage: {
        async keys() {
          return Array.from(caches.keys());
        },
        async delete(key: string) {
          return caches.delete(key);
        },
      },
      queue: {
        clear() {
          queueCleared = true;
        },
      },
    });

    assert.equal(local.has("utt-inspection-draft"), false);
    assert.equal(local.has("utt-session"), false);
    assert.equal(session.has("utt-active-session"), false);
    assert.equal(caches.has("utt-lab-private-cache"), false);
    assert.equal(queueCleared, true);

    assert.equal(local.has("public-theme"), true);
    assert.equal(caches.has("public-assets"), true);
  });

  // 04. Prevención de XSS

  await check("HTML se convierte en texto seguro", () => {
    const bold = sanitizeLiteralText("<b>Urgente</b>");
    const script = sanitizeLiteralText("<script>alert(1)</script>");

    assert.equal(bold, "&lt;b&gt;Urgente&lt;/b&gt;");
    assert.equal(script.includes("<script>"), false);
    assert.equal(script.includes("&lt;script&gt;"), true);
  });

  // 05. Política de seguridad de contenido

  await check("CSP contiene restricciones obligatorias", () => {
    const policy = buildContentSecurityPolicy();

    assert.ok(policy.includes("default-src 'self'"));
    assert.ok(policy.includes("object-src 'none'"));
    assert.ok(policy.includes("base-uri 'self'"));
  });

  // 06. Artefactos de documentación

  await check("Documentación de amenazas y privacidad", () => {
    for (const file of [
      "docs/threat-model.md",
      "docs/privacy-data-inventory.md",
      "public/robots.txt",
    ]) {
      assert.equal(existsSync(file), true, `Falta ${file}`);
      assert.ok(readFileSync(file, "utf8").trim().length > 0);
    }
  });


  // 07. Recuperación ante permisos denegados

  await check("Cámara denegada permite evidencia sintética", async () => {
    const result = await captureWithFallback({
      allowSyntheticFallback: true,
      syntheticInspectionId: "INSP-SINTETICA-09",
    });

    assert.equal(result.success, true);
    assert.equal(result.fallbackUsed, true);
    assert.ok(result.photoDataUri?.startsWith("data:image/"));
  });

  await check("Ubicación denegada permite seleccionar laboratorio", async () => {
    const result = await getLocationWithFallback("LAB-A", {
      allowManualFallback: true,
    });

    assert.equal(result.success, true);
    assert.equal(result.fallbackUsed, true);
    assert.ok(result.laboratoryTag.length > 0);
  });


  console.log(`security.spec.ts: PASS (${checks} verificaciones)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});