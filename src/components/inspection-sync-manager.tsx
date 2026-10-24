"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  SyncQueue,
  createIdempotentServer,
  DEFAULT_STORAGE_KEY,
  OutboxOperation,
} from "@/lib/sync/queue";
import {
  isLocalInspectionRecord,
  LocalInspectionRecord,
} from "@/lib/storage/schema";
import { captureWithFallback, CameraCaptureResult } from "@/lib/device/camera";
import { getLocationWithFallback, GeoLocationResult } from "@/lib/device/geolocation";
import { dispatchLocalNotification } from "@/lib/notifications/client";

const LOCAL_STORAGE_INSPECTIONS_KEY = "utt-local-inspections";

/** Almacenamiento adaptado para localStorage del navegador */
function getBrowserStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    return {
      read: () => null,
      write: () => {},
    };
  }
  return {
    read: (k: string) => window.localStorage.getItem(k),
    write: (k: string, v: string) => window.localStorage.setItem(k, v),
  };
}

export function InspectionSyncManager() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Formulario de captura
  const [location, setLocation] = useState<string>("Laboratorio de Redes y Telecomunicaciones");
  const [inspector, setInspector] = useState<string>("Técnico de Auditoría");
  const [status, setStatus] = useState<"ok" | "attention">("ok");
  const [findings, setFindings] = useState<number>(0);
  const [summary, setSummary] = useState<string>("Revisión preventiva de equipos y cableado en laboratorio.");

  // Capacidades de hardware (Semana 06)
  const [cameraResult, setCameraResult] = useState<CameraCaptureResult | null>(null);
  const [geoResult, setGeoResult] = useState<GeoLocationResult | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Inspecciones locales capturadas
  const [localInspections, setLocalInspections] = useState<LocalInspectionRecord[]>([]);

  // Instancia de cola
  const getQueue = useCallback(() => {
    return new SyncQueue({
      storage: getBrowserStorage(),
      storageKey: DEFAULT_STORAGE_KEY,
    });
  }, []);

  // Actualizar conteo de operaciones pendientes
  const updatePendingCount = useCallback(() => {
    try {
      const q = getQueue();
      const counts = q.countByStatus();
      setPendingCount(counts.pending + counts.inFlight);
    } catch {
      setPendingCount(0);
    }
  }, [getQueue]);

  // Cargar inspecciones locales
  const loadLocalInspections = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_INSPECTIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLocalInspections(parsed);
        }
      }
    } catch (e) {
      console.warn("Error leyendo inspecciones locales:", e);
    }
  }, []);

  // Sincronización con el servidor idempotente
  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const q = getQueue();
      const server = createIdempotentServer({ deduplicationEnabled: true });

      const result = await q.process(async (op: OutboxOperation) => {
        return server.handle(op);
      });

      // Purgar confirmadas de la cola
      const cleared = q.dequeueDone();
      updatePendingCount();

      if (result.done > 0 || cleared > 0) {
        setSyncFeedback(`Sincronización exitosa: ${result.done} operación(es) confirmada(s) con el servidor.`);
        await dispatchLocalNotification({
          kind: "sync-pending",
          title: "Sincronización completada",
          body: `Se sincronizaron ${result.done} registros de inspección con el servidor.`,
        });
      } else if (result.skipped > 0) {
        setSyncFeedback("Cola de sincronización al día. No hay operaciones pendientes.");
      } else {
        setSyncFeedback("No hay operaciones pendientes de sincronizar.");
      }
    } catch (error) {
      setSyncFeedback("Error en la sincronización. Se reintentará con backoff automático.");
    } finally {
      setIsSyncing(false);
    }
  }, [getQueue, isSyncing, updatePendingCount]);

  // Listener de conectividad y carga inicial
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(window.navigator.onLine);
    updatePendingCount();
    loadLocalInspections();

    const handleOnline = () => {
      setIsOnline(true);
      setSyncFeedback("Conexión reestablecida. Iniciando sincronización automática de la cola...");
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncFeedback("Modo sin conexión activado. Las nuevas capturas se guardarán en la cola local.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleSync, loadLocalInspections, updatePendingCount]);

  // Captura de foto con fallback (Semana 06)
  const handleCapturePhoto = async () => {
    setIsCapturingPhoto(true);
    try {
      const result = await captureWithFallback({
        allowSyntheticFallback: true,
        syntheticInspectionId: `insp-${Date.now()}`,
      });
      setCameraResult(result);
    } catch (err) {
      console.warn("Fallo al capturar foto:", err);
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  // Detección de laboratorio por GPS con fallback (Semana 06)
  const handleDetectLocation = async () => {
    setIsLocating(true);
    try {
      const result = await getLocationWithFallback(location, {
        allowManualFallback: true,
      });
      setGeoResult(result);
      if (result.laboratoryTag) {
        setLocation(result.laboratoryTag);
      }
    } catch (err) {
      console.warn("Fallo al detectar ubicación:", err);
    } finally {
      setIsLocating(false);
    }
  };

  // Guardado de inspección (Offline-First)
  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();

    const newId = `insp-loc-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const record: LocalInspectionRecord = {
      id: newId,
      location,
      date: nowIso.slice(0, 10),
      inspector: inspector.trim() || "Técnico en campo",
      status,
      statusLabel: status === "ok" ? "Sin incidencias" : "Requiere atención",
      findings: Number(findings) || 0,
      summary: summary.trim() || "Inspección rutinaria capturada en campo.",
      version: 1,
      updatedAt: nowIso,
    };

    if (!isLocalInspectionRecord(record)) {
      setSyncFeedback("Error: Los datos de la inspección no cumplen el esquema requerido.");
      return;
    }

    // 1. Guardar localmente en localStorage
    try {
      const currentRaw = window.localStorage.getItem(LOCAL_STORAGE_INSPECTIONS_KEY);
      const list: LocalInspectionRecord[] = currentRaw ? JSON.parse(currentRaw) : [];
      list.unshift(record);
      window.localStorage.setItem(LOCAL_STORAGE_INSPECTIONS_KEY, JSON.stringify(list));
      setLocalInspections(list);
    } catch (err) {
      console.error("Error guardando inspección en storage local:", err);
    }

    // 2. Encolar en la outbox de SyncQueue
    try {
      const q = getQueue();
      q.enqueue({
        operationId: `op-${record.id}`,
        entityId: record.id,
        type: "CREATE_INSPECTION",
        payload: record,
        revision: 1,
      });
      updatePendingCount();
    } catch (err) {
      console.error("Error encolando operación en outbox:", err);
    }

    // 3. Si hay red, sincronizar de inmediato; si no, avisar al usuario
    if (window.navigator.onLine) {
      setSyncFeedback(`Inspección ${record.id} registrada. Sincronizando con el servidor...`);
      await handleSync();
    } else {
      setSyncFeedback(
        `Inspección ${record.id} guardada localmente en la cola offline. Se sincronizará automáticamente al recuperar red.`
      );
    }

    // Limpiar formulario y evidencias temporales
    setFindings(0);
    setSummary("Revisión preventiva de equipos y cableado en laboratorio.");
    setCameraResult(null);
    setGeoResult(null);
  };

  return (
    <div className="sync-integration-container" style={{ marginBottom: "32px" }}>
      {/* 1. Barra de Estado de Conexión y Cola Outbox */}
      <section
        aria-label="Panel de sincronización offline"
        style={{
          background: "var(--surface, #ffffff)",
          border: "1px solid var(--line, #cbd5e1)",
          borderRadius: "var(--radius-md, 14px)",
          padding: "18px 24px",
          marginBottom: "24px",
          boxShadow: "var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: isOnline ? "#059669" : "#dc2626",
                boxShadow: isOnline ? "0 0 8px #10b981" : "0 0 8px #ef4444",
              }}
            />
            <div>
              <strong style={{ fontSize: "14px", color: "var(--ink, #0f172a)" }}>
                {isOnline ? "Conexión Activa · En Línea" : "Sin Conexión · Modo Offline"}
              </strong>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--muted, #475569)" }}>
                {isOnline
                  ? "Las capturas se sincronizan de inmediato con el servidor."
                  : "Los datos se almacenan en la cola local de salida (Outbox)."}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: pendingCount > 0 ? "#b45309" : "#047857",
                background: pendingCount > 0 ? "#fef3c7" : "#ecfdf5",
                padding: "6px 14px",
                borderRadius: "999px",
                border: `1px solid ${pendingCount > 0 ? "#fde68a" : "#a7f3d0"}`,
              }}
            >
              {pendingCount > 0
                ? `⏳ ${pendingCount} pendiente(s) en cola`
                : "✅ Cola sincronizada"}
            </span>

            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing || !isOnline}
              style={{
                background: isOnline ? "var(--accent, #2563eb)" : "#94a3b8",
                color: "#ffffff",
                border: "none",
                borderRadius: "var(--radius-sm, 8px)",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: isOnline && !isSyncing ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isSyncing ? "Sincronizando..." : "🔄 Sincronizar Ahora"}
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginTop: "14px",
              padding: "10px 14px",
              borderRadius: "6px",
              fontSize: "13px",
              backgroundColor: syncFeedback.includes("Error") ? "#fef2f2" : "#eff6ff",
              color: syncFeedback.includes("Error") ? "#dc2626" : "#1d4ed8",
              border: `1px solid ${syncFeedback.includes("Error") ? "#fecaca" : "#bfdbfe"}`,
            }}
          >
            ℹ️ {syncFeedback}
          </div>
        )}
      </section>

      {/* 2. Formulario de Captura en Campo con Hardware Integrado */}
      <section
        aria-labelledby="capture-heading"
        style={{
          background: "var(--surface, #ffffff)",
          border: "1px solid var(--line, #cbd5e1)",
          borderRadius: "var(--radius-md, 14px)",
          padding: "24px",
          marginBottom: "28px",
          boxShadow: "var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))",
        }}
      >
        <div style={{ marginBottom: "18px" }}>
          <p className="eyebrow" style={{ color: "var(--accent, #2563eb)", fontSize: "12px", margin: "0 0 4px" }}>
            Captura de Campo Offline-First · Semana 05 & 06
          </p>
          <h2 id="capture-heading" style={{ margin: 0, fontSize: "18px", color: "var(--ink, #0f172a)" }}>
            Registrar nueva inspección en laboratorio
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted, #475569)" }}>
            Permite capturar hallazgos en laboratorios con o sin cobertura de red. Integra geolocalización, evidencia fotográfica y encolado outbox.
          </p>
        </div>

        <form onSubmit={handleSaveInspection}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "18px" }}>
            {/* Ubicación / Laboratorio con botón GPS */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                Ubicación / Laboratorio UTT
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: "13px",
                  }}
                  placeholder="Ej. Laboratorio de Redes (Edificio F)"
                />
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  title="Detectar laboratorio más cercano con la API de Geolocalización"
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--line, #cbd5e1)",
                    background: "var(--surface-subtle, #f8fafc)",
                    cursor: isLocating ? "wait" : "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {isLocating ? "Detectando..." : "📍 GPS UTT"}
                </button>
              </div>
              {geoResult && (
                <span style={{ display: "block", fontSize: "11px", color: "#059669", marginTop: "4px" }}>
                  ✓ Laboratorio asignado por GPS: {geoResult.laboratoryTag} {geoResult.fallbackUsed ? "(Modo fallback)" : ""}
                </span>
              )}
            </div>

            {/* Inspector */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                Auditor / Responsable
              </label>
              <input
                type="text"
                required
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--line, #cbd5e1)",
                  fontSize: "13px",
                }}
                placeholder="Nombre del técnico"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "18px" }}>
            {/* Estado */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                Estado inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "ok" | "attention")}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--line, #cbd5e1)",
                  fontSize: "13px",
                  background: "#fff",
                }}
              >
                <option value="ok">Sin incidencias (Conforme)</option>
                <option value="attention">Requiere atención (Observaciones)</option>
              </select>
            </div>

            {/* Hallazgos */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                Número de hallazgos
              </label>
              <input
                type="number"
                min="0"
                value={findings}
                onChange={(e) => setFindings(Math.max(0, parseInt(e.target.value || "0", 10)))}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--line, #cbd5e1)",
                  fontSize: "13px",
                }}
              />
            </div>

            {/* Botón de Cámara (Evidencia Fotográfica) */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                Evidencia fotográfica
              </label>
              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={isCapturingPhoto}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px dashed var(--accent, #2563eb)",
                  background: cameraResult ? "#ecfdf5" : "var(--surface-subtle, #f8fafc)",
                  color: cameraResult ? "#065f46" : "var(--ink, #0f172a)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: isCapturingPhoto ? "wait" : "pointer",
                }}
              >
                {isCapturingPhoto
                  ? "Accediendo a cámara..."
                  : cameraResult
                  ? "✓ Foto adjunta (clic para retoma)"
                  : "📷 Capturar evidencia fotográfica"}
              </button>
              {cameraResult && (
                <span style={{ display: "block", fontSize: "11px", color: "#059669", marginTop: "4px" }}>
                  {cameraResult.fallbackUsed
                    ? "✓ Evidencia sintética adjunta (1920x1080 JPEG)"
                    : `✓ Foto de hardware capturada (${cameraResult.sizeBytes} B)`}
                </span>
              )}
            </div>
          </div>

          {/* Diagnóstico / Resumen */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
              Diagnóstico y resumen de la inspección
            </label>
            <textarea
              rows={2}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--line, #cbd5e1)",
                fontSize: "13px",
                fontFamily: "inherit",
              }}
              placeholder="Describa el estado del laboratorio y observaciones encontradas..."
            />
          </div>

          <button
            type="submit"
            style={{
              background: "var(--accent, #2563eb)",
              color: "#ffffff",
              border: "none",
              borderRadius: "var(--radius-sm, 8px)",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            💾 Guardar Inspección (Local + Outbox)
          </button>
        </form>
      </section>

      {/* 3. Listado de Inspecciones Capturadas Localmente */}
      {localInspections.length > 0 && (
        <section
          aria-labelledby="local-inspections-heading"
          style={{
            background: "var(--surface, #ffffff)",
            border: "1px solid var(--line, #cbd5e1)",
            borderRadius: "var(--radius-md, 14px)",
            padding: "24px",
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <p className="eyebrow" style={{ color: "var(--accent, #2563eb)", fontSize: "12px", margin: "0 0 2px" }}>
                Almacenamiento Local (Persistente)
              </p>
              <h2 id="local-inspections-heading" style={{ margin: 0, fontSize: "18px", color: "var(--ink, #0f172a)" }}>
                Inspecciones registradas en este dispositivo
              </h2>
            </div>
            <span className="count" style={{ fontSize: "12px" }}>
              {localInspections.length} local(es)
            </span>
          </div>

          <div className="inspection-grid">
            {localInspections.map((insp) => (
              <article className="inspection-card" key={insp.id}>
                <div className="card-topline">
                  <span className={`badge badge-${insp.status}`}>{insp.statusLabel}</span>
                  <span className="muted" style={{ fontSize: "11px" }}>
                    {insp.date} · Local
                  </span>
                </div>

                <h3 style={{ fontSize: "15px", margin: "10px 0 6px" }}>{insp.location}</h3>
                <p style={{ fontSize: "13px", color: "var(--muted, #475569)" }}>{insp.summary}</p>

                <dl style={{ fontSize: "12px", margin: "10px 0" }}>
                  <div>
                    <dt style={{ color: "var(--muted, #475569)" }}>ID Local</dt>
                    <dd style={{ fontWeight: 600 }}>{insp.id}</dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--muted, #475569)" }}>Auditor</dt>
                    <dd>{insp.inspector}</dd>
                  </div>
                  <div>
                    <dt style={{ color: "var(--muted, #475569)" }}>Hallazgos</dt>
                    <dd>{insp.findings}</dd>
                  </div>
                </dl>

                <Link href={`/inspecciones/${insp.id}`} className="btn-simulate-refresh">
                  Ver detalle local
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
