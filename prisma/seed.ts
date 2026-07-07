import { PrismaClient } from '@prisma/client';
import { seedRolePagePermissions } from './seed-permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear departamentos de Honduras (todos los 18)
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

  // 2. Crear todos los municipios de Honduras
  console.log('🏘️ Creando municipios...');
  const municipios = [
    // Atlántida (8 municipios)
    { codigo: '0101', departamento: '01', nombre: 'La Ceiba' },
    { codigo: '0102', departamento: '01', nombre: 'El Porvenir' },
    { codigo: '0103', departamento: '01', nombre: 'Esparta' },
    { codigo: '0104', departamento: '01', nombre: 'Jutiapa' },
    { codigo: '0105', departamento: '01', nombre: 'La Masica' },
    { codigo: '0106', departamento: '01', nombre: 'San Francisco' },
    { codigo: '0107', departamento: '01', nombre: 'Tela' },
    { codigo: '0108', departamento: '01', nombre: 'Arizona' },

    // Choluteca (16 municipios)
    { codigo: '0201', departamento: '02', nombre: 'Choluteca' },
    { codigo: '0202', departamento: '02', nombre: 'Apacilagua' },
    { codigo: '0203', departamento: '02', nombre: 'Concepción de María' },
    { codigo: '0204', departamento: '02', nombre: 'Duyure' },
    { codigo: '0205', departamento: '02', nombre: 'El Corpus' },
    { codigo: '0206', departamento: '02', nombre: 'El Triunfo' },
    { codigo: '0207', departamento: '02', nombre: 'Marcovia' },
    { codigo: '0208', departamento: '02', nombre: 'Morolica' },
    { codigo: '0209', departamento: '02', nombre: 'Namasigüe' },
    { codigo: '0210', departamento: '02', nombre: 'Orocuina' },
    { codigo: '0211', departamento: '02', nombre: 'Pespire' },
    { codigo: '0212', departamento: '02', nombre: 'San Antonio de Flores' },
    { codigo: '0213', departamento: '02', nombre: 'San Isidro' },
    { codigo: '0214', departamento: '02', nombre: 'San José' },
    { codigo: '0215', departamento: '02', nombre: 'San Marcos de Colón' },
    { codigo: '0216', departamento: '02', nombre: 'Santa Ana de Yusguare' },

    // Colón (10 municipios)
    { codigo: '0301', departamento: '03', nombre: 'Trujillo' },
    { codigo: '0302', departamento: '03', nombre: 'Balfate' },
    { codigo: '0303', departamento: '03', nombre: 'Iriona' },
    { codigo: '0304', departamento: '03', nombre: 'Limón' },
    { codigo: '0305', departamento: '03', nombre: 'Sabá' },
    { codigo: '0306', departamento: '03', nombre: 'Santa Fe' },
    { codigo: '0307', departamento: '03', nombre: 'Santa Rosa de Aguán' },
    { codigo: '0308', departamento: '03', nombre: 'Sonaguera' },
    { codigo: '0309', departamento: '03', nombre: 'Tocoa' },
    { codigo: '0310', departamento: '03', nombre: 'Bonito Oriental' },

    // Comayagua (21 municipios)
    { codigo: '0401', departamento: '04', nombre: 'Comayagua' },
    { codigo: '0402', departamento: '04', nombre: 'Ajuterique' },
    { codigo: '0403', departamento: '04', nombre: 'El Rosario' },
    { codigo: '0404', departamento: '04', nombre: 'Esquías' },
    { codigo: '0405', departamento: '04', nombre: 'Humuya' },
    { codigo: '0406', departamento: '04', nombre: 'La Libertad' },
    { codigo: '0407', departamento: '04', nombre: 'Lamaní' },
    { codigo: '0408', departamento: '04', nombre: 'La Trinidad' },
    { codigo: '0409', departamento: '04', nombre: 'Lejamaní' },
    { codigo: '0410', departamento: '04', nombre: 'Meámbar' },
    { codigo: '0411', departamento: '04', nombre: 'Minas de Oro' },
    { codigo: '0412', departamento: '04', nombre: 'Ojos de Agua' },
    { codigo: '0413', departamento: '04', nombre: 'San Jerónimo' },
    { codigo: '0414', departamento: '04', nombre: 'San José de Comayagua' },
    { codigo: '0415', departamento: '04', nombre: 'San José del Potrero' },
    { codigo: '0416', departamento: '04', nombre: 'San Luis' },
    { codigo: '0417', departamento: '04', nombre: 'San Sebastián' },
    { codigo: '0418', departamento: '04', nombre: 'Siguatepeque' },
    { codigo: '0419', departamento: '04', nombre: 'Villa de San Antonio' },
    { codigo: '0420', departamento: '04', nombre: 'Las Lajas' },
    { codigo: '0421', departamento: '04', nombre: 'Taulabé' },

    // Copán (23 municipios)
    { codigo: '0501', departamento: '05', nombre: 'Santa Rosa de Copán' },
    { codigo: '0502', departamento: '05', nombre: 'Cabañas' },
    { codigo: '0503', departamento: '05', nombre: 'Concepción' },
    { codigo: '0504', departamento: '05', nombre: 'Copán Ruinas' },
    { codigo: '0505', departamento: '05', nombre: 'Corquín' },
    { codigo: '0506', departamento: '05', nombre: 'Cucuyagua' },
    { codigo: '0507', departamento: '05', nombre: 'Dolores' },
    { codigo: '0508', departamento: '05', nombre: 'Dulce Nombre' },
    { codigo: '0509', departamento: '05', nombre: 'El Paraíso' },
    { codigo: '0510', departamento: '05', nombre: 'Florida' },
    { codigo: '0511', departamento: '05', nombre: 'La Jigua' },
    { codigo: '0512', departamento: '05', nombre: 'La Unión' },
    { codigo: '0513', departamento: '05', nombre: 'Nueva Arcadia' },
    { codigo: '0514', departamento: '05', nombre: 'San Agustín' },
    { codigo: '0515', departamento: '05', nombre: 'San Antonio' },
    { codigo: '0516', departamento: '05', nombre: 'San Jerónimo' },
    { codigo: '0517', departamento: '05', nombre: 'San José' },
    { codigo: '0518', departamento: '05', nombre: 'San Juan de Opoa' },
    { codigo: '0519', departamento: '05', nombre: 'San Nicolás' },
    { codigo: '0520', departamento: '05', nombre: 'San Pedro' },
    { codigo: '0521', departamento: '05', nombre: 'Santa Rita' },
    { codigo: '0522', departamento: '05', nombre: 'Trinidad de Copán' },
    { codigo: '0523', departamento: '05', nombre: 'Veracruz' },

    // Cortés (12 municipios)
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

    // El Paraíso (19 municipios)
    { codigo: '0701', departamento: '07', nombre: 'Yuscarán' },
    { codigo: '0702', departamento: '07', nombre: 'Alauca' },
    { codigo: '0703', departamento: '07', nombre: 'Danlí' },
    { codigo: '0704', departamento: '07', nombre: 'El Paraíso' },
    { codigo: '0705', departamento: '07', nombre: 'Güinope' },
    { codigo: '0706', departamento: '07', nombre: 'Jacaleapa' },
    { codigo: '0707', departamento: '07', nombre: 'Liure' },
    { codigo: '0708', departamento: '07', nombre: 'Morocelí' },
    { codigo: '0709', departamento: '07', nombre: 'Oropolí' },
    { codigo: '0710', departamento: '07', nombre: 'Potrerillos' },
    { codigo: '0711', departamento: '07', nombre: 'San Antonio de Flores' },
    { codigo: '0712', departamento: '07', nombre: 'San Lucas' },
    { codigo: '0713', departamento: '07', nombre: 'San Matías' },
    { codigo: '0714', departamento: '07', nombre: 'Soledad' },
    { codigo: '0715', departamento: '07', nombre: 'Teupasenti' },
    { codigo: '0716', departamento: '07', nombre: 'Texiguat' },
    { codigo: '0717', departamento: '07', nombre: 'Vado Ancho' },
    { codigo: '0718', departamento: '07', nombre: 'Yauyupe' },
    { codigo: '0719', departamento: '07', nombre: 'Trojes' },

    // Francisco Morazán (28 municipios)
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

    // Gracias a Dios (6 municipios)
    { codigo: '0901', departamento: '09', nombre: 'Puerto Lempira' },
    { codigo: '0902', departamento: '09', nombre: 'Brus Laguna' },
    { codigo: '0903', departamento: '09', nombre: 'Ahuas' },
    { codigo: '0904', departamento: '09', nombre: 'Juan Francisco Bulnes' },
    { codigo: '0905', departamento: '09', nombre: 'Ramón Villeda Morales' },
    { codigo: '0906', departamento: '09', nombre: 'Wampusirpi' },

    // Intibucá (17 municipios)
    { codigo: '1001', departamento: '10', nombre: 'La Esperanza' },
    { codigo: '1002', departamento: '10', nombre: 'Camasca' },
    { codigo: '1003', departamento: '10', nombre: 'Colomoncagua' },
    { codigo: '1004', departamento: '10', nombre: 'Concepción' },
    { codigo: '1005', departamento: '10', nombre: 'Dolores' },
    { codigo: '1006', departamento: '10', nombre: 'Intibucá' },
    { codigo: '1007', departamento: '10', nombre: 'Jesús de Otoro' },
    { codigo: '1008', departamento: '10', nombre: 'Magdalena' },
    { codigo: '1009', departamento: '10', nombre: 'Masaguara' },
    { codigo: '1010', departamento: '10', nombre: 'San Antonio' },
    { codigo: '1011', departamento: '10', nombre: 'San Isidro' },
    { codigo: '1012', departamento: '10', nombre: 'San Juan' },
    { codigo: '1013', departamento: '10', nombre: 'San Marcos de la Sierra' },
    { codigo: '1014', departamento: '10', nombre: 'San Miguel Guancapla' },
    { codigo: '1015', departamento: '10', nombre: 'Santa Lucía' },
    { codigo: '1016', departamento: '10', nombre: 'Yamaranguila' },
    { codigo: '1017', departamento: '10', nombre: 'San Francisco de Opalaca' },

    // Islas de la Bahía (4 municipios)
    { codigo: '1101', departamento: '11', nombre: 'Roatán' },
    { codigo: '1102', departamento: '11', nombre: 'Guanaja' },
    { codigo: '1103', departamento: '11', nombre: 'José Santos Guardiola' },
    { codigo: '1104', departamento: '11', nombre: 'Utila' },

    // La Paz (19 municipios)
    { codigo: '1201', departamento: '12', nombre: 'La Paz' },
    { codigo: '1202', departamento: '12', nombre: 'Aguanqueterique' },
    { codigo: '1203', departamento: '12', nombre: 'Cabañas' },
    { codigo: '1204', departamento: '12', nombre: 'Cane' },
    { codigo: '1205', departamento: '12', nombre: 'Chinacla' },
    { codigo: '1206', departamento: '12', nombre: 'Guajiquiro' },
    { codigo: '1207', departamento: '12', nombre: 'Lauterique' },
    { codigo: '1208', departamento: '12', nombre: 'Marcala' },
    { codigo: '1209', departamento: '12', nombre: 'Mercedes de Oriente' },
    { codigo: '1210', departamento: '12', nombre: 'Opatoro' },
    { codigo: '1211', departamento: '12', nombre: 'San Antonio del Norte' },
    { codigo: '1212', departamento: '12', nombre: 'San José' },
    { codigo: '1213', departamento: '12', nombre: 'San Juan' },
    { codigo: '1214', departamento: '12', nombre: 'San Pedro de Tutule' },
    { codigo: '1215', departamento: '12', nombre: 'Santa Ana' },
    { codigo: '1216', departamento: '12', nombre: 'Santa Elena' },
    { codigo: '1217', departamento: '12', nombre: 'Santa María' },
    { codigo: '1218', departamento: '12', nombre: 'Santiago de Puringla' },
    { codigo: '1219', departamento: '12', nombre: 'Yarula' },

    // Lempira (28 municipios)
    { codigo: '1301', departamento: '13', nombre: 'Gracias' },
    { codigo: '1302', departamento: '13', nombre: 'Belén' },
    { codigo: '1303', departamento: '13', nombre: 'Candelaria' },
    { codigo: '1304', departamento: '13', nombre: 'Cololaca' },
    { codigo: '1305', departamento: '13', nombre: 'Erandique' },
    { codigo: '1306', departamento: '13', nombre: 'Gualcince' },
    { codigo: '1307', departamento: '13', nombre: 'Guarita' },
    { codigo: '1308', departamento: '13', nombre: 'La Campa' },
    { codigo: '1309', departamento: '13', nombre: 'La Iguala' },
    { codigo: '1310', departamento: '13', nombre: 'Las Flores' },
    { codigo: '1311', departamento: '13', nombre: 'Lepaera' },
    { codigo: '1312', departamento: '13', nombre: 'Mapulaca' },
    { codigo: '1313', departamento: '13', nombre: 'Piraera' },
    { codigo: '1314', departamento: '13', nombre: 'San Antonio' },
    { codigo: '1315', departamento: '13', nombre: 'San Francisco' },
    { codigo: '1316', departamento: '13', nombre: 'San Juan Guarita' },
    { codigo: '1317', departamento: '13', nombre: 'San Manuel Colohete' },
    { codigo: '1318', departamento: '13', nombre: 'San Rafael' },
    { codigo: '1319', departamento: '13', nombre: 'San Sebastián' },
    { codigo: '1320', departamento: '13', nombre: 'Santa Cruz' },
    { codigo: '1321', departamento: '13', nombre: 'Talgua' },
    { codigo: '1322', departamento: '13', nombre: 'Tambla' },
    { codigo: '1323', departamento: '13', nombre: 'Tomalá' },
    { codigo: '1324', departamento: '13', nombre: 'Valladolid' },
    { codigo: '1325', departamento: '13', nombre: 'Virginia' },
    { codigo: '1326', departamento: '13', nombre: 'San Marcos de Caiquín' },
    { codigo: '1327', departamento: '13', nombre: 'La Virtud' },
    { codigo: '1328', departamento: '13', nombre: 'San Andrés' },

    // Ocotepeque (16 municipios)
    { codigo: '1401', departamento: '14', nombre: 'Ocotepeque' },
    { codigo: '1402', departamento: '14', nombre: 'Belén Gualcho' },
    { codigo: '1403', departamento: '14', nombre: 'Concepción' },
    { codigo: '1404', departamento: '14', nombre: 'Dolores Merendón' },
    { codigo: '1405', departamento: '14', nombre: 'Fraternidad' },
    { codigo: '1406', departamento: '14', nombre: 'La Encarnación' },
    { codigo: '1407', departamento: '14', nombre: 'La Labor' },
    { codigo: '1408', departamento: '14', nombre: 'Lucerna' },
    { codigo: '1409', departamento: '14', nombre: 'Mercedes' },
    { codigo: '1410', departamento: '14', nombre: 'San Fernando' },
    { codigo: '1411', departamento: '14', nombre: 'San Francisco del Valle' },
    { codigo: '1412', departamento: '14', nombre: 'San Jorge' },
    { codigo: '1413', departamento: '14', nombre: 'San Marcos' },
    { codigo: '1414', departamento: '14', nombre: 'Santa Fe' },
    { codigo: '1415', departamento: '14', nombre: 'Sensenti' },
    { codigo: '1416', departamento: '14', nombre: 'Sinuapa' },

    // Olancho (23 municipios)
    { codigo: '1501', departamento: '15', nombre: 'Juticalpa' },
    { codigo: '1502', departamento: '15', nombre: 'Campamento' },
    { codigo: '1503', departamento: '15', nombre: 'Catacamas' },
    { codigo: '1504', departamento: '15', nombre: 'Concordia' },
    { codigo: '1505', departamento: '15', nombre: 'Dulce Nombre de Culmí' },
    { codigo: '1506', departamento: '15', nombre: 'El Rosario' },
    { codigo: '1507', departamento: '15', nombre: 'Esquipulas del Norte' },
    { codigo: '1508', departamento: '15', nombre: 'Gualaco' },
    { codigo: '1509', departamento: '15', nombre: 'Guarizama' },
    { codigo: '1510', departamento: '15', nombre: 'Guata' },
    { codigo: '1511', departamento: '15', nombre: 'Guayape' },
    { codigo: '1512', departamento: '15', nombre: 'Jano' },
    { codigo: '1513', departamento: '15', nombre: 'La Unión' },
    { codigo: '1514', departamento: '15', nombre: 'Mangulile' },
    { codigo: '1515', departamento: '15', nombre: 'Manto' },
    { codigo: '1516', departamento: '15', nombre: 'Salama' },
    { codigo: '1517', departamento: '15', nombre: 'San Esteban' },
    { codigo: '1518', departamento: '15', nombre: 'San Francisco de Becerra' },
    { codigo: '1519', departamento: '15', nombre: 'San Francisco de la Paz' },
    { codigo: '1520', departamento: '15', nombre: 'Santa María del Real' },
    { codigo: '1521', departamento: '15', nombre: 'Silca' },
    { codigo: '1522', departamento: '15', nombre: 'Yocón' },
    { codigo: '1523', departamento: '15', nombre: 'Patuca' },

    // Santa Bárbara (28 municipios)
    { codigo: '1601', departamento: '16', nombre: 'Santa Bárbara' },
    { codigo: '1602', departamento: '16', nombre: 'Arada' },
    { codigo: '1603', departamento: '16', nombre: 'Atima' },
    { codigo: '1604', departamento: '16', nombre: 'Azacualpa' },
    { codigo: '1605', departamento: '16', nombre: 'Ceguaca' },
    { codigo: '1606', departamento: '16', nombre: 'Concepción del Norte' },
    { codigo: '1607', departamento: '16', nombre: 'Concepción del Sur' },
    { codigo: '1608', departamento: '16', nombre: 'Chinda' },
    { codigo: '1609', departamento: '16', nombre: 'El Níspero' },
    { codigo: '1610', departamento: '16', nombre: 'Gualala' },
    { codigo: '1611', departamento: '16', nombre: 'Ilama' },
    { codigo: '1612', departamento: '16', nombre: 'Las Vegas' },
    { codigo: '1613', departamento: '16', nombre: 'Macuelizo' },
    { codigo: '1614', departamento: '16', nombre: 'Naranjito' },
    { codigo: '1615', departamento: '16', nombre: 'Nuevo Celilac' },
    { codigo: '1616', departamento: '16', nombre: 'Petoa' },
    { codigo: '1617', departamento: '16', nombre: 'Protección' },
    { codigo: '1618', departamento: '16', nombre: 'Quimistán' },
    { codigo: '1619', departamento: '16', nombre: 'San Francisco de Ojuera' },
    { codigo: '1620', departamento: '16', nombre: 'San José de Colinas' },
    { codigo: '1621', departamento: '16', nombre: 'San Luis' },
    { codigo: '1622', departamento: '16', nombre: 'San Marcos' },
    { codigo: '1623', departamento: '16', nombre: 'San Nicolás' },
    { codigo: '1624', departamento: '16', nombre: 'San Pedro Zacapa' },
    { codigo: '1625', departamento: '16', nombre: 'San Vicente Centenario' },
    { codigo: '1626', departamento: '16', nombre: 'Santa Rita' },
    { codigo: '1627', departamento: '16', nombre: 'Trinidad' },
    { codigo: '1628', departamento: '16', nombre: 'Nueva Frontera' },

    // Valle (9 municipios)
    { codigo: '1701', departamento: '17', nombre: 'Nacaome' },
    { codigo: '1702', departamento: '17', nombre: 'Alianza' },
    { codigo: '1703', departamento: '17', nombre: 'Amapala' },
    { codigo: '1704', departamento: '17', nombre: 'Aramecina' },
    { codigo: '1705', departamento: '17', nombre: 'Caridad' },
    { codigo: '1706', departamento: '17', nombre: 'Goascorán' },
    { codigo: '1707', departamento: '17', nombre: 'Langue' },
    { codigo: '1708', departamento: '17', nombre: 'San Francisco de Coray' },
    { codigo: '1709', departamento: '17', nombre: 'San Lorenzo' },

    // Yoro (11 municipios)
    { codigo: '1801', departamento: '18', nombre: 'Yoro' },
    { codigo: '1802', departamento: '18', nombre: 'Arenal' },
    { codigo: '1803', departamento: '18', nombre: 'El Negrito' },
    { codigo: '1804', departamento: '18', nombre: 'El Progreso' },
    { codigo: '1805', departamento: '18', nombre: 'Jocón' },
    { codigo: '1806', departamento: '18', nombre: 'Morazán' },
    { codigo: '1807', departamento: '18', nombre: 'Olanchito' },
    { codigo: '1808', departamento: '18', nombre: 'Santa Rita' },
    { codigo: '1809', departamento: '18', nombre: 'Sulaco' },
    { codigo: '1810', departamento: '18', nombre: 'Victoria' },
    { codigo: '1811', departamento: '18', nombre: 'Yorito' }
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
    where: { id_parroquia: parroquia.id_parroquia },
    update: {},
    create: {
      id_parroquia: parroquia.id_parroquia,
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

  await seedRolePagePermissions(prisma);

  console.log('✅ Seed completado exitosamente!');
  console.log('📊 Datos cargados:');
  console.log(`  📍 Departamentos: ${departamentos.length}`);
  console.log(`  🏘️ Municipios: ${municipios.length}`);
  console.log(`  ⛪ Órdenes religiosas: ${ordenesReligiosas.length}`);
  console.log(`  🏛️ Sectores parroquiales: ${sectoresParroquiales.length}`);
  sectoresParroquiales.forEach(sector => {
    console.log(`    - ${sector.nombre}`);
  });
  console.log('🎉 Base de datos completamente poblada con todos los datos de Honduras!');
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
