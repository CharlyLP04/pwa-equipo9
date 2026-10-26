# PWA de inspecciones — entrega Semana 08

Proyecto integrador acumulado de inspecciones y mantenimiento de laboratorios. Equipo: Carlos Olaya Gutiérrez, Montalvo Osorio Alexis y Pacheco Avila Carlos Alberto. Datos funcionales y escenarios de prueba exclusivamente sintéticos.

## Incremento y responsabilidades

Se integran las unitarias y estrategia de Alexis (PR #25), las pruebas de integración y CI inicial de Pacheco (PR #26), y el flujo crítico, regresiones adicionales, ejecutor y reportes preparados con asistencia de Codex. Los commits fuente se conservan en el historial. La integración está en semana-08-testing-ci; week-08-final-v2 identifica la entrega con revisión humana confirmada; week-08-final conserva la versión anterior.

## Entorno e instalación

Next.js 14.2.35, React 18, TypeScript y Node 20. Se recomienda la versión 20.20.2 comprobada en CI. El archivo .nvmrc selecciona la rama 20; no se requieren servicios externos para ejecutar las pruebas.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run dev
```

Abrir http://localhost:3000/inspecciones. La instalación necesita acceso al registro público; las suites se ejecutan con simulaciones locales y sin hardware físico.

## Verificación completa

```sh
npm run verify
# Equivalente exacto cuando make está disponible:
make verify
# Toda la pirámide sin recompilar:
npm run test --if-present -- --run
```

verify comprueba artefactos, ejecuta tsc --noEmit, next build y todas las suites. El runner descubre recursivamente archivos .spec.ts y .spec.mjs, aísla procesos, aplica un límite de 60 segundos por suite y devuelve fallo si alguna falla. --run se acepta explícitamente.

## Pirámide y evidencia

18 suites: 7 heredadas, 6 unitarias, 4 de integración y 1 de flujo crítico sintético. Una suite contiene múltiples aserciones; el número de archivos no representa cobertura porcentual.

- tests/unit/: originales de Alexis, límites del esquema, conflictos y fallback de dispositivos.
- tests/integration/: originales de Pacheco, recuperación, agotamiento de reintentos y oráculo de regresión.
- tests/e2e/critical-path.spec.ts: captura offline, persistencia, recarga, evento online, ACK y vaciado; recuperación tras ACK perdido.
- [Estrategia y matriz de riesgos](docs/test-strategy.md).
- [Evidencia individual de los tres integrantes](evidence/individual.md).
- test-results/results.json: resultados de todas las suites y SHA.
- test-results/verification.json: comandos, salidas y estado del árbol local.
- .github/workflows/academic-evaluation.yml: Ubuntu, Node 20, instalación limpia y publicación de reportes incluso si falla la verificación.

Los reportes son generados; no se editan para aparentar aprobación. El artefacto semana-08-evidence de Actions corresponde al SHA mostrado en la ejecución. El tag debe crearse únicamente después de una ejecución satisfactoria del commit final.

## Decisiones y límites

Se preservan los contratos de producción. date es texto libre en el esquema heredado y los ACK históricos posteriores al purgado requieren trabajo adicional. El E2E es sintético de dominio, no una prueba de navegador. No se declara una métrica de cobertura instrumentada ni aprobación de checks privados.

El check público original imprime coincidencias léxicas en documentación y una dependencia legítima del lockfile, pero devuelve PUBLIC_OK por su uso de negación en Bash. La estrategia explica el diagnóstico; el check y el lockfile se conservan sin ocultar coincidencias. Esta salida no certifica seguridad ni una nota de 8/8.

Carlos confirmó la revisión del código, los resultados y las aportaciones por los tres integrantes después del primer tag. La confirmación está registrada en evidence/individual.md. Se mantiene la declaración de IA y cada integrante debe poder explicar su contribución.

## Documentación acumulada

Se conserva completo el [README de semanas anteriores](docs/history/readme-semanas-01-06.md), la [evidencia histórica](docs/history/evidence-semanas-01-06.md) y la [estrategia original de Alexis](docs/history/w08-alexis-strategy.md). Los comandos antiguos se presentan como historia; prevalecen los de esta página.
