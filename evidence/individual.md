# Evidencia individual — Semana 09

## Carlos Olaya Gutiérrez — núcleo de seguridad e integración

- Commit del incremento revisado: 9e684c158709cd7e7dd711d4063ae6c15a1c3a8b, rama feat/w09-security-core-carlos.
- Validación humana confirmada por Carlos: revisé, probé y validé manualmente en local la autenticación, RBAC por rol, validación con respuesta 400, CSP con nonce por respuesta y purga offline al cerrar sesión.
- Decisión técnica: comprobar identidad y permisos en el servidor Node local, minimizar datos persistidos y rechazar por defecto el acceso fuera del propietario o alcance asignado.
- Verificación automatizada del incremento: npm run verify, 19/19 suites, build de producción y comprobaciones HTTP y de navegador. La ejecución automatizada por Codex y la validación manual declarada por Carlos son evidencias distintas.
- Comprobación automatizada de los ajustes posteriores: npm ci, npm run build y npm test (19/19 suites); acceso HTTP y navegador Chrome sobre el build de producción sin archivo de cuentas, enmascaramiento visual, purga offline y revocación al reconectar. El archivo de cuentas previo se restauró al terminar.
- Limitaciones: servidor de un solo proceso, datos sintéticos, borradores sin cifrado y revocación remota diferida cuando no existe conexión. El escáner literal detecta el nombre de una dependencia del lockfile, sin que eso implique una credencial expuesta.
- Uso declarado de IA: OpenAI Codex asistió en implementación, pruebas y documentación. Carlos revisó y validó personalmente el incremento señalado. Los ajustes posteriores de cuentas predeterminadas y enmascaramiento visual tienen comprobación automatizada; esta nota no anticipa una nueva validación manual.

---

# Evidencia individual — Semana 08

## Alcance del equipo y trazabilidad

Se conserva la historia de commits de los tres integrantes mediante merges en semana-08-testing-ci. La división de responsabilidades justifica el trabajo en equipo: Alexis cubre reglas unitarias y estrategia; Pacheco, integración de sincronización y CI inicial; Carlos, flujo crítico, regresiones complementarias y consolidación reproducible. Cada integrante debe poder defender su contribución.

| Integrante | Aporte fuente | SHA de implementación |
|---|---|---|
| Montalvo Osorio Alexis | PR #25, unitarias y estrategia | bffe72e4a084fffd4a99e62784e1df243b90ddc3 |
| Pacheco Avila Carlos Alberto | PR #26, integración y CI inicial | 867fb050529ad7788cbc7c9aa15470be1173128a |
| Carlos Olaya Gutiérrez | E2E, regresiones, ejecutor y consolidación asistida | 52beb186e9ae4234dbf9563fb943f654ea9bcefb |

El tag week-08-final identifica la entrega con la revisión humana confirmada. Los reportes generados registran el SHA exacto ejecutado; se obtiene también con git rev-parse HEAD. Las aportaciones originales no se reemplazan por una atribución colectiva.

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


---

## Semana 09 — Montalvo Osorio Alexis

**Área:** Modelado de amenazas, inventario de privacidad y rastreo mínimo.

**Rama:** `docs/w09-threat-privacy-alexis`

**Commit SHA de aportación documental:** `06dd988a7579c336de755ae94f86eaf950f07f53`

### Aportaciones individuales

- Elaboración de `docs/threat-model.md`, incluyendo el escenario de una tableta extraviada con inspecciones registradas offline, las fronteras de confianza, las cinco preguntas de ingeniería y la matriz de riesgos.
- Elaboración de `docs/privacy-data-inventory.md`, identificando los datos sintéticos, sus finalidades, almacenamiento, conservación y medidas de privacidad por diseño bajo la LGPDPPSO.
- Creación de `public/robots.txt` con directivas para permitir la raíz pública y excluir rutas operativas e internas.
- Revisión técnica de los controles existentes en la rama de seguridad del equipo para relacionar cada amenaza con su implementación y prueba prevista.

### Decisión técnica

