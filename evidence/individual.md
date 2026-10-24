# Evidencia individual — Semana 08

## Trazabilidad
Base acumulada: 6e2c2cf3c7739fa0148ffca902e1319fde02fc06. Rama local: semana-08-testing-ci. El SHA del incremento se registra al cerrar la implementación y el reporte de verificación identifica el commit realmente ejecutado.

## Decisión técnica
Se conserva tsx con aserciones nativas y se aísla cada suite en un proceso. El ejecutor descubre todas las suites, acepta --run y escribe resultados aun ante fallos. No se cambian contratos de producción para ajustar pruebas. El experimento de deduplicación usa exactamente el mismo oráculo con configuración sana y averiada.

## Prueba y limitación
npm run test --if-present -- --run ejecuta la pirámide y las regresiones heredadas. npm run verify agrega tipos y build. Consultar los reportes generados; el E2E valida dominio y eventos sintéticos, no interacción React en navegador. El escáner público tiene coincidencias heredadas y se reporta por separado.

## Uso de IA y validación humana
Herramienta: OpenAI Codex. Propósito: inspección del kit, escritura de suites, ejecutor, workflow y documentación, y ejecución local de comandos. Archivos influenciados: los incluidos en el incremento de la semana 08. La persona estudiante aún debe revisar y validar estos cambios; no se le atribuye una revisión que no ha realizado.

Defensa sugerida: explicar por qué un ACK no prueba ausencia de duplicados, por qué un reloj inyectado evita esperas y por qué memoria/EventTarget no certifican el navegador. Reproducir el fallo inducido y explicar las limitaciones del esquema. No se incluyen respuestas de evaluaciones presenciales.

## Commit del incremento
Implementación: 52beb186e9ae4234dbf9563fb943f654ea9bcefb. El commit posterior únicamente completa esta trazabilidad; test-results/verification.json registra el SHA final ejecutado. Instalación limpia completada con npm ci --ignore-scripts --no-audit --no-fund. La primera verificación completa pasó: tipos, build y 13/13 suites. Entorno local: Node 24.18.0; Node 20 queda configurado para CI y no se afirma ejecutado localmente.

