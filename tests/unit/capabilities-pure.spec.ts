
import assert from "node:assert/strict";

import {
  matchLaboratoryFromCoordinates,
  SYNTHETIC_CAMPUS_LABS,
} from "../../src/lib/device/geolocation";

import {
  createSyntheticPhotoEvidence,
} from "../../src/lib/device/camera";

function testLaboratoryMapping(): void {
  assert.ok(
    SYNTHETIC_CAMPUS_LABS.length > 0,
    "Debe existir al menos un laboratorio sintético."
  );

  for (const laboratory of SYNTHETIC_CAMPUS_LABS) {
    const matched = matchLaboratoryFromCoordinates({
      latitude: laboratory.latitude,
      longitude: laboratory.longitude,
    });

    assert.equal(
      matched,
      laboratory.name,
      `Las coordenadas de ${laboratory.name} deben identificar ese laboratorio.`
    );
  }
}

function testLaboratoryMappingIsRepeatable(): void {
  const laboratory = SYNTHETIC_CAMPUS_LABS[0];

  const coordinates = {
    latitude: laboratory.latitude,
    longitude: laboratory.longitude,
  };

  const first = matchLaboratoryFromCoordinates(coordinates);
  const second = matchLaboratoryFromCoordinates(coordinates);

  assert.equal(
    first,
    second,
    "Las mismas coordenadas deben producir el mismo resultado."
  );
}

function extractSvg(evidence: object): string {
  const uri = Object.values(evidence).find(
    (value): value is string =>
      typeof value === "string" &&
      value.startsWith("data:image/svg+xml")
  );

  assert.ok(
    uri,
    "La evidencia debe contener una imagen SVG sintética."
  );

  const separator = uri.indexOf(",");
  assert.notEqual(separator, -1, "El URI debe contener el contenido de la imagen.");

  const metadata = uri.slice(0, separator);
  const payload = uri.slice(separator + 1);

  return metadata.includes(";base64")
    ? Buffer.from(payload, "base64").toString("utf8")
    : decodeURIComponent(payload);
}

function normalizeTimestamp(value: string): string {
  return value.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g,
    "<timestamp>"
  );
}

function testSyntheticPhotoEvidence(): void {
  const inspectionId = "insp-photo-unit-001";
  const label = "Evidencia sintética de laboratorio";

  const evidence = createSyntheticPhotoEvidence(inspectionId, label);

  assert.equal(
    evidence.width,
    320,
    "La imagen sintética debe tener un ancho de 320 píxeles."
  );

  assert.equal(
    evidence.height,
    240,
    "La imagen sintética debe tener una altura de 240 píxeles."
  );

  assert.equal(
    evidence.fallbackUsed,
    true,
    "La evidencia generada debe indicar que utiliza el modo sintético."
  );

  assert.equal(
    evidence.fallbackReason,
    "offline_fallback",
    "Debe identificar el motivo de generación alternativa."
  );

  assert.equal(
    Number.isNaN(Date.parse(evidence.timestamp)),
    false,
    "Debe incluir una fecha de generación interpretable."
  );

  const svg = extractSvg(evidence);

  assert.match(
    svg,
    /<svg\b/,
    "La imagen debe contener un documento SVG."
  );

  assert.ok(
    svg.includes(inspectionId),
    "La evidencia debe incluir el identificador solicitado."
  );

  assert.ok(
    svg.includes(label),
    "La evidencia debe incluir la etiqueta solicitada."
  );
}

function testSyntheticPhotoContentIsRepeatable(): void {
  const inspectionId = "insp-photo-repeat-001";
  const label = "Evidencia repetible";

  const first = createSyntheticPhotoEvidence(inspectionId, label);
  const second = createSyntheticPhotoEvidence(inspectionId, label);

  assert.equal(first.width, second.width);
  assert.equal(first.height, second.height);
  assert.equal(first.mimeType, second.mimeType);

  const firstSvg = extractSvg(first);
  const secondSvg = extractSvg(second);

  assert.equal(
    normalizeTimestamp(firstSvg),
    normalizeTimestamp(secondSvg),
    "El contenido de la imagen debe conservarse para las mismas entradas, excluyendo la fecha dinámica."
  );
}

function run(): void {
  testLaboratoryMapping();
  testLaboratoryMappingIsRepeatable();
  testSyntheticPhotoEvidence();
  testSyntheticPhotoContentIsRepeatable();

  console.log("capabilities-pure.spec.ts: PASS");
  console.log("Se validaron el mapeo de laboratorios y la evidencia sintética.");
}

run();
