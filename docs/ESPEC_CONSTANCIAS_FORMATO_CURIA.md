# Especificación: certificaciones con el formato de la Curia (v1.1)

**PO:** Luis Martinez · **Redactó:** Claude (PO) · **Fecha:** 27-nov-2026
**Rama:** `feature/constancias-formato-curia` (desde `master`). **Estado:** H1–H3 implementadas; H4–H5 pendientes (v1.2). Nada de esto entra en la v1.0.

Moldes Word de referencia: `docs/moldes-constancias/`.

## 1. Contexto

La Arquidiócesis de Tegucigalpa entregó formatos e indicaciones para las constancias eclesiales. Los moldes unificados están en `Moldes_constancias_Christifideles.zip` (8 documentos Word). Reglas de la Curia que afectan al sistema:

- Las certificaciones de sacramentos se imprimen en **papel sellado de la Curia Arzobispal**.
- Firma el **párroco o, en su defecto, el vicario parroquial**, con sello. **Nunca** el encargado del archivo.
- Las **actas supletorias** van en un libro especial (uno general o uno por sacramento) y requieren un **testigo** que firma el acta.
- Al registrar un matrimonio, el párroco debe **notificar a las parroquias de bautismo** de los contrayentes.

## 2. Qué hace hoy el sistema (y por qué no alcanza)

`src/lib/constancias.ts` genera "CONSTANCIA DE …" con una frase genérica, una lista de datos (Libro, Página, Registro, Acta, Fecha, Ministro), "Emitida el …" y la firma fija "Párroco". El modo **hoja membretada** (`molde_constancia.con_campos = false`) ya permite imprimir sobre el papel de la Curia, pero:

1. Faltan datos que exige el formato: padres, padrinos, lugar y fecha de nacimiento, folio, fechas en letras y ciudad.
2. `dibujarCuerpo()` siempre agrega su título y la lista de datos, aunque el molde traiga su propio texto.
3. El firmante solo puede ser el párroco.

**Buena noticia:** los datos de los puntos 1 ya están en la base (`Bautismo`, `PrimeraComunion`, `Confirmacion`, `Matrimonio`, `Persona`). Las historias H1 y H2 no requieren migración.

## 3. Historias

### H1 · Tokens nuevos para el formato de la Curia (sin migración)

Agregar a `TOKENS_CONSTANCIA` y `construirTokens()`:

| Token | Origen | Ejemplo |
|---|---|---|
| `folio` | `Bautismo.numero_folio`; en los demás, `numero_pagina` | `247` |
| `fecha_sacramento_letras` | fecha del sacramento en letras | `cinco de octubre de dos mil cinco` |
| `persona.fecha_nacimiento_letras` | `Persona.fecha_nacimiento` | `veintinueve de mayo de dos mil cinco` |
| `persona.lugar_nacimiento` | `Municipio.nombre_municipio` de `Persona.lugar_nacimiento` | `Tegucigalpa` |
| `persona.hijo_a` | `Persona.sexo` → `hijo` o `hija` (confirmar los valores que guarda el campo); si no se reconoce, `hijo(a)` | `hija` |
| `padre.nombre_completo` / `madre.nombre_completo` | relación `padre` / `madre` del sacramento; vacío si no hay | |
| `padrino.nombre_completo` / `madrina.nombre_completo` | relación `padrino` / `madrina` (Bautismo, Confirmación, Matrimonio) | |
| `parroquia.ciudad` | `Municipio.nombre_municipio` de `Parroquia.ubicacion` | `Tegucigalpa` |
| `emision.dia` / `emision.dia_letras` / `emision.mes` / `emision.anio` | fecha de emisión en la zona horaria de la parroquia | `29` / `veintinueve` / `agosto` / `2026` |
| `firmante.nombre` / `firmante.cargo` | ver H3; mientras tanto, párroco y `Párroco` | |

**Criterios de aceptación**
- Helper `numeroALetras()` en español para 1–31 y para años 1900–2099, con pruebas (incluye `veintiuno`, `dos mil`, `mil novecientos noventa y nueve`).
- Un padre, madre o padrino ausente produce cadena vacía, nunca `—` ni `undefined` dentro del texto.
- Las consultas siguen filtrando por `id_parroquia` (tenant). Prueba que un registro de otra parroquia devuelve 404.
- Prueba nueva: cada token de `TOKENS_CONSTANCIA` tiene una entrada en `construirTokens()`, y viceversa.

