
# Estrategia de pruebas — Semana 08

## 1. Objetivo y alcance

Esta estrategia define cómo comprobar la calidad de la PWA de inspecciones de laboratorio mediante pruebas unitarias, de integración y de extremo a extremo (E2E).

El objetivo es detectar regresiones en la validación de registros, la resolución de conflictos, las capacidades del dispositivo y el flujo de captura y sincronización offline.

Todas las pruebas deben utilizar datos sintéticos. La ejecución no debe depender de dispositivos físicos, servicios privados ni registros reales.

## 2. Pirámide de pruebas

Las proporciones siguientes son objetivos de diseño, no porcentajes de cobertura medidos.

| Nivel | Proporción objetivo | Alcance principal |
|---|---:|---|
| Unitarias | 70 % | Validadores, reglas de conflicto y funciones puras |
| Integración | 20 % | Persistencia, cola de sincronización, reintentos y deduplicación |
| E2E | 10 % | Flujo completo de captura local y sincronización |

### Pruebas unitarias

Deben ser rápidas, aisladas y reproducibles. Cada caso comprueba una regla concreta sin iniciar la aplicación completa.

Archivos de esta contribución:

- `tests/unit/schema.spec.ts`: validación de registros locales y operaciones pendientes, incluidos datos inválidos.
- `tests/unit/conflict-policy.spec.ts`: precedencia por versión, fecha más reciente y desempate determinista.
- `tests/unit/capabilities-pure.spec.ts`: asignación de laboratorio a partir de coordenadas sintéticas y generación de evidencia fotográfica sintética.

### Pruebas de integración

Comprueban que varios componentes colaboren correctamente.

Deben verificar la persistencia de operaciones, la recuperación de la cola después de una recarga, los reintentos y la deduplicación en el servidor simulado. Esta parte debe coordinarse con el responsable de integración.

### Pruebas E2E

Comprueban el recorrido de usuario desde la captura de una inspección hasta su sincronización.

El recorrido esperado consiste en registrar una inspección sin conexión, comprobar que sigue disponible localmente y, después de recuperar la conexión, verificar que se sincroniza sin crear registros duplicados.

La ejecución de este nivel debe coordinarse con el equipo y no se considera completada solo por tener descrito el escenario.

## 3. Matriz de riesgos y pruebas

| Riesgo | Nivel | Prueba propuesta | Resultado esperado |
|---|---|---|---|
| Un registro corrupto se acepta | Unitario | Enviar valores nulos, tipos incorrectos, identificadores vacíos y fechas inválidas | El validador rechaza los casos que incumplen su contrato |
| Una operación pendiente contiene datos incorrectos | Unitario | Probar estados, intentos, identificadores y contenido inválidos | La operación no supera la validación |
| Se elige el registro equivocado durante un conflicto | Unitario | Comparar versiones, fechas iguales y distintas | Se respeta el orden de precedencia definido |
| El mismo conflicto produce resultados distintos | Unitario | Ejecutar el mismo conflicto en ambos órdenes | Se selecciona el mismo registro ganador |
| Las coordenadas asignan un laboratorio incorrecto | Unitario | Utilizar las coordenadas sintéticas de cada laboratorio | Se identifica el laboratorio esperado |
| La evidencia sintética cambia en su contenido esencial | Unitario | Generar evidencia con las mismas entradas | Se mantienen los datos visuales y las dimensiones; la fecha puede variar |
| Una recarga pierde operaciones pendientes | Integración | Persistir una operación y reconstruir la cola | La operación recupera su estado pendiente |
| Un reintento crea una segunda inspección | Integración | Reenviar la misma operación lógica al servidor simulado | Se conserva un solo registro lógico |
| La captura no funciona de extremo a extremo sin conexión | E2E | Registrar, recargar y recuperar conexión | La captura persiste y se sincroniza correctamente |
| La recuperación de conexión deja operaciones sin procesar | Integración / E2E | Simular desconexión, reintento y recuperación | Las operaciones elegibles terminan sincronizadas |

## 4. Datos y reproducibilidad

Las pruebas utilizarán exclusivamente:

- Identificadores ficticios y estables para los escenarios.
- Fechas de referencia explícitas cuando el caso lo requiera.
- Nombres de laboratorios de demostración y coordenadas sintéticas.
- Almacenamiento en memoria o adaptadores controlados por la prueba.
- Simulaciones locales para fallos de conexión y respuestas repetidas.

Las pruebas no deben necesitar cámara física, geolocalización real, conexión a servicios externos ni credenciales de infraestructura.

