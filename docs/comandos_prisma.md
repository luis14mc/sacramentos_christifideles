# 🚀 Comandos para configurar Prisma con ChristiFideles

## 1. Instalar dependencias
```bash
npm install
npm install prisma @prisma/client
```

## 2. Configurar variables de entorno
Crear archivo `.env` en la raíz del proyecto:
```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:password@localhost:5432/christifideles"

# Para producción (Neon)
# DATABASE_URL="postgresql://usuario:password@ep-host.neon.tech/neondb"
```

## 3. Generar cliente Prisma
```bash
npx prisma generate
```

## 4. Sincronizar esquema con la base de datos
```bash
# Para desarrollo (crea/actualiza tablas)
npx prisma db push

# O usar migraciones (recomendado para producción)
npx prisma migrate dev --name init
```

## 5. Verificar conexión
```bash
# Abrir Prisma Studio para ver los datos
npx prisma studio
```

## 6. Opcional: Sembrar datos de prueba
```bash
# Si tienes un archivo seed
npx prisma db seed
```

---
**¡Tu base de datos ChristiFideles estará lista para usar!** 🎉
