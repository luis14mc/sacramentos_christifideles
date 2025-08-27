import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear departamentos de Honduras
  console.log('📍 Creando departamentos...');
  await prisma.departamento.createMany({
    data: [
      { codigo_departamento: '01', nombre_departamento: 'Atlántida' },
      { codigo_departamento: '02', nombre_departamento: 'Choluteca' },
      { codigo_departamento: '03', nombre_departamento: 'Colón' },
      { codigo_departamento: '04', nombre_departamento: 'Comayagua' },
      { codigo_departamento: '05', nombre_departamento: 'Copán' },
      { codigo_departamento: '06', nombre_departamento: 'Cortés' },
      { codigo_departamento: '07', nombre_departamento: 'El Paraíso' },
      { codigo_departamento: '08', nombre_departamento: 'Francisco Morazán' },
    ],
    skipDuplicates: true
  });

  // 2. Crear municipios
  console.log('🏘️ Creando municipios...');
  await prisma.municipio.createMany({
    data: [
      { codigo_municipio: '0801', codigo_departamento: '08', nombre_municipio: 'Distrito Central' },
      { codigo_municipio: '0802', codigo_departamento: '08', nombre_municipio: 'Alubarén' },
      { codigo_municipio: '0601', codigo_departamento: '06', nombre_municipio: 'San Pedro Sula' },
      { codigo_municipio: '0602', codigo_departamento: '06', nombre_municipio: 'Choloma' },
    ],
    skipDuplicates: true
  });

  // 3. Crear órdenes religiosas
  console.log('⛪ Creando órdenes religiosas...');
  await prisma.ordenReligiosa.createMany({
    data: [
      { nombre: 'Diocesano', abreviatura: 'DIOC', rama: 'M', descripcion: 'Clero diocesano' },
      { nombre: 'Franciscanos', abreviatura: 'OFM', rama: 'M', descripcion: 'Orden Franciscana' },
      { nombre: 'Laicos', abreviatura: 'LAI', rama: 'N', descripcion: 'Fieles laicos' }
    ],
    skipDuplicates: true
  });

  // 4. Crear rangos sacerdotales
  console.log('👨‍💼 Creando rangos sacerdotales...');
  await prisma.rangoOrdenSacerdotal.createMany({
    data: [
      { nombre: 'Obispo', descripcion: 'Obispo de la Diócesis' },
      { nombre: 'Párroco', descripcion: 'Párroco de la Parroquia' },
      { nombre: 'Vicario', descripcion: 'Vicario Parroquial' },
      { nombre: 'Diácono', descripcion: 'Diácono Permanente' }
    ],
    skipDuplicates: true
  });

  // 5. Crear tipos de sector parroquial
  console.log('🏛️ Creando tipos de sector...');
  await prisma.tipoSectorParroquial.createMany({
    data: [
      { nombre: 'Capilla', descripcion: 'Capilla filial de la parroquia' },
      { nombre: 'Comunidad', descripcion: 'Comunidad cristiana' },
      { nombre: 'Sector urbano', descripcion: 'Sector urbano de la parroquia' },
      { nombre: 'Sector rural', descripcion: 'Sector rural de la parroquia' }
    ],
    skipDuplicates: true
  });

  // 6. Crear grupos parroquiales
  console.log('👥 Creando grupos parroquiales...');
  await prisma.grupoParroquial.createMany({
    data: [
      { nombre: 'Consejo Parroquial', descripcion: 'Consejo de coordinación parroquial' },
      { nombre: 'Catequistas', descripcion: 'Grupo de catequistas' },
      { nombre: 'Coro', descripcion: 'Coro parroquial' },
      { nombre: 'Juventud', descripcion: 'Pastoral juvenil' }
    ],
    skipDuplicates: true
  });

  // 7. Crear roles parroquiales
  console.log('🎭 Creando roles parroquiales...');
  await prisma.rolParroquial.createMany({
    data: [
      { nombre: 'Coordinador', descripcion: 'Coordinador del grupo' },
      { nombre: 'Secretario', descripcion: 'Secretario del grupo' },
      { nombre: 'Miembro activo', descripcion: 'Miembro activo del grupo' }
    ],
    skipDuplicates: true
  });

  // 8. Crear roles de usuario del sistema
  console.log('🔐 Creando roles de usuario...');
  await prisma.rolUsuario.createMany({
    data: [
      { nombre: 'Super Admin', descripcion: 'Administrador del sistema completo', estado: 1, id_usuario_creacion: 1 },
      { nombre: 'Admin Parroquia', descripcion: 'Administrador de la parroquia', estado: 1, id_usuario_creacion: 1 },
      { nombre: 'Secretario', descripcion: 'Secretario parroquial', estado: 1, id_usuario_creacion: 1 },
      { nombre: 'Solo Lectura', descripcion: 'Solo consulta de información', estado: 1, id_usuario_creacion: 1 }
    ],
    skipDuplicates: true
  });

  // 9. Crear páginas del sistema
  console.log('📄 Creando páginas del sistema...');
  await prisma.pagina.createMany({
    data: [
      { nombre: 'Dashboard', descripcion: 'Panel principal', url: '/dashboard', estado: 1, id_usuario_creacion: 1 },
      { nombre: 'Personas', descripcion: 'Gestión de personas', url: '/personas', estado: 1, id_usuario_creacion: 1 },
      { nombre: 'Bautismos', descripcion: 'Registro de bautismos', url: '/bautismos', estado: 1, id_usuario_creacion: 1 },
      { nombre: 'Primera Comunión', descripcion: 'Registro de primeras comuniones', url: '/primera-comunion', estado: 1, id_usuario_creacion: 1 },
      { nombre: 'Confirmaciones', descripcion: 'Registro de confirmaciones', url: '/confirmaciones', estado: 1, id_usuario_creacion: 1 },
      { nombre: 'Matrimonios', descripcion: 'Registro de matrimonios', url: '/matrimonios', estado: 1, id_usuario_creacion: 1 },
      { nombre: 'Constancias', descripcion: 'Generación de constancias', url: '/constancias', estado: 1, id_usuario_creacion: 1 },
      { nombre: 'Usuarios', descripcion: 'Gestión de usuarios', url: '/usuarios', estado: 1, id_usuario_creacion: 1 }
    ],
    skipDuplicates: true
  });

  // 10. Crear parroquia de ejemplo
  console.log('⛪ Creando parroquia de ejemplo...');
  const parroquia = await prisma.parroquia.upsert({
    where: { id_parroquia: 1 },
    update: {},
    create: {
      nombre: 'Parroquia San José',
      ubicacion: '0801', // Distrito Central
      direccion: 'Barrio El Centro, Tegucigalpa',
      telefono: '+504 2222-3333',
      email: 'parroquia.sanjose@gmail.com'
    }
  });

  // 11. Crear configuración de la parroquia
  await prisma.parroquiaConfig.upsert({
    where: { id_parroquia: 1 },
    update: {},
    create: {
      id_parroquia: 1,
      alias_liturgico: 'Parroquia San José - Tegucigalpa',
      tz: 'America/Tegucigalpa',
      idioma: 'es',
      opciones: {
        tema_color: '#1e40af',
        logo_visible: true,
        pie_constancia: 'En el nombre del Padre, del Hijo y del Espíritu Santo'
      }
    }
  });

  // 12. Crear sectores de la parroquia
  console.log('🏘️ Creando sectores parroquiales...');
  await prisma.sectorParroquial.createMany({
    data: [
      {
        id_parroquia: 1,
        id_tipo_sector_parroquial: 1,
        nombre: 'Centro',
        nombre_capilla: 'Templo Principal',
        direccion: 'Centro de Tegucigalpa'
      },
      {
        id_parroquia: 1,
        id_tipo_sector_parroquial: 1,
        nombre: 'El Bosque',
        nombre_capilla: 'Capilla El Bosque',
        direccion: 'Colonia El Bosque, Tegucigalpa'
      }
    ],
    skipDuplicates: true
  });

  // 13. Crear numeradores para la parroquia
  await prisma.numeradores.createMany({
    data: [
      { id_parroquia: 1, modulo: 'bautismo', scope: 'general', ultimo_libro: 1, ultimo_folio: 0, ultimo_acta: 0, ultimo_registro: 0 },
      { id_parroquia: 1, modulo: 'primera_comunion', scope: 'general', ultimo_libro: 1, ultimo_folio: 0, ultimo_acta: 0, ultimo_registro: 0 },
      { id_parroquia: 1, modulo: 'confirmacion', scope: 'general', ultimo_libro: 1, ultimo_folio: 0, ultimo_acta: 0, ultimo_registro: 0 },
      { id_parroquia: 1, modulo: 'matrimonio', scope: 'general', ultimo_libro: 1, ultimo_folio: 0, ultimo_acta: 0, ultimo_registro: 0 }
    ],
    skipDuplicates: true
  });

  // 14. Crear usuario administrador
  console.log('👤 Creando usuario administrador...');
  const hashedPassword = await hash('admin123', 12);
  
  await prisma.usuario.upsert({
    where: { id_usuario: 1 },
    update: {},
    create: {
      id_parroquia: 1,
      id_rol: 1, // Super Admin
      nombre: 'Administrador del Sistema',
      email: 'admin@christifideles.com',
      contrasena: Buffer.from(hashedPassword),
      telefono: '+504 9999-0000',
      estado: 1,
      id_usuario_creacion: 1
    }
  });

  console.log('✅ Seed completado exitosamente!');
  console.log('🔑 Usuario admin creado: admin@christifideles.com / admin123');
  console.log('⛪ Parroquia San José creada con sectores');
  console.log('📊 Base de datos lista para usar en Neon');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
