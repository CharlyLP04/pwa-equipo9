import Link from "next/link";

import { inspections } from "@/lib/data/inspections";
import { AppShell } from "@/components/app-shell";
import { InspectionSyncManager } from "@/components/inspection-sync-manager";

export default function InspeccionesPage() {
  return (
    <AppShell
      activeNav="inspecciones"
      statusBadge="PWA Shell Activo · UTT"
    >
      <div className="normal-content-view">
        <header className="hero">
          <p className="eyebrow">
            Universidad Tecnológica de Tehuacán · Mantenimiento Preventivo
          </p>

          <h1>Inspecciones de laboratorio</h1>

          <p className="lead">
            Registro y captura de inspecciones de laboratorio con soporte Offline-First,
            sincronización idempotente y capacidades de dispositivo integradas.
          </p>

          <div className="hero-tags">
            <span className="status">Renderizado: SSR + Hidratación CSR</span>
            <span className="status status-accent">
              Persistencia: Offline-First + Outbox
            </span>
          </div>
        </header>

        {/* Panel interactivo de captura en campo, capacidades de hardware y sincronización */}
        <InspectionSyncManager />

        <section
          aria-labelledby="inspections-heading"
          className="content-section"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catálogo del servidor / datos sintéticos</p>
              <h2 id="inspections-heading">Inspecciones del servidor</h2>
            </div>

            <span className="count">{inspections.length} registros</span>
          </div>

          <div className="inspection-grid">
            {inspections.map((inspection) => (
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

                <Link
                  href={`/inspecciones/${inspection.id}`}
                  className="btn-simulate-refresh"
                >
                  Ver detalle
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}