Se decidió documentar únicamente controles comprobados mediante la inspección del código existente, diferenciando las medidas implementadas de las limitaciones y riesgos residuales.

El modelo considera que el cliente no es confiable y que la identidad y los permisos deben comprobarse en el servidor. Para el inventario se distinguió entre información persistida y datos procesados temporalmente, especialmente las fotografías y coordenadas de ubicación.

### Comandos y verificaciones ejecutadas

- `git diff --cached --check` — PASS.
- `git diff --cached --name-only` — PASS; únicamente los tres entregables asignados.
- Revisión individual de los tres archivos mediante PowerShell — Sin coincidencias con los términos restringidos.
- `git rev-parse HEAD` — SHA registrado correctamente.
- `git status` — Working tree limpio después del commit.

El comprobador público fue ejecutado, pero mostró coincidencias en archivos preexistentes de la rama base. Su mensaje final de aprobación no se consideró evidencia válida de que el repositorio completo estuviera limpio.

### Limitaciones identificadas

- El núcleo de seguridad de Carlos todavía está pendiente de integración.
- La suite final `tests/security.spec.ts` corresponde a Pacheco y deberá verificarse en el commit conjunto.
- La limpieza local no equivale a revocación remota cuando el dispositivo permanece sin conexión.
- La persistencia del servidor corresponde a un prototipo local de un solo proceso.
- La revisión documental no sustituye la ejecución de las pruebas negativas ni la validación del flujo completo.

### Declaración de uso de IA y validación humana

Se utilizó ChatGPT como apoyo para inspeccionar la arquitectura del proyecto, analizar los controles de seguridad, consultar materiales académicos y fuentes normativas, estructurar los documentos y revisar su coherencia técnica.

El estudiante revisó y aprobó el contenido de los apartados, contrastó las afirmaciones con el código del proyecto, ejecutó las verificaciones locales y autorizó el commit de los entregables.

La asistencia de IA no sustituye la responsabilidad del estudiante de explicar y defender las decisiones técnicas realizadas.


---

## Semana 09 — Pacheco Avila Carlos Alberto

**Área:** Pruebas negativas de seguridad e integración continua.

**Rama:** `test/w09-security-ci-pacheco`

**Commit individual:** `d0c7930876aef441dcc50cc24c3cdf303d251026`.

### Aportaciones

- Creación de tests/security.spec.ts con 14 verificaciones.
- Pruebas de control de acceso por propietario, rol y laboratorio asignado.
- Pruebas de rechazo de niveles de riesgo y cantidades de hallazgos inválidos.
- Comprobación de limpieza de almacenamiento privado, cachés y cola de operaciones.
- Verificación del escape de contenido HTML y las restricciones CSP.
- Comprobación de documentación de amenazas, inventario de privacidad y robots.txt.
- Pruebas de contingencia para cámara y ubicación sin capacidades disponibles.
- Incorporación del workflow oficial de Semana 09.

### Decisión técnica

Se eligieron pruebas deterministas mediante funciones reales del proyecto y adaptadores en memoria para comprobar comportamientos negativos sin depender de infraestructura externa.

Se mantuvieron las implementaciones de seguridad del equipo sin alterarlas.

### Verificaciones realizadas

- npx.cmd tsx tests/security.spec.ts — PASS, 14 verificaciones.
- npm.cmd test — PASS, 20 de 20 suites.
- npm.cmd run typecheck — PASS.
- npm.cmd run verify — PASS.
- Compilación de producción — PASS.

### Limitaciones

Las pruebas de contingencia no simulan todavía el rechazo explícito de permisos por parte del navegador.

La limpieza local de datos no demuestra revocación remota inmediata durante una desconexión.

El workflow de GitHub Actions y las comprobaciones privadas requieren validación adicional.

### Uso de inteligencia artificial

Se utilizó ChatGPT de OpenAI para apoyar el diseño de escenarios negativos, la estructuración de pruebas TypeScript y la documentación técnica.

El estudiante revisó los cambios, ejecutó los comandos de verificación en su equipo y comprobó los resultados obtenidos. La validación final del workflow y la revisión de los cambios pendientes se realizarán antes de la entrega.