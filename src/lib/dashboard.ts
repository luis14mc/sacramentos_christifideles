import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { withTenantScope } from '@/lib/prisma-tenant';

export async function getParroquiaData(userId: string) {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id_usuario: BigInt(userId) },
      include: {
        parroquia: { include: { config: true } },
        rol: true,
      },
    });

    if (!user?.parroquia) {
      return null;
    }

    const parishId = user.parroquia.id_parroquia;

    const parroquia = await withTenantScope(parishId, (db) =>
      db.parroquia.findUnique({
        where: { id_parroquia: parishId },
        include: { config: true },
      })
    );

    if (!parroquia) {
      return null;
    }

    return {
      parroquia: {
        id: Number(parroquia.id_parroquia),
        nombre: parroquia.nombre,
        direccion: parroquia.direccion,
        telefono: parroquia.telefono,
        email: parroquia.email,
        config: parroquia.config
          ? {
              alias_liturgico: parroquia.config.alias_liturgico,
              tz: parroquia.config.tz,
              idioma: parroquia.config.idioma,
              opciones: parroquia.config.opciones,
            }
          : null,
      },
      usuario: {
        id: Number(user.id_usuario),
        nombre: user.nombre,
        email: user.email,
        rol: user.rol.nombre,
        telefono: user.telefono,
      },
    };
  } catch (error) {
    logger.error('Error getting parroquia data:', error);
    return null;
  }
}

export async function getDashboardStats(parroquiaId: number) {
  try {
    return await withTenantScope(parroquiaId, async (db) => {
      const [
        totalPersonas,
        totalBautismos,
        totalPrimerasComuniones,
        totalConfirmaciones,
        totalMatrimonios,
        totalUsuarios,
        usuariosActivos,
      ] = await Promise.all([
        db.persona.count({ where: { id_parroquia: parroquiaId } }),
        db.bautismo.count({ where: { id_parroquia: parroquiaId } }),
        db.primeraComunion.count({ where: { id_parroquia: parroquiaId } }),
        db.confirmacion.count({ where: { id_parroquia: parroquiaId } }),
        db.matrimonio.count({ where: { id_parroquia: parroquiaId } }),
        db.usuario.count({ where: { id_parroquia: parroquiaId } }),
        db.usuario.count({
          where: { id_parroquia: parroquiaId, estado: 1 },
        }),
      ]);

      return {
        totalPersonas,
        totalBautismos,
        totalPrimerasComuniones,
        totalConfirmaciones,
        totalMatrimonios,
        totalUsuarios,
        usuariosActivos,
      };
    });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    return {
      totalPersonas: 0,
      totalBautismos: 0,
      totalPrimerasComuniones: 0,
      totalConfirmaciones: 0,
      totalMatrimonios: 0,
      totalUsuarios: 0,
      usuariosActivos: 0,
    };
  }
}
