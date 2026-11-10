# ChristiFideles — Estado del proyecto

**Última actualización:** 10 de noviembre de 2026 · **Anterior:** [archivo/ESTADO_PROYECTO_2026-10-05.md](archivo/ESTADO_PROYECTO_2026-10-05.md)
**Meta:** lanzamiento piloto noviembre–diciembre 2026 con dos parroquias de Tegucigalpa.
**PO:** Luis Martinez (aprueba y revisa) · **Desarrollo:** agentes IA (Claude, ChatGPT, opencode, Cursor…) · Plan vivo: [PLAN_MULTIPARROQUIA.md](PLAN_MULTIPARROQUIA.md)

> Este es el único documento de estado vigente. Se actualiza en el lugar; las versiones viejas van a `archivo/`.

## 1. Resumen
Las **dos parroquias y el centralizador están en producción y se comunican**. Desde el 5 de octubre se agregaron los **respaldos automáticos** (PR #46), que todavía no corren porque faltan los secrets. Para lanzar faltan: activar y probar respaldos, la prueba con una secretaria real y la carga de datos de cada parroquia.

## 2. En producción
| Servicio | Dirección | Rama | Base | Estado |
|---|---|---|---|---|
| Cristo Resucitado de Loarque | https://christifideles.cristoresucitado.org | `master` | Postgres propio | ✅ |
| Salvador del Mundo de Cerro Grande | https://christifideles.elsalvadordelmundo.org | `master` | Postgres propio | ✅ |
| Centralizador (hub) | https://sacramentoschristifideles-production.up.railway.app (`/panel`) | `hub` | Postgres propio | ✅ |

## 3. Funcionalidad entregada
- **Personas** con DNI obligatorio, sacramentos visibles (insignias B/PC/C/M) y expediente.
- **Sacramentos:** bautismo, primera comunión, confirmación y matrimonio; libros y numeración automática; búsqueda por nombre, DNI, libro o registro.
- **Roles:** secretaria registra y edita con justificación (10–500 caracteres), no borra; párroco con acceso total; admin general `admin@christifideles.org` en cada parroquia.
- **Auditoría** de toda edición con su justificación. Bloqueo de login: 5 fallos en 15 min.
- **Constancias** solo por molde PDF (con campos o como hoja membretada); sin molde, constancia simple con logo.
- **Configuración:** datos de la parroquia, párroco que firma, logo, sectores y capillas, moldes, órdenes religiosas y rangos.
- **Consultas entre parroquias:** firmadas (HMAC), caducan en 5 minutos, solo lectura y con aprobación del párroco consultado.
- **Infraestructura:** Railway; migraciones y catálogos en cada arranque; responsive revisado (36 pantallas).
- **Respaldos:** workflow diario a las 02:00 de Honduras, cifrado con age y subido a Cloudflare R2 (30 días). *Implementado; falta activarlo.*
- **Pruebas:** 410 en las parroquias y 21 en el centralizador.

## 4. Decisiones tomadas (no re-discutir sin el PO)
Ver [`adr/`](adr/): base por parroquia (002), centralizador en `hub` (003), consultas solo lectura (004), constancias solo por molde (005), expedientes en v2 (006), DNI obligatorio (001).

## 5. Qué falta

### 🔴 Antes del lanzamiento
| # | Tarea | Responsable | Estado |
|---|---|---|---|
| 1 | Activar respaldos: crear el bucket R2 (retención 30 días), generar las llaves age y cargar los 8 secrets en GitHub ([runbook](BACKUP_RESTORE_RUNBOOK.md)) | PO | Pendiente |
| 2 | Primera **restauración de prueba** de las 3 bases, anotada en el runbook | PO + dev | Pendiente |
| 3 | **Prueba con una secretaria real** siguiendo el [guion](GUION_PRUEBA_PILOTO.md) | PO | Pendiente |
| 4 | Salvador del Mundo: corregir el nombre en Datos de la parroquia y el email del admin | PO | Por confirmar |
| 5 | `NEXTAUTH_SECRET` de 32+ caracteres en ambas parroquias (verificar en el log de arranque de Railway que **NO** aparece el aviso "⚠ NEXTAUTH_SECRET tiene menos de 32 caracteres") | PO | Por confirmar |
| 6 | Cargar en cada parroquia: nombre del párroco, logo y hoja membretada | PO | Por confirmar |
| 7 | Guardar `HUB_CLAVE_MAESTRA` y la llave privada age fuera de Railway y de GitHub | PO | Por confirmar |
| 8 | Capacitar a las secretarias con el [manual](MANUAL_USUARIO.md) | PO | Pendiente |
| 18 | Crear las variables de repositorio `MONITOREO_URL_LOARQUE`, `MONITOREO_URL_CERROGRANDE` y `MONITOREO_URL_HUB`; opcionalmente, el secret `ALERTA_WEBHOOK_URL` | PO | Pendiente |

### 🟡 Definiciones pendientes del PO
| # | Tema | Estado |
|---|---|---|
| 9 | Flujo de consulta tipo chat: la parroquia que tiene el libro emite la constancia dentro de la conversación | En evaluación |
| 10 | ¿Defunciones en la v1? ([diseño](DEFUNCIONES_V1_DESIGN.md)) | Sin decidir |
| 11 | ¿Municipios con tildes? (hoy "Danli", "Roatan") | Sin decidir |
| 12 | Licencia del software | Sin decidir |

### 🟢 Mejoras (no bloquean)
| # | Tarea |
|---|---|
| 14 | Contar padrinos y padres en el resumen de sacramentos de Personas |
| 15 | Retirar el Postgres viejo del proyecto del centralizador, una vez respaldado |
| 16 | Bloqueo de login persistente (hoy en memoria; se reinicia con cada deploy) |
| 17 | v2: gestor de expedientes con escaneos |

### ✅ Cerrado desde el 5 de octubre
- Respaldos automáticos implementados (PR #46, Cursor, 16-oct).
- Tarea 13 — monitoreo automático implementado en `.github/workflows/monitoreo.yml` (PR #47, Cursor, 16-oct); falta que el PO configure las variables de repositorio.
- `molde_constancia` agregada al SQL de referencia (10-nov).
- Documentación actualizada y ordenada (10-nov).

## 6. Riesgos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Respaldos sin activar | Pérdida de datos reales | Tareas 1 y 2 antes de cargar datos reales |
| Pérdida de `HUB_CLAVE_MAESTRA` | Re-registrar todas las parroquias | Guardarla fuera de Railway (tarea 7) |
| Pérdida de la llave privada age | Respaldos ilegibles | Dos copias offline (tarea 7) |
| Workflow de monitoreo sin variables configuradas | Una caída pasa desapercibida | Crear `MONITOREO_URL_LOARQUE`, `MONITOREO_URL_CERROGRANDE` y `MONITOREO_URL_HUB`; opcionalmente `ALERTA_WEBHOOK_URL`; mientras tanto, revisar `/api/health` |
| Un solo PO aprueba todo | Cuello de botella | Priorizar con esta tabla |

## 7. Dónde está cada cosa
Ver el [índice de documentación](README.md).
