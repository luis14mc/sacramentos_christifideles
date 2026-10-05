import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Sesión del administrador central del panel.
 * Credenciales en variables del hub: HUB_ADMIN_USUARIO (por defecto
 * admin@christifideles.org) y HUB_ADMIN_PASSWORD (mín. 12). La cookie va firmada
 * con HMAC usando HUB_CLAVE_MAESTRA y caduca a las 8 horas.
 */

export const COOKIE = 'hub_sesion';
const DURACION_MS = 8 * 60 * 60 * 1000;
const MIN_PASSWORD = 12;

function claveFirma(): string {
  const k = process.env.HUB_CLAVE_MAESTRA;
  if (!k) throw new Error('HUB_CLAVE_MAESTRA no está configurada.');
  return `panel:${k}`;
}

function igualSeguro(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function usuarioAdmin(): string {
  return (process.env.HUB_ADMIN_USUARIO || 'admin@christifideles.org').trim().toLowerCase();
}

/** El panel queda deshabilitado si no hay contraseña segura configurada. */
export function panelConfigurado(): boolean {
  return (process.env.HUB_ADMIN_PASSWORD ?? '').length >= MIN_PASSWORD && !!process.env.HUB_CLAVE_MAESTRA;
}

export function credencialesValidas(usuario: string, password: string): boolean {
  if (!panelConfigurado()) return false;
  const okUsuario = igualSeguro(usuario.trim().toLowerCase(), usuarioAdmin());
  const okPassword = igualSeguro(password, process.env.HUB_ADMIN_PASSWORD!);
  return okUsuario && okPassword;
}

function firmar(datos: string): string {
  return createHmac('sha256', claveFirma()).update(datos).digest('hex');
}

export function crearSesion(ahora = Date.now()): string {
  const datos = `${usuarioAdmin()}|${ahora + DURACION_MS}`;
  return `${Buffer.from(datos).toString('base64url')}.${firmar(datos)}`;
}

export function sesionValida(valor: string | undefined, ahora = Date.now()): boolean {
  if (!valor || !panelConfigurado()) return false;
  const [b64, firma] = valor.split('.');
  if (!b64 || !firma) return false;
  const datos = Buffer.from(b64, 'base64url').toString();
  if (!igualSeguro(firma, firmar(datos))) return false;
  const [usuario, expira] = datos.split('|');
  return usuario === usuarioAdmin() && Number(expira) > ahora;
}

export function leerCookie(req: Request, nombre: string): string | undefined {
  const raw = req.headers.get('cookie') ?? '';
  for (const parte of raw.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nombre) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

export function cookieSesion(valor: string, segura: boolean): string {
  return `${COOKIE}=${encodeURIComponent(valor)}; Path=/panel; HttpOnly; SameSite=Strict; Max-Age=${DURACION_MS / 1000}${segura ? '; Secure' : ''}`;
}

export function cookieBorrada(): string {
  return `${COOKIE}=; Path=/panel; HttpOnly; SameSite=Strict; Max-Age=0`;
}

/** Anti-CSRF: los POST del panel deben venir del mismo sitio. */
export function mismoOrigen(req: Request): boolean {
  const sitio = req.headers.get('sec-fetch-site');
  if (sitio) return sitio === 'same-origin';
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get('host');
  } catch {
    return false;
  }
}

// Límite de intentos de login (en memoria; el hub corre en una instancia).
const fallos = new Map<string, number[]>();
const VENTANA_MS = 15 * 60 * 1000;
const MAX_FALLOS = 5;

export function bloqueado(clave: string, ahora = Date.now()): boolean {
  return (fallos.get(clave) ?? []).filter((t) => ahora - t < VENTANA_MS).length >= MAX_FALLOS;
}

export function registrarFallo(clave: string, ahora = Date.now()): void {
  const lista = (fallos.get(clave) ?? []).filter((t) => ahora - t < VENTANA_MS);
  lista.push(ahora);
  fallos.set(clave, lista);
}

export function limpiarFallos(clave: string): void {
  fallos.delete(clave);
}
