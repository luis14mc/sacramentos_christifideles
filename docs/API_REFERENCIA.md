# Referencia de la API (instancia parroquial)

Generado a partir de `src/app/api/**/route.ts` el 2026-11-10. Todas las rutas son relativas a la instancia (por ejemplo `https://christifideles.cristoresucitado.org/api/...`).

## Convenciones
- **Autenticación:** sesión de NextAuth (cookie). Sin sesión → `401`. Sin permiso → `403`.
- **Aislamiento:** toda consulta se filtra por la parroquia de la sesión; nunca se acepta `id_parroquia` del cliente.
- **Justificación:** los `PUT` de personas y sacramentos exigen un campo de justificación de 10–500 caracteres (`src/lib/justificacion.ts`); queda en `bitacora_crud`.
- **Formato:** JSON. Los BigInt se serializan como texto (`src/lib/serialize.ts`).
- Los permisos están en `src/lib/permissions.ts` (tabla por rol en [MANUAL_USUARIO.md §2](MANUAL_USUARIO.md)).

## Públicas (sin sesión)
| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/health` | `{status, database}`; `503` si la base no responde. Healthcheck de Railway |
| GET | `/api/instancia` | `{codigo, nombre, version}` de la instancia |
| GET | `/api/auth/diagnostic` | Diagnóstico de NextAuth: si `NEXTAUTH_URL` coincide y si el secreto mide 32+ (`secretLengthOk`). No expone valores |
| * | `/api/auth/[...nextauth]` | Login/logout (NextAuth) |

## Personas
| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/personas` | `canViewPersonas` — lista con resumen de sacramentos y filtros |
| POST | `/api/personas` | `canManagePersonas` |
| GET | `/api/personas/[id]` | `canViewPersonas` |
| PUT | `/api/personas/[id]` | `canManagePersonas` + justificación |
| DELETE | `/api/personas/[id]` | `canDeletePersonas` (solo sin historia sacramental) |
| GET | `/api/personas/[id]/expediente` | `canViewExpediente` |

## Sacramentos
Mismo patrón para `bautismos`, `primeras-comuniones`, `confirmaciones` y `matrimonios`:

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/<sacramento>?q=` | `canViewSacramentos` — búsqueda por nombre, DNI, libro o registro |
| POST | `/api/<sacramento>` | `canCreateSacramentos` |
| GET | `/api/<sacramento>/[id]` | `canViewSacramentos` |
| PUT | `/api/<sacramento>/[id]` | `canEditSacramentos` + justificación (no hay `DELETE` en la API) |

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/libros` | `canViewSacramentos` |
| GET | `/api/numeradores/[modulo]` | `canViewSacramentos` — siguiente libro/página/registro |
| GET | `/api/constancias/[sacramento]/[id]` | `canGenerateConstancias` — devuelve el PDF |

## Clero y catálogos
| Método | Ruta | Permiso |
|---|---|---|
| GET / POST | `/api/sacerdotes` | ver: `canViewSacerdotes` o `canViewSacramentos` · crear: `canManageSacerdotes` |
| GET / PUT | `/api/sacerdotes/[dni]` | `canViewSacerdotes` / `canManageSacerdotes` |
| GET / POST | `/api/ordenes-religiosas` · PUT `/[id]` | `canManageConfiguracion` |
| GET / POST | `/api/rangos-sacerdotales` · PUT `/[id]` | `canManageConfiguracion` |
| GET | `/api/sectores` | `canViewPersonas`, `canViewSacramentos` o `canViewConfiguracion` |
| GET | `/api/ubicacion/departamentos`, `/api/ubicacion/municipios` | sesión |
| GET | `/api/roles` | sesión |

## Configuración
| Método | Ruta | Permiso |
|---|---|---|
| GET / PUT | `/api/configuracion/parroquia` | `canViewConfiguracion` / `canManageConfiguracion` |
| GET / POST / DELETE | `/api/configuracion/parroquia/logo` | `canManageConfiguracion` (PNG/JPG ≤ 1 MB, validado por contenido) |
| GET / POST | `/api/configuracion/sectores` · PUT / DELETE `/[id]` | `canManageConfiguracion` (`409` si el sector tiene personas) |
| GET / POST | `/api/configuracion/moldes` | `canViewConfiguracion` / `canManageConfiguracion` (POST = borrador inactivo) |
| GET / PUT / PATCH / DELETE | `/api/configuracion/moldes/[id]` | `canManageConfiguracion` (PUT = mapear y activar) |
| GET | `/api/configuracion/moldes/[id]/campos` | `canViewConfiguracion` — campos AcroForm del PDF |
| GET / POST / PUT | `/api/configuracion/constancias` | `canManageConfiguracion` — legado (plantillas sin UI) |
| GET / POST | `/api/configuracion/grupos`, `/api/configuracion/roles` | `canManageConfiguracion` — sin UI en v1 |

## Usuarios, auditoría y panel
| Método | Ruta | Permiso |
|---|---|---|
| GET / POST / PUT / DELETE | `/api/usuarios` | `canViewUsuarios` / `canManageUsuarios` (solo un Super Admin puede asignar el rol Super Admin) |
| GET | `/api/auditoria` | `canViewReportes` |
| GET | `/api/dashboard` | `canViewDashboard` |

## Interoperabilidad
Detalle del protocolo en [INTEROP_CONTRATO.md](INTEROP_CONTRATO.md).

| Método | Ruta | Quién llama | Autenticación |
|---|---|---|---|
| GET | `/api/interop/parroquias` | UI | sesión + `canSolicitarInterop` |
| GET | `/api/interop/solicitudes` | UI | sesión (enviadas: `canSolicitarInterop`; recibidas: `canResolverInterop`) |
| POST | `/api/interop/solicitudes` | UI | sesión + `canSolicitarInterop` |
| POST | `/api/interop/solicitudes/[id]/resolver` | UI | sesión + `canResolverInterop` |
| POST | `/api/interop/entrantes` | Hub | firma HMAC del hub |
| POST | `/api/interop/respuestas` | Hub | firma HMAC del hub |

## Mantener esta referencia
Al agregar o cambiar una ruta, actualice esta tabla en el mismo PR.
