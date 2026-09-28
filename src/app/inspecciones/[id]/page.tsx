"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { inspections, Inspection } from "@/lib/data/inspections";
import { LoadingState } from "@/components/loading-state";

interface SyntheticChecklistItem {
  label: string;
  verified: boolean;
  notes: string;
}

/**
 * Página de Detalle de Inspección (Ruta Dinámica CSR)
 *
 * Justificación Arquitectónica (CSR):
 * Implementada con renderizado en el cliente ("use client") para soportar:
 * 1. Interactividad granular en campo: modificación local de hallazgos y verificación.
 * 2. Transición fluida con estado de carga (skeleton loader) mientras se hidrata.
 * 3. Recuperación controlada ante IDs no encontrados (estado de error) sin abortar la PWA.
 * 4. Compatibilidad con el almacenamiento en caché del Service Worker en modo desconectado.
 */
export default function InspeccionDetallePage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [isLoading, setIsLoading] = useState(true);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [checklist, setChecklist] = useState<SyntheticChecklistItem[]>([
    { label: "Inspección visual de cableado estructurado", verified: true, notes: "Canaletas aseguradas" },
    { label: "Condiciones de ventilación y temperatura", verified: true, notes: "Climatización en rango operativo" },
    { label: "Suministro eléctrico regulado para equipos", verified: false, notes: "Revisar supresor de picos" },
    { label: "Señalética y extintores vigentes", verified: true, notes: "Vigencia verificada en sitio" }
  ]);
  const [interactiveNotice, setInteractiveNotice] = useState<string | null>(null);

  useEffect(() => {
    // Simulación de carga asíncrona de cliente para evidenciar el estado de transición
    const timer = setTimeout(() => {
      const found = inspections.find((item) => item.id.toLowerCase() === id.toLowerCase());
      setInspection(found || null);
      setIsLoading(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [id]);

  const handleToggleChecklist = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, verified: !item.verified } : item))
    );
    setInteractiveNotice("Punto de control actualizado localmente en memoria.");
  };

  const handleToggleStatus = () => {
    if (!inspection) return;
    const nextStatus = inspection.status === "ok" ? "attention" : "ok";
    const nextLabel = nextStatus === "ok" ? "Sin incidencias" : "Requiere atención";
    setInspection({
      ...inspection,
      status: nextStatus,
      statusLabel: nextLabel,
      findings: nextStatus === "ok" ? 0 : inspection.findings + 1
    });
    setInteractiveNotice(`Estado actualizado a: "${nextLabel}".`);
  };

  return (
    <div className="inspection-detail-wrapper" style={{ maxWidth: "860px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Navegación y migas de pan */}
      <nav aria-label="Migas de pan" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--color-muted, #5e6c84)" }}>
          <Link href="/" style={{ color: "var(--color-primary, #0052cc)", textDecoration: "none" }}>
            Inicio
          </Link>
          <span>/</span>
          <Link href="/inspecciones" style={{ color: "var(--color-primary, #0052cc)", textDecoration: "none" }}>
            Inspecciones
          </Link>
          <span>/</span>
          <span aria-current="page" style={{ fontWeight: 600, color: "inherit" }}>
            {id || "Detalle"}
          </span>
        </div>
      </nav>

      <main id="main-content" role="main">
        {isLoading ? (
          <section aria-label="Cargando inspección">
            <LoadingState variant="detail" message={`Cargando detalle de la inspección ${id}...`} />
          </section>
        ) : !inspection ? (
          /* Estado de Error / Inspección no encontrada */
          <section
            role="alert"
            className="detail-not-found-card"
            style={{
              background: "#fff",
              border: "1px solid #dfe1e6",
              borderRadius: "8px",
              padding: "36px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
            <h1 style={{ fontSize: "20px", margin: "0 0 8px 0", color: "#172b4d" }}>
              Inspección no encontrada
            </h1>
            <p style={{ color: "#5e6c84", fontSize: "14px", marginBottom: "24px" }}>
              El identificador <strong>"{id}"</strong> no corresponde a ningún registro sintético disponible en la base local.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <Link
                href="/inspecciones"
                style={{
                  background: "var(--color-primary, #0052cc)",
                  color: "#fff",
                  padding: "10px 18px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "14px"
                }}
              >
                Volver al Listado
              </Link>
              <Link
                href="/"
                style={{
                  background: "#f4f5f7",
                  color: "#172b4d",
                  padding: "10px 18px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "14px",
                  border: "1px solid #dfe1e6"
                }}
              >
                Ir a Inicio
              </Link>
            </div>
          </section>
        ) : (
          /* Contenido Principal de Detalle */
          <article
            className="inspection-card-detail"
            style={{
              background: "#fff",
              border: "1px solid #dfe1e6",
              borderRadius: "8px",
              padding: "28px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}
          >
            <header style={{ borderBottom: "1px solid #ebecf0", paddingBottom: "18px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#5e6c84",
                      marginBottom: "6px"
                    }}
                  >
                    Identificador: {inspection.id}
                  </span>
                  <h1 style={{ margin: 0, fontSize: "24px", color: "#172b4d" }}>
                    {inspection.location}
                  </h1>
                </div>
                <span
                  className={`status-pill ${inspection.status === "ok" ? "status-ok" : "status-attention"}`}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    backgroundColor: inspection.status === "ok" ? "#e3fcef" : "#fff0b3",
                    color: inspection.status === "ok" ? "#006644" : "#172b4d"
                  }}
                >
                  {inspection.statusLabel}
                </span>
              </div>
            </header>

            {/* Metadatos técnicos de la inspección */}
            <section aria-label="Metadatos de la inspección" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "#f4f5f7", padding: "12px 16px", borderRadius: "6px" }}>
                <span style={{ display: "block", fontSize: "12px", color: "#5e6c84", marginBottom: "4px" }}>Fecha programada</span>
                <strong style={{ color: "#172b4d", fontSize: "14px" }}>{inspection.date}</strong>
              </div>
              <div style={{ background: "#f4f5f7", padding: "12px 16px", borderRadius: "6px" }}>
                <span style={{ display: "block", fontSize: "12px", color: "#5e6c84", marginBottom: "4px" }}>Personal técnico</span>
                <strong style={{ color: "#172b4d", fontSize: "14px" }}>{inspection.inspector}</strong>
              </div>
              <div style={{ background: "#f4f5f7", padding: "12px 16px", borderRadius: "6px" }}>
                <span style={{ display: "block", fontSize: "12px", color: "#5e6c84", marginBottom: "4px" }}>Hallazgos reportados</span>
                <strong style={{ color: inspection.findings > 0 ? "#de350b" : "#006644", fontSize: "14px" }}>
                  {inspection.findings} {inspection.findings === 1 ? "observación" : "observaciones"}
                </strong>
              </div>
            </section>

            {/* Resumen ejecutivo */}
            <section aria-label="Resumen de evaluación" style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "16px", margin: "0 0 8px 0", color: "#172b4d" }}>Diagnóstico Inicial</h2>
              <p style={{ color: "#344563", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                {inspection.summary}
              </p>
            </section>

            {/* Puntos de control (Checklist interactivo de cliente) */}
            <section aria-label="Lista de comprobación interactiva" style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "16px", margin: "0 0 12px 0", color: "#172b4d" }}>
                Comprobación de Infraestructura (Interacción CSR)
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {checklist.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleToggleChecklist(idx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: item.verified ? "#fafbfc" : "#fff7d6",
                      border: `1px solid ${item.verified ? "#ebecf0" : "#ffe380"}`,
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "#172b4d", fontWeight: 500 }}>
                      {item.verified ? "✅" : "⚠️"} {item.label}
                    </span>
                    <span style={{ fontSize: "12px", color: "#5e6c84" }}>{item.notes}</span>
                  </li>
                ))}
              </ul>
            </section>

            {interactiveNotice && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  background: "#deebff",
                  color: "#0747a6",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  marginBottom: "20px"
                }}
              >
                ℹ️ {interactiveNotice}
              </div>
            )}

            {/* Barra de acciones interactivas */}
            <footer style={{ display: "flex", gap: "12px", flexWrap: "wrap", borderTop: "1px solid #ebecf0", paddingTop: "18px" }}>
              <button
                type="button"
                onClick={handleToggleStatus}
                style={{
                  background: "var(--color-primary, #0052cc)",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Alternar Estado (Simulación de Auditoría)
              </button>

              <Link
                href="/inspecciones"
                style={{
                  background: "#f4f5f7",
                  color: "#172b4d",
                  border: "1px solid #dfe1e6",
                  padding: "10px 18px",
                  borderRadius: "6px",
                  fontWeight: 500,
                  fontSize: "13px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center"
                }}
              >
                ← Volver al Listado
              </Link>
            </footer>
          </article>
        )}
      </main>
    </div>
  );
}
