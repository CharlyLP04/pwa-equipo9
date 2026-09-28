"use client";

import React from "react";

export interface LoadingStateProps {
  message?: string;
  variant?: "list" | "detail" | "card";
}

/**
 * Componente accesible de estado de carga (Skeleton Loader)
 * Cumple con estándares WAI-ARIA para anunciar estados asíncronos a lectores de pantalla.
 */
export function LoadingState({
  message = "Cargando datos de inspección de laboratorio...",
  variant = "detail"
}: LoadingStateProps) {
  return (
    <div
      className={`loading-state-container loading-state-${variant}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={message}
    >
      <div className="skeleton-hero">
        <div className="skeleton-line skeleton-badge shimmer" />
        <div className="skeleton-line skeleton-title shimmer" />
        <div className="skeleton-line skeleton-subtitle shimmer" />
      </div>

      {variant === "detail" ? (
        <div className="skeleton-detail-content">
          <div className="skeleton-line skeleton-card-desc shimmer" />
          <div className="skeleton-line skeleton-card-desc shimmer" style={{ width: "85%" }} />
          <div className="skeleton-line skeleton-card-desc shimmer" style={{ width: "65%" }} />
          <div className="skeleton-meta-box">
            <div className="skeleton-line skeleton-stat shimmer" />
            <div className="skeleton-line skeleton-stat shimmer" />
            <div className="skeleton-line skeleton-stat shimmer" />
          </div>
        </div>
      ) : (
        <div className="skeleton-grid">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton-card">
              <div className="skeleton-card-header">
                <div className="skeleton-line skeleton-pill shimmer" />
                <div className="skeleton-line skeleton-date shimmer" />
              </div>
              <div className="skeleton-line skeleton-card-title shimmer" />
              <div className="skeleton-line skeleton-card-desc shimmer" />
              <div className="skeleton-card-footer">
                <div className="skeleton-line skeleton-stat shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}

      <span className="sr-only">{message}</span>
    </div>
  );
}

export default LoadingState;
