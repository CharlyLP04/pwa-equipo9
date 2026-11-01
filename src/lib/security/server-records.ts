import {
  existsSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import { resolve } from "node:path";
import {
  isSecuredInspectionRecord,
  type SecuredInspectionRecord,
} from "./validation";
const file = resolve(".local/inspections.json");
const state = globalThis as typeof globalThis & {
  uttRecords?: Map<string, SecuredInspectionRecord>;
};
export function getRecords() {
  if (!state.uttRecords) {
    const rows: unknown = existsSync(file)
      ? JSON.parse(readFileSync(file, "utf8"))
      : [];
    if (!Array.isArray(rows) || !rows.every(isSecuredInspectionRecord))
      throw new Error("Almacén local inválido");
    state.uttRecords = new Map(rows.map((row) => [row.id, row]));
  }
  return state.uttRecords;
}
/** Solo un proceso Node local. Escritura completa antes de confirmar al cliente. */
export function saveRecord(record: SecuredInspectionRecord) {
  const next = new Map(getRecords());
  next.set(record.id, record);
  mkdirSync(resolve(".local"), { recursive: true });
  writeFileSync(file + ".tmp", JSON.stringify(Array.from(next.values())), {
    mode: 0o600,
  });
  renameSync(file + ".tmp", file);
  state.uttRecords = next;
}
