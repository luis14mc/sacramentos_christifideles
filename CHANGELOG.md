# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Fechas en hora de Honduras. Números de PR de `luis14mc/sacramentos_christifideles`.

## [Sin publicar]
### Documentación
- Documentación completa y ordenada: README nuevo, índice `docs/README.md`, estado vigente `docs/ESTADO_PROYECTO.md`, manual de usuario, guion de prueba piloto, alta de parroquia nueva, privacidad de datos, referencia de API, contrato de interoperabilidad, runbook de incidentes, ADR-002 a 006.
- `molde_constancia` agregada al SQL de referencia.
- Documentos vencidos movidos a `docs/archivo/`.

### Seguridad
- Eliminado `GET /api/auth/diagnostic`; la verificación de `NEXTAUTH_SECRET` queda en el log de arranque de Railway.

## [1.0.0-piloto] — 2026-10-15
Primera versión en producción con dos parroquias y el centralizador.

### Agregado
- Respaldos automáticos diarios cifrados (age) a Cloudflare R2 y script de restauración de prueba (#46).
- Admin general creado en cada arranque; el arranque no depende de él (#40, #42).
- Logo y nombre de la parroquia en la barra superior (#39).
- Constancias solo por molde: PDF con campos o hoja membretada; constancia simple con logo; sectores sin tipo (#38).
- Configuración reorganizada: datos de la parroquia y párroco que firma, CRUD de sectores, búsqueda unificada por sacramento (#36).
- Secretaria crea y edita personas con justificación; límite de intentos de login (#35).
- Catálogos de Honduras (18 departamentos, 298 municipios) y roles en cada deploy (#33, #34).
- Interoperabilidad: consultas firmadas entre parroquias vía hub (#32).
- Padres opcionales en sacramentos; orden religiosa opcional (#30, #31).
- Despliegue en Railway (#24–#29).
- Moldes PDF de constancia (#23).

### Cambiado
- El centralizador pasa a la rama `hub` (#41).
- Responsive de todas las vistas (#37).

### Quitado
- Asistente `/setup`, `/buscar` y plantillas de texto en la UI.

## [0.x] — agosto 2026
- Sprint 0–1: aislamiento por parroquia y estabilización de Persona (#6, #7, #9).
- Clero como Persona, CRUD de sacerdotes, padrino/madrina opcional, endurecimiento de seeds (#18–#21).
