import assert from 'node:assert/strict';
import { SyncQueue, createMemoryStorage, createIdempotentServer } from '../../src/lib/sync/queue';
import { record, epoch } from '../helpers/fixture';
const q = new SyncQueue({ storage: createMemoryStorage(), now: () => epoch });
const op = q.enqueue({ operationId: 'same-operation', entityId: record.id, type: 'CREATE_INSPECTION', payload: record });
function assertExactlyOnce(server: ReturnType<typeof createIdempotentServer>) {
    const first = server.handle(op), second = server.handle({ ...op, attempts: 2 });
    assert.equal(server.totalSubmissions(), 1, 'Un reintento debe crear exactamente un registro');
    assert.equal(first.serverId, second.serverId);
    assert.equal(second.duplicate, true);
    assert.equal(server.duplicateCount(), 1);
}
assertExactlyOnce(createIdempotentServer());
const broken = createIdempotentServer({ deduplicationEnabled: false });
assert.throws(() => assertExactlyOnce(broken), assert.AssertionError);
assert.equal(broken.totalSubmissions(), 2);
console.log('server-dedup: mismo oráculo rechaza regresión inducida PASS');
