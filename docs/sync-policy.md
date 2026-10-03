# Política de Persistencia Local y Sincronización Idempotente

**Proyecto:** PWA de Inspecciones de Mantenimiento de Laboratorios (UTT)
**Actividad:** Semana 05 — Persistencia local y sincronización idempotente
**Datos:** exclusivamente sintéticos (sin PII, sin servicios privados)

---

## 1. Problema

Un técnico captura una inspección en un laboratorio, se va la red, recarga la página y después vuelve internet. La aplicación debe garantizar tres cosas:

1. **No perder** la inspección capturada sin red.
2. **No duplicar** el registro aunque el envío se reintente varias veces.
3. **No ocultar conflictos**: si cliente y servidor cambiaron el mismo dato, aplicar una regla explícita.

## 2. Arquitectura

```
UI (formulario)  →  Storage (schema.ts)  →  Outbox (queue.ts)  →  Sync (process)  →  API
                     inspections            pendientes/retry       backoff/orden      idempotencyKey
                     outbox, sync_meta
                                                  ↑
                                     conflict-policy.ts (reconcile)
```

- La UI **nunca** llama a la red para guardar: escribe en almacenamiento local y encola.
- `src/lib/storage/schema.ts` define `inspections`, `outbox` y `sync_meta`.
- `src/lib/sync/queue.ts` gestiona el ciclo de vida de cada operación.
- `src/lib/sync/conflict-policy.ts` decide qué hacer ante revisiones incompatibles.

## 3. Ciclo de sincronización (determinista)

| Paso | Acción | Implementación en `queue.ts` |
|---|---|---|
| 1 | enqueue | `enqueue()` genera `operationId` en el cliente; `idempotencyKey = operationId` |
| 2 | persist | `persist()` escribe la cola **antes** de cualquier envío |
| 3 | send | `markInFlight()` incrementa `attempts`, persiste y luego llama al `SyncSender` |
| 4 | ack / fail | `acknowledge()` con ACK verificable; `fail()` aplica backoff o marca `failed` |
| 5 | reconcile | ACK con revisión menor a la ya confirmada se descarta |
| 6 | done | solo tras ACK válido; `dequeueDone()` limpia las confirmadas |

Estados: `pending → inFlight → done` o `pending → inFlight → pending (backoff) → … → failed`.
**Regla:** nunca se marca `done` antes de un ACK verificable del servidor.

## 4. Idempotencia

- `operationId` se genera con `crypto.randomUUID()` en el cliente y queda persistido antes del envío.
- La misma `idempotencyKey` viaja en **todos** los reintentos de la misma operación lógica.
- Si el primer `POST` llegó al servidor pero el ACK se perdió (timeout), el reintento usa la misma clave; el servidor la reconoce y responde con el mismo `serverId` → **1 registro, no 2**.
- Localmente, `enqueue()` con un `operationId` existente devuelve la operación original en vez de crear otra.
- `process()` tiene un candado (`processing`): dos llamadas simultáneas no reenvían la misma operación.

## 5. Reintentos y backoff

| Parámetro | Valor por defecto | Motivo |
|---|---|---|
| `maxAttempts` | 5 | Evita reintentos infinitos; después se requiere acción del usuario |
| `baseBackoffMs` | 1000 ms | Primer reintento rápido |
| `maxBackoffMs` | 30000 ms | Tope para no dejar operaciones esperando demasiado |

Fórmula: `delay = min(base × 2^(attempts−1), max)` → 1 s, 2 s, 4 s, 8 s, 16 s.
Al agotar intentos, la operación pasa a `failed`; `retry()` la regresa a `pending` (nunca directo a `done`).

## 6. Interrupciones reales

| Situación | Comportamiento |
|---|---|
| Se cierra/recarga la pestaña con una operación `inFlight` | Al cargar, `load()` la regresa a `pending`; se reenvía con la misma clave (sin duplicar) |
| ACK viejo llega después de uno nuevo (fuera de orden) | `acknowledge()` compara revisiones y lo descarta (`return false`) |
| ACK de otra operación | Se rechaza y la operación queda pendiente para reintento |
| Datos de la cola corruptos en almacenamiento | Se inicia vacía; no se inventan operaciones |
| Error del servidor (500) o timeout | `fail()` guarda un mensaje sanitizado y programa backoff |

## 7. Conflictos

Un conflicto ocurre cuando el cliente tiene `rev 7` y el servidor ya tiene `rev 8` del mismo registro.

| Estrategia | Ventaja | Riesgo |
|---|---|---|
| server wins | simple | puede perder la edición local del técnico |
| client wins | rápida | pisa cambios remotos |
| **merge por campo** | claro cuando los campos son independientes | requiere conocer qué campo cambió cada lado |
| **manual review** | seguro para datos sensibles o ambiguos | requiere intervención |

**Decisión del equipo:** *merge por campo* cuando los cambios tocan campos distintos, y *manual review* cuando ambos lados modificaron el mismo campo crítico (por ejemplo, `status` o hallazgos). La implementación está en `src/lib/sync/conflict-policy.ts`; la cola solo garantiza que un ACK con revisión vieja no sobrescriba una confirmación más reciente.

## 8. Evidencia de pruebas (`tests/sync.spec.ts`)

| Caso | Qué demuestra | Resultado esperado |
|---|---|---|
| offline capture | guardar sin red y recargar | la operación sigue `pending` tras crear una nueva instancia de la cola |
| retry duplicate | mismo `operationId` varias veces + timeout tras escritura | el servidor simulado registra **1** elemento |
| conflict case | `rev 7` vs `rev 8` | se resuelve según la política, sin perder datos en silencio |
| out-of-order | ACK `rev 7` después de `rev 8` | el ACK viejo se descarta |
| resume queue | recargar con operación `inFlight` | vuelve a `pending` y se completa después |

Las pruebas usan `createMemoryStorage()` y `createIdempotentServer()`: no dependen de red pública ni de servicios privados.

## 9. Supuestos y límites

- **Almacenamiento:** el adaptador por defecto usa `localStorage` (síncrono, ~5 MB). Es suficiente para inspecciones sintéticas de texto; fotos u objetos grandes requieren IndexedDB.
- **Backoff en memoria:** `nextAttemptAt` se persiste, pero el disparo automático depende de que la app esté abierta; Background Sync del Service Worker queda como trabajo futuro.
- **Una sola pestaña:** el candado `processing` es por instancia; dos pestañas abiertas podrían enviar la misma operación a la vez. El servidor idempotente evita el duplicado, pero se recomienda un `BroadcastChannel` o lock en una iteración posterior.
- **Reloj del cliente:** `updatedAt` usa la hora local; la resolución de conflictos se basa en `revision`, no en la hora.

## 10. Riesgos identificados y mitigados en el diseño

- Marcar `done` al terminar el envío sin validar el ACK permitiría que una respuesta de otra operación cerrara la equivocada → `process()` verifica que `ack.operationId` coincida.
- Una operación `inFlight` interrumpida por recarga quedaría bloqueada para siempre → `load()` la reanuda como `pending`.
- Con `target: es5` no se puede iterar `Map` con `for…of` sin `downlevelIteration` → se usan arreglos y objetos planos.
