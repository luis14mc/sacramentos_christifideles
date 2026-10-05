import { prisma } from '../prisma';
import {
  cambiarEstado,
  comprobarParroquia,
  editarParroquia,
  ErrorValidacion,
  registrarParroquia,
  rotarSecreto,
} from '../parroquias';
import { badgeEstado, esc, fecha, html, pagina, redirigir } from './html';
import {
  bloqueado,
  COOKIE,
  cookieBorrada,
  cookieSesion,
  crearSesion,
  credencialesValidas,
  leerCookie,
  limpiarFallos,
  mismoOrigen,
  panelConfigurado,
  registrarFallo,
  sesionValida,
  usuarioAdmin,
} from './sesion';

/**
 * Panel web del centralizador: login, inicio (resumen + semáforo), parroquias
 * y bitácora de consultas. Nunca muestra DNI ni datos sacramentales: el hub no
 * los guarda.
 */

async function formulario(req: Request): Promise<URLSearchParams> {
  return new URLSearchParams(await req.text());
}

function esHttps(req: Request): boolean {
  return req.headers.get('x-forwarded-proto') === 'https';
}

// ---------- Login ----------

function vistaLogin(error?: string): string {
  const aviso = !panelConfigurado()
    ? `<div class="alerta error">El panel no está habilitado: configura <b>HUB_ADMIN_PASSWORD</b> (mín. 12 caracteres) y <b>HUB_CLAVE_MAESTRA</b> en las variables del hub.</div>`
    : error
      ? `<div class="alerta error">${esc(error)}</div>`
      : '';
  return pagina(
    'Ingresar',
    `<div class="login"><div class="tarjeta">
      <h1>Centralizador</h1><p class="sub">ChristiFideles · consultas entre parroquias</p>${aviso}
      <form method="post" action="/panel/login" style="display:grid;gap:14px">
        <label>Usuario<input name="usuario" type="email" autocomplete="username" value="${esc(usuarioAdmin())}" required></label>
        <label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label>
        <button>Ingresar</button>
      </form></div></div>`
  );
}

export function getLogin(): Response {
  return html(vistaLogin());
}

export async function postLogin(req: Request): Promise<Response> {
  if (!mismoOrigen(req)) return html(vistaLogin('Solicitud no permitida.'), 403);
  const clave = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (bloqueado(clave)) {
    return html(vistaLogin('Demasiados intentos fallidos. Espera 15 minutos.'), 429);
  }
  const f = await formulario(req);
  if (!credencialesValidas(f.get('usuario') ?? '', f.get('password') ?? '')) {
    registrarFallo(clave);
    return html(vistaLogin('Usuario o contraseña incorrectos.'), 401);
  }
  limpiarFallos(clave);
  return redirigir('/panel', { 'Set-Cookie': cookieSesion(crearSesion(), esHttps(req)) });
}

export function postSalir(): Response {
  return redirigir('/panel/login', { 'Set-Cookie': cookieBorrada() });
}

export function autenticado(req: Request): boolean {
  return sesionValida(leerCookie(req, COOKIE));
}

// ---------- Inicio ----------

export async function getInicio(): Promise<Response> {
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [instancias, porEstado, ultimos30] = await Promise.all([
    prisma.instancia.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.solicitud.groupBy({ by: ['estado'], _count: { _all: true } }),
    prisma.solicitud.count({ where: { created_at: { gte: hace30 } } }),
  ]);
  const cuenta = (e: string) => porEstado.find((p) => p.estado === e)?._count._all ?? 0;
  const total = porEstado.reduce((s, p) => s + p._count._all, 0);

  const conexiones = await Promise.all(
    instancias.map(async (i) => ({ i, estado: i.activa ? await comprobarParroquia(i.url) : null }))
  );

  const filas = conexiones
    .map(({ i, estado }) => {
      const punto =
        estado === null
          ? '<span class="punto gris"></span>Suspendida'
          : estado === 'en_linea'
            ? '<span class="punto verde"></span>En línea'
            : '<span class="punto rojo"></span>Sin respuesta';
      return `<tr><td><b>${esc(i.nombre)}</b><br><span class="sub" style="font-size:12px">${esc(i.codigo)}</span></td>
        <td>${punto}</td><td class="opc"><a href="${esc(i.url)}" rel="noopener noreferrer" target="_blank">${esc(i.url)}</a></td></tr>`;
    })
    .join('');

  const kpi = (titulo: string, valor: number) => `<div class="kpi"><span>${titulo}</span><b>${valor}</b></div>`;
  return html(
    pagina(
      'Inicio',
      `<h1>Inicio</h1><p class="sub">Estado de la red de parroquias y de las consultas.</p>
      <div class="kpis">${kpi('Parroquias activas', instancias.filter((i) => i.activa).length)}${kpi('Consultas totales', total)}${kpi('Pendientes de respuesta', cuenta('pendiente'))}${kpi('Aprobadas', cuenta('aprobada'))}${kpi('Rechazadas', cuenta('rechazada'))}${kpi('Últimos 30 días', ultimos30)}</div>
      <div class="tarjeta"><h2 style="margin-top:0;font-size:18px">Parroquias</h2>
      ${instancias.length === 0 ? `<p class="vacio">Aún no hay parroquias. <a href="/panel/parroquias">Registra la primera</a>.</p>` : `<div class="tabla"><table><thead><tr><th>Parroquia</th><th>Conexión</th><th class="opc">Dirección</th></tr></thead><tbody>${filas}</tbody></table></div>`}
      </div>`,
      'inicio'
    )
  );
}

