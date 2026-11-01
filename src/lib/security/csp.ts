export {
  buildContentSecurityPolicy,
  getSecurityHeaders,
} from "./csp-policy.mjs";
/** Valida únicamente la configuración pública permitida; no es un detector universal. */
export function validateNoExposedCredentials(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, item]) => {
    if (typeof item !== "string") return false;
    if (key === "applicationName") return item === "Inspecciones UTT";
    if (key === "environment")
      return ["demo", "development", "production"].includes(item);
    if (key === "publicBaseUrl") {
      try {
        const url = new URL(item);
        return (
          ["http:", "https:"].includes(url.protocol) &&
          (item === url.origin || item === url.origin + "/")
        );
      } catch {
        return false;
      }
    }
    return false;
  });
}
