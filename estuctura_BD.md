// Schema para ChristiFideles - Sistema de Registro de Sacramentos

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Modelo para Parroquias (multi-tenant)
model Parroquia {
  id          String   @id @default(cuid())
  nombre      String
  direccion   String?
  telefono    String?
  email       String?
  parroco     String?
  diocesis    String?
  codigo      String   @unique // Para interoperabilidad
  activa      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones
  personas    Persona[]
  sacramentos Sacramento[]
  usuarios    Usuario[]
  
  @@map("parroquias")
}

// Modelo para Personas
model Persona {
  id            String   @id @default(cuid())
  nombres       String
  apellidos     String
  fechaNac      DateTime?
  lugarNac      String?
  cedula        String?  @unique
  telefono      String?
  email         String?
  direccion     String?
  nombrePadre   String?
  nombreMadre   String?
  padrinos      String? // JSON con info de padrinos
  observaciones String?
  
  // Multi-tenant
  parroquiaId   String
  parroquia     Parroquia @relation(fields: [parroquiaId], references: [id])
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relaciones
  sacramentos   Sacramento[]
  
  @@map("personas")
}

// Modelo para Tipos de Sacramento
model TipoSacramento {
  id          String @id @default(cuid())
  nombre      String @unique // Bautismo, Confirmación, Matrimonio, etc.
  descripcion String?
  orden       Int    @default(0) // Para ordenar los sacramentos
  activo      Boolean @default(true)
  
  // Relaciones
  sacramentos Sacramento[]
  
  @@map("tipos_sacramento")
}

// Modelo principal de Sacramentos
model Sacramento {
  id              String   @id @default(cuid())
  
  // Información básica
  fechaSacramento DateTime
  lugarSacramento String?
  libroRegistro   String?
  folioRegistro   String?
  numeroRegistro  String?
  
  // Relaciones principales
  personaId       String
  persona         Persona @relation(fields: [personaId], references: [id])
  
  tipoSacramentoId String
  tipoSacramento   TipoSacramento @relation(fields: [tipoSacramentoId], references: [id])
  
  parroquiaId     String
  parroquia       Parroquia @relation(fields: [parroquiaId], references: [id])
  
  // Información del ministro
  ministro        String
  
  // Información específica por sacramento (JSON flexible)
  datosEspecificos Json? // Padrinos, testigos, etc.
  
  // Notas y observaciones
  observaciones   String?
  
  // Control de versiones y auditoría
  registradoPor   String?
  fechaRegistro   DateTime @default(now())
  ultimaActualizacion DateTime @updatedAt
  
  @@map("sacramentos")
  @@unique([parroquiaId, tipoSacramentoId, numeroRegistro])
}

// Modelo para Usuarios del Sistema
model Usuario {
  id          String   @id @default(cuid())
  email       String   @unique
  nombre      String
  apellidos   String?
  password    String
  rol         RolUsuario @default(SECRETARIO)
  activo      Boolean  @default(true)
  
  // Multi-tenant
  parroquiaId String
  parroquia   Parroquia @relation(fields: [parroquiaId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("usuarios")
}

enum RolUsuario {
  ADMIN       // Administrador del sistema
  PARROCO     // Párroco
  VICARIO     // Vicario parroquial
  SECRETARIO  // Secretario parroquial
  CAPELLAN    // Capellán
}

// Modelo para Configuración por Parroquia
model ConfiguracionParroquia {
  id                String @id @default(cuid())
  parroquiaId       String @unique
  parroquia         Parroquia @relation(fields: [parroquiaId], references: [id])
  
  // Configuraciones específicas
  formatoNumeroRegistro String @default("###/YYYY")
  requierePadrinos      Boolean @default(true)
  camposObligatorios    Json? // Lista de campos obligatorios por sacramento
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@map("configuracion_parroquias")
}