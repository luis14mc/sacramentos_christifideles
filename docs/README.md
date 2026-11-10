# Índice de documentación

Actualizado: 2026-11-10. Si un documento no está aquí, está en [`archivo/`](archivo/) y es histórico.

## Para empezar
| Documento | Para quién | Qué contiene |
|---|---|---|
| [ESTADO_PROYECTO.md](ESTADO_PROYECTO.md) | Todos | Qué está en producción, qué falta, riesgos |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Todos | Visión, usuarios, reglas del dominio |
| [PLAN_MULTIPARROQUIA.md](PLAN_MULTIPARROQUIA.md) | Desarrollo | Plan vivo y bitácora de cada sesión |
| [../AGENTS.md](../AGENTS.md) | Agentes IA | Reglas de trabajo, ramas, Definition of Done |
| [../CHANGELOG.md](../CHANGELOG.md) | Todos | Cambios por versión |

## Usuarios de la parroquia
| Documento | Contenido |
|---|---|
| [MANUAL_USUARIO.md](MANUAL_USUARIO.md) | Uso diario: personas, sacramentos, constancias, consultas |
| [GUION_PRUEBA_PILOTO.md](GUION_PRUEBA_PILOTO.md) | Prueba de aceptación con una secretaria real |
| [PRIVACIDAD_DATOS.md](PRIVACIDAD_DATOS.md) | Qué datos se guardan, quién los ve, cuánto tiempo |

## Operación
| Documento | Contenido |
|---|---|
| [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) | Despliegue y variables en Railway |
| [ALTA_NUEVA_PARROQUIA.md](ALTA_NUEVA_PARROQUIA.md) | Sumar una parroquia, paso a paso |
| [BACKUP_RESTORE_RUNBOOK.md](BACKUP_RESTORE_RUNBOOK.md) | Respaldos automáticos y restauración |
| [RUNBOOK_INCIDENTES.md](RUNBOOK_INCIDENTES.md) | Qué hacer si algo se cae |
| [MIGRATIONS_PRISMA.md](MIGRATIONS_PRISMA.md) | Cómo crear y aplicar migraciones |
| `hub/README.md` (rama `hub`) | Operar el centralizador |

## Técnica
| Documento | Contenido |
|---|---|
| [API_REFERENCIA.md](API_REFERENCIA.md) | Endpoints, método y permiso requerido |
| [INTEROP_CONTRATO.md](INTEROP_CONTRATO.md) | Protocolo parroquia ↔ centralizador |
| [christi_fidelis_bdd_pg_v3.sql](christi_fidelis_bdd_pg_v3.sql) | SQL de referencia (la verdad ejecutable es `prisma/`) |
| [SQL_V3_PRISMA_CONCORDANCIA.md](SQL_V3_PRISMA_CONCORDANCIA.md) | Correspondencia SQL ↔ Prisma |
| [RLS_STRATEGY.md](RLS_STRATEGY.md) | Aislamiento de datos por parroquia |
| [HISTORIA_MOLDES_PDF.md](HISTORIA_MOLDES_PDF.md) | Diseño de constancias por molde |
| [DEFUNCIONES_V1_DESIGN.md](DEFUNCIONES_V1_DESIGN.md) | Propuesta (no implementada) de defunciones |
| [security-audit/](security-audit/) | Auditoría de seguridad 2026-09-22 |

## Decisiones (ADR)
| ADR | Decisión |
|---|---|
| [001](adr/ADR-001-identidad-tecnica-personas.md) | Persona como núcleo, DNI obligatorio |
| [002](adr/ADR-002-instancia-por-parroquia.md) | Una instancia y una base por parroquia |
| [003](adr/ADR-003-centralizador-en-rama-hub.md) | Centralizador en la rama `hub` |
| [004](adr/ADR-004-consultas-solo-lectura.md) | Consultas entre parroquias solo lectura y con aprobación humana |
| [005](adr/ADR-005-constancias-solo-molde.md) | Constancias solo por molde PDF |
| [006](adr/ADR-006-expedientes-v2.md) | Gestor de expedientes escaneados en v2 |

## Convención
- Un documento por tema; si queda vencido, se mueve a `archivo/` (no se borra).
- El estado vigente vive solo en `ESTADO_PROYECTO.md`; no crear más `ESTADO_*` con fecha.
- Toda decisión nueva del PO → un ADR nuevo.
