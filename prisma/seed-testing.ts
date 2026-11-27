/**
 * ChristiFideles — Seed de TESTING (exclusivo de la rama `testing`)
 *
 * Carga datos de prueba en volumen para probar la aplicación de punta a punta:
 *
 *   | Módulo                 | Registros |
 *   |------------------------|-----------|
 *   | Sectores parroquiales  | 100       |
 *   | Personas               | ~720      |
 *   | Clero (orden sacerdotal)| 100      |
 *   | Usuarios               | 100       |
 *   | Bautismos              | 160       |
 *   | Primeras comuniones    | 130       |
 *   | Confirmaciones         | 115       |
 *   | Matrimonios            | 120       |
 *
 * Incluye casos límite a propósito: nombres largos y con tildes, personas
 * fallecidas, sacerdotes inactivos, bautismos solo con madre o con un solo
 * padrino, notas marginales, nacimientos el 29 de febrero y fechas el día 1.
 * Configura párroco y vicario para probar las certificaciones.
 *
 * Datos ficticios y deterministas (misma semilla → mismos datos). Los DNI son
 * inventados y usan el rango 7xxxx para no chocar con los seeds de dev y demo.
 *
 * Idempotente: puede correrse varias veces; no duplica ni borra nada.
 *
 * Protección:
 *   - Exige ALLOW_TESTING_SEED=true y TESTING_PASSWORD (8+ caracteres, no se imprime).
 *   - Se niega a correr si la parroquia ya tiene sacramentos y no está marcada
 *     como entorno de testing (parroquia_parametro clave 'entorno').
 *   - Se niega si DATABASE_URL parece de producción.
 *
 * Uso (base de testing, NUNCA la de una parroquia real):
 *
 *   export ALLOW_TESTING_SEED=true
 *   export TESTING_PASSWORD='...'
 *   pnpm prisma migrate deploy
 *   pnpm db:seed:testing
 *
 * Usuarios creados (todos con TESTING_PASSWORD):
 *   testing-admin@christifideles.test       Super Admin
 *   testing-parroco@christifideles.test     Párroco
 *   testing-secretaria@christifideles.test  Secretaria
 *   testing-catequista@christifideles.test  Catequista
 *   testing-lectura@christifideles.test     Solo Lectura
 *   usuario001…095@christifideles.test      roles variados (algunos inactivos)
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { loadEnvFile } from 'node:process';
import { leerParroquiaDesdeEnv } from '../src/lib/instancia-env';
import { sembrarCatalogos } from './catalogos/sembrar';

try {
  loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

const prisma = new PrismaClient();

const SEMILLA = 20261127;
const CLAVE_ENTORNO = 'entorno';
const DOMINIO = 'christifideles.test';
const LIBRO_BASE = 101; // libros 101+ para no chocar con demo/dev

// ---------------------------------------------------------------------------
// Aleatorio determinista (mulberry32)
// ---------------------------------------------------------------------------
function crearAleatorio(semilla: number) {
  let a = semilla >>> 0;
  const siguiente = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    num: siguiente,
    entero: (min: number, max: number) => min + Math.floor(siguiente() * (max - min + 1)),
    elegir: <T>(lista: readonly T[]): T => lista[Math.floor(siguiente() * lista.length)],
    prob: (p: number) => siguiente() < p,
  };
}
const rnd = crearAleatorio(SEMILLA);

// ---------------------------------------------------------------------------
// Catálogos de nombres (Honduras)
// ---------------------------------------------------------------------------
const NOMBRES_M = [
  'José', 'Juan Carlos', 'Luis Fernando', 'Carlos Roberto', 'Miguel Ángel', 'Jorge Alberto', 'Francisco Javier',
  'Óscar Danilo', 'Marvin', 'Wilmer', 'Héctor Manuel', 'Kevin Josué', 'Dennis Arturo', 'Erick Saúl', 'Allan',
  'Mario Roberto', 'Víctor Hugo', 'Elvin', 'Selvin', 'José Ramón', 'Jesús', 'Andrés Felipe', 'Darwin', 'Nelson',
];
const NOMBRES_F = [
  'María José', 'Ana Lucía', 'Karla Patricia', 'Dania Yolibeth', 'Sofía', 'Gabriela', 'Lesly Carolina', 'Wendy',
  'Iris Marlen', 'Rosa Elena', 'Ángela María', 'Glenda', 'Sandra Liseth', 'Fátima', 'Nohemí', 'Keila Yamileth',
  'Lourdes', 'Marta Eugenia', 'Daniela', 'Jennifer', 'Reina Isabel', 'Xiomara', 'Belkis', 'Suyapa',
];
const APELLIDOS = [
  'Martínez', 'López', 'Hernández', 'Rodríguez', 'García', 'Mejía', 'Flores', 'Reyes', 'Cruz', 'Zelaya', 'Ramírez',
  'Castillo', 'Aguilar', 'Bonilla', 'Ordóñez', 'Pineda', 'Fúnez', 'Maradiaga', 'Membreño', 'Cárcamo', 'Ávila',
  'Sierra', 'Turcios', 'Osorto', 'Banegas', 'Matamoros', 'Velásquez', 'Rivera', 'Paz', 'Núñez',
];
// Casos límite de longitud (los nombres largos ponen a prueba las certificaciones).
const NOMBRES_LARGOS_F = ['María de los Ángeles Guadalupe', 'Ana Lucía del Carmen Fernanda'];
const NOMBRES_LARGOS_M = ['José Francisco de Jesús Antonio', 'Juan Bautista María de la Cruz'];
const APELLIDO_LARGO = 'Hernández Castellanos de la Fuente';

const LUGARES_SECTOR = [
  'Loarque', 'Las Uvas', 'San José de la Vega', 'Kennedy', 'Villa Nueva', 'El Pedregal', 'Cerro Grande', 'Las Torres',
  'Satélite', 'San Miguel', 'La Era', 'Los Pinos', 'El Hato', 'Flor del Campo', 'Altos de Loarque', 'Tiloarque',
  'Villa Olímpica', 'Monterrey', 'San Francisco', 'La Cañada',
];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
type Sexo = 'M' | 'F';
interface PersonaSeed {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: Date;
  sexo: Sexo;
  estado_vital: number;
}

let correlativo = 70000;
function dni(municipio: string, anio: number): string {
  correlativo += 1;
  return `${municipio}-${anio}-${String(correlativo).padStart(5, '0')}`;
}

function fecha(anio: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(anio, mes - 1, dia));
}
function fechaAleatoria(anioDesde: number, anioHasta: number): Date {
  const anio = rnd.entero(anioDesde, anioHasta);
  return fecha(anio, rnd.entero(1, 12), rnd.entero(1, 28));
}
/** Celebración a media mañana, hora de Honduras (UTC-6). */
function celebracion(base: Date): Date {
  const d = new Date(base);
  d.setUTCHours(16, 0, 0, 0);
  return d;
}
function sumarMeses(base: Date, meses: number): Date {
  const d = new Date(base);
  d.setUTCMonth(d.getUTCMonth() + meses);
  return d;
}
const HOY = new Date();
function noFutura(d: Date): Date {
  return d > HOY ? new Date(HOY.getTime() - 86_400_000) : d;
}

