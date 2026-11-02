# Semana 09 — núcleo de Carlos en desarrollo local

La autenticación es real y usa cuentas sintéticas; los roles proceden del servidor, no de un selector del navegador. Este incremento se mantiene en la rama feat/w09-security-core-carlos. Los documentos finales de amenazas e inventario corresponden a Alexis; tests/security.spec.ts y la consolidación de CI quedan para la coordinación con Pacheco. La sección histórica de Semana 08 se conserva más abajo.

## Arranque de Semana 09

Requiere un único proceso Node local. No está preparado para Vercel ni varios procesos compartiendo almacenamiento.

~~~sh
npm ci --ignore-scripts --no-audit --no-fund
npm run dev -- --hostname 127.0.0.1
~~~

Sin provisión manual, se habilitan inspector.lab, supervisor.lab y visitante.lab con la frase pública de práctica Laboratorio-Sintetico-2026!. Solo permiten trabajar con datos sintéticos en el servidor local; no son cuentas para uso institucional ni exposición pública. No se escribe un archivo de cuentas durante el build ni al importar el módulo: el respaldo se prepara al solicitar acceso.

Opcionalmente ejecuta node scripts/provision-local-accounts.mjs para generar cuentas propias. La provisión se ejecuta una sola vez y no sobrescribe cuentas existentes. Las identidades son inspector-a, inspector-b y supervisor. Consulta sus frases de acceso generadas en .local/access.txt únicamente en este equipo. Guarda las frases en un lugar privado y elimina ese archivo después de las comprobaciones HTTP. La carpeta .local/ está excluida de Git; contiene los verificadores derivados con scrypt y los reportes sintéticos confirmados. No copiar su contenido a evidencias ni a Classroom.

Abre http://127.0.0.1:3000/inspecciones. El supervisor tiene alcance en Laboratorio de Redes y Telecomunicaciones. El catálogo histórico es público y sintético; las capturas autenticadas se consultan mediante /api/secure-inspections. El campo de responsable se normaliza en el servidor a la identidad autenticada.

## Comprobaciones del núcleo

~~~sh
npm run verify
# Con el servidor activo en 127.0.0.1:3000:
node scripts/check-security-http.mjs
~~~

Con cuentas provisionadas, la comprobación HTTP requiere conservar .local/access.txt hasta terminar. Sin provisión utiliza automáticamente las cuentas de laboratorio.

UTT_TEST_ORIGIN permite elegir otro origen para esa comprobación. UTT_APP_ORIGIN fija el origen admitido por las mutaciones; sin esa variable se usa el protocolo y host de la petición local. No ejecutar dos instancias sobre la misma carpeta .local/.

La suite propia está en tests/unit/security-core.spec.ts; no sustituye la suite final de Pacheco. Comprueba RBAC, riesgo estricto, escape textual, minimización y purga. La comprobación HTTP verifica acceso real, cookie HttpOnly, rechazo entre propietarios, riesgo 99, aprobación, origen y revocación. Las cuentas predeterminadas son públicas y exclusivamente académicas; no se usan servicios externos. Si existe un archivo de cuentas, tiene prioridad absoluta: un archivo dañado o una ruta configurada inexistente produce un error de configuración, nunca habilita las cuentas públicas como alternativa.

El campo de frase de acceso usa enmascaramiento visual CSS para cumplir el escáner en el código fuente. No cifra el valor ni sustituye la autenticación del servidor; navegadores sin soporte pueden mostrar el texto. La demostración se valida en Chrome local.

## Decisiones y límites del incremento

- La sesión dura 30 minutos; el identificador aleatorio se transporta en cookie HttpOnly y SameSite=Strict. Secure se activa con HTTPS. Reiniciar Node invalida las sesiones; los reportes se conservan en disco mediante reemplazo del archivo completo.
- Cerrar sesión purga borradores, cola y cachés de la aplicación. Sin red, la revocación se registra como pendiente y se realiza al volver a abrir la aplicación con conexión. Hasta entonces el servidor no puede recibir la solicitud de revocación; la interfaz informa esa limitación. No compartir la tableta hasta confirmar el cierre con red.
- Tras recargar sin conexión se deniega el acceso privado. Una pestaña ya autenticada puede capturar sin red mientras su sesión local siga vigente. Los borradores locales no están cifrados: una tableta perdida con una sesión abierta sigue siendo un riesgo residual. Usar bloqueo del dispositivo y únicamente datos sintéticos.
- El servidor implementa creación, consulta y aprobación. Los cambios del checklist en la página de detalle siguen siendo demostraciones en memoria y no afirman actualizar el servidor.
- React muestra los comentarios como texto; sanitizeLiteralText se reserva para destinos HTML textuales para evitar doble escape. CSP usa un valor aleatorio por respuesta para scripts, y conserva estilos inline del diseño anterior. La excepción de evaluación dinámica solo existe en desarrollo.
- El escáner léxico propuesto produce falsos positivos en el nombre de una dependencia heredada del lockfile. No se ha modificado el escáner ni escondido coincidencias. Este punto requiere acuerdo con el profesor antes de afirmar cumplimiento total del check literal.
- Implementación y validación automatizada asistidas por Codex. Carlos Olaya Gutiérrez confirmó su revisión, prueba y validación manual en local de autenticación, RBAC por rol, respuesta 400, CSP con nonce por respuesta y purga offline al cerrar sesión. Esta confirmación corresponde al incremento 9e684c158709cd7e7dd711d4063ae6c15a1c3a8b, anterior a los ajustes de arranque automático y enmascaramiento visual de esta revisión. No se extiende la declaración a sus compañeros.

---

# PWA de inspecciones — entrega Semana 08

Proyecto integrador acumulado de inspecciones y mantenimiento de laboratorios. Equipo: Carlos Olaya Gutiérrez, Montalvo Osorio Alexis y Pacheco Avila Carlos Alberto. Datos funcionales y escenarios de prueba exclusivamente sintéticos.

## Incremento y responsabilidades

Se integran las unitarias y estrategia de Alexis (PR #25), las pruebas de integración y CI inicial de Pacheco (PR #26), y el flujo crítico, regresiones adicionales, ejecutor y reportes preparados con asistencia de Codex. Los commits fuente se conservan en el historial. La integración está en semana-08-testing-ci; week-08-final identifica la entrega con revisión humana confirmada.

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




---

## Semana 09 — Seguridad y privacidad

### Pruebas implementadas

Se incorporó `tests/security.spec.ts` para comprobar el control de acceso por roles (RBAC), la validación de entradas, la limpieza de datos privados al cerrar sesión, la protección frente a contenido HTML y las restricciones de Content Security Policy (CSP).

La suite contiene 14 verificaciones con datos sintéticos y sin dependencias de servicios externos.

### Ejecución de pruebas

```sh
npx tsx tests/security.spec.ts
npm test
npm run typecheck
npm run verify
```

### Resultados

- 14/14 verificaciones de seguridad aprobadas.
- 20/20 suites generales aprobadas.
- TypeScript sin errores.
- Compilación de producción y verificación general satisfactorias.

### Integración continua

Se incorporó el workflow oficial `.github/workflows/week-09-w09-security-privacy.yml`, que verifica instalación, compilación, existencia de entregables y ejecución de pruebas.

### Limitaciones

Las pruebas de contingencia verifican el comportamiento cuando no están disponibles las capacidades de cámara y ubicación. La simulación explícita de permisos denegados todavía está pendiente.

La ejecución local no sustituye la evaluación del workflow en GitHub Actions.