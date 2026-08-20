# ChristiFideles — Contexto de Producto v1.0

## Visión
ChristiFideles es una plataforma web multi-parroquia para apoyar el trabajo diario de secretarías parroquiales, preservando registros sacramentales, personas, libros, constancias y trazabilidad con aislamiento seguro entre parroquias.

## Meta de lanzamiento
Fecha objetivo de primera versión productiva: **19 de octubre de 2026**.

La v1 debe poder ser usada diariamente por una secretaría parroquial real sin depender de herramientas externas para registrar, consultar y emitir información sacramental básica.

## Usuarios principales
### Secretaría parroquial
Necesita registrar personas y sacramentos, buscar rápidamente, corregir datos con trazabilidad, consultar libros y generar constancias.

### Párroco / sacerdote autorizado
Necesita consultar registros, validar información y respaldar emisión de constancias.

### Administrador parroquial
Necesita administrar usuarios, permisos, parámetros de parroquia y catálogos operativos.

### Superadministrador
Necesita administrar aspectos globales de la plataforma sin perder aislamiento de datos entre parroquias.

## Piloto esperado
La primera salida productiva debe validar al menos una parroquia operando de extremo a extremo. El diseño debe quedar listo para una segunda parroquia para verificar aislamiento multi-tenant.

## Stack oficial
- Next.js 15 App Router
- React 19
- TypeScript
- Prisma 6
- PostgreSQL
- NextAuth
- Tailwind CSS 4
- DaisyUI 5
- Vercel para aplicación
- Neon para PostgreSQL

## Estado actual conocido
Ya existen:
- aplicación Next.js full-stack;
- autenticación y middleware;
- CRUD de usuarios;
- CRUD de personas;
- dashboard;
- configuración y setup;
- roles y permisos;
- Prisma schema multi-tenant;
- modelos de Bautismo, Primera Comunión, Confirmación y Matrimonio;
- modelos de bitácora;
- numeradores por parroquia y módulo;
- plantillas de constancias;
- catálogos territoriales y religiosos;
- seeds de datos.

Pendientes principales para v1:
- estabilización técnica del código existente;
- validación completa de aislamiento multi-tenant;
- CRUD/API/UI funcional de sacramentos;
- captura posterior de datos complementarios (no-DNI) faltantes, manteniendo el DNI siempre obligatorio;
- libros/folios/numeración operativa;
- generación de constancias PDF;
- auditoría realmente conectada a operaciones;
- estrategia de defunciones/registro funerario;
- pruebas automatizadas y manuales;
- staging y producción;
- backups, observabilidad y runbook de recuperación.

## Principios del dominio
1. Un registro sacramental es información histórica sensible y no debe tratarse como un CRUD desechable.
2. Las correcciones deben ser trazables.
3. Los datos complementarios (no-DNI) de una Persona pueden completarse después, pero el DNI (`numero_identidad`) es siempre obligatorio para registrarla.
4. Una persona puede aparecer en múltiples sacramentos y roles familiares.
5. La misma plataforma sirve a varias parroquias, pero cada usuario opera dentro de su alcance autorizado.
6. El cliente nunca decide a qué parroquia tiene acceso; eso lo determina la sesión y autorización del servidor.
7. Numeración de libros, folios, actas y registros debe ser consistente y separada por parroquia/módulo.
8. Las constancias deben poder adaptarse a configuración parroquial sin duplicar lógica de código.

## Caso de uso crítico v1
1. Usuario inicia sesión.
2. Sistema identifica parroquia y permisos.
3. Secretaría busca una persona.
4. Si no existe, crea la Persona con DNI obligatorio (`numero_identidad`) y los demás datos requeridos por el modelo.
5. Registra sacramento.
6. Sistema asigna/valida libro, folio, acta o número según reglas.
7. Guarda con auditoría.
8. Puede consultar el registro posteriormente.
9. Puede emitir una constancia PDF.
10. Una corrección posterior queda registrada en bitácora.

## Reglas multi-tenant
- Toda consulta de entidades parroquiales debe filtrar por la parroquia efectiva de la sesión.
- Las relaciones compuestas existentes deben preservarse cuando protegen aislamiento.
- No aceptar `id_parroquia` del body/query como autorización.
- Las acciones globales requieren rol explícito de superadministración.
- QA debe probar intentos de acceso cruzado entre dos parroquias.

## Persona y DNI (regla no negociable v1)
En ChristiFidelis v1 **no puede existir una Persona sin DNI**. `numero_identidad` es obligatorio y forma parte de la PK compuesta `(id_parroquia, numero_identidad)`. No se introduce `id_persona` ni se generan DNIs ficticios o placeholder.

Flujo obligatorio:

```text
Buscar Persona por DNI
        ↓
¿Existe en la parroquia?
   ├─ NO → crear Persona con DNI obligatorio
   └─ SÍ → continuar
                    ↓
              sacramento
```

Otros datos (teléfono, correo, sector, etc.) pueden requerir revisión o completado posterior, pero **el DNI nunca es opcional**.

## Seguridad mínima de v1
- sesiones seguras;
- contraseñas con hash robusto;
- autorización server-side;
- sin secretos en Git;
- validación de entrada;
- protección contra acceso cruzado de parroquias;
- manejo de errores sin datos sensibles;
- eliminación/desactivación controlada;
- auditoría de cambios sacramentales;
- rutas de debug deshabilitadas en producción.

## Despliegue objetivo
### Staging
Entorno conectado a una base de datos separada, utilizado para QA y aceptación.

### Production
Vercel + Neon con variables de entorno seguras, migraciones controladas, backups y monitoreo.

## Criterio de éxito de la v1
La v1 se considera lista cuando una secretaría puede completar el flujo persona → sacramento → libro/numeración → consulta → constancia → auditoría sin intervención técnica y sin riesgo conocido de acceso entre parroquias.
