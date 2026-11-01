export interface PolicyOptions {
  nonce?: string;
  development?: boolean;
}
export function buildContentSecurityPolicy(options?: PolicyOptions): string;
export function getSecurityHeaders(
  options?: PolicyOptions,
): Array<{ key: string; value: string }>;
