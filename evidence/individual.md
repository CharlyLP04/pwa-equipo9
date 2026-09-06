# Evidencia individual — Semana 1


- Nombre: Carlos Olaya Gutiérrez (3523110786)
- Repositorio y commit evaluado: La evidencia de mi contribución técnica exacta se encuentra en los commits del Pull Request asociado a la rama `docs/decision-record-carlos` en https://github.com/CharlyLP04/pwa-equipo9.
- Mi contribución concreta: Creación del repositorio base, configuración inicial del entorno reproducible, redacción completa de `docs/decision-record.md` (ADR-001) y definición de requisitos del producto.
- Decisión técnica que puedo explicar: Justificación y selección de PWA sobre aplicaciones nativas, web tradicionales y multiplataforma debido a la necesidad de operar en laboratorios con conectividad intermitente ("La operación no puede depender de una conexión perfecta") sin la fricción ni costos de las tiendas de aplicaciones.
- Comando o prueba que ejecuté y resultado: `npm ci`, `npm test` y `npm run verify` con salida exitosa (`PASS`, código de salida 0) y generación del reporte `reports/verification.json`.
- Limitación o riesgo que encontré: En esta primera entrega aún no se encuentra activo el Service Worker de producción para retención offline total ni la sincronización bidireccional en segundo plano, aspectos que se incorporarán en las siguientes semanas.
- Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana): Utilizada como asistente para dar formato Markdown al registro de decisiones (ADR-001) y estructuración de requisitos; todo el contenido técnico, justificación y comandos fueron revisados y validados manualmente.



=======
## 3523110057 Pacheco Avila Carlos Alberto


* **Repositorio y commit evaluado:** Repositorio del equipo `CharlyLP04/pwa-equipo9`. Mi contribución inicial corresponde al commit `e624c95`.

* **Mi contribución concreta:** Redacción y definición de la segunda parte de `docs/requirements.md`, específicamente los requisitos no funcionales de reproducibilidad, accesibilidad, seguridad, privacidad, rendimiento y operación offline futura. También definí los datos sintéticos permitidos, los datos reales excluidos y los criterios de aceptación correspondientes a la Semana 1.

* **Decisión técnica que puedo explicar:** Se estableció que el proyecto utilice exclusivamente datos sintéticos durante el desarrollo y las pruebas, evitando PII, credenciales, tokens y otros datos reales sensibles. También se documentó la operación offline como un requisito futuro y no como una funcionalidad ya implementada, debido a que su implementación no forma parte del alcance de la Semana 1.

* **Comando o prueba que ejecuté y resultado:** Ejecuté `npm ci` y las dependencias se instalaron correctamente. Posteriormente ejecuté `npm run dev` y comprobé que la aplicación inicia y puede visualizarse correctamente en `http://localhost:3000`. Finalmente detuve el servidor y ejecuté `npm run verify`, obteniendo el resultado `Starter verificable: PASS`. El proceso generó correctamente el archivo `reports/verification.json`.

* **Qué comprueba y qué no:** `npm run verify` comprueba las verificaciones automatizadas proporcionadas por el starter y genera el reporte de verificación. El resultado `PASS` permite confirmar que el estado actual del starter supera esas comprobaciones técnicas. Sin embargo, este resultado no demuestra por sí solo la calidad del análisis escrito, la ausencia absoluta de secretos ni que las funcionalidades PWA futuras, como operación offline y sincronización, ya estén implementadas.

* **Limitación o riesgo que encontré:** La operación offline todavía no está implementada durante esta etapa del proyecto, por lo que únicamente se documentó como requisito futuro. También se observó que `npm ci` reportó dos vulnerabilidades de severidad alta en las dependencias instaladas; no se modificaron automáticamente las dependencias para evitar alterar el starter proporcionado antes de analizar su impacto.

* **Uso de IA:** Utilicé ChatGPT como apoyo para revisar la redacción de los requisitos no funcionales, convertirlos en criterios verificables y revisar la estructura de mi evidencia individual. Las secciones influenciadas fueron los RNF, datos sintéticos, criterios de aceptación y esta evidencia. Verifiqué manualmente que el contenido correspondiera con las instrucciones de la actividad y ejecuté personalmente `npm ci`, `npm run dev` y `npm run verify` para comprobar los resultados descritos.

===========

## 3523110113 Montalvo Osorio Alexis

- **Contribución:** Redacción de la primera mitad de `docs/requirements.md`, incluyendo el problema, contexto, límites, usuarios, escenarios y requisitos funcionales relacionados con la conectividad estable e intermitente.

- **Repositorio y evidencia:** La contribución se encuentra en la rama `docs/requirements-escenarios-alexis` y en el Pull Request correspondiente del repositorio `pwa-equipo9`.

- **Decisión técnica:** Se definió explícitamente un escenario de conectividad intermitente como parte importante del producto, debido a que las inspecciones pueden realizarse en zonas donde la conexión de red no sea estable. La operación futura no debe depender de una conexión perfecta.

- **Comando o prueba ejecutada y resultado:** Se ejecutó `npm run dev`. El servidor de Next.js inició correctamente y la aplicación estuvo disponible en `http://localhost:3000`, mostrando la pantalla inicial de inspecciones con datos sintéticos.

- **Qué demuestra y qué no demuestra:** La prueba demuestra que el proyecto puede instalarse y ejecutarse localmente y que la pantalla inicial del starter carga correctamente. No demuestra todavía el funcionamiento del modo offline, la sincronización automática ni la compilación de producción.

- **Limitación o riesgo:** Durante la Semana 1 no se implementan las funcionalidades offline ni la sincronización automática. Estas funcionalidades deberán validarse en las etapas posteriores del proyecto.

- **Uso de IA:** Se utilizó ChatGPT como asistente para apoyar la redacción y estructuración del contenido en Markdown de `docs/requirements.md` y `evidence/individual.md`. El contenido fue revisado y validado manualmente antes de incorporarlo al proyecto.