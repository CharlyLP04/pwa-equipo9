/**
 * Cola de sincronización (outbox) — Semana 05
 * PWA de Inspecciones de Laboratorio (UTT) · datos exclusivamente sintéticos.
 *
 * Responsabilidades (ver docs/sync-policy.md):
 *  - enqueue: registrar una operación lógica con operationId / idempotencyKey generados por el cliente.
 *  - persist: guardar la cola ANTES de intentar el envío (no se pierde si la pestaña se cierra).
 *  - send:    pasar a "inFlight" y enviar con la misma idempotencyKey en cada reintento.
 *  - ack/fail: marcar "done" SOLO con ACK verificable; si falla, contar intentos y aplicar backoff.
 *  - reconcile: rechazar ACK con revisión vieja (respuestas fuera de orden).
 *  - resume:  al recargar, cualquier operación que quedó "inFlight" vuelve a "pending".
 *
 * Ciclo determinista: enqueue → persist → send → ack/fail → reconcile → done
 */

export type OperationStatus = "pending" | "inFlight" | "done" | "failed";

export type OperationType = "CREATE_INSPECTION" | "UPDATE_INSPECTION" | "DELETE_INSPECTION";

export interface OutboxOperation<TPayload = unknown> {
  /** Identificador único de la operación lógica (generado en el cliente). */
  operationId: string;
  /** Clave que viaja al servidor para que un reintento no genere un segundo registro. */
  idempotencyKey: string;
  /** localId de la inspección afectada. */
  entityId: string;
  type: OperationType;
  payload: TPayload;
  status: OperationStatus;
  /** Número de envíos intentados. */
  attempts: number;
  /** Revisión local de la entidad al momento de encolar. */
  revision: number;
  createdAt: string;
  updatedAt: string;
  /** Momento (epoch ms) a partir del cual se permite el siguiente intento. */
  nextAttemptAt: number;
  /** Último error observado (sanitizado, sin datos sensibles). */
  lastError?: string;
  /** Revisión confirmada por el servidor en el ACK. */
  ackRevision?: number;
  /** Identificador asignado por el servidor tras el ACK. */
  serverId?: string;
}

/** Respuesta del servidor (o simulador) para un envío. */
export interface SyncAck {
  operationId: string;
  serverId: string;
  /** Revisión que el servidor reconoce para la entidad. */
  revision: number;
  /** true si el servidor ya había procesado esa idempotencyKey (reintento reconocido). */
  duplicate?: boolean;
}

/** Función de envío inyectable: permite probar sin red pública. */
export type SyncSender = (operation: OutboxOperation) => Promise<SyncAck>;

/** Almacenamiento inyectable (localStorage en navegador, memoria en pruebas). */
export interface QueueStorage {
  read(key: string): string | null;
  write(key: string, value: string): void;
}

export interface QueueOptions {
  storage?: QueueStorage;
  storageKey?: string;
  maxAttempts?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  now?: () => number;
  idFactory?: () => string;
}

export interface EnqueueInput<TPayload = unknown> {
  entityId: string;
  type: OperationType;
  payload: TPayload;
  revision?: number;
  /** Opcional: permite re-encolar la MISMA operación lógica sin duplicarla. */
  operationId?: string;
}

export interface ProcessResult {
  sent: number;
  done: number;
  retried: number;
  failed: number;
  skipped: number;
}

export const DEFAULT_STORAGE_KEY = "utt-lab-outbox";
export const DEFAULT_MAX_ATTEMPTS = 5;
export const DEFAULT_BASE_BACKOFF_MS = 1000;
export const DEFAULT_MAX_BACKOFF_MS = 30000;

/** Almacenamiento en memoria (pruebas y entornos sin localStorage). */
export function createMemoryStorage(): QueueStorage {
  const data: Record<string, string> = {};
  return {
    read: (key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null),
    write: (key, value) => {
      data[key] = value;
    }
  };
}

/** Usa localStorage si existe; si no, memoria. Nunca lanza durante SSR. */
export function createDefaultStorage(): QueueStorage {
  const g = globalThis as { localStorage?: Storage };
  if (g.localStorage) {
    const ls = g.localStorage;
    return {
      read: (key) => ls.getItem(key),
      write: (key, value) => ls.setItem(key, value)
    };
  }
  return createMemoryStorage();
}

function defaultIdFactory(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto && typeof g.crypto.randomUUID === "function") {
    return g.crypto.randomUUID();
  }
  // Respaldo determinista suficiente para datos sintéticos.
  return "op-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

/**
 * Backoff exponencial acotado: base * 2^(attempts-1), con tope.
 * Evita saturar la API cuando la red regresa de forma intermitente.
 */
export function computeBackoff(attempts: number, baseMs: number, maxMs: number): number {
  if (attempts <= 0) return 0;
  const delay = baseMs * Math.pow(2, attempts - 1);
  return Math.min(delay, maxMs);
}

