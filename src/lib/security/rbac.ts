export type Role = "inspector" | "supervisor" | "visitor";
export interface SecurityContext {
  userId: string;
  role: Role;
  assignedLaboratories: readonly string[];
}
export interface InspectionAccess {
  ownerId: string;
  laboratoryTag: string;
}
export type InspectionAction = "create" | "view" | "update" | "approve";
export type AuthorizationResult =
  | {
      status: 200;
    }
  | {
      status: 403;
      error: string;
    };
export function authorizeAction(
  context: SecurityContext,
  action: InspectionAction,
  resource: InspectionAccess,
): AuthorizationResult {
  const denied = { status: 403 as const, error: "Acceso denegado" };
  if (
    !context ||
    !resource ||
    typeof context.userId !== "string" ||
    !context.userId.trim() ||
    typeof resource.ownerId !== "string" ||
    !resource.ownerId.trim() ||
    typeof resource.laboratoryTag !== "string" ||
    !resource.laboratoryTag.trim()
  )
    return denied;
  if (context.role !== "inspector" && context.role !== "supervisor")
    return denied;
  if (!["create", "view", "update", "approve"].includes(action)) return denied;
  const own = context.userId === resource.ownerId;
  const scoped =
    context.role === "supervisor" &&
    Array.isArray(context.assignedLaboratories) &&
    context.assignedLaboratories.includes(resource.laboratoryTag);
  if (action === "approve") return scoped ? { status: 200 } : denied;
  if (action === "create")
    return own && (context.role !== "supervisor" || scoped)
      ? { status: 200 }
      : denied;
  return (context.role === "inspector" ? own : scoped)
    ? { status: 200 }
    : denied;
}
export const canViewInspection = (
  context: SecurityContext,
  record: InspectionAccess,
) => authorizeAction(context, "view", record).status === 200;
export const canCreateInspection = (
  context: SecurityContext,
  record: InspectionAccess,
) => authorizeAction(context, "create", record).status === 200;
export const canApproveInspection = (
  context: SecurityContext,
  record: InspectionAccess,
) => authorizeAction(context, "approve", record).status === 200;
