> ⚠️ **Rama `hub` — centralizador.** Esta rama solo despliega el centralizador (`hub/`). Ver [`hub/README.md`](hub/README.md).
> El resto de los archivos es una copia vieja de `master` que aquí no se usa: la documentación vigente del proyecto está en la rama **`master`** (`docs/README.md`).

# 🏛️ ChristiFideles

Sistema de registro de sacramentos para parroquias católicas. Aplicación web moderna, escalable y multi-tenant construida con **Next.js 15**, **TypeScript**, **Prisma** y **PostgreSQL**.

## 🚀 Características

- ✅ **Multi-tenant**: Soporte para múltiples parroquias
- ✅ **Sacramentos completos**: Bautismo, Primera Comunión, Confirmación, Matrimonio
- ✅ **Sistema de usuarios**: Roles y permisos granulares
- ✅ **Bitácora completa**: Auditoría de todas las acciones
- ✅ **Certificados digitales**: Generación automática de constancias
- ✅ **Búsqueda avanzada**: Por persona, fecha, sacramento
- ✅ **Dashboard estadístico**: Reportes y métricas

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL
- **ORM**: Prisma
- **Estilos**: Tailwind CSS
- **Autenticación**: NextAuth.js
- **Deploy**: Vercel + Neon

## 📋 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/sacramentos-christifideles.git
cd sacramentos-christifideles
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```
Edita `.env` con tu configuración de base de datos.

### 4. Configurar base de datos
```bash
# Generar cliente Prisma
npx prisma generate

# Migrar esquema
npx prisma db push

# (Opcional) Sembrar datos de prueba
npx prisma db seed
```

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
sacramentos_christifideles/
├── docs/                    # Documentación y scripts SQL
├── prisma/                  # Schema y migraciones
├── src/
│   ├── app/                # App Router (Next.js 15)
│   ├── components/         # Componentes React
│   ├── lib/               # Utilidades y configuración
│   └── types/             # Tipos TypeScript
├── public/                # Archivos estáticos
└── BD_antecedente/        # Scripts SQL de referencia
```

## 🗄️ Base de Datos

La base de datos incluye:

- **Catálogos**: Departamentos, Municipios, Órdenes Religiosas
- **Entidades principales**: Parroquias, Personas, Sacerdotes
- **Sacramentos**: Bautismo, Primera Comunión, Confirmación, Matrimonio
- **Sistema de usuarios**: Roles, Permisos, Bitácoras
- **Configuración**: Por parroquia, flexible con JSON

## 🚀 Deploy

### Producción con Vercel + Neon
1. Conecta tu repo a Vercel
2. Configura la base de datos en Neon
3. Añade las variables de entorno en Vercel
4. Deploy automático ✨

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b mi-nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin mi-nueva-funcionalidad`
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

---

**Desarrollado con ❤️ para la comunidad católica**
