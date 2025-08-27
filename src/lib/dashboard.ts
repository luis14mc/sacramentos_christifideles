import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getParroquiaData(userId: string) {
  try {
    const user = await prisma.usuario.findUnique({
      where: {
        id_usuario: BigInt(userId)
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
    const [
      totalPersonas,
      totalBautismos,
      totalPrimerasComuniones,
      totalConfirmaciones,
      totalMatrimonios
    ] = await Promise.all([
      prisma.persona.count({
        where: { id_parroquia: parroquiaId }
      }),
      prisma.bautismo.count({
        where: { id_parroquia: parroquiaId }
      }),
      prisma.primeraComunion.count({
        where: { id_parroquia: parroquiaId }
      }),
      prisma.confirmacion.count({
        where: { id_parroquia: parroquiaId }
      }),
      prisma.matrimonio.count({
        where: { id_parroquia: parroquiaId }
      })
    ]);

    return {
      totalPersonas,
      totalBautismos,
      totalPrimerasComuniones,
      totalConfirmaciones,
      totalMatrimonios
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      totalPersonas: 0,
      totalBautismos: 0,
      totalPrimerasComuniones: 0,
      totalConfirmaciones: 0,
      totalMatrimonios: 0
    };
  }
}
