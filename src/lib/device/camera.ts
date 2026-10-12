/**
 * Módulo de Cámara y Evidencia Fotográfica — Semana 06
 * PWA de Inspecciones de Laboratorio (UTT) · Datos exclusivamente sintéticos.
 *
 * Responsabilidades (ver docs/capabilities.md):
 *  - isCameraSupported: Detección segura de MediaDevices y getUserMedia en navegador.
 *  - queryCameraPermission: Consulta no invasiva del estado de permiso mediante Permissions API.
 *  - requestCameraStream: Solicitud de flujo de video con permisos mínimos just-in-time.
 *  - stopMediaStream: Liberación estricta e inmediata de pistas de hardware (apaga indicadores LED).
 *  - capturePhotoFromStream: Extracción de fotograma mediante Canvas hacia imagen comprimida.
 *  - captureWithFallback: Orquestador con fallback funcional ante rechazo, hardware ausente o SSR.
 *  - createSyntheticPhotoEvidence: Generación de evidencia sintética determinista para pruebas y CI.
 */

export type CameraPermissionState = "granted" | "denied" | "prompt" | "unsupported";

export type CameraFallbackReason =
  | "permission_denied"
  | "device_not_found"
  | "not_supported"
  | "user_cancelled"
  | "hardware_error"
  | "offline_fallback";

export interface CameraCaptureResult {
  success: boolean;
  photoDataUri?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  fallbackUsed: boolean;
  fallbackReason?: CameraFallbackReason;
  errorMessage?: string;
  timestamp: string;
}

export interface CameraStreamResult {
  stream: MediaStream | null;
  error?: {
    reason: CameraFallbackReason;
    message: string;
  };
}

export interface CameraCaptureOptions {
  width?: number;
  height?: number;
  facingMode?: "environment" | "user";
  quality?: number;
  allowSyntheticFallback?: boolean;
  syntheticInspectionId?: string;
}

/** Comprueba si el entorno cliente soporta la captura directa de video por cámara. */
export function isCameraSupported(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return Boolean(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

/**
 * Consulta el estado actual del permiso de cámara sin solicitarlo al usuario.
 * Respeta la política de permisos mínimos just-in-time.
 */
export async function queryCameraPermission(): Promise<CameraPermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions || typeof navigator.permissions.query !== "function") {
    return isCameraSupported() ? "prompt" : "unsupported";
  }

  try {
    const status = await navigator.permissions.query({ name: "camera" as PermissionName });
    return status.state as CameraPermissionState;
  } catch {
    // Algunos navegadores no implementan 'camera' en el descriptor de Permissions API.
    return isCameraSupported() ? "prompt" : "unsupported";
  }
}

/**
 * Solicita el flujo de la cámara únicamente ante una acción explícita del usuario.
 * Garantiza captura de excepciones estructuradas sin romper el hilo de ejecución.
 */
export async function requestCameraStream(
  constraints: MediaStreamConstraints = { video: { facingMode: "environment" }, audio: false }
): Promise<CameraStreamResult> {
  if (!isCameraSupported()) {
    return {
      stream: null,
      error: {
        reason: "not_supported",
        message: "La API de cámara (getUserMedia) no está disponible en este navegador o contexto seguro."
      }
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { stream };
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string };
    const errName = errorObj?.name || "";

    if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
      return {
        stream: null,
        error: {
          reason: "permission_denied",
          message: "El usuario o el navegador denegó el acceso a la cámara."
        }
      };
    }

    if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
      return {
        stream: null,
        error: {
          reason: "device_not_found",
          message: "No se encontró ningún dispositivo de captura de video conectado."
        }
      };
    }

    return {
      stream: null,
      error: {
        reason: "hardware_error",
        message: errorObj?.message || "Ocurrió un error inesperado al inicializar la cámara."
      }
    };
  }
}

/**
 * Libera de forma inmediata todas las pistas activas del MediaStream.
 * Apaga físicamente el sensor y el indicador luminoso del dispositivo.
 */
export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  try {
    const tracks = stream.getTracks();
    for (const track of tracks) {
      track.stop();
    }
  } catch {
    // Supresión segura de errores de liberación en entornos simulados
  }
}

/**
 * Captura un fotograma del flujo de video y lo convierte a Data URI.
 * Libera el stream al concluir para evitar fugas de hardware.
 */
