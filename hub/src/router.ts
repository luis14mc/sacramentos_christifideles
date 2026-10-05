import {
  crearSolicitud,
  health,
  listarInstancias,
  responderSolicitud,
} from './handlers';
import * as panel from './panel/vistas';
import { redirigir } from './panel/html';

const RESPUESTA_RE = /^\/api\/solicitudes\/([^/]+)\/respuesta$/;
const ACCION_PARROQUIA_RE = /^\/panel\/parroquias\/([a-z0-9-]+)\/(activar|suspender|rotar|editar)$/;

/** Panel web del administrador central (todo lo que empieza con /panel). */
async function enrutarPanel(req: Request, pathname: string): Promise<Response> {
  if (pathname === '/panel/login') {
    return req.method === 'POST' ? panel.postLogin(req) : panel.getLogin();
  }
  if (!panel.autenticado(req)) return redirigir('/panel/login');
  if (req.method === 'POST' && pathname === '/panel/salir') return panel.postSalir();
  if (req.method === 'GET' && (pathname === '/panel' || pathname === '/panel/')) return panel.getInicio();
  if (pathname === '/panel/parroquias') {
    return req.method === 'POST' ? panel.postParroquia(req) : panel.getParroquias();
  }
  const accion = req.method === 'POST' ? pathname.match(ACCION_PARROQUIA_RE) : null;
  if (accion) return panel.postAccionParroquia(req, accion[1], accion[2]);
  if (req.method === 'GET' && pathname === '/panel/consultas') return panel.getConsultas(req);
  return redirigir('/panel');
}

export async function enrutar(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  try {
    if (req.method === 'GET' && pathname === '/') return redirigir('/panel');
    if (pathname === '/panel' || pathname.startsWith('/panel/')) return await enrutarPanel(req, pathname);
    if (req.method === 'GET' && pathname === '/api/health') return await health();
    if (req.method === 'GET' && pathname === '/api/instancias') return await listarInstancias(req);
    if (req.method === 'POST' && pathname === '/api/solicitudes') return await crearSolicitud(req);
    const m = req.method === 'POST' ? pathname.match(RESPUESTA_RE) : null;
    if (m) return await responderSolicitud(req, m[1]);
    return Response.json({ error: 'No encontrado' }, { status: 404 });
  } catch (error) {
    console.error('Error en hub:', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
