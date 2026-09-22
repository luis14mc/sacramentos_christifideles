# Needs validation

## cf.deploy.missing-security-headers

Cabeceras de endurecimiento no definidas en `next.config.ts`. Validar en staging/producción si Vercel aplica HSTS, CSP o X-Frame-Options por defecto.

## cf.auth.login-rate-limit

No hay rate limiting en `authorize` de NextAuth. Validar si existe protección a nivel WAF/Vercel en el entorno desplegado.
