import { NextRequest, NextResponse } from "next/server";
import {
  authenticate,
  resolveSession,
  revokeSession,
  sameOrigin,
  sessionCookie,
} from "@/lib/security/server-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET(request: NextRequest) {
  const context = resolveSession(request.cookies.get(sessionCookie)?.value);
  return reply(
    context ?? { userId: "visitor", role: "visitor", assignedLaboratories: [] },
  );
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ error: "Origen no permitido" }, 403);
  const raw = await request.text();
  if (raw.length > 2048)
    return reply({ error: "Solicitud demasiado grande" }, 413);
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return reply({ error: "Datos inválidos" }, 400);
  }
  if (
    typeof input?.userId !== "string" ||
    typeof input?.phrase !== "string" ||
    input.userId.length > 80 ||
    input.phrase.length > 256
  )
    return reply({ error: "Datos inválidos" }, 400);
  try {
    const result = authenticate(input.userId, input.phrase);
    if (!result)
      return reply(
        {
          error:
            "Acceso no permitido; verifica los datos o espera cinco minutos",
        },
        401,
      );
    revokeSession(request.cookies.get(sessionCookie)?.value);
    const response = reply(result.context);
    response.cookies.set(sessionCookie, result.id, {
      httpOnly: true,
      sameSite: "strict",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 1800,
    });
    return response;
  } catch {
    return reply(
      { error: "Acceso no disponible; revisa la provisión local" },
      503,
    );
  }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ error: "Origen no permitido" }, 403);
  revokeSession(request.cookies.get(sessionCookie)?.value);
  const response = reply({ closed: true });
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