function nombrePersona(sexo: Sexo, largo = false): { nombres: string; apellidos: string } {
  if (largo) {
    return {
      nombres: rnd.elegir(sexo === 'F' ? NOMBRES_LARGOS_F : NOMBRES_LARGOS_M),
      apellidos: APELLIDO_LARGO,
    };
  }
  return {
    nombres: rnd.elegir(sexo === 'F' ? NOMBRES_F : NOMBRES_M),
    apellidos: `${rnd.elegir(APELLIDOS)} ${rnd.elegir(APELLIDOS)}`,
  };
}

async function asegurarTipoSector(nombre: string) {
  const existente = await prisma.tipoSectorParroquial.findFirst({ where: { nombre }, orderBy: { id_tipo_sector_parroquial: 'asc' } });
  return existente ?? prisma.tipoSectorParroquial.create({ data: { nombre, descripcion: nombre } });
}

async function rangoPorNombre(nombre: string) {
  return prisma.rangoOrdenSacerdotal.findFirstOrThrow({ where: { nombre }, orderBy: { id_rango_sacerdotal: 'asc' } });
}

// ---------------------------------------------------------------------------
// Protecciones
// ---------------------------------------------------------------------------
function verificarEntorno(): string {
  if (process.env.ALLOW_TESTING_SEED !== 'true') {
    throw new Error('Seed de testing bloqueado: define ALLOW_TESTING_SEED=true (solo en la base de testing).');
  }
  const password = process.env.TESTING_PASSWORD?.trim();
  if (!password || password.length < 8) {
    throw new Error('Define TESTING_PASSWORD con al menos 8 caracteres.');
  }
  const url = process.env.DATABASE_URL ?? '';
  if (/(^|[-_.\/@])(prod|production)([-_.\/:]|$)/i.test(url)) {
    throw new Error('Seed de testing bloqueado: DATABASE_URL parece de producción.');
  }
  return password;
}

