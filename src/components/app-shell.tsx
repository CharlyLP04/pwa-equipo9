"use client";

import React, { ReactNode, useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/register-service-worker";

export interface AppShellProps {
  children?: ReactNode;
  activeNav?: string;
  onNavSelect?: (navId: string) => void;
  statusBadge?: string;
}

export function LoadingState() {
  return (
    <div
      className="shell-loading-state"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Cargando inspecciones de laboratorio..."
    >
      <div className="skeleton-hero">
        <div className="skeleton-line skeleton-badge shimmer" />
        <div className="skeleton-line skeleton-title shimmer" />
        <div className="skeleton-line skeleton-subtitle shimmer" />
      </div>

      <div className="skeleton-grid">
        {[1, 2, 3].map((item) => (
          <div key={item} className="skeleton-card">
            <div className="skeleton-card-header">
              <div className="skeleton-line skeleton-pill shimmer" />
              <div className="skeleton-line skeleton-date shimmer" />
            </div>
            <div className="skeleton-line skeleton-card-title shimmer" />
            <div className="skeleton-line skeleton-card-desc shimmer" />
            <div className="skeleton-line skeleton-card-desc shimmer" style={{ width: "70%" }} />
            <div className="skeleton-card-footer">
              <div className="skeleton-line skeleton-stat shimmer" />
              <div className="skeleton-line skeleton-stat shimmer" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Simulando lectura de inspecciones locales...</span>
    </div>
  );
}

export interface EmptyStateProps {
  title?: string;
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function EmptyState({
  title = "Sin inspecciones pendientes",
  message = "No se encontraron registros activos de mantenimiento para los laboratorios en este momento.",
  onAction,
  actionLabel = "Actualizar registros"
}: EmptyStateProps) {
  return (
    <div className="shell-state-card empty-state" role="region" aria-label="Sin registros">
      <div className="state-icon-wrapper empty-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 className="state-title">{title}</h2>
      <p className="state-description">{message}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-state-action"
          id="empty-action-btn"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Error de lectura en almacenamiento local",
  message = "Ocurrió una falla al intentar leer los datos sintéticos de inspecciones. La conexión podría ser intermitente.",
  onRetry,
  retryLabel = "Reintentar lectura"
}: ErrorStateProps) {
  return (
    <div className="shell-state-card error-state" role="alert" aria-live="assertive">
      <div className="state-icon-wrapper error-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="state-title">{title}</h2>
      <p className="state-description">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-state-retry"
          id="retry-button"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function AppShell({
  children,
  activeNav = "inspecciones",
  onNavSelect,
  statusBadge = "PWA Shell Activo"
}: AppShellProps) {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  
   const navItems = [
    {
      id: "inspecciones",
      label: "Inspecciones",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    },
    {
      id: "laboratorios",
      label: "Laboratorios",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )
    },
    {
      id: "historial",
      label: "Historial",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      id: "ajustes",
      label: "Ajustes",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  return (
    <div className="app-shell-root">
      {/* 1. Header superior con título del laboratorio de la UTT */}
      <header className="app-header" role="banner">
        <div className="header-content">
          <div className="brand-group">
            <div className="utt-logo-emblem" aria-hidden="true">
              <span>UTT</span>
            </div>
            <div>
              <p className="header-subtitle">Universidad Tecnológica de Tehuacán</p>
              <h1 className="header-title">Laboratorio de Cómputo e Informática</h1>
            </div>
          </div>
          <div className="header-actions">
            <span className="pwa-status-pill" id="pwa-shell-indicator">
              <span className="status-dot" aria-hidden="true" />
              {statusBadge}
            </span>
          </div>
        </div>
      </header>

      {/* Contenedor con Navegación y Main */}
      <div className="app-body-container">
        {/* 2. Barra de navegación accesible (lateral en desktop, inferior en móvil) */}
        <nav className="app-nav" aria-label="Navegación principal" role="navigation">
          <ul className="nav-list">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <li key={item.id} className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onNavSelect?.(item.id)}
                    id={`nav-${item.id}`}
                  >
                    <span className="nav-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="nav-text">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 3. Contenedor de contenido principal */}
        <main id="main-content" className="app-main" role="main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
