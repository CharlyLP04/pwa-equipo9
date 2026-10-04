import type { LocalInspectionRecord } from "@/lib/storage/schema";

export type ConflictResolutionReason =
  | "higher-version"
  | "newer-updatedAt"
  | "deterministic-tie-break";

export type ConflictResolution = {
  record: LocalInspectionRecord;
  reason: ConflictResolutionReason;
};

function compareRecords(
  local: LocalInspectionRecord,
  incoming: LocalInspectionRecord
): number {
  if (local.version !== incoming.version) {
    return local.version - incoming.version;
  }

  const localTime = Date.parse(local.updatedAt);
  const incomingTime = Date.parse(incoming.updatedAt);

  if (localTime !== incomingTime) {
    return localTime - incomingTime;
  }

  const localSerialized = JSON.stringify(local);
  const incomingSerialized = JSON.stringify(incoming);

  return localSerialized.localeCompare(incomingSerialized);
}

export function resolveConflict(
  local: LocalInspectionRecord,
  incoming: LocalInspectionRecord
): ConflictResolution {
  if (local.id !== incoming.id) {
    throw new Error(
      "No se puede resolver un conflicto entre inspecciones diferentes."
    );
  }

  const comparison = compareRecords(local, incoming);

  if (comparison < 0) {
    if (local.version !== incoming.version) {
      return {
        record: incoming,
        reason: "higher-version"
      };
    }

    if (local.updatedAt !== incoming.updatedAt) {
      return {
        record: incoming,
        reason: "newer-updatedAt"
      };
    }

    return {
      record: incoming,
      reason: "deterministic-tie-break"
    };
  }

  if (comparison > 0) {
    if (local.version !== incoming.version) {
      return {
        record: local,
        reason: "higher-version"
      };
    }

    if (local.updatedAt !== incoming.updatedAt) {
      return {
        record: local,
        reason: "newer-updatedAt"
      };
    }

    return {
      record: local,
      reason: "deterministic-tie-break"
    };
  }

  return {
    record: local,
    reason: "deterministic-tie-break"
  };
}