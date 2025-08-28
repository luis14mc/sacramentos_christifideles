import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear departamentos de Honduras (todos)
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

  // 2. Crear municipios principales de Honduras
  console.log('🏘️ Creando municipios...');
  const municipios = [
    // Francisco Morazán (principales)
    { codigo: '0801', departamento: '08', nombre: 'Distrito Central' },
    { codigo: '0802', departamento: '08', nombre: 'Alubarén' },
    { codigo: '0803', departamento: '08', nombre: 'Cedros' },
    { codigo: '0804', departamento: '08', nombre: 'Curarén' },
    { codigo: '0805', departamento: '08', nombre: 'El Porvenir' },
    { codigo: '0806', departamento: '08', nombre: 'Guaimaca' },
    { codigo: '0807', departamento: '08', nombre: 'La Libertad' },
    { codigo: '0808', departamento: '08', nombre: 'La Venta' },
    { codigo: '0809', departamento: '08', nombre: 'Lepaterique' },
    { codigo: '0810', departamento: '08', nombre: 'Maraita' },
    { codigo: '0811', departamento: '08', nombre: 'Marale' },
    { codigo: '0812', departamento: '08', nombre: 'Nueva Armenia' },
    { codigo: '0813', departamento: '08', nombre: 'Ojojona' },
    { codigo: '0814', departamento: '08', nombre: 'Orica' },
    { codigo: '0815', departamento: '08', nombre: 'Reitoca' },
    { codigo: '0816', departamento: '08', nombre: 'Sabanagrande' },
    { codigo: '0817', departamento: '08', nombre: 'San Antonio de Oriente' },
    { codigo: '0818', departamento: '08', nombre: 'San Buenaventura' },
    { codigo: '0819', departamento: '08', nombre: 'San Ignacio' },
    { codigo: '0820', departamento: '08', nombre: 'San Juan de Flores' },
    { codigo: '0821', departamento: '08', nombre: 'San Miguelito' },
    { codigo: '0822', departamento: '08', nombre: 'Santa Ana' },
    { codigo: '0823', departamento: '08', nombre: 'Santa Lucía' },
    { codigo: '0824', departamento: '08', nombre: 'Talanga' },
    { codigo: '0825', departamento: '08', nombre: 'Tatumbla' },
    { codigo: '0826', departamento: '08', nombre: 'Valle de Ángeles' },
    { codigo: '0827', departamento: '08', nombre: 'Villa de San Francisco' },
    { codigo: '0828', departamento: '08', nombre: 'Vallecillo' },
    
    // Cortés
    { codigo: '0601', departamento: '06', nombre: 'San Pedro Sula' },
    { codigo: '0602', departamento: '06', nombre: 'Choloma' },
    { codigo: '0603', departamento: '06', nombre: 'Omoa' },
    { codigo: '0604', departamento: '06', nombre: 'Pimienta' },
    { codigo: '0605', departamento: '06', nombre: 'Potrerillos' },
    { codigo: '0606', departamento: '06', nombre: 'Puerto Cortés' },
    { codigo: '0607', departamento: '06', nombre: 'San Antonio de Cortés' },
    { codigo: '0608', departamento: '06', nombre: 'San Francisco de Yojoa' },
    { codigo: '0609', departamento: '06', nombre: 'San Manuel' },
    { codigo: '0610', departamento: '06', nombre: 'Santa Cruz de Yojoa' },
    { codigo: '0611', departamento: '06', nombre: 'Villanueva' },
    { codigo: '0612', departamento: '06', nombre: 'La Lima' },
    
    // Atlántida
    { codigo: '0101', departamento: '01', nombre: 'La Ceiba' },
    { codigo: '0102', departamento: '01', nombre: 'El Porvenir' },
    { codigo: '0103', departamento: '01', nombre: 'Esparta' },
    { codigo: '0104', departamento: '01', nombre: 'Jutiapa' },
    { codigo: '0105', departamento: '01', nombre: 'La Masica' },
    { codigo: '0106', departamento: '01', nombre: 'San Francisco' },
    { codigo: '0107', departamento: '01', nombre: 'Tela' },
    { codigo: '0108', departamento: '01', nombre: 'Arizona' },
    
    // Choluteca
    { codigo: '0201', departamento: '02', nombre: 'Choluteca' },
    { codigo: '0202', departamento: '02', nombre: 'Apacilagua' },
    { codigo: '0203', departamento: '02', nombre: 'Concepción de María' },
    { codigo: '0204', departamento: '02', nombre: 'Duyure' },
    { codigo: '0205', departamento: '02', nombre: 'El Corpus' },
    
    // Otros departamentos (municipios principales)
    { codigo: '0301', departamento: '03', nombre: 'Trujillo' },
    { codigo: '0401', departamento: '04', nombre: 'Comayagua' },
    { codigo: '0501', departamento: '05', nombre: 'Santa Rosa de Copán' },
    { codigo: '0701', departamento: '07', nombre: 'Yuscarán' },
    { codigo: '0901', departamento: '09', nombre: 'Puerto Lempira' },
    { codigo: '1001', departamento: '10', nombre: 'La Esperanza' },
    { codigo: '1101', departamento: '11', nombre: 'Roatán' },
    { codigo: '1201', departamento: '12', nombre: 'La Paz' },
    { codigo: '1301', departamento: '13', nombre: 'Gracias' },
    { codigo: '1401', departamento: '14', nombre: 'Ocotepeque' },
    { codigo: '1501', departamento: '15', nombre: 'Juticalpa' },
    { codigo: '1601', departamento: '16', nombre: 'Santa Bárbara' },
    { codigo: '1701', departamento: '17', nombre: 'Nacaome' },
    { codigo: '1801', departamento: '18', nombre: 'Yoro' }
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

  // 12. Crear sectores parroquiales específicos
  console.log('🏘️ Creando sectores parroquiales...');
  const sectoresParroquiales = [
    { nombre: 'Sede Parroquial', descripcion: 'Templo principal de la parroquia' },
    { nombre: 'Altos de Loarque', descripcion: 'Sector Altos de Loarque' },
    { nombre: 'Yaguacire', descripcion: 'Comunidad de Yaguacire' },
    { nombre: 'Fuerza Aérea', descripcion: 'Sector Fuerza Aérea' }
  ];

  for (const sector of sectoresParroquiales) {
    await prisma.sectorParroquial.upsert({
      where: { id_sector_parroquial: sectoresParroquiales.indexOf(sector) + 1 },
      update: {},
      create: {
        id_parroquia: parroquia.id_parroquia,
        id_tipo_sector_parroquial: 1, // Capilla
        nombre: sector.nombre,
        nombre_capilla: sector.nombre,
        direccion: sector.descripcion
      }
    });
  }

  console.log('✅ Seed completado exitosamente!');
  console.log('⛪ Parroquia San José creada');
  console.log('🏘️ Sectores parroquiales creados:');
  sectoresParroquiales.forEach(sector => {
    console.log(`  - ${sector.nombre}`);
  });
  console.log('📊 Base de datos lista para usar');
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
