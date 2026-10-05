/** Plantilla HTML del panel (sin dependencias; estilos con la marca ChristiFideles). */

export function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const CSS = `
:root{--vino:#590202;--vino2:#7a1010;--fondo:#f6f5f4;--borde:#e4e1df;--texto:#1f1d1d;--suave:#6b6563;--ok:#1f7a3f;--mal:#b42318;--aviso:#b54708}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--fondo);color:var(--texto)}
a{color:var(--vino)}header{background:#fff;border-bottom:1px solid var(--borde);padding:0 16px}
.barra{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:16px;min-height:60px;flex-wrap:wrap}
.marca{font-weight:700;color:var(--vino);font-size:18px;text-decoration:none;margin-right:auto}
nav a{text-decoration:none;color:var(--suave);padding:8px 10px;border-radius:8px;font-weight:500}
nav a.activo{background:var(--vino);color:#fff}
main{max-width:1100px;margin:24px auto;padding:0 16px}
h1{font-size:24px;margin:0 0 4px}.sub{color:var(--suave);margin:0 0 20px}
.tarjeta{background:#fff;border:1px solid var(--borde);border-radius:14px;padding:20px;margin-bottom:20px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:20px}
.kpi{background:#fff;border:1px solid var(--borde);border-radius:14px;padding:16px}.kpi b{display:block;font-size:28px;margin-top:6px}.kpi span{color:var(--suave);font-size:13px}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--borde);font-size:14px;vertical-align:middle}
th{color:var(--suave);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.03em}
.tabla{overflow-x:auto}
.punto{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}
.verde{background:var(--ok)}.rojo{background:var(--mal)}.gris{background:#b8b2af}
.badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;background:#eee}
.b-ok{background:#e5f4ea;color:var(--ok)}.b-mal{background:#fde8e6;color:var(--mal)}.b-aviso{background:#fff1e0;color:var(--aviso)}
form.linea{display:inline}
label{display:flex;flex-direction:column;gap:4px;font-size:14px;font-weight:500}
input,select{font:inherit;padding:10px 12px;border:1px solid var(--borde);border-radius:10px;background:#fff;width:100%}
.rejilla{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:end}
button,.btn{font:inherit;font-weight:600;border:0;border-radius:10px;padding:10px 16px;cursor:pointer;background:var(--vino);color:#fff;text-decoration:none;display:inline-block}
button.sec{background:#fff;color:var(--vino);border:1px solid var(--vino)}button.peligro{background:#fff;color:var(--mal);border:1px solid var(--mal)}
button.chico{padding:6px 10px;font-size:13px}
.acciones{display:flex;gap:6px;flex-wrap:wrap}
.alerta{padding:14px 16px;border-radius:12px;margin-bottom:20px}.alerta.error{background:#fde8e6;color:var(--mal)}.alerta.ok{background:#e5f4ea;color:var(--ok)}
.secreto{font-family:ui-monospace,monospace;background:#1f1d1d;color:#fff;padding:14px;border-radius:10px;word-break:break-all;font-size:15px;margin:10px 0}
.login{max-width:380px;margin:10vh auto;padding:0 16px}
.vacio{color:var(--suave);text-align:center;padding:24px}
@media(max-width:640px){th.opc,td.opc{display:none}}
`;

export function pagina(titulo: string, cuerpo: string, activo?: 'inicio' | 'parroquias' | 'consultas'): string {
  const enlace = (id: string, href: string, texto: string) =>
    `<a href="${href}" class="${activo === id ? 'activo' : ''}">${texto}</a>`;
  const cabecera = activo
    ? `<header><div class="barra"><a class="marca" href="/panel">ChristiFideles · Centralizador</a>
        <nav>${enlace('inicio', '/panel', 'Inicio')}${enlace('parroquias', '/panel/parroquias', 'Parroquias')}${enlace('consultas', '/panel/consultas', 'Bitácora')}</nav>
        <form class="linea" method="post" action="/panel/salir"><button class="sec chico">Salir</button></form></div></header>`
    : '';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)} · Centralizador ChristiFideles</title><meta name="robots" content="noindex"><style>${CSS}</style></head>
<body>${cabecera}${activo ? `<main>${cuerpo}</main>` : cuerpo}</body></html>`;
}

export function html(cuerpo: string, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(cuerpo, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
      ...extra,
    },
  });
}

export function redirigir(destino: string, extra: Record<string, string> = {}): Response {
  return new Response(null, { status: 303, headers: { Location: destino, 'Cache-Control': 'no-store', ...extra } });
}

const ESTADOS: Record<string, [string, string]> = {
  pendiente: ['Pendiente', 'b-aviso'],
  aprobada: ['Aprobada', 'b-ok'],
  rechazada: ['Rechazada', 'b-mal'],
  error_entrega: ['No entregada', ''],
};

export function badgeEstado(estado: string): string {
  const [texto, clase] = ESTADOS[estado] ?? [estado, ''];
  return `<span class="badge ${clase}">${esc(texto)}</span>`;
}

export function fecha(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa', dateStyle: 'medium', timeStyle: 'short' });
}
