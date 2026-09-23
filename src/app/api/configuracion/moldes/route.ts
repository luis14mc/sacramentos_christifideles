import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { jsonSafe } from '@/lib/serialize';
import { isPrismaUniqueError } from '@/lib/sacramentos';
import { esSacramentoConstancia } from '@/lib/constancias';
import { TOKENS_CONSTANCIA } from '@/lib/constancias';
import {
  MOLDE_MIME,
  TIPOS_CONSTANCIA,
  esTipoConstanciaMolde,
  listarMoldes,
  validarPdfMolde,
} from '@/lib/constancias/moldes';

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;
  return { session, parishId };
}

const DUPLICADO = 'Ya existe un molde con ese nombre para ese sacramento y tipo.';

export async function GET() {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canViewConfiguracion')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    const moldes = await listarMoldes(context.parishId);
    return NextResponse.json(moldes);
  } catch (error) {
    console.error('Error al listar moldes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST crea un BORRADOR (activo=false, sin mapa obligatorio).
 * El PDF se persiste para poder extraer los campos AcroForm en un GET posterior.
 * Para activar el molde y guardar el mapa se usa PUT /api/configuracion/moldes/[id].
 */
export async function POST(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar moldes' }, { status: 403 });
    }
    const { parishId } = context;

    const form = await req.formData();
    const sacramento = String(form.get('sacramento') ?? '').trim();
    const tipo = String(form.get('tipo_constancia') ?? '').trim();
    const nombre = String(form.get('nombre') ?? '').trim();
    const archivo = form.get('archivo');

    if (!esSacramentoConstancia(sacramento)) {
      return NextResponse.json({ error: 'Sacramento inválido' }, { status: 400 });
    }
    if (!esTipoConstanciaMolde(tipo)) {
      return NextResponse.json(
        { error: `tipo_constancia inválido; valores permitidos: ${TIPOS_CONSTANCIA.join(', ')}` },
        { status: 400 }
      );
    }
    if (!nombre) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    if (!(archivo instanceof File)) {
      return NextResponse.json({ error: 'archivo es obligatorio' }, { status: 400 });
    }
    if (archivo.type && archivo.type !== MOLDE_MIME) {
      return NextResponse.json(
        { error: `Solo se admiten archivos PDF (recibido: ${archivo.type})` },
        { status: 400 }
      );
    }

    const buf = new Uint8Array(await archivo.arrayBuffer());
    try {
      await validarPdfMolde(buf);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }

    const userId = BigInt(context.session.user.id);
    const { actorIp, userAgent } = contextoAuditoria(req);

    const creado = await prisma.$transaction(async (tx) => {
      const m = await tx.moldeConstancia.create({
        data: {
          id_parroquia: parishId,
          sacramento,
          tipo_constancia: tipo,
          nombre,
          archivo: Buffer.from(buf),
          archivo_nombre: archivo.name || `${nombre}.pdf`,
          archivo_mime: archivo.type || MOLDE_MIME,
          archivo_bytes: buf.byteLength,
          mapa_campos: {},
          activo: false,
        },
      });
      await registrarBitacora(tx, {
        parishId,
        userId,
        accion: 'C',
        nombreTabla: 'molde_constancia',
        idAfectado: m.id,
        newValues: {
          sacramento,
          tipo_constancia: tipo,
          nombre,
          archivo_nombre: archivo.name,
          estado: 'borrador',
        },
        actorIp,
        userAgent,
      });
      return m;
    });

    return NextResponse.json(jsonSafe(creado), { status: 201 });
  } catch (error) {
    if (isPrismaUniqueError(error)) return NextResponse.json({ error: DUPLICADO }, { status: 409 });
    console.error('Error al crear molde:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
