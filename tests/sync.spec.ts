import assert from "node:assert/strict";

import {
  isLocalInspectionRecord,
  isPendingOperation,
  type LocalInspectionRecord,
} from "../src/lib/storage/schema";

import {
  SyncQueue,
  createMemoryStorage,
} from "../src/lib/sync/queue";

import {
  resolveConflict,
} from "../src/lib/sync/conflict-policy";

// ============================================================
// Datos sintéticos utilizados exclusivamente para las pruebas.
// ============================================================

const inspection: LocalInspectionRecord = {
  id: "insp-001",
  location: "Laboratorio de Redes",
  date: "2026-10-04",
  inspector: "Técnico de prueba",
  status: "attention",
  statusLabel: "Requiere atención",
  findings: 2,
  summary: "Hallazgos sintéticos para pruebas.",
  version: 1,
  updatedAt: "2026-10-04T10:00:00.000Z",
};

// ============================================================
// 1. Validación del esquema local
// ============================================================

assert.equal(
  isLocalInspectionRecord(inspection),
  true,
  "El esquema debe aceptar una inspección sintética válida"
);

assert.equal(
  isLocalInspectionRecord({
    ...inspection,
    id: "",
  }),
  false,
  "El esquema debe rechazar una inspección sin ID"
);

const pendingOperation = {
  id: "pending-001",
  type: "update",
  inspectionId: inspection.id,
  payload: inspection,
  createdAt: "2026-10-04T10:05:00.000Z",
  attempts: 0,
  status: "pending",
};

assert.equal(
  isPendingOperation(pendingOperation),
  true,
  "El esquema debe aceptar una operación pendiente válida"
);

// ============================================================
// 2. Cola offline
// ============================================================

let currentTime = Date.parse("2026-10-04T11:00:00.000Z");

const queue = new SyncQueue({
  storage: createMemoryStorage(),
  now: () => currentTime,
  idFactory: () => "operation-generated",
  baseBackoffMs: 1000,
  maxAttempts: 3,
});

const operation = queue.enqueue({
  operationId: "operation-001",
  entityId: inspection.id,
  type: "UPDATE_INSPECTION",
  payload: inspection,
  revision: 1,
});

assert.equal(
  queue.size(),
  1,
  "La operación offline debe agregarse a la cola"
);

assert.equal(
  operation.status,
  "pending",
  "Una operación nueva debe iniciar como pending"
);

// ============================================================
// 3. Idempotencia: mismo operationId no debe duplicarse
// ============================================================

const duplicateOperation = queue.enqueue({
  operationId: "operation-001",
  entityId: inspection.id,
  type: "UPDATE_INSPECTION",
  payload: inspection,
  revision: 1,
});

assert.equal(
  queue.size(),
  1,
  "El mismo operationId no debe crear una segunda operación"
);

assert.equal(
  duplicateOperation.operationId,
  operation.operationId,
  "Debe conservarse la misma operación lógica"
);

