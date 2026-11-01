import { authorizeAction, type SecurityContext } from "./rbac";
export interface InspectionInput {
  location: string;
  inspector: string;
  summary: string;
  findings: number;
  riskLevel: number;
}
export type ValidationResult =
  | {
      status: 200;
      data: InspectionInput;
    }
  | {
      status: 400;
      error: string;
    };
/** Escapado para un destino HTML textual. En JSX usar el texto crudo: React ya lo escapa. */
export function sanitizeLiteralText(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
export function validateInspectionInput(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { status: 400, error: "Datos inválidos" };
  const data = input as Record<string, unknown>;
  if (
    typeof data.riskLevel !== "number" ||
    !Number.isInteger(data.riskLevel) ||
    data.riskLevel < 1 ||
    data.riskLevel > 5
  )
    return { status: 400, error: "Nivel inválido" };
  if (
    typeof data.findings !== "number" ||
    !Number.isSafeInteger(data.findings) ||
    data.findings < 0
  )
    return { status: 400, error: "Hallazgos inválidos" };
  for (const key of ["location", "inspector"] as const) {
    const value = data[key];
    if (typeof value !== "string" || !value.trim() || value.length > 160)
      return { status: 400, error: "Ubicación o responsable inválido" };
  }
  if (
    typeof data.summary !== "string" ||
    !data.summary.trim() ||
    data.summary.length > 2000
  )
    return { status: 400, error: "Resumen inválido" };
  return {
    status: 200,
    data: {
      location: (data.location as string).trim(),
      inspector: (data.inspector as string).trim(),
      summary: data.summary.trim(),
      findings: data.findings,
      riskLevel: data.riskLevel,
    },
  };
}
/** Lista permitida: ninguna coordenada, campo anidado ni precisión llega a persistencia. */
export function minimizeLocationData(value: { laboratoryTag: string }): {
  laboratoryTag: string;
} {
  if (
    !value ||
    typeof value.laboratoryTag !== "string" ||
    !value.laboratoryTag.trim()
  )
    throw new Error("Laboratorio inválido");
  return { laboratoryTag: value.laboratoryTag.trim() };
}
/** La identidad es un argumento del adaptador de confianza, nunca se toma del payload. */
export function prepareInspection(context: SecurityContext, input: unknown) {
  const validation = validateInspectionInput(input);
  if (validation.status !== 200) return validation;
  const { laboratoryTag } = minimizeLocationData({
    laboratoryTag: validation.data.location,
  });
  const authorization = authorizeAction(context, "create", {
    ownerId: context.userId,
    laboratoryTag,
  });
  if (authorization.status !== 200) return authorization;
  return {
    status: 200 as const,
    data: { ...validation.data, ownerId: context.userId, laboratoryTag },
  };
}
import {
  isLocalInspectionRecord,
  type LocalInspectionRecord,
} from "../storage/schema";
export type SecuredInspectionRecord = LocalInspectionRecord & {
  ownerId: string;
  laboratoryTag: string;
  riskLevel: number;
  approved?: boolean;
  operationId?: string;
  idempotencyKey?: string;
};
export function isSecuredInspectionRecord(
  value: unknown,
): value is SecuredInspectionRecord {
  if (!isLocalInspectionRecord(value)) return false;
  const data = value as unknown as Record<string, unknown>;
  return (
    typeof data.ownerId === "string" &&
    Boolean(data.ownerId.trim()) &&
    typeof data.laboratoryTag === "string" &&
    data.laboratoryTag === data.location &&
    validateInspectionInput(data).status === 200 &&
    (data.approved === undefined || typeof data.approved === "boolean")
  );
}
