import {
  crearSolicitud,
  health,
  listarInstancias,
  responderSolicitud,
} from './handlers';

const RESPUESTA_RE = /^\/api\/solicitudes\/([^/]+)\/respuesta$/;

export async function enrutar(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  try {
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
