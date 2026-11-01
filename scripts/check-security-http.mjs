import assert from "node:assert/strict";
import fs from "node:fs";
const base = process.env.UTT_TEST_ORIGIN ?? "http://127.0.0.1:3000";
const provisioned = fs.existsSync(".local/accounts.json");
const inspector = provisioned ? "inspector-a" : "inspector.lab";
const secondUser = provisioned ? "inspector-b" : "visitante.lab";
const supervisor = provisioned ? "supervisor" : "supervisor.lab";
const accounts = provisioned
  ? Object.fromEntries(
      fs
        .readFileSync(".local/access.txt", "utf8")
        .split("\n")
        .map((line) => line.trim().split(" : ")),
    )
  : Object.fromEntries(
      [inspector, secondUser, supervisor].map((id) => [
        id,
        "Laboratorio-Sintetico-2026!",
      ]),
    );
async function request(path, method = "GET", cookie = "", body) {
  return fetch(base + path, {
    method,
    headers: {
      origin: base,
      ...(cookie ? { cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function login(userId) {
  const response = await request("/api/session", "POST", "", {
    userId,
    phrase: accounts[userId],
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /httponly/i);
  return response.headers.get("set-cookie").split(";")[0];
}
(async () => {
  const a = await login(inspector),
    b = await login(secondUser),
    s = await login(supervisor);
  assert.equal(
    (
      await request("/api/session", "POST", "", {
        userId: inspector,
        phrase: "invalid-synthetic-phrase",
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("/api/secure-inspections", "GET", "utt-session=invalid"))
      .status,
    401,
  );
  const payload = {
    id: "http-smoke-" + Date.now(),
    ownerId: inspector,
    location: "Laboratorio de Redes y Telecomunicaciones",
    inspector: "A",
    summary: "<b>Urgente</b>",
    riskLevel: 1,
    findings: 0,
    latitude: 18.0,
    longitude: -97.0,
  };
  const operation = {
    operationId: "op-" + payload.id,
    revision: 1,
    type: "CREATE_INSPECTION",
    payload,
  };
  assert.equal(
    (await request("/api/secure-inspections", "POST", a, operation)).status,
    200,
  );
  const repeated = await request(
    "/api/secure-inspections",
    "POST",
    a,
    operation,
  );
  assert.equal(repeated.status, 200);
  assert.equal((await repeated.json()).duplicate, true);
  const saved = await (
    await request("/api/secure-inspections?id=" + payload.id, "GET", a)
  ).json();
  assert.equal("latitude" in saved, false);
  assert.equal("longitude" in saved, false);
  assert.equal(
    (
      await request("/api/secure-inspections", "POST", a, {
        ...operation,
        payload: { ...payload, id: payload.id + "-reuse" },
      })
    ).status,
    409,
  );
  const outside = {
    ...operation,
    operationId: operation.operationId + "-outside",
    payload: {
      ...payload,
      id: payload.id + "-outside",
      location: "Laboratorio fuera de alcance",
    },
  };
  assert.equal(
    (await request("/api/secure-inspections", "POST", a, outside)).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/api/secure-inspections?id=" + outside.payload.id,
        "GET",
        s,
      )
    ).status,
    403,
  );
  assert.equal(
    (await request("/api/secure-inspections?id=" + payload.id, "GET", b))
      .status,
    403,
  );
  assert.equal(
    (await request("/api/secure-inspections", "POST", b, operation)).status,
    403,
  );
  assert.equal(
    (
      await request("/api/secure-inspections", "POST", a, {
        ...operation,
        payload: { ...payload, riskLevel: 99 },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/secure-inspections", "POST", a, {
        action: "approve",
        id: payload.id,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/api/secure-inspections", "POST", s, {
        action: "approve",
        id: payload.id,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await fetch(base + "/api/session", {
        method: "DELETE",
        headers: { cookie: a, origin: "https://other.example" },
      })
    ).status,
    403,
  );
  assert.equal((await request("/api/session", "DELETE", a)).status, 200);
  assert.equal(
    (await request("/api/secure-inspections", "GET", a)).status,
    401,
  );
  assert.equal((await request("/api/session", "DELETE", b)).status, 200);
  assert.equal((await request("/api/session", "DELETE", s)).status, 200);
  const page = await request("/inspecciones");
  assert.match(page.headers.get("content-security-policy"), /nonce-/);
  console.log(
    "HTTP: autenticación, cookie HttpOnly, aislamiento, 400, RBAC, origen y revocación PASS",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
