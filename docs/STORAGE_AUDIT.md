# Auditoría de almacenamiento — ChristiFidelis (Railway)

Railway utiliza **filesystem efímero**: cada reinicio o redeploy del servicio web
puede borrar cualquier archivo escrito fuera del bundle de la imagen. Esta
auditoría clasifica todo el almacenamiento para confirmar que el demo funciona
sin estado en disco.

## Clasificación

### A) Datos en PostgreSQL (OK para Railway)

Todas las entidades de negocio viven en la base de datos gestionada por el plugin
PostgreSQL de Railway. Sobreviven a reinicios y redeploys sin acción adicional.

| Modelo | Tabla | Notas |
|--------|-------|-------|
| Persona | `persona` | PK compuesta `(id_parroquia, numero_identidad)` |
| Sacramento | `bautismo`, `primera_comunion`, `confirmacion`, `matrimonio` | |
| Moldes PDF | `molde_constancia` | **BYTEA** (no filesystem) |
| Plantillas de texto | `plantilla_constancia` | Texto en BD |
| Auditoría | `bitacora_crud`, `bitacora_login` | |
| Usuarios / parroquia / config | `usuario`, `parroquia`, `parroquia_config` | |
| Numeradores | `numeradores` | Una fila por `(parroquia, modulo, scope)` |

### B) Assets estáticos (bundle de Next.js) — OK

Estos archivos se sirven desde el bundle que genera `next build` y se incluyen
en el deploy. **No se escriben en runtime**.

- `public/favicon.ico`
- `public/icon-christifideles.svg`
- `public/logo-christifideles.svg`
- `public/assets/logos/...`
- `public/assets/marca/CF_LOGO*.png`, `favicon-*`

Se referencian desde componentes como `<Image src="/assets/marca/CF_LOGO_LETRAS.png">`.
Sirven correctamente porque Next empaqueta `public/` como raíz estática del servidor.

### C) Imágenes de Persona (`persona.imagen VARCHAR(300))

Actualmente el campo se inicializa siempre a `null` en semillas y formularios
(`src/app/api/personas/route.ts:220`, `src/app/api/personas/[id]/route.ts:268`).
**No hay upload ni lectura desde filesystem** en el código actual.

| Implicación | Acción |
|-------------|--------|
| Si en v1.1 se añade upload de fotos | Se necesitaría S3/R2 o Railway Volume; documentar y proponer antes de implementar |
| Demo actual | OK sin imágenes de persona |

### D) Generación de PDF

`renderConstanciaPdf` y `renderMoldePdf` generan PDF **en memoria** (`pdf-lib`
devuelve `Uint8Array`) y se sirven directamente como respuesta HTTP. No se
escriben archivos temporales a disco.

### E) Sin escrituras accidentales a filesystem

Búsqueda exhaustiva en `src/` y `scripts/`:

- `src/`: **0** usos de `fs`, `fs/promises`, `writeFile`, `mkdir`.
- `scripts/`: usan `node:child_process` y `prisma` client únicamente.

El único acceso de Node a filesystem en el código de aplicación es **lectura**
del propio bundle (`fs.stat` interno de Next). Confirmado.

## Conclusión

- **No se requiere Railway Volume** para el demo actual.
- **No se requiere S3/R2** para el demo actual.
- `BYTEA` para moldes PDF AcroForm es suficiente.
- `public/` se sirve correctamente desde el build y no requiere persistencia.

## Pendiente (no bloquea demo, v1.1+)

- Si se añaden fotos de Persona: introducir `persona.foto_url VARCHAR` + S3/R2
  o Railway Volume montado en `/var/data/personas`.
- Si se añaden adjuntos a constancias: mismo patrón.
