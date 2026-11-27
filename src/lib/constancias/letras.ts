/**
 * Números y fechas en letras (español) para las certificaciones con el
 * formato de la Arquidiócesis de Tegucigalpa. Sin dependencias externas.
 */

const UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DIEZ_A_VEINTINUEVE = [
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete',
  'veintiocho', 'veintinueve',
];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos',
  'ochocientos', 'novecientos',
];

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function menorQueCien(n: number): string {
  if (n < 10) return UNIDADES[n];
  if (n < 30) return DIEZ_A_VEINTINUEVE[n - 10];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${UNIDADES[u]}`;
}

function menorQueMil(n: number): string {
  if (n < 100) return menorQueCien(n);
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  return resto === 0 ? CENTENAS[c] : `${CENTENAS[c]} ${menorQueCien(resto)}`;
}

/** Convierte un entero entre 0 y 9999 a letras (ej. 1999 → "mil novecientos noventa y nueve"). */
export function numeroALetras(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) {
    throw new RangeError(`numeroALetras admite enteros de 0 a 9999 (recibido: ${n})`);
  }
  if (n < 1000) return menorQueMil(n);
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  const prefijo = miles === 1 ? 'mil' : `${UNIDADES[miles]} mil`;
  return resto === 0 ? prefijo : `${prefijo} ${menorQueMil(resto)}`;
}

export interface PartesFecha {
  dia: number;
  mes: number; // 1-12
  anio: number;
}

/** Día, mes y año de una fecha en la zona horaria indicada. */
export function partesFecha(fecha: Date, tz: string): PartesFecha {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(fecha);
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  return { dia: valor('day'), mes: valor('month'), anio: valor('year') };
}

/** Día en letras para una fecha: el 1 se escribe "primero" (uso tradicional en las partidas). */
export function diaEnLetras(dia: number): string {
  return dia === 1 ? 'primero' : numeroALetras(dia);
}

/** "cinco de octubre de dos mil cinco". Devuelve '' si no hay fecha. */
export function fechaEnLetras(fecha: Date | null, tz: string): string {
  if (!fecha) return '';
  const { dia, mes, anio } = partesFecha(fecha, tz);
  return `${diaEnLetras(dia)} de ${MESES[mes - 1]} de ${numeroALetras(anio)}`;
}

/**
 * Cierre de la certificación: "a los veintinueve (29) días del mes de agosto de 2026"
 * o "al primer (1) día del mes de agosto de 2026".
 */
export function fechaEmisionTexto(p: PartesFecha): string {
  const mes = MESES[p.mes - 1];
  if (p.dia === 1) return `al primer (1) día del mes de ${mes} de ${p.anio}`;
  return `a los ${numeroALetras(p.dia)} (${p.dia}) días del mes de ${mes} de ${p.anio}`;
}
