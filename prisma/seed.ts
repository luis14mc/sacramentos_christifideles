import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Sembrando datos iniciales...')

  // Crear departamento
  const departamento = await prisma.departamento.create({
    data: {
      codigoDepartamento: '01',
      nombreDepartamento: 'Francisco Morazán'
    }
  })

  // Crear municipio
  const municipio = await prisma.municipio.create({
    data: {
      codigoMunicipio: '0801',
      codigoDepartamento: '01',
      nombreMunicipio: 'Tegucigalpa'
    }
  })

  // Crear orden religiosa
  const ordenReligiosa = await prisma.ordenReligiosa.create({
    data: {
      nombre: 'Clero Diocesano',
      abreviatura: 'CD',
      rama: 'M'
    }
  })

  // Crear rango sacerdotal
  const rangoSacerdotal = await prisma.rangoOrdenSacerdotal.create({
    data: {
      nombre: 'Presbítero',
      descripcion: 'Sacerdote ordenado'
    }
  })

  // Crear tipo de sector
  const tipoSector = await prisma.tipoSectorParroquial.create({
    data: {
      nombre: 'Parroquia Central',
      descripcion: 'Sector principal de la parroquia'
    }
  })

  // Crear parroquia
  const parroquia = await prisma.parroquia.create({
    data: {
      nombre: 'Cristo Resucitado',
      ubicacion: '0801',
      direccion: 'Col. Kennedy, Tegucigalpa',
      telefono: '2234-5678',
      email: 'cristo.resucitado@iglesia.hn'
    }
  })

  // Crear configuración de parroquia
  await prisma.parroquiaConfig.create({
    data: {
      idParroquia: parroquia.idParroquia,
      aliasLiturgico: 'Parroquia Cristo Resucitado',
      tz: 'America/Tegucigalpa',
      idioma: 'es'
    }
  })

  // Crear sector parroquial
  const sector = await prisma.sectorParroquial.create({
    data: {
      idParroquia: parroquia.idParroquia,
      idTipoSectorParroquial: tipoSector.idTipoSectorParroquial,
      nombre: 'Sector Central',
      nombreCapilla: 'Capilla Principal',
      direccion: 'Col. Kennedy, Tegucigalpa'
    }
  })

  // Crear rol de usuario
  const rol = await prisma.rolUsuario.create({
    data: {
      nombre: 'Administrador',
      descripcion: 'Acceso completo al sistema',
      estado: 1,
      idUsuarioCreacion: 1
    }
  })

  // Crear usuario administrador
  const usuario = await prisma.usuario.create({
    data: {
      idParroquia: parroquia.idParroquia,
      idRol: rol.idRol,
      nombre: 'Administrador Sistema',
      email: 'admin@cristoresucitado.hn',
      contrasena: Buffer.from('password123'), // En producción usar hash
      telefono: '2234-5678',
      estado: 1,
      idUsuarioCreacion: 1
    }
  })

  // Crear sacerdote
  const sacerdote = await prisma.ordenSacerdotal.create({
    data: {
      numeroIdentidad: '0801-1980-12345',
      idRangoSacerdotal: rangoSacerdotal.idRangoSacerdotal,
      idParroquia: parroquia.idParroquia,
      idOrdenReligiosa: ordenReligiosa.idOrdenReligiosa,
      nombres: 'José María',
      apellidos: 'González Hernández',
      fechaNacimiento: new Date('1980-06-15'),
      lugarNacimiento: '0801',
      telefono: '9876-5432',
      email: 'padre.jose@cristoresucitado.hn',
      esParroco: 1,
      estadoVital: 1
    }
  })

  // Crear persona de ejemplo
  const persona = await prisma.persona.create({
    data: {
      numeroIdentidad: '0801-1995-54321',
      idParroquia: parroquia.idParroquia,
      idSectorParroquial: sector.idSectorParroquial,
      idOrdenReligiosa: ordenReligiosa.idOrdenReligiosa,
      nombres: 'María Elena',
      apellidos: 'Rodríguez López',
      fechaNacimiento: new Date('1995-03-20'),
      lugarNacimiento: '0801',
      sexo: 'F',
      telefono: '3344-5566',
      email: 'maria.rodriguez@email.com',
      direccion: 'Col. Los Robles, Casa #123',
      estadoVital: 1,
      estadoActivoParroquia: 1
    }
  })

  console.log('✅ Datos iniciales creados:')
  console.log(`- Parroquia: ${parroquia.nombre}`)
  console.log(`- Usuario: ${usuario.email}`)
  console.log(`- Sacerdote: ${sacerdote.nombres} ${sacerdote.apellidos}`)
  console.log(`- Persona: ${persona.nombres} ${persona.apellidos}`)
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
