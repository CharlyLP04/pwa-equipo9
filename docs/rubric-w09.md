# Contraste de entrega — Semana 09

Referencia: las 20 diapositivas de Semana_09_Seguridad_Privacidad_PWA.pptx proporcionadas por el usuario y la rúbrica de 8 puntos. Este documento relaciona evidencia comprobable; no asigna una calificación ni sustituye los checks privados.

| Criterio | Puntos de la rúbrica | Evidencia | Estado |
|---|---:|---|---|
| Instalación limpia y build | 2 | npm ci --ignore-scripts --no-audit --no-fund; npm run verify, equivalente de make verify; .nvmrc | Instalación y build local comprobados en la consolidación |
| Implementación y artefactos | 3 | threat-model.md, privacy-data-inventory.md, src/lib/security/, tests/security.spec.ts, robots.txt, README y evidencia individual | Integrados; verify comprueba existencia junto con los artefactos de Semana 08 |
| Comportamiento crítico | 2 | tests/security.spec.ts (17 verificaciones), tests/offline.spec.ts y tests/unit/security-core.spec.ts; 20 suites totales | Pruebas reproducibles; la ejecución remota debe corresponder al SHA de entrega |
| Ingeniería y evidencia individual | 1 | Matriz de amenazas, inventario, decisiones y límites; tabla de autoría de los tres integrantes, SHAs fuente y declaración de IA | Documentación integrada y revisión humana declarada por el equipo |

## Trazabilidad de las diapositivas

| Diapositivas | Control | Implementación y demostración |
|---|---|---|
| 3–5 | Tableta extraviada y fronteras de confianza | Modelo de amenazas con cinco preguntas y matriz priorizada |
| 7 | Mostrar HTML como texto | React representa el resumen como texto; prueba del escape y comprobación de navegador |
| 8 | Nivel 99 y validación independiente de autorización | Validación estricta 1–5 y respuesta 400; payload válido de visitante recibe 403 |
| 9 | Mínimo privilegio | Inspector limitado por propietario; supervisor por alcance, con propietario propio al crear; visitante sin operaciones privadas |
| 10 | Protección del transporte | Alcance de un servidor Node local. La cookie activa Secure con HTTPS; las pruebas en localhost no demuestran cifrado en tránsito de un despliegue público |
| 11 | Política de contenido | CSP por respuesta con nonce y restricciones de orígenes; estilos inline heredados documentados |
| 12–13 | Persistencia y cachés privadas | Purga de localStorage, cola y cachés; borrado preventivo de pwa_offline_db. El SW nunca lee ni escribe caché para navegación privada ni API |
| 14 | Material reservado y permisos | Provisión propia fuera de Git o cuentas públicas de laboratorio; permisos solicitados mediante acción del usuario y fallback funcional |
| 15 | Finalidad y minimización | Inventario de datos; únicamente etiqueta del laboratorio persistida, sin coordenadas precisas |
| 16 | Cuatro pruebas negativas | 403 por reporte ajeno; 400 por riesgo 99; purga y navegación offline sin reporte anterior; cámara rechazada con recuperación |
| 18 | Entrega y evidencia de CI | Workflow de Semana 09 con Node fijado por .nvmrc y resultados por SHA; publicar la rama y comprobar su ejecución antes de entregar |

## Prueba offline reproducible

La suite tests/offline.spec.ts ejecuta el Service Worker real en un contexto aislado. Simula una caché anterior que contiene un reporte privado sintético y pérdida de red; comprueba que el reporte no se devuelve y que ni siquiera se consulta esa caché. Repite el caso para navegación de inspecciones y API. Con red verifica que la respuesta privada no se escribe en caché. Se complementa con la purga de sesión y las comprobaciones de navegador de la consolidación.

## Límites que deben mantenerse explícitos

- La lámina 12 orienta los borradores a IndexedDB y las preferencias no sensibles a localStorage. El prototipo heredado conserva borradores sintéticos minimizados en localStorage para mantener el contrato de la cola. Esto se justifica como alcance académico, no como equivalencia de seguridad ni protección frente al acceso físico a una sesión abierta. Cambiar de API de almacenamiento no cifra por sí solo los datos.
- El cierre offline elimina datos locales, pero la revocación del servidor requiere recuperar la conexión. Si IndexedDB está bloqueado se informa limpieza incompleta y se conserva la solicitud de revocación.
- Las cuentas predeterminadas tienen una frase pública de práctica: no deben utilizarse para un servicio institucional ni con información personal real.
- El escaneo acordado excluye el comprobador público y package-lock.json. No se presenta como ausencia total de coincidencias en el repositorio; el lockfile mantiene el nombre real de una dependencia heredada.
- Las verificaciones privadas y la defensa individual solo pueden ser evaluadas por el profesor. Los resultados locales no sustituyen una ejecución satisfactoria de Actions para el commit que se entregue.
