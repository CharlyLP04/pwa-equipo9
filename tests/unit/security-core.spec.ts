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
async function run() {
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
    "security-core: RBAC, validación, minimización, CSP y purga PASS",
  );
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