/** Mensaje de error recortado y sin contenido sensible para dejarlo en la cola. */
function sanitizeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/[\r\n]+/g, " ").slice(0, 160);
}

export class SyncQueue {
  private operations: OutboxOperation[] = [];
  private readonly storage: QueueStorage;
  private readonly storageKey: string;
  private readonly maxAttempts: number;
  private readonly baseBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly now: () => number;
  private readonly idFactory: () => string;
  private processing = false;

  constructor(options: QueueOptions = {}) {
    this.storage = options.storage ?? createDefaultStorage();
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.baseBackoffMs = options.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS;
    this.maxBackoffMs = options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
    this.now = options.now ?? (() => Date.now());
    this.idFactory = options.idFactory ?? defaultIdFactory;
    this.load();
  }

  // ---------------------------------------------------------------------------
  // Persistencia y reanudación (resume)
  // ---------------------------------------------------------------------------

  /**
   * Carga la cola persistida. Si la pestaña se cerró con operaciones "inFlight"
   * (sin ACK), no sabemos si llegaron: vuelven a "pending" y se reenviarán con
   * la MISMA idempotencyKey, así el servidor no duplica el registro.
   */
  private load(): void {
    const raw = this.storage.read(this.storageKey);
    if (!raw) {
      this.operations = [];
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      this.operations = Array.isArray(parsed) ? (parsed as OutboxOperation[]) : [];
    } catch {
      // Datos corruptos: no se inventan operaciones; se inicia vacío.
      this.operations = [];
    }
    let resumed = false;
    for (const op of this.operations) {
      if (op.status === "inFlight") {
        op.status = "pending";
        op.updatedAt = new Date(this.now()).toISOString();
        resumed = true;
      }
    }
    if (resumed) this.persist();
  }

  private persist(): void {
    this.storage.write(this.storageKey, JSON.stringify(this.operations));
  }

  // ---------------------------------------------------------------------------
  // enqueue / dequeue
  // ---------------------------------------------------------------------------

  /**
   * Encola una operación y la persiste de inmediato.
   * Si se recibe un operationId ya existente, devuelve la operación original
   * (idempotencia local: la misma operación lógica nunca aparece dos veces).
   */
  enqueue<TPayload>(input: EnqueueInput<TPayload>): OutboxOperation<TPayload> {
    if (input.operationId) {
      const existing = this.find(input.operationId);
      if (existing) return existing as OutboxOperation<TPayload>;
    }
    const nowIso = new Date(this.now()).toISOString();
    const operationId = input.operationId ?? this.idFactory();
    const operation: OutboxOperation<TPayload> = {
      operationId,
      idempotencyKey: operationId,
      entityId: input.entityId,
      type: input.type,
      payload: input.payload,
      status: "pending",
      attempts: 0,
      revision: input.revision ?? 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      nextAttemptAt: 0
    };
    this.operations.push(operation as OutboxOperation);
    this.persist();
    return operation;
  }

  /** Siguiente operación lista para enviarse (FIFO, respetando backoff). */
  peekNext(): OutboxOperation | undefined {
    const now = this.now();
    for (const op of this.operations) {
      if (op.status === "pending" && op.nextAttemptAt <= now) return op;
    }
    return undefined;
  }

  /** Elimina de la cola las operaciones confirmadas ("done"). */
  dequeueDone(): number {
    const before = this.operations.length;
    this.operations = this.operations.filter((op) => op.status !== "done");
    const removed = before - this.operations.length;
    if (removed > 0) this.persist();
    return removed;
  }

  // ---------------------------------------------------------------------------
  // Transiciones de estado
  // ---------------------------------------------------------------------------

  markInFlight(operationId: string): OutboxOperation {
    const op = this.require(operationId);
    if (op.status !== "pending") {
      throw new Error(`Transición inválida: ${op.status} → inFlight`);
    }
    op.status = "inFlight";
    op.attempts += 1;
    op.updatedAt = new Date(this.now()).toISOString();
    this.persist(); // persistido antes del envío
    return op;
  }

  /**
   * Aplica un ACK del servidor.
   * Reconcile: si llega un ACK con revisión menor a la ya confirmada para la
   * misma entidad (respuesta vieja fuera de orden) se ignora y devuelve false.
   */
  acknowledge(ack: SyncAck): boolean {
    const op = this.find(ack.operationId);
    if (!op) return false;
    if (op.status === "done") return false; // ACK repetido: sin efecto

    const confirmed = this.highestAckRevision(op.entityId);
    if (ack.revision < op.revision || ack.revision < confirmed) {
      op.lastError = `ACK descartado por revisión vieja (${ack.revision} < ${Math.max(op.revision, confirmed)})`;
      this.persist();
      return false;
    }

    op.status = "done";
    op.ackRevision = ack.revision;
    op.serverId = ack.serverId;
    op.lastError = undefined;
    op.updatedAt = new Date(this.now()).toISOString();
    this.persist();
    return true;
  }

