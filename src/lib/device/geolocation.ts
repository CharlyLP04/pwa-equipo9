/**
 * Módulo de Geolocalización y Asignación de Laboratorio — Semana 06
 * PWA de Inspecciones de Laboratorio (UTT) · Datos exclusivamente sintéticos.
 *
 * Responsabilidades (ver docs/capabilities.md):
 *  - isGeolocationSupported: Detección segura de la Geolocation API en el navegador.
 *  - queryGeolocationPermission: Consulta del permiso de ubicación con la Permissions API.
 *  - getCurrentCoordinates: Obtención de posición con opciones de bajo consumo y permisos mínimos.
 *  - matchLaboratoryFromCoordinates: Asociación determinista de coordenadas a laboratorios de la UTT.
 *  - getSyntheticLaboratoryLocation: Ubicación sintética para pruebas automatizadas y modo offline.
 *  - getLocationWithFallback: Orquestador con fallback a selección manual de laboratorio.
 */

export type GeoPermissionState = "granted" | "denied" | "prompt" | "unsupported";

export type GeoFallbackReason =
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "not_supported"
  | "manual_fallback"
  | "offline_fallback";

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null;
}

export interface GeoLocationResult {
  success: boolean;
  coords?: GeoCoordinates;
  laboratoryTag: string;
  fallbackUsed: boolean;
  fallbackReason?: GeoFallbackReason;
  errorMessage?: string;
  timestamp: string;
}

export interface GeoLocationOptions {
  enableHighAccuracy?: boolean;
  timeoutMs?: number;
  maximumAgeMs?: number;
  allowManualFallback?: boolean;
  defaultLaboratory?: string;
}

/** Catálogo sintético de laboratorios del campus UTT con coordenadas fijas de referencia. */
export const SYNTHETIC_CAMPUS_LABS = [
  {
    name: "Laboratorio de Redes y Telecomunicaciones",
    code: "LAB-REDES",
    latitude: 18.4635,
    longitude: -97.3912
  },
  {
    name: "Laboratorio de Cómputo 1 (Desarrollo)",
    code: "LAB-COMP-1",
    latitude: 18.4641,
    longitude: -97.3908
  },
  {
    name: "Laboratorio de Cómputo 2 (Mantenimiento)",
    code: "LAB-COMP-2",
    latitude: 18.4644,
    longitude: -97.3915
  },
  {
    name: "Laboratorio de Electrónica y Automatización",
    code: "LAB-ELEC-1",
    latitude: 18.4638,
    longitude: -97.3922
  }
];

export const DEFAULT_CAMPUS_LAB = SYNTHETIC_CAMPUS_LABS[0].name;

/** Comprueba si el entorno cliente soporta la Geolocation API. */
export function isGeolocationSupported(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return Boolean(
    "geolocation" in navigator &&
    navigator.geolocation &&
    typeof navigator.geolocation.getCurrentPosition === "function"
  );
}

/**
 * Consulta el estado del permiso de geolocalización sin forzar el prompt nativo.
 * Respeta la directriz de permisos mínimos.
 */
export async function queryGeolocationPermission(): Promise<GeoPermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions || typeof navigator.permissions.query !== "function") {
    return isGeolocationSupported() ? "prompt" : "unsupported";
  }

  try {
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state as GeoPermissionState;
  } catch {
    return isGeolocationSupported() ? "prompt" : "unsupported";
  }
}

/**
 * Calcula la distancia aproximada (euclidiana plana) entre dos coordenadas.
 * Adecuada para rangos de campus universitario en datos sintéticos.
 */
