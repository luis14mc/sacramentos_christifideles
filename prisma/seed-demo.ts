/**
 * ChristiFideles — Seed de DEMO
 *
 * Carga datos visibles para recorridos end-to-end sobre la BD de una
 * parroquia:
 *   - parroquia existente (no duplica)
 *   - 3 usuarios (admin, secretario, catequista) con contraseñas desde env
 *   - ~18 personas con perfiles heterogéneos (incluye relaciones de familia)
 *   - 4 ministros (1 párroco, 1 sacerdote adjunto, 1 obispo, 1 diácono)
 *     con `orden_sacerdotal`
 *   - sacramentos coherentes (bautismos, comuniones, confirmaciones, matrimonio)
 *   - numeradores inicializados
 *
 * Idempotente: usa upsert/where para crear o actualizar sin duplicar.
 * NO destructivo: nunca elimina registros existentes.
 * Tenant específico: limita a una sola parroquia.
 *
 * Guard y ejecución:
 *   El seed SIEMPRE exige ALLOW_DEMO_SEED=true. Esto es INDEPENDIENTE de
 *   NODE_ENV (en Railway el environment es 'production' por defecto y eso
 *   no debe bloquear una operación autorizada y puntual). El demo nunca
 *   corre por accidente.
 *
 *   Exportar las 3 contraseñas y ejecutar:
 *
 *     export ALLOW_DEMO_SEED=true
 *     export DEMO_ADMIN_PASSWORD='...'
 *     export DEMO_SECRETARIO_PASSWORD='...'
 *     export DEMO_CATEQUISTA_PASSWORD='...'
 *     pnpm db:seed:demo
 *
 *   Al terminar, restaurar el guard:
 *
 *     unset ALLOW_DEMO_SEED
 *     unset DEMO_ADMIN_PASSWORD
 *     unset DEMO_SECRETARIO_PASSWORD
 *     unset DEMO_CATEQUISTA_PASSWORD
 *
 *   Las contraseñas demo tienen >= 8 caracteres (impuesto por
 *   `loadPasswords`). NO se imprimen en logs.
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

const prisma = new PrismaClient();

const PARISH_NAME = 'Cristo Resucitado de Loarque';

interface DemoPasswords {
  admin: string;
  secretario: string;
  catequista: string;
}

function loadPasswords(): DemoPasswords {
  const admin = process.env.DEMO_ADMIN_PASSWORD?.trim();
  const secretario = process.env.DEMO_SECRETARIO_PASSWORD?.trim();
  const catequista = process.env.DEMO_CATEQUISTA_PASSWORD?.trim();
  if (!admin || !secretario || !catequista) {
    throw new Error(
      'Faltan variables DEMO_ADMIN_PASSWORD / DEMO_SECRETARIO_PASSWORD / DEMO_CATEQUISTA_PASSWORD.',
    );
  }
  if (
    admin.length < 8 ||
    secretario.length < 8 ||
    catequista.length < 8
  ) {
    throw new Error('Las contraseñas demo deben tener al menos 8 caracteres.');
  }
  return { admin, secretario, catequista };
}

async function ensureRole(nombre: string, descripcion: string, idUsr: bigint) {
  const existing = await prisma.rolUsuario.findFirst({
    where: { nombre },
    orderBy: { id_rol: 'asc' },
  });
  if (existing) {
    const updated = await prisma.rolUsuario.update({
      where: { id_rol: existing.id_rol },
      data: { descripcion, estado: 1, id_usuario_creacion: idUsr },
    });
    return updated.id_rol;
  }
  const created = await prisma.rolUsuario.create({
    data: { nombre, descripcion, estado: 1, id_usuario_creacion: idUsr },
  });
  return created.id_rol;
}

async function ensureNumerador(
  idParroquia: number,
  modulo: string,
  valores: { libro: number; folio: number; acta: number; registro: number },
) {
  await prisma.numeradores.upsert({
    where: {
      id_parroquia_modulo_scope: {
        id_parroquia: idParroquia,
        modulo,
        scope: 'general',
      },
    },
    update: {
      ultimo_libro: valores.libro,
      ultimo_folio: valores.folio,
      ultimo_acta: valores.acta,
      ultimo_registro: valores.registro,
    },
    create: {
      id_parroquia: idParroquia,
      modulo,
      scope: 'general',
      ultimo_libro: valores.libro,
      ultimo_folio: valores.folio,
      ultimo_acta: valores.acta,
      ultimo_registro: valores.registro,
    },
  });
}

async function ensurePersona(
  idParroquia: number,
  idSector: bigint,
  idOrdenDiocesana: number,
  args: {
    dni: string;
    nombres: string;
    apellidos: string;
    fechaNacimiento: string;
    sexo: 'M' | 'F';
    estadoVital?: number;
  },
) {
  const data = {
    id_parroquia: idParroquia,
    id_sector_parroquial: idSector,
    id_orden_religiosa: idOrdenDiocesana,
    lugar_nacimiento: '0801',
    estado_activo_parroquia: 1,
    telefono: `+504 9${args.dni.slice(-4)}-0000`,
    direccion: `Loarque, Distrito Central, Francisco Morazán`,
    email: null,
    imagen: null,
    otra_orden_religiosa: null,
  };
  const payload = {
    numero_identidad: args.dni,
    nombres: args.nombres,
    apellidos: args.apellidos,
    fecha_nacimiento: new Date(args.fechaNacimiento),
    sexo: args.sexo,
    estado_vital: args.estadoVital ?? 1,
  };
  return prisma.persona.upsert({
    where: {
      id_parroquia_numero_identidad: {
        id_parroquia: idParroquia,
        numero_identidad: args.dni,
      },
    },
    update: { ...data, ...payload },
    create: { ...data, ...payload },
  });
}

async function ensureUsuario(
  idParroquia: number,
  idRol: number,
  email: string,
  password: string,
  nombreVisible: string,
  idUsrCreacion: bigint,
) {
  const passwordHash = Buffer.from(await hash(password, 12));
  await prisma.usuario.upsert({
    where: { email },
    update: {
      nombre: nombreVisible,
      contrasena: passwordHash,
      id_rol: idRol,
      id_parroquia: idParroquia,
      estado: 1,
    },
    create: {
      email,
      nombre: nombreVisible,
      id_parroquia: idParroquia,
      id_rol: idRol,
      contrasena: passwordHash,
      estado: 1,
      id_usuario_creacion: idUsrCreacion,
      telefono: '+504 0000-0000',
    },
  });
}

async function ensureClero(
  idParroquia: number,
  idRango: number,
  idOrden: number,
  numeroIdentidad: string,
  esParroco = false,
) {
  await prisma.ordenSacerdotal.upsert({
    where: {
      id_parroquia_numero_identidad: {
        id_parroquia: idParroquia,
        numero_identidad: numeroIdentidad,
      },
    },
    update: {
      id_rango_sacerdotal: idRango,
      id_orden_religiosa: idOrden,
      es_parroco: esParroco ? 1 : 0,
      estado_ministerial: 1,
    },
    create: {
      id_parroquia: idParroquia,
      numero_identidad: numeroIdentidad,
      id_rango_sacerdotal: idRango,
      id_orden_religiosa: idOrden,
      es_parroco: esParroco ? 1 : 0,
      estado_ministerial: 1,
    },
  });
}

async function main() {
  // Guard explícito. El seed demo NUNCA corre por accidente: requiere
  // ALLOW_DEMO_SEED=true en el entorno. Esto es independiente de NODE_ENV
  // (Railway usa environment 'production' por defecto y eso no debe
  // bloquear una operación autorizada y explícita).
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error(
      'Demo seed bloqueado. Para ejecutarlo, define ALLOW_DEMO_SEED=true ' +
        'en el entorno antes de correr `pnpm db:seed:demo`. Tras terminar, ' +
        'restablece ALLOW_DEMO_SEED=false o elimínalo.'
    );
  }

  console.log('Iniciando demo seed...');
  const passwords = loadPasswords();

  // Parroquia
  const parish = await prisma.parroquia.findFirstOrThrow({
    where: { nombre: PARISH_NAME },
    orderBy: { id_parroquia: 'asc' },
  });
  const sector = await prisma.sectorParroquial.findFirstOrThrow({
    where: { id_parroquia: parish.id_parroquia, nombre: 'General' },
  });
  const ordenDiocesana = await prisma.ordenReligiosa.findFirstOrThrow({
    where: { nombre: 'Diocesano' },
  });
  const rangoDiacono = await prisma.rangoOrdenSacerdotal.findFirstOrThrow({
    where: { nombre: 'Diácono' },
  });
  const rangoSacerdote = await prisma.rangoOrdenSacerdotal.findFirstOrThrow({
    where: { nombre: 'Sacerdote' },
  });
  const rangoObispo = await prisma.rangoOrdenSacerdotal.findFirstOrThrow({
    where: { nombre: 'Obispo' },
  });

console.log(`Parroquia: ${parish.nombre} (id_parroquia=${parish.id_parroquia})`);

  // Roles demo
  const idRolAdmin = await ensureRole(
    'Super Admin',
    'Administrador del sistema completo',
    BigInt(0),
  );
  const idRolSecretario = await ensureRole(
    'Secretario',
    'Operador de registro y constancias',
    BigInt(0),
  );
  const idRolCatequista = await ensureRole(
    'Catequista',
    'Acceso de consulta y registro catequístico',
    BigInt(0),
  );

  // Usuarios demo (idempotente)
  await ensureUsuario(
    parish.id_parroquia,
    idRolAdmin,
    'demo-admin@cristoresucitado.org',
    passwords.admin,
    'Demo Admin',
    BigInt(1),
  );
  await ensureUsuario(
    parish.id_parroquia,
    idRolSecretario,
    'demo-secretario@cristoresucitado.org',
    passwords.secretario,
    'Demo Secretario',
    BigInt(1),
  );
  await ensureUsuario(
    parish.id_parroquia,
    idRolCatequista,
    'demo-catequista@cristoresucitado.org',
    passwords.catequista,
    'Demo Catequista',
    BigInt(1),
  );
  console.log('✓ 3 usuarios demo');

  // Personas demo (~18)
  const personasData: Array<Parameters<typeof ensurePersona>[3]> = [
    { dni: '0801-1965-90001', nombres: 'Padre Carlos', apellidos: 'Mendoza Ruiz', fechaNacimiento: '1965-03-12', sexo: 'M' },
    { dni: '0801-1975-90002', nombres: 'Padre José', apellidos: 'Aguilar Vega', fechaNacimiento: '1975-06-22', sexo: 'M' },
    { dni: '0801-1958-90003', nombres: 'Monseñor Arturo', apellidos: 'Paz Cárcamo', fechaNacimiento: '1958-11-30', sexo: 'M' },
    { dni: '0801-1978-90004', nombres: 'Diácono Luis', apellidos: 'Reyes Galo', fechaNacimiento: '1978-04-18', sexo: 'M' },
    { dni: '0801-1988-90101', nombres: 'Ana Lucía', apellidos: 'Bonilla Paz', fechaNacimiento: '1988-08-14', sexo: 'F' },
    { dni: '0801-1992-90102', nombres: 'José Andrés', apellidos: 'Bonilla Paz', fechaNacimiento: '1992-02-03', sexo: 'M' },
    { dni: '0801-2010-90103', nombres: 'Sofía', apellidos: 'Bonilla Flores', fechaNacimiento: '2010-05-19', sexo: 'F' },
    { dni: '0801-1980-90104', nombres: 'María Teresa', apellidos: 'Flores', fechaNacimiento: '1980-09-21', sexo: 'F' },
    { dni: '0801-1985-90105', nombres: 'Pedro Pablo', apellidos: 'Reyes', fechaNacimiento: '1985-07-04', sexo: 'M' },
    { dni: '0801-1991-90106', nombres: 'Camila Andrea', apellidos: 'Reyes', fechaNacimiento: '1991-12-12', sexo: 'F' },
    { dni: '0801-2015-90107', nombres: 'Mateo', apellidos: 'Reyes', fechaNacimiento: '2015-04-07', sexo: 'M' },
    { dni: '0801-1982-90108', nombres: 'Rosa Elena', apellidos: 'Herrera', fechaNacimiento: '1982-10-30', sexo: 'F' },
    { dni: '0801-1960-90109', nombres: 'Andrés', apellidos: 'Bonilla', fechaNacimiento: '1960-01-25', sexo: 'M' },
    { dni: '0801-1965-90110', nombres: 'Lucía', apellidos: 'Paz', fechaNacimiento: '1965-08-08', sexo: 'F' },
    { dni: '0801-1987-90111', nombres: 'Jorge Luis', apellidos: 'Castillo', fechaNacimiento: '1987-03-15', sexo: 'M' },
    { dni: '0801-1989-90112', nombres: 'Daniela', apellidos: 'Mendoza', fechaNacimiento: '1989-11-02', sexo: 'F' },
    { dni: '0801-2007-90113', nombres: 'Emiliano', apellidos: 'Castillo Mendoza', fechaNacimiento: '2007-06-20', sexo: 'M' },
    { dni: '0801-2008-90114', nombres: 'Isabella', apellidos: 'Castillo Mendoza', fechaNacimiento: '2008-09-12', sexo: 'F' },
  ];

  for (const p of personasData) {
    await ensurePersona(parish.id_parroquia, sector.id_sector_parroquial, ordenDiocesana.id_orden_religiosa, p);
  }
  console.log(`✓ ${personasData.length} personas demo`);

  // Clero: asignar personas a cargos
  await ensureClero(parish.id_parroquia, rangoSacerdote.id_rango_sacerdotal, ordenDiocesana.id_orden_religiosa, '0801-1965-90001', true); // párroco
  await ensureClero(parish.id_parroquia, rangoSacerdote.id_rango_sacerdotal, ordenDiocesana.id_orden_religiosa, '0801-1975-90002');
  await ensureClero(parish.id_parroquia, rangoObispo.id_rango_sacerdotal, ordenDiocesana.id_orden_religiosa, '0801-1958-90003');
  await ensureClero(parish.id_parroquia, rangoDiacono.id_rango_sacerdotal, ordenDiocesana.id_orden_religiosa, '0801-1978-90004');
  console.log('✓ 4 ministros (1 párroco, 1 sacerdote adjunto, 1 obispo, 1 diácono)');

  // Numeradores
  await ensureNumerador(parish.id_parroquia, 'bautismo', { libro: 12, folio: 100, acta: 0, registro: 480 });
  await ensureNumerador(parish.id_parroquia, 'primera_comunion', { libro: 8, folio: 95, acta: 320, registro: 300 });
  await ensureNumerador(parish.id_parroquia, 'confirmacion', { libro: 7, folio: 80, acta: 260, registro: 250 });
  await ensureNumerador(parish.id_parroquia, 'matrimonio', { libro: 5, folio: 50, acta: 180, registro: 180 });
  console.log('✓ Numeradores inicializados');

  // sacramentos demo (idempotente por unique constraint (parroquia, libro, pagina, registro))

// Bautismos
  await prisma.bautismo.upsert({
    where: {
      id_parroquia_numero_libro_numero_pagina_numero_registro: {
        id_parroquia: parish.id_parroquia,
        numero_libro: '12',
        numero_pagina: '50',
        numero_registro: '480',
      },
    },
    update: {},
    create: {
      id_parroquia: parish.id_parroquia,
      numero_identidad_bautizado: '0801-2010-90103',
      numero_identidad_madre: '0801-1988-90101',
      numero_identidad_padre: '0801-1985-90105',
      numero_identidad_madrina: '0801-1980-90104',
      numero_identidad_padrino: '0801-1982-90108',
      numero_identidad_catequista: '0801-1992-90102',
      numero_identidad_sacerdote: '0801-1965-90001',
      fecha_bautismo: new Date('2012-05-12T10:00:00Z'),
      numero_folio: '12',
      numero_libro: '12',
      numero_pagina: '50',
      numero_registro: '480',
      nota_marginal: 'Bautismo de prueba (demo)',
    },
  });
  await prisma.bautismo.upsert({
    where: {
      id_parroquia_numero_libro_numero_pagina_numero_registro: {
        id_parroquia: parish.id_parroquia,
        numero_libro: '8',
        numero_pagina: '40',
        numero_registro: '320',
      },
    },
    update: {},
    create: {
      id_parroquia: parish.id_parroquia,
      numero_identidad_bautizado: '0801-2007-90113',
      numero_identidad_madre: '0801-1989-90112',
      numero_identidad_padre: '0801-1987-90111',
      numero_identidad_madrina: '0801-1988-90101',
      numero_identidad_padrino: '0801-1965-90001',
      numero_identidad_catequista: '0801-1978-90004',
      numero_identidad_sacerdote: '0801-1975-90002',
      fecha_bautismo: new Date('2007-09-22T11:00:00Z'),
      numero_folio: '8',
      numero_libro: '8',
      numero_pagina: '40',
      numero_registro: '320',
      nota_marginal: 'Bautismo de prueba (demo)',
    },
  });

  // Primeras comuniones
  await prisma.primeraComunion.upsert({
    where: {
      id_parroquia_numero_libro_numero_pagina_numero_registro: {
        id_parroquia: parish.id_parroquia,
        numero_libro: '4',
        numero_pagina: '20',
        numero_registro: '85',
      },
    },
    update: {},
    create: {
      id_parroquia: parish.id_parroquia,
      numero_identidad_persona: '0801-2007-90113',
      numero_identidad_madre: '0801-1989-90112',
      numero_identidad_padre: '0801-1987-90111',
      numero_identidad_catequista: '0801-1978-90004',
      numero_identidad_sacerdote: '0801-1965-90001',
      fecha_primera_comunion: new Date('2018-06-15T18:00:00Z'),
      numero_acta: '15',
      numero_libro: '4',
      numero_pagina: '20',
      numero_registro: '85',
      nota_marginal: 'Primera comunión de prueba (demo)',
    },
  });
  await prisma.primeraComunion.upsert({
    where: {
      id_parroquia_numero_libro_numero_pagina_numero_registro: {
        id_parroquia: parish.id_parroquia,
        numero_libro: '4',
        numero_pagina: '21',
        numero_registro: '86',
      },
    },
    update: {},
    create: {
      id_parroquia: parish.id_parroquia,
      numero_identidad_persona: '0801-2008-90114',
      numero_identidad_madre: '0801-1989-90112',
      numero_identidad_padre: '0801-1987-90111',
      numero_identidad_catequista: '0801-1978-90004',
      numero_identidad_sacerdote: '0801-1975-90002',
      fecha_primera_comunion: new Date('2019-06-08T18:00:00Z'),
      numero_acta: '16',
      numero_libro: '4',
      numero_pagina: '21',
      numero_registro: '86',
      nota_marginal: 'Primera comunión de prueba (demo)',
    },
  });

  // Confirmaciones
  await prisma.confirmacion.upsert({
    where: {
      id_parroquia_numero_libro_numero_pagina_numero_registro: {
        id_parroquia: parish.id_parroquia,
        numero_libro: '3',
        numero_pagina: '15',
        numero_registro: '60',
      },
    },
    update: {},
    create: {
      id_parroquia: parish.id_parroquia,
      numero_identidad_confirmado: '0801-1988-90101',
      numero_identidad_madre: '0801-1965-90110',
      numero_identidad_padre: '0801-1960-90109',
      numero_identidad_madrina: '0801-1982-90108',
      numero_identidad_padrino: '0801-1985-90105',
      numero_identidad_catequista: '0801-1978-90004',
      numero_identidad_obispo: '0801-1958-90003',
      fecha_confirmacion: new Date('2006-09-15T11:00:00Z'),
      numero_acta: '12',
      numero_libro: '3',
      numero_pagina: '15',
      numero_registro: '60',
      nota_marginal: 'Confirmación de prueba (demo)',
    },
  });
  await prisma.confirmacion.upsert({
    where: {
      id_parroquia_numero_libro_numero_pagina_numero_registro: {
        id_parroquia: parish.id_parroquia,
        numero_libro: '2',
        numero_pagina: '12',
        numero_registro: '50',
      },
    },
    update: {},
    create: {
      id_parroquia: parish.id_parroquia,
      numero_identidad_confirmado: '0801-1985-90105',
      numero_identidad_madre: '0801-1965-90110',
      numero_identidad_padre: '0801-1960-90109',
      numero_identidad_madrina: '0801-1988-90101',
      numero_identidad_padrino: '0801-1982-90108',
      numero_identidad_catequista: '0801-1978-90004',
      numero_identidad_obispo: '0801-1958-90003',
      fecha_confirmacion: new Date('2002-08-10T10:30:00Z'),
      numero_acta: '9',
      numero_libro: '2',
      numero_pagina: '12',
      numero_registro: '50',
      nota_marginal: 'Confirmación de prueba (demo)',
    },
  });

  // Matrimonio
  await prisma.matrimonio.upsert({
    where: {
      id_parroquia_numero_libro_numero_pagina_numero_registro: {
        id_parroquia: parish.id_parroquia,
        numero_libro: '3',
        numero_pagina: '22',
        numero_registro: '88',
      },
    },
    update: {},
    create: {
      id_parroquia: parish.id_parroquia,
      numero_identidad_esposa: '0801-1988-90101',
      numero_identidad_esposo: '0801-1985-90105',
      numero_identidad_madrina: '0801-1982-90108',
      numero_identidad_padrino: '0801-1960-90109',
      numero_identidad_sacerdote: '0801-1965-90001',
      numero_identidad_madre_esposa: '0801-1965-90110',
      numero_identidad_padre_esposa: '0801-1960-90109',
      numero_identidad_madre_esposo: null,
      numero_identidad_padre_esposo: null,
      fecha_matrimonio: new Date('2016-04-16T17:00:00Z'),
      numero_acta: '40',
      numero_libro: '3',
      numero_pagina: '22',
      numero_registro: '88',
      nota_marginal: 'Matrimonio de prueba (demo)',
    },
  });
  console.log('✓ Sacramentos demo: 2 bautismos, 2 primeras comuniones, 2 confirmaciones, 1 matrimonio');

  // Una plantilla de constancia por defecto (placeholder funcional)
  // El backend ya tiene fallback a plantilla hardcoded si la BD está vacía,
  // pero dejamos una textual para hacer visible la personalización.
  await prisma.plantillaConstancia.upsert({
    where: {
      id_parroquia_sacramento_nombre: {
        id_parroquia: parish.id_parroquia,
        sacramento: 'bautismo',
        nombre: 'Plantilla demo Bautismo',
      },
    },
    update: {},
    create: {
      id_parroquia: parish.id_parroquia,
      sacramento: 'bautismo',
      nombre: 'Plantilla demo Bautismo',
      contenido:
        'La parroquia {{parroquia.nombre}} certifica que {{persona.nombre_completo}} ' +
        '(DNI {{persona.dni}}) recibió el sacramento del Bautismo el {{fecha_sacramento}} ' +
        'ante el ministro {{sacerdote.nombre}}, ' +
        'quedando registrado en el libro {{libro}}, página {{pagina}}, registro {{registro}}.',
      activo: true,
    },
  });
  await prisma.plantillaConstancia.upsert({
    where: {
      id_parroquia_sacramento_nombre: {
        id_parroquia: parish.id_parroquia,
        sacramento: 'matrimonio',
        nombre: 'Plantilla demo Matrimonio',
      },
    },
    update: {},
    create: {
      id_parroquia: parish.id_parroquia,
      sacramento: 'matrimonio',
      nombre: 'Plantilla demo Matrimonio',
      contenido:
        'La parroquia {{parroquia.nombre}} certifica que {{persona.nombre_completo}} ' +
        '(DNI {{persona.dni}}) y {{conyuge.nombre_completo}} (DNI {{conyuge.dni}}) ' +
        'contrajeron el sacramento del Matrimonio el {{fecha_sacramento}}, ' +
        'ante el ministro {{sacerdote.nombre}}. ' +
        'Registrados en el libro {{libro}}, página {{pagina}}, registro {{registro}}.',
      activo: true,
    },
  });
  console.log('✓ Plantillas de constancia demo');

  console.log('Demo seed completado.');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Demo seed failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