  /**
   * Registra un fallo de envío. Vuelve a "pending" con backoff mientras queden
   * intentos; al agotar maxAttempts pasa a "failed" (requiere reintento manual).
   */
  fail(operationId: string, error: unknown): OutboxOperation {
    const op = this.require(operationId);
    op.lastError = sanitizeError(error);
    op.updatedAt = new Date(this.now()).toISOString();
    if (op.attempts >= this.maxAttempts) {
      op.status = "failed";
      op.nextAttemptAt = 0;
    } else {
      op.status = "pending";
      op.nextAttemptAt = this.now() + computeBackoff(op.attempts, this.baseBackoffMs, this.maxBackoffMs);
    }
    this.persist();
    return op;
  }

  /** Reintento manual: failed → pending (nunca directo a done). */
  retry(operationId: string): OutboxOperation {
    const op = this.require(operationId);
    if (op.status !== "failed") return op;
    op.status = "pending";
    op.attempts = 0;
    op.nextAttemptAt = 0;
    op.updatedAt = new Date(this.now()).toISOString();
    this.persist();
    return op;
  }

  // ---------------------------------------------------------------------------
  // Procesamiento
  // ---------------------------------------------------------------------------

  /**
   * Envía todas las operaciones listas. Es seguro llamarlo varias veces:
   * mientras procesa, una segunda llamada no reenvía nada (evita dobles envíos).
   */
  async process(sender: SyncSender): Promise<ProcessResult> {
    const result: ProcessResult = { sent: 0, done: 0, retried: 0, failed: 0, skipped: 0 };
    if (this.processing) {
      result.skipped = 1;
      return result;
    }
    this.processing = true;
    try {
      const ready = this.operations.filter(
        (op) => op.status === "pending" && op.nextAttemptAt <= this.now()
      );
      for (const op of ready) {
        this.markInFlight(op.operationId);
        result.sent += 1;
        try {
          const ack = await sender(op);
          if (ack.operationId !== op.operationId) {
            throw new Error("ACK no corresponde a la operación enviada");
          }
          if (this.acknowledge(ack)) {
            result.done += 1;
          } else {
            // ACK viejo/inválido: no se marca sincronizado; queda para reintento.
            this.fail(op.operationId, op.lastError ?? "ACK rechazado");
            this.countFailure(op, result);
          }
        } catch (error) {
          this.fail(op.operationId, error);
          this.countFailure(op, result);
        }
      }
    } finally {
      this.processing = false;
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Consultas
  // ---------------------------------------------------------------------------

  list(): OutboxOperation[] {
    return this.operations.map((op) => ({ ...op }));
  }

  find(operationId: string): OutboxOperation | undefined {
    return this.operations.find((op) => op.operationId === operationId);
  }

  countByStatus(): Record<OperationStatus, number> {
    const counts: Record<OperationStatus, number> = { pending: 0, inFlight: 0, done: 0, failed: 0 };
    for (const op of this.operations) counts[op.status] += 1;
    return counts;
  }

  size(): number {
    return this.operations.length;
  }

  private countFailure(op: OutboxOperation, result: ProcessResult): void {
    if (op.status === "failed") result.failed += 1;
    else result.retried += 1;
  }

  private highestAckRevision(entityId: string): number {
    let max = 0;
    for (const op of this.operations) {
      if (op.entityId === entityId && op.status === "done" && typeof op.ackRevision === "number") {
        max = Math.max(max, op.ackRevision);
      }
    }
    return max;
  }

  private require(operationId: string): OutboxOperation {
    const op = this.find(operationId);
    if (!op) throw new Error(`Operación no encontrada: ${operationId}`);
    return op;
  }
}

/**
 * Simulador de servidor idempotente para pruebas sin red pública.
 * Guarda las idempotencyKey procesadas: un reintento devuelve el mismo
 * serverId y NO crea un segundo registro.
 */
export function createIdempotentServer() {
  const records: Record<string, { serverId: string; revision: number }> = {};
  let counter = 0;
  return {
    handle(operation: OutboxOperation): SyncAck {
      const existing = records[operation.idempotencyKey];
      if (existing) {
        return { operationId: operation.operationId, serverId: existing.serverId, revision: existing.revision, duplicate: true };
      }
      counter += 1;
      const record = { serverId: "srv-" + counter, revision: operation.revision };
      records[operation.idempotencyKey] = record;
      return { operationId: operation.operationId, serverId: record.serverId, revision: record.revision, duplicate: false };
    },
    count(): number {
      return Object.keys(records).length;
    }
  };
}
