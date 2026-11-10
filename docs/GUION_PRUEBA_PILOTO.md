# Guion de prueba piloto (aceptación con secretaria real)

**Objetivo:** confirmar que una secretaria, **sin ayuda técnica**, puede hacer el trabajo diario completo antes del lanzamiento.
**Dónde:** en una de las parroquias de producción, con datos de prueba claramente marcados (apellido `PRUEBA`) que se dan de baja al terminar.
**Quién:** una secretaria (rol Secretario) y el párroco (rol Párroco). El PO observa y anota; **no** guía con el mouse.
**Duración estimada:** 90 minutos.

## Antes de empezar (PO)
- [ ] Respaldo reciente de la base (o respaldo manual, ver runbook).
- [ ] Usuarios de secretaria y párroco creados, cada uno con su contraseña.
- [ ] Molde activo al menos para bautismo; nombre del párroco y logo cargados.
- [ ] La otra parroquia, avisada para responder una consulta.
- [ ] Dos DNI de prueba que no existan.

## Casos
Marcar cada caso: ✅ lo hizo sola · 🟡 con una pista · ❌ no pudo / falló. Anotar el tiempo.

| # | Caso | Quién | Resultado esperado | Res. | Min. | Notas |
|---|---|---|---|---|---|---|
| 1 | Iniciar sesión | Secretaria | Entra al panel | | | |
| 2 | Registrar persona A (`PRUEBA`) | Secretaria | Aparece en Personas, sin insignias | | | |
| 3 | Intentar registrar otra persona con el mismo DNI | Secretaria | El sistema lo impide con mensaje claro | | | |
| 4 | Bautismo de A con madrina y solo la madre | Secretaria | Guardado; numeración propuesta; insignia **B** | | | |
| 5 | Primera comunión de A | Secretaria | Insignia **PC** | | | |
| 6 | Confirmación de A | Secretaria | Insignia **C** | | | |
| 7 | Registrar persona B y matrimonio A–B | Secretaria | Insignia **M** en ambos | | | |
| 8 | Buscar el bautismo por libro y registro | Secretaria | Lo encuentra | | | |
| 9 | Editar el bautismo (corregir una fecha) | Secretaria | Pide justificación; se guarda | | | |
| 10 | Intentar borrar un sacramento | Secretaria | No tiene la opción | | | |
| 11 | Ver el expediente de A | Secretaria | Muestra los 4 sacramentos | | | |
| 12 | Emitir constancia de bautismo | Secretaria | PDF con membrete y datos correctos | | | |
| 13 | Enviar consulta a la otra parroquia con un DNI real conocido | Secretaria | Queda pendiente | | | |
| 14 | Aprobar la consulta en la otra parroquia | Párroco (otra) | La secretaria ve la respuesta | | | |
| 15 | Rechazar una consulta recibida con motivo | Párroco | Estado "rechazada" en el origen | | | |
| 16 | Revisar la auditoría de la edición del caso 9 | Párroco | Aparece con la justificación | | | |
| 17 | Hacer el flujo 2–12 desde un **celular** | Secretaria | Todo legible y usable | | | |
| 18 | Dar de baja los datos `PRUEBA` | Párroco | Quedan fuera de los listados | | | |

## Criterio de aceptación
- **Aprobado:** los casos 1–16 en ✅ o 🟡, sin ❌, y ningún dato incorrecto en la constancia.
- Todo ❌ → issue en GitHub con etiqueta `piloto` y prioridad P0/P1.
- Cada 🟡 → mejora de texto o de UI (P2) o una aclaración en el [manual](MANUAL_USUARIO.md).

## Cierre
| Campo | Valor |
|---|---|
| Fecha | |
| Parroquia | |
| Secretaria | |
| Resultado | Aprobado / No aprobado |
| Issues creados | |
| Firma del PO | |
