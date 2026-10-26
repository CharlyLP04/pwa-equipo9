
import assert from "node:assert/strict";

import {
  isLocalInspectionRecord,
  isPendingOperation,
  type LocalInspectionRecord,
  type PendingOperation,
} from "../../src/lib/storage/schema";

const validRecord: LocalInspectionRecord = {
  id: "insp-unit-001",
  location: "Laboratorio sintético de redes",
  date: "2026-10-01",
  inspector: "Técnico sintético",
  status: "ok",
  statusLabel: "Sin incidencias",
  findings: 0,
  summary: "Registro sintético para prueba unitaria.",
  version: 1,
  updatedAt: "2026-10-01T10:00:00.000Z",
};

const validOperation: PendingOperation = {
  id: "op-unit-001",
  type: "create",
  inspectionId: validRecord.id,
  payload: validRecord,
  createdAt: "2026-10-01T10:05:00.000Z",
  attempts: 0,
  status: "pending",
};

function testValidInspectionRecord(): void {
  assert.equal(
    isLocalInspectionRecord(validRecord),
    true,
    "Debe aceptar un registro válido."
  );
}

function testInvalidInspectionRecords(): void {
  const cases: Array<{ name: string; value: unknown }> = [
    { name: "valor nulo", value: null },
    { name: "texto en vez de objeto", value: "registro" },
    { name: "identificador vacío", value: { ...validRecord, id: "" } },
    { name: "identificador numérico", value: { ...validRecord, id: 42 } },
    { name: "ubicación vacía", value: { ...validRecord, location: "" } },
    { name: "responsable vacío", value: { ...validRecord, inspector: "" } },
    { name: "estado desconocido", value: { ...validRecord, status: "unknown" } },
    { name: "hallazgos negativos", value: { ...validRecord, findings: -1 } },
    { name: "hallazgos decimales", value: { ...validRecord, findings: 1.5 } },
    { name: "hallazgos como texto", value: { ...validRecord, findings: "2" } },
    { name: "versión negativa", value: { ...validRecord, version: -1 } },
    { name: "versión decimal", value: { ...validRecord, version: 1.5 } },
    { name: "fecha de actualización inválida", value: { ...validRecord, updatedAt: "fecha-invalida" } },
    { name: "etiqueta de estado ausente", value: { ...validRecord, statusLabel: null } },
    { name: "resumen con tipo incorrecto", value: { ...validRecord, summary: 123 } },
  ];

  for (const testCase of cases) {
    assert.equal(
      isLocalInspectionRecord(testCase.value),
      false,
      `Debe rechazar el caso: ${testCase.name}.`
    );
  }
}

function testValidPendingOperation(): void {
  assert.equal(
    isPendingOperation(validOperation),
    true,
    "Debe aceptar una operación pendiente válida."
  );
}

function testInvalidPendingOperations(): void {
  const cases: Array<{ name: string; value: unknown }> = [
    { name: "valor nulo", value: null },
    { name: "arreglo en vez de objeto", value: [] },
    { name: "identificador vacío", value: { ...validOperation, id: "" } },
    { name: "tipo desconocido", value: { ...validOperation, type: "delete" } },
    { name: "inspección asociada vacía", value: { ...validOperation, inspectionId: "" } },
    { name: "fecha de creación inválida", value: { ...validOperation, createdAt: "fecha-invalida" } },
    { name: "intentos negativos", value: { ...validOperation, attempts: -1 } },
    { name: "intentos decimales", value: { ...validOperation, attempts: 1.5 } },
    { name: "estado desconocido", value: { ...validOperation, status: "completed" } },
    { name: "contenido inválido", value: { ...validOperation, payload: null } },
    {
      name: "contenido con identificador vacío",
      value: {
        ...validOperation,
        payload: { ...validRecord, id: "" },
      },
    },
  ];

  for (const testCase of cases) {
    assert.equal(
      isPendingOperation(testCase.value),
      false,
      `Debe rechazar el caso: ${testCase.name}.`
    );
  }
}

function run(): void {
  testValidInspectionRecord();
  testInvalidInspectionRecords();
  testValidPendingOperation();
  testInvalidPendingOperations();

  console.log("schema.spec.ts: PASS");
  console.log("Se validaron registros y operaciones con casos positivos y negativos.");
}

run();
