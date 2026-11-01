/** @param {{nonce?: string, development?: boolean}} options */
export function buildContentSecurityPolicy(options = {}) {
  const { nonce, development = false } = options;
  if (nonce !== undefined && !/^[A-Za-z0-9+/=_-]{16,128}$/.test(nonce))
    throw new Error("Nonce inválido");
  return [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "script-src 'self'" +
      (nonce ? " 'nonce-" + nonce + "' 'strict-dynamic'" : "") +
      (development ? " 'unsafe-eval'" : ""),
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'" + (development ? " ws: wss:" : ""),
    "worker-src 'self'",
    "form-action 'self'",
  ].join("; ");
}
/** @param {{nonce?: string, development?: boolean}} options */
export function getSecurityHeaders(options = {}) {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(options),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(self), geolocation=(self)" },
  ];
}
