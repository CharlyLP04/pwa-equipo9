"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { logoutSession } from "@/lib/security";
import {
  getSessionContext,
  setSessionContext,
  subscribeSessionContext,
  visitorContext,
  getSessionGeneration,
} from "@/lib/security/client-session";
export function useSecuritySession() {
  return useSyncExternalStore(
    subscribeSessionContext,
    getSessionContext,
    () => visitorContext,
  );
}
export function SecuritySessionPanel() {
  const context = useSecuritySession();
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState("inspector.lab");
  const [phrase, setPhrase] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const generation = getSessionGeneration();
      try {
        if (window.localStorage.getItem("utt-revocation-pending")) {
          setSessionContext(visitorContext);
          const response = await fetch("/api/session", { method: "DELETE" });
          if (response.ok)
            window.localStorage.removeItem("utt-revocation-pending");
          return;
        }
        const response = await fetch("/api/session", { cache: "no-store" });
        const value = response.ok ? await response.json() : visitorContext;
        if (active && generation === getSessionGeneration())
          setSessionContext(value);
      } catch {}
    };
    const close = (event: StorageEvent) => {
      if (event.key === "utt-session-closed") {
        setSessionContext(visitorContext);
        setPhrase("");
      }
    };
    void refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener("storage", close);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("storage", close);
    };
  }, []);
  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFeedback("");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, phrase }),
      });
      setPhrase("");
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      window.localStorage.removeItem("utt-revocation-pending");
      setSessionContext(value);
      setFeedback("Identidad comprobada por el servidor.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Acceso no disponible",
      );
    } finally {
      setBusy(false);
    }
  }
  async function closeSession() {
    setBusy(true);
    setSessionContext(visitorContext);
    setPhrase("");
    let localClean = false;
    let remote = false;
    try {
      window.localStorage.setItem("utt-session-closed", String(Date.now()));
      await logoutSession({
        storage: window.localStorage,
        sessionStorage: window.sessionStorage,
        cacheStorage: window.caches,
        indexedDB: window.indexedDB,
      });
      navigator.serviceWorker?.controller?.postMessage({
        type: "CLEAR_PRIVATE_SESSION",
      });
      localClean = true;
    } catch {
      /* La revocación remota se intenta aunque falle el almacenamiento local. */
    } finally {
      try { window.localStorage.setItem("utt-revocation-pending", "1"); } catch { localClean = false; }
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch("/api/session", {
        method: "DELETE",
        signal: controller.signal,
      });
      remote = response.ok;
      if (remote) window.localStorage.removeItem("utt-revocation-pending");
    } catch {
    } finally {
      clearTimeout(timeout);
    }
    setFeedback(
      !localClean
        ? "Limpieza incompleta. Reintenta antes de compartir la tableta."
        : remote
          ? "Sesión revocada y datos locales eliminados."
          : "Datos locales eliminados. Sin conexión no se pudo revocar la sesión del servidor; vuelve a cerrar sesión con red antes de compartir la tableta.",
    );
    setBusy(false);
  }
  return (
    <section aria-label="Acceso" className="inspection-card">
      <h2>Acceso al servidor local</h2>
      <p>
        Datos sintéticos. Rol: {context.role}. Identidad: {context.userId}.
      </p>
      {context.role === "visitor" && (
        <form onSubmit={login}>
          <label>
            Usuario{" "}
            <input
              autoComplete="username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              maxLength={80}
            />
          </label>
          <label>
            Frase de acceso{" "}
            <input
              type="text"
              style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="off"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              required
              maxLength={256}
            />
          </label>
          <button disabled={busy}>Iniciar sesión</button>
        </form>
      )}
      <button type="button" disabled={busy} onClick={closeSession}>
        Cerrar sesión / Limpiar tableta
      </button>
      <p role="status">{feedback}</p>
    </section>
  );
}
