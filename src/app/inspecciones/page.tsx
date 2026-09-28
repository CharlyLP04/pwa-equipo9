import Link from "next/link";

import { inspections } from "@/lib/data/inspections";
import { AppShell } from "@/components/app-shell";

export default function InspeccionesPage() {
  return (
    <AppShell
      activeNav="inspecciones"
      statusBadge="PWA Shell Activo · UTT"
    >
      <div className="normal-content-view">
        <header className="hero">
          <p className="eyebrow">
            Universidad Tecnológica de Tehuacán · Semana 04
          </p>

          <h1>Inspecciones de laboratorio</h1>

          <p className="lead">
            Registro de inspecciones de laboratorio renderizado mediante
            Server Component. Los datos mostrados en este sistema son
            sintéticos.
          </p>

          <div className="hero-tags">
            <span className="status">Renderizado: SSR</span>
            <span className="status status-accent">
              Datos: locales y sintéticos
            </span>
          </div>
        </header>

        <section
          aria-labelledby="inspections-heading"
          className="content-section"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Datos sintéticos de demostración</p>
              <h2 id="inspections-heading">Inspecciones recientes</h2>
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