/**
 * Cliente de notificaciones — Semana 06
 * PWA de Inspecciones de Laboratorio.
 *
 * - Permisos solicitados únicamente tras una acción explícita del usuario.
 * - Notificaciones mediante Notification o ServiceWorkerRegistration.
 * - Fallback accesible mediante un evento consumido por la interfaz.
 * - Sin secretos ni datos personales reales.
 */

export type NotificationPermissionState =
  | "default"
  | "granted"
  | "denied";

export type NotificationKind =
  | "sync-pending"
  | "maintenance-scheduled"
  | "general";

export type NotificationFallbackReason =
  | "unsupported"
  | "permission-default"
  | "permission-denied"
  | "delivery-failed";

export interface LocalNotification {
  kind: NotificationKind;
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, string | number | boolean | null>;
}

export interface NotificationFallbackDetail {
  title: string;
  message: string;
  reason: NotificationFallbackReason;
  kind?: NotificationKind;
  role: "status" | "alert";
}

export type NotificationDispatchResult =
  | {
      delivered: true;
      channel: "native" | "service-worker";
      permission: "granted";
    }
  | {
      delivered: false;
      channel: "fallback";
      permission: NotificationPermissionState | "unsupported";
      fallbackReason: NotificationFallbackReason;
    };

export const NOTIFICATION_FALLBACK_EVENT =
  "utt:notification-fallback";

/** Obtiene la API sin asumir que existe durante SSR o en pruebas. */
function getNotificationApi(): typeof Notification | undefined {
  if (
    typeof window === "undefined" ||
    !("Notification" in window)
  ) {
    return undefined;
  }

  const api = window.Notification;

  return typeof api.requestPermission === "function"
    ? api
    : undefined;
}

/** Detecta soporte sin solicitar ningún permiso. */
export function isNotificationSupported(): boolean {
  return getNotificationApi() !== undefined;
}

/** Lee el permiso actual sin abrir el diálogo del navegador. */
export function getNotificationPermission():
  NotificationPermissionState {
  const api = getNotificationApi();

  if (!api) {
    return "default";
  }

  switch (api.permission) {
    case "granted":
      return "granted";
    case "denied":
      return "denied";
    default:
      return "default";
  }
}

function publishFallback(
  reason: NotificationFallbackReason,
  permission: NotificationDispatchResult["permission"],
  notification?: LocalNotification
): NotificationDispatchResult {
  const explanations: Record<
    NotificationFallbackReason,
    string
  > = {
    unsupported:
      "Este navegador no soporta las notificaciones del sistema.",
    "permission-default":
      "No se ha concedido permiso para mostrar notificaciones.",
    "permission-denied":
      "Las notificaciones del sistema están bloqueadas.",
    "delivery-failed":
      "No fue posible mostrar la notificación del sistema."
  };

  const detail: NotificationFallbackDetail = {
    title: notification?.title ?? "Aviso de la aplicación",
    message: [
      notification?.body,
      explanations[reason],
      "El aviso se muestra dentro de la aplicación."
    ]
      .filter(Boolean)
      .join(" "),
    reason,
    kind: notification?.kind,
    role:
      reason === "permission-denied" ||
      reason === "delivery-failed"
        ? "alert"
        : "status"
  };

  // La interfaz escucha este evento y muestra el banner accesible.
  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function" &&
    typeof CustomEvent !== "undefined"
  ) {
    window.dispatchEvent(
      new CustomEvent<NotificationFallbackDetail>(
        NOTIFICATION_FALLBACK_EVENT,
        { detail }
      )
    );
  }

  return {
    delivered: false,
    channel: "fallback",
    permission,
    fallbackReason: reason
  };
}

/**
 * Debe invocarse desde una acción deliberada del técnico,
 * como pulsar el botón "Activar notificaciones".
 *
 * Nunca debe ejecutarse automáticamente al cargar la página.
 */
