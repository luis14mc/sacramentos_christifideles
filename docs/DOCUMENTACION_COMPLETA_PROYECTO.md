# 📋 DOCUMENTACIÓN COMPLETA DEL PROYECTO
## CHRISTI FIDELES - Sistema de Gestión Parroquial

---

### 📋 INFORMACIÓN GENERAL

**Nombre del Proyecto:** Christi Fideles  
**Tipo:** Sistema de Gestión Parroquial Multi-Tenant  
**Versión:** 1.0.0  
**Fecha de Creación:** 2025  
**Desarrollador:** Luis Miguel Cardona  
**Estado:** En Desarrollo  

---

## 📖 ÍNDICE

1. [Descripción del Proyecto](#1-descripción-del-proyecto)
2. [Objetivos y Alcance](#2-objetivos-y-alcance)
3. [Arquitectura Técnica](#3-arquitectura-técnica)
4. [Stack Tecnológico](#4-stack-tecnológico)
5. [Base de Datos](#5-base-de-datos)
6. [Módulos del Sistema](#6-módulos-del-sistema)
7. [Arquitectura Multi-Tenant](#7-arquitectura-multi-tenant)
8. [Interfaz de Usuario](#8-interfaz-de-usuario)
9. [Seguridad](#9-seguridad)
10. [Estructura del Proyecto](#10-estructura-del-proyecto)
11. [Instalación y Configuración](#11-instalación-y-configuración)
12. [Manual de Usuario](#12-manual-de-usuario)
13. [Parroquias Piloto](#13-parroquias-piloto)
14. [Plan de Implementación](#14-plan-de-implementación)
15. [Roadmap y Futuras Funcionalidades](#15-roadmap-y-futuras-funcionalidades)

---

## 1. DESCRIPCIÓN DEL PROYECTO

### 🎯 ¿Qué es Christi Fideles?

Christi Fideles es un **sistema integral de gestión parroquial** diseñado específicamente para iglesias católicas. El sistema permite administrar todos los aspectos de la vida parroquial de manera digital, desde el registro de sacramentos hasta la gestión de miembros de la comunidad.

### 🌟 Características Principales

- **📊 Gestión de Sacramentos**: Bautismos, Confirmaciones, Matrimonios, Primera Comunión
- **👥 Administración de Personas**: Registro completo de feligreses y sus familias
- **🗺️ Sectores Parroquiales**: Organización territorial de la parroquia
- **⚙️ Configuración Personalizable**: Adaptable a las necesidades de cada parroquia
- **🏛️ Multi-Tenant**: Una instancia sirve múltiples parroquias
- **🔗 Conectividad Federada**: Comunicación entre parroquias autorizadas
- **📄 Constancias Digitales**: Generación automática de documentos oficiales
- **👥 Sistema de Usuarios**: Control de acceso basado en roles

### 🎨 Filosofía de Diseño

El sistema está diseñado bajo los principios de:
- **Simplicidad**: Interfaz intuitiva para usuarios no técnicos
- **Escalabilidad**: Capaz de crecer con las necesidades de la diócesis
- **Seguridad**: Protección rigurosa de datos personales y sacramentales
- **Flexibilidad**: Adaptable a diferentes tradiciones y necesidades parroquiales
- **Conectividad**: Facilita la colaboración entre parroquias manteniendo autonomía

---

## 2. OBJETIVOS Y ALCANCE

### 🎯 Objetivos Principales

#### Objetivos Inmediatos
1. **Digitalizar los registros sacramentales** de las parroquias piloto
2. **Centralizar la información** de personas y familias
3. **Automatizar la generación** de constancias y documentos
4. **Facilitar la búsqueda** y consulta de registros históricos
5. **Establecer un sistema de permisos** robusto y seguro

#### Objetivos a Mediano Plazo
1. **Implementar conectividad** entre parroquias de la misma diócesis
2. **Desarrollar reportes estadísticos** para la administración diocesana
3. **Integrar módulos adicionales** (economía, pastoral, eventos)
4. **Expandir a más parroquias** de la Arquidiócesis de Tegucigalpa
5. **Establecer protocolos de backup** y recuperación de datos

#### Objetivos a Largo Plazo
1. **Crear una red federada** de parroquias a nivel nacional
2. **Desarrollar una app móvil** para feligreses
3. **Implementar inteligencia artificial** para análisis pastoral
4. **Establecer estándares nacionales** para registros parroquiales digitales
5. **Expandir internacionalmente** a otros países

### 🎯 Alcance del Proyecto

#### Incluye:
- ✅ Gestión completa de 4 sacramentos principales
- ✅ Administración de personas y familias
- ✅ Sistema de usuarios con roles y permisos
- ✅ Configuración personalizable por parroquia
- ✅ Generación de constancias oficiales
- ✅ Organización por sectores parroquiales
- ✅ Sistema multi-tenant con aislamiento de datos
- ✅ Conectividad básica entre parroquias

#### No Incluye (Futuras Versiones):
- ❌ Gestión financiera avanzada
- ❌ Módulo de pastoral específica
- ❌ Sistema de donaciones en línea
- ❌ Aplicación móvil
- ❌ Integración con sistemas bancarios
- ❌ Transmisión en vivo de misas

---

## 3. ARQUITECTURA TÉCNICA

### 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTACIÓN                          │
│     Next.js 15 + React 18 + TypeScript + Tailwind      │
│                  + DaisyUI                              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   AUTENTICACIÓN                         │
│              NextAuth.js + JWT Tokens                   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  LÓGICA DE NEGOCIO                      │
│             API Routes + Server Actions                 │
│                 (Multi-tenant aware)                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  ACCESO A DATOS                         │
│            Prisma ORM + PostgreSQL Client               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                        │
│              PostgreSQL (Neon Serverless)               │
└─────────────────────────────────────────────────────────┘
```

### 🔄 Flujo de Datos Multi-Tenant

```
[Usuario] → [Login] → [Identificar Parroquia] → [Middleware] → [API] → [Prisma + Filtros] → [PostgreSQL]
                              ↓
                    [Session con id_parroquia]
                              ↓
                    [Todas las consultas filtradas automáticamente]
```

### 🌐 Arquitectura de Conectividad Federada

```
┌─────────────────┐    API Calls    ┌─────────────────┐
│   Parroquia A   │ ←────────────→  │   Parroquia B   │
│  (BD Propia)    │   Autorizadas   │  (BD Propia)    │
└─────────────────┘                 └─────────────────┘
        ↓                                   ↓
┌─────────────────┐                 ┌─────────────────┐
│  Neon Database  │                 │  Neon Database  │
│   Tegucigalpa   │                 │   Tegucigalpa   │
└─────────────────┘                 └─────────────────┘
```

---

## 4. STACK TECNOLÓGICO

### 🎨 Frontend
- **Next.js 15**: Framework React con App Router
- **React 18**: Biblioteca de interfaz de usuario
- **TypeScript**: Tipado estático para JavaScript
- **Tailwind CSS**: Framework de estilos utility-first
- **DaisyUI**: Componentes pre-construidos para Tailwind
- **Heroicons**: Iconografía consistente
- **SweetAlert2**: Alertas y modales elegantes

**Fuentes Utilizadas:**
- **Geist Sans**: Fuente principal del sistema (--font-geist-sans)
- **Geist Mono**: Fuente monoespaciada para código (--font-geist-mono)

### ⚙️ Backend
- **Next.js API Routes**: Endpoints RESTful
- **NextAuth.js**: Sistema de autenticación
- **Prisma ORM**: Object-Relational Mapping
- **bcryptjs**: Encriptación de contraseñas
- **jsonwebtoken**: Manejo de tokens JWT

### 🗄️ Base de Datos
- **PostgreSQL 15+**: Base de datos principal
- **Neon**: Hosting serverless de PostgreSQL
- **Prisma Client**: Cliente de base de datos tipo-seguro
- **Row Level Security**: Seguridad a nivel de fila

### 🛠️ Herramientas de Desarrollo
- **ESLint**: Linting de código
- **Prettier**: Formateo de código
- **TypeScript**: Verificación de tipos
- **Prisma Studio**: Interfaz visual para BD
- **Git**: Control de versiones

### 🎨 Diseño y UX
- **Responsive Design**: Adaptable a todos los dispositivos
- **Dark/Light Mode**: Modo oscuro/claro
- **Accesibilidad**: Cumple estándares WCAG 2.1
- **PWA Ready**: Preparado para Progressive Web App

---

## 5. BASE DE DATOS

### 📊 Esquema Principal

#### Tablas Core del Sistema:

**1. Ubicación Geográfica**
```sql
departamento (codigo_departamento, nombre_departamento)
municipio (codigo_municipio, codigo_departamento, nombre_municipio)
```

**2. Multi-Tenancy**
```sql
parroquia (
    id_parroquia,           -- Tenant ID principal
    nombre,                 -- "Cristo Resucitado"
    codigo_parroquia,       -- "CR-LOARQUE-001"
    diocesis,               -- "Arquidiócesis de Tegucigalpa"
    permite_consultas_externas,
    parroquias_autorizadas,
    endpoint_notificaciones
)

parroquia_config (
    id_parroquia,           -- FK a parroquia
    alias_liturgico,        -- Para constancias
    logo_parroquial_url,    -- Logo específico
    horarios_misas,         -- JSON con horarios
    numeracion_config,      -- Formato de numeración
    -- ... más configuraciones
)
```

**3. Gestión de Usuarios**
```sql
rol_usuario (id_rol, nombre, descripcion, nivel_acceso)
pagina (id_pagina, nombre, url, categoria)
tr_rol_pagina (id_rol, id_pagina, puede_ver, puede_crear, ...)
usuario (
    id_usuario,
    id_parroquia,           -- Tenant discriminator
    id_rol,
    nombre, email, contrasena
)
```

**4. Personas y Sectores**
```sql
sector_parroquial (
    id_sector_parroquial,
    id_parroquia,           -- Tenant discriminator
    nombre, direccion, tipo
)

persona (
    numero_identidad,
    id_parroquia,           -- Tenant discriminator
    nombres, apellidos,
    id_sector_parroquial,
    -- ... datos personales
    PRIMARY KEY (id_parroquia, numero_identidad)
)
```

**5. Órdenes Religiosas y Sacerdotes**
```sql
orden_religiosa (id_orden_religiosa, nombre, abreviatura, rama)

orden_sacerdotal (
    numero_identidad,
    id_parroquia,           -- Tenant discriminator
    id_rango_sacerdotal,
    es_parroco,
    -- ... datos sacerdotales
    FOREIGN KEY (id_parroquia, numero_identidad) 
        REFERENCES persona(id_parroquia, numero_identidad)
)
```

**6. Sacramentos**
```sql
bautismo (
    id_bautismo,
    id_parroquia,           -- Tenant discriminator
    numero_identidad_bautizado,
    numero_identidad_padre,
    numero_identidad_madre,
    numero_identidad_padrino,
    numero_identidad_madrina,
    numero_identidad_sacerdote,
    fecha_bautismo,
    numero_libro, numero_folio, numero_registro
)

-- Similar para: confirmacion, matrimonio, primera_comunion
```

### 🔒 Estrategias de Aislamiento Multi-Tenant

1. **Discriminador de Tenant**: Todas las tablas incluyen `id_parroquia`
2. **Claves Compuestas**: `(id_parroquia, id_natural)` cuando aplica
3. **Filtros Automáticos**: Middleware que agrega `WHERE id_parroquia = X`
4. **Row Level Security**: Políticas a nivel de PostgreSQL
5. **Validación en Aplicación**: Doble verificación en APIs

---

## 6. MÓDULOS DEL SISTEMA

### 👥 Módulo de Personas
**Funcionalidades:**
- Registro completo de personas con datos civiles y religiosos
- Gestión de familias y relaciones familiares
- Asignación a sectores parroquiales
- Historial de participación en sacramentos
- Búsqueda avanzada por múltiples criterios
- Importación/exportación de datos

**Archivos Principales:**
- `src/app/personas/page.tsx` - Lista principal
- `src/components/modals/PersonaModal*.tsx` - Modales de gestión
- `src/app/api/personas/route.ts` - API REST

### ⛪ Módulo de Sacramentos
**Funcionalidades:**
- Registro de Bautismos con padrinos y testigos
- Registro de Confirmaciones con padrinos
- Registro de Matrimonios con testigos y padres
- Registro de Primeras Comuniones
- Generación automática de constancias
- Búsqueda por rango de fechas
- Estadísticas sacramentales

**Estructura por Sacramento:**
```
src/app/sacramentos/
├── bautismos/
├── confirmaciones/
├── matrimonios/
└── primera-comunion/
```

### ⚙️ Módulo de Configuración
**Funcionalidades:**
- Configuración general de la parroquia
- Gestión de sectores parroquiales
- Configuración de permisos y roles
- Configuración de sacerdotes
- Configuración de grupos parroquiales
- Personalización de constancias

**Submódulos:**
1. **General**: Datos básicos, horarios, configuración litúrgica
2. **Sectores**: Gestión de divisiones territoriales
3. **Permisos**: Matriz de permisos por rol
4. **Sacerdotes**: Registro del clero
5. **Grupos**: Ministerios y movimientos
6. **Usuarios**: Gestión de accesos al sistema

### 👤 Módulo de Usuarios
**Funcionalidades:**
- Creación y gestión de usuarios del sistema
- Asignación de roles y permisos
- Control de acceso por módulos
- Historial de actividad
- Configuración de preferencias personales

### 📊 Módulo de Dashboard
**Funcionalidades:**
- Estadísticas en tiempo real de la parroquia
- Resumen de actividad reciente
- Gráficos de sacramentos por período
- Indicadores de crecimiento parroquial
- Accesos rápidos a funciones principales

---

## 7. ARQUITECTURA MULTI-TENANT

### 🏗️ Concepto y Implementación

#### ¿Qué es Multi-Tenancy en Christi Fideles?
El sistema multi-tenant permite que **una sola instancia** del software sirva a **múltiples parroquias** (tenants), manteniendo sus datos completamente aislados y seguros.

#### Beneficios:
- **Economía de Escala**: Mantenimiento centralizado
- **Actualizaciones Automáticas**: Todas las parroquias reciben mejoras
- **Seguridad**: Aislamiento total de datos
- **Escalabilidad**: Fácil agregar nuevas parroquias
- **Conectividad Controlada**: Comunicación autorizada entre parroquias

### 🔒 Implementación del Aislamiento

#### 1. **Nivel de Base de Datos**
```sql
-- Cada tabla tiene un discriminador de tenant
CREATE TABLE persona (
    numero_identidad VARCHAR(20) NOT NULL,
    id_parroquia SMALLINT NOT NULL,  -- ← TENANT DISCRIMINATOR
    nombres VARCHAR(55) NOT NULL,
    -- ... otros campos
    PRIMARY KEY (id_parroquia, numero_identidad)
);
```

#### 2. **Nivel de Aplicación**
```typescript
// Middleware que filtra automáticamente por parroquia
export async function middleware(request: NextRequest) {
  const session = await getToken({ req: request });
  const parroquiaId = session.parroquiaId;
  
  // Inyectar parroquia_id en headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-parroquia-id', parroquiaId.toString());
  
  return NextResponse.next({
    request: { headers: requestHeaders }
  });
}
```

#### 3. **Nivel de APIs**
```typescript
// Todas las consultas filtran automáticamente por parroquia
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const parroquiaId = session.user.parroquiaId;

  const personas = await prisma.persona.findMany({
    where: {
      id_parroquia: parroquiaId  // ← FILTRO AUTOMÁTICO
    }
  });

  return NextResponse.json(personas);
}
```

### 🌐 Conectividad Federada

#### Concepto:
Las parroquias mantienen **bases de datos independientes** pero pueden realizar **consultas autorizadas** entre ellas para casos específicos.

#### Casos de Uso:
1. **Traslado de Personas**: Cuando alguien se muda de parroquia
2. **Verificación de Sacramentos**: Consultar sacramentos previos
3. **Estadísticas Diocesanas**: Reportes consolidados
4. **Notificaciones**: Eventos importantes entre parroquias

#### Configuración:
```sql
-- Parroquia A autoriza consultas de Parroquia B
UPDATE parroquia SET
    permite_consultas_externas = true,
    parroquias_autorizadas = '["SM-CERROGRANDE-002"]'
WHERE codigo_parroquia = 'CR-LOARQUE-001';
```

---

## 8. INTERFAZ DE USUARIO

### 🎨 Diseño Visual

#### Identidad Visual:
- **Logo Principal**: Christi Fideles (siempre visible)
- **Logo Parroquial**: Específico por parroquia (áreas selectas)
- **Colores**: Tema único del sistema con acentos personalizables
- **Tipografía**: Geist Sans (principal) y Geist Mono (código)

#### Paleta de Colores:
```css
/* Tema Principal */
--color-primary: #590202;      /* Rojo vino principal */
--color-secondary: #454142;    /* Gris oscuro */
--color-accent: #590202;       /* Acento rojo */
--color-neutral: #260101;      /* Negro suave */
--color-base-100: #ffffff;     /* Fondo blanco */
```

### 📱 Responsive Design

#### Breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Large**: > 1280px

#### Componentes Adaptativos:
- **Sidebar**: Colapsa en mobile
- **Tables**: Scroll horizontal en mobile
- **Modals**: Pantalla completa en mobile
- **Forms**: Layout de columnas adaptativo

### 🧩 Componentes Principales

#### Layout:
```
┌─────────────────────────────────────────────────────────┐
│                      HEADER                             │
│  [Logo CF] | Dashboard | Personas | Config | [User]     │
├─────────────────────────────────────────────────────────┤
│ SIDEBAR  │                 CONTENT                      │
│          │                                             │
│ [Logo P] │  ┌─────────────────────────────────────┐    │
│ Menu     │  │         Main Content                │    │
│ Items    │  │                                     │    │
│          │  │                                     │    │
│          │  │                                     │    │
│          │  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### Componentes Reutilizables:
- **AuthenticatedLayout**: Layout principal con autenticación
- **Header**: Barra superior con navegación
- **Sidebar**: Menú lateral con logo parroquial
- **Modals**: Sistema de modales para CRUD
- **Tables**: Tablas con paginación y búsqueda
- **Forms**: Formularios con validación
- **Cards**: Tarjetas de información
- **Buttons**: Botones consistentes con estados

### 🔄 Estados de UI

#### Loading States:
- Spinners para operaciones lentas
- Skeleton screens para carga inicial
- Progress bars para operaciones con progreso

#### Error States:
- Mensajes de error descriptivos
- Páginas de error personalizadas
- Fallbacks para componentes rotos

#### Empty States:
- Ilustraciones para listas vacías
- Mensajes motivacionales
- Botones de acción principales

---

## 9. SEGURIDAD

### 🔐 Capas de Seguridad

#### 1. **Autenticación**
- **NextAuth.js**: Sistema robusto de autenticación
- **Bcrypt**: Encriptación de contraseñas (12 rounds)
- **JWT Tokens**: Tokens seguros con expiración
- **Session Management**: Gestión segura de sesiones

#### 2. **Autorización**
- **RBAC**: Control de acceso basado en roles
- **Permisos Granulares**: Por página y acción (CRUD)
- **Middleware**: Validación en cada request
- **API Protection**: Todos los endpoints protegidos

#### 3. **Aislamiento Multi-Tenant**
- **Tenant Discrimination**: Filtros automáticos por parroquia
- **Query Filtering**: Imposible acceder a datos de otra parroquia
- **Session Validation**: Validación de tenant en cada operación
- **Cross-Tenant Protection**: Prevención de ataques entre tenants

#### 4. **Seguridad de Datos**
- **Input Validation**: Validación estricta en frontend y backend
- **SQL Injection Protection**: Prisma ORM previene inyecciones
- **XSS Protection**: Sanitización de inputs
- **CSRF Protection**: Tokens CSRF en formularios

### 🛡️ Configuración de Roles y Permisos

#### Roles Predefinidos:
1. **Super Administrador**: Acceso completo al sistema
2. **Administrador Parroquial**: Administración completa de su parroquia
3. **Secretario Parroquial**: Gestión de registros sacramentales
4. **Párroco**: Acceso pastoral completo
5. **Asistente**: Acceso limitado para consultas

#### Matriz de Permisos:
```
┌─────────────────┬─────┬─────┬─────┬─────┬─────┐
│     Módulo      │ Ver │ Crear│ Edit│ Del │ Exp │
├─────────────────┼─────┼─────┼─────┼─────┼─────┤
│ Dashboard       │  ✓  │  -  │  -  │  -  │  ✓  │
│ Personas        │  ✓  │  ✓  │  ✓  │  ✓  │  ✓  │
│ Sacramentos     │  ✓  │  ✓  │  ✓  │  ✓  │  ✓  │
│ Configuración   │  ✓  │  ✓  │  ✓  │  ✓  │  -  │
│ Usuarios        │  ✓  │  ✓  │  ✓  │  ✓  │  -  │
└─────────────────┴─────┴─────┴─────┴─────┴─────┘
```

### 🔍 Auditoría y Monitoreo

#### Sistema de Bitácoras:
```sql
bitacora_crud (
    id_accion,
    id_parroquia,          -- Tenant
    id_usuario,            -- Quien hizo la acción
    accion,                -- C, R, U, D
    tabla_afectada,        -- Qué tabla
    datos_anteriores,      -- Estado previo (JSON)
    datos_nuevos,          -- Estado nuevo (JSON)
    ip_address,            -- IP del usuario
    user_agent,            -- Navegador
    created_at             -- Timestamp
)
```

#### Monitoreo en Tiempo Real:
- Log de todas las operaciones CRUD
- Tracking de logins fallidos
- Alertas de actividad sospechosa
- Reportes de acceso por usuario

---

## 10. ESTRUCTURA DEL PROYECTO

### 📁 Organización de Directorios

```
sacramentos_christifideles/
├── 📁 docs/                          # Documentación
│   ├── christi_fidelis_bdd_optimizada_v4.sql
│   ├── MANUAL_MULTITENANT_ARQUITECTURA.md
│   └── DOCUMENTACION_COMPLETA_PROYECTO.md
├── 📁 prisma/                        # Base de datos
│   ├── schema.prisma                 # Esquema de BD
│   ├── seed.ts                       # Datos iniciales
│   └── migrations/                   # Migraciones
├── 📁 public/                        # Archivos estáticos
│   ├── favicon.ico
│   └── assets/
│       ├── logos/
│       └── marca/
├── 📁 src/                           # Código fuente
│   ├── 📁 app/                       # Next.js App Router
│   │   ├── layout.tsx                # Layout raíz
│   │   ├── page.tsx                  # Página principal
│   │   ├── globals.css               # Estilos globales
│   │   ├── 📁 api/                   # API Routes
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── personas/
│   │   │   ├── usuarios/
│   │   │   └── configuracion/
│   │   ├── 📁 dashboard/             # Dashboard principal
│   │   ├── 📁 personas/              # Gestión de personas
│   │   ├── 📁 usuarios/              # Gestión de usuarios
│   │   ├── 📁 configuracion/         # Configuración
│   │   │   ├── general/
│   │   │   ├── sectores/
│   │   │   ├── permisos/
│   │   │   ├── sacerdotes/
│   │   │   └── grupos/
│   │   └── 📁 login/                 # Autenticación
│   ├── 📁 components/                # Componentes React
│   │   ├── 📁 auth/                  # Autenticación
│   │   ├── 📁 common/                # Componentes comunes
│   │   ├── 📁 dashboard/             # Dashboard
│   │   ├── 📁 layout/                # Layout
│   │   ├── 📁 modals/                # Modales
│   │   ├── 📁 sacramentos/           # Sacramentos
│   │   ├── 📁 ui/                    # UI básicos
│   │   └── 📁 usuarios/              # Usuarios
│   ├── 📁 contexts/                  # React Contexts
│   ├── 📁 hooks/                     # Custom Hooks
│   ├── 📁 lib/                       # Utilidades
│   │   ├── auth.ts                   # Configuración NextAuth
│   │   ├── prisma.ts                 # Cliente Prisma
│   │   └── dashboard.ts              # Lógica dashboard
│   └── 📁 types/                     # Tipos TypeScript
├── 📄 package.json                   # Dependencias
├── 📄 tsconfig.json                  # Configuración TypeScript
├── 📄 tailwind.config.ts             # Configuración Tailwind
├── 📄 next.config.ts                 # Configuración Next.js
├── 📄 eslint.config.mjs              # Configuración ESLint
└── 📄 README.md                      # Documentación básica
```

### 🎯 Convenciones de Código

#### Nomenclatura:
- **Archivos**: kebab-case (`persona-modal.tsx`)
- **Componentes**: PascalCase (`PersonaModal`)
- **Variables**: camelCase (`nombreCompleto`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Tipos**: PascalCase (`PersonaData`)

#### Estructura de Componentes:
```typescript
// Imports
import React from 'react';
import { useState, useEffect } from 'react';

// Types
interface ComponentProps {
  // ...
}

// Component
export default function Component({ prop1, prop2 }: ComponentProps) {
  // State
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // ...
  }, []);
  
  // Handlers
  const handleAction = () => {
    // ...
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

---

## 11. INSTALACIÓN Y CONFIGURACIÓN

### 🛠️ Requisitos del Sistema

#### Requisitos Mínimos:
- **Node.js**: 18.17.0 o superior
- **npm**: 9.0.0 o superior
- **PostgreSQL**: 15.0 o superior
- **Git**: Para control de versiones
- **Navegador**: Chrome 90+, Firefox 88+, Safari 14+

#### Requisitos Recomendados:
- **Node.js**: 20.0.0 LTS
- **RAM**: 8GB mínimo
- **Almacenamiento**: 10GB libres
- **Conexión**: Internet estable para Neon DB

### 📦 Instalación Paso a Paso

#### 1. **Clonar el Repositorio**
```bash
git clone https://github.com/luis14mc/sacramentos_christifideles.git
cd sacramentos_christifideles
```

#### 2. **Instalar Dependencias**
```bash
npm install
```

#### 3. **Configurar Variables de Entorno**
```bash
# Crear archivo .env.local
cp .env.example .env.local

# Editar variables:
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="tu-secret-muy-seguro"
NEXTAUTH_URL="http://localhost:3000"
```

#### 4. **Configurar Base de Datos**
```bash
# Aplicar migraciones
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate

# Sembrar datos iniciales
npx prisma db seed
```

#### 5. **Ejecutar en Desarrollo**
```bash
npm run dev
```

#### 6. **Acceder al Sistema**
- URL: `http://localhost:3000`
- Usuario: `admin@christifideles.com`
- Contraseña: `admin123`

### 🔧 Configuración de Producción

#### 1. **Variables de Entorno de Producción**
```bash
DATABASE_URL="tu-url-de-neon-production"
NEXTAUTH_SECRET="secret-super-seguro-production"
NEXTAUTH_URL="https://tu-dominio.com"
NODE_ENV="production"
```

#### 2. **Build y Deploy**
```bash
# Construir para producción
npm run build

# Iniciar en producción
npm start
```

#### 3. **Configuración de Neon DB**
- Crear cuenta en Neon.tech
- Crear base de datos PostgreSQL
- Configurar connection string
- Aplicar migraciones

---

## 12. MANUAL DE USUARIO

### 👤 Roles y Accesos

#### Para Secretarios Parroquiales:
**Accesos Principales:**
- Dashboard con estadísticas de la parroquia
- Gestión completa de personas
- Registro de todos los sacramentos
- Generación de constancias
- Consulta de registros históricos

**Flujo Típico de Trabajo:**
1. **Login** con credenciales asignadas
2. **Dashboard** para ver resumen del día
3. **Registrar persona nueva** si no existe
4. **Registrar sacramento** correspondiente
5. **Generar constancia** si se solicita
6. **Actualizar datos** según sea necesario

#### Para Párrocos:
**Accesos Adicionales:**
- Configuración general de la parroquia
- Gestión de usuarios del sistema
- Reportes estadísticos avanzados
- Configuración de permisos
- Supervisión de actividad

#### Para Administradores:
**Acceso Completo:**
- Todas las funcionalidades anteriores
- Configuración técnica del sistema
- Gestión de sectores parroquiales
- Configuración de conectividad federada
- Backup y restauración

### 📋 Guías de Uso por Módulo

#### Gestión de Personas:
1. **Nuevo Registro:**
   - Ir a "Personas" → "Agregar Nueva"
   - Completar datos obligatorios (*)
   - Asignar sector parroquial
   - Seleccionar orden religiosa
   - Guardar registro

2. **Búsqueda:**
   - Usar barra de búsqueda por nombre/apellido
   - Filtrar por sector parroquial
   - Filtrar por estado (activo/inactivo)

3. **Edición:**
   - Click en ícono de lápiz
   - Modificar campos necesarios
   - Confirmar cambios

#### Registro de Sacramentos:
1. **Bautismo:**
   - Verificar que la persona esté registrada
   - Completar datos del sacramento
   - Asignar padrinos (deben estar registrados)
   - Asignar sacerdote celebrante
   - Registrar datos del libro parroquial

2. **Matrimonio:**
   - Registrar ambos contrayentes
   - Completar expediente matrimonial
   - Asignar testigos y padrinos
   - Registrar lugar y fecha de celebración

3. **Confirmación:**
   - Verificar bautismo previo
   - Asignar padrino/madrina
   - Registrar obispo confirmante
   - Completar datos sacramentales

#### Generación de Constancias:
1. Buscar el registro sacramental
2. Click en "Generar Constancia"
3. Seleccionar tipo de constancia
4. Revisar datos automáticos
5. Generar PDF final
6. Imprimir o enviar digitalmente

---

## 13. PARROQUIAS PILOTO

### ⛪ Cristo Resucitado (Principal)

#### Información General:
- **Nombre Completo**: Parroquia Cristo Resucitado
- **Ubicación**: Colonia Loarque, Tegucigalpa, Francisco Morazán
- **Código del Sistema**: `CR-LOARQUE-001`
- **Diócesis**: Arquidiócesis de Tegucigalpa
- **Zona Pastoral**: Zona Centro
- **Teléfono**: +504 2222-3333
- **Email**: cristo.resucitado@arquitegucigalpa.hn

#### Configuración Litúrgica:
- **Patrono Principal**: Cristo Resucitado
- **Fecha Patronal**: Domingo de Resurrección (variable)
- **Lema Parroquial**: "Cristo vive, Cristo reina, Cristo impera"

#### Horarios de Servicios:
```
Misas Dominicales:   07:00, 09:00, 11:00, 18:00
Misas Entre Semana:  06:30, 18:00 (Lunes a Viernes)
Misa Sábado:         18:00
Confesiones:         Sábado 16:00-17:30, Domingo 08:00-08:45
Atención Oficina:    L-V 08:00-12:00, 14:00-17:00
                     Sábado 08:00-12:00
```

#### Sectores Parroquiales:
1. **Sector Central Loarque** (CR-SECTOR-01)
2. **Sector Norte Loarque** (CR-SECTOR-02)
3. **Sector Sur Loarque** (CR-SECTOR-03)
4. **Capilla San José Obrero** (CR-CAPILLA-01)

### ⛪ Salvador del Mundo (Secundaria)

#### Información General:
- **Nombre Completo**: Parroquia Salvador del Mundo
- **Ubicación**: Colonia Cerro Grande, Tegucigalpa, Francisco Morazán
- **Código del Sistema**: `SM-CERROGRANDE-002`
- **Diócesis**: Arquidiócesis de Tegucigalpa
- **Zona Pastoral**: Zona Centro
- **Teléfono**: +504 2222-4444
- **Email**: salvador.mundo@arquitegucigalpa.hn

#### Configuración Litúrgica:
- **Patrono Principal**: Salvador del Mundo
- **Fecha Patronal**: 6 de agosto (Transfiguración del Señor)
- **Lema Parroquial**: "Jesús, Salvador del Mundo, en ti confiamos"

#### Horarios de Servicios:
```
Misas Dominicales:   07:30, 09:30, 17:00, 19:00
Misas Entre Semana:  06:00, 17:30 (Lunes a Viernes)
Misa Sábado:         17:30
Confesiones:         Sábado 15:30-17:00, Domingo 08:30-09:15
Atención Oficina:    L-V 08:00-12:00, 14:00-17:00
                     Sábado 08:00-11:00
```

#### Sectores Parroquiales:
1. **Sector Central Cerro Grande** (SM-SECTOR-01)
2. **Sector Este Cerro Grande** (SM-SECTOR-02)
3. **Sector Oeste Cerro Grande** (SM-SECTOR-03)
4. **Capilla Inmaculado Corazón** (SM-CAPILLA-01)

### 🔗 Conectividad Entre Parroquias

#### Configuración de Federación:
- Ambas parroquias se autorizan mutuamente para consultas específicas
- Protocolo seguro para transferencia de personas
- Verificación de sacramentos entre parroquias
- Estadísticas consolidadas para la arquidiócesis

#### Casos de Uso Piloto:
1. **Traslado de Familia**: De Cristo Resucitado a Salvador del Mundo
2. **Consulta Sacramental**: Verificar bautismo en parroquia anterior
3. **Estadísticas Diocesanas**: Reportes consolidados de ambas parroquias
4. **Comunicación**: Notificaciones de eventos importantes

---

## 14. PLAN DE IMPLEMENTACIÓN

### 📅 Cronograma de Desarrollo

#### **FASE 1: Fundación (Completada - Octubre 2025)**
**Duración**: 4 semanas  
**Estado**: ✅ Completado

**Logros Alcanzados:**
- ✅ Diseño completo de arquitectura multi-tenant
- ✅ Estructura de base de datos optimizada
- ✅ Configuración de parroquias piloto
- ✅ Módulo de configuración completo (6 submódulos)
- ✅ Sistema de autenticación y autorización
- ✅ Interfaz de usuario base con DaisyUI
- ✅ Documentación técnica completa

#### **FASE 2: Migración y Testing (En Progreso - Noviembre 2025)**
**Duración**: 6 semanas  
**Estado**: 🔄 En Progreso

**Objetivos:**
- [ ] Migración de APIs existentes a arquitectura multi-tenant
- [ ] Actualización de todos los módulos de sacramentos
- [ ] Implementación de middleware de tenant
- [ ] Testing exhaustivo de aislamiento de datos
- [ ] Migración de datos existentes de parroquias piloto
- [ ] Optimización de rendimiento

**Entregables:**
- APIs completamente multi-tenant
- Suite de tests automatizados
- Datos migrados y validados
- Performance optimizado

#### **FASE 3: Conectividad Federada (Diciembre 2025 - Enero 2026)**
**Duración**: 8 semanas  
**Estado**: 📋 Planificado

**Objetivos:**
- [ ] APIs de consulta inter-parroquial
- [ ] Sistema de notificaciones entre parroquias
- [ ] Dashboard diocesano para estadísticas consolidadas
- [ ] Herramientas de migración de personas
- [ ] Protocolo de autorización federada
- [ ] Sistema de logs y auditoría federada

**Entregables:**
- Conectividad funcional entre parroquias piloto
- Dashboard diocesano operativo
- Protocolos de seguridad implementados

#### **FASE 4: Escalabilidad (Febrero - Marzo 2026)**
**Duración**: 8 semanas  
**Estado**: 📋 Planificado

**Objetivos:**
- [ ] Optimización de rendimiento para 50+ parroquias
- [ ] Sistema de monitoreo y métricas por tenant
- [ ] Backup automatizado por parroquia
- [ ] Sistema de caching distribuido
- [ ] Optimización de consultas de base de datos
- [ ] Load balancing y auto-scaling

**Entregables:**
- Sistema preparado para escala diocesana
- Herramientas de monitoreo implementadas
- Procesos de backup automatizados

#### **FASE 5: Expansión (Abril - Junio 2026)**
**Duración**: 12 semanas  
**Estado**: 📋 Planificado

**Objetivos:**
- [ ] Onboarding de 10+ parroquias de Tegucigalpa
- [ ] Extensión a otras diócesis de Honduras
- [ ] Desarrollo de app móvil
- [ ] Sistema de reportes avanzados
- [ ] Integración con sistemas diocesanos existentes
- [ ] Certificación de seguridad

**Entregables:**
- Red federada de parroquias hondureñas
- Aplicación móvil funcional
- Certificaciones de seguridad

### 🎯 Métricas de Éxito por Fase

#### Métricas Técnicas:
- **Rendimiento**: < 200ms tiempo de respuesta promedio
- **Disponibilidad**: 99.9% uptime
- **Seguridad**: 0 filtraciones de datos entre tenants
- **Escalabilidad**: Soporte confirmado para 50+ parroquias

#### Métricas de Adopción:
- **Usuarios Activos**: 90% de usuarios configurados activos
- **Completitud de Datos**: 95% de registros con datos completos
- **Satisfacción**: > 4.5/5 en encuestas de usuario
- **Eficiencia**: 50% reducción en tiempo de gestión

### 🚧 Riesgos y Mitigaciones

#### Riesgos Técnicos:
1. **Complejidad Multi-tenant**: Mitigado con testing exhaustivo
2. **Performance en Escala**: Mitigado con optimización continua
3. **Seguridad de Datos**: Mitigado con auditorías regulares

#### Riesgos de Adopción:
1. **Resistencia al Cambio**: Mitigado con capacitación extensiva
2. **Migración de Datos**: Mitigado con proceso gradual y backups
3. **Conectividad**: Mitigado con implementación opcional federada

---

## 15. ROADMAP Y FUTURAS FUNCIONALIDADES

### 🚀 Versión 2.0 (2026)

#### **Módulos Adicionales:**
- **📊 Gestión Financiera**: Contabilidad parroquial básica
- **📅 Gestión de Eventos**: Planificación de actividades pastorales
- **💒 Gestión de Matrimonios**: Expedientes matrimoniales completos
- **📚 Biblioteca de Recursos**: Documentos, homilías, materiales
- **📞 CRM Parroquial**: Gestión de relaciones con feligreses

#### **Características Avanzadas:**
- **🤖 IA para Análisis Pastoral**: Insights automáticos sobre la comunidad
- **📱 App Móvil**: Aplicación para feligreses con funciones básicas
- **🔍 Búsqueda Inteligente**: Búsqueda semántica en registros
- **📈 Analytics Avanzados**: Dashboards con predicciones

### 🌐 Versión 3.0 (2027)

#### **Expansión Nacional:**
- **🇭🇳 Honduras Completo**: Todas las diócesis hondureñas
- **🌎 Centroamérica**: Expansión regional
- **🔗 Red Federada Nacional**: Conectividad a nivel país
- **📊 Estadísticas Nacionales**: Reportes consolidados

#### **Funcionalidades Avanzadas:**
- **💳 Pagos Digitales**: Sistema de donaciones y diezmos en línea
- **📺 Streaming**: Transmisión de misas y eventos
- **🎓 Formación en Línea**: Plataforma de catequesis digital
- **📝 Firma Digital**: Documentos oficiales con firma electrónica

### 🔮 Visión a Largo Plazo (2028+)

#### **Transformación Digital Completa:**
- **🏛️ Gobierno Eclesiástico Digital**: Procesos administrativos completamente digitales
- **🌍 Red Global**: Conectividad entre países católicos
- **📊 Big Data Pastoral**: Análisis predictivo para evangelización
- **🤖 Asistente Virtual**: IA para consultas pastorales

#### **Innovación Tecnológica:**
- **⚡ Blockchain**: Registros inmutables de sacramentos
- **🥽 VR/AR**: Experiencias de formación inmersivas
- **📱 IoT**: Sensores para gestión de espacios parroquiales
- **🗣️ Procesamiento de Voz**: Interfaces conversacionales

### 📈 Impacto Esperado

#### **A Nivel Parroquial:**
- Reducción del 70% en tiempo de gestión administrativa
- Mejora del 50% en la organización de datos
- Eliminación del 90% del papeleo
- Incremento del 40% en la eficiencia pastoral

#### **A Nivel Diocesano:**
- Estadísticas en tiempo real de toda la diócesis
- Decisiones basadas en datos concretos
- Comunicación fluida entre parroquias
- Optimización de recursos humanos y materiales

#### **A Nivel Nacional:**
- Estándares unificados para registros sacramentales
- Base de datos nacional de católicos hondureños
- Investigación sociológica y pastoral avanzada
- Modelo replicable para otros países

---

## 📞 CONTACTO Y SOPORTE

### 👨‍💻 Equipo de Desarrollo

**Desarrollador Principal:**  
Luis Miguel Cardona  
Email: luis14mc@gmail.com  
GitHub: @luis14mc  

**Rol en el Proyecto:**  
- Arquitectura del sistema
- Desarrollo full-stack
- Diseño de base de datos
- Implementación de seguridad
- Documentación técnica

### 🆘 Soporte Técnico

#### **Para Parroquias Piloto:**
- **Email de Soporte**: soporte@christifideles.hn
- **Teléfono**: +504 9999-0000
- **Horarios**: Lunes a Viernes, 8:00 AM - 5:00 PM

#### **Documentación y Recursos:**
- **Documentación Técnica**: `/docs/` en el repositorio
- **Manual de Usuario**: Incluido en el sistema
- **Videos Tutoriales**: En desarrollo
- **FAQ**: Sección de preguntas frecuentes

#### **Reportar Problemas:**
- **GitHub Issues**: Para bugs y mejoras técnicas
- **Email**: Para consultas específicas de uso
- **Teléfono**: Para emergencias críticas

### 🔄 Proceso de Actualizaciones

#### **Releases Planificados:**
- **Parches**: Cada 2 semanas (bugs críticos)
- **Mejoras Menores**: Mensualmente
- **Versiones Mayores**: Trimestralmente

#### **Comunicación de Cambios:**
- Notificaciones en el sistema
- Emails a administradores
- Documentación actualizada
- Videos explicativos cuando sea necesario

---

## 📚 ANEXOS Y REFERENCIAS

### 📖 Documentos Técnicos Relacionados

1. **Base de Datos:**
   - `docs/christi_fidelis_bdd_optimizada_v4.sql` - Esquema completo de BD
   - `prisma/schema.prisma` - Esquema Prisma actual
   - `docs/MANUAL_MULTITENANT_ARQUITECTURA.md` - Manual técnico multi-tenant

2. **Configuración:**
   - `package.json` - Dependencias del proyecto
   - `tsconfig.json` - Configuración TypeScript
   - `tailwind.config.ts` - Configuración de estilos
   - `next.config.ts` - Configuración Next.js

3. **Seguridad:**
   - `src/lib/auth.ts` - Configuración de autenticación
   - `src/middleware.ts` - Middleware de seguridad
   - Políticas de seguridad multi-tenant

### 🔗 Enlaces y Referencias Externas

#### **Tecnologías Utilizadas:**
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 18 Documentation](https://react.dev)
- [Prisma ORM](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [DaisyUI](https://daisyui.com)
- [Neon Database](https://neon.tech/docs)

#### **Patrones y Arquitectura:**
- [Multi-tenancy Patterns - Microsoft](https://docs.microsoft.com/en-us/azure/architecture/patterns/sharding)
- [Row Level Security - PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)

#### **Recursos Católicos:**
- [Código de Derecho Canónico](http://www.vatican.va/archive/cod-iuris-canonici/cic_index_sp.html)
- [Conferencia Episcopal de Honduras](https://www.ceh.hn)
- [Arquidiócesis de Tegucigalpa](http://arquidiocesistegucigalpa.org)

### 📊 Glosario de Términos

#### **Términos Técnicos:**
- **Multi-tenant**: Arquitectura donde una instancia sirve múltiples clientes
- **Tenant**: Cliente individual del sistema (en nuestro caso, una parroquia)
- **RBAC**: Role-Based Access Control (Control de Acceso Basado en Roles)
- **JWT**: JSON Web Token (Token de autenticación)
- **ORM**: Object-Relational Mapping (Mapeo Objeto-Relacional)
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete (operaciones básicas)

#### **Términos Eclesiásticos:**
- **Parroquia**: Comunidad de fieles católicos con territorio definido
- **Diócesis**: Territorio eclesiástico bajo jurisdicción de un obispo
- **Sacramento**: Signo visible de la gracia divina instituido por Cristo
- **Feligrés**: Miembro de una parroquia
- **Párroco**: Sacerdote a cargo de una parroquia
- **Sector Parroquial**: División territorial dentro de una parroquia

#### **Términos del Sistema:**
- **Federación**: Conectividad autorizada entre parroquias
- **Constancia Sacramental**: Documento oficial que certifica un sacramento
- **Expediente**: Conjunto de documentos de una persona o sacramento
- **Bitácora**: Registro de actividades del sistema
- **Dashboard**: Panel de control con estadísticas

---

**📅 Información del Documento:**  
- **Fecha de Creación**: 3 de octubre de 2025  
- **Última Actualización**: 3 de octubre de 2025  
- **Versión**: 1.0  
- **Autor**: Luis Miguel Cardona  
- **Revisión**: En curso  

**🔄 Estado del Proyecto:**  
- **Fase Actual**: Implementación Core (Fase 2)  
- **Progreso General**: 65% completado  
- **Próximo Hito**: Migración completa a multi-tenant  
- **Fecha Estimada de Lanzamiento**: Enero 2026  

---

*Este documento es un recurso vivo que se actualiza conforme evoluciona el proyecto Christi Fideles. Para la versión más reciente, consulte el repositorio oficial en GitHub.*