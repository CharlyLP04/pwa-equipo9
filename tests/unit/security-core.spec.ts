import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { POST as createSession } from "../../src/app/api/session/route";
import {
  readProvisionedAccounts,
  authenticate,
  resolveSession,
  revokeSession,
} from "../../src/lib/security/server-auth";
import assert from "node:assert/strict";
import {
  authorizeAction,
  validateInspectionInput,
  sanitizeLiteralText,
  minimizeLocationData,
  clearPrivateSessionStorage,
  buildContentSecurityPolicy,
} from "../../src/lib/security";
const a = { userId: "a", role: "inspector" as const, assignedLaboratories: [] };
const supervisor = {
  userId: "s",
  role: "supervisor" as const,
  assignedLaboratories: ["Redes"],
};
const own = { ownerId: "a", laboratoryTag: "Redes" };
const other = { ownerId: "b", laboratoryTag: "Redes" };
assert.equal(authorizeAction(a, "view", other).status, 403);
assert.equal(authorizeAction(a, "update", other).status, 403);
assert.equal(authorizeAction(a, "view", own).status, 200);
assert.equal(authorizeAction(a, "approve", own).status, 403);
assert.equal(authorizeAction(supervisor, "approve", other).status, 200);
assert.equal(
  authorizeAction(supervisor, "view", { ...other, laboratoryTag: "Otro" })
    .status,
  403,
);
assert.equal(
  authorizeAction({ ...a, role: "visitor" }, "create", own).status,
  403,
);
const input = {
  location: "Redes",
  inspector: "a",
  summary: "<b>Urgente</b>",
  findings: 0,
  riskLevel: 1,
};
for (const riskLevel of [99, 0, -1, 1.1, "1", null])
  assert.deepEqual(validateInspectionInput({ ...input, riskLevel }), {
    status: 400,
    error: "Nivel inválido",
  });
assert.equal(validateInspectionInput(input).status, 200);
assert.equal(sanitizeLiteralText(input.summary), "&lt;b&gt;Urgente&lt;/b&gt;");
assert.deepEqual(
  minimizeLocationData({
    laboratoryTag: "Redes",
    latitude: 1,
    longitude: 2,
  } as any),
  { laboratoryTag: "Redes" },
);
assert.match(buildContentSecurityPolicy(), /object-src 'none'/);
async function verifyAutomaticAccounts() {
  const previousCwd = process.cwd();
  const previousPath = process.env.UTT_ACCOUNTS_FILE;
  const directory = mkdtempSync(join(tmpdir(), "utt-auth-test-"));
  const configured = join(directory, "accounts.json");
  try {
    process.chdir(directory);
    delete process.env.UTT_ACCOUNTS_FILE;
    const defaults = readProvisionedAccounts();
    assert.deepEqual(
      defaults.map((account) => account.userId),
      ["inspector.lab", "supervisor.lab", "visitante.lab"],
    );
    for (const account of defaults) {
      const session = authenticate(
        account.userId,
        "Laboratorio-Sintetico-2026!",
      );
      assert.ok(session);
      assert.equal(resolveSession(session.id)?.role, account.role);
      revokeSession(session.id);
      assert.equal(resolveSession(session.id), null);
    }
    assert.equal(authenticate("inspector.lab", "incorrecta"), null);
    const response = await createSession(
      new NextRequest("http://localhost/api/session", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "inspector.lab",
          phrase: "Laboratorio-Sintetico-2026!",
        }),
      }),
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).role, "inspector");
    assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/i);
    process.env.UTT_ACCOUNTS_FILE = configured;
    assert.throws(() => readProvisionedAccounts());
    writeFileSync(
      configured,
      JSON.stringify([{ ...defaults[0], userId: "local-only" }]),
    );
    assert.deepEqual(
      readProvisionedAccounts().map((account) => account.userId),
      ["local-only"],
    );
    assert.equal(
      authenticate("inspector.lab", "Laboratorio-Sintetico-2026!"),
      null,
    );
    assert.ok(authenticate("local-only", "Laboratorio-Sintetico-2026!"));
    writeFileSync(configured, "{}");
    assert.throws(() => readProvisionedAccounts(), /Provisión local inválida/);
    writeFileSync(configured, "broken");
    assert.throws(() => readProvisionedAccounts());
  } finally {
    process.chdir(previousCwd);
    if (previousPath === undefined) delete process.env.UTT_ACCOUNTS_FILE;
    else process.env.UTT_ACCOUNTS_FILE = previousPath;
    try {
      unlinkSync(configured);
    } catch {}
    rmdirSync(directory);
  }
}
async function run() {
  await verifyAutomaticAccounts();
  const data = new Map([
    ["utt-local-inspections", "private"],
    ["utt-lab-outbox", "private"],
    ["unrelated", "keep"],
  ]);
  let cleared = false;
  const cache = new Set(["utt-lab-data-old", "other"]);
  await clearPrivateSessionStorage({
    storage: {
      get length() {
        return data.size;
      },
      key: (i) => Array.from(data.keys())[i] ?? null,
      removeItem: (key) => {
        data.delete(key);
      },
    },
    queue: {
      clear() {
        cleared = true;
      },
    },
    cacheStorage: {
      async keys() {
        return Array.from(cache);
      },
      async delete(key) {
        return cache.delete(key);
      },
    },
  });
  assert.deepEqual(Array.from(data.keys()), ["unrelated"]);
  assert.equal(cleared, true);
  assert.deepEqual(Array.from(cache), ["other"]);
  console.log(
    "security-core: RBAC, validación, minimización, CSP, purga y arranque automático de sesión PASS",
  );
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
