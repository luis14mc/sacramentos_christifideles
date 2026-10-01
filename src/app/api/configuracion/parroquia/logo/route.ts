import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { contextoAuditoria, registrarBitacora } from '@/lib/bitacora';
import { validarLogo } from '@/lib/logo';

/** Logo de la parroquia de la sesión: ver (GET), subir o reemplazar (POST), quitar (DELETE). */

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parishId) return null;
  const parishId = parseInt(session.user.parishId, 10);
  if (Number.isNaN(parishId)) return null;
  return { session, parishId };
}

export async function GET() {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const config = await prisma.parroquiaConfig.findUnique({
      where: { id_parroquia: context.parishId },
      select: { logo_archivo: true, logo_mime: true },
    });
    if (!config?.logo_archivo || !config.logo_mime) {
      return NextResponse.json({ error: 'La parroquia no tiene logo' }, { status: 404 });
    }
    return new NextResponse(Buffer.from(config.logo_archivo), {
      status: 200,
      headers: { 'Content-Type': config.logo_mime, 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Error al obtener el logo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para cambiar el logo' }, { status: 403 });
    }
    const { parishId, session } = context;

    const form = await req.formData().catch(() => null);
    const archivo = form?.get('logo');
    if (!(archivo instanceof File)) {
      return NextResponse.json({ error: 'Selecciona una imagen' }, { status: 400 });
    }
    const buf = new Uint8Array(await archivo.arrayBuffer());
    const validacion = validarLogo(buf);
    if (!validacion.ok) return NextResponse.json({ error: validacion.error }, { status: 400 });

    const { actorIp, userAgent } = contextoAuditoria(req);
    await prisma.$transaction(async (tx) => {
      await tx.parroquiaConfig.upsert({
        where: { id_parroquia: parishId },
        update: { logo_archivo: Buffer.from(buf), logo_mime: validacion.mime },
        create: { id_parroquia: parishId, logo_archivo: Buffer.from(buf), logo_mime: validacion.mime },
      });
      await registrarBitacora(tx, {
        parishId,
        userId: BigInt(session.user.id),
        accion: 'U',
        nombreTabla: 'parroquia_config',
        newValues: { logo: archivo.name || 'logo', logo_mime: validacion.mime, logo_bytes: buf.byteLength },
        actorIp,
        userAgent,
      });
    });
    return NextResponse.json({ ok: true, logo_mime: validacion.mime, logo_bytes: buf.byteLength });
  } catch (error) {
    console.error('Error al subir el logo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await getContext();
    if (!context) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!hasPermission(context.session.user.rol, 'canManageConfiguracion')) {
      return NextResponse.json({ error: 'No tienes permiso para cambiar el logo' }, { status: 403 });
    }
    const { parishId, session } = context;
    const { actorIp, userAgent } = contextoAuditoria(req);
    await prisma.$transaction(async (tx) => {
      await tx.parroquiaConfig.updateMany({
        where: { id_parroquia: parishId },
        data: { logo_archivo: null, logo_mime: null },
      });
      await registrarBitacora(tx, {
        parishId,
        userId: BigInt(session.user.id),
        accion: 'U',
        nombreTabla: 'parroquia_config',
        newValues: { logo: null },
        actorIp,
        userAgent,
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error al quitar el logo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
