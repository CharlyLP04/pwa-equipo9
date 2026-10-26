# Evidencia individual — Semana 08

## Alcance del equipo y trazabilidad

Se conserva la historia de commits de los tres integrantes mediante merges en semana-08-testing-ci. La división de responsabilidades justifica el trabajo en equipo: Alexis cubre reglas unitarias y estrategia; Pacheco, integración de sincronización y CI inicial; Carlos, flujo crítico, regresiones complementarias y consolidación reproducible. Cada integrante debe poder defender su contribución.

| Integrante | Aporte fuente | SHA de implementación |
|---|---|---|
| Montalvo Osorio Alexis | PR #25, unitarias y estrategia | bffe72e4a084fffd4a99e62784e1df243b90ddc3 |
| Pacheco Avila Carlos Alberto | PR #26, integración y CI inicial | 867fb050529ad7788cbc7c9aa15470be1173128a |
| Carlos Olaya Gutiérrez | E2E, regresiones, ejecutor y consolidación asistida | 52beb186e9ae4234dbf9563fb943f654ea9bcefb |

El tag week-08-final-v2 identifica la entrega con la revisión humana confirmada. El tag week-08-final se conserva como versión técnica anterior. Los reportes generados registran el SHA exacto ejecutado; se obtiene también con git rev-parse HEAD. Las aportaciones originales no se reemplazan por una atribución colectiva.

## Confirmación de revisión humana del equipo

Carlos Olaya Gutiérrez confirmó que él, Montalvo Osorio Alexis y Pacheco Avila Carlos Alberto ya revisaron el código, los resultados y sus aportaciones en la entrega consolidada. Esta revisión ocurrió después de la publicación de week-08-final y queda registrada en esta actualización de evidencia. Se mantiene la declaración de uso de IA y la distinción entre ejecución automatizada y revisión humana. Las limitaciones técnicas documentadas siguen vigentes.

## Carlos Olaya Gutiérrez — consolidación y flujo crítico

- Decisión técnica: conservar los archivos originales de los compañeros y ejecutar automáticamente todas las suites. Los casos adicionales quedan en schema-boundaries, conflict-policy-regression, sync-queue-recovery y server-dedup-regression; device-helpers y critical-path completan la comprobación.
- Prueba: npm ci --ignore-scripts --no-audit --no-fund seguido de npm run verify, equivalente a make verify. Los resultados reales se encuentran en test-results/verification.json y results.json y en los artefactos de Actions; no se afirma que estos comandos hayan sido ejecutados manualmente por el estudiante.
- Limitación: el E2E es de dominio con almacenamiento y conectividad simulados. No valida React ni permisos del navegador. El esquema heredado admite date como texto y el escáner público presenta coincidencias léxicas no concluyentes.
- IA: OpenAI Codex se utilizó para diseñar pruebas complementarias, integrar ramas, resolver conflictos, redactar documentación y ejecutar verificaciones. La validación automatizada fue realizada por el agente. La revisión humana del código, los resultados y las aportaciones fue confirmada por Carlos para los tres integrantes después de publicar week-08-final. Esta confirmación no implica que todos ejecutaran manualmente los comandos ni que se haya realizado ya una defensa ante el docente.
- Defensa: explicar el ACK perdido, la conservación de idempotencyKey, el oráculo que detecta duplicados y la diferencia entre E2E sintético y navegador.

## Declaraciones originales de Alexis y Pacheco

Se reproducen sus declaraciones de origen. Las frases sobre suites aún no incorporadas o CI pendiente describen sus ramas antes de esta consolidación; aquí las 18 suites se descubren automáticamente y el workflow publica reportes. No se altera lo que cada compañero declaró haber validado.



## Montalvo Osorio Alexis

