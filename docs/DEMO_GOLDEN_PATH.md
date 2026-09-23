# Demo Golden Path — ChristiFideles

Recorridos end-to-end para mostrar el sistema en demo. Cada flow enumera los
pasos exactos de UI y los datos de demo a usar.

**Parroquia demo:** Cristo Resucitado de Loarque.

> **Antes del demo:** ejecutar desde tu máquina apuntando a la BD Railway
> correspondiente:
> ```bash
> ALLOW_DEMO_SEED=true \
>   DEMO_ADMIN_PASSWORD='...' \
>   DEMO_SECRETARIO_PASSWORD='...' \
>   DEMO_CATEQUISTA_PASSWORD='...' \
>   pnpm db:seed:demo
> ```
> El guard `ALLOW_DEMO_SEED=true` es obligatorio e independiente de
> `NODE_ENV`. Tras terminar, `unset ALLOW_DEMO_SEED`.

**Usuarios demo (creados por `pnpm db:seed:demo`):**

| Email | Contraseña | Rol |
|-------|------------|-----|
| demo-admin@cristoresucitado.org | `DEMO_ADMIN_PASSWORD` | Super Admin |
| demo-secretario@cristoresucitado.org | `DEMO_SECRETARIO_PASSWORD` | Secretario |
| demo-catequista@cristoresucitado.org | `DEMO_CATEQUISTA_PASSWORD` | Catequista |

Las contraseñas se configuran como variables de entorno. **No se imprimen en logs.**

Los DNIs demo siguen el formato `0801-9NNNN` (5 dígitos numéricos ficticios,
claramente diferenciados del seed base `0801-YYYY-NNNNN`).

**Personas clave (DNI ficticio):**
- `0801-90103` (Sofía Bonilla) — bautizada en 2012
- `0801-90113` (Emiliano Castillo) — bautizado 2007, comunión 2018
- `0801-90101` (Ana Lucía Bonilla) — confirmada 2006, casada 2016
- `0801-90105` (Pedro Pablo Reyes) — esposo de Ana Lucía, confirmado 2002
- `0801-90107` (Mateo Reyes) — hijo de Ana y Pedro
- `0801-90109` (Andrés Bonilla) — abuelo, padrino

**Ministros:**
- `0801-90001` (Padre Carlos Mendoza) — párroco (sacerdote)
- `0801-90002` (Padre José Aguilar) — sacerdote
- `0801-90003` (Monseñor Arturo Paz) — obispo
- `0801-90004` (Diácono Luis Reyes) — diácono

---

## FLOW 1 — Admin: Dashboard, Personas, Búsqueda

1. Ir a `/login`.
2. Iniciar sesión con `demo-admin@cristoresucitado.org` + contraseña de admin.
3. Confirmar que `/dashboard` muestra:
   - contadores reales (sacramentos del mes, personas activas, constancias del mes);
   - actividad reciente.
4. Navegar a `/personas`. Mostrar paginación y filtros (estado vital, sexo).
5. Abrir detalle de `0801-90103` (Sofía). Mostrar todos los datos + auditoría.
6. Ir a `/buscar`, buscar por:
   - DNI exacto: `0801-90103` → 1 resultado.
   - Apellido parcial: `Bonilla` → 4 resultados.
7. Verificar que no hay registros de otras parroquias (multi-tenant).

**Permisos:** Admin ve todo dentro de su parroquia.

## FLOW 2 — Sacerdotes: detalle, edición, MinistroSelector

1. Ir a `/sacerdotes`.
2. Ver lista de ministros con sus rangos (Diácono/Presbítero/Obispo).
3. Abrir detalle del párroco (`0801-90001`).
4. Editar (solo Admin): cambiar teléfono o estado ministerial.
5. Validar `MinistroSelector` en una nueva captura de sacramento (comunión, bautismo, etc.).

**Permisos:** Admin y Secretario pueden editar; Catequista solo ve.

## FLOW 3 — Bautismo con numeración y constancia

1. Desde `/personas/0801-90107`, iniciar nuevo bautismo (`/bautismos/nuevo`).
2. Llenar formulario con:
   - bautizado: Mateo Reyes;
   - padres: Ana Lucía / Pedro Pablo;
   - padrinos: Rosa Elena (madrina), Andrés Bonilla (padrino);
   - catequista: Diácono Luis Reyes;
   - sacerdote: Padre Carlos Mendoza (párroco).
3. Verificar que el sistema asigna automáticamente `libro 12 / página / registro` siguiente, leyendo `numeradores`.
4. Confirmar creación → ver detalle.
5. Desde detalle, generar **constancia PDF** (botón).
6. Constancia usa `Plantilla demo Bautismo` con placeholders correctos.

**Permisos:** Admin y Secretario crean/editan; Catequista ve.

## FLOW 4 — Primera Comunión + constancia

1. Ir a `/primeras-comuniones/nuevo`.
2. Persona `0801-90107` (Mateo).
3. Padres, catequista y sacerdote.
4. Confirmar numeración.
5. Generar constancia PDF.

## FLOW 5 — Confirmación + obispo ministro

1. Ir a `/confirmaciones/nuevo`.
2. Persona: `0801-90113` (Emiliano Castillo, ya bautizado).
3. El campo **obispo** debe mostrar al `0801-90003`.
4. Confirmar y generar constancia.

## FLOW 6 — Matrimonio con esposos y padrinos

1. Ir a `/matrimonios/nuevo`.
2. Esposa: `0801-90101` (Ana Lucía).
3. Esposo: `0801-90105` (Pedro Pablo).
4. Padrinos: madrina `0801-90108`, padrino `0801-90109`.
5. Sacerdote: párroco `0801-90001`.
6. Validar numeración y emitir constancia PDF.

## FLOW 7 — Búsqueda → historial sacramental

1. `/buscar` con texto `Mateo`.
2. Abrir resultado `0801-90107`.
3. En el detalle, abrir `Expediente sacramental` (`/personas/[id]/expediente`).
4. Mostrar línea de tiempo: bautismo, comunión (vacío para Mateo), etc.

## FLOW 8 — Auditoría

1. Como Admin, ir a `/auditoria`.
2. Confirmar entradas C/U/D para los sacramentos creados.
3. Filtrar por tabla (`bautismo`, `matrimonio`...) y por fecha.
4. Verificar `actor_ip` y `user_agent`.

## FLOW 9 — RBAC matriz

| Acción | Admin | Secretario | Catequista |
|--------|:----:|:----------:|:----------:|
| Dashboard | sí | sí | no |
| Ver Personas | sí | sí | sí |
| Crear/Editar Personas | sí | no | no |
| Ver Sacerdotes | sí | sí | sí |
| Editar Sacerdotes | sí | sí | no |
| Bautismo: ver | sí | sí | sí |
| Bautismo: crear | sí | sí | no |
| Bautismo: editar | sí | sí | no |
| Constancia PDF | sí | sí | no |
| Reportes | sí | no | no |
| Auditoría | sí | no | no |
| Configuración catálogos | sí | no | no |
| Configuración moldes PDF | sí | no | no |

Cómo probarlo: tres navegadores o tres perfiles, tres sesiones paralelas,
ejecutar FLOW 1 con cada uno y comparar opciones de menú y botones.

---

## Definición de demo exitoso

Todos los flows 1–9 se completan sin error. La consola del navegador no muestra
errores rojos. El healthcheck Railway permanece verde durante el recorrido.
