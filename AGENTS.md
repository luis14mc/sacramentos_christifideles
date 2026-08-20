# ChristiFideles — Reglas de trabajo para agentes IA

## Objetivo
Llevar ChristiFideles a una primera versión productiva utilizable por una secretaría parroquial antes del 19 de octubre de 2026.

## Fuente de verdad
- Repositorio oficial: `luis14mc/sacramentos_christifideles`
- Rama estable: `master`
- Rama de preparación de v1: `release/v1-planning`
- Contexto funcional: `docs/PROJECT_CONTEXT.md`
- Roadmap vigente: `docs/ROADMAP_V1.md`

## Roles del equipo IA
- Scrum Master / Coordinación: prioriza backlog, protege alcance, define criterios de aceptación y evita trabajo duplicado.
- Analista Funcional: traduce necesidades parroquiales a historias de usuario y reglas de negocio.
- Tech Lead: valida arquitectura, convenciones y decisiones transversales.
- Full-stack Dev: implementa UI, route handlers, servicios y lógica de negocio.
- DBA / Data Engineer: mantiene Prisma, migraciones, integridad, índices, seeds y estrategia de datos.
- QA Engineer: diseña pruebas funcionales, regresión, permisos, multi-tenant y casos límite.
- Security Reviewer: revisa autenticación, autorización, exposición de datos, secretos y hardening.
- DevOps: prepara Vercel, Neon, variables, entornos, observabilidad, backups y release.
- UX/UI: asegura que secretaría parroquial pueda operar con pocos clics y sin conocimiento técnico.

## Reglas obligatorias para toda IA
1. Leer `AGENTS.md`, `docs/PROJECT_CONTEXT.md` y `docs/ROADMAP_V1.md` antes de proponer o modificar código.
2. No cambiar el stack principal sin decisión explícita del Tech Lead/Scrum Master.
3. Mantener Next.js 15 + TypeScript + Prisma + PostgreSQL + NextAuth + Tailwind 4 + DaisyUI.
4. No introducir un backend separado en Express para v1.
5. Toda operación de datos parroquiales debe respetar `id_parroquia` del usuario autenticado. Nunca confiar en `id_parroquia` enviado por el cliente para autorizar acceso.
6. Toda nueva API debe validar autenticación, autorización por rol/permisos y alcance multi-tenant.
7. No exponer secretos, `.env`, credenciales, tokens, cadenas de conexión ni datos sensibles en commits, logs o respuestas.
8. No usar `prisma db push` como mecanismo normal de producción. Para producción usar migraciones versionadas y revisadas.
9. No borrar físicamente información sacramental desde UI salvo decisión funcional explícita. Preferir estado, anulación o trazabilidad.
10. Toda modificación de registros sacramentales debe generar auditoría suficiente para reconstruir quién cambió qué y cuándo.
11. En ChristiFidelis v1 no puede existir `Persona` sin DNI. `numero_identidad` es obligatorio y forma parte de la PK compuesta `(id_parroquia, numero_identidad)`. `Persona` es el core: ningún módulo puede saltárselo y todos los participantes sacramentales requeridos deben existir previamente en `Persona`, dentro de la misma parroquia.
12. Reglas obligatorias para agentes IA sobre el modelo de datos: no introducir `id_persona`; no hacer el DNI opcional; no generar DNIs temporales, ficticios ni placeholders; no introducir `id_sacerdote` (los ministros se referencian por FK compuesta `(id_parroquia, numero_identidad)`). `docs/christi_fidelis_bdd_pg_v3.sql` es la fuente funcional de verdad y Prisma debe alinearse con él.
13. No duplicar personas sin antes aplicar búsqueda por identidad y búsqueda aproximada por nombre/fecha.
14. Toda funcionalidad nueva debe incluir criterios de aceptación y pruebas mínimas.
15. Ningún cambio se considera terminado si rompe `npm run build` o `npm run lint`.
16. Evitar archivos temporales, copias `*-new`, scripts de debug y documentación obsoleta en producción.
17. Rutas `/api/debug` y herramientas de diagnóstico no deben quedar expuestas en producción.
18. Toda historia debe indicar: valor para usuario, archivos afectados, riesgos, criterios de aceptación y pruebas.
19. Priorizar v1 sobre mejoras cosméticas o features de fase 2.
20. Si una decisión puede comprometer integridad sacramental, multi-tenant, seguridad o auditoría, detener implementación y elevarla al Scrum Master/Tech Lead.

## Definition of Ready
Una historia puede entrar a desarrollo cuando:
- tiene objetivo claro;
- reglas de negocio identificadas;
- dependencias conocidas;
- criterios de aceptación verificables;
- alcance de parroquia/rol definido;
- modelo de datos confirmado.

## Definition of Done
Una historia está terminada cuando:
- código implementado y revisado;
- autorización y multi-tenant verificados;
- validaciones de entrada implementadas;
- errores manejados sin filtrar información sensible;
- pruebas funcionales ejecutadas;
- `npm run lint` pasa;
- `npm run build` pasa;
- migración Prisma incluida cuando corresponda;
- documentación mínima actualizada;
- QA acepta los criterios;
- no deja debug temporal.

## Convenciones de ramas
- `feature/<modulo>-<descripcion>`
- `fix/<modulo>-<descripcion>`
- `chore/<descripcion>`
- `release/v1-planning`

## Convención de commits
Formato recomendado: `<tipo>(<modulo>): <descripcion>`

Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `security`, `db`.

## Política de alcance v1
Sí entra en v1:
- autenticación y sesión;
- roles/permisos;
- aislamiento multi-parroquia;
- usuarios;
- personas;
- bautismos;
- primera comunión;
- confirmación;
- matrimonio;
- defunciones/registro funerario si se aprueba el modelo;
- libros, folios y numeración;
- constancias PDF;
- auditoría;
- búsqueda;
- dashboard operativo;
- configuración parroquial mínima;
- backups, staging, producción y monitoreo básico.

No entra en v1 salvo bloqueo crítico:
- app móvil;
- sincronización externa entre diócesis;
- portal público de feligreses;
- pagos;
- notificaciones masivas;
- analítica avanzada;
- rediseños cosméticos extensos;
- integraciones no necesarias para el piloto.
