import { randomBytes, scryptSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const folder = resolve(".local");
mkdirSync(folder, { recursive: true });
const accounts = [];
const access = [];
for (const [userId, role] of [
  ["inspector-a", "inspector"],
  ["inspector-b", "inspector"],
  ["supervisor", "supervisor"],
]) {
  const phrase = randomBytes(24).toString("base64url");
  const salt = randomBytes(16).toString("hex");
  accounts.push({
    userId,
    role,
    assignedLaboratories:
      role === "supervisor"
        ? ["Laboratorio de Redes y Telecomunicaciones"]
        : [],
    salt,
    digest: scryptSync(phrase, salt, 64).toString("hex"),
  });
  access.push(userId + " : " + phrase);
}
writeFileSync(
  resolve(folder, "accounts.json"),
  JSON.stringify(accounts, null, 2),
  { flag: "wx", mode: 0o600 },
);
writeFileSync(resolve(folder, "access.txt"), access.join("\n"), {
  flag: "wx",
  mode: 0o600,
});
console.log(
  "Cuentas creadas. Consulta .local/access.txt en este equipo; elimínalo después de guardar las frases de acceso. No compartas esa carpeta.",
);
