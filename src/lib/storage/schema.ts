import type { Inspection } from "@/lib/data/inspections";

export const schemaVersion = 1;

export type LocalInspectionRecord = Inspection & {
  version: number;
  updatedAt: string;
};

export type PendingOperationType = "create" | "update";

export type PendingOperation = {
  id: string;
  type: PendingOperationType;
  inspectionId: string;
  payload: LocalInspectionRecord;
  createdAt: string;
  attempts: number;
  status: "pending" | "processing" | "failed";
};

export function isLocalInspectionRecord(
  value: unknown
): value is LocalInspectionRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    typeof record.location === "string" &&
    record.location.length > 0 &&
    typeof record.date === "string" &&
    typeof record.inspector === "string" &&
    record.inspector.length > 0 &&
    (record.status === "ok" || record.status === "attention") &&
    typeof record.statusLabel === "string" &&
    typeof record.findings === "number" &&
    Number.isInteger(record.findings) &&
    record.findings >= 0 &&
    typeof record.summary === "string" &&
    typeof record.version === "number" &&
    Number.isInteger(record.version) &&
    record.version >= 0 &&
    typeof record.updatedAt === "string" &&
    !Number.isNaN(Date.parse(record.updatedAt))
  );
}

export function isPendingOperation(
  value: unknown
): value is PendingOperation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const operation = value as Record<string, unknown>;

  return (
    typeof operation.id === "string" &&
    operation.id.length > 0 &&
    (operation.type === "create" || operation.type === "update") &&
    typeof operation.inspectionId === "string" &&
    operation.inspectionId.length > 0 &&
    typeof operation.createdAt === "string" &&
    !Number.isNaN(Date.parse(operation.createdAt)) &&
    typeof operation.attempts === "number" &&
    Number.isInteger(operation.attempts) &&
    operation.attempts >= 0 &&
    (operation.status === "pending" ||
      operation.status === "processing" ||
      operation.status === "failed") &&
    isLocalInspectionRecord(operation.payload)
  );
}