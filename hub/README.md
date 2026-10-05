# Centralizador (hub) — ChristiFideles

Servicio central que conecta las instancias parroquiales para las **consultas
entre parroquias** (solo lectura, con aprobación manual). Tiene su propia BD y
**nunca guarda datos sacramentales**: solo el registro de parroquias y la traza
de consultas (DNI como hash SHA-256).

## Ramas
| Rama | Qué se despliega |
|------|------------------|
| `hub` | Este centralizador (servicio Railway del hub) |
| `master` | El software de cada parroquia (un servicio Railway por parroquia) |

El contrato y la firma de interoperabilidad (`src/lib/interop/firma.ts` y
`contrato.ts`) los usan **ambos lados**. Si cambian en `master`, hay que llevarlos
a `hub`:

```bash
git checkout hub && git merge master
```

Trabajo nuevo del centralizador: ramas `feature/hub-*` que salen de `hub` y se
mergean a `hub` (nunca a `master`).

## Despliegue en Railway
- Source → Branch: `hub`
- Config file: `hub/railway.toml` · Root Directory: vacío
- Variables: `DATABASE_URL`, `HUB_CLAVE_MAESTRA` (`openssl rand -base64 32`, guardarla)

## Administración (shell del servicio)
```bash
cd hub && pnpm instancia registrar <codigo> "<nombre>" https://<dominio>   # imprime INTEROP_SECRET una vez
cd hub && pnpm instancia listar | rotar <codigo> | desactivar <codigo> | activar <codigo>
```

## Desarrollo y tests
```bash
cd hub && pnpm install
HUB_TEST_DATABASE_URL=postgresql://postgres:test@localhost:55432/christifideles_hub_test pnpm test
```
