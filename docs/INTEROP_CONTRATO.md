# Contrato de interoperabilidad (parroquia ↔ centralizador)

Fuente de verdad en código: `src/lib/interop/contrato.ts` (tipos y rutas) y `src/lib/interop/firma.ts` (firma). Ambos se copian a la rama `hub` ([ADR-003](adr/ADR-003-centralizador-en-rama-hub.md)). Reglas de negocio en [ADR-004](adr/ADR-004-consultas-solo-lectura.md).

## Actores
- **Origen:** parroquia que pregunta.
- **Hub:** reenvía, guarda la bitácora (DNI solo como huella), no guarda datos sacramentales.
- **Destino:** parroquia que tiene (o no) el registro y decide.

## Flujo
```
Origen                         Hub                              Destino
  │ POST /api/solicitudes ───────►│                                │
  │ {destino, numero_identidad,   │ POST /api/interop/entrantes ───►│ guarda 'pendiente' (dirección E)
  │  motivo}                      │ {uuid, origen, origen_nombre,  │
  │◄── {uuid, destino_nombre} ────│  numero_identidad, motivo}     │
  │ guarda 'pendiente' (S)        │                                │ párroco aprueba o rechaza
  │                               │◄─ POST /api/solicitudes/{uuid}/respuesta (ResolucionSolicitud)
  │◄─ POST /api/interop/respuestas│                                │
  │ actualiza estado + respuesta  │                                │
```
Estados: `pendiente`, `aprobada`, `rechazada`, `error_envio` (el hub no pudo entregar).

## Firma de cada petición
Cabeceras obligatorias:

| Cabecera | Valor |
|---|---|
| `x-interop-instancia` | código de quien firma (`hub` cuando firma el hub) |
| `x-interop-timestamp` | milisegundos Unix |
| `x-interop-firma` | HMAC-SHA256 en hex |

Mensaje firmado (separado por `\n`): `timestamp`, `MÉTODO`, `ruta`, `cuerpo` (el JSON exacto enviado).

- Secreto: el `INTEROP_SECRET` de la parroquia (el hub guarda una copia cifrada con `HUB_CLAVE_MAESTRA`).
- Se rechaza si falta una cabecera, si el reloj difiere más de **5 minutos** o si la firma no coincide (comparación en tiempo constante). Respuesta `401`.

## Datos
```ts
NuevaSolicitudHub      { destino, numero_identidad, motivo }
SolicitudRegistradaHub { uuid, destino_nombre }
SolicitudEntrante      { uuid, origen, origen_nombre, numero_identidad, motivo }

ResolucionSolicitud =
  | { estado: 'aprobada', respuesta: RespuestaConsulta }
  | { estado: 'rechazada', motivo_rechazo }

RespuestaConsulta =
  | { encontrado: false }
  | { encontrado: true, nombres, apellidos, fecha_nacimiento,
      sacramentos: [{ tipo, fecha, libro, pagina, registro, folio }] }
```
`tipo` ∈ `bautismo`, `primera_comunion`, `confirmacion`, `matrimonio`. **Nunca** se agregan teléfono, email, dirección, padres ni padrinos sin un ADR nuevo.

Límites de texto: ver `MAX_DNI` y `MAX_MOTIVO` en `src/lib/interop/solicitudes.ts` (motivo ≤ 500 en la base).

## Almacenamiento en la parroquia
Tabla `solicitud_interop`: `direccion` `S` (enviada) o `E` (entrante), `uuid` del hub, contraparte, DNI consultado, motivo, estado, usuarios solicitante y resolutor, `respuesta` (JSON) y fechas.

## Cambiar el contrato
1. Cambio compatible hacia atrás (campos nuevos opcionales) siempre que se pueda.
2. Modificar `contrato.ts` / `firma.ts` en `master` con pruebas (`tests/interop*.test.ts`).
3. Llevar los archivos a `hub` con `git checkout origin/master -- src/lib/interop/contrato.ts src/lib/interop/firma.ts` y probar.
4. Desplegar primero el hub y después las parroquias; prueba ida y vuelta.
5. Actualizar este documento y el CHANGELOG.

## Operación
Registrar, rotar o suspender parroquias: [RAILWAY_DEPLOYMENT.md §16](RAILWAY_DEPLOYMENT.md) y `hub/README.md`.
