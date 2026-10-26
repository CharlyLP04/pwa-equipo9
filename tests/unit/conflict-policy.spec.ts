
import assert from "node:assert/strict";

import {
  resolveConflict,
} from "../../src/lib/sync/conflict-policy";

import type {
  LocalInspectionRecord,
} from "../../src/lib/storage/schema";

const localRecord: LocalInspectionRecord = {
  id: "insp-conflict-001",
  location: "Laboratorio sintético de redes",
  date: "2026-10-01",
  inspector: "Técnico sintético",
  status: "attention",
  statusLabel: "Requiere atención",
  findings: 2,
  summary: "Variante local sintética.",
  version: 1,
  updatedAt: "2026-10-01T10:00:00.000Z",
};

function testHigherVersionWins(): void {
  const local = {
    ...localRecord,
    version: 1,
    updatedAt: "2026-10-01T12:00:00.000Z",
  };

  const incoming = {
    ...localRecord,
    version: 2,
    updatedAt: "2026-10-01T09:00:00.000Z",
    summary: "Variante entrante sintética.",
  };

  const result = resolveConflict(local, incoming);

  assert.deepEqual(
    result.record,
    incoming,
    "Debe ganar el registro con la versión mayor."
  );

  assert.equal(
    result.reason,
    "higher-version",
    "Debe identificar la versión como causa de la resolución."
  );
}

function testNewerTimestampWinsWhenVersionsMatch(): void {
  const local = {
    ...localRecord,
    version: 3,
    updatedAt: "2026-10-01T12:00:00.000Z",
    summary: "Registro local más reciente.",
  };

  const incoming = {
    ...localRecord,
    version: 3,
    updatedAt: "2026-10-01T11:00:00.000Z",
    summary: "Registro entrante anterior.",
  };

  const result = resolveConflict(local, incoming);

  assert.deepEqual(
    result.record,
    local,
    "Con la misma versión debe ganar la fecha de actualización más reciente."
  );

  assert.equal(
    result.reason,
    "newer-updatedAt",
    "Debe identificar la fecha como causa de la resolución."
  );
}

function testDeterministicTieBreak(): void {
  const variantA = {
    ...localRecord,
    version: 4,
    updatedAt: "2026-10-01T13:00:00.000Z",
    summary: "Variante A.",
  };

  const variantB = {
    ...localRecord,
    version: 4,
    updatedAt: "2026-10-01T13:00:00.000Z",
    summary: "Variante B.",
  };

  const firstOrder = resolveConflict(variantA, variantB);
  const reverseOrder = resolveConflict(variantB, variantA);

  assert.deepEqual(
    firstOrder.record,
    reverseOrder.record,
    "El resultado debe ser el mismo aunque se invierta el orden de entrada."
  );

  assert.equal(
    firstOrder.reason,
    "deterministic-tie-break",
    "Cuando versión y fecha empatan debe aplicarse el desempate."
  );

  assert.equal(
    reverseOrder.reason,
    "deterministic-tie-break",
    "El motivo debe conservarse al invertir el orden."
  );
}

function testDifferentInspectionIdsAreRejected(): void {
  const otherRecord = {
    ...localRecord,
    id: "insp-conflict-002",
    version: 2,
  };

  assert.throws(
    () => resolveConflict(localRecord, otherRecord),
    /No se puede resolver un conflicto entre inspecciones diferentes/,
    "No debe resolver conflictos entre inspecciones distintas."
  );
}

function run(): void {
  testHigherVersionWins();
  testNewerTimestampWinsWhenVersionsMatch();
  testDeterministicTieBreak();
  testDifferentInspectionIdsAreRejected();

  console.log("conflict-policy.spec.ts: PASS");
  console.log("Se validaron versión, fecha, desempate e identificadores.");
}

run();