async function verificarParroquiaDeTesting(idParroquia: number): Promise<void> {
  const marca = await prisma.parroquiaParametro.findUnique({
    where: { id_parroquia_clave: { id_parroquia: idParroquia, clave: CLAVE_ENTORNO } },
  });
  const esTesting = (marca?.valor as { tipo?: string } | null)?.tipo === 'testing';
  if (esTesting) return;
  const [b, c, f, m] = await Promise.all([
    prisma.bautismo.count({ where: { id_parroquia: idParroquia } }),
    prisma.primeraComunion.count({ where: { id_parroquia: idParroquia } }),
    prisma.confirmacion.count({ where: { id_parroquia: idParroquia } }),
    prisma.matrimonio.count({ where: { id_parroquia: idParroquia } }),
  ]);
  // El seed de dev/demo deja unos pocos registros; más que eso parece una parroquia real.
  if (b + c + f + m > 10) {
    throw new Error(
      `La parroquia ${idParroquia} ya tiene ${b + c + f + m} sacramentos y no está marcada como testing. ` +
        'Por seguridad no se cargan datos de prueba sobre datos reales.',
    );
  }
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------
async function main() {
  const password = verificarEntorno();
  console.log('Seed de TESTING: iniciando…');

  await sembrarCatalogos(prisma);

  const parroquia =
    (await prisma.parroquia.findFirst({ orderBy: { id_parroquia: 'asc' } })) ??
    (await prisma.parroquia.create({ data: leerParroquiaDesdeEnv() }));
  const idParroquia = parroquia.id_parroquia;
  await verificarParroquiaDeTesting(idParroquia);
  await prisma.parroquiaParametro.upsert({
    where: { id_parroquia_clave: { id_parroquia: idParroquia, clave: CLAVE_ENTORNO } },
    update: { valor: { tipo: 'testing', seed: 'seed-testing.ts', semilla: SEMILLA } },
    create: { id_parroquia: idParroquia, clave: CLAVE_ENTORNO, valor: { tipo: 'testing', seed: 'seed-testing.ts', semilla: SEMILLA } },
  });
  console.log(`✓ Parroquia ${parroquia.nombre} (id ${idParroquia}) marcada como testing`);

  // Municipios reales del catálogo, con preferencia por Francisco Morazán.
  const municipios = (await prisma.municipio.findMany({ select: { codigo_municipio: true }, orderBy: { codigo_municipio: 'asc' } }))
    .map((m) => m.codigo_municipio);
  const municipiosFM = municipios.filter((m) => m.startsWith('08'));
  const municipio = () => (rnd.prob(0.7) && municipiosFM.length ? rnd.elegir(municipiosFM) : rnd.elegir(municipios));
  const municipioDe = (d: string) => d.slice(0, 4);

  const ordenDiocesana = await prisma.ordenReligiosa.findFirstOrThrow({ where: { nombre: 'Diocesano' }, orderBy: { id_orden_religiosa: 'asc' } });
  const ordenSalesiana = await prisma.ordenReligiosa.findFirstOrThrow({ where: { nombre: 'Salesiano' }, orderBy: { id_orden_religiosa: 'asc' } });

  // ---------------- Sectores (100) ----------------
  const tipos = await Promise.all(['Colonia', 'Barrio', 'Aldea', 'Caserío'].map(asegurarTipoSector));
  const prefijoSector = 'QA ';
  const sectoresExistentes = new Set(
    (await prisma.sectorParroquial.findMany({ where: { id_parroquia: idParroquia, nombre: { startsWith: prefijoSector } }, select: { nombre: true } }))
      .map((s) => s.nombre),
  );
  const sectoresNuevos: Prisma.SectorParroquialCreateManyInput[] = [];
  for (let i = 1; i <= 100; i++) {
    const tipo = tipos[(i - 1) % tipos.length];
    const lugar = LUGARES_SECTOR[(i - 1) % LUGARES_SECTOR.length];
    // nombre: VARCHAR(55)
    const nombre = `${prefijoSector}${String(i).padStart(3, '0')} ${tipo.nombre} ${lugar}`.slice(0, 55);
    // Se consume el aleatorio siempre, exista o no el sector: así cada corrida
    // genera la misma secuencia (los mismos DNI) y el seed es idempotente.
    const capilla = rnd.elegir(['San José', 'Santa Rosa', 'La Merced', 'San Martín', 'Divina Providencia']);
    if (sectoresExistentes.has(nombre)) continue;
    sectoresNuevos.push({
      id_parroquia: idParroquia,
      id_tipo_sector_parroquial: tipo.id_tipo_sector_parroquial,
      nombre,
      nombre_capilla: i % 3 === 0 ? `Capilla ${capilla}` : null,
      direccion: `${tipo.nombre} ${lugar}, Distrito Central, Francisco Morazán`,
    });
  }
  if (sectoresNuevos.length) await prisma.sectorParroquial.createMany({ data: sectoresNuevos });
  const sectores = await prisma.sectorParroquial.findMany({
    where: { id_parroquia: idParroquia, nombre: { startsWith: prefijoSector } },
    select: { id_sector_parroquial: true },
    orderBy: { nombre: 'asc' },
  });
  console.log(`✓ Sectores: ${sectores.length}`);

  // ---------------- Personas ----------------
  const personas: PersonaSeed[] = [];
  const nuevaPersona = (sexo: Sexo, nacimiento: Date, opciones: { largo?: boolean; fallecida?: boolean } = {}): PersonaSeed => {
    const p: PersonaSeed = {
      numero_identidad: dni(municipio(), nacimiento.getUTCFullYear()),
      ...nombrePersona(sexo, opciones.largo),
      fecha_nacimiento: nacimiento,
      sexo,
      estado_vital: opciones.fallecida ? 0 : 1,
    };
    personas.push(p);
    return p;
  };

  // Clero (100)
  const clero = Array.from({ length: 100 }, () => nuevaPersona('M', fechaAleatoria(1945, 1992)));
  clero.forEach((c, i) => {
    if (i < 10) c.nombres = `Mons. ${c.nombres}`;
    else if (i < 86) c.nombres = `Pbro. ${c.nombres}`;
    else c.nombres = `Diác. ${c.nombres}`;
  });

  // Catequistas (20) y padrinos (60 hombres + 60 mujeres)
  const catequistas = Array.from({ length: 20 }, () => nuevaPersona(rnd.prob(0.7) ? 'F' : 'M', fechaAleatoria(1965, 2000)));
  const padrinos = Array.from({ length: 60 }, (_, i) => nuevaPersona('M', fechaAleatoria(1950, 2000), { fallecida: i % 25 === 24 }));
  const madrinas = Array.from({ length: 60 }, (_, i) => nuevaPersona('F', fechaAleatoria(1950, 2000), { fallecida: i % 25 === 24 }));

  // Familias (160): matrimonio → hijo(a)
  // Hijos 0–114 nacen 1996–2009 (tendrán comunión y confirmación), 115–139 en 2010–2015
  // (comunión), 140–159 en 2016–2020 (solo bautismo).
  interface Familia { padre: PersonaSeed; madre: PersonaSeed; hijo: PersonaSeed; boda: Date }
  const familias: Familia[] = [];
  for (let i = 0; i < 160; i++) {
    const anioHijo = i < 115 ? rnd.entero(1996, 2009) : i < 140 ? rnd.entero(2010, 2015) : rnd.entero(2016, 2020);
    let nacimientoHijo = fecha(anioHijo, rnd.entero(1, 12), rnd.entero(1, 28));
    if (i === 7) nacimientoHijo = fecha(2004, 2, 29); // caso límite: 29 de febrero
    if (i === 8) nacimientoHijo = fecha(2001, 1, 1); // caso límite: día 1
    const boda = sumarMeses(nacimientoHijo, -rnd.entero(12, 60));
    const padre = nuevaPersona('M', fecha(boda.getUTCFullYear() - rnd.entero(22, 35), rnd.entero(1, 12), rnd.entero(1, 28)), { fallecida: i % 40 === 39 });
    const madre = nuevaPersona('F', fecha(boda.getUTCFullYear() - rnd.entero(20, 32), rnd.entero(1, 12), rnd.entero(1, 28)));
    const sexoHijo: Sexo = rnd.prob(0.5) ? 'F' : 'M';
    const hijo = nuevaPersona(sexoHijo, nacimientoHijo, { largo: i % 20 === 0 });
    // Los hijos llevan los apellidos de sus padres.
    if (i % 20 !== 0) hijo.apellidos = `${padre.apellidos.split(' ')[0]} ${madre.apellidos.split(' ')[0]}`;
    familias.push({ padre, madre, hijo, boda });
  }

  const resultadoPersonas = await prisma.persona.createMany({
    data: personas.map((p) => ({
      ...p,
      id_parroquia: idParroquia,
      id_sector_parroquial: rnd.elegir(sectores).id_sector_parroquial,
      id_orden_religiosa: ordenDiocesana.id_orden_religiosa,
      lugar_nacimiento: municipioDe(p.numero_identidad),
      telefono: `+504 9${String(rnd.entero(100, 999))}-${String(rnd.entero(1000, 9999))}`,
      email: rnd.prob(0.3) ? `${p.numero_identidad.replace(/-/g, '')}@${DOMINIO}` : null,
      direccion: `${rnd.elegir(LUGARES_SECTOR)}, Distrito Central`,
      estado_activo_parroquia: 1,
    })),
    skipDuplicates: true,
  });
  console.log(`✓ Personas: ${personas.length} (${resultadoPersonas.count} nuevas)`);

  // ---------------- Clero (100) ----------------
  const [rangoObispo, rangoSacerdote, rangoDiacono] = await Promise.all([
    rangoPorNombre('Obispo'),
    rangoPorNombre('Sacerdote'),
    rangoPorNombre('Diácono'),
  ]);
  const rangoDe = (i: number) => (i < 10 ? rangoObispo : i < 86 ? rangoSacerdote : rangoDiacono);
  const INACTIVOS = new Set([83, 84, 85]); // sacerdotes con estado ministerial inactivo
  await prisma.ordenSacerdotal.createMany({
    data: clero.map((c, i) => ({
      id_parroquia: idParroquia,
      numero_identidad: c.numero_identidad,
      id_rango_sacerdotal: rangoDe(i).id_rango_sacerdotal,
      id_orden_religiosa: i % 7 === 0 ? ordenSalesiana.id_orden_religiosa : ordenDiocesana.id_orden_religiosa,
      es_parroco: i === 10 ? 1 : 0,
      estado_ministerial: INACTIVOS.has(i) ? 0 : 1,
    })),
    skipDuplicates: true,
  });
  console.log('✓ Clero: 100 (10 obispos, 76 sacerdotes, 14 diáconos; 3 inactivos)');

  const obispos = clero.slice(0, 10);
  const sacerdotesActivos = clero.slice(10, 86).filter((_, k) => !INACTIVOS.has(k + 10));
  const ministrosBautismo = [...sacerdotesActivos, ...clero.slice(86)];
  const parroco = clero[10];
  const vicario = clero[11];

  await prisma.parroquiaConfig.upsert({
    where: { id_parroquia: idParroquia },
    update: { parroco_nombre: `${parroco.nombres} ${parroco.apellidos}`, vicario_nombre: `${vicario.nombres} ${vicario.apellidos}` },
    create: {
      id_parroquia: idParroquia,
      alias_liturgico: parroquia.nombre,
      parroco_nombre: `${parroco.nombres} ${parroco.apellidos}`,
      vicario_nombre: `${vicario.nombres} ${vicario.apellidos}`,
      tz: 'America/Tegucigalpa',
      idioma: 'es',
      opciones: {},
    },
  });
  console.log('✓ Párroco y vicario configurados');

  const padrinoVivo = () => {
    let p = rnd.elegir(padrinos);
    while (p.estado_vital !== 1) p = rnd.elegir(padrinos);
    return p;
  };
  const madrinaViva = () => {
    let p = rnd.elegir(madrinas);
    while (p.estado_vital !== 1) p = rnd.elegir(madrinas);
    return p;
  };
  const NOTAS = [
    'Contrajo matrimonio canónico en esta parroquia.',
    'Se corrigió el segundo apellido según partida de nacimiento del RNP.',
    'Confirmado(a) en la Parroquia San Miguel Arcángel.',
    'Nota marginal de prueba con texto largo para verificar el ajuste de línea en las certificaciones impresas en papel sellado.',
  ];
  const nota = () => (rnd.prob(0.1) ? rnd.elegir(NOTAS) : null);
  const numeracion = (i: number) => ({
    numero_libro: String(LIBRO_BASE + Math.floor(i / 50)),
    numero_pagina: String(Math.floor((i % 50) / 2) + 1),
    numero_registro: String(i + 1),
  });

  // ---------------- Bautismos (160) ----------------
  const bautismos: Prisma.BautismoCreateManyInput[] = familias.map((f, i) => {
    const soloMadre = i % 10 === 3;
    const tipoPadrinos = i % 7; // 0: solo padrino · 1: solo madrina · resto: ambos
    const n = numeracion(i);
    return {
      id_parroquia: idParroquia,
      numero_identidad_bautizado: f.hijo.numero_identidad,
      numero_identidad_padre: soloMadre ? null : f.padre.numero_identidad,
      numero_identidad_madre: f.madre.numero_identidad,
      numero_identidad_padrino: tipoPadrinos === 1 ? null : padrinoVivo().numero_identidad,
      numero_identidad_madrina: tipoPadrinos === 0 ? null : madrinaViva().numero_identidad,
      numero_identidad_catequista: rnd.elegir(catequistas).numero_identidad,
      numero_identidad_sacerdote: rnd.elegir(ministrosBautismo).numero_identidad,
      fecha_bautismo: noFutura(celebracion(sumarMeses(f.hijo.fecha_nacimiento, rnd.entero(1, 24)))),
      numero_folio: n.numero_pagina,
      ...n,
      nota_marginal: nota(),
    };
  });
  const rB = await prisma.bautismo.createMany({ data: bautismos, skipDuplicates: true });
  console.log(`✓ Bautismos: ${bautismos.length} (${rB.count} nuevos)`);

  // ---------------- Primeras comuniones (130) ----------------
  const comuniones: Prisma.PrimeraComunionCreateManyInput[] = familias.slice(0, 130).map((f, i) => ({
    id_parroquia: idParroquia,
    numero_identidad_persona: f.hijo.numero_identidad,
    numero_identidad_padre: i % 10 === 3 ? null : f.padre.numero_identidad,
    numero_identidad_madre: f.madre.numero_identidad,
    numero_identidad_catequista: rnd.elegir(catequistas).numero_identidad,
    numero_identidad_sacerdote: rnd.elegir(sacerdotesActivos).numero_identidad,
    fecha_primera_comunion: noFutura(celebracion(sumarMeses(f.hijo.fecha_nacimiento, rnd.entero(9 * 12, 10 * 12)))),
    numero_acta: String(i + 1),
    ...numeracion(i),
    nota_marginal: nota(),
  }));
  const rC = await prisma.primeraComunion.createMany({ data: comuniones, skipDuplicates: true });
  console.log(`✓ Primeras comuniones: ${comuniones.length} (${rC.count} nuevas)`);

  // ---------------- Confirmaciones (115) ----------------
  const confirmaciones: Prisma.ConfirmacionCreateManyInput[] = familias.slice(0, 115).map((f, i) => ({
    id_parroquia: idParroquia,
    numero_identidad_confirmado: f.hijo.numero_identidad,
    numero_identidad_padre: i % 10 === 3 ? null : f.padre.numero_identidad,
    numero_identidad_madre: f.madre.numero_identidad,
    numero_identidad_padrino: padrinoVivo().numero_identidad,
    numero_identidad_madrina: madrinaViva().numero_identidad,
    numero_identidad_catequista: rnd.elegir(catequistas).numero_identidad,
    numero_identidad_obispo: rnd.elegir(obispos).numero_identidad,
    fecha_confirmacion: noFutura(celebracion(sumarMeses(f.hijo.fecha_nacimiento, rnd.entero(14 * 12, 16 * 12)))),
    numero_acta: String(i + 1),
    ...numeracion(i),
    nota_marginal: nota(),
  }));
  const rF = await prisma.confirmacion.createMany({ data: confirmaciones, skipDuplicates: true });
  console.log(`✓ Confirmaciones: ${confirmaciones.length} (${rF.count} nuevas)`);

  // ---------------- Matrimonios (120) ----------------
  const matrimonios: Prisma.MatrimonioCreateManyInput[] = familias.slice(0, 120).map((f, i) => ({
    id_parroquia: idParroquia,
    numero_identidad_esposo: f.padre.numero_identidad,
    numero_identidad_esposa: f.madre.numero_identidad,
    numero_identidad_padrino: padrinoVivo().numero_identidad,
    numero_identidad_madrina: madrinaViva().numero_identidad,
    numero_identidad_sacerdote: rnd.elegir(sacerdotesActivos).numero_identidad,
    fecha_matrimonio: celebracion(f.boda),
    numero_acta: String(i + 1),
    ...numeracion(i),
    nota_marginal: nota(),
  }));
  const rM = await prisma.matrimonio.createMany({ data: matrimonios, skipDuplicates: true });
  console.log(`✓ Matrimonios: ${matrimonios.length} (${rM.count} nuevos)`);

  // ---------------- Numeradores ----------------
  for (const [modulo, total] of [
    ['bautismo', bautismos.length],
    ['primera_comunion', comuniones.length],
    ['confirmacion', confirmaciones.length],
    ['matrimonio', matrimonios.length],
  ] as const) {
    const ultimo = numeracion(total - 1);
    const valores = {
      ultimo_libro: Number(ultimo.numero_libro),
      ultimo_folio: Number(ultimo.numero_pagina),
      ultimo_acta: modulo === 'bautismo' ? 0 : total,
      ultimo_registro: total,
    };
    await prisma.numeradores.upsert({
      where: { id_parroquia_modulo_scope: { id_parroquia: idParroquia, modulo, scope: 'general' } },
      update: valores,
      create: { id_parroquia: idParroquia, modulo, scope: 'general', ...valores },
    });
  }
  console.log('✓ Numeradores actualizados');

  // ---------------- Usuarios (100) ----------------
  const roles = new Map(
    (await prisma.rolUsuario.findMany({ select: { id_rol: true, nombre: true } })).map((r) => [r.nombre, r.id_rol]),
  );
  const rol = (nombre: string) => {
    const id = roles.get(nombre);
    if (id === undefined) throw new Error(`Falta el rol "${nombre}" (corre los catálogos).`);
    return id;
  };
  const passwordHash = Buffer.from(await hash(password, 12));
  const usuarios: Prisma.UsuarioCreateManyInput[] = [
    ['testing-admin', 'Testing Admin', 'Super Admin'],
    ['testing-parroco', 'Testing Párroco', 'Párroco'],
    ['testing-secretaria', 'Testing Secretaria', 'Secretaria'],
    ['testing-catequista', 'Testing Catequista', 'Catequista'],
    ['testing-lectura', 'Testing Solo Lectura', 'Solo Lectura'],
  ].map(([usuario, nombre, nombreRol]) => ({
    id_parroquia: idParroquia,
    id_rol: rol(nombreRol),
    nombre,
    email: `${usuario}@${DOMINIO}`,
    contrasena: passwordHash,
    telefono: '+504 0000-0000',
    estado: 1,
    id_usuario_creacion: BigInt(0),
  }));
  const ROLES_VARIADOS = ['Secretaria', 'Catequista', 'Solo Lectura', 'Vicario', 'Sacerdote', 'Diácono', 'Admin Parroquia'];
  for (let i = 1; i <= 95; i++) {
    const sexo: Sexo = rnd.prob(0.5) ? 'F' : 'M';
    const { nombres, apellidos } = nombrePersona(sexo);
    usuarios.push({
      id_parroquia: idParroquia,
      id_rol: rol(ROLES_VARIADOS[i % ROLES_VARIADOS.length]),
      nombre: `${nombres} ${apellidos}`.slice(0, 100),
      email: `usuario${String(i).padStart(3, '0')}@${DOMINIO}`,
      contrasena: passwordHash,
      telefono: `+504 9${String(rnd.entero(100, 999))}-${String(rnd.entero(1000, 9999))}`,
      estado: i % 10 === 0 ? 0 : 1, // 10 % inactivos
      id_usuario_creacion: BigInt(0),
    });
  }
  const rU = await prisma.usuario.createMany({ data: usuarios, skipDuplicates: true });
  console.log(`✓ Usuarios: ${usuarios.length} (${rU.count} nuevos)`);

  console.log('✓ Seed de TESTING completado');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Seed de testing falló.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