function calculateDistanceScore(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Asocia unas coordenadas dadas con el laboratorio sintético más cercano del campus.
 */
export function matchLaboratoryFromCoordinates(coords: { latitude: number; longitude: number }): string {
  let closest = SYNTHETIC_CAMPUS_LABS[0];
  let minDistance = calculateDistanceScore(coords.latitude, coords.longitude, closest.latitude, closest.longitude);

  for (let i = 1; i < SYNTHETIC_CAMPUS_LABS.length; i++) {
    const lab = SYNTHETIC_CAMPUS_LABS[i];
    const dist = calculateDistanceScore(coords.latitude, coords.longitude, lab.latitude, lab.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = lab;
    }
  }

  return closest.name;
}

/**
 * Genera una ubicación de laboratorio sintética para pruebas reproducibles y contingencia.
 */
export function getSyntheticLaboratoryLocation(labName?: string): GeoLocationResult {
  const selectedLab = SYNTHETIC_CAMPUS_LABS.find((l) => l.name === labName) || SYNTHETIC_CAMPUS_LABS[0];
  const nowIso = new Date().toISOString();

  return {
    success: true,
    coords: {
      latitude: selectedLab.latitude,
      longitude: selectedLab.longitude,
      accuracy: 15,
      altitude: null,
      speed: null
    },
    laboratoryTag: selectedLab.name,
    fallbackUsed: true,
    fallbackReason: "offline_fallback",
    timestamp: nowIso
  };
}

/**
 * Obtiene las coordenadas actuales del dispositivo mediante Geolocation API.
 * Emplea baja precisión (enableHighAccuracy: false) por defecto para ahorrar batería y proteger privacidad.
 */
export async function getCurrentCoordinates(
  options: GeoLocationOptions = {}
): Promise<GeoLocationResult> {
  const nowIso = new Date().toISOString();
  const defaultLab = options.defaultLaboratory || DEFAULT_CAMPUS_LAB;

  if (!isGeolocationSupported()) {
    return {
      success: false,
      laboratoryTag: defaultLab,
      fallbackUsed: true,
      fallbackReason: "not_supported",
      errorMessage: "La Geolocation API no está disponible en este dispositivo.",
      timestamp: nowIso
    };
  }

  const timeoutMs = options.timeoutMs ?? 10000;
  const maximumAgeMs = options.maximumAgeMs ?? 60000;
  const enableHighAccuracy = options.enableHighAccuracy ?? false;

  return new Promise<GeoLocationResult>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: GeoCoordinates = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          altitude: position.coords.altitude,
          speed: position.coords.speed
        };
        const matchedLab = matchLaboratoryFromCoordinates(coords);

        resolve({
          success: true,
          coords,
          laboratoryTag: matchedLab,
          fallbackUsed: false,
          timestamp: new Date(position.timestamp || Date.now()).toISOString()
        });
      },
      (error) => {
        let reason: GeoFallbackReason = "position_unavailable";
        let message = "No fue posible determinar la posición del dispositivo.";

        if (error.code === error.PERMISSION_DENIED) {
          reason = "permission_denied";
          message = "El usuario denegó el permiso de acceso a la ubicación.";
        } else if (error.code === error.TIMEOUT) {
          reason = "timeout";
          message = "Se agotó el tiempo de espera para obtener la ubicación.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          reason = "position_unavailable";
          message = "La señal de posición no está disponible en este momento.";
        }

        resolve({
          success: false,
          laboratoryTag: defaultLab,
          fallbackUsed: true,
          fallbackReason: reason,
          errorMessage: message,
          timestamp: new Date().toISOString()
        });
      },
      {
        enableHighAccuracy,
        timeout: timeoutMs,
        maximumAge: maximumAgeMs
      }
    );
  });
}

/**
 * Orquestador con fallback a selección manual:
 * Si la ubicación nativa falla o es denegada, aplica la asignación manual predefinida
 * sin interrumpir el flujo de registro de la inspección.
 */
export async function getLocationWithFallback(
  preferredLab?: string,
  options: GeoLocationOptions = {}
): Promise<GeoLocationResult> {
  const manualChoice = preferredLab || options.defaultLaboratory || DEFAULT_CAMPUS_LAB;
  const allowManual = options.allowManualFallback !== false;

  const result = await getCurrentCoordinates(options);

  if (!result.success) {
    if (allowManual) {
      const synthetic = getSyntheticLaboratoryLocation(manualChoice);
      synthetic.fallbackReason = result.fallbackReason || "manual_fallback";
      synthetic.errorMessage = result.errorMessage;
      return synthetic;
    }
  }

  return result;
}
