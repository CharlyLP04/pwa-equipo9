# PWA de inspecciones — Semana 08

Incremento local sobre la aplicación acumulada Next.js 14.2.35, React 18 y TypeScript. Datos de prueba exclusivamente sintéticos. Se mantienen los contratos de producción y las siete suites anteriores; se agregan seis suites de unidad, integración y flujo crítico.

## Instalación y ejecución
Usar Node 20.11 o superior de la rama 20 (ver .nvmrc).

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run dev
```

Abrir http://localhost:3000/inspecciones. Capturar una inspección sintética con la red desactivada, comprobar persistencia tras recarga y recuperar la conexión. Esta comprobación humana sigue pendiente; las suites automatizadas no la sustituyen.

## Verificación reproducible
```sh
npm run verify
npm run test --if-present -- --run
```

make verify invoca exactamente npm run verify. En Windows, el segundo es el equivalente sin instalar make. La verificación ejecuta tsc --noEmit, next build y node scripts/test-runner.mjs --run. Las suites también pueden ejecutarse individualmente con npx tsx tests/integration/server-dedup.spec.ts.

## Artefactos
- tests/unit/: esquema, conflictos y capacidades sintéticas.
- tests/integration/: cola persistida y deduplicación con fallo inducido.
- tests/e2e/: flujo offline/online y recuperación tras ACK perdido.
- docs/test-strategy.md: matriz de riesgos, decisiones y límites.
- .github/workflows/academic-evaluation.yml: instalación, tipos, build, pruebas y reportes en Ubuntu/Node 20.
- test-results/results.json y verification.json: evidencia generada, con salida de comandos.
- evidence/individual.md: trazabilidad y declaración de IA.

## Límites de entrega
El flujo E2E es sintético, no una automatización de navegador. El check público del kit se conserva sin cambios y imprime coincidencias léxicas en dependencias y documentos heredados aunque termina con código 0 (ver diagnóstico de Bash en la estrategia); no se declara una calificación ni aprobación de checks privados. Ver la estrategia para los hallazgos sobre fechas y ACK históricos. La validación humana y la ejecución remota de Actions deben constar como realizadas antes de entregar; no se inventa evidencia.