Cuando una función genera una fecha automáticamente, la prueba debe distinguir entre los datos estables y la fecha dinámica. No debe exigir que dos ejecuciones realizadas en momentos distintos produzcan una salida idéntica si el contrato permite esa variación.

## 5. Ejecución local

Desde la raíz del repositorio, se recomienda instalar las dependencias con el archivo de bloqueo y ejecutar las suites unitarias explícitamente:

```bash
npm ci
npx tsx tests/unit/schema.spec.ts
npx tsx tests/unit/conflict-policy.spec.ts
npx tsx tests/unit/capabilities-pure.spec.ts
```

Después deben ejecutarse los comandos generales del proyecto:

```bash
npm run build
npm test
npm run verify
make verify
bash public-tests/check.sh
```

`make verify` ejecuta el comando de verificación configurado por el proyecto. La verificación genera `reports/verification.json`.

Mientras las nuevas suites unitarias no estén incorporadas al comando general de pruebas, deben ejecutarse explícitamente mediante los comandos anteriores. La incorporación al script compartido debe coordinarse con la persona responsable de `package.json`.

El resultado de cada comando debe registrarse a partir de su ejecución real. No se deben declarar como aprobadas pruebas que no se hayan ejecutado.

## 6. Fallo diagnosticado y corrección de la deduplicación

### Escenario del fallo

Una operación puede llegar al servidor, ser procesada y, aun así, perderse la respuesta por un tiempo de espera agotado. El cliente no sabe si la operación fue aplicada, por lo que vuelve a enviarla.

Si el servidor trata el reintento como una operación nueva, puede crear una segunda inspección para una misma acción lógica.

### Corrección esperada

Cada operación lógica debe conservar su llave de idempotencia en todos los reintentos. El servidor simulado debe registrar la llave procesada y reconocer los envíos posteriores que utilicen la misma llave.

El comportamiento esperado es:

1. El primer envío crea el registro y devuelve su identificador asignado.
2. El reintento de la misma operación se reconoce como duplicado.
3. El servidor devuelve el identificador original.
4. El número de registros lógicos permanece en uno.

Esto evita que la repetición de una solicitud provoque múltiples registros para una sola acción.

### Prueba negativa mediante inyección de fallos

La prueba debe permitir desactivar deliberadamente la deduplicación en el servidor simulado.

Con la deduplicación desactivada, se envía la misma operación dos veces y se comprueba que el simulador registra dos envíos y asigna identificadores diferentes. Este escenario demuestra que la suite puede exponer el defecto cuando se elimina la protección.

La prueba negativa no representa el comportamiento aceptable de producción: es una comprobación deliberada de que el mecanismo de evaluación detecta esa regresión.

Para considerar corregido el escenario normal, la ejecución con deduplicación habilitada debe demostrar que ambos envíos corresponden al mismo registro lógico.

**Estado de integración:** la corrección y su prueba deben verificarse en la rama que incorpore los cambios de sincronización. La existencia de la prueba negativa, por sí sola, no demuestra que el cambio haya sido integrado en `main`.

## 7. Evidencia de ejecución

Durante la elaboración de esta estrategia se ejecutaron localmente las siguientes suites unitarias:

| Suite | Resultado reportado |
|---|---|
| `tests/unit/schema.spec.ts` | PASS |
| `tests/unit/conflict-policy.spec.ts` | PASS |
| `tests/unit/capabilities-pure.spec.ts` | PASS |

Estos resultados corresponden a las ejecuciones unitarias realizadas durante la elaboración. No implican que las pruebas de integración, las E2E o los checks completos de la actividad ya hayan sido aprobados.

Para la entrega, la evidencia deberá identificar el commit evaluado, los comandos ejecutados y sus resultados reales, junto con cualquier limitación pendiente.

## 8. Límites conocidos

- Las pruebas unitarias no sustituyen la comprobación de persistencia y sincronización entre componentes.
- Un servidor simulado permite verificar las reglas de deduplicación, pero no demuestra por sí solo el comportamiento de un servidor remoto real.
- Las pruebas E2E requieren validar el recorrido completo en el entorno elegido por el equipo.
- La cobertura de los casos definidos no demuestra automáticamente una cobertura total del proyecto.
- Los resultados locales deben contrastarse con los checks de integración continua del commit que finalmente se entregue.

## 9. Criterio de aceptación

La estrategia se considera respaldada cuando:

1. Las tres suites unitarias producen resultados reproducibles.
2. Las pruebas de integración cubren persistencia, reintentos y deduplicación.
3. El escenario negativo demuestra que una regresión puede detectarse.
4. El flujo E2E demuestra la captura local y la recuperación de sincronización.
5. Los comandos, resultados, limitaciones y commit evaluado quedan registrados con evidencia real.
