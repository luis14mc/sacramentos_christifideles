# 🚀 Instrucciones para Nuevo Workspace - ChristiFideles

## 📁 **Abrir el Proyecto en VS Code**

### Opción 1: Desde Terminal/PowerShell
```bash
code "C:\Desarrollo\sacramentos_christifideles"
```

### Opción 2: Desde VS Code
1. **Ctrl + Shift + P** → "File: Open Folder"
2. Navegar a: `C:\Desarrollo\sacramentos_christifideles`
3. Seleccionar la carpeta y abrir

## 💬 **Abrir Nuevo Chat de GitHub Copilot**

### Una vez en el nuevo workspace:

1. **Abrir Chat de Copilot:**
   - **Método 1**: Presionar `Ctrl + Alt + I`
   - **Método 2**: Click en el ícono de chat en la barra lateral
   - **Método 3**: `Ctrl + Shift + P` → "GitHub Copilot: Open Chat"

2. **Comenzar conversación con contexto del proyecto:**
   ```
   Hola! Estoy trabajando en ChristiFideles, un sistema de registro de sacramentos para parroquias. El proyecto ya tiene:
   
   - Next.js 15 + TypeScript configurado
   - Schema de base de datos con Prisma para sacramentos
   - Módulo de configuración inicial completo
   - Sistema multi-tenant para múltiples parroquias
   
   Necesito ayuda para continuar desarrollando las funcionalidades principales del sistema.
   ```

## 🎯 **Contexto del Proyecto para el Chat**

### Información clave para proporcionar al nuevo chat:

```
**Proyecto**: ChristiFideles - Sistema de Registro de Sacramentos
**Objetivo**: Sistema para parroquias católicas, escalable y multi-tenant
**Tecnologías**: Next.js 15, TypeScript, Prisma, PostgreSQL, Tailwind CSS

**Estado Actual**:
- ✅ Configuración inicial completa
- ✅ Base de datos diseñada
- ✅ Wizard de setup implementado
- ✅ Estructura del proyecto lista

**Próximo a desarrollar**:
- Dashboard principal
- CRUD de personas
- Registro de sacramentos
- Generación de certificados
- Sistema de reportes
```

## 📋 **Comandos Principales para el Nuevo Workspace**

### Instalación y Setup:
```bash
# Instalar dependencias
npm install

# Configurar Prisma
npx prisma generate
npx prisma db push

# Ejecutar en desarrollo
npm run dev

# Abrir Prisma Studio
npx prisma studio
```

### Variables de Entorno (.env.local):
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/christifideles"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="clave-secreta-muy-larga"
```

## 🔥 **Prompt Inicial Recomendado para el Nuevo Chat**

```
Hola! Soy el desarrollador de ChristiFideles, un sistema de registro de sacramentos para parroquias católicas.

CONTEXTO DEL PROYECTO:
- Sistema multi-tenant para múltiples parroquias
- Stack: Next.js 15, TypeScript, Prisma, PostgreSQL, Tailwind
- Ya tenemos: configuración inicial, schema DB, wizard de setup
- Parroquia piloto: Cristo Resucitado

ESTRUCTURA ACTUAL:
```
src/
├── app/
│   ├── configuracion/inicial/    # ✅ Wizard completo
│   ├── api/configuracion/        # ✅ Backend setup
│   └── layout.tsx               # ✅ Layout básico
├── lib/
│   ├── config/                  # ✅ Configuración
│   └── services/                # ✅ Servicios
└── prisma/schema.prisma         # ✅ DB completa
```

NECESITO DESARROLLAR:
1. Dashboard principal con estadísticas
2. Módulo de gestión de personas
3. Registro de sacramentos por tipo
4. Generación de certificados PDF
5. Sistema de búsqueda avanzada
6. Reportes estadísticos

¿Por dónde empezamos? Sugiere el orden de desarrollo más lógico.
```

## 📚 **Archivos Clave para Revisar**

1. **Schema de DB**: `prisma/schema.prisma`
2. **Configuración**: `src/lib/config/parroquia-setup.ts`
3. **Servicios**: `src/lib/services/configuracion.service.ts`
4. **API**: `src/app/api/configuracion/inicial/route.ts`
5. **Setup UI**: `src/app/configuracion/inicial/page.tsx`
6. **README**: `README.md` (documentación completa)

## 🎨 **Comandos Útiles VS Code**

- **Explorador de archivos**: `Ctrl + Shift + E`
- **Terminal integrado**: `Ctrl + `` ` ``
- **Búsqueda global**: `Ctrl + Shift + F`
- **Paleta de comandos**: `Ctrl + Shift + P`
- **Git**: `Ctrl + Shift + G`

## 💡 **Tips para el Desarrollo**

1. **Revisar primero** el README.md para entender la arquitectura completa
2. **Examinar el schema** de Prisma para entender las relaciones
3. **Probar el wizard** de configuración en `/configuracion/inicial`
4. **Usar el contexto** del sistema multi-tenant en todas las nuevas funciones
5. **Seguir la estructura** de carpetas ya establecida

---

**¡Listo para continuar el desarrollo de ChristiFideles! 🚀**

*Sistema diseñado para servir a la comunidad católica con tecnología moderna y accesible*
