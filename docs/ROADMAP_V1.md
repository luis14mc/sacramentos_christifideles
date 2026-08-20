# ChristiFideles v1.0 — Roadmap de lanzamiento

## Ventana de ejecución
Inicio: **19 de agosto de 2026**  
Objetivo de salida productiva: **19 de octubre de 2026**  
Duración: **8 semanas**

## Estrategia
Trabajar en sprints semanales con una meta demostrable por sprint. La prioridad es cerrar un flujo productivo completo antes de ampliar alcance.

## Objetivo de la release
Entregar una v1 estable para operación parroquial diaria con:
- autenticación y permisos;
- aislamiento multi-parroquia;
- usuarios y personas;
- sacramentos principales;
- libros/numeración;
- constancias;
- auditoría;
- búsqueda;
- staging y producción.

---

## Sprint 0 — 19 al 23 de agosto
### Meta
Congelar arquitectura y conocer el estado real de calidad de la aplicación.

### Trabajo
- ejecutar instalación limpia;
- ejecutar lint y build;
- revisar variables de entorno;
- inventariar rutas y páginas;
- revisar NextAuth/middleware;
- revisar permisos y multi-tenant;
- revisar scripts de debug y archivos temporales;
- revisar schema Prisma y seeds;
- identificar secretos históricos;
- identificar deuda técnica bloqueante;
- definir backlog priorizado.

### Entregables
- informe técnico de baseline;
- lista de bugs P0/P1/P2;
- backlog v1 definitivo;
- criterios de aceptación transversales;
- decisión del modelo para personas históricas.

### Gate
No inicia desarrollo sacramental hasta cerrar P0 de autenticación/multi-tenant/build.

---

## Sprint 1 — 24 al 30 de agosto
### Meta
Base segura y estable de identidad, permisos y personas.

### Trabajo
- corregir fallos de autenticación/autorización;
- validar aislamiento entre parroquias;
- estabilizar CRUD usuarios;
- estabilizar CRUD personas;
- adaptar Persona a registros históricos incompletos;
- normalizar validaciones y errores;
- eliminar/debug-gate de rutas de diagnóstico;
- preparar migraciones Prisma formales.

### QA crítico
- usuario parroquia A no puede consultar/modificar parroquia B;
- persona sin DNI puede registrarse según reglas aprobadas;
- duplicados detectables;
- build/lint verdes.

---

## Sprint 2 — 31 de agosto al 6 de septiembre
### Meta
Bautismo completo de extremo a extremo.

### Trabajo
- API/route handlers de bautismo;
- listado, búsqueda y filtros;
- alta, detalle y edición;
- selección/creación de personas relacionadas;
- reglas de libro/folio/registro;
- permisos;
- auditoría;
- pruebas de casos históricos.

### Entregable demostrable
Secretaría registra y consulta un bautismo realista de principio a fin.

---

## Sprint 3 — 7 al 13 de septiembre
### Meta
Primera Comunión y Confirmación completas.

### Trabajo
- reutilizar patrón validado de Bautismo;
- CRUD/API/UI de Primera Comunión;
- CRUD/API/UI de Confirmación;
- reglas de sacerdote/obispo/catequista;
- numeración;
- auditoría;
- filtros y búsqueda.

### Gate
Los tres módulos deben respetar multi-tenant y permisos antes de pasar a Matrimonio.

---

## Sprint 4 — 14 al 20 de septiembre
### Meta
Matrimonio completo y decisión final de Defunciones.

### Trabajo
- CRUD/API/UI de Matrimonio;
- relaciones esposo/esposa/padres/padrinos;
- validaciones de integridad;
- numeración y auditoría;
- diseñar y aprobar modelo de Defunción/Exequias;
- implementar Defunción si no bloquea el alcance crítico.

### Nota de alcance
Si Defunciones pone en riesgo la fecha de lanzamiento, puede salir como v1.1 solo por decisión del Scrum Master/Product Owner.