export async function requestNotificationPermission():
  Promise<NotificationPermissionState | "unsupported"> {
  const api = getNotificationApi();

  if (!api) {
    publishFallback("unsupported", "unsupported");
    return "unsupported";
  }

  const current = getNotificationPermission();

  if (current === "granted") {
    return current;
  }

  if (current === "denied") {
    publishFallback("permission-denied", current);
    return current;
  }

  try {
    const result = await api.requestPermission();

    if (result === "granted") {
      return "granted";
    }

    if (result === "denied") {
      publishFallback("permission-denied", "denied");
      return "denied";
    }

    publishFallback("permission-default", "default");
    return "default";
  } catch (error) {
    console.error(
      "[Notificaciones] No fue posible solicitar el permiso:",
      error
    );

    publishFallback(
      "delivery-failed",
      getNotificationPermission()
    );

    return getNotificationPermission();
  }
}

function toNotificationOptions(
  notification: LocalNotification
): NotificationOptions {
  return {
    body: notification.body,
    tag: notification.tag ?? `utt-${notification.kind}`,
    data: notification.data
  };
}

/** Busca un Service Worker registrado sin fallar durante SSR. */
async function getServiceWorkerRegistration():
  Promise<ServiceWorkerRegistration | undefined> {
  if (
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return undefined;
  }

  try {
    const manager = navigator.serviceWorker;

    if (typeof manager.getRegistration === "function") {
      return await manager.getRegistration();
    }

    return await manager.ready;
  } catch (error) {
    console.warn(
      "[Notificaciones] No se pudo obtener el registro del Service Worker:",
      error
    );
    return undefined;
  }
}

/**
 * Despacha una alerta si existe soporte y permiso.
 * No solicita permisos implícitamente.
 */
export async function dispatchLocalNotification(
  notification: LocalNotification
): Promise<NotificationDispatchResult> {
  const api = getNotificationApi();

  if (!api) {
    return publishFallback(
      "unsupported",
      "unsupported",
      notification
    );
  }

  const permission = getNotificationPermission();

  if (permission === "denied") {
    return publishFallback(
      "permission-denied",
      permission,
      notification
    );
  }

  if (permission !== "granted") {
    return publishFallback(
      "permission-default",
      permission,
      notification
    );
  }

  const options = toNotificationOptions(notification);

  // Preferir el Service Worker si ya existe un registro disponible.
  try {
    const registration = await getServiceWorkerRegistration();

    if (
      registration &&
      typeof registration.showNotification === "function"
    ) {
      await registration.showNotification(
        notification.title,
        options
      );

      return {
        delivered: true,
        channel: "service-worker",
        permission: "granted"
      };
    }
  } catch (error) {
    console.error(
      "[Notificaciones] Falló ServiceWorkerRegistration.showNotification():",
      error
    );
  }

  try {
    new api(notification.title, options);

    return {
      delivered: true,
      channel: "native",
      permission: "granted"
    };
  } catch (error) {
    console.error(
      "[Notificaciones] Falló el constructor Notification:",
      error
    );

    return publishFallback(
      "delivery-failed",
      "granted",
      notification
    );
  }
}

/** Alerta local cuando quedan operaciones pendientes de sincronizar. */
export function notifyPendingSync(
  pendingCount = 1
): Promise<NotificationDispatchResult> {
  const count = Number.isFinite(pendingCount)
    ? Math.max(1, Math.floor(pendingCount))
    : 1;

  return dispatchLocalNotification({
    kind: "sync-pending",
    title: "Sincronización pendiente",
    body:
      `Hay ${count} operación(es) de inspección ` +
      "pendientes de sincronización.",
    tag: "utt-sync-pending",
    data: { pendingCount: count }
  });
}

/** Alerta local sobre un mantenimiento programado. */
export function notifyMaintenanceScheduled(
  laboratoryName: string,
  scheduledAt: string
): Promise<NotificationDispatchResult> {
  const laboratory =
    laboratoryName.trim() || "Laboratorio seleccionado";

  const schedule =
    scheduledAt.trim() || "Fecha pendiente de confirmar";

  return dispatchLocalNotification({
    kind: "maintenance-scheduled",
    title: "Mantenimiento programado",
    body: `${laboratory}. Fecha programada: ${schedule}.`,
    tag: `utt-maintenance-${laboratory}`,
    data: {
      laboratory,
      scheduledAt: schedule
    }
  });
}
