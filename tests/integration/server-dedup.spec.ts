
import assert from "node:assert/strict";
import {
  SyncQueue,
  createMemoryStorage,
  createIdempotentServer,
} from "../../src/lib/sync/queue";

function detectsDuplicateCreation(
  firstId: string,
  secondId: string,
  totalRecords: number
): boolean {
  return firstId !== secondId || totalRecords !== 1;
}

async function main() {
  const queue = new SyncQueue({
    storage: createMemoryStorage(),
    idFactory: () => "op-dedup-w08",
  });

  const operation = queue.enqueue({
    entityId: "lab-sintetico-05",
    type: "CREATE_INSPECTION",
    payload: { inspection: "sintetica" },
    revision: 1,
  });

  // 1. Servidor con deduplicación habilitada
  const server = createIdempotentServer({
    deduplicationEnabled: true,
  });

  const first = server.handle(operation);
  const second = server.handle(operation);

  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.equal(first.serverId, second.serverId);
  assert.equal(server.count(), 1);
  assert.equal(server.totalSubmissions(), 1);
  assert.equal(server.duplicateCount(), 1);

  assert.equal(
    detectsDuplicateCreation(
      first.serverId,
      second.serverId,
      server.totalSubmissions()
    ),
    false
  );

  // 2. Prueba antisabotaje:
  // La anomalía debe detectarse, sin provocar un fallo permanente en CI.
  const sabotagedServer = createIdempotentServer({
    deduplicationEnabled: false,
  });

  const sabotagedFirst = sabotagedServer.handle(operation);
  const sabotagedSecond = sabotagedServer.handle(operation);

  assert.equal(sabotagedSecond.duplicate, false);
  assert.notEqual(sabotagedFirst.serverId, sabotagedSecond.serverId);
  assert.equal(sabotagedServer.totalSubmissions(), 2);

  assert.equal(
    detectsDuplicateCreation(
      sabotagedFirst.serverId,
      sabotagedSecond.serverId,
      sabotagedServer.totalSubmissions()
    ),
    true,
    "La prueba debe detectar la duplicación cuando se desactiva la protección"
  );

  console.log("server-dedup.spec.ts: PASS (deduplicación y antisabotaje)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
