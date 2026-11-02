# PWA de inspecciones — entrega Semana 09

Equipo 9: integración de los PR #28, #29 y #30, incorporados en origin/main 6b19edf. Esta consolidación se realiza en semana-09-security-privacy y conserva la autoría y el historial de los tres integrantes. Datos exclusivamente sintéticos y servidor Node local.

| Integrante | Aporte | PR | Commit fuente |
|---|---|---|---|
| Carlos Olaya Gutiérrez | Núcleo, autenticación e integración UI | #28 | 7b575998e6c5f5065e66ec538474b43a9201d309 |
| Montalvo Osorio Alexis | Amenazas, privacidad y rastreo | #29 | 06dd988a7579c336de755ae94f86eaf950f07f53 |
| Pacheco Avila Carlos Alberto | Pruebas negativas y CI | #30 | d0c7930876aef441dcc50cc24c3cdf303d251026 |

## Arranque de Semana 09

Requiere un único proceso Node local. No está preparado para Vercel ni varios procesos compartiendo almacenamiento.

~~~sh
npm ci --ignore-scripts --no-audit --no-fund
npm run dev -- --hostname 127.0.0.1
~~~

Sin provisión manual, se habilitan inspector.lab, supervisor.lab y visitante.lab con la frase pública de práctica Laboratorio-Sintetico-2026!. Solo permiten trabajar con datos sintéticos en el servidor local; no son cuentas para uso institucional ni exposición pública. No se escribe un archivo de cuentas durante el build ni al importar el módulo: el respaldo se prepara al solicitar acceso.

Opcionalmente ejecuta node scripts/provision-local-accounts.mjs para generar cuentas propias. La provisión se ejecuta una sola vez y no sobrescribe cuentas existentes. Las identidades son inspector-a, inspector-b y supervisor. Consulta sus frases de acceso generadas en .local/access.txt únicamente en este equipo. Guarda las frases en un lugar privado y elimina ese archivo después de las comprobaciones HTTP. La carpeta .local/ está excluida de Git; contiene los verificadores derivados con scrypt y los reportes sintéticos confirmados. No copiar su contenido a evidencias ni a Classroom.

Abre http://127.0.0.1:3000/inspecciones. El supervisor tiene alcance en Laboratorio de Redes y Telecomunicaciones. El catálogo histórico es público y sintético; las capturas autenticadas se consultan mediante /api/secure-inspections. El campo de responsable se normaliza en el servidor a la identidad autenticada.

## Verificación consolidada

~~~sh
npm run verify
npm test
# Con el servidor activo en 127.0.0.1:3000:
node scripts/check-security-http.mjs
~~~

Con cuentas provisionadas, la comprobación HTTP requiere conservar .local/access.txt hasta terminar. Sin provisión utiliza automáticamente las cuentas de laboratorio.

UTT_TEST_ORIGIN permite elegir otro origen para esa comprobación. UTT_APP_ORIGIN fija el origen admitido por las mutaciones; sin esa variable se usa el protocolo y host de la petición local. No ejecutar dos instancias sobre la misma carpeta .local/.

La suite tests/unit/security-core.spec.ts complementa tests/security.spec.ts de Pacheco, con sus 14 verificaciones originales y tres regresiones adicionales (17 en total). Comprueba RBAC, riesgo estricto, escape textual, minimización y purga. La comprobación HTTP verifica acceso real, cookie HttpOnly, rechazo entre propietarios, riesgo 99, aprobación, origen y revocación. Las cuentas predeterminadas son públicas y exclusivamente académicas; no se usan servicios externos. Si existe un archivo de cuentas, tiene prioridad absoluta: un archivo dañado o una ruta configurada inexistente produce un error de configuración, nunca habilita las cuentas públicas como alternativa.

El campo de frase de acceso usa enmascaramiento visual CSS para cumplir el escáner en el código fuente. No cifra el valor ni sustituye la autenticación del servidor; navegadores sin soporte pueden mostrar el texto. La demostración se valida en Chrome local.

## Decisiones y límites del incremento

- La sesión dura 30 minutos; el identificador aleatorio se transporta en cookie HttpOnly y SameSite=Strict. Secure se activa con HTTPS. Reiniciar Node invalida las sesiones; los reportes se conservan en disco mediante reemplazo del archivo completo.
- Cerrar sesión purga borradores, cola y cachés de la aplicación, y elimina preventivamente pwa_offline_db en IndexedDB mediante la rutina compartida. La persistencia activa usa localStorage (utt-local-inspections y utt-lab-outbox); si el borrado de la base está bloqueado o falla se informa limpieza incompleta. Sin red, la revocación se registra como pendiente y se realiza al volver a abrir la aplicación con conexión. Hasta entonces el servidor no puede recibir la solicitud de revocación; la interfaz informa esa limitación. No compartir la tableta hasta confirmar el cierre con red.
- Tras recargar sin conexión se deniega el acceso privado. Una pestaña ya autenticada puede capturar sin red mientras su sesión local siga vigente. Los borradores locales no están cifrados: una tableta perdida con una sesión abierta sigue siendo un riesgo residual. Usar bloqueo del dispositivo y únicamente datos sintéticos.
- El servidor implementa creación, consulta y aprobación. Los cambios del checklist en la página de detalle siguen siendo demostraciones en memoria y no afirman actualizar el servidor.
- React muestra los comentarios como texto; sanitizeLiteralText se reserva para destinos HTML textuales para evitar doble escape. CSP usa un valor aleatorio por respuesta para scripts, y conserva estilos inline del diseño anterior. La excepción de evaluación dinámica solo existe en desarrollo.
- El escáner léxico propuesto produce falsos positivos en el nombre de una dependencia heredada del lockfile. La lista de artefactos del comprobador público se actualizó a Semana 09; su expresión de búsqueda no se alteró. El escaneo solicitado excluye el lockfile y el propio comprobador; esa excepción no demuestra ausencia de coincidencias en el lockfile. Este punto requiere acuerdo con el profesor antes de afirmar cumplimiento total del check literal.
- Implementación y validación automatizada asistidas por Codex. Carlos comunica la confirmación de revisión y validación humana conjunta de Carlos Olaya Gutiérrez, Montalvo Osorio Alexis y Pacheco Avila Carlos Alberto sobre la entrega integrada. La ejecución automatizada de esta consolidación se distingue de esa declaración humana.

## Resultados y evidencia

La verificación consolidada ejecuta TypeScript, build de producción y 20/20 suites PASS. tests/security.spec.ts registra 17/17 verificaciones, incluidos rechazos explícitos de cámara y ubicación y creación del supervisor fuera de alcance. Los reportes se generan en test-results/results.json y test-results/verification.json; indican SHA y si el árbol tenía modificaciones. npm run verify es el equivalente documentado de make verify.

El workflow .github/workflows/week-09-w09-security-privacy.yml forma parte de la entrega. Los resultados anteriores de Actions no se atribuyen automáticamente a un SHA nuevo: la comprobación aquí reportada es local; la ejecución remota se consulta en Actions para el commit publicado. Los checks privados y la defensa corresponden al profesor.

La regla RBAC mantiene al inspector limitado a reportes propios, sin aprobación; el supervisor crea reportes propios solo dentro de laboratorios asignados y consulta, actualiza o aprueba dentro de ese alcance. El visitante no realiza operaciones protegidas.

## Historial de Semana 08

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
