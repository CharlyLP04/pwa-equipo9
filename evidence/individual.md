# Evidencia individual — completar antes de entregar

- Nombre: Carlos Olaya Gutiérrez (3523110786)
- Repositorio y commit evaluado: https://github.com/CharlyLP04/pwa-equipo9 (Rama: `docs/decision-record-carlos`)
- Mi contribución concreta: Creación del repositorio, configuración inicial del entorno reproducible, redacción de `docs/decision-record.md` (ADR-001) y definición de requisitos del producto.
- Decisión técnica que puedo explicar: Justificación y selección de PWA sobre aplicaciones nativas, web tradicionales y multiplataforma debido a la necesidad de operar en laboratorios con conectividad intermitente ("La operación no puede depender de una conexión perfecta") sin la fricción de tiendas de aplicaciones ni altos costos de mantenimiento.
- Comando o prueba que ejecuté y resultado: `npm ci`, `npm test` y `npm run verify` con salida exitosa (`PASS`, código de salida 0) y generación del reporte `reports/verification.json`.
- Limitación o riesgo que encontré: En esta primera entrega aún no se encuentra activo el Service Worker de producción para retención offline total ni la sincronización bidireccional en segundo plano, aspectos que se incorporarán en las siguientes semanas.
- Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana): Utilizada como asistente para dar formato Markdown al registro de decisiones (ADR-001) y estructuración de requisitos; todo el contenido técnico, justificación y comandos fueron revisados y validados manualmente.