// ============================================================
// 4. Fallo y reintento
// ============================================================
async function runAsyncTests() {

let failedSendAttempts = 0;

await queue.process(async () => {
  failedSendAttempts += 1;
  throw new Error("Fallo sintético de red");
});

assert.equal(
  failedSendAttempts,
  1,
  "La cola debe intentar enviar la operación"
);

assert.equal(
  queue.find("operation-001")?.status,
  "pending",
  "Después de un fallo recuperable debe volver a pending"
);

assert.equal(
  queue.find("operation-001")?.attempts,
  1,
  "Debe registrar el intento fallido"
);

// El backoff configurado es de 1000 ms.
// Avanzamos el reloj sintético para permitir el siguiente intento.
currentTime += 1000;

let successfulSendAttempts = 0;

await queue.process(async (sentOperation) => {
  successfulSendAttempts += 1;

  return {
    operationId: sentOperation.operationId,
    serverId: "server-001",
    revision: sentOperation.revision,
  };
});

assert.equal(
  successfulSendAttempts,
  1,
  "La operación debe poder reintentarse después del fallo"
);

assert.equal(
  queue.find("operation-001")?.status,
  "done",
  "Después de un ACK válido debe quedar en done"
);

// Una operación done no debe enviarse nuevamente.
await queue.process(async (sentOperation) => {
  successfulSendAttempts += 1;

  return {
    operationId: sentOperation.operationId,
    serverId: "server-001",
    revision: sentOperation.revision,
  };
});

assert.equal(
  successfulSendAttempts,
  1,
  "Una operación completada no debe enviarse dos veces"
);

// ============================================================
// 5. Política determinista de conflictos
// ============================================================

const localRecord: LocalInspectionRecord = {
  ...inspection,
  version: 1,
  updatedAt: "2026-10-04T10:00:00.000Z",
  summary: "Versión local",
};

const remoteRecord: LocalInspectionRecord = {
  ...inspection,
  version: 2,
  updatedAt: "2026-10-04T10:05:00.000Z",
  summary: "Versión remota",
};

const resolution1 = resolveConflict(localRecord, remoteRecord);
const resolution2 = resolveConflict(localRecord, remoteRecord);

assert.deepEqual(
  resolution1,
  resolution2,
  "El mismo conflicto debe producir siempre el mismo resultado"
);

assert.equal(
  resolution1.record.version,
  2,
  "La versión mayor debe ganar el conflicto"
);

assert.equal(
  resolution1.reason,
  "higher-version",
  "Debe indicar que ganó por tener una versión mayor"
);

// Si la versión es igual, debe ganar updatedAt más reciente.
const newerLocalRecord: LocalInspectionRecord = {
  ...inspection,
  version: 3,
  updatedAt: "2026-10-04T12:00:00.000Z",
  summary: "Registro local más reciente",
};

const olderRemoteRecord: LocalInspectionRecord = {
  ...inspection,
  version: 3,
  updatedAt: "2026-10-04T11:00:00.000Z",
  summary: "Registro remoto anterior",
};

const dateResolution = resolveConflict(
  newerLocalRecord,
  olderRemoteRecord
);

assert.equal(
  dateResolution.record.summary,
  "Registro local más reciente",
  "Con la misma versión debe ganar el updatedAt más reciente"
);

assert.equal(
  dateResolution.reason,
  "newer-updatedAt",
  "Debe indicar que el conflicto se resolvió mediante updatedAt"
);

// Si versión y updatedAt empatan, aplica desempate determinista (deterministic-tie-break)
const tieRecordA: LocalInspectionRecord = {
  ...inspection,
  version: 4,
  updatedAt: "2026-10-04T12:00:00.000Z",
  summary: "Variante A",
};

const tieRecordB: LocalInspectionRecord = {
  ...inspection,
  version: 4,
  updatedAt: "2026-10-04T12:00:00.000Z",
  summary: "Variante B",
};

const tieResolution = resolveConflict(tieRecordA, tieRecordB);
assert.equal(
  tieResolution.reason,
  "deterministic-tie-break",
  "En empate de versión y fecha debe aplicar desempate determinista"
);

// ============================================================
// 6. Servidor idempotente, rechazo fuera de orden y resume tras cierre
// ============================================================

const sharedStorage = createMemoryStorage();
const idempotentQueue = new SyncQueue({
  storage: sharedStorage,
  now: () => currentTime,
  baseBackoffMs: 1000,
  maxAttempts: 2,
});

const opResume = idempotentQueue.enqueue({
  operationId: "operation-resume-001",
  entityId: "insp-002",
  type: "CREATE_INSPECTION",
  payload: { ...inspection, id: "insp-002" },
  revision: 2,
});

// Simulamos que la pestaña se cierra mientras la operación está inFlight
idempotentQueue.markInFlight(opResume.operationId);
assert.equal(
  idempotentQueue.find(opResume.operationId)?.status,
  "inFlight",
  "La operación debe estar en inFlight antes del cierre simulado"
);

// Al reabrir la aplicación con el mismo almacenamiento, inFlight vuelve a pending
const reloadedQueue = new SyncQueue({
  storage: sharedStorage,
  now: () => currentTime,
  baseBackoffMs: 1000,
  maxAttempts: 2,
});

assert.equal(
  reloadedQueue.find(opResume.operationId)?.status,
  "pending",
  "Al reanudar la cola tras cierre de pestaña, inFlight debe volver a pending"
);

// Rechazo de ACK fuera de orden (revisión menor a la de la operación)
const staleAckAccepted = reloadedQueue.acknowledge({
  operationId: opResume.operationId,
  serverId: "srv-stale",
  revision: 1,
});
assert.equal(
  staleAckAccepted,
  false,
  "Un ACK con revisión vieja (fuera de orden) debe ser rechazado"
);
assert.notEqual(
  reloadedQueue.find(opResume.operationId)?.status,
  "done",
  "Una operación con ACK rechazado no debe marcarse como done"
);

// Confirmación con revisión válida y limpieza con dequeueDone()
const validAckAccepted = reloadedQueue.acknowledge({
  operationId: opResume.operationId,
  serverId: "srv-valid",
  revision: 2,
});
assert.equal(validAckAccepted, true, "El ACK con revisión vigente debe aceptarse");
assert.equal(
  reloadedQueue.dequeueDone(),
  1,
  "dequeueDone debe purgar las operaciones completadas"
);
assert.equal(reloadedQueue.size(), 0, "La cola debe quedar vacía tras dequeueDone");

console.log("sync.spec.ts: PASS");
}

runAsyncTests().catch((error) => {
  console.error("sync.spec.ts: FAIL");
  console.error(error);
  process.exit(1);
});