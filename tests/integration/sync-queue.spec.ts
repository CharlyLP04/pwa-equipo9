
import assert from "node:assert/strict";
import {
  SyncQueue,
  createMemoryStorage,
  computeBackoff,
} from "../../src/lib/sync/queue";

async function main() {
  const storage = createMemoryStorage();
  let now = Date.parse("2026-10-01T12:00:00Z");

  const queue = new SyncQueue({
    storage,
    now: () => now,
    idFactory: () => "op-w08-001",
    baseBackoffMs: 1000,
    maxBackoffMs: 8000,
  });

  // 1. Enqueue y persistencia inmediata
  const op = queue.enqueue({
    entityId: "lab-sintetico-01",
    type: "CREATE_INSPECTION",
    payload: { status: "reportada" },
    revision: 1,
  });

  assert.equal(op.status, "pending");
  assert.equal(queue.size(), 1);
  assert.equal(
    JSON.parse(storage.read("utt-lab-outbox")!)[0].operationId,
    op.operationId
  );

  // 2. Transición, ACK válido y limpieza
  queue.markInFlight(op.operationId);
  assert.equal(queue.find(op.operationId)?.status, "inFlight");
  assert.equal(queue.find(op.operationId)?.attempts, 1);

  assert.equal(
    queue.acknowledge({
      operationId: op.operationId,
      serverId: "srv-sintetico-01",
      revision: 1,
    }),
    true
  );

  assert.equal(queue.find(op.operationId)?.status, "done");
  assert.equal(queue.dequeueDone(), 1);
  assert.equal(queue.size(), 0);

  // 3. Fallo simulado y backoff exponencial
  const retryQueue = new SyncQueue({
    storage: createMemoryStorage(),
    now: () => now,
    idFactory: () => "op-retry",
    baseBackoffMs: 1000,
    maxBackoffMs: 8000,
  });

  const retryOp = retryQueue.enqueue({
    entityId: "lab-sintetico-02",
    type: "UPDATE_INSPECTION",
    payload: { status: "en-proceso" },
  });

  const failedResult = await retryQueue.process(async () => {
    throw new Error("Fallo de red simulado");
  });

  assert.equal(failedResult.retried, 1);
  assert.equal(retryQueue.find(retryOp.operationId)?.attempts, 1);
  assert.equal(retryQueue.find(retryOp.operationId)?.status, "pending");
  assert.equal(retryQueue.find(retryOp.operationId)?.nextAttemptAt, now + 1000);

  now += 1000;

  await retryQueue.process(async () => {
    throw new Error("Segundo fallo simulado");
  });

  assert.equal(retryQueue.find(retryOp.operationId)?.attempts, 2);
  assert.equal(retryQueue.find(retryOp.operationId)?.nextAttemptAt, now + 2000);

  assert.equal(computeBackoff(1, 1000, 8000), 1000);
  assert.equal(computeBackoff(2, 1000, 8000), 2000);
  assert.equal(computeBackoff(4, 1000, 8000), 8000);
  assert.equal(computeBackoff(6, 1000, 8000), 8000);

  // 4. Recuperación después de cierre inesperado
  const persistentStorage = createMemoryStorage();
  const firstSession = new SyncQueue({
    storage: persistentStorage,
    now: () => now,
  });

  const interrupted = firstSession.enqueue({
    operationId: "op-interrupted",
    entityId: "lab-sintetico-03",
    type: "CREATE_INSPECTION",
    payload: { status: "reportada" },
  });

  firstSession.markInFlight(interrupted.operationId);

  const secondSession = new SyncQueue({
    storage: persistentStorage,
    now: () => now,
  });

  assert.equal(secondSession.find(interrupted.operationId)?.status, "pending");
  assert.equal(
    secondSession.find(interrupted.operationId)?.idempotencyKey,
    interrupted.idempotencyKey
  );

  // 5. Rechazo de ACK fuera de orden
  const revisionQueue = new SyncQueue({
    storage: createMemoryStorage(),
    now: () => now,
  });

  const newer = revisionQueue.enqueue({
    operationId: "op-revision-3",
    entityId: "lab-sintetico-04",
    type: "UPDATE_INSPECTION",
    payload: { version: 3 },
    revision: 3,
  });

  revisionQueue.markInFlight(newer.operationId);

  assert.equal(
    revisionQueue.acknowledge({
      operationId: newer.operationId,
      serverId: "srv-old",
      revision: 2,
    }),
    false
  );

  assert.notEqual(revisionQueue.find(newer.operationId)?.status, "done");

  assert.equal(
    revisionQueue.acknowledge({
      operationId: newer.operationId,
      serverId: "srv-current",
      revision: 3,
    }),
    true
  );

  const older = revisionQueue.enqueue({
    operationId: "op-revision-2",
    entityId: "lab-sintetico-04",
    type: "UPDATE_INSPECTION",
    payload: { version: 2 },
    revision: 2,
  });

  revisionQueue.markInFlight(older.operationId);

  assert.equal(
    revisionQueue.acknowledge({
      operationId: older.operationId,
      serverId: "srv-stale",
      revision: 2,
    }),
    false
  );

  assert.equal(revisionQueue.find(older.operationId)?.status, "inFlight");

  console.log("sync-queue.spec.ts: PASS (5 grupos de integración)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
