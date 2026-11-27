# Rama `testing`

Rama exclusiva para pruebas con volumen de datos. **Nunca se mezcla en `master` ni en `release/*`**: contiene el seed de testing y su workflow, que no deben llegar a las parroquias.

## Flujo

1. `testing` sale de la rama que se quiere probar (hoy: `feature/constancias-formato-curia`, PR #50).
2. Los errores encontrados se corrigen en una rama `fix/...` con su PR hacia `master` (o hacia la rama de la funcionalidad).
3. Para volver a probar, se trae la corrección a `testing`: `git checkout testing && git merge origin/master` (o la rama del fix).
4. Lo único exclusivo de `testing` es: `prisma/seed-testing.ts`, el script `db:seed:testing`, `.github/workflows/testing-seed.yml` y este documento.

## Entorno en Railway

- Servicio propio (por ejemplo `christifideles-testing`) conectado a la rama `testing`, con **su propio Postgres**.
- Revisar que `DATABASE_URL` apunte a ese Postgres y no al de una parroquia.
- Cargar los datos una vez, desde la consola del servicio o en local con la URL pública de esa base:

```bash
export ALLOW_TESTING_SEED=true
export TESTING_PASSWORD='…'        # 8+ caracteres; es la clave de todos los usuarios de prueba
pnpm prisma migrate deploy
pnpm db:seed                        # catálogos, parroquia y admin base
pnpm db:seed:testing                # datos de volumen
unset ALLOW_TESTING_SEED TESTING_PASSWORD
```

El seed se niega a correr si la parroquia ya tiene más de 10 sacramentos y no está marcada como testing, o si `DATABASE_URL` contiene `prod`.

## Qué carga

| Módulo | Registros | Casos límite incluidos |
|---|---|---|
| Sectores | 100 (prefijo `QA`) | 4 tipos; un tercio con capilla |
| Personas | ~720 | nombres largos y con tildes, fallecidos, nacidos el 29 de febrero y el 1 de enero, municipios de todo el país |
| Clero | 100 | 10 obispos, 76 sacerdotes, 14 diáconos; 3 sacerdotes inactivos; párroco marcado |
| Usuarios | 100 | todos los roles; 10 % inactivos |
| Bautismos | 160 | 10 % solo con madre; con solo padrino o solo madrina; notas marginales |
| Primeras comuniones | 130 | |
| Confirmaciones | 115 | ministro obispo |
| Matrimonios | 120 | contrayentes = padres de los bautizados |

Además configura **párroco y vicario** en Datos de la parroquia y deja los numeradores en el último número cargado. Los datos son ficticios y deterministas (misma semilla, mismos datos).

### Usuarios (clave: `TESTING_PASSWORD`)

| Correo | Rol |
|---|---|
| `testing-admin@christifideles.test` | Super Admin |
| `testing-parroco@christifideles.test` | Párroco |
| `testing-secretaria@christifideles.test` | Secretaria |
| `testing-catequista@christifideles.test` | Catequista |
| `testing-lectura@christifideles.test` | Solo Lectura |
| `usuario001…095@christifideles.test` | roles variados |

## Validación automática

Cada push a `testing` corre `.github/workflows/testing-seed.yml`: carga el seed dos veces (debe ser idempotente), verifica los conteos y comprueba que el seed se niega sin `ALLOW_TESTING_SEED`.

## Lista de pruebas manuales

**Certificaciones (PR #50)**
- [ ] Emitir una certificación de cada sacramento y revisar el texto contra los moldes de `docs/moldes-constancias/`.
- [ ] Un bautismo con solo madre y otro con un solo padrino: la frase no debe quedar rota.
- [ ] Una persona con nombre largo: la certificación cabe en una hoja.
- [ ] Una partida con nota marginal: aparece en Observaciones.
- [ ] Elegir "Firma el vicario" y confirmar el cargo en la firma.
- [ ] Borrar el párroco y el vicario en Configuración: el botón se desactiva con el aviso.
- [ ] **Imprimir en papel de la Curia** sobre una hoja real: medir que el texto quede debajo del membrete (escala 100 %, carta).
- [ ] Revisar la bitácora: firmante y tipo de papel registrados.

**Volumen y permisos**
- [ ] Búsquedas por nombre, DNI, libro y registro con cientos de resultados; paginación.
- [ ] Libros: recorrer libros 101–104 de cada sacramento.
- [ ] Dashboard con los totales cargados.
- [ ] Entrar con cada rol de prueba y verificar qué puede ver, crear, editar y borrar.
- [ ] Un usuario inactivo no puede entrar.
- [ ] Registrar un sacramento con un sacerdote inactivo: debe rechazarse.
- [ ] Expediente de una persona con los cuatro sacramentos.
- [ ] Usar el teléfono (pantallas responsive) con listas largas.
