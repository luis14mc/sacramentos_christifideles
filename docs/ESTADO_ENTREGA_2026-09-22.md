# Estado de entrega — 2026-09-22

## Dónde está el trabajo en GitHub

- **Repositorio**: `luis14mc/sacramentos_christifideles`
- **Rama subida (última)**: `fix/security-hardening`
- **PR (abrir/ver)**: https://github.com/luis14mc/sacramentos_christifideles/compare/master...fix/security-hardening?expand=1
- **Base del PR**: `master` (`7b17d35`)
- **Último commit subido**: `d320771`

> Todo el trabajo de esta sesión vive en la rama `fix/security-hardening`.
> `master` NO fue modificado directamente. El merge se hace desde el PR.

## Commits de la rama (de más reciente a más antiguo)

| Commit | Descripción |
|--------|-------------|
| `d320771` | docs(plan): aclarar alcance — expediente y moldes en v1, notificaciones inter-parroquiales en v1.1 |
| `7fc2a62` | docs(plan): plan de acción v1 y evaluación de avance post-auditoría |
| `058dfc4` | security(hardening): remediar hallazgos de auditoría y endurecer app |
| `6352929` | chore(skills): agregar agent skills, lock y reporte de auditoría de seguridad |

## Contenido principal subido

- **Hardening de seguridad** (remedia 7/8 hallazgos de la auditoría): authz de catálogos,
  JWT revalidado + revocación, scope multi-tenant compuesto, middleware ampliado,
  constancias con permiso correcto, cabeceras de seguridad, permisos por defecto mínimos.
- **Migración baseline Prisma** + CI con `migrate deploy`.
- **Tests nuevos**: permisos/alias y autorización de catálogos.
- **App**: `error.tsx` / `loading.tsx` / `not-found.tsx`.
- **Limpieza**: eliminados `*-new.tsx` y docs de reportes obsoletos.
- **Skills**: `.agents/skills/`, `skills-lock.json`.
- **Documentación**:
  - `docs/security-audit/run-2026-09-22/` — informe de auditoría (skill Cloudflare).
  - `docs/PLAN_ACCION_V1.md` — plan de acción + evaluación de avance + alcance aclarado.
  - `docs/ESTADO_ENTREGA_2026-09-22.md` — este documento.

## Verificación

- `npm run lint` ✅ (solo warnings preexistentes)
- `npm run build` ✅
- Tests nuevos ejecutados localmente: 8/8 y 6/6 ✅ (resto de la suite corre en CI con Postgres)

## Próximo paso

1. Abrir/mergear el PR `fix/security-hardening` tras CI verde.
2. Continuar con el plan: expediente por persona (v1) → moldes de constancia subibles (v1).
