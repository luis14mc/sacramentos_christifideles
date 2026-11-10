# Runbook de incidentes y monitoreo

Para el PO y el desarrollador de turno. Comandos de Railway en [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) (§11 logs, §12 rollback).

## 1. Severidad
| Nivel | Ejemplo | Respuesta |
|---|---|---|
| **S1** | Una parroquia no abre o no deja entrar; sospecha de fuga o pérdida de datos | Atender de inmediato; avisar a la parroquia en 1 hora |
| **S2** | Constancias o consultas entre parroquias fallan; el sistema funciona | Mismo día |
| **S3** | Error visual o de texto | Issue normal |

## 2. Monitoreo
**Mínimo hasta tener alertas** (diario, 2 minutos):
- `GET /api/health` de las dos parroquias y del hub → `{"status":"ok"}`.
- Panel del hub `/panel` → semáforo en verde.
- GitHub → Actions → *Respaldos automáticos* → la corrida de la noche en verde para las 3 bases.

**Recomendado (pendiente, tarea 13 del estado):** un monitor externo gratuito (por ejemplo UptimeRobot o Better Stack) que consulte las 3 URLs `/api/health` cada 5 minutos y avise por email o WhatsApp al PO. Activar también las notificaciones por email de GitHub Actions para los fallos del workflow de respaldos.

## 3. Diagnóstico rápido
| Síntoma | Revisar | Acción típica |
|---|---|---|
| Página no carga | Railway → estado del servicio y del deploy | Rollback al deploy anterior (§12) |
| `/api/health` → 503 | Servicio Postgres de esa parroquia | Reiniciar Postgres; si está corrupto → §5 |
| Login vuelve al formulario | `NEXTAUTH_URL` y el aviso de `NEXTAUTH_SECRET` en el log de Railway | Corregir `NEXTAUTH_URL` o `NEXTAUTH_SECRET` y redeploy |
| Usuario bloqueado | Esperar 15 min (o redeploy, que reinicia el contador) | — |
| Deploy falla en migraciones | Log del arranque | No forzar; ver [MIGRATIONS_PRISMA.md](MIGRATIONS_PRISMA.md); rollback |
| Consultas: "no configurada" | Variables `INTEROP_*` y `PARROQUIA_CODIGO` | Cargar variables y redeploy |
| Consultas: 401 | Secreto rotado o reloj | `pnpm instancia rotar` y actualizar `INTEROP_SECRET` |
| Consultas en `error_envio` | Salud del destino y del hub | Arreglar el destino; reenviar la consulta |
| Constancia sale simple | Molde activo del sacramento | Activar el molde en Configuración |
| Respaldo nocturno en rojo | Log del job (dice qué secret falta) | Cargar el secret; relanzar con `workflow_dispatch` |

## 4. Incidente de seguridad
1. **Contener:** desactivar el usuario comprometido; si es el hub, `pnpm instancia desactivar <codigo>`; rotar `NEXTAUTH_SECRET` (cierra todas las sesiones) y los secretos involucrados.
2. **Preservar:** exportar la auditoría y los logs de Railway antes de cambiar más cosas.
3. **Avisar:** al PO el mismo día y a la parroquia en menos de 72 horas ([PRIVACIDAD_DATOS.md §6](PRIVACIDAD_DATOS.md)).
4. **Corregir y registrar** (§6).

## 5. Pérdida o corrupción de datos
1. Detener las escrituras: avisar a la parroquia que no registre nada.
2. Elegir el respaldo de R2 previo al problema.
3. Restaurar **primero en una base temporal** con `scripts/restaurar-prueba.sh` y verificar los conteos.
4. Solo con la aprobación del PO: restaurar en producción (procedimiento del [runbook de respaldos](BACKUP_RESTORE_RUNBOOK.md)), y luego `/api/health` y una prueba de login y constancia.
5. Lo registrado después del respaldo se vuelve a capturar desde el libro físico.

## 6. Después del incidente
Agregar una fila aquí y una entrada en la Bitácora de [PLAN_MULTIPARROQUIA.md](PLAN_MULTIPARROQUIA.md). Si hubo causa en el código, abrir un issue con la etiqueta `incidente`.

| Fecha | Sev. | Servicio | Qué pasó | Causa | Arreglo | Prevención |
|---|---|---|---|---|---|---|
| — | — | — | Sin incidentes registrados | — | — | — |

## 7. Contactos
| Rol | Quién | Canal |
|---|---|---|
| PO / decisión | Luis Martinez | (completar) |
| Párroco Loarque | (completar) | |
| Párroco Cerro Grande | (completar) | |
| Railway / GitHub / Cloudflare | cuentas del PO | |
