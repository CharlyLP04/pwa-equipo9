import { NextRequest, NextResponse } from "next/server";
import {
  resolveSession,
  sameOrigin,
  sessionCookie,
} from "@/lib/security/server-auth";
import { authorizeAction, prepareInspection } from "@/lib/security";
import { getRecords, saveRecord } from "@/lib/security/server-records";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET(request: NextRequest) {
  const context = resolveSession(request.cookies.get(sessionCookie)?.value);
  if (!context) return reply({ error: "Sesión requerida" }, 401);
  const records = getRecords();
  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    const record = records.get(id);
    if (!record) return reply({ error: "No encontrado" }, 404);
    if (authorizeAction(context, "view", record).status !== 200)
      return reply({ error: "Acceso denegado" }, 403);
    return reply(record);
  }
  return reply(
    Array.from(records.values()).filter(
      (record) => authorizeAction(context, "view", record).status === 200,
    ),
  );
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ error: "Origen no permitido" }, 403);
  const context = resolveSession(request.cookies.get(sessionCookie)?.value);
  if (!context) return reply({ error: "Sesión requerida" }, 401);
  const raw = await request.text();
  if (raw.length > 16384)
    return reply({ error: "Solicitud demasiado grande" }, 413);
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return reply({ error: "Datos inválidos" }, 400);
  }
  const records = getRecords();
  if (input?.action === "approve") {
    const record = records.get(input.id);
    if (!record) return reply({ error: "No encontrado" }, 404);
    const allowed = authorizeAction(context, "approve", record);
    if (allowed.status !== 200) return reply(allowed, 403);
    const approved = { ...record, approved: true };
    saveRecord(approved);
    return reply(approved);
  }
  const payload = input?.payload;
  const checked = prepareInspection(context, payload);
  if (checked.status !== 200) return reply(checked, checked.status);
  if (
    typeof payload?.id !== "string" ||
    !/^[a-zA-Z0-9-]{1,100}$/.test(payload.id) ||
    typeof input.operationId !== "string" ||
    !input.operationId.length ||
    input.operationId.length > 120 ||
    input.type !== "CREATE_INSPECTION" ||
    input.revision !== 1
  )
    return reply({ error: "Operación inválida" }, 400);
  if (payload.ownerId !== context.userId)
    return reply({ error: "Acceso denegado" }, 403);
  const key = input.idempotencyKey ?? input.operationId;
  if (typeof key !== "string" || key.length < 1 || key.length > 160)
    return reply({ error: "Operación inválida" }, 400);
  const prior = Array.from(records.values()).find(
    (record) =>
      record.ownerId === context.userId &&
      (record.operationId === input.operationId ||
        record.idempotencyKey === key),
  );
  if (prior && prior.id !== payload.id)
    return reply({ error: "Identificador reutilizado" }, 409);
  const existing = records.get(payload.id);
  if (existing) {
    if (authorizeAction(context, "update", existing).status !== 200)
      return reply({ error: "Acceso denegado" }, 403);
    if (
      existing.summary !== checked.data.summary ||
      existing.location !== checked.data.location ||
      existing.riskLevel !== checked.data.riskLevel ||
      existing.findings !== checked.data.findings
    )
      return reply({ error: "Conflicto de revisión" }, 409);
  } else {
    if (records.size >= 10000)
      return reply({ error: "Capacidad local alcanzada" }, 503);
    const now = new Date().toISOString();
    saveRecord({
      ...checked.data,
      operationId: input.operationId,
      idempotencyKey: key,
      id: payload.id,
      inspector: context.userId,
      date: now.slice(0, 10),
      status: checked.data.findings ? "attention" : "ok",
      statusLabel: checked.data.findings
        ? "Requiere atención"
        : "Sin incidencias",
      version: 1,
      updatedAt: now,
    });
  }
  return reply({
    operationId: input.operationId,
    revision: 1,
    serverId: payload.id,
    duplicate: Boolean(existing),
  });
}