export async function capturePhotoFromStream(
  stream: MediaStream,
  options: { width?: number; height?: number; quality?: number; stopAfterCapture?: boolean } = {}
): Promise<CameraCaptureResult> {
  const width = options.width || 640;
  const height = options.height || 480;
  const quality = options.quality ?? 0.85;
  const stopAfter = options.stopAfterCapture !== false;
  const nowIso = new Date().toISOString();

  if (typeof document === "undefined") {
    if (stopAfter) stopMediaStream(stream);
    return {
      success: false,
      fallbackUsed: true,
      fallbackReason: "not_supported",
      errorMessage: "No hay entorno DOM (document) para renderizar canvas de captura.",
      timestamp: nowIso
    };
  }

  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.playsInline = true;
    video.muted = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play().then(resolve).catch(reject);
      };
      video.onerror = () => reject(new Error("Error al inicializar el elemento video para captura."));
      // Límite de espera de 2 segundos para no bloquear la interfaz
      setTimeout(() => resolve(), 2000);
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      if (stopAfter) stopMediaStream(stream);
      return {
        success: false,
        fallbackUsed: true,
        fallbackReason: "hardware_error",
        errorMessage: "No se pudo obtener el contexto 2D del Canvas de captura.",
        timestamp: nowIso
      };
    }

    ctx.drawImage(video, 0, 0, width, height);
    const dataUri = canvas.toDataURL("image/jpeg", quality);

    if (stopAfter) {
      stopMediaStream(stream);
    }

    return {
      success: true,
      photoDataUri: dataUri,
      mimeType: "image/jpeg",
      sizeBytes: Math.round((dataUri.length * 3) / 4),
      width,
      height,
      fallbackUsed: false,
      timestamp: nowIso
    };
  } catch (error: unknown) {
    if (stopAfter) stopMediaStream(stream);
    const errMessage = error instanceof Error ? error.message : "Error durante la captura en Canvas";
    return {
      success: false,
      fallbackUsed: true,
      fallbackReason: "hardware_error",
      errorMessage: errMessage,
      timestamp: nowIso
    };
  }
}

/**
 * Genera una imagen sintética en base64 de tamaño controlado.
 * Permite ejecutar pruebas de regresión, integración continua y entornos offline sin hardware.
 */
export function createSyntheticPhotoEvidence(
  inspectionId = "insp-synthetic",
  label = "Evidencia de Mantenimiento Sintética"
): CameraCaptureResult {
  const width = 320;
  const height = 240;
  const nowIso = new Date().toISOString();

  // Representación vectorial SVG sintética sin dependencias binarias externas
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#1e293b"/>
    <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="8" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="160" cy="100" r="36" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
    <circle cx="160" cy="100" r="16" fill="#38bdf8"/>
    <text x="160" y="165" font-family="sans-serif" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle">${label}</text>
    <text x="160" y="185" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">ID: ${inspectionId}</text>
    <text x="160" y="205" font-family="sans-serif" font-size="9" fill="#64748b" text-anchor="middle">Marca temporal: ${nowIso}</text>
  </svg>`.trim();

  let encoded = "";
  if (typeof Buffer !== "undefined") {
    encoded = Buffer.from(svgContent, "utf-8").toString("base64");
  } else if (typeof btoa !== "undefined") {
    encoded = btoa(unescape(encodeURIComponent(svgContent)));
  } else {
    encoded = "PHN2Zz48L3N2Zz4=";
  }

  const dataUri = `data:image/svg+xml;base64,${encoded}`;

  return {
    success: true,
    photoDataUri: dataUri,
    mimeType: "image/svg+xml",
    sizeBytes: dataUri.length,
    width,
    height,
    fallbackUsed: true,
    fallbackReason: "offline_fallback",
    timestamp: nowIso
  };
}

/**
 * Orquestador de alto nivel con fallback progresivo:
 *  1. Intenta solicitar la cámara real bajo consentimiento.
 *  2. Si falla o el permiso es denegado y se permite fallback, devuelve evidencia sintética sin colapsar.
 *  3. Si no se permite fallback, retorna el resultado con el motivo detallado de rechazo.
 */
export async function captureWithFallback(
  options: CameraCaptureOptions = {}
): Promise<CameraCaptureResult> {
  const allowFallback = options.allowSyntheticFallback !== false;
  const inspectionId = options.syntheticInspectionId || "insp-offline-default";

  const streamResult = await requestCameraStream({
    video: { facingMode: options.facingMode || "environment" },
    audio: false
  });

  if (!streamResult.stream) {
    if (allowFallback) {
      const synthetic = createSyntheticPhotoEvidence(inspectionId, "Evidencia de Contingencia (Fallback)");
      synthetic.fallbackReason = streamResult.error?.reason || "not_supported";
      synthetic.errorMessage = streamResult.error?.message;
      return synthetic;
    }

    return {
      success: false,
      fallbackUsed: false,
      fallbackReason: streamResult.error?.reason || "hardware_error",
      errorMessage: streamResult.error?.message || "No fue posible acceder a la cámara.",
      timestamp: new Date().toISOString()
    };
  }

  return capturePhotoFromStream(streamResult.stream, {
    width: options.width,
    height: options.height,
    quality: options.quality,
    stopAfterCapture: true
  });
}