### H2 · Texto oficial por defecto y hoja membretada limpia

- Títulos: `CERTIFICACIÓN DE BAUTISMO`, `… DE PRIMERA COMUNIÓN`, `… DE CONFIRMACIÓN`, `… DE MATRIMONIO`.
- `plantillaDefault()` devuelve el texto de los moldes 01–04 del zip, con los tokens de H1 (ejemplo de bautismo abajo).
- Si el molde membretado trae `contenido`, `dibujarCuerpo()` **no** dibuja la lista de datos ni "Emitida el …": solo título, texto, "Es conforme al original.", cierre con fecha y firma.
- `Observaciones:` al pie con `nota_marginal`, o `Ninguna`.
- Las constancias sin molde pasan de A4 a **tamaño carta** (612 × 792 pt).

Texto por defecto de bautismo:

```
El infrascrito Cura encargado de la Parroquia {{parroquia.nombre}},

CERTIFICA

Que en el Libro de Bautismos No. {{libro}} de este archivo parroquial, Folio {{folio}}, Número {{registro}}, se encuentra la partida que literalmente dice:

«El día {{fecha_sacramento_letras}}, en {{parroquia.ciudad}}, Parroquia {{parroquia.nombre}}, el Rev. P. {{ministro.nombre}} bautizó solemnemente a {{persona.nombre_completo}}, que dijeron haber nacido en {{persona.lugar_nacimiento}} el día {{persona.fecha_nacimiento_letras}}, {{persona.hijo_a}} de {{padre.nombre_completo}} y de {{madre.nombre_completo}}.

Padrinos: {{padrino.nombre_completo}} y {{madrina.nombre_completo}}.»

Es conforme al original.

Y para los efectos que se deseen y en derecho correspondan, se extiende la presente certificación en {{parroquia.ciudad}}, a los {{emision.dia_letras}} ({{emision.dia}}) días del mes de {{emision.mes}} de {{emision.anio}}.
```

**Criterios de aceptación**
- Con un registro del seed demo, el PDF de cada sacramento cabe en **una hoja carta** con el margen superior por defecto (170 pt).
- La secretaria puede editar el `contenido` del molde desde Configuración → Constancias; los tokens desconocidos se reemplazan por cadena vacía (comportamiento actual).

### H3 · Firma del párroco o del vicario parroquial

- Configuración de la parroquia: agregar **Vicario parroquial** (nombre, opcional).
- Al emitir, si hay vicario configurado, el usuario elige quién firma. Por defecto, el párroco.
- La firma muestra `P. {nombre}` y debajo `Párroco` o `Vicario parroquial`.
- La elección queda en la bitácora de auditoría.

**Criterios de aceptación**
- Nunca se usa el nombre del usuario que emite como firmante.
- Si no hay párroco configurado, la emisión se bloquea con un mensaje claro ("Configure el párroco antes de emitir certificaciones").

## 4. Fuera de alcance (v1.2, requieren diseño aparte)

- **H4 · Libro de supletorias:** registro de partidas supletorias por sacramento, con testigo (nombre y DNI) y numeración propia. Requiere migración y ADR.
- **H5 · Aviso de matrimonio a la parroquia de bautismo:** al registrar un matrimonio, enviar una nota marginal por el centralizador a la parroquia donde está el bautismo de cada contrayente.
- **Trámites de matrimonio** (delegación c. 1111, declaración c. 1125, solicitud de dispensa): se siguen llenando en Word con los moldes 06–08.

## 5. Pregunta abierta para el PO

En `Matrimonio` existen `padrino` y `madrina`, pero el formato de la Curia pide **dos testigos**. ¿Los padrinos de boda son los testigos que se anotan en el libro, o hay que agregar campos de testigos?

Mientras se decide, el texto por defecto dice "siendo sus padrinos {{padrinos.nombres}}" para no afirmar algo que el libro quizá no registra.

## 6. Flujo

Un issue por historia (H1 → H2 → H3). PRs pequeños hacia `master`, con `pnpm lint`, `pnpm test` y `pnpm build` en verde, CHANGELOG y bitácora actualizados. El PO aprueba el merge.
