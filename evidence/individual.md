# Evidencia individual — Semana 1

## 3523110057 Pacheco Avila Carlos Alberto

* **Repositorio y commit evaluado:** Repositorio del equipo `CharlyLP04/pwa-equipo9`. Mi contribución inicial corresponde al commit `e624c95`.

* **Mi contribución concreta:** Redacción y definición de la segunda parte de `docs/requirements.md`, específicamente los requisitos no funcionales de reproducibilidad, accesibilidad, seguridad, privacidad, rendimiento y operación offline futura. También definí los datos sintéticos permitidos, los datos reales excluidos y los criterios de aceptación correspondientes a la Semana 1.

* **Decisión técnica que puedo explicar:** Se estableció que el proyecto utilice exclusivamente datos sintéticos durante el desarrollo y las pruebas, evitando PII, credenciales, tokens y otros datos reales sensibles. También se documentó la operación offline como un requisito futuro y no como una funcionalidad ya implementada, debido a que su implementación no forma parte del alcance de la Semana 1.

* **Comando o prueba que ejecuté y resultado:** Ejecuté `npm ci` y las dependencias se instalaron correctamente. Posteriormente ejecuté `npm run dev` y comprobé que la aplicación inicia y puede visualizarse correctamente en `http://localhost:3000`. Finalmente detuve el servidor y ejecuté `npm run verify`, obteniendo el resultado `Starter verificable: PASS`. El proceso generó correctamente el archivo `reports/verification.json`.

* **Qué comprueba y qué no:** `npm run verify` comprueba las verificaciones automatizadas proporcionadas por el starter y genera el reporte de verificación. El resultado `PASS` permite confirmar que el estado actual del starter supera esas comprobaciones técnicas. Sin embargo, este resultado no demuestra por sí solo la calidad del análisis escrito, la ausencia absoluta de secretos ni que las funcionalidades PWA futuras, como operación offline y sincronización, ya estén implementadas.

* **Limitación o riesgo que encontré:** La operación offline todavía no está implementada durante esta etapa del proyecto, por lo que únicamente se documentó como requisito futuro. También se observó que `npm ci` reportó dos vulnerabilidades de severidad alta en las dependencias instaladas; no se modificaron automáticamente las dependencias para evitar alterar el starter proporcionado antes de analizar su impacto.

* **Uso de IA:** Utilicé ChatGPT como apoyo para revisar la redacción de los requisitos no funcionales, convertirlos en criterios verificables y revisar la estructura de mi evidencia individual. Las secciones influenciadas fueron los RNF, datos sintéticos, criterios de aceptación y esta evidencia. Verifiqué manualmente que el contenido correspondiera con las instrucciones de la actividad y ejecuté personalmente `npm ci`, `npm run dev` y `npm run verify` para comprobar los resultados descritos.
