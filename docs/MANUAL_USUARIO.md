# Manual de usuario — ChristiFideles

Para la **secretaría parroquial** y el **párroco**. Versión 1 · noviembre 2026.

> Cada parroquia tiene su propia dirección (por ejemplo `christifideles.cristoresucitado.org`). Lo que registra una parroquia **no lo ve otra**, salvo por una consulta aprobada (§7).

## 1. Entrar al sistema
1. Abra la dirección de su parroquia y escriba su correo y contraseña.
2. Si se equivoca **5 veces en 15 minutos**, su usuario queda bloqueado **15 minutos**. Espere o pida ayuda al párroco.
3. Para salir, use el menú de su nombre (arriba a la derecha) → **Cerrar sesión**. Ciérrela siempre en computadoras compartidas.

## 2. Qué puede hacer cada rol
| Acción | Secretaria | Párroco | Vicario / sacerdote / diácono | Catequista / solo lectura |
|---|---|---|---|---|
| Ver personas y sacramentos | ✅ | ✅ | ✅ | ✅ |
| Registrar y editar personas y sacramentos | ✅ con justificación | ✅ | ✅ | ❌ |
| Borrar personas o sacramentos | ❌ | ✅ | ✅ | ❌ |
| Emitir constancias | ✅ | ✅ | ✅ | ❌ |
| Enviar consulta a otra parroquia | ✅ | ✅ | ✅ | ❌ |
| Aprobar consultas recibidas | ❌ | ✅ | ✅ | ❌ |
| Usuarios y configuración | ❌ | ✅ | ❌ | ❌ |

Si una opción no aparece en su menú es porque su rol no la tiene.

## 3. Personas
Todo sacramento se registra sobre una **persona que ya existe**. Registre primero a la persona.

**Registrar:** menú **Personas** → **Nueva** → complete los datos. El **número de identidad (DNI) es obligatorio** y no se puede repetir.

**Buscar:** escriba nombre o DNI en el buscador. Use el filtro **con / sin sacramento**. Las insignias muestran lo que tiene: **B** bautismo, **PC** primera comunión, **C** confirmación, **M** matrimonio.

**Expediente:** desde la persona, **Expediente** muestra todos sus sacramentos en una sola página.

**Editar:** el sistema pide una **justificación** (entre 10 y 500 caracteres; por ejemplo, "Corrección de apellido según partida de nacimiento"). Queda guardada en la auditoría.

## 4. Registrar un sacramento
1. Menú del sacramento (**Bautismos**, **Primera Comunión**, **Confirmaciones** o **Matrimonios**) → **Nuevo**.
2. Busque y elija a la persona (en matrimonio, a los dos contrayentes).
3. Libro, página y registro: con la **numeración automática** activada, el sistema propone el siguiente número; puede desactivarla para escribirlo a mano (por ejemplo, al pasar libros antiguos).
4. Elija el ministro (sacerdote) que celebró.
5. **Bautismo:** padre y madre son opcionales (al menos uno); padrino **o** madrina es obligatorio.
6. Guarde.

**Buscar un registro:** en el listado de cada sacramento escriba nombre, DNI, libro o registro.

**Editar:** abra el registro → **Editar** → cambie → escriba la justificación. La secretaria no puede borrar; si un registro sobra, pida al párroco que lo dé de baja.

**Libros:** el menú **Libros** muestra los libros de cada sacramento y su numeración.

## 5. Constancias
1. Abra el registro del sacramento → **Constancia**.
2. Se descarga un PDF listo para imprimir y firmar.
3. Revise siempre nombre, fecha, libro, página y registro antes de entregarla.

Si sale una constancia **simple con el logo** en lugar de la hoja de la parroquia, significa que ese sacramento no tiene molde activo (§6.3).

## 6. Configuración (párroco)
Menú **Configuración**:

### 6.1 Datos de la parroquia
Nombre, dirección, teléfono, email, alias y **nombre del párroco que firma** (aparece en las constancias). Suba el **logo** (PNG o JPG de hasta 1 MB); se ve en la barra superior y en las constancias simples.

### 6.2 Sectores y capillas
Agregue o renombre sectores. No se puede borrar un sector que tiene personas.

### 6.3 Constancias (moldes)
Suba **un PDF por sacramento**. El sistema detecta el tipo:
- **Hoja membretada** (PDF sin campos): escriba el **texto de la constancia**; toque un dato (nombre, fecha, libro…) para insertarlo. Ajuste el **espacio libre arriba** para que el texto no tape el membrete.
- **PDF con campos rellenables:** asigne a cada campo del PDF el dato que lo llena.

Active el molde y **emita una constancia de prueba** antes de usarlo con personas reales.

### 6.4 Otros catálogos
Órdenes religiosas y rangos sacerdotales. Los sacerdotes se registran en el menú **Sacerdotes**.

### 6.5 Usuarios
Menú **Usuarios** → crear el usuario con su rol. Use una contraseña distinta para cada persona; **no comparta cuentas**, porque la auditoría registra quién hizo cada cambio.

## 7. Consultas entre parroquias
Sirve para saber si una persona recibió sacramentos en otra parroquia del sistema (por ejemplo, para preparar un matrimonio).

**Enviar (secretaria o párroco):**
1. Menú **Consultas entre parroquias** → **Nueva consulta**.
2. Elija la parroquia, escriba el **número de identidad** y el **motivo**.
3. La consulta queda **pendiente** hasta que la otra parroquia responda. Si la aprueba, verá nombre, fecha de nacimiento y, por sacramento, fecha, libro, página y registro.

**Responder (párroco):** el menú muestra un contador de consultas pendientes. Abra la consulta → **Aprobar** (se comparten solo los datos anteriores; nunca teléfonos, direcciones ni datos de padres o padrinos) o **Rechazar** con un motivo.

La consulta **no permite modificar nada** en la otra parroquia.

## 8. Auditoría (párroco)
Menú **Auditoría**: quién cambió qué, cuándo y con qué justificación.

## 9. Problemas frecuentes
| Problema | Qué hacer |
|---|---|
| "Usuario bloqueado" | Espere 15 minutos |
| El DNI ya existe | La persona ya está registrada: búsquela |
| No encuentro a la persona para el sacramento | Regístrela primero en Personas |
| La constancia sale sin membrete | Falta el molde activo de ese sacramento (§6.3) |
| La consulta no avanza | La otra parroquia aún no la atiende; llámela |
| El sistema no abre | Avise al administrador (ver [RUNBOOK_INCIDENTES.md](RUNBOOK_INCIDENTES.md)) |
