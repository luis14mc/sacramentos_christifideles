# ChristiFidelis — Backup & Restore Runbook

## Objetivo
Procedimiento reproducible para respaldar y restaurar PostgreSQL/Neon sin mezclar staging y producción.

## Reglas
- Ejecutar siempre contra la URL del entorno correcto.
- Nunca restaurar staging sobre producción ni viceversa.
- No guardar dumps con datos reales en Git.
- Verificar que el destino esté identificado antes de ejecutar restore.

## Backup lógico
Con `pg_dump` disponible:

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file=christifidelis.dump
```

Verificar que el archivo exista y tenga tamaño mayor que cero.

## Verificación básica del backup

```bash
pg_restore --list christifidelis.dump > backup-contents.txt
```

El listado debe incluir las tablas críticas: `persona`, sacramentos, `numeradores`, `plantilla_constancia`, usuarios y `bitacora_crud`.

## Restore en base temporal/staging
Crear una base vacía separada y definir `RESTORE_DATABASE_URL`.

```bash
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" christifidelis.dump
```

No usar `--clean` contra producción sin un procedimiento de incidente aprobado.

## Comprobaciones posteriores
1. Ejecutar `SELECT 1`.
2. Verificar conteos de parroquias, Personas y sacramentos.
3. Confirmar que las dos parroquias QA conservan aislamiento.
4. Ejecutar la aplicación apuntando a la base restaurada.
5. Ejecutar `/api/health` y smoke tests.
6. Abrir una Persona y un sacramento de cada módulo.
7. Generar una constancia PDF.

## Neon
En staging se recomienda además habilitar el mecanismo de backup/restore disponible en Neon (branch/restore point según el plan contratado). El dump lógico sigue siendo útil para una prueba independiente de portabilidad.

## Estado Sprint 7
La ejecución real de `pg_dump`/`pg_restore` contra Neon requiere credenciales de staging y herramientas PostgreSQL disponibles. Hasta ejecutarla con una base real de QA, la prueba de restore debe registrarse como `PENDING`, no `PASS`.