- **Commit SHA individual:** `bffe72e4a084fffd4a99e62784e1df243b90ddc3`
- **Contribución técnica:** Creación de las suites unitarias `tests/unit/schema.spec.ts`, `tests/unit/conflict-policy.spec.ts` y `tests/unit/capabilities-pure.spec.ts`, además de la estrategia de pruebas documentada en `docs/test-strategy.md`.
- **Decisión técnica que puedo explicar:** Se utilizaron aserciones de Node.js y ejecución mediante `tsx` para comprobar las reglas existentes sin modificar sus implementaciones. Los casos cubren validación de registros y operaciones, precedencia de conflictos por versión y fecha, desempate determinista, mapeo de laboratorios con coordenadas sintéticas y generación de evidencia ficticia. Las pruebas evitan depender de una cámara o ubicación física.
- **Pruebas ejecutadas y resultado:**
  - `npx tsx tests/unit/schema.spec.ts` — PASS.
  - `npx tsx tests/unit/conflict-policy.spec.ts` — PASS.
  - `npx tsx tests/unit/capabilities-pure.spec.ts` — PASS.
  - `npm test` — PASS, suites existentes.
  - `npm run build` — PASS.
  - `npm run verify` — PASS.
- **Limitación encontrada:** Las nuevas suites se ejecutaron por separado y aún no forman parte del comando general `npm test`. Su incorporación debe coordinarse con el responsable de `package.json`. Las pruebas de integración y E2E requieren la validación correspondiente del equipo.
- **Cambio que puedo explicar o modificar en vivo:** Puedo demostrar los casos positivos y negativos de las funciones de esquema, modificar los escenarios de resolución de conflictos, comprobar el mapeo con coordenadas sintéticas y explicar la matriz de riesgos de la estrategia.
- **Uso declarado de IA:** Utilicé ChatGPT como apoyo para diseñar escenarios de prueba y estructurar la documentación técnica. Revisé los archivos y ejecuté individualmente las tres suites, además de ejecutar las pruebas existentes, la compilación y la verificación del proyecto.


## Semana 08 — Segundo parcial — Pacheco Avila Carlos Alberto

**Área:** Pruebas de integración y configuración de CI.

**Rama:** `test/w08-integration-ci-pacheco`

**Commit SHA individual:** `867fb050529ad7788cbc7c9aa15470be1173128a`

### Aportaciones individuales

- Implementación de `tests/integration/sync-queue.spec.ts` con cinco grupos de verificación: persistencia, transiciones de estado, ACK válido, reintentos con backoff exponencial, recuperación después de cierre inesperado y rechazo de respuestas fuera de orden.
- Implementación de `tests/integration/server-dedup.spec.ts` para verificar la deduplicación de operaciones y detectar su desactivación mediante un escenario de sabotaje controlado.
- Creación del workflow `.github/workflows/academic-evaluation.yml` para ejecutar instalación de dependencias, compilación y pruebas automatizadas.
- Actualización de `package.json` para incorporar ambas suites a la ejecución general.

### Decisión técnica

Se utilizaron almacenamiento en memoria, identificadores sintéticos y funciones deterministas para validar la interacción entre componentes sin depender de conexiones externas.

La prueba antisabotaje comprueba que el sistema de detección identifica la creación de registros duplicados cuando se desactiva la deduplicación, sin introducir un fallo permanente en la ejecución normal de CI.

### Comandos de verificación

- `npx.cmd tsx tests/integration/sync-queue.spec.ts` — PASS.
- `npx.cmd tsx tests/integration/server-dedup.spec.ts` — PASS.
- `npm.cmd test` — PASS.
- `npm.cmd run test -- --run` — PASS.
- `npm.cmd run build` — PASS.
- `npm.cmd run verify` — PASS.
- `git diff --check` — Sin errores.

### Limitaciones

Las pruebas utilizan almacenamiento y servidor simulados. No sustituyen las pruebas de integración con infraestructura real ni la verificación del workflow en GitHub Actions.

### Declaración de uso de IA

Se utilizó ChatGPT (OpenAI) como apoyo para diseñar escenarios de prueba, estructurar los archivos TypeScript y configurar el workflow de CI.

La implementación fue revisada e integrada manualmente. Se ejecutaron las pruebas y verificaciones en el entorno local, comprobando sus resultados antes de registrar los cambios.




## Historial

La evidencia completa de semanas anteriores permanece en [el historial del equipo](../docs/history/evidence-semanas-01-06.md).
