import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SecurityContext } from "./rbac";
interface Account extends SecurityContext {
  salt: string;
  digest: string;
}
interface Session {
  context: SecurityContext;
  expires: number;
}
const state = globalThis as typeof globalThis & {
  uttSessions?: Map<string, Session>;
  uttAttempts?: Map<
    string,
    {
      count: number;
      until: number;
    }
  >;
};
const sessions = (state.uttSessions ??= new Map<string, Session>());
const attempts = (state.uttAttempts ??= new Map<
  string,
  {
    count: number;
    until: number;
  }
>());
export const sessionCookie = "utt-session";
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
/** Cuentas públicas de práctica, solo cuando no existe provisión local. */
let laboratoryAccounts: Account[] | undefined;
export function readProvisionedAccounts(): Account[] {
  const configured = process.env.UTT_ACCOUNTS_FILE;
  const path = resolve(configured ?? ".local/accounts.json");
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT" || configured)
      throw error;
    if (!laboratoryAccounts) {
      laboratoryAccounts = (
        ["inspector", "supervisor", "visitor"] as const
      ).map((role) => {
        const salt = randomBytes(16).toString("hex");
        return {
          userId: role === "visitor" ? "visitante.lab" : role + ".lab",
          role,
          assignedLaboratories:
            role === "supervisor"
              ? ["Laboratorio de Redes y Telecomunicaciones"]
              : [],
          salt,
          digest: scryptSync("Laboratorio-Sintetico-2026!", salt, 64).toString(
            "hex",
          ),
        };
      });
    }
    return laboratoryAccounts;
  }
  const data: unknown = JSON.parse(raw);
  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    !data.every(
      (account) =>
        account &&
        typeof account.userId === "string" &&
        account.userId.trim() &&
        ["inspector", "supervisor", "visitor"].includes(account.role) &&
        Array.isArray(account.assignedLaboratories) &&
        account.assignedLaboratories.every(
          (lab: unknown) => typeof lab === "string",
        ) &&
        typeof account.salt === "string" &&
        /^[a-f0-9]{32}$/i.test(account.salt) &&
        typeof account.digest === "string" &&
        /^[a-f0-9]{128}$/i.test(account.digest),
    ) ||
    new Set(data.map((account) => account.userId)).size !== data.length
  )
    throw new Error("Provisión local inválida");
  return data;
}
export function authenticate(userId: string, phrase: string) {
  const now = Date.now();
  for (const [key, value] of Array.from(attempts))
    if (value.until < now) attempts.delete(key);
  const key = hash(userId);
  const attempt = attempts.get(key);
  if ((attempt && attempt.count >= 5) || attempts.size > 1000) return null;
  attempts.set(key, {
    count: (attempt?.count ?? 0) + 1,
    until: attempt?.until ?? now + 300000,
  });
  const accounts = readProvisionedAccounts();
  const account = accounts.find((item) => item.userId === userId);
  const salt = account?.salt ?? "synthetic-unknown-user";
  const actual = scryptSync(phrase, salt, 64);
  const expected = account
    ? Buffer.from(account.digest, "hex")
    : Buffer.alloc(64);
  if (!timingSafeEqual(actual, expected) || !account) return null;
  attempts.delete(key);
  for (const [key, value] of Array.from(sessions))
    if (value.expires <= now) sessions.delete(key);
  if (sessions.size >= 1000) return null;
  const id = randomBytes(32).toString("hex");
  const context: SecurityContext = {
    userId: account.userId,
    role: account.role,
    assignedLaboratories: account.assignedLaboratories,
  };
  sessions.set(hash(id), { context, expires: now + 1800000 });
  return { id, context };
}
export function resolveSession(id: string | undefined) {
  if (!id) return null;
  const value = sessions.get(hash(id));
  if (!value) return null;
  if (value.expires <= Date.now()) {
    sessions.delete(hash(id));
    return null;
  }
  return value.context;
}
export function revokeSession(id: string | undefined) {
  if (id) sessions.delete(hash(id));
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(
    origin &&
      origin ===
        (process.env.UTT_APP_ORIGIN ??
          new URL(request.url).protocol + "//" + request.headers.get("host")),
  );
}
