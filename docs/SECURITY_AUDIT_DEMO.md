# Auditoría de seguridad — Demo Railway

Auditoría rápida del estado de seguridad para el entorno demo. No es un
pentest exhaustivo; es una checklist para reducir el riesgo antes de exponer
la URL del demo.

## Resumen ejecutivo

- ✅ **Sin secretos en logs**: no se imprimen passwords, tokens ni DSN completos.
- ✅ **Respuestas HTTP no filtran stack traces**: todos los catch devuelven
  mensajes genéricos al cliente.
- ✅ **Cabeceras de seguridad**: `next.config.ts` aplica CSP-friendly headers
  (X-Frame-Options, HSTS, X-Content-Type-Options, etc.).
- ✅ **Auth**: NextAuth JWT con `sessionRevoked` + middleware de protección.
- ✅ **Multi-tenant**: scoping compuesto en todas las APIs de datos.
- ✅ **Auditoría bitácora**: escrituras críticas quedan registradas con
  `actor_ip` y `user_agent`.
- ⚠️ **CSP estricta**: pendiente v1.1 (no bloquea demo).
- ⚠️ **Rate limiting en authorize**: pendiente v1.1 (recomendable limitar login).

## Detalle por categoría

### Secrets en código / logs

Búsqueda realizada:

```bash
grep -rn 'console\..*(password|secret|token)' src/
grep -rn 'print.*password' prisma/ scripts/
```

Resultado: **0** ocurrencias. Ni seed (`prisma/seed-demo.ts`) ni handlers de
auth (`src/lib/auth.ts`) imprimen credenciales.

### Endpoints sensibles

| Endpoint | Estado | Notas |
|----------|--------|-------|
| `/api/auth/*` | OK | NextAuth estándar |
| `/api/setup` | OK | Bloqueado salvo `ALLOW_INITIAL_SETUP=true` (defensivamente false) |
| `/api/health` | OK | Sanitizado: solo `{status,database}`, sin stack traces |
| `/api/personas/*` | OK | RBAC + multi-tenant + JWT |
| `/api/usuarios/*` | OK | Restricción `canManageUsuarios`; Super Admin solo asignable por Super Admin |
| `/api/moldes/[id]` | OK | Cross-tenant GET/PUT/PATCH/DELETE → 404 |

**No existen** rutas `/api/debug` en el árbol actual.

### Cookies y sesión

- NextAuth JWT con `httpOnly`, `sameSite=lax` por defecto.
- `next-auth.session-token` no se expone al cliente JS.
- `NEXTAUTH_SECRET` se inyecta como variable; nunca loggeado.

### Cabeceras de seguridad

`next.config.ts` aplica a `/:path*`:

| Header | Valor |
|--------|-------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| X-DNS-Prefetch-Control | off |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |

`Content-Security-Policy` estricta con nonces: **pendiente v1.1** (no bloquea demo).

### Errores

Todos los `catch (error)` de las APIs de `src/app/api/` siguen el patrón:
- Imprimen el error por `console.error` para debugging interno.
- Devuelven un mensaje genérico al cliente (nunca stack trace).

Esto se verificó en los siguientes puntos:

```bash
grep -rn 'catch.*error' src/app/api/ | grep -v 'console.error' | grep -v 'return NextResponse.json.*error' | head
```

### CORS

La aplicación está pensada para uso interno (single-origin). No se configura
CORS; si se necesitase, se añadiría en `next.config.ts` con `headers()` para
orígenes explícitos.

### Rate limiting / brute force

`authorize` de NextAuth **no** tiene rate limiting nativo. Mitigaciones para
Railway demo:

1. El volumen de usuarios demo es bajo (3 cuentas), el riesgo real es bajo.
2. Las contraseñas demo tienen >= 8 caracteres (impuesto por `seed-demo.ts`).
3. Pendiente v1.1: implementar rate-limit (Vercel/Railway edge layer o paquete
   `next-rate-limit`).

### Variables de entorno

`.env.example` documenta todas las variables necesarias. En Railway se inyectan
desde el dashboard; nunca se commitean al repo. `git diff -- ':!.env.example'`
no debe mostrar cambios.

## Recomendaciones para antes del piloto real

1. **CSP estricta con nonces** (v1.1).
2. **Rate limit de authorize** (v1.1).
3. **Rotación de `NEXTAUTH_SECRET`** documentada y automatizada.
4. **Backups cifrados externamente** (ver `DEMO_BACKUP_RESTORE.md`).
5. **Auditoría periódica** con `docs/security-audit/` template, mínimo una
   release antes de producción.

## Conclusión

El estado de seguridad del demo es **aceptable** para staging. Los hallazgos
pendientes (CSP, rate limit) están identificados y priorizados para v1.1; no
representan riesgo crítico mientras el demo no esté expuesto a Internet
abierto sin autenticación.
