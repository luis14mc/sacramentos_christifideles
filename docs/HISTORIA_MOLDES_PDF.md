# Historia de usuario — Moldes de constancia subibles (B)

**Rama:** `feature/constancias-moldes-pdf`
**Sprint objetivo:** 6 (hardening) → 7 (staging)
**Origen:** `docs/PLAN_ACCION_V1.md` §4bis.B
**Estado:** En curso

## Valor para usuario (secretaría parroquial)

Hoy la secretaría solo puede editar texto en una plantilla por sacramento. Hay parroquias con
moldes PDF institucionales (papel membretado, escudo, tipografía específica, idioma
católico formal) que la herramienta actual ignora. La consecuencia práctica es que la
constancia generada no se parece al documento que la diócesis entrega físicamente,
generando retrabajo manual (imprimir, firmar, escanear).

Esta historia permite que la secretaría **suba su propio PDF con AcroForm por parroquia
y sacramento**, defina el mapeo `campo_pdf → token_dato` y la aplicación emita la
constancia rellenando los campos del molde sin tocar el resto del flujo (búsqueda,
datos, auditoría, multi-tenant).

## Alcance

### Sí entra
1. Modelo `MoldeConstancia` con archivo PDF, mapeo `JSONB`, `tipo_constancia` y multi-tenant.
2. Migración Prisma versionada.
3. CRUD API en `/api/configuracion/moldes` con RBAC `canManageConfiguracion`.
4. Endpoint para listar nombres de campos AcroForm del PDF subido (asistente de mapeo).
5. Integración con `cargarDatosConstancia`: si hay molde activo para `(parroquia,
   sacramento, tipo_constancia)`, se usa el molde; si no, fallback a la generación
   actual basada en `PlantillaConstancia`.
6. Auditoría en alta/baja/actualización de moldes.
7. Tests unitarios del servicio (extracción AcroForm, validación de mapeo, fallback).

### No entra
- DOCX (Word) — se evaluará en v1.1 si hay demanda real.
- Editor visual drag-and-drop del mapeo (la UI es una tabla campo → token).
- Versionado/histórico de moldes (se conserva solo el actual activo).
- Notificaciones inter-parroquiales (P2, v1.1).

## Reglas de negocio

- `numero_identidad` se mantiene como PK compuesta del modelo `Persona` (sin cambios).
- `MoldeConstancia` es **estrictamente tenant**: solo se listan/usan moldes de la
  parroquia de sesión. El servidor ignora cualquier `id_parroquia` enviado por el cliente.
- El cliente nunca aporta datos al PDF: solo el `id` del registro sacramental y el
  `tipo_constancia`. Los datos se cargan SIEMPRE vía `cargarDatosConstancia`.
- Un solo molde activo por `(id_parroquia, sacramento, tipo_constancia)`.
- Mapeo `mapa_campos`: objeto `{ "campo_pdf": "token" }`. Solo se permiten tokens
  definidos en `construirTokens()` (lista cerrada, sin `eval`).
- Tamaño máximo PDF: 5 MB (defensa contra abuso + memoria serverless).

## Archivos afectados

| Tipo | Ruta |
|------|------|
| Schema | `prisma/schema.prisma` (nuevo modelo + relación Parroquia) |
| Migración | `prisma/migrations/<ts>_molde_constancia/migration.sql` |
| Servicio | `src/lib/constancias/moldes.ts` (extracción AcroForm, validación tokens, render) |
| Servicio | `src/lib/constancias.ts` (extender `obtenerPlantilla` → elegir molde o texto) |
| API | `src/app/api/configuracion/moldes/route.ts` (GET, POST, DELETE) |
| API | `src/app/api/configuracion/moldes/[id]/campos/route.ts` (GET nombres AcroForm) |
| API | `src/app/api/constancias/[sacramento]/[id]/route.ts` (aceptar `?tipo=...`) |
| Tests | `tests/constancias-moldes.test.ts` |
| Docs | `docs/HISTORIA_MOLDES_PDF.md` (este archivo) |

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| PDF sin AcroForm (escaneado) | Validar al subir; rechazar con 400 explicando "el PDF no tiene campos editables". |
| Campos PDF con caracteres exóticos | Sanitizar nombres de campos (regex `^[A-Za-z0-9_]{1,64}$`). |
| PDF malicioso (JS embebido, estructuras inválidas) | Limitar tamaño, validar header `%PDF-`, rechazar streams con `/JS` o `/Launch`. |
| Memoria serverless con PDFs grandes | Límite 5 MB; cargar PDF en buffer y liberar tras `save()`. |
| Token desconocido en mapeo | Validar contra lista cerrada de tokens antes de aceptar el molde. |
| Molde duplicado (mismo nombre+parroquia+sacramento+tipo) | Constraint `@@unique` + 409 controlado. |

## Criterios de aceptación

1. Secretario con `canManageConfiguracion` puede subir un PDF con AcroForm en
   `/configuracion/moldes`, asignarle tipo y mapear campos.
2. El endpoint `GET /api/configuracion/moldes` lista solo moldes de la parroquia de
   sesión.
3. Al solicitar una constancia con `?tipo=predeterminado` y existir molde activo, el
   PDF resultante es el molde con los campos rellenos desde BD. Sin `?tipo` o sin
   molde, se usa la generación actual (back-compat).
4. Catequista con `canGenerateConstancias` pero sin `canManageConfiguracion` puede
   emitir constancias pero NO puede listar/crear/borrar moldes (403).
5. Secretario de parroquia A no ve ni usa moldes de parroquia B (multi-tenant).
6. Cualquier acción CRUD sobre moldes genera entrada en `bitacora_crud` con
   `actor_ip` y `user_agent`.

## Pruebas mínimas (Definition of Done)

- [ ] Unit: extraer AcroForm fields de un PDF de prueba con campos conocidos.
- [ ] Unit: rechazo de PDF sin AcroForm, > 5 MB o con `/JS`.
- [ ] Unit: validación de tokens desconocidos.
- [ ] Integration: POST /api/configuracion/moldes (multipart) crea registro con
      `archivo` binario y `mapa_campos` JSONB.
- [ ] Integration: GET /api/configuracion/moldes solo lista parroquia de sesión.
- [ ] Integration: GET /api/constancias/bautismo/:id con molde activo rellena campos.
- [ ] Integration: GET /api/constancias/bautismo/:id sin molde → fallback.
- [ ] Multi-tenant: usuario A no puede usar moldes de B (404).
- [ ] RBAC: catequista sin `canManageConfiguracion` recibe 403 al POST.
- [ ] `pnpm run lint` y `pnpm run build` en verde.

## Definition of Done

- Código implementado y revisado.
- Autorización y multi-tenant verificados.
- Migración Prisma incluida y validada.
- Tests pasan.
- `pnpm run lint` verde.
- `pnpm run build` verde.
- Documentación mínima (este archivo) actualizada.