// ---------- Parroquias ----------

async function vistaParroquias(mensaje?: { tipo: 'ok' | 'error'; html: string }): Promise<string> {
  const instancias = await prisma.instancia.findMany({ orderBy: { nombre: 'asc' } });
  const filas = instancias
    .map(
      (i) => `<tr>
      <td><b>${esc(i.nombre)}</b><br><span class="sub" style="font-size:12px">${esc(i.codigo)}</span></td>
      <td class="opc">${esc(i.url)}</td>
      <td>${i.activa ? '<span class="badge b-ok">Activa</span>' : '<span class="badge">Suspendida</span>'}</td>
      <td><div class="acciones">
        <form class="linea" method="post" action="/panel/parroquias/${esc(i.codigo)}/${i.activa ? 'suspender' : 'activar'}"><button class="sec chico">${i.activa ? 'Suspender' : 'Activar'}</button></form>
        <form class="linea" method="post" action="/panel/parroquias/${esc(i.codigo)}/rotar"><button class="peligro chico" title="La llave actual deja de funcionar">Nueva llave</button></form>
      </div>
      <details style="margin-top:8px"><summary style="cursor:pointer;font-size:13px">Editar</summary>
        <form method="post" action="/panel/parroquias/${esc(i.codigo)}/editar" class="rejilla" style="margin-top:8px">
          <label>Nombre<input name="nombre" value="${esc(i.nombre)}" maxlength="100" required></label>
          <label>URL<input name="url" value="${esc(i.url)}" required></label>
          <button class="chico">Guardar</button>
        </form></details></td></tr>`
    )
    .join('');
  const aviso = mensaje ? `<div class="alerta ${mensaje.tipo}">${mensaje.html}</div>` : '';
  return pagina(
    'Parroquias',
    `<h1>Parroquias</h1><p class="sub">Instancias conectadas al centralizador. Cada una tiene su propia llave.</p>${aviso}
    <div class="tarjeta"><h2 style="margin-top:0;font-size:18px">Registrar parroquia</h2>
      <form method="post" action="/panel/parroquias" class="rejilla">
        <label>Código<input name="codigo" placeholder="salvador-del-mundo" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="50" required></label>
        <label>Nombre<input name="nombre" placeholder="Salvador del Mundo de Cerro Grande" maxlength="100" required></label>
        <label>URL<input name="url" placeholder="https://christifideles.parroquia.org" required></label>
        <button>Registrar</button>
      </form>
      <p class="sub" style="margin:12px 0 0;font-size:13px">El código debe coincidir con <b>PARROQUIA_CODIGO</b> de esa parroquia.</p>
    </div>
    <div class="tarjeta">${instancias.length === 0 ? '<p class="vacio">Sin parroquias registradas.</p>' : `<div class="tabla"><table><thead><tr><th>Parroquia</th><th class="opc">URL</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${filas}</tbody></table></div>`}</div>`,
    'parroquias'
  );
}

function mensajeSecreto(titulo: string, codigo: string, secreto: string): { tipo: 'ok'; html: string } {
  return {
    tipo: 'ok',
    html: `<b>${esc(titulo)}</b><br>Copia esta llave en la variable <b>INTEROP_SECRET</b> de <b>${esc(codigo)}</b>.
      <b>No se vuelve a mostrar.</b><div class="secreto">${esc(secreto)}</div>
      En esa parroquia configura también <b>INTEROP_HUB_URL</b> con la dirección de este centralizador.`,
  };
}

export async function getParroquias(): Promise<Response> {
  return html(await vistaParroquias());
}

export async function postParroquia(req: Request): Promise<Response> {
  if (!mismoOrigen(req)) return html(await vistaParroquias({ tipo: 'error', html: 'Solicitud no permitida.' }), 403);
  const f = await formulario(req);
  const codigo = (f.get('codigo') ?? '').trim().toLowerCase();
  try {
    const secreto = await registrarParroquia(codigo, f.get('nombre') ?? '', f.get('url') ?? '');
    return html(await vistaParroquias(mensajeSecreto('Parroquia registrada.', codigo, secreto)));
  } catch (e) {
    if (e instanceof ErrorValidacion) return html(await vistaParroquias({ tipo: 'error', html: esc(e.message) }), 400);
    return errorPanel(e);
  }
}

/** Fallo inesperado: se registra en el log y se muestra un aviso claro en el panel. */
async function errorPanel(e: unknown): Promise<Response> {
  const detalle = e instanceof Error ? e.message : String(e);
  console.error('Error en panel del centralizador:', detalle);
  return html(
    await vistaParroquias({
      tipo: 'error',
      html: `No se pudo completar la operación: ${esc(detalle)}<br>Revisa las variables del hub (HUB_CLAVE_MAESTRA, DATABASE_URL) y el log del servicio.`,
    }),
    500
  );
}

