
import assert from "node:assert/strict";

import {
  isCameraSupported,
  queryCameraPermission,
  requestCameraStream,
  captureWithFallback,
} from "../src/lib/device/camera";

import {
  getCurrentCoordinates,
  getLocationWithFallback,
  SYNTHETIC_CAMPUS_LABS,
} from "../src/lib/device/geolocation";

import {
  NOTIFICATION_FALLBACK_EVENT,
  getNotificationPermission,
  requestNotificationPermission,
  dispatchLocalNotification,
} from "../src/lib/notifications/client";

// Mocks deterministas: nunca se utiliza hardware real.
const globals = globalThis as Record<string, unknown>;

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const originalCustomEvent = Object.getOwnPropertyDescriptor(globalThis, "CustomEvent");

function setGlobal(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
}

function restoreGlobal(
  name: string,
  descriptor: PropertyDescriptor | undefined
): void {
  if (descriptor) {
    Object.defineProperty(globalThis, name, descriptor);
  } else {
    delete globals[name];
  }
}

type MockEnvironment = {
  events: Array<{ type: string; detail: unknown }>;
  window: Record<string, unknown>;
  navigator: Record<string, unknown>;
};

function createEnvironment(): MockEnvironment {
  const events: Array<{ type: string; detail: unknown }> = [];
  const windowMock: Record<string, unknown> = {
    dispatchEvent(event: { type: string; detail: unknown }) {
      events.push({ type: event.type, detail: event.detail });
      return true;
    },
  };
  const navigatorMock: Record<string, unknown> = {};

  setGlobal("window", windowMock);
  setGlobal("navigator", navigatorMock);

  class MockCustomEvent {
    type: string;
    detail: unknown;

    constructor(type: string, options: { detail: unknown }) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  setGlobal("CustomEvent", MockCustomEvent);

  return { events, window: windowMock, navigator: navigatorMock };
}

function mockCamera(
  environment: MockEnvironment,
  permission: "granted" | "denied",
  supported = true
): void {
  environment.navigator.permissions = {
    async query() {
      return { state: permission };
    },
  };

  if (supported) {
    environment.navigator.mediaDevices = {
      async getUserMedia() {
        if (permission === "denied") {
          throw Object.assign(new Error("Permiso denegado"), {
            name: "NotAllowedError",
          });
        }
        return {
          getTracks() {
            return [{ stop() {} }];
          },
        };
      },
    };
  }
}

function mockGeolocation(
  environment: MockEnvironment,
  mode: "success" | "timeout"
): void {
  environment.navigator.geolocation = {
    getCurrentPosition(
      success: (position: unknown) => void,
      error: (reason: unknown) => void
    ) {
      if (mode === "timeout") {
        error({
          code: 3,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
        return;
      }

      success({
        coords: {
          latitude: SYNTHETIC_CAMPUS_LABS[0].latitude,
          longitude: SYNTHETIC_CAMPUS_LABS[0].longitude,
          accuracy: 10,
          altitude: null,
          speed: null,
        },
        timestamp: Date.parse("2026-10-11T12:00:00.000Z"),
      });
    },
  };
}

function mockNotifications(
  environment: MockEnvironment,
  permission: "granted" | "denied" | "default"
): { delivered: string[]; requests: string[] } {
  const delivered: string[] = [];
  const requests: string[] = [];

  class MockNotification {
    static permission = permission;

    static async requestPermission() {
      requests.push("requestPermission");
      return permission;
    }

    constructor(title: string) {
      delivered.push(title);
    }
  }

  environment.window.Notification = MockNotification;
  return { delivered, requests };
}

async function run(): Promise<void> {
  try {
    // CÁMARA
    {
      const env = createEnvironment();
      mockCamera(env, "granted");

      assert.equal(isCameraSupported(), true);
      assert.equal(await queryCameraPermission(), "granted");

      const result = await requestCameraStream();
      assert.ok(result.stream, "Debe obtener un stream simulado");
      assert.equal(result.error, undefined);
    }

    {
      const env = createEnvironment();
      mockCamera(env, "denied");

      assert.equal(await queryCameraPermission(), "denied");

      const result = await requestCameraStream();
      assert.equal(result.stream, null);
      assert.equal(result.error?.reason, "permission_denied");

      const fallback = await captureWithFallback({
        syntheticInspectionId: "insp-test-denied",
      });

      assert.equal(fallback.fallbackUsed, true);
      assert.equal(fallback.fallbackReason, "permission_denied");
      assert.equal(fallback.success, true);
    }

    {
      createEnvironment();

      assert.equal(isCameraSupported(), false);
      assert.equal(await queryCameraPermission(), "unsupported");

      const result = await requestCameraStream();
      assert.equal(result.error?.reason, "not_supported");

      const fallback = await captureWithFallback();
      assert.equal(fallback.fallbackUsed, true);
      assert.equal(fallback.fallbackReason, "not_supported");
    }

    // GEOLOCALIZACIÓN
    {
      const env = createEnvironment();
      mockGeolocation(env, "success");

      const result = await getCurrentCoordinates();
      assert.equal(result.success, true);
      assert.equal(result.fallbackUsed, false);
      assert.equal(result.laboratoryTag, SYNTHETIC_CAMPUS_LABS[0].name);
      assert.equal(result.coords?.accuracy, 10);
    }

    {
      const env = createEnvironment();
      mockGeolocation(env, "timeout");

      const result = await getCurrentCoordinates({ timeoutMs: 500 });
      assert.equal(result.success, false);
      assert.equal(result.fallbackReason, "timeout");
    }

    {
      const env = createEnvironment();
      mockGeolocation(env, "timeout");

      const selectedLab = SYNTHETIC_CAMPUS_LABS[1].name;
      const result = await getLocationWithFallback(selectedLab);

      assert.equal(result.success, true);
      assert.equal(result.fallbackUsed, true);
      assert.equal(result.fallbackReason, "timeout");
      assert.equal(result.laboratoryTag, selectedLab);
    }

    // NOTIFICACIONES
    const notification = {
      kind: "sync-pending" as const,
      title: "Sincronización pendiente",
      body: "Hay operaciones sintéticas pendientes.",
    };

    {
      const env = createEnvironment();
      const mock = mockNotifications(env, "granted");

      assert.equal(getNotificationPermission(), "granted");
      assert.equal(await requestNotificationPermission(), "granted");
      assert.equal(mock.requests.length, 0);

      const result = await dispatchLocalNotification(notification);

      assert.equal(result.delivered, true);
      assert.equal(result.channel, "native");
      assert.deepEqual(mock.delivered, ["Sincronización pendiente"]);
      assert.equal(env.events.length, 0);
    }

    {
      const env = createEnvironment();
      const mock = mockNotifications(env, "denied");

      assert.equal(getNotificationPermission(), "denied");
      assert.equal(await requestNotificationPermission(), "denied");
      assert.equal(mock.requests.length, 0);

      const result = await dispatchLocalNotification(notification);

      assert.equal(result.delivered, false);
      assert.equal(result.channel, "fallback");

      if (!result.delivered) {
        assert.equal(result.fallbackReason, "permission-denied");
      }

      assert.ok(
        env.events.some(
          (event) =>
            event.type === NOTIFICATION_FALLBACK_EVENT &&
            (event.detail as { role: string }).role === "alert"
        ),
        "Debe emitirse un evento para el banner accesible"
      );
    }

    {
      const env = createEnvironment();
      const mock = mockNotifications(env, "default");

      assert.equal(getNotificationPermission(), "default");

      const result = await dispatchLocalNotification(notification);

      assert.equal(result.delivered, false);
      assert.equal(result.channel, "fallback");
      assert.equal(mock.requests.length, 0);

      if (!result.delivered) {
        assert.equal(result.fallbackReason, "permission-default");
      }

      assert.ok(
        env.events.some(
          (event) =>
            event.type === NOTIFICATION_FALLBACK_EVENT &&
            (event.detail as { role: string }).role === "status"
        ),
        "Debe emitirse un evento accesible de estado"
      );
    }

    console.log("capabilities.spec.ts: PASS (9 escenarios)");
  } finally {
    restoreGlobal("window", originalWindow);
    restoreGlobal("navigator", originalNavigator);
    restoreGlobal("CustomEvent", originalCustomEvent);
  }
}

run().catch((error) => {
  console.error("capabilities.spec.ts: FAIL", error);
  process.exitCode = 1;
});
