# ChristiFideles — Estado del proyecto (5 de octubre de 2026)

**Meta:** lanzamiento piloto noviembre–diciembre 2026 con dos parroquias de Tegucigalpa.
**PO:** Luis Martinez · **PM/desarrollo:** Claude · Plan vivo: `docs/PLAN_MULTIPARROQUIA.md`

---

## 1. Resumen en una línea
Las **dos parroquias y el centralizador están en producción** y **ya se comunican**:
una parroquia envía una consulta y le llega a la otra. Falta pulir el flujo de
consulta (idea de chat con constancia, en evaluación), respaldos y la prueba con
una secretaria real antes del lanzamiento.

## 2. Qué está en producción hoy

| Servicio | Dirección | Rama | Base de datos | Estado |
|---|---|---|---|---|
| Cristo Resucitado de Loarque | https://christifideles.cristoresucitado.org | `master` | Postgres propio | ✅ En línea |
| Salvador del Mundo de Cerro Grande | https://christifideles.elsalvadordelmundo.org | `master` | Postgres propio | ✅ En línea |
| Centralizador (hub) | https://sacramentoschristifideles-production.up.railway.app | `hub` | Postgres propio | ✅ En línea · panel en `/panel` |

- Cada parroquia es una **isla** con su propia base de datos. Ninguna lee la de otra.
- El **centralizador** solo reenvía consultas y lleva la bitácora. **No guarda datos sacramentales.**
- Las dos parroquias están **registradas en el centralizador** y la comunicación funciona.

## 3. Qué se construyó (por área)

### Registro sacramental (núcleo)
- Personas con DNI obligatorio; bautismo, primera comunión, confirmación y matrimonio.
- **Personas muestra los sacramentos** de cada uno (insignias B/PC/C/M), con filtro "con / sin sacramento" y acceso al expediente.
- Búsqueda por **nombre, DNI, libro o registro** dentro de cada sacramento.
- Padre y madre opcionales (al menos uno), padrino o madrina obligatorio en bautismo.

### Roles y control
| Rol | Puede |
|---|---|
| **Secretaria** | Registrar y **editar** sacramentos y personas (con **justificación obligatoria**); no puede borrar. Puede enviar consultas a otras parroquias. |
| **Párroco** | Todo: ve, autoriza, administra usuarios y configuración; aprueba consultas recibidas. |
| **Admin general** `admin@christifideles.org` | Cuenta del PO en cada parroquia; se crea sola en el deploy. |

- Toda edición queda en la **auditoría** con su justificación.
- **Límite de intentos de login:** 5 fallos en 15 minutos bloquean ese usuario por 15 minutos.

### Constancias
- **Solo por molde PDF**, por sacramento:
  - PDF **con campos** rellenables → se llenan con los datos.
  - PDF **sin campos** (hoja membretada) → el sistema escribe encima el texto, los datos del libro y la firma del párroco.
- Sin molde activo → constancia simple con el **logo** de la parroquia.

### Configuración de cada parroquia
- **Datos de la parroquia:** nombre, dirección, teléfono, email, alias, párroco que firma y **logo**.
- **Sectores y capillas** (el nombre describe el sector; ya no se pide "tipo").
- **Constancias** (moldes), órdenes religiosas y rangos sacerdotales.
- Logo y nombre de la parroquia en la **barra superior**.

### Interoperabilidad (el diferenciador)
- Pantalla **Consultas entre parroquias** en cada parroquia, con contador de pendientes.
- **Centralizador** con panel web: inicio con semáforo de conexión, alta y gestión de parroquias (llave visible una sola vez), bitácora sin datos personales.
- Seguridad: mensajes **firmados** (HMAC) y con caducidad de 5 minutos, llaves **cifradas**, DNI guardado como **huella irreversible** en el hub.

### Infraestructura
- Despliegue en Railway: cada arranque aplica migraciones y **catálogos** (18 departamentos, 298 municipios, 9 roles) sin tocar datos existentes.
- El seed nunca crea una segunda parroquia ni pisa lo editado desde la pantalla.
- **Responsive** revisado en celular, tablet y escritorio (36 pantallas, 0 desbordes).
- **Pruebas automáticas:** 410 en las parroquias y 21 en el centralizador, todas en verde.

## 4. Decisiones tomadas (no re-discutir sin el PO)
1. Cada parroquia tiene **su base de datos independiente**.
2. El centralizador vive en la **rama `hub`**; `master` es solo el software de las parroquias.
   Nunca hacer `git merge master` dentro de `hub` (ver `hub/README.md`).
3. Las consultas entre parroquias son **solo de lectura** y requieren **acción humana** de la parroquia consultada.
4. El **gestor de expedientes** (escaneos de documentos) pasa a la **versión 2**.
5. Constancias **solo por molde** (con campos o como hoja membretada).

## 5. Qué falta

### 🔴 Antes del lanzamiento (imprescindible)
| # | Tarea | Responsable |
|---|---|---|
| 1 | **Respaldos automáticos** de las 3 bases de datos y una prueba de restauración | Claude + PO |
| 2 | **Prueba con una secretaria real**: registrar los 4 sacramentos, editar, emitir constancia y hacer una consulta | PO |
| 3 | **Salvador del Mundo:** corregir el nombre en Datos de la parroquia (quedó "Cristo Resucitado de Loarque") y el email del admin | PO |
| 4 | **`NEXTAUTH_SECRET` largo** (32+ caracteres) en las dos parroquias | PO |
| 5 | Cargar en cada parroquia: **nombre del párroco**, **logo** y la **hoja membretada** de constancias | PO |

### 🟡 Definiciones pendientes del PO
| # | Tema | Estado |
|---|---|---|
| 6 | **Flujo de consulta tipo chat**: la parroquia que tiene el libro **emite la constancia** dentro de la conversación | En evaluación (diseño propuesto) |
| 7 | ¿Entra **defunciones** en la v1? | Sin decidir |
| 8 | ¿Los municipios llevan **tildes**? (hoy "Danli", "Roatan") | Sin decidir |

### 🟢 Mejoras y orden (no bloquean)
| # | Tarea |
|---|---|
| 9 | Contar también a padrinos y padres en el resumen de sacramentos de Personas |
| 10 | Agregar la tabla `molde_constancia` al SQL de referencia (`docs/christi_fidelis_bdd_pg_v3.sql`) |
| 11 | Retirar el Postgres viejo del proyecto del centralizador (el de la app parroquial anterior), una vez respaldado |
| 12 | Monitoreo básico: aviso si alguna parroquia o el centralizador se cae |
| 13 | Versión 2: gestor de expedientes con escaneos |

## 6. Riesgos a vigilar
- **Respaldos:** hoy dependen solo de Railway. Es el riesgo principal antes de cargar datos reales.
- **Llave maestra del hub (`HUB_CLAVE_MAESTRA`):** si se pierde, hay que volver a registrar las parroquias. Guardarla fuera de Railway.
- **Bloqueo de login en memoria:** se reinicia con cada deploy (aceptable con una instancia por parroquia).

## 7. Dónde está cada cosa
| Necesito… | Documento |
|---|---|
| Desplegar o configurar una parroquia | `docs/RAILWAY_DEPLOYMENT.md` |
| Plan, decisiones y bitácora técnica | `docs/PLAN_MULTIPARROQUIA.md` |
| Operar el centralizador | `hub/README.md` (rama `hub`) |
| Reglas para agentes IA | `AGENTS.md` |
