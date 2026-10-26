import assert from 'node:assert/strict';
import { isLocalInspectionRecord as valid, isPendingOperation as pending } from '../../src/lib/storage/schema';
import { record } from '../helpers/fixture';
assert.equal(valid(record), true);
assert.equal(valid({ ...record, status: 'ok', findings: 0, version: 0 }), true);
for (const value of [null, undefined, [], 1, 'x', false])
    assert.equal(valid(value), false);
for (const key of Object.keys(record)) {
    const value: Record<string, unknown> = { ...record };
    delete value[key];
    assert.equal(valid(value), false, key);
}
for (const [key, values] of Object.entries({ id: ['', 1], location: ['', null], inspector: ['', 2], date: [null, 42], status: ['bad', ''], statusLabel: [null], summary: [null], findings: [-1, 1.5, NaN, Infinity, '1'], version: [-1, 1.2, NaN], updatedAt: ['corrupt', '', null] }))
    for (const value of values)
        assert.equal(valid({ ...record, [key]: value }), false, key);
// Caracterización del contrato heredado: date es texto libre; updatedAt sí se valida.
assert.equal(valid({ ...record, date: 'corrupt' }), true);
const operation = { id: 'pending-08', type: 'create', inspectionId: record.id, payload: record, createdAt: record.updatedAt, attempts: 0, status: 'pending' };
for (const type of ['create', 'update'])
    for (const status of ['pending', 'processing', 'failed'])
        assert.equal(pending({ ...operation, type, status }), true);
for (const key of Object.keys(operation)) {
    const value: Record<string, unknown> = { ...operation };
    delete value[key];
    assert.equal(pending(value), false, key);
}
for (const [key, values] of Object.entries({ id: ['', null], type: ['delete'], inspectionId: [''], payload: [{}, null], createdAt: ['corrupt', ''], attempts: [-1, 0.5, NaN], status: ['inFlight', 'done'] }))
    for (const value of values)
        assert.equal(pending({ ...operation, [key]: value }), false, key);
console.log('schema: validación, límites y contrato heredado PASS');
