import type { LocalInspectionRecord } from '../../src/lib/storage/schema';
export const record: LocalInspectionRecord = { id: 'synthetic-08', location: 'LAB-SYNTHETIC', date: '2026-10-24', inspector: 'Persona sintética 08', status: 'attention', statusLabel: 'Atención', findings: 2, summary: 'Ejercicio sintético', version: 1, updatedAt: '2026-10-24T12:00:00.000Z' };
export const epoch = Date.parse(record.updatedAt);
