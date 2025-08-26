CREATE DATABASE  IF NOT EXISTS `christi_fidelis` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `christi_fidelis`;
-- MySQL dump 10.13  Distrib 8.0.25, for Win64 (x86_64)
--
-- Host: localhost    Database: christi_fidelis
-- ------------------------------------------------------
-- Server version	8.0.20

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bautismo`
--

DROP TABLE IF EXISTS `bautismo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bautismo` (
  `id_bautismo` int unsigned NOT NULL AUTO_INCREMENT,
  `id_parroquia` smallint unsigned NOT NULL COMMENT 'Parroquia donde se celebró el Sacramento. En caso de que una persona pertenezca a otra parroquia.',
  `numero_identidad_bautizado` varchar(20) NOT NULL,
  `numero_identidad_madre` varchar(20) NOT NULL,
  `numero_identidad_padre` varchar(20) NOT NULL,
  `numero_identidad_madrina` varchar(20) NOT NULL,
  `numero_identidad_padrino` varchar(20) NOT NULL,
  `numero_identidad_catequista` varchar(20) NOT NULL,
  `numero_identidad_sacerdote` varchar(20) NOT NULL,
  `fecha_bautismo` datetime NOT NULL,
  `numero_folio` text NOT NULL,
  `numero_libro` text NOT NULL,
  `numero_pagina` text NOT NULL,
  `numero_registro` text NOT NULL,
  `nota_marginal` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id_bautismo`),
  KEY `bautismo_ibfk_1_idx` (`numero_identidad_padre`) /*!80000 INVISIBLE */,
  KEY `bautismo_ibfk_2_idx` (`numero_identidad_madre`),
  KEY `bautismo_ibfk_3_idx` (`numero_identidad_padrino`) /*!80000 INVISIBLE */,
  KEY `bautismo_ibfk_4_idx` (`numero_identidad_madrina`),
  KEY `bautismo_ibfk_6_idx` (`numero_identidad_bautizado`) /*!80000 INVISIBLE */,
  KEY `bautismo_ibfk_7_idx` (`numero_identidad_sacerdote`),
  KEY `bautismo_ibfk_5_idx` (`numero_identidad_catequista`),
  KEY `bautismo_ibfk_8_idx` (`id_parroquia`) /*!80000 INVISIBLE */,
  CONSTRAINT `bautismo_ibfk_1` FOREIGN KEY (`numero_identidad_padre`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `bautismo_ibfk_2` FOREIGN KEY (`numero_identidad_madre`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `bautismo_ibfk_3` FOREIGN KEY (`numero_identidad_padrino`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `bautismo_ibfk_4` FOREIGN KEY (`numero_identidad_madrina`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `bautismo_ibfk_5` FOREIGN KEY (`numero_identidad_catequista`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `bautismo_ibfk_6` FOREIGN KEY (`numero_identidad_bautizado`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `bautismo_ibfk_7` FOREIGN KEY (`numero_identidad_sacerdote`) REFERENCES `orden_sacerdotal` (`numero_identidad`),
  CONSTRAINT `bautismo_ibfk_8` FOREIGN KEY (`id_parroquia`) REFERENCES `parroquia` (`id_parroquia`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bautismo`
--

LOCK TABLES `bautismo` WRITE;
/*!40000 ALTER TABLE `bautismo` DISABLE KEYS */;
/*!40000 ALTER TABLE `bautismo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitacora_crud`
--

DROP TABLE IF EXISTS `bitacora_crud`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacora_crud` (
  `id_accion` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` mediumint unsigned NOT NULL,
  `accion` char(1) NOT NULL COMMENT 'C=Create, R=Read, U=Update, D=Delete',
  `id_tabla_afectado` int unsigned NOT NULL,
  `nombre_tabla` varchar(100) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_accion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora_crud`
--

LOCK TABLES `bitacora_crud` WRITE;
/*!40000 ALTER TABLE `bitacora_crud` DISABLE KEYS */;
/*!40000 ALTER TABLE `bitacora_crud` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitacora_login`
--

DROP TABLE IF EXISTS `bitacora_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacora_login` (
  `id_ingreso` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` mediumint unsigned NOT NULL,
  `fecha_ingreso` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_ingreso`)
) ENGINE=InnoDB AUTO_INCREMENT=232 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora_login`
--

LOCK TABLES `bitacora_login` WRITE;
/*!40000 ALTER TABLE `bitacora_login` DISABLE KEYS */;
/*!40000 ALTER TABLE `bitacora_login` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitacora_persona_parroquia`
--

DROP TABLE IF EXISTS `bitacora_persona_parroquia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacora_persona_parroquia` (
  `id_registro` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Tabla para llevar un registro de las parroquias a las que se ha integrado una persona. En caso de que se mude y cambie de parroquia. SOLO EL PÁRROCO PUEDE ACTUALIZAR LA ZONA PARROQUIAL.',
  `numero_identidad` varchar(20) NOT NULL,
  `id_parroquia` smallint unsigned NOT NULL,
  `es_parroco` tinyint NOT NULL DEFAULT '0' COMMENT 'Para llevar historial de párrocos',
  `fecha_ingreso` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_salida` datetime DEFAULT NULL,
  PRIMARY KEY (`id_registro`)
) ENGINE=InnoDB AUTO_INCREMENT=232 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora_persona_parroquia`
--

LOCK TABLES `bitacora_persona_parroquia` WRITE;
/*!40000 ALTER TABLE `bitacora_persona_parroquia` DISABLE KEYS */;
/*!40000 ALTER TABLE `bitacora_persona_parroquia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `confirmacion`
--

DROP TABLE IF EXISTS `confirmacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `confirmacion` (
  `id_confirmacion` int unsigned NOT NULL AUTO_INCREMENT,
  `id_parroquia` smallint unsigned NOT NULL COMMENT 'Parroquia donde se celebró el Sacramento. En caso de que una persona pertenezca a otra parroquia.',
  `numero_identidad_confirmado` varchar(20) NOT NULL,
  `numero_identidad_madre` varchar(20) NOT NULL,
  `numero_identidad_padre` varchar(20) NOT NULL,
  `numero_identidad_madrina` varchar(20) NOT NULL,
  `numero_identidad_padrino` varchar(20) NOT NULL,
  `numero_identidad_catequista` varchar(20) NOT NULL,
  `numero_identidad_obispo` varchar(20) NOT NULL,
  `fecha_confirmacion` datetime NOT NULL,
  `numero_acta` text NOT NULL,
  `numero_libro` text NOT NULL,
  `numero_pagina` text,
  `numero_registro` text NOT NULL,
  `nota_marginal` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id_confirmacion`),
  KEY `confirmacion_ibfk_1_idx` (`numero_identidad_confirmado`),
  KEY `confirmacion_ibfk_3_idx` (`numero_identidad_padrino`),
  KEY `confirmacion_ibfk_4_idx` (`numero_identidad_madrina`),
  KEY `confirmacion_ibfk_5_idx` (`numero_identidad_padre`) /*!80000 INVISIBLE */,
  KEY `confirmacion_ibfk_6_idx` (`numero_identidad_madre`) /*!80000 INVISIBLE */,
  KEY `confirmacion_ibfk_7_idx` (`numero_identidad_obispo`),
  KEY `confirmacion_ibfk_2_idx` (`numero_identidad_catequista`),
  KEY `confirmacion_ibfk_8_idx` (`id_parroquia`),
  CONSTRAINT `confirmacion_ibfk_1` FOREIGN KEY (`numero_identidad_confirmado`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `confirmacion_ibfk_2` FOREIGN KEY (`numero_identidad_catequista`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `confirmacion_ibfk_3` FOREIGN KEY (`numero_identidad_padrino`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `confirmacion_ibfk_4` FOREIGN KEY (`numero_identidad_madrina`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `confirmacion_ibfk_5` FOREIGN KEY (`numero_identidad_padre`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `confirmacion_ibfk_6` FOREIGN KEY (`numero_identidad_madre`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `confirmacion_ibfk_7` FOREIGN KEY (`numero_identidad_obispo`) REFERENCES `orden_sacerdotal` (`numero_identidad`),
  CONSTRAINT `confirmacion_ibfk_8` FOREIGN KEY (`id_parroquia`) REFERENCES `parroquia` (`id_parroquia`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `confirmacion`
--

LOCK TABLES `confirmacion` WRITE;
/*!40000 ALTER TABLE `confirmacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `confirmacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departamento`
--

DROP TABLE IF EXISTS `departamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamento` (
  `codigo_departamento` char(2) NOT NULL,
  `nombre_departamento` varchar(55) NOT NULL,
  PRIMARY KEY (`codigo_departamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamento`
--

LOCK TABLES `departamento` WRITE;
/*!40000 ALTER TABLE `departamento` DISABLE KEYS */;
INSERT INTO `departamento` VALUES ('01','Atlántida'),('02','Colón'),('03','Comayagua'),('04','Copán'),('05','Cortés'),('06','Choluteca'),('07','El Paraíso'),('08','Francisco Morazán'),('09','Gracias a Dios'),('10','Intibucá'),('11','Islas de La Bahía'),('12','La Paz'),('13','Lempira'),('14','Ocotepeque'),('15','Olancho'),('16','Santa Bárbara'),('17','Valle'),('18','Yoro');
/*!40000 ALTER TABLE `departamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grupo_parroquial`
--

DROP TABLE IF EXISTS `grupo_parroquial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grupo_parroquial` (
  `id_grupo_parroquial` smallint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(2500) DEFAULT NULL,
  PRIMARY KEY (`id_grupo_parroquial`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grupo_parroquial`
--

LOCK TABLES `grupo_parroquial` WRITE;
/*!40000 ALTER TABLE `grupo_parroquial` DISABLE KEYS */;
/*!40000 ALTER TABLE `grupo_parroquial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matrimonio`
--

DROP TABLE IF EXISTS `matrimonio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matrimonio` (
  `id_matrimonio` int unsigned NOT NULL AUTO_INCREMENT,
  `id_parroquia` smallint unsigned NOT NULL COMMENT 'Parroquia donde se celebró el Sacramento. En caso de que una persona pertenezca a otra parroquia.',
  `numero_identidad_esposa` varchar(20) NOT NULL,
  `numero_identidad_esposo` varchar(20) NOT NULL,
  `numero_identidad_madrina` varchar(20) NOT NULL,
  `numero_identidad_padrino` varchar(20) NOT NULL,
  `numero_identidad_sacerdote` varchar(20) NOT NULL,
  `numero_identidad_madre_esposa` varchar(20) DEFAULT NULL,
  `numero_identidad_padre_esposa` varchar(20) DEFAULT NULL,
  `numero_identidad_madre_esposo` varchar(20) DEFAULT NULL,
  `numero_identidad_padre_esposo` varchar(20) DEFAULT NULL,
  `fecha_matrimonio` datetime NOT NULL,
  `numero_acta` text NOT NULL,
  `numero_libro` text NOT NULL,
  `numero_pagina` text,
  `numero_registro` text NOT NULL,
  `nota_marginal` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id_matrimonio`),
  KEY `matrimonio_ibfk_2_idx` (`numero_identidad_esposa`) /*!80000 INVISIBLE */,
  KEY `matrimonio_ibfk_3_idx` (`numero_identidad_padrino`),
  KEY `matrimonio_ibfk_4_idx` (`numero_identidad_madrina`),
  KEY `matrimonio_ibfk_1_idx` (`numero_identidad_esposo`),
  KEY `matrimonio_ibfk_5_idx` (`numero_identidad_sacerdote`) /*!80000 INVISIBLE */,
  KEY `matrimonio_ibfk_6_idx` (`id_parroquia`),
  CONSTRAINT `matrimonio_ibfk_1` FOREIGN KEY (`numero_identidad_esposo`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `matrimonio_ibfk_2` FOREIGN KEY (`numero_identidad_esposa`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `matrimonio_ibfk_3` FOREIGN KEY (`numero_identidad_padrino`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `matrimonio_ibfk_4` FOREIGN KEY (`numero_identidad_madrina`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `matrimonio_ibfk_5` FOREIGN KEY (`numero_identidad_sacerdote`) REFERENCES `orden_sacerdotal` (`numero_identidad`),
  CONSTRAINT `matrimonio_ibfk_6` FOREIGN KEY (`id_parroquia`) REFERENCES `parroquia` (`id_parroquia`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matrimonio`
--

LOCK TABLES `matrimonio` WRITE;
/*!40000 ALTER TABLE `matrimonio` DISABLE KEYS */;
/*!40000 ALTER TABLE `matrimonio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `municipio`
--

DROP TABLE IF EXISTS `municipio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `municipio` (
  `codigo_municipio` char(4) NOT NULL,
  `codigo_departamento` char(2) NOT NULL,
  `nombre_municipio` varchar(55) NOT NULL,
  PRIMARY KEY (`codigo_municipio`),
  KEY `codigo_departamento_ibfk_idx` (`codigo_departamento`),
  CONSTRAINT `codigo_departamento_ibfk` FOREIGN KEY (`codigo_departamento`) REFERENCES `departamento` (`codigo_departamento`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `municipio`
--

LOCK TABLES `municipio` WRITE;
/*!40000 ALTER TABLE `municipio` DISABLE KEYS */;
INSERT INTO `municipio` VALUES ('0101','01','La Ceiba'),('0102','01','El Porvenir'),('0103','01','Esparta'),('0104','01','Jutiapa'),('0105','01','La Masica'),('0106','01','San Francisco'),('0107','01','Tela'),('0108','01','Arizona'),('0201','02','Trujillo'),('0202','02','Balfate'),('0203','02','Iriona'),('0204','02','Limón'),('0205','02','Sabá'),('0206','02','Santa Fe'),('0207','02','Santa Rosa de Aguán'),('0208','02','Sonaguera'),('0209','02','Tocoa'),('0210','02','Bonito Oriental'),('0301','03','Comayagua'),('0302','03','Ajuterique'),('0303','03','El Rosario'),('0304','03','Esquías'),('0305','03','Humuya'),('0306','03','La Libertad'),('0307','03','Lamaní'),('0308','03','La Trinidad'),('0309','03','Lejamaní'),('0310','03','Meámbar'),('0311','03','Minas de Oro'),('0312','03','Ojo de Agua'),('0313','03','San Jerónimo'),('0314','03','San José de Comayagua'),('0315','03','San José del Potrero'),('0316','03','San Luis'),('0317','03','San Sebastián'),('0318','03','Siguatepeque'),('0319','03','Villa de San Antonio'),('0320','03','Lajas'),('0321','03','Taulabe'),('0401','04','Santa Rosa de Copán'),('0402','04','Cabañas'),('0403','04','Concepción'),('0404','04','Copán Ruinas'),('0405','04','Corquín'),('0406','04','Cucuyagua'),('0407','04','Dolores'),('0408','04','Dulce Nombre'),('0409','04','El Paraíso'),('0410','04','Florida'),('0411','04','La Jigua'),('0412','04','La Unión'),('0413','04','Nueva Arcadia'),('0414','04','San Agustín'),('0415','04','San Antonio'),('0416','04','San Jerónimo'),('0417','04','San José'),('0418','04','San Juan de Opoa'),('0419','04','San Nicolás'),('0420','04','San Pedro'),('0421','04','Santa Rita'),('0422','04','Trinidad de Copán'),('0423','04','Veracruz'),('0501','05','San Pedro Sula'),('0502','05','Choloma'),('0503','05','Omoa'),('0504','05','Pimienta'),('0505','05','Potrerillos'),('0506','05','Puerto Cortés'),('0507','05','San Antonio de Cortés'),('0508','05','San Francisco de Yojoa'),('0509','05','San Manuel'),('0510','05','Santa Cruz de Yojoa'),('0511','05','Villanueva'),('0512','05','La Lima'),('0601','06','Choluteca'),('0602','06','Apacilagua'),('0603','06','Concepción de María'),('0604','06','Duyure'),('0605','06','El Corpus'),('0606','06','El Triunfo'),('0607','06','Marcovia'),('0608','06','Morolica'),('0609','06','Namasigüe'),('0610','06','Orocuina'),('0611','06','Pespire'),('0612','06','San Antonio de Flores'),('0613','06','San Isidro'),('0614','06','San José'),('0615','06','San Marcos de Colón'),('0616','06','Santa Ana de Yusguare'),('0701','07','Yuscarán'),('0702','07','Alauca'),('0703','07','Danlí'),('0704','07','El Paraiso'),('0705','07','Güinope'),('0706','07','Jacaleapa'),('0707','07','Liure'),('0708','07','Morocelí'),('0709','07','Oropolí'),('0710','07','Potrerillos'),('0711','07','San Antonio de Flores'),('0712','07','San Lucas'),('0713','07','San Matías'),('0714','07','Soledad'),('0715','07','Teupasenti'),('0716','07','Texiguat'),('0717','07','Vado Ancho'),('0718','07','Yauyupe'),('0719','07','Trojes'),('0801','08','Tegucigalpa D.C.'),('0802','08','Alubarén'),('0803','08','Cedros'),('0804','08','Curarén'),('0805','08','El Porvenir'),('0806','08','Guaimaca'),('0807','08','La Libertad'),('0808','08','La Venta'),('0809','08','Lepaterique'),('0810','08','Maraita'),('0811','08','Marale'),('0812','08','Nueva Armenia'),('0813','08','Ojojona'),('0814','08','Orica'),('0815','08','Reitoca'),('0816','08','Sabanagrande'),('0817','08','San Antonio de Oriente'),('0818','08','San Buenaventura'),('0819','08','San Ignacio'),('0820','08','San Juan de Flores'),('0821','08','San Miguelito'),('0822','08','Santa Ana'),('0823','08','Santa Lucia'),('0824','08','Talanga'),('0825','08','Tatumbla'),('0826','08','Valle de Angeles'),('0827','08','Villa de San Francisco'),('0828','08','Vallecillo'),('0901','09','Puerto Lempira'),('0902','09',' Brus Laguna'),('0903','09','Ahuas'),('0904','09','Juan Francisco Bulnes'),('0905','09','Villeda Morales'),('0906','09','Wampusirpe'),('1001','10','La Esperanza'),('1002','10','Camasca'),('1003','10','Colomoncagua'),('1004','10','Concepción'),('1005','10','Dolores'),('1006','10','Intibucá'),('1007','10','Jesús de Otoro'),('1008','10','Magdalena'),('1009','10','Masaguara'),('1010','10','San Antonio'),('1011','10','San Isidro'),('1012','10','San Juan'),('1013','10','San Marcos de La Sierra'),('1014','10','San Miguel Guancapla'),('1015','10','Santa Lucía'),('1016','10','Yamaranguila'),('1017','10','San Francisco Opalaca'),('1101','11','Roatán'),('1102','11','Guanaja'),('1103','11','José Santos Guardiola'),('1104','11','Utila'),('1201','12','La Paz'),('1202','12','Aguanqueterique'),('1203','12','Cabañas'),('1204','12','Cane'),('1205','12','Chinacla'),('1206','12','Guajiquiro'),('1207','12','Lauterique'),('1208','12','Marcala'),('1209','12','Mercedes de Oriente'),('1210','12','Opatoro'),('1211','12','San Antonio del Norte'),('1212','12','San José'),('1213','12','San Juan'),('1214','12','San Pedro de Tutule'),('1215','12','Santa Ana'),('1216','12','Santa Elena'),('1217','12','Santa María'),('1218','12','Santiago Puringla'),('1219','12','Yarula'),('1301','13','Gracias'),('1302','13','Belén'),('1303','13','Candelaria'),('1304','13','Cololaca'),('1305','13','Erandique'),('1306','13','Gualcinse'),('1307','13','Guarita'),('1308','13','La Campa'),('1309','13','La Iguala'),('1310','13','Las Flores'),('1311','13','La Unión'),('1312','13','La Virtud'),('1313','13','Lepaera'),('1314','13','Mapulaca'),('1315','13','Piraera'),('1316','13','San Andrés'),('1317','13','San Francisco'),('1318','13','San Juan Guarita'),('1319','13','San Manuel Colohete'),('1320','13','San Rafael'),('1321','13','San Sebastián'),('1322','13','Santa Cruz'),('1323','13','Talgua'),('1324','13','Tambla'),('1325','13','Tomalá'),('1326','13','Valladolid'),('1327','13','Virginia'),('1328','13','San Marcos de Caiquín'),('1401','14','Ocotepeque'),('1402','14','Belén Gualcho'),('1403','14','Concepción'),('1404','14','Dolores Merendón'),('1405','14','Fraternidad'),('1406','14','La Encarnación'),('1407','14','La Labor'),('1408','14','Lucerna'),('1409','14','Mercedes'),('1410','14','San Fernando'),('1411','14','San Francisco del Valle'),('1412','14','San Jorge'),('1413','14','San Marcos'),('1414','14','Santa Fé'),('1415','14','Sensenti'),('1416','14','Sinuapa'),('1501','15','Juticalpa'),('1502','15','Campamento'),('1503','15','Catacamas'),('1504','15','Concordia'),('1505','15','Dulce Nombre de Culmí'),('1506','15','El Rosario'),('1507','15','Esquipulas del Norte'),('1508','15','Gualaco'),('1509','15','Guarizama'),('1510','15','Guata'),('1511','15','Guayape'),('1512','15','Jano'),('1513','15','La Unión'),('1514','15','Mangulile'),('1515','15','Manto'),('1516','15','Salamá'),('1517','15','San Esteban'),('1518','15','San Francisco de Becerra'),('1519','15','San Francisco de La Paz'),('1520','15','Santa María del Real'),('1521','15','Silca'),('1522','15','Yocón'),('1523','15','Patuca'),('1601','16','Santa Bárbara'),('1602','16','Arada'),('1603','16','Atima'),('1604','16','Azacualpa'),('1605','16','Ceguaca'),('1606','16','Colinas'),('1607','16','Concepción del Norte'),('1608','16','Concepción del Sur'),('1609','16','Chinda'),('1610','16','El Níspero'),('1611','16','Gualala'),('1612','16','Ilama'),('1613','16','Macuelizo'),('1614','16','Naranjito'),('1615','16','Nueva Celilac'),('1616','16','Petoa'),('1617','16','Protección'),('1618','16','Quimistán'),('1619','16','San Francisco de Ojuera'),('1620','16','San Luis'),('1621','16','San Marcos'),('1622','16','San Nicolás'),('1623','16','San Pedro Zacapa'),('1624','16','Santa Rita'),('1625','16','San Vicente Centenario'),('1626','16','Trinidad'),('1627','16','Las Vegas'),('1628','16','Nueva Frontera'),('1701','17','Nacaome'),('1702','17','Alianza'),('1703','17','Amapala'),('1704','17','Aramecina'),('1705','17','Caridad'),('1706','17','Goascorán'),('1707','17','Langue'),('1708','17','San Francisco de Coray'),('1709','17','San Lorenzo'),('1801','18','Yoro'),('1802','18','Arenal'),('1803','18','El Negrito'),('1804','18','El Progreso'),('1805','18','Jocón'),('1806','18','Morazán'),('1807','18','Olanchito'),('1808','18','Santa Rita'),('1809','18','Sulaco'),('1810','18','Victoria'),('1811','18','Yorito');
/*!40000 ALTER TABLE `municipio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_religiosa`
--

DROP TABLE IF EXISTS `orden_religiosa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_religiosa` (
  `id_orden_religiosa` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `nombre_latin` varchar(100) DEFAULT NULL,
  `abreviatura` varchar(15) DEFAULT NULL,
  `descripcion` varchar(1000) DEFAULT NULL,
  `rama` char(1) NOT NULL COMMENT 'F=Femenina, M=Masculina, N=Ninguna (N SOLO PARA NINGUNA Y OTRA).',
  PRIMARY KEY (`id_orden_religiosa`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_religiosa`
--

LOCK TABLES `orden_religiosa` WRITE;
/*!40000 ALTER TABLE `orden_religiosa` DISABLE KEYS */;
INSERT INTO `orden_religiosa` VALUES (1,'Ninguna',NULL,NULL,NULL,'N'),(2,'Orden de la Santísima Trinidad (Trinitarios)','Ordo Sanctissimae Trinitatis','OSST','Orden fundada en 1198 en Ciervofrío (Francia) por San Juan de Mata y San Félix de Valois','M'),(3,'Orden de las Escuelas Pías (Escolapios)','Ordo Scholarum Piarum','SchP','Orden fundada en 1600 en Roma por San José de Calasanz','M'),(4,'Sociedad de San Francisco de Sales (Salesianos de Don Bosco)',NULL,'SDB','Congregación fundada en 1841 en Turín (Italia) por San Juan Bosco','M'),(5,'Congregación de la Misión (Paúles)','Congregatio Missionis','CM','Congregación fundada en 1625 por San Vicente de Paúl','M'),(6,'Hijos del Inmaculado Corazón de María (Claretianos)','Cordis Mariae Filius','CMF','Congregación fundada en 1849 en Vich (España) por San Antonio María Claret','M'),(7,'Congregación del Oratorio de San Felipe Neri (Oratorianos)','Congregatio Oratorii Sancti Philippi Nerii','CO','Congregación iniciada por San Felipe Neri (1515-1595) erigida en 1575 por una bula de Gregorio XIII','M'),(8,'Congregación de la Pasión (Pasionistas)','	Ordo Congregationis Passionis','CP','Congregación fundada en 1720 en Alejandría (Italia) por San Pablo de la Cruz','M'),(9,'Clérigos Regulares (Teatinos)','Ordo Clericorum Regularium','CR','Orden fundada en 1524 en el Vaticano por San Cayetano de Thiene','M'),(10,'Canónigos Regulares de San Agustín','Ordo Canonicorum Regularium','CRSA','Organizados en el sínodo de Letrán de 1059 por impulso del cardenal Hildebrando, futuro Gregorio VII','M'),(11,'Pía Sociedad Turinesa de San José',NULL,'CSJ','Congregación fundada en 1873 en Turín (Italia) por San Leonardo Murialdo','M'),(12,'Congregación del Santísimo Redentor (Redentores)','	Congregatio Sanctissimi Redemptoris','CSSR','Congregación fundada en 1732 en Scala (Nápoles) por San Alfonso María de Ligorio','M'),(13,'Congregación de los Clérigos de San Viator',NULL,'CSV','Congregación fundada en 1831 en Lyon (Francia) por Luis Querbes','M'),(14,'Hijos de la Caridad',NULL,'FC','Congregación fundada en 1918 en París (Francia) por Emilio Anizán','M'),(15,'Compañía de Jesús (Jesuitas)','Societas Iesu','SJ','Congregación fundada en 1539 en Roma por San Ignacio de Loyola','M'),(16,'Hermanos de las Escuelas Cristianas','Institutum Fratrum Scholarum Christianarum','FSC','Congregación fundada en 1682 en Reims (Francia) por San Juan Bautista de la Salle','M'),(17,'Instituto de los Hermanos Maristas','Institutum Fratrum Maristarum','FMS','Congregación fundada en 1789 en Francia por Marcelino Champagnat','M'),(18,'Instituto de Misioneros de la Consolata',NULL,'IMC','Fundado en 1901 en Turín (Italia) por José Allamano','M'),(19,'Compañía de María (Marianistas)','Societas Mariae','SM','Congregación fundada en 1817 en Burdeos (Francia) por Guillermo Chaminade','M'),(20,'Legión de Cristo',NULL,'LC','Congregación fundada en 1941 en México por Marcial Maciel Degollado (1920), y aprobada por Pío XII en 1948','M'),(21,'Orden de Ministros de los Enfermos (Camilos)','Ordo Ministrantium Infirmis','MI','Orden fundada en 1584 en Italia por San Camilo de Lelis','M'),(22,'Misioneros de los Sagrados Corazones',NULL,'MSSCC','Congregación fundada en 1890 en el monte Randa de Mallorca (España) por Joaquín Rosselló','M'),(23,'Carmelitas Calzados','Ordo Carmelitarum','OCarm','Orden nacida a principios del siglo XIII en el monte Carmelo, los conventuales mitigados de los que se apartaron en 1565 los observantes descalzos','M'),(24,'Cartujos','Ordo Cartusiensis','OCart','Inspirada por San Bruno (1030-1101) la orden fue organizada por San Antelmo en 1140','M'),(25,'Carmelitas Descalzos','Ordo fratrum Carmelitarum Discalceatorum','OCD','Orden confirmada en 1565 por Pío IV aceptando la reforma de Santa Teresa de Jesús entre los carmelitas observantes y austeros','M'),(26,'Cistercienses','Ordo Cisterciensis','OCist','Orden monacal fundada en 1098 en Cister (Francia) por san Roberto de Molesmes','M'),(27,'Orden de la Merced (Mercedarios)','Orde de Mercede','OdeM','Orden fundada en 1218 en Barcelona (España) por San Pedro Nolasco','M'),(28,'Orden de la Compañía de María Nuestra Señora',NULL,'ODN','Orden fundada en 1607 en Burdeos (Francia) por Santa Juana de Lestonnac','M'),(29,'Orden de Hermanos Menores (Franciscanos)','Ordo Fratrum Minorum','OFM','Orden fundada en 1209 en Italia por San Francisco de Asís. En 1517 León X confirmó a los observantes esta denominación','M'),(30,'Capuchinos','	Ordo Fratrum Minorum Capuccinorum','OFMCap','Orden autorizada por Clemente VII en 1528','M'),(31,'Franciscanos Conventuales','Ordo Fratrum Minorum Conventualium','OFMConv','Orden diferenciada en 1517 por León X respecto de los franciscanos observantes OFM','M'),(32,'Orden Hospitalaria de San Juan de Dios','Ordo Hospitalarius','OH','Orden fundada en Granada (España) por San Juan de Dios, fallecido en 1550, aprobada por Paulo V en 1611','M'),(33,'Sagrada Orden de los Mínimos','Ordo Minimorum','OM','Orden mendicante fundada en 1435 en Italia por San Francisco de Paula','M'),(34,'Misioneros Oblatos de María Inmaculada','Congregatio Oblatorum Mariae Inmaculatae','OMI','Congregación fundada en 1816 en Aix de Provenza (Francia) por Carlos José Eugenio de Mazenod','M'),(35,'Orden de Predicadores (Dominicos)','Ordo Praedicatorum','OP','Orden fundada por Santo Domingo de Guzmán, aprobada por Honorio III en 1216','M'),(36,'Premonstratenses (Norbertinos)','Ordo Praemonstratensis','OPraem','Orden fundada en 1120 en Pratum Monstratum (Francia) por San Norberto','M'),(37,'Orden de Recoletos de San Agustín','Ordo Recollectorum Sancti Augustini','ORSA','Orden reconocida por Pío X en 1912','M'),(38,'Orden de San Agustín (Agustinos)','Ordo Sancti Augustini','OSA','Orden mendicante autorizada por el papa Alejandro IV en 1256','M'),(39,'Orden de San Benito (Benedictinos)','Ordo Sancti Benedicti','OSB','Orden fundada hacia el 529 en Monte Casino por San Benito de Nursia','M'),(40,'Orden de San Basilio (Basilios)','Ordo Sancti Basilii','OSBas','Orden heredera de la regla de San Basilio el Grande, siglo IV, que existió en España entre el siglo XVI y el XIX','M'),(41,'Orden de San Jerónimo (Jerónimos)','Ordo Sancti Hieronymi','OSH','Orden aprobada en 1373 en Aviñón por el papa Gregorio XI','M'),(42,'Sagrados Corazones de Jesús y de María y de la adoración perpetua del Santísimo Sacramento del Altar (Picpus)',NULL,'SSCC','Congregación fundada en 1800 en Poitiers (Francia) por Pedro Coudrin y Enriqueta Aymer, y aprobada en 1817 por Pío VII','M'),(43,'Agustinas Recoletas Misioneras de María',NULL,'ARMM','Congregación fundada en 1931 en Monteagudo (España) por Francisco Javier Ochoa','F'),(46,'Carmelitas de la Caridad','Carmelitae Charitatis','CaCh','Congregación fundada en 1826 en Vich (España) por Santa Joaquina de Vedruna de Mas','F'),(47,'Orden de Santa Clara (Clarisas)',NULL,'OSC','Orden fundada en 1212 en Italia por San Francisco de Asís y Santa Clara Favarone','F'),(48,'Otra',NULL,NULL,NULL,'N');
/*!40000 ALTER TABLE `orden_religiosa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_sacerdotal`
--

DROP TABLE IF EXISTS `orden_sacerdotal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_sacerdotal` (
  `numero_identidad` varchar(20) NOT NULL,
  `id_rango_sacerdotal` tinyint unsigned NOT NULL,
  `id_parroquia` smallint unsigned NOT NULL,
  `id_orden_religiosa` tinyint unsigned NOT NULL,
  `nombres` varchar(55) NOT NULL,
  `apellidos` varchar(55) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `lugar_nacimiento` char(4) DEFAULT NULL COMMENT 'Combinación de codigo_departamento + codigo_municipio (Ej: 0801)',
  `telefono` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `otra_orden_religiosa` varchar(255) DEFAULT NULL COMMENT 'En caso de que no encuentre la indicada en el listado',
  `es_parroco` tinyint NOT NULL DEFAULT '0' COMMENT '0=No, 1=Si',
  `estado_vital` tinyint NOT NULL DEFAULT '1' COMMENT '0=muerto, 1=vivo, 2=desaparecido',
  `imagen` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`numero_identidad`),
  KEY `orden_sacerdotal_ibfk_1_idx` (`id_rango_sacerdotal`),
  KEY `orden_sacerdotal_ibfk_2_idx` (`id_parroquia`),
  KEY `orden_sacerdotal_ibfk_3_idx` (`id_orden_religiosa`),
  CONSTRAINT `orden_sacerdotal_ibfk_1` FOREIGN KEY (`id_rango_sacerdotal`) REFERENCES `rango_orden_sacerdotal` (`id_rango_sacerdotal`),
  CONSTRAINT `orden_sacerdotal_ibfk_2` FOREIGN KEY (`id_parroquia`) REFERENCES `parroquia` (`id_parroquia`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_sacerdotal`
--

LOCK TABLES `orden_sacerdotal` WRITE;
/*!40000 ALTER TABLE `orden_sacerdotal` DISABLE KEYS */;
INSERT INTO `orden_sacerdotal` VALUES ('0826-1985-00322',2,2,0,'Javier','Martínez','1985-08-19','0826','9880-7949','javitz19@yahoo.com',NULL,1,1,NULL);
/*!40000 ALTER TABLE `orden_sacerdotal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagina`
--

DROP TABLE IF EXISTS `pagina`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagina` (
  `id_pagina` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(1000) DEFAULT NULL,
  `url` text NOT NULL,
  `estado` tinyint NOT NULL DEFAULT '1' COMMENT '0=Inactiva, 1=Activa',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario_creacion` mediumint NOT NULL COMMENT 'Usuario responsable de crear la página.',
  PRIMARY KEY (`id_pagina`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagina`
--

LOCK TABLES `pagina` WRITE;
/*!40000 ALTER TABLE `pagina` DISABLE KEYS */;
INSERT INTO `pagina` VALUES (1,'Login','Página de Inicio de Sesión al sistema','/views/login.php',1,'2022-09-14 11:27:02',2),(2,'Inicio','Página principal del sistema','/views/inicio.php',1,'2022-09-14 11:27:02',2),(3,'Usuarios','Manejo de usuarios que poseen acceso al sistema y sus respectivos roles','/views/usuarios.php',1,'2022-09-14 11:27:02',2),(4,'Personas','Manejo de personas que realizan sus sacramentos o pertenecen a una parroquia','/views/personas.php',1,'2022-09-14 11:27:02',2),(5,'Bautismo','Manejo de la información correspondiente al sacramento del Bautismo','/views/bautismo.php',1,'2022-09-14 11:27:02',2),(6,'Primera Comunión','Manejo de la información correspondiente al sacramento de la Primera Comunión (Eucaristía)','/views/primeraComunion.php',1,'2022-09-14 11:27:02',2),(7,'Confirma','Manejo de la información correspondiente al sacramento de la Confirmación','/views/confirma.php',1,'2022-09-14 11:27:02',2),(8,'Matrimonio','Manejo de la información correspondiente al sacramento del Matrimonio','/views/matrimonio.php',1,'2022-09-14 11:27:02',2),(9,'Sacerdotes','Manejo de sacerdotes que pertenecen a una parroquia y son encargados de suministrar los sacramentos','/views/sacerdotes.php',1,'2022-09-14 11:27:02',2),(10,'Parroquias','Manejo de la información de las parroquias registradas en el sistema','/views/parroquias.php',1,'2022-09-14 11:27:02',2),(11,'Agenda Parroquial','Calendario de actividades parroquiales','/views/agenda.php',1,'2022-09-14 11:27:02',2),(12,'Configuración','Gestión de opciones de configuración del sistema','/views/configuracion.php',1,'2022-09-14 11:27:02',2),(13,'Roles de Usuario','Manejo de roles de acceso al sistema aplicables a los usuarios','/views/rolesUsuario.php',1,'2022-09-14 11:27:02',2),(14,'Grupos Parroquiales','Manejo de los grupos o comunidades que pueden existir en cualquier parroquia','/views/gruposParroquiales.php',1,'2022-09-14 11:27:02',2),(15,'Roles Parroquiales','Manejo de los roles que se pueden asignar a una persona que pertenezca a algún grupo parroquial','/views/rolesParroquiales.php',1,'2022-09-14 11:27:02',2),(16,'Logout','Página de Cierre de Sesión del sistema','/views/logout.php',1,'2022-09-14 11:27:02',2);
/*!40000 ALTER TABLE `pagina` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parroquia`
--

DROP TABLE IF EXISTS `parroquia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parroquia` (
  `id_parroquia` smallint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `ubicacion` char(4) NOT NULL COMMENT 'Combinación de codigo_departamento + codigo_municipio (Ej: 0801)',
  `direccion` varchar(1000) NOT NULL,
  `telefono` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_parroquia`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parroquia`
--

LOCK TABLES `parroquia` WRITE;
/*!40000 ALTER TABLE `parroquia` DISABLE KEYS */;
INSERT INTO `parroquia` VALUES (1,'Ninguna','0000','Ninguna','Ninguno',NULL),(2,'Parroquia Cristo Resucitado','0801','Colonia Loarque, Calle Principal','9430-6883','cristohnresucitado@gmail.com');
/*!40000 ALTER TABLE `parroquia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `persona`
--

DROP TABLE IF EXISTS `persona`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `persona` (
  `numero_identidad` varchar(20) NOT NULL,
  `id_sector_parroquial` mediumint unsigned NOT NULL,
  `id_orden_religiosa` tinyint unsigned NOT NULL,
  `nombres` varchar(55) NOT NULL,
  `apellidos` varchar(55) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `lugar_nacimiento` char(4) NOT NULL COMMENT 'Combinación de codigo_departamento + codigo_municipio (Ej: 0801)',
  `sexo` char(1) NOT NULL COMMENT '''F''=femenino, ''M''=masculino',
  `telefono` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `direccion` varchar(1000) DEFAULT NULL,
  `estado_vital` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '0=fallecido, 1=vivo, 2=desaparecido',
  `estado_activo_parroquia` tinyint unsigned NOT NULL COMMENT '0=inactivo, 1=activo',
  `otra_orden_religiosa` varchar(255) DEFAULT NULL,
  `imagen` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`numero_identidad`),
  KEY `persona_ibfk_1_idx` (`id_sector_parroquial`),
  KEY `persona_ibfk_2_idx` (`id_orden_religiosa`),
  CONSTRAINT `persona_ibfk_1` FOREIGN KEY (`id_sector_parroquial`) REFERENCES `sector_parroquial` (`id_sector_parroquial`),
  CONSTRAINT `persona_ibfk_2` FOREIGN KEY (`id_orden_religiosa`) REFERENCES `orden_religiosa` (`id_orden_religiosa`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `persona`
--

LOCK TABLES `persona` WRITE;
/*!40000 ALTER TABLE `persona` DISABLE KEYS */;
/*!40000 ALTER TABLE `persona` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `primera_comunion`
--

DROP TABLE IF EXISTS `primera_comunion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `primera_comunion` (
  `id_primera_comunion` int unsigned NOT NULL AUTO_INCREMENT,
  `id_parroquia` smallint unsigned NOT NULL COMMENT 'Parroquia donde se celebró el Sacramento. En caso de que una persona pertenezca a otra parroquia.',
  `numero_identidad_persona` varchar(20) NOT NULL,
  `numero_identidad_madre` varchar(20) NOT NULL,
  `numero_identidad_padre` varchar(20) NOT NULL,
  `numero_identidad_catequista` varchar(20) NOT NULL,
  `numero_identidad_sacerdote` varchar(20) NOT NULL,
  `fecha_primera_comunion` datetime NOT NULL,
  `numero_acta` text NOT NULL,
  `numero_libro` text NOT NULL,
  `numero_pagina` text NOT NULL,
  `numero_registro` text NOT NULL,
  `nota_marginal` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id_primera_comunion`),
  KEY `numero_identidad_padre` (`numero_identidad_padre`),
  KEY `numero_identidad_madre` (`numero_identidad_madre`),
  KEY `numero_identidad_sacerdote` (`numero_identidad_sacerdote`),
  KEY `numero_identidad_persona` (`numero_identidad_persona`),
  KEY `primera_comunion_ibfk_1_idx` (`numero_identidad_catequista`),
  KEY `primera_comunion_ibfk_6_idx` (`id_parroquia`),
  CONSTRAINT `primera_comunion_ibfk_1` FOREIGN KEY (`numero_identidad_catequista`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `primera_comunion_ibfk_2` FOREIGN KEY (`numero_identidad_padre`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `primera_comunion_ibfk_3` FOREIGN KEY (`numero_identidad_madre`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `primera_comunion_ibfk_4` FOREIGN KEY (`numero_identidad_sacerdote`) REFERENCES `orden_sacerdotal` (`numero_identidad`),
  CONSTRAINT `primera_comunion_ibfk_5` FOREIGN KEY (`numero_identidad_persona`) REFERENCES `persona` (`numero_identidad`),
  CONSTRAINT `primera_comunion_ibfk_6` FOREIGN KEY (`id_parroquia`) REFERENCES `parroquia` (`id_parroquia`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `primera_comunion`
--

LOCK TABLES `primera_comunion` WRITE;
/*!40000 ALTER TABLE `primera_comunion` DISABLE KEYS */;
/*!40000 ALTER TABLE `primera_comunion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rango_orden_sacerdotal`
--

DROP TABLE IF EXISTS `rango_orden_sacerdotal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rango_orden_sacerdotal` (
  `id_rango_sacerdotal` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(55) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id_rango_sacerdotal`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rango_orden_sacerdotal`
--

LOCK TABLES `rango_orden_sacerdotal` WRITE;
/*!40000 ALTER TABLE `rango_orden_sacerdotal` DISABLE KEYS */;
INSERT INTO `rango_orden_sacerdotal` VALUES (1,'Diácono','Persona que ha recibido el ordenamiento sacerdotal, pero no puede llevar a cabo las potestades sacramentales'),(2,'Sacerdote','Persona que ha recibido el ordenamiento sacerdotal y puede llevar a cabo las potestades sacramentales'),(3,'Obispo','Sacerdote que ha sido puesto al frente de una diócesis o arquidiócesis');
/*!40000 ALTER TABLE `rango_orden_sacerdotal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol_parroquial`
--

DROP TABLE IF EXISTS `rol_parroquial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol_parroquial` (
  `id_rol_parroquial` smallint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(2500) DEFAULT NULL,
  PRIMARY KEY (`id_rol_parroquial`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol_parroquial`
--

LOCK TABLES `rol_parroquial` WRITE;
/*!40000 ALTER TABLE `rol_parroquial` DISABLE KEYS */;
/*!40000 ALTER TABLE `rol_parroquial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol_usuario`
--

DROP TABLE IF EXISTS `rol_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol_usuario` (
  `id_rol` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(55) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `estado` tinyint NOT NULL DEFAULT '1' COMMENT '0=Inactivo, 1=Activo',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario_creacion` mediumint NOT NULL COMMENT 'Usuario responsable de crear el rol.',
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol_usuario`
--

LOCK TABLES `rol_usuario` WRITE;
/*!40000 ALTER TABLE `rol_usuario` DISABLE KEYS */;
INSERT INTO `rol_usuario` VALUES (1,'Root','Usuario con acceso completo al sistema',1,'2022-08-25 22:07:17',2),(2,'Párroco','Sacerdote encargado de una parroquia específica',1,'2022-08-25 22:07:18',2),(3,'Secretaria','Persona encargada de las tareas administrativas de una parroquia específica',1,'2022-08-25 22:07:18',2);
/*!40000 ALTER TABLE `rol_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sector_parroquial`
--

DROP TABLE IF EXISTS `sector_parroquial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sector_parroquial` (
  `id_sector_parroquial` mediumint unsigned NOT NULL AUTO_INCREMENT,
  `id_parroquia` smallint unsigned NOT NULL,
  `id_tipo_sector_parroquial` tinyint unsigned NOT NULL,
  `nombre` varchar(55) NOT NULL,
  `nombre_capilla` varchar(55) DEFAULT NULL,
  `direccion` varchar(1000) NOT NULL,
  PRIMARY KEY (`id_sector_parroquial`),
  KEY `id_parroquia_idfx_1_idx` (`id_parroquia`),
  KEY `sector_parroquial_idfx_2_idx` (`id_tipo_sector_parroquial`),
  CONSTRAINT `sector_parroquial_idfx_1` FOREIGN KEY (`id_parroquia`) REFERENCES `parroquia` (`id_parroquia`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `sector_parroquial_idfx_2` FOREIGN KEY (`id_tipo_sector_parroquial`) REFERENCES `tipo_sector_parroquial` (`id_tipo_sector_parroquial`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sector_parroquial`
--

LOCK TABLES `sector_parroquial` WRITE;
/*!40000 ALTER TABLE `sector_parroquial` DISABLE KEYS */;
INSERT INTO `sector_parroquial` VALUES (1,1,1,'Ninguno',NULL,'Ninguna'),(2,2,1,'Sede Parroquial','Cristo Resucitado','Col. Loarque, calle principal'),(3,2,1,'Altos de loarque','Nuestra Señora del Carmen','Altos de Loarque'),(4,2,1,'Las Mercedes',NULL,'Residencial Las Mercedes'),(5,2,1,'Perisur','San José','Perisur'),(6,2,1,'Yaguacire','San Antonio de Padua','Yaguacire'),(7,2,1,'Fuerza Aérea Hondureña (FAH)','Capilla de la Fuerza Aérea','Cuartel general de la Fuerza Aérea Hondureña');
/*!40000 ALTER TABLE `sector_parroquial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_sector_parroquial`
--

DROP TABLE IF EXISTS `tipo_sector_parroquial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_sector_parroquial` (
  `id_tipo_sector_parroquial` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id_tipo_sector_parroquial`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_sector_parroquial`
--

LOCK TABLES `tipo_sector_parroquial` WRITE;
/*!40000 ALTER TABLE `tipo_sector_parroquial` DISABLE KEYS */;
INSERT INTO `tipo_sector_parroquial` VALUES (1,'Sector','Área poblacional mayormente urbana'),(2,'Aldea','Pueblo de menor tamaño ubicado en zonas rurales'),(3,'Caserío','Conjunto de viviendas tradicionales ubicadas en zonas o espacios rurales');
/*!40000 ALTER TABLE `tipo_sector_parroquial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tr_persona_grupo_rol`
--

DROP TABLE IF EXISTS `tr_persona_grupo_rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tr_persona_grupo_rol` (
  `numero_identidad` varchar(20) NOT NULL,
  `id_grupo_parroquial` smallint unsigned NOT NULL,
  `id_rol_parroquial` smallint unsigned NOT NULL,
  PRIMARY KEY (`numero_identidad`,`id_grupo_parroquial`,`id_rol_parroquial`),
  KEY `tr_feligres_grupo_rol_idfk_2_idx` (`id_grupo_parroquial`) /*!80000 INVISIBLE */,
  KEY `tr_feligres_grupo_rol_idfk_3_idx` (`id_rol_parroquial`),
  KEY `tr_feligres_grupo_rol_idfk_1_idx` (`numero_identidad`) /*!80000 INVISIBLE */,
  CONSTRAINT `tr_feligres_grupo_rol_idfk_1` FOREIGN KEY (`numero_identidad`) REFERENCES `persona` (`numero_identidad`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `tr_feligres_grupo_rol_idfk_2` FOREIGN KEY (`id_grupo_parroquial`) REFERENCES `grupo_parroquial` (`id_grupo_parroquial`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `tr_feligres_grupo_rol_idfk_3` FOREIGN KEY (`id_rol_parroquial`) REFERENCES `rol_parroquial` (`id_rol_parroquial`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tr_persona_grupo_rol`
--

LOCK TABLES `tr_persona_grupo_rol` WRITE;
/*!40000 ALTER TABLE `tr_persona_grupo_rol` DISABLE KEYS */;
/*!40000 ALTER TABLE `tr_persona_grupo_rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tr_rol_pagina`
--

DROP TABLE IF EXISTS `tr_rol_pagina`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tr_rol_pagina` (
  `id_rol` tinyint unsigned NOT NULL,
  `id_pagina` tinyint unsigned NOT NULL,
  `puede_ver` tinyint NOT NULL DEFAULT '1' COMMENT '0=No, 1=Si',
  `puede_crear` tinyint NOT NULL DEFAULT '0' COMMENT '0=No, 1=Si',
  `puede_actualizar` tinyint NOT NULL DEFAULT '0' COMMENT '0=No, 1=Si',
  `puede_borrar` tinyint NOT NULL DEFAULT '0' COMMENT '0=No, 1=Si',
  PRIMARY KEY (`id_rol`,`id_pagina`),
  KEY `tr_rol_pagina_ibfk_2_idx` (`id_pagina`) /*!80000 INVISIBLE */,
  KEY `tr_rol_pagina_ibfk_1_idx` (`id_rol`) /*!80000 INVISIBLE */,
  CONSTRAINT `tr_rol_pagina_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `rol_usuario` (`id_rol`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `tr_rol_pagina_ibfk_2` FOREIGN KEY (`id_pagina`) REFERENCES `pagina` (`id_pagina`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tr_rol_pagina`
--

LOCK TABLES `tr_rol_pagina` WRITE;
/*!40000 ALTER TABLE `tr_rol_pagina` DISABLE KEYS */;
INSERT INTO `tr_rol_pagina` VALUES (1,1,1,1,1,1),(1,2,1,1,1,1),(1,3,1,1,1,1),(1,4,1,1,1,1),(1,5,1,1,1,1),(1,6,1,1,1,1),(1,7,1,1,1,1),(1,8,1,1,1,1),(1,9,1,1,1,1),(1,10,1,1,1,1),(1,11,1,1,1,1),(1,12,1,1,1,1),(1,13,1,1,1,1),(1,14,1,1,1,1),(1,15,1,1,1,1),(1,16,1,1,1,1);
/*!40000 ALTER TABLE `tr_rol_pagina` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` mediumint unsigned NOT NULL AUTO_INCREMENT,
  `id_parroquia` smallint unsigned NOT NULL,
  `id_rol` tinyint unsigned NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contrasena` varbinary(10000) NOT NULL,
  `telefono` varchar(100) DEFAULT NULL,
  `estado` tinyint NOT NULL DEFAULT '1' COMMENT '0=Inactivo, 1=Activo',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario_creacion` mediumint NOT NULL COMMENT 'Usuario responsable de crear el registro del usuario.',
  PRIMARY KEY (`id_usuario`),
  KEY `usuario_ibfk_1_idx` (`id_parroquia`),
  KEY `usuario_ibfk_2_idx` (`id_rol`),
  CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`id_parroquia`) REFERENCES `parroquia` (`id_parroquia`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `usuario_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `rol_usuario` (`id_rol`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,1,1,'Andres Martínez','luismartinez.94mc@gmail.com',_binary 'Admin.1234','8898-4818[##]',1,'2022-08-25 22:25:38',2),(2,1,1,'Lidia Mejía','lidiamejiac29@gmail.com',_binary 'Admin.5678','9972-3232[##]',1,'2022-08-25 22:25:38',2);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'christi_fidelis'
--

--
-- Dumping routines for database 'christi_fidelis'
--
/*!50003 DROP PROCEDURE IF EXISTS `pagina_get_all_by_rol` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `pagina_get_all_by_rol`(IN id_rol_ TINYINT)
BEGIN

	SELECT
		p.id_pagina,
		p.nombre,
		tr.puede_ver,
		tr.puede_crear,
		tr.puede_actualizar,
		tr.puede_borrar
	FROM tr_rol_pagina tr
	INNER JOIN pagina p ON tr.id_pagina = p.id_pagina
	WHERE tr.id_rol = id_rol_;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `user_get_one_by_email` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `user_get_one_by_email`(IN email_ VARCHAR(255))
BEGIN

	SELECT 
		u.id_usuario,
		u.id_parroquia,
		u.id_rol,
		u.nombre AS nombre_user,
		u.email,
		u.contrasena,
		u.estado AS estado_user,
		p.nombre AS nombre_parroquia,
		r.nombre AS nombre_rol,
		r.descripcion AS desc_rol,
		r.estado AS estado_rol
	FROM usuario u
	INNER JOIN parroquia p ON u.id_parroquia = p.id_parroquia
	INNER JOIN rol_usuario r ON u.id_rol = r.id_rol
	WHERE u.email = email_;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-09-15 15:37:04
