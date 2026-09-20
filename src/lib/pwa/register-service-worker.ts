export function registerServiceWorker(): void {
    if (typeof window === "undefined") {
      return;
    }
  
    if (!("serviceWorker" in navigator)) {
      console.warn("Este navegador no soporta Service Workers.");
      return;
    }
  
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "Service Worker registrado correctamente:",
            registration.scope
          );
  
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
  
            if (!newWorker) {
              return;
            }
  
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  console.log("Nueva versión del Service Worker disponible.");
                } else {
                  console.log("Contenido disponible para trabajar offline.");
                }
              }
            });
          });
        })
        .catch((error: unknown) => {
          console.error("Error al registrar el Service Worker:", error);
        });
    });
  
    window.addEventListener("online", () => {
      console.log("Conexión a Internet recuperada.");
    });
  
    window.addEventListener("offline", () => {
      console.warn("Sin conexión a Internet. Modo offline activado.");
    });
  }