"use client";

import { useState } from "react";
import { inspections as initialInspections, Inspection } from "../lib/data/inspections";
import { AppShell, LoadingState, EmptyState, ErrorState } from "../components/app-shell";

type ViewState = "normal" | "loading" | "empty" | "error";

export default function HomePage() {
  const [viewState, setViewState] = useState<ViewState>("normal");
  const [activeNav, setActiveNav] = useState("inspecciones");
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [dataList, setDataList] = useState<Inspection[]>(initialInspections);

  const handleSimulateLoad = () => {
    setViewState("loading");
    setTimeout(() => {
      setViewState("normal");
    }, 1200);
  };

  const handleRetry = () => {
    setViewState("loading");
    setTimeout(() => {
      setViewState("normal");
    }, 800);
  };

  return (
    <AppShell
      activeNav={activeNav}
      onNavSelect={(nav) => setActiveNav(nav)}
      statusBadge={simulatedOffline ? "Modo Offline (Simulado)" : "PWA Shell Activo · UTT"}
    >
      {/* Barra de control para diagnóstico e inspección de estados de resiliencia */}
      <section className="state-switcher-bar" aria-label="Controles de diagnóstico del App Shell">
        <div className="switcher-header">
          <span className="switcher-title">Diagnóstico de Resiliencia del Shell:</span>
          <div className="switcher-buttons" role="group" aria-label="Selector de estado">
            <button
              type="button"
              className={`btn-toggle ${viewState === "normal" ? "active" : ""}`}
              onClick={() => setViewState("normal")}
              id="state-btn-normal"
            >
              Normal
            </button>
            <button
              type="button"
              className={`btn-toggle ${viewState === "loading" ? "active" : ""}`}
              onClick={() => setViewState("loading")}
              id="state-btn-loading"
            >
              Carga (Skeleton)
            </button>
            <button
              type="button"
              className={`btn-toggle ${viewState === "empty" ? "active" : ""}`}
              onClick={() => setViewState("empty")}
              id="state-btn-empty"
            >
              Vacío
            </button>
            <button
              type="button"
              className={`btn-toggle ${viewState === "error" ? "active" : ""}`}
              onClick={() => setViewState("error")}
              id="state-btn-error"
            >
              Error
            </button>
          </div>
        </div>

        <div className="offline-simulator-toggle">
          <label className="toggle-label" htmlFor="offline-mode-checkbox">
            <input
              id="offline-mode-checkbox"
              type="checkbox"
              checked={simulatedOffline}
              onChange={(e) => setSimulatedOffline(e.target.checked)}
            />
            <span>Simular conectividad intermitente / offline</span>
          </label>
        </div>
      </section>

      {/* Renderizado condicional resiliente según el estado activo */}
      {viewState === "loading" && <LoadingState />}

      {viewState === "empty" && (
        <EmptyState
          title="Sin inspecciones pendientes"
          message="No existen reportes pendientes de revisión en los laboratorios de la UTT. Los datos locales están al día."
          onAction={() => {
            setDataList(initialInspections);
            setViewState("normal");
          }}
          actionLabel="Restablecer inspecciones"
        />
      )}

      {viewState === "error" && (
        <ErrorState
          title="Fallo al leer datos de inspecciones"
          message="Se produjo un error al acceder a los datos locales. Esto simula una falla de lectura o sincronización bajo conectividad inestable."
          onRetry={handleRetry}
          retryLabel="Reintentar lectura de datos"
        />
      )}

      {viewState === "normal" && (
        <div className="normal-content-view">
          <header className="hero">
            <p className="eyebrow">Universidad Tecnológica de Tehuacán · Semana 02</p>
            <h1>Inspecciones de laboratorio</h1>
            <p className="lead">
              Registro de mantenimiento y auditoría técnica preparado para operar con
              conectividad intermitente. Los datos mostrados en este sistema son sintéticos.
            </p>
            <div className="hero-tags">
              <span className="status">App Shell: Resiliente e instalable</span>
              <span className="status status-accent">Manifest: standalone</span>
            </div>
          </header>

          <section aria-labelledby="inspections-heading" className="content-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Datos sintéticos de demostración</p>
                <h2 id="inspections-heading">Inspecciones recientes</h2>
              </div>
              <div className="heading-actions">
                <button
                  type="button"
                  className="btn-simulate-refresh"
                  onClick={handleSimulateLoad}
                  title="Simular carga de datos"
                >
                  ↻ Simular recarga
                </button>
                <span className="count">{dataList.length} registros</span>
              </div>
            </div>

            <div className="inspection-grid">
              {dataList.map((inspection) => (
                <article className="inspection-card" key={inspection.id}>
                  <div className="card-topline">
                    <span className={`badge badge-${inspection.status}`}>
                      {inspection.statusLabel}
                    </span>
                    <span className="muted">{inspection.date}</span>
                  </div>
                  <h3>{inspection.location}</h3>
                  <p>{inspection.summary}</p>
                  <dl>
                    <div>
                      <dt>Responsable</dt>
                      <dd>{inspection.inspector}</dd>
                    </div>
                    <div>
                      <dt>Hallazgos</dt>
                      <dd>{inspection.findings}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>

          <footer className="footer">
            <p>
              Aplicaciones Web Progresivas · Universidad Tecnológica de Tehuacán · Equipo 9
            </p>
          </footer>
        </div>
      )}
    </AppShell>
  );
}