export async function postAccionParroquia(req: Request, codigo: string, accion: string): Promise<Response> {
  if (!mismoOrigen(req)) return html(await vistaParroquias({ tipo: 'error', html: 'Solicitud no permitida.' }), 403);
  if (!(await prisma.instancia.findUnique({ where: { codigo } }))) {
    return html(await vistaParroquias({ tipo: 'error', html: 'Parroquia no encontrada.' }), 404);
  }
  try {
    switch (accion) {
      case 'activar':
      case 'suspender':
        await cambiarEstado(codigo, accion === 'activar');
        return redirigir('/panel/parroquias');
      case 'rotar': {
        const secreto = await rotarSecreto(codigo);
        return html(await vistaParroquias(mensajeSecreto('Llave nueva generada. La anterior ya no funciona.', codigo, secreto)));
      }
      case 'editar': {
        const f = await formulario(req);
        await editarParroquia(codigo, f.get('nombre') ?? '', f.get('url') ?? '');
        return redirigir('/panel/parroquias');
      }
      default:
        return html(await vistaParroquias({ tipo: 'error', html: 'Acción desconocida.' }), 404);
    }
  } catch (e) {
    if (e instanceof ErrorValidacion) return html(await vistaParroquias({ tipo: 'error', html: esc(e.message) }), 400);
    return errorPanel(e);
  }
}

// ---------- Bitácora ----------

const POR_PAGINA = 50;
const ESTADOS = ['pendiente', 'aprobada', 'rechazada', 'error_entrega'];

export async function getConsultas(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const origen = q.get('origen') || '';
  const destino = q.get('destino') || '';
  const estado = ESTADOS.includes(q.get('estado') ?? '') ? q.get('estado')! : '';
  const paginaN = Math.max(1, Number.parseInt(q.get('pagina') ?? '1', 10) || 1);

  const where = {
    ...(origen ? { origen } : {}),
    ...(destino ? { destino } : {}),
    ...(estado ? { estado } : {}),
  };
  const [instancias, total, filas] = await Promise.all([
    prisma.instancia.findMany({ select: { codigo: true, nombre: true }, orderBy: { nombre: 'asc' } }),
    prisma.solicitud.count({ where }),
    prisma.solicitud.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (paginaN - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: { uuid: true, origen: true, destino: true, estado: true, created_at: true, resuelta_at: true },
    }),
  ]);
  const nombre = new Map(instancias.map((i) => [i.codigo, i.nombre]));
  const opciones = (sel: string) =>
    `<option value="">Todas</option>${instancias.map((i) => `<option value="${esc(i.codigo)}" ${i.codigo === sel ? 'selected' : ''}>${esc(i.nombre)}</option>`).join('')}`;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const enlacePagina = (n: number) => {
    const p = new URLSearchParams(q);
    p.set('pagina', String(n));
    return `/panel/consultas?${p.toString()}`;
  };

  const cuerpoTabla = filas
    .map(
      (s) => `<tr><td>${fecha(s.created_at)}</td><td>${esc(nombre.get(s.origen) ?? s.origen)}</td><td>${esc(nombre.get(s.destino) ?? s.destino)}</td>
      <td>${badgeEstado(s.estado)}</td><td class="opc">${fecha(s.resuelta_at)}</td></tr>`
    )
    .join('');

  return html(
    pagina(
      'Bitácora',
      `<h1>Bitácora de consultas</h1><p class="sub">Quién consultó a quién y cuándo. El centralizador no guarda DNI ni datos sacramentales.</p>
      <div class="tarjeta"><form method="get" class="rejilla">
        <label>Consulta<select name="origen">${opciones(origen)}</select></label>
        <label>Consultada<select name="destino">${opciones(destino)}</select></label>
        <label>Estado<select name="estado"><option value="">Todos</option>${ESTADOS.map((e) => `<option value="${e}" ${e === estado ? 'selected' : ''}>${badgeEstado(e).replace(/<[^>]+>/g, '')}</option>`).join('')}</select></label>
        <button>Filtrar</button></form></div>
      <div class="tarjeta">${filas.length === 0 ? '<p class="vacio">No hay consultas con esos filtros.</p>' : `<div class="tabla"><table><thead><tr><th>Fecha</th><th>Consulta</th><th>Consultada</th><th>Estado</th><th class="opc">Resuelta</th></tr></thead><tbody>${cuerpoTabla}</tbody></table></div>
        <p class="sub" style="margin:14px 0 0">${total} consulta(s) · página ${paginaN} de ${paginas}
        ${paginaN > 1 ? ` · <a href="${esc(enlacePagina(paginaN - 1))}">Anterior</a>` : ''}${paginaN < paginas ? ` · <a href="${esc(enlacePagina(paginaN + 1))}">Siguiente</a>` : ''}</p>`}</div>`,
      'consultas'
    )
  );
}
