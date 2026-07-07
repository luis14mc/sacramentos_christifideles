import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear departamentos de Honduras
  console.log('📍 Creando departamentos...');
  const departamentos = [
    { codigo: '01', nombre: 'Atlántida' },
    { codigo: '02', nombre: 'Choluteca' },
    { codigo: '03', nombre: 'Colón' },
    { codigo: '04', nombre: 'Comayagua' },
    { codigo: '05', nombre: 'Copán' },
    { codigo: '06', nombre: 'Cortés' },
    { codigo: '07', nombre: 'El Paraíso' },
    { codigo: '08', nombre: 'Francisco Morazán' },
    { codigo: '09', nombre: 'Gracias a Dios' },
    { codigo: '10', nombre: 'Intibucá' },
    { codigo: '11', nombre: 'Islas de la Bahía' },
    { codigo: '12', nombre: 'La Paz' },
    { codigo: '13', nombre: 'Lempira' },
    { codigo: '14', nombre: 'Ocotepeque' },
    { codigo: '15', nombre: 'Olancho' },
    { codigo: '16', nombre: 'Santa Bárbara' },
    { codigo: '17', nombre: 'Valle' },
    { codigo: '18', nombre: 'Yoro' }
  ];

  for (const dept of departamentos) {
    await prisma.departamento.upsert({
      where: { codigo_departamento: dept.codigo },
      update: {},
      create: {
        codigo_departamento: dept.codigo,
        nombre_departamento: dept.nombre
      }
    });
  }

  // 2. Crear algunos municipios importantes
  console.log('🏘️ Creando municipios...');
  const municipios = [
    { codigo: '0801', departamento: '08', nombre: 'Distrito Central' },
    { codigo: '0802', departamento: '08', nombre: 'Alubarén' },
    { codigo: '0803', departamento: '08', nombre: 'Cedros' },
    { codigo: '0804', departamento: '08', nombre: 'Curarén' },
    { codigo: '0805', departamento: '08', nombre: 'El Porvenir' },
    { codigo: '0601', departamento: '06', nombre: 'San Pedro Sula' },
    { codigo: '0602', departamento: '06', nombre: 'Choloma' },
    { codigo: '0603', departamento: '06', nombre: 'Omoa' },
    { codigo: '0604', departamento: '06', nombre: 'Pimienta' },
    { codigo: '0605', departamento: '06', nombre: 'Potrerillos' },
  ];

  for (const muni of municipios) {
    await prisma.municipio.upsert({
      where: { codigo_municipio: muni.codigo },
      update: {},
      create: {
        codigo_municipio: muni.codigo,
        codigo_departamento: muni.departamento,
        nombre_municipio: muni.nombre
      }
    });
  }

  // 3. Crear órdenes religiosas
  console.log('⛪ Creando órdenes religiosas...');
  const ordenesReligiosas = [
    { nombre: 'Diocesano', abrev: 'DIOC', rama: 'M' },
    { nombre: 'Franciscanos', abrev: 'OFM', rama: 'M' },
    { nombre: 'Salesianos', abrev: 'SDB', rama: 'M' },
    { nombre: 'Jesuitas', abrev: 'SJ', rama: 'M' },
    { nombre: 'Hermanas de la Caridad', abrev: 'HC', rama: 'F' },
    { nombre: 'Laicos', abrev: 'LAI', rama: 'N' }
  ];

  for (const orden of ordenesReligiosas) {
    await prisma.ordenReligiosa.upsert({
      where: { id_orden_religiosa: ordenesReligiosas.indexOf(orden) + 1 },
      update: {},
      create: {
        nombre: orden.nombre,
        abreviatura: orden.abrev,
        rama: orden.rama,
        descripcion: `Orden religiosa ${orden.nombre}`
      }
    });
  }

  // 4. Crear rangos sacerdotales
  console.log('👨‍💼 Creando rangos sacerdotales...');
  const rangos = [
    { nombre: 'Obispo', desc: 'Obispo de la Diócesis' },
    { nombre: 'Párroco', desc: 'Párroco de la Parroquia' },
    { nombre: 'Vicario', desc: 'Vicario Parroquial' },
    { nombre: 'Diácono', desc: 'Diácono Permanente' },
    { nombre: 'Seminarista', desc: 'Seminarista en formación' }
  ];

  for (const rango of rangos) {
    await prisma.rangoOrdenSacerdotal.upsert({
      where: { id_rango_sacerdotal: rangos.indexOf(rango) + 1 },
      update: {},
      create: {
        nombre: rango.nombre,
        descripcion: rango.desc
      }
    });
  }

  // 5. Crear tipos de sector parroquial
  console.log('🏛️ Creando tipos de sector...');
  const tiposSector = [
    { nombre: 'Capilla', desc: 'Capilla filial de la parroquia' },
    { nombre: 'Comunidad', desc: 'Comunidad cristiana' },
    { nombre: 'Sector urbano', desc: 'Sector urbano de la parroquia' },
    { nombre: 'Sector rural', desc: 'Sector rural de la parroquia' }
  ];

  for (const tipo of tiposSector) {
    await prisma.tipoSectorParroquial.upsert({
      where: { id_tipo_sector_parroquial: tiposSector.indexOf(tipo) + 1 },
      update: {},
      create: {
        nombre: tipo.nombre,
        descripcion: tipo.desc
      }
    });
  }

  // 6. Crear grupos parroquiales
  console.log('👥 Creando grupos parroquiales...');
  const grupos = [
    { nombre: 'Consejo Parroquial', desc: 'Consejo de coordinación parroquial' },
    { nombre: 'Catequistas', desc: 'Grupo de catequistas' },
    { nombre: 'Coro', desc: 'Coro parroquial' },
    { nombre: 'Juventud', desc: 'Pastoral juvenil' },
    { nombre: 'Caritas', desc: 'Pastoral social' },
    { nombre: 'Lectores', desc: 'Ministerio de la Palabra' }
  ];

  for (const grupo of grupos) {
    await prisma.grupoParroquial.upsert({
      where: { id_grupo_parroquial: grupos.indexOf(grupo) + 1 },
      update: {},
      create: {
        nombre: grupo.nombre,
        descripcion: grupo.desc
      }
    });
  }

  // 7. Crear roles parroquiales
  console.log('🎭 Creando roles parroquiales...');
  const roles = [
    { nombre: 'Coordinador', desc: 'Coordinador del grupo' },
    { nombre: 'Secretario', desc: 'Secretario del grupo' },
    { nombre: 'Tesorero', desc: 'Tesorero del grupo' },
    { nombre: 'Miembro activo', desc: 'Miembro activo del grupo' },
    { nombre: 'Colaborador', desc: 'Colaborador eventual' }
  ];

  for (const rol of roles) {
    await prisma.rolParroquial.upsert({
      where: { id_rol_parroquial: roles.indexOf(rol) + 1 },
      update: {},
      create: {
        nombre: rol.nombre,
        descripcion: rol.desc
      }
    });
  }

  // 8. Crear roles de usuario del sistema
  console.log('🔐 Creando roles de usuario...');
  const rolesUsuario = [
    { nombre: 'Super Admin', desc: 'Administrador del sistema completo' },
    { nombre: 'Admin Parroquia', desc: 'Administrador de la parroquia' },
    { nombre: 'Secretario', desc: 'Secretario parroquial' },
    { nombre: 'Catequista', desc: 'Usuario catequista' },
    { nombre: 'Solo Lectura', desc: 'Solo consulta de información' }
  ];

  for (const rol of rolesUsuario) {
    await prisma.rolUsuario.upsert({
      where: { id_rol: rolesUsuario.indexOf(rol) + 1 },
      update: {},
      create: {
        nombre: rol.nombre,
        descripcion: rol.desc,
        estado: 1,
        id_usuario_creacion: 1
      }
    });
  }

  // 9. Crear páginas del sistema
  console.log('📄 Creando páginas del sistema...');
  const paginas = [
    { nombre: 'Dashboard', desc: 'Panel principal', url: '/dashboard' },
    { nombre: 'Personas', desc: 'Gestión de personas', url: '/personas' },
    { nombre: 'Bautismos', desc: 'Registro de bautismos', url: '/bautismos' },
    { nombre: 'Primera Comunión', desc: 'Registro de primeras comuniones', url: '/primera-comunion' },
    { nombre: 'Confirmaciones', desc: 'Registro de confirmaciones', url: '/confirmaciones' },
    { nombre: 'Matrimonios', desc: 'Registro de matrimonios', url: '/matrimonios' },
    { nombre: 'Constancias', desc: 'Generación de constancias', url: '/constancias' },
    { nombre: 'Reportes', desc: 'Reportes y estadísticas', url: '/reportes' },
    { nombre: 'Configuración', desc: 'Configuración del sistema', url: '/configuracion' },
    { nombre: 'Usuarios', desc: 'Gestión de usuarios', url: '/usuarios' }
  ];

  for (const pagina of paginas) {
    await prisma.pagina.upsert({
      where: { id_pagina: paginas.indexOf(pagina) + 1 },
      update: {},
      create: {
        nombre: pagina.nombre,
        descripcion: pagina.desc,
        url: pagina.url,
        estado: 1,
        id_usuario_creacion: 1
      }
    });
  }

  // 10. Crear parroquia de ejemplo
  console.log('⛪ Creando parroquia piloto...');
  await prisma.parroquia.upsert({
    where: { id_parroquia: 1 },
    update: {},
    create: {
      nombre: 'Parroquia Cristo Resucitado',
      ubicacion: '0801', // Distrito Central
      direccion: 'Barrio El Centro, Tegucigalpa',
      telefono: '+504 2222-3333',
      email: 'parroquia.cristoresucitado@gmail.com'
    }
  });

  // 11. Crear configuración de la parroquia
  await prisma.parroquiaConfig.upsert({
    where: { id_parroquia: 1 },
    update: {},
    create: {
      id_parroquia: 1,
      alias_liturgico: 'Parroquia Cristo Resucitado - Tegucigalpa',
      tz: 'America/Tegucigalpa',
      idioma: 'es',
      opciones: {
        tema_color: '#7f1d1d',
        logo_visible: true,
        pie_constancia: 'En el nombre del Padre, del Hijo y del Espíritu Santo'
      }
    }
  });

  // 12. Crear usuario administrador
  console.log('👤 Creando usuario administrador...');
  const hashedPassword = await hash('admin123', 10);
  
  await prisma.usuario.upsert({
    where: { email: 'admin@christifideles.com' },
    update: {},
    create: {
      id_parroquia: 1,
      id_rol: 1, // Super Admin
      nombre: 'Administrador Sistema',
      email: 'admin@christifideles.com',
      contrasena: Buffer.from(hashedPassword),
      telefono: '+504 2222-3333',
      estado: 1,
      id_usuario_creacion: 1
    }
  });

  console.log('✅ Seed completado exitosamente!');
  console.log('⛪ Parroquia Cristo Resucitado creada');
  console.log('👤 Usuario admin@christifideles.com / admin123');
  console.log('📊 Base de datos lista para usar en Neon');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
