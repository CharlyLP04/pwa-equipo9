import type { SecurityContext } from "./rbac";
export const visitorContext: SecurityContext = {
  userId: "visitor",
  role: "visitor",
  assignedLaboratories: [],
};
let context = visitorContext;
let generation = 0;
let expiry: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
export function getSessionContext() {
  return context;
}
export function getSessionGeneration() {
  return generation;
}
export function setSessionContext(next: SecurityContext) {
  if (JSON.stringify(context) === JSON.stringify(next)) return;
  if (expiry) clearTimeout(expiry);
  context = next;
  generation++;
  if (next.role !== "visitor")
    expiry = setTimeout(() => setSessionContext(visitorContext), 1800000);
  listeners.forEach((fn) => fn());
}
export function subscribeSessionContext(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