---

## Sprint 5 — 21 al 27 de septiembre
### Meta
Libros, numeración y constancias operativas.

### Trabajo
- consolidar numeradores por parroquia/módulo;
- evitar colisiones de libro/folio/acta/registro;
- UI de consulta de libro;
- plantillas por parroquia;
- generación PDF de constancias;
- datos institucionales, firma/sello/logo configurables;
- historial de emisión si se aprueba.

### Entregable demostrable
Registrar sacramento y emitir constancia PDF válida desde la misma aplicación.

---

## Sprint 6 — 28 de septiembre al 4 de octubre
### Meta
Auditoría, búsqueda global, dashboard y hardening.

### Trabajo
- conectar BitacoraCrud a operaciones críticas;
- vista de auditoría para roles autorizados;
- búsqueda por nombre, identidad, fecha, libro y sacramento;
- dashboard con datos reales;
- revisión de errores y logging;
- seguridad de cookies/sesiones;
- revisión de exposición de endpoints;
- índices Prisma/PostgreSQL necesarios.

---

## Sprint 7 — 5 al 11 de octubre
### Meta
Staging y QA integral.

### Trabajo
- desplegar staging en Vercel;
- base Neon separada de producción;
- aplicar migraciones desde cero;
- seed controlado;
- pruebas E2E manuales;
- regresión por roles;
- pruebas multi-parroquia;
- pruebas de concurrencia básica de numeradores;
- pruebas de constancias;
- pruebas de restauración de backup;
- corregir P0 y P1.

### Criterio
No se promueve a producción con P0 abierto.

---

## Sprint 8 / Release — 12 al 19 de octubre
### Meta
Piloto productivo controlado.

### Trabajo
- congelamiento de features;
- release candidate;
- revisión final de migraciones;
- configuración production Vercel + Neon;
- backups automáticos;
- monitoreo y logs;
- creación de usuarios piloto;
- smoke test productivo;
- capacitación breve;
- runbook de incidentes/rollback;
- salida piloto;
- seguimiento de primeras operaciones reales.

### Definition of Release Ready
- build y lint verdes;
- migraciones reproducibles;
- login/roles/multi-tenant validados;
- Personas estable;
- sacramentos comprometidos en alcance funcionando;
- numeración sin colisiones conocidas;
- constancias generables;
- auditoría activa;
- backup y restore probados;
- staging aceptado;
- cero P0 y P1 críticos de seguridad/integridad.

---

# Prioridades
## P0 — Bloquea release
- acceso cruzado entre parroquias;
- pérdida/corrupción de registros;
- autenticación rota;
- numeración inconsistente;
- migración destructiva no controlada;
- secretos expuestos;
- build de producción roto.

## P1 — Debe resolverse antes del piloto
- CRUD principal incompleto;
- permisos incorrectos;
- auditoría faltante en cambios críticos;
- constancia incorrecta;
- búsqueda inutilizable;
- errores de validación que impidan operación normal.

## P2 — Puede pasar a v1.1
- mejoras visuales;
- reportes avanzados;
- filtros secundarios;
- automatizaciones no esenciales;
- optimizaciones menores.

# Cadencia Scrum
- Sprint: 1 semana.
- Planning: inicio de cada sprint.
- Daily: estado breve por agente: hecho / siguiente / bloqueo.
- Review: demo funcional al cierre.
- Retro: máximo 3 acciones concretas.
- Backlog refinement: continuo, sin meter features nuevas que rompan el objetivo de release.

# Formato obligatorio de tarea para agentes
Cada tarea debe incluir:
- Rol responsable.
- Historia de usuario.
- Contexto técnico.
- Archivos/rutas candidatas.
- Criterios de aceptación.
- Casos de prueba.
- Riesgos.
- Dependencias.
- Definition of Done aplicable.

# Métrica principal
El avance no se medirá por cantidad de archivos o commits, sino por flujos parroquiales completos y demostrables.
