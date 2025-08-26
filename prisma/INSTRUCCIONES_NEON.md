# 🚀 Subir la Base de Datos a Neon (PostgreSQL)

## 1. Crear cuenta y proyecto en Neon
- Ve a https://neon.tech y regístrate.
- Crea un nuevo proyecto PostgreSQL.

## 2. Obtener la cadena de conexión
- En el dashboard de Neon, ve a "Connection Details".
- Copia la cadena de conexión (formato: `postgresql://usuario:password@...`)

## 3. Configurar Prisma
- Abre `.env.local` en tu proyecto.
- Pega la cadena en `DATABASE_URL`:
  ```env
  DATABASE_URL="postgresql://usuario:password@..."
  ```

## 4. Subir el esquema a Neon
- Instala dependencias:
  ```bash
  npm install
  ```
- Genera el cliente Prisma:
  ```bash
  npx prisma generate
  ```
- Sube el esquema:
  ```bash
  npx prisma db push
  ```

## 5. Verifica en Neon
- En Neon, revisa las tablas creadas en el dashboard o usando Prisma Studio:
  ```bash
  npx prisma studio
  ```

---
¡Listo! Tu base de datos está en Neon y lista para usar con ChristiFideles.
