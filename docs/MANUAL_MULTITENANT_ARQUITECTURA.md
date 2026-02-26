# 📚 MANUAL DE ARQUITECTURA MULTI-TENANT
## Sistema Christi Fideles - Gestión de Parroquias

---

## 📋 ÍNDICE

1. [Introducción al Multi-tenancy](#introducción-al-multi-tenancy)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Aislamiento de Datos](#aislamiento-de-datos)
5. [Conectividad Federada](#conectividad-federada)
6. [Implementación Técnica](#implementación-técnica)
7. [Guía de Implementación](#guía-de-implementación)
8. [Casos de Uso](#casos-de-uso)
9. [Seguridad y Permisos](#seguridad-y-permisos)
10. [Próximos Pasos](#próximos-pasos)

---

## 🎯 INTRODUCCIÓN AL MULTI-TENANCY

### ¿Qué es Multi-tenancy?

**Multi-tenancy** es un patrón arquitectónico donde una sola instancia de software sirve a múltiples clientes (tenants), manteniendo sus datos completamente aislados y seguros.

### En el Contexto de Christi Fideles:

- **Tenant** = **Parroquia**
- **Cada parroquia** tiene acceso únicamente a sus propios datos
- **Compartición de recursos** del sistema (código, infraestructura)
- **Aislamiento total** de información entre parroquias

### Ventajas del Modelo:

✅ **Economía de escala**: Una instancia sirve múltiples parroquias  
✅ **Mantenimiento centralizado**: Actualizaciones y mejoras automáticas  
✅ **Seguridad**: Aislamiento completo de datos  
✅ **Escalabilidad**: Fácil agregar nuevas parroquias  
✅ **Conectividad controlada**: Comunicación autorizada entre parroquias  

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Niveles de Arquitectura:

```
┌─────────────────────────────────────────────────────────────┐
│                    NIVEL DE APLICACIÓN                     │
│  Next.js App Router + React + TypeScript + Tailwind        │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                   NIVEL DE AUTENTICACIÓN                   │
│        NextAuth.js + Session Management + RBAC             │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                    NIVEL DE TENANT                         │
│              Identificación y Aislamiento                  │
│         (id_parroquia en todas las operaciones)            │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                    NIVEL DE DATOS                          │
│          Prisma ORM + PostgreSQL + Row Level Security      │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                   NIVEL DE PERSISTENCIA                    │
│              PostgreSQL Database (Neon)                    │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos:

```
[Usuario] → [Login] → [Identificar Parroquia] → [Filtrar por id_parroquia] → [Datos Aislados]
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tabla Principal: `parroquia`

```sql
CREATE TABLE parroquia (
    id_parroquia SMALLSERIAL PRIMARY KEY,        -- Tenant ID único
    nombre VARCHAR(100) NOT NULL,                -- "Cristo Resucitado"
    codigo_parroquia VARCHAR(20) UNIQUE,         -- "CR-LOARQUE-001"
    diocesis VARCHAR(100),                       -- "Arquidiócesis de Tegucigalpa"
    permite_consultas_externas BOOLEAN,          -- Para conectividad federada
    parroquias_autorizadas JSONB,                -- Lista de parroquias conectadas
    endpoint_notificaciones TEXT                 -- URL para comunicación
);
```

### Patrón Multi-tenant en Todas las Tablas:

```sql
-- EJEMPLO: Tabla persona
CREATE TABLE persona (
    numero_identidad VARCHAR(20) NOT NULL,
    id_parroquia SMALLINT NOT NULL,              -- ← TENANT DISCRIMINATOR
    nombres VARCHAR(55) NOT NULL,
    apellidos VARCHAR(55) NOT NULL,
    -- ... otros campos
    PRIMARY KEY (id_parroquia, numero_identidad),
    FOREIGN KEY (id_parroquia) REFERENCES parroquia(id_parroquia)
);

-- EJEMPLO: Tabla usuario
CREATE TABLE usuario (
    id_usuario BIGSERIAL PRIMARY KEY,
    id_parroquia SMALLINT NOT NULL,              -- ← TENANT DISCRIMINATOR
    nombre VARCHAR(100) NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    -- ... otros campos
    FOREIGN KEY (id_parroquia) REFERENCES parroquia(id_parroquia)
);
```

### Reglas de Aislamiento:

1. **Toda tabla** debe tener `id_parroquia` como discriminador
2. **Toda consulta** debe filtrar por `id_parroquia`
3. **Toda inserción** debe incluir el `id_parroquia` del usuario autenticado
4. **Las claves primarias** pueden ser compuestas: `(id_parroquia, otro_campo)`

---

## 🔒 AISLAMIENTO DE DATOS

### Implementación en el Código:

#### 1. **Middleware de Autenticación** (`src/middleware.ts`)

```typescript
export async function middleware(request: NextRequest) {
  const session = await getToken({ req: request });
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Validar que el usuario pertenece a una parroquia válida
  const parroquiaId = session.parroquiaId;
  if (!parroquiaId) {
    return NextResponse.redirect(new URL('/error', request.url));
  }

  // Inyectar parroquia_id en headers para APIs
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-parroquia-id', parroquiaId.toString());
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

#### 2. **Filtros Automáticos en APIs** (`src/app/api/*/route.ts`)

```typescript
// EJEMPLO: API de personas
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const parroquiaId = session.user.parroquiaId;

  // ✅ CORRECTO: Siempre filtrar por parroquia
  const personas = await prisma.persona.findMany({
    where: {
      id_parroquia: parroquiaId  // ← AISLAMIENTO AUTOMÁTICO
    }
  });

  return NextResponse.json(personas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const data = await req.json();
  
  // ✅ CORRECTO: Siempre incluir parroquia en creación
  const nuevaPersona = await prisma.persona.create({
    data: {
      ...data,
      id_parroquia: session.user.parroquiaId  // ← ASIGNACIÓN AUTOMÁTICA
    }
  });

  return NextResponse.json(nuevaPersona);
}
```

#### 3. **Hooks Personalizados para Frontend**

```typescript
// src/hooks/useParroquiaData.ts
export function useParroquiaData() {
  const { data: session } = useSession();
  
  return {
    parroquiaId: session?.user?.parroquiaId,
    parroquiaNombre: session?.user?.parroquiaNombre,
    // Funciones helper que automáticamente incluyen filtros
    fetchPersonas: () => fetch(`/api/personas`), // Ya filtrado por middleware
    createPersona: (data) => fetch(`/api/personas`, {
      method: 'POST',
      body: JSON.stringify(data)  // parroquiaId se agrega automáticamente
    })
  };
}
```

---

## 🌐 CONECTIVIDAD FEDERADA

### Concepto:

Las parroquias mantienen **BD independientes** pero pueden realizar **consultas autorizadas** entre ellas para casos específicos.

### Casos de Uso:

1. **Traslado de personas** entre parroquias
2. **Verificación de sacramentos** previos
3. **Estadísticas diocesanas**
4. **Notificaciones inter-parroquiales**

### Configuración de Conectividad:

```sql
-- Parroquia A autoriza consultas de Parroquia B
UPDATE parroquia SET
    permite_consultas_externas = true,
    parroquias_autorizadas = '["SM-CERROGRANDE-002"]',
    endpoint_notificaciones = 'https://api-cristoresucitado.hn/notifications'
WHERE codigo_parroquia = 'CR-LOARQUE-001';
```

### API de Consultas Federadas:

```typescript
// src/app/api/federado/persona/route.ts
export async function POST(req: NextRequest) {
  const { numero_identidad, parroquia_origen, api_key } = await req.json();
  
  // 1. Validar autorización
  const parroquiaDestino = await prisma.parroquia.findFirst({
    where: {
      permite_consultas_externas: true,
      parroquias_autorizadas: {
        path: '$',
        array_contains: [parroquia_origen]
      }
    }
  });

  if (!parroquiaDestino) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // 2. Buscar persona (datos limitados)
  const persona = await prisma.persona.findFirst({
    where: {
      numero_identidad,
      id_parroquia: parroquiaDestino.id_parroquia
    },
    select: {
      numero_identidad: true,
      nombres: true,
      apellidos: true,
      estado_activo_parroquia: true
      // NO incluir datos sensibles
    }
  });

  return NextResponse.json(persona);
}
```

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### Configuración de Prisma:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'], // Para debug de consultas multi-tenant
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper para consultas con filtro automático
export function createTenantAwareClient(parroquiaId: number) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...args.where, id_parroquia: parroquiaId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, id_parroquia: parroquiaId };
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, id_parroquia: parroquiaId };
          return query(args);
        }
      }
    }
  });
}
```

### Configuración de NextAuth:

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials?.email },
          include: {
            parroquia: true,
            rol: true
          }
        });

        if (usuario && await compare(credentials?.password, usuario.contrasena)) {
          return {
            id: usuario.id_usuario.toString(),
            email: usuario.email,
            name: usuario.nombre,
            // ✅ INCLUIR DATOS DE TENANT
            parroquiaId: usuario.id_parroquia,
            parroquiaNombre: usuario.parroquia.nombre,
            parroquiaCodigo: usuario.parroquia.codigo_parroquia,
            rol: usuario.rol.nombre
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.parroquiaId = user.parroquiaId;
        token.parroquiaNombre = user.parroquiaNombre;
        token.parroquiaCodigo = user.parroquiaCodigo;
        token.rol = user.rol;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.parroquiaId = token.parroquiaId;
      session.user.parroquiaNombre = token.parroquiaNombre;
      session.user.parroquiaCodigo = token.parroquiaCodigo;
      session.user.rol = token.rol;
      return session;
    }
  }
};
```

---

## 🚀 GUÍA DE IMPLEMENTACIÓN

### Fase 1: Preparación de Base de Datos

```bash
# 1. Aplicar nueva estructura
psql $DATABASE_URL -f docs/christi_fidelis_bdd_optimizada_v4.sql

# 2. Verificar parroquias creadas
psql $DATABASE_URL -c "SELECT id_parroquia, nombre, codigo_parroquia FROM parroquia;"
```

### Fase 2: Actualización del Schema de Prisma

```bash
# 1. Actualizar schema basado en nueva BD
npx prisma db pull

# 2. Generar cliente actualizado
npx prisma generate

# 3. Verificar tipos generados
npm run type-check
```

### Fase 3: Migración de APIs Existentes

```typescript
// ANTES (sin multi-tenancy)
export async function GET() {
  const personas = await prisma.persona.findMany();
  return NextResponse.json(personas);
}

// DESPUÉS (con multi-tenancy)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const personas = await prisma.persona.findMany({
    where: {
      id_parroquia: session.user.parroquiaId  // ← AGREGAR FILTRO
    }
  });
  
  return NextResponse.json(personas);
}
```

### Fase 4: Actualización de Frontend

```typescript
// ANTES
const { data: personas } = useSWR('/api/personas', fetcher);

// DESPUÉS (sin cambios, el filtro es automático en el backend)
const { data: personas } = useSWR('/api/personas', fetcher);
```

### Fase 5: Testing Multi-tenant

```typescript
// tests/multitenant.test.ts
describe('Multi-tenant Isolation', () => {
  test('Usuario de parroquia A no ve datos de parroquia B', async () => {
    // Login como usuario de Cristo Resucitado
    const sessionA = await loginAs('admin@cristoresucitado.hn');
    
    // Obtener personas
    const personasA = await fetch('/api/personas', {
      headers: { Authorization: `Bearer ${sessionA.token}` }
    });
    
    // Verificar que solo se obtienen personas de parroquia A
    expect(personasA.every(p => p.id_parroquia === 1)).toBe(true);
  });
});
```

---

## 📝 CASOS DE USO

### Caso 1: Usuario Normal (Secretario Parroquial)

```
1. Login → Identificación automática de parroquia
2. Dashboard → Solo estadísticas de su parroquia
3. Gestión de personas → Solo personas de su parroquia
4. Sacramentos → Solo registros de su parroquia
5. Reportes → Solo datos de su parroquia
```

### Caso 2: Consulta Federada (Traslado de Persona)

```
1. Persona se traslada de Cristo Resucitado → Salvador del Mundo
2. Salvador del Mundo consulta a Cristo Resucitado
3. Cristo Resucitado valida autorización
4. Retorna datos básicos de la persona
5. Salvador del Mundo crea registro local
6. Cristo Resucitado marca persona como "trasladada"
```

### Caso 3: Administrador Diocesano

```
1. Login con rol especial
2. Acceso a dashboard multi-parroquia
3. Estadísticas consolidadas de todas las parroquias autorizadas
4. Reportes diocesanos
5. Gestión de conectividad entre parroquias
```

---

## 🔐 SEGURIDAD Y PERMISOS

### Niveles de Seguridad:

1. **Autenticación**: ¿Quién eres?
2. **Tenant Isolation**: ¿A qué parroquia perteneces?
3. **Autorización**: ¿Qué puedes hacer en tu parroquia?
4. **Row Level Security**: Filtros automáticos en BD

### Configuración RLS (Row Level Security):

```sql
-- Habilitar RLS en tablas sensibles
ALTER TABLE persona ENABLE ROW LEVEL SECURITY;

-- Política: Solo ver personas de tu parroquia
CREATE POLICY persona_tenant_isolation ON persona
    FOR ALL TO authenticated_users
    USING (id_parroquia = current_setting('tenant.parroquia_id')::int);
```

### Validaciones de Seguridad:

```typescript
// Middleware de validación de tenant
function validateTenantAccess(req: NextRequest, targetParroquiaId: number) {
  const session = getSession(req);
  
  if (session.user.parroquiaId !== targetParroquiaId) {
    throw new Error('Acceso denegado: Tenant incorrecto');
  }
}
```

---

## 🎯 PRÓXIMOS PASOS

### Fase 1: Fundación (En Progreso)
- [x] Diseño de arquitectura multi-tenant
- [x] Estructura de BD optimizada
- [x] Configuración de parroquias piloto
- [ ] Migración del sistema actual
- [ ] Testing de aislamiento

### Fase 2: Implementación Core
- [ ] Actualización de todas las APIs existentes
- [ ] Migración de datos actuales
- [ ] Implementación de middleware de tenant
- [ ] Testing exhaustivo de aislamiento

### Fase 3: Conectividad Federada
- [ ] APIs de consulta inter-parroquial
- [ ] Sistema de notificaciones
- [ ] Dashboard diocesano
- [ ] Herramientas de migración de personas

### Fase 4: Escalabilidad
- [ ] Optimización de rendimiento
- [ ] Monitoreo por tenant
- [ ] Backup por parroquia
- [ ] Métricas y analytics

### Fase 5: Expansión
- [ ] Nuevas parroquias de Tegucigalpa
- [ ] Otras diócesis de Honduras
- [ ] Federación nacional
- [ ] Conectividad internacional

---

## 📊 MÉTRICAS DE ÉXITO

### Métricas Técnicas:
- **Aislamiento**: 0 filtraciones de datos entre tenants
- **Rendimiento**: < 200ms respuesta promedio por tenant
- **Disponibilidad**: 99.9% uptime por parroquia
- **Escalabilidad**: Soporte para 50+ parroquias

### Métricas de Negocio:
- **Adopción**: 100% de parroquias piloto activas
- **Satisfacción**: > 90% satisfacción de usuarios
- **Eficiencia**: 50% reducción en tiempo de gestión
- **Conectividad**: > 80% de consultas federadas exitosas

---

## 🔧 HERRAMIENTAS DE DESARROLLO

### Para Debugging Multi-tenant:

```bash
# Ver todas las consultas con filtro de parroquia
PRISMA_LOG=query npm run dev

# Verificar aislamiento de datos
npm run test:multitenant

# Validar configuración de parroquias
npm run check:tenants
```

### Para Monitoreo:

```typescript
// src/lib/monitoring.ts
export function logTenantActivity(parroquiaId: number, action: string, data: any) {
  console.log(`[TENANT ${parroquiaId}] ${action}:`, data);
  
  // Enviar a servicio de monitoreo
  analytics.track('tenant_activity', {
    parroquia_id: parroquiaId,
    action,
    timestamp: new Date().toISOString()
  });
}
```

---

## 📚 RECURSOS ADICIONALES

### Documentación Relacionada:
- `docs/christi_fidelis_bdd_optimizada_v4.sql` - Estructura de BD completa
- `docs/API_REFERENCE.md` - Documentación de APIs multi-tenant
- `docs/DEPLOYMENT_GUIDE.md` - Guía de despliegue por parroquia

### Enlaces Externos:
- [Multi-tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/sharding)
- [Row Level Security PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [NextAuth.js Multi-tenant](https://next-auth.js.org/tutorials/corporate-proxy)

---

**📞 Contacto para Soporte:**
- **Desarrollador**: Sistema Christi Fideles
- **Email**: dev@christifideles.hn
- **Documentación**: Esta misma ubicación

---

*Última actualización: 3 de octubre de 2025*
*Versión: 1.0*