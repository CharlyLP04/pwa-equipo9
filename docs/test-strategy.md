# Estrategia de pruebas — Semana 08

## Alcance y contratos
Se continúa el repositorio acumulado, base 6e2c2cf3c7739fa0148ffca902e1319fde02fc06. No se modifican los módulos de producción. Se usa tsx y node:assert/strict, sin otro framework. Cada archivo se ejecuta en un proceso aislado; cualquier aserción fallida produce salida distinta de cero. El ejecutor descubre recursivamente todas las suites .spec.ts y .spec.mjs, conserva las siete suites heredadas y admite --run.

## Pirámide y matriz de riesgos
| Nivel | Suite nueva | Riesgo / oráculo |
|---|---|---|
| Unidad | schema | Campos ausentes, tipos incorrectos, valores negativos, fechas updatedAt/createdAt corruptas |
| Unidad | conflict-policy | Pérdida por precedencia errónea; mayor versión, fecha y desempate en ambos sentidos |
| Unidad | device-helpers | Dependencia de hardware, ubicación equivocada, pistas sin liberar; reloj fijo |
| Integración | sync-queue | Pérdida tras recarga, reintento prematuro, agotamiento y ACK ajeno/antiguo |
| Integración | server-dedup | Duplicación silenciosa; mismo oráculo en configuración sana y averiada |
| Flujo sintético | critical-path | Captura offline, persistencia, recarga, evento online, ACK y vaciado; ACK perdido |

La base prioriza casos de borde rápidos; el centro verifica colaboración real entre cola, almacenamiento y servidor simulado; la cima recorre dos escenarios de negocio. La distribución no se mide solo por número de archivos: las unitarias recorren tablas de casos. El informe cuenta suites, no inventa cantidades de aserciones ni porcentajes de cobertura.

## Reproducibilidad
Datos inventados, identificadores fijos, reloj inyectado en cola y reloj simulado para cámara. No se solicita hardware, no hay esperas reales de backoff ni solicitudes a servicios externos durante las suites. npm ci requiere acceso al registro público para instalar dependencias. Node 20 es el objetivo de CI; la ejecución local registra su versión real. Cada suite tiene límite de 60 segundos y el pipeline 20 minutos. Los reportes JSON se generan incluso si una suite falla.

## Fallo diagnosticado y corregido
El riesgo de falso positivo se reproduce desactivando la deduplicación con deduplicationEnabled: false. Contar solo ACK exitosos no distingue dos inserciones de una sola. El oráculo assertExactlyOnce verifica totalSubmissions() === 1, igualdad de serverId y duplicate === true. Se ejecuta primero contra la configuración correcta y luego contra la averiada: assert.throws exige un AssertionError del mismo oráculo y se confirma que hubo dos inserciones. La suite pasa porque detectó el fallo inducido; no porque considere correctos los duplicados. count() cuenta claves del índice y no inserciones cuando el índice está desactivado; por eso se mide totalSubmissions(). No se afirma que existieran revisiones anteriores verificadas: este diagnóstico corresponde al experimento actual.

## Límites y decisiones
- El E2E es sintético a nivel de dominio con EventTarget y almacenamiento en memoria. No monta React ni prueba el DOM, service worker real, permisos del navegador o localStorage físico. No equivale a una prueba de navegador.
- date es texto libre en el contrato heredado. La prueba caracteriza que una cadena corrupta se admite; updatedAt y createdAt sí rechazan fechas no interpretables. Endurecer date cambiaría el contrato solicitado y queda pendiente.
- PendingOperation es el esquema heredado con processing; OutboxOperation usa inFlight. No se confunden ambos formatos.
- La mayor revisión confirmada se calcula sobre operaciones done todavía presentes. No se garantiza rechazo histórico después de purgarlas; requiere persistencia adicional en producción.
- La resolución léxica depende de JSON.stringify y localeCompare: estas pruebas fijan campos y valores ASCII para el desempate. No garantizan canonización entre motores o distinto orden de propiedades.
- El escáner docente produce coincidencias en documentos heredados y en el nombre de una dependencia transitiva legítima del lockfile. Se conserva el lockfile y el check público sin ocultar archivos ni codificar nombres para eludirlo. Debe revisarse con el docente; no se declara aprobado.
- Los tipos se revisan con tsc; no se presenta esa revisión como un linter estilístico. No hay métrica de cobertura instrumentada en esta entrega.

## Evidencia y aceptación
AC-01: instalación limpia y build en el reporte. AC-02: rutas requeridas verificadas por scripts/verify.mjs. AC-03: test-results/results.json y experimento de regresión. AC-04: este documento, README y evidence/individual.md. npm run verify ejecuta tipos, build y toda la pirámide y escribe test-results/verification.json, indicando SHA y si hay cambios locales. GitHub Actions conserva los reportes como artefactos; una configuración de CI no constituye evidencia de una ejecución remota.

## Hallazgo en el check público original
Se ejecutó public-tests/check.sh con Git Bash: imprimió coincidencias y PUBLIC_OK, y terminó con código 0. En Bash, una orden negada con ! queda exceptuada de set -e; el echo posterior enmascara el resultado negativo. Por tanto PUBLIC_OK no demuestra ausencia de coincidencias. No se modifica el check del profesor. La observación se conserva como limitación del evaluador público y no se usa para afirmar seguridad o calificación.
