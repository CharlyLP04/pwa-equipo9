import assert from 'node:assert/strict';
import { isLocalInspectionRecord } from '../../src/lib/storage/schema';
import { SyncQueue, createMemoryStorage, createIdempotentServer } from '../../src/lib/sync/queue';
import { record, epoch } from '../helpers/fixture';
async function main() {
    const storage = createMemoryStorage(), server = createIdempotentServer(), events = new EventTarget();
    const options = { storage, now: () => epoch };
    let q = new SyncQueue(options);
    let online = false;
    assert.equal(isLocalInspectionRecord(record), true);
    storage.write('inspections', JSON.stringify([record]));
    q.enqueue({ operationId: 'critical-08', entityId: record.id, type: 'CREATE_INSPECTION', payload: record });
    assert.equal(server.totalSubmissions(), 0);
    assert.equal(q.size(), 1);
    q = new SyncQueue(options);
    assert.deepEqual(JSON.parse(storage.read('inspections')!), [record]);
    let dispatch: Promise<unknown> = Promise.resolve();
    events.addEventListener('online', () => { online = true; dispatch = q.process(async (op) => server.handle(op)); });
    assert.equal(online, false);
    events.dispatchEvent(new Event('online'));
    await dispatch;
    assert.equal(online, true);
    assert.equal(q.find('critical-08')?.status, 'done');
    assert.equal(q.dequeueDone(), 1);
    assert.equal(q.size(), 0);
    assert.equal(new SyncQueue(options).size(), 0);
    assert.equal(server.totalSubmissions(), 1);
    // ACK perdido después de crear: recarga y reenvío conservan la identidad.
    q.enqueue({ operationId: 'lost-ack', entityId: 'other', type: 'CREATE_INSPECTION', payload: record });
    const sent = q.markInFlight('lost-ack');
    const first = server.handle(sent);
    q = new SyncQueue(options);
    await q.process(async (op) => { const ack = server.handle(op); assert.equal(ack.duplicate, true); assert.equal(ack.serverId, first.serverId); return ack; });
    assert.equal(server.totalSubmissions(), 2);
    assert.equal(q.dequeueDone(), 1);
    console.log('critical-path: offline → persistir → recargar → online → ACK; ACK perdido PASS');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
