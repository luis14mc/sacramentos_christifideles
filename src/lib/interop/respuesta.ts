import { prisma } from '@/lib/prisma';
import { cargarExpedientePersona } from '@/lib/expediente';
import type { RespuestaConsulta } from '@/lib/interop/contrato';

/**
 * Arma los datos que esta parroquia comparte al aprobar una consulta.
 * Solo sacramentos como sujeto principal y datos mínimos de identificación
 * (ver `RespuestaConsulta`).
 */
export async function construirRespuestaConsulta(
  parishId: number,
  numeroIdentidad: string
): Promise<RespuestaConsulta> {
  const [persona, expediente] = await Promise.all([
    prisma.persona.findUnique({
      where: {
        id_parroquia_numero_identidad: { id_parroquia: parishId, numero_identidad: numeroIdentidad },
      },
      select: { fecha_nacimiento: true },
    }),
    cargarExpedientePersona(parishId, numeroIdentidad),
  ]);

  if (!persona || !expediente) return { encontrado: false };

  return {
    encontrado: true,
    nombres: expediente.nombres,
    apellidos: expediente.apellidos,
    fecha_nacimiento: persona.fecha_nacimiento.toISOString().slice(0, 10),
    sacramentos: expediente.entradas.map((e) => ({
      tipo: e.tipo,
      fecha: e.fecha,
      libro: e.libro,
      pagina: e.pagina,
      registro: e.registro,
      folio: e.folio,
    })),
  };
}
