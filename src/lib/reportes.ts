import { withTenantScope } from '@/lib/prisma-tenant';

export interface ReportesResumen {
  totalPersonas: number;
  totalBautismos: number;
  totalPrimerasComuniones: number;
  totalConfirmaciones: number;
  totalMatrimonios: number;
  totalUsuarios: number;
  usuariosActivos: number;
}

export interface ReporteSacramentoAnual {
  tipo: string;
  label: string;
  total: number;
  esteAno: number;
}

export interface ReporteReciente {
  tipo: string;
  label: string;
  id: string;
  nombre: string;
  fecha: string;
}

export interface ReportesData {
  resumen: ReportesResumen;
  porSacramento: ReporteSacramentoAnual[];
  personasPorSexo: { masculino: number; femenino: number };
  recientes: ReporteReciente[];
  anioActual: number;
}

function inicioAnio(anio: number): Date {
  return new Date(anio, 0, 1);
}

function finAnio(anio: number): Date {
  return new Date(anio, 11, 31, 23, 59, 59, 999);
}

export async function getReportesData(parishId: number): Promise<ReportesData> {
  const anioActual = new Date().getFullYear();
  const desde = inicioAnio(anioActual);
  const hasta = finAnio(anioActual);

  return withTenantScope(parishId, async (db) => {
    const [
      totalPersonas,
      totalBautismos,
      totalPrimerasComuniones,
      totalConfirmaciones,
      totalMatrimonios,
      totalUsuarios,
      usuariosActivos,
      bautismosAnio,
      comunionesAnio,
      confirmacionesAnio,
      matrimoniosAnio,
      masculino,
      femenino,
      bautismosRecientes,
      comunionesRecientes,
      confirmacionesRecientes,
      matrimoniosRecientes,
    ] = await Promise.all([
      db.persona.count({ where: { id_parroquia: parishId } }),
      db.bautismo.count({ where: { id_parroquia: parishId } }),
      db.primeraComunion.count({ where: { id_parroquia: parishId } }),
      db.confirmacion.count({ where: { id_parroquia: parishId } }),
      db.matrimonio.count({ where: { id_parroquia: parishId } }),
      db.usuario.count({ where: { id_parroquia: parishId } }),
      db.usuario.count({ where: { id_parroquia: parishId, estado: 1 } }),
      db.bautismo.count({
        where: {
          id_parroquia: parishId,
          fecha_bautismo: { gte: desde, lte: hasta },
        },
      }),
      db.primeraComunion.count({
        where: {
          id_parroquia: parishId,
          fecha_primera_comunion: { gte: desde, lte: hasta },
        },
      }),
      db.confirmacion.count({
        where: {
          id_parroquia: parishId,
          fecha_confirmacion: { gte: desde, lte: hasta },
        },
      }),
      db.matrimonio.count({
        where: {
          id_parroquia: parishId,
          fecha_matrimonio: { gte: desde, lte: hasta },
        },
      }),
      db.persona.count({ where: { id_parroquia: parishId, sexo: 'M' } }),
      db.persona.count({ where: { id_parroquia: parishId, sexo: 'F' } }),
      db.bautismo.findMany({
        where: { id_parroquia: parishId },
        include: {
          bautizado: { select: { nombres: true, apellidos: true } },
        },
        orderBy: { fecha_bautismo: 'desc' },
        take: 5,
      }),
      db.primeraComunion.findMany({
        where: { id_parroquia: parishId },
        include: {
          persona: { select: { nombres: true, apellidos: true } },
        },
        orderBy: { fecha_primera_comunion: 'desc' },
        take: 5,
      }),
      db.confirmacion.findMany({
        where: { id_parroquia: parishId },
        include: {
          confirmado: { select: { nombres: true, apellidos: true } },
        },
        orderBy: { fecha_confirmacion: 'desc' },
        take: 5,
      }),
      db.matrimonio.findMany({
        where: { id_parroquia: parishId },
        include: {
          esposo: { select: { nombres: true, apellidos: true } },
          esposa: { select: { nombres: true, apellidos: true } },
        },
        orderBy: { fecha_matrimonio: 'desc' },
        take: 5,
      }),
    ]);

    const recientes: ReporteReciente[] = [
      ...bautismosRecientes.map((r) => ({
        tipo: 'bautismo',
        label: 'Bautismo',
        id: r.id_bautismo.toString(),
        nombre: `${r.bautizado.nombres} ${r.bautizado.apellidos}`,
        fecha: r.fecha_bautismo.toISOString(),
      })),
      ...comunionesRecientes.map((r) => ({
        tipo: 'primera_comunion',
        label: 'Primera Comunión',
        id: r.id_primera_comunion.toString(),
        nombre: `${r.persona.nombres} ${r.persona.apellidos}`,
        fecha: r.fecha_primera_comunion.toISOString(),
      })),
      ...confirmacionesRecientes.map((r) => ({
        tipo: 'confirmacion',
        label: 'Confirmación',
        id: r.id_confirmacion.toString(),
        nombre: `${r.confirmado.nombres} ${r.confirmado.apellidos}`,
        fecha: r.fecha_confirmacion.toISOString(),
      })),
      ...matrimoniosRecientes.map((r) => ({
        tipo: 'matrimonio',
        label: 'Matrimonio',
        id: r.id_matrimonio.toString(),
        nombre: `${r.esposo.nombres} ${r.esposo.apellidos} y ${r.esposa.nombres} ${r.esposa.apellidos}`,
        fecha: r.fecha_matrimonio.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10);

    return {
      resumen: {
        totalPersonas,
        totalBautismos,
        totalPrimerasComuniones,
        totalConfirmaciones,
        totalMatrimonios,
        totalUsuarios,
        usuariosActivos,
      },
      porSacramento: [
        { tipo: 'bautismo', label: 'Bautismos', total: totalBautismos, esteAno: bautismosAnio },
        {
          tipo: 'primera_comunion',
          label: 'Primeras Comuniones',
          total: totalPrimerasComuniones,
          esteAno: comunionesAnio,
        },
        {
          tipo: 'confirmacion',
          label: 'Confirmaciones',
          total: totalConfirmaciones,
          esteAno: confirmacionesAnio,
        },
        {
          tipo: 'matrimonio',
          label: 'Matrimonios',
          total: totalMatrimonios,
          esteAno: matrimoniosAnio,
        },
      ],
      personasPorSexo: { masculino, femenino },
      recientes,
      anioActual,
    };
  });
}
