import { prisma } from '@/lib/prisma';

export async function getParroquiaData(userId: string, parishId: number) {
  try {
    const user = await prisma.usuario.findFirst({
      where: {
        id_usuario: BigInt(userId),
        id_parroquia: parishId
      },
      include: {
        parroquia: {
          include: {
            config: true
          }
        },
        rol: true
      }
    });

    if (!user || !user.parroquia) {
      return null;
    }

    return {
      parroquia: {
        id: Number(user.parroquia.id_parroquia),
        nombre: user.parroquia.nombre,
        direccion: user.parroquia.direccion,
        telefono: user.parroquia.telefono,
        email: user.parroquia.email,
        config: user.parroquia.config ? {
          alias_liturgico: user.parroquia.config.alias_liturgico,
          tz: user.parroquia.config.tz,
          idioma: user.parroquia.config.idioma,
          opciones: user.parroquia.config.opciones
        } : null
      },
      usuario: {
        id: Number(user.id_usuario),
        nombre: user.nombre,
        email: user.email,
        rol: user.rol.nombre,
        telefono: user.telefono
      }
    };
  } catch (error) {
    console.error('Error getting parroquia data:', error);
    return null;
  }
}

export async function getDashboardStats(parroquiaId: number) {
  try {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const inicioProximoMes = new Date(inicioMes);
    inicioProximoMes.setMonth(inicioProximoMes.getMonth() + 1);
    const rangoMes = { gte: inicioMes, lt: inicioProximoMes };

    const [
      totalPersonas,
      totalBautismos,
      totalPrimerasComuniones,
      totalConfirmaciones,
      totalMatrimonios,
      totalUsuarios,
      usuariosActivos,
      bautismosMes,
      comunionesMes,
      confirmacionesMes,
      matrimoniosMes
    ] = await Promise.all([
      prisma.persona.count({ where: { id_parroquia: parroquiaId } }),
      prisma.bautismo.count({ where: { id_parroquia: parroquiaId } }),
      prisma.primeraComunion.count({ where: { id_parroquia: parroquiaId } }),
      prisma.confirmacion.count({ where: { id_parroquia: parroquiaId } }),
      prisma.matrimonio.count({ where: { id_parroquia: parroquiaId } }),
      prisma.usuario.count({ where: { id_parroquia: parroquiaId } }),
      prisma.usuario.count({ where: { id_parroquia: parroquiaId, estado: 1 } }),
      prisma.bautismo.count({ where: { id_parroquia: parroquiaId, fecha_bautismo: rangoMes } }),
      prisma.primeraComunion.count({ where: { id_parroquia: parroquiaId, fecha_primera_comunion: rangoMes } }),
      prisma.confirmacion.count({ where: { id_parroquia: parroquiaId, fecha_confirmacion: rangoMes } }),
      prisma.matrimonio.count({ where: { id_parroquia: parroquiaId, fecha_matrimonio: rangoMes } })
    ]);

    const sacramentosDelMes = bautismosMes + comunionesMes + confirmacionesMes + matrimoniosMes;

    return {
      totalPersonas,
      totalBautismos,
      totalPrimerasComuniones,
      totalConfirmaciones,
      totalMatrimonios,
      totalUsuarios,
      usuariosActivos,
      sacramentosDelMes,
      sacramentosDelMesPorTipo: {
        bautismos: bautismosMes,
        primerasComuniones: comunionesMes,
        confirmaciones: confirmacionesMes,
        matrimonios: matrimoniosMes
      }
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
}

interface RegistroReciente {
  tipo: string;
  titulo: string;
  fecha: string | null;
  href: string;
}

const nombre = (p: { nombres: string; apellidos: string } | null) => (p ? `${p.nombres} ${p.apellidos}` : '—');

/** Últimos registros sacramentales del tenant (mezcla de los 4 sacramentos). */
export async function getRegistrosRecientes(parroquiaId: number, limite = 5): Promise<RegistroReciente[]> {
  const sel = { select: { nombres: true, apellidos: true } } as const;
  const [bautismos, comuniones, confirmaciones, matrimonios] = await Promise.all([
    prisma.bautismo.findMany({ where: { id_parroquia: parroquiaId }, include: { bautizado: sel }, orderBy: { fecha_bautismo: 'desc' }, take: limite }),
    prisma.primeraComunion.findMany({ where: { id_parroquia: parroquiaId }, include: { persona: sel }, orderBy: { fecha_primera_comunion: 'desc' }, take: limite }),
    prisma.confirmacion.findMany({ where: { id_parroquia: parroquiaId }, include: { confirmado: sel }, orderBy: { fecha_confirmacion: 'desc' }, take: limite }),
    prisma.matrimonio.findMany({ where: { id_parroquia: parroquiaId }, include: { esposa: sel, esposo: sel }, orderBy: { fecha_matrimonio: 'desc' }, take: limite })
  ]);

  const todos: (RegistroReciente & { orden: number })[] = [
    ...bautismos.map((b) => ({ tipo: 'Bautismo', titulo: nombre(b.bautizado), fecha: b.fecha_bautismo?.toISOString() ?? null, href: `/bautismos/${b.id_bautismo}`, orden: b.fecha_bautismo?.getTime() ?? 0 })),
    ...comuniones.map((b) => ({ tipo: 'Primera Comunión', titulo: nombre(b.persona), fecha: b.fecha_primera_comunion?.toISOString() ?? null, href: `/primeras-comuniones/${b.id_primera_comunion}`, orden: b.fecha_primera_comunion?.getTime() ?? 0 })),
    ...confirmaciones.map((b) => ({ tipo: 'Confirmación', titulo: nombre(b.confirmado), fecha: b.fecha_confirmacion?.toISOString() ?? null, href: `/confirmaciones/${b.id_confirmacion}`, orden: b.fecha_confirmacion?.getTime() ?? 0 })),
    ...matrimonios.map((b) => ({ tipo: 'Matrimonio', titulo: `${nombre(b.esposa)} & ${nombre(b.esposo)}`, fecha: b.fecha_matrimonio?.toISOString() ?? null, href: `/matrimonios/${b.id_matrimonio}`, orden: b.fecha_matrimonio?.getTime() ?? 0 }))
  ];

  return todos
    .sort((a, b) => b.orden - a.orden)
    .slice(0, limite)
    .map(({ orden: _orden, ...r }) => r);
}
