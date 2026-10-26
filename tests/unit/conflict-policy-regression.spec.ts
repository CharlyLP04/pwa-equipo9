import assert from 'node:assert/strict';
import { resolveConflict } from '../../src/lib/sync/conflict-policy';
import { record } from '../helpers/fixture';
for (const [other, reason] of [[{ ...record, version: 2, updatedAt: '2020-01-01T00:00:00Z' }, 'higher-version'], [{ ...record, updatedAt: '2026-10-25T12:00:00.000Z' }, 'newer-updatedAt'], [{ ...record, summary: 'zzz' }, 'deterministic-tie-break']] as const) {
    const a = structuredClone(record), b = structuredClone(other);
    assert.deepEqual(resolveConflict(a, b), { record: b, reason });
    assert.deepEqual(resolveConflict(b, a), { record: b, reason });
    assert.deepEqual(a, record);
    assert.deepEqual(b, other);
}
assert.deepEqual(resolveConflict(record, { ...record }), { record, reason: 'deterministic-tie-break' });
assert.throws(() => resolveConflict(record, { ...record, id: 'other' }));
console.log('conflict-policy: precedencia, simetría y no mutación PASS');
