import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { prisma } from '@/lib/prisma';
import { setupCatalogo, limpiarCatalogo, type Catalogo } from './helpers/sacramentos-fixtures';
import { GET, POST } from '@/app/api/configuracion/moldes/route';
import { GET as getById, PUT as putById, DELETE as deleteById } from '@/app/api/configuracion/moldes/[id]/route';
import { GET as getCampos } from '@/app/api/configuracion/moldes/[id]/campos/route';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

let cat: Catalogo;

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}

async function pdfConCampos(campos: string[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.addPage([300, 300]);
  const form = pdf.getForm();
  for (const nombre of campos) form.createTextField(nombre);
  return pdf.save();
}

function formDataWith(pdf: Uint8Array, extras: Record<string, string> = {}) {
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const f = new File([blob], 'molde.pdf', { type: 'application/pdf' });
  const fd = new FormData();
  fd.append('sacramento', extras.sacramento ?? 'bautismo');
  fd.append('tipo_constancia', extras.tipo_constancia ?? 'predeterminado');
  fd.append('nombre', extras.nombre ?? 'Molde Test');
  fd.append('archivo', f);
  return fd;
}

function makeReq(fd: FormData) {
  return new Request('http://t/api/configuracion/moldes', { method: 'POST', body: fd }) as unknown as Parameters<typeof POST>[0];
}

function makePutReq(body: unknown) {
  return new Request('http://t/api/configuracion/moldes/1', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof putById>[0];
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeAll(async () => {
  cat = await setupCatalogo();
});

beforeEach(async () => {
  await prisma.bitacoraCrud.deleteMany({ where: { nombre_tabla: 'molde_constancia' } });
  await prisma.moldeConstancia.deleteMany({});
});

afterAll(async () => {
  await prisma.moldeConstancia.deleteMany({});
  await prisma.bitacoraCrud.deleteMany({ where: { nombre_tabla: 'molde_constancia' } });
  await limpiarCatalogo();
  await prisma.$disconnect();
});

describe('POST /api/configuracion/moldes', () => {
  it('sin sesion -> 401', async () => {
    setSession(null);
    const pdf = await pdfConCampos(['campo1']);
    const res = await POST(makeReq(formDataWith(pdf)));
    expect(res.status).toBe(401);
  });

  it('sin permiso (catequista) -> 403', async () => {
    setSession(cat.parishA, 'catequista');
    const pdf = await pdfConCampos(['campo1']);
    const res = await POST(makeReq(formDataWith(pdf)));
    expect(res.status).toBe(403);
  });

  it('PDF sin AcroForm -> 400', async () => {
    setSession(cat.parishA);
    const pdf = await PDFDocument.create();
    pdf.addPage([300, 300]);
    const bytes = await pdf.save();
    const res = await POST(makeReq(formDataWith(bytes)));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/AcroForm/);
  });

  it('PDF > 5 MB -> 400', async () => {
    setSession(cat.parishA);
    const grande = new Uint8Array(5 * 1024 * 1024 + 1);
    grande.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const res = await POST(makeReq(formDataWith(grande)));
    expect(res.status).toBe(400);
  });

  it('PDF con /JS -> 400', async () => {
    setSession(cat.parishA);
    const malicioso = new Uint8Array(Buffer.from('%PDF-1.4 /JS attack', 'latin1'));
    const res = await POST(makeReq(formDataWith(malicioso)));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/\/JS/);
  });

  it('PDF valido se crea como borrador (activo=false)', async () => {
    setSession(cat.parishA);
    const pdf = await pdfConCampos(['campo1']);
    const res = await POST(makeReq(formDataWith(pdf)));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.activo).toBe(false);
    expect(body.mapa_campos).toEqual({});
    expect(body.archivo_nombre).toBe('molde.pdf');
  });

  it('duplicado por nombre -> 409', async () => {
    setSession(cat.parishA);
    const pdf = await pdfConCampos(['c']);
    expect((await POST(makeReq(formDataWith(pdf)))).status).toBe(201);
    expect((await POST(makeReq(formDataWith(pdf)))).status).toBe(409);
  });
});

describe('GET /api/configuracion/moldes (tenant)', () => {
  it('solo lista parroquia de sesion', async () => {
    const pdf = await pdfConCampos(['c']);
    await prisma.moldeConstancia.create({
      data: {
        id_parroquia: cat.parishA, sacramento: 'bautismo', tipo_constancia: 'predeterminado',
        nombre: 'A', archivo: Buffer.from(pdf), archivo_nombre: 'a.pdf',
        archivo_bytes: pdf.byteLength, mapa_campos: {}, activo: false,
      },
    });
    await prisma.moldeConstancia.create({
      data: {
        id_parroquia: cat.parishB, sacramento: 'bautismo', tipo_constancia: 'predeterminado',
        nombre: 'B', archivo: Buffer.from(pdf), archivo_nombre: 'b.pdf',
        archivo_bytes: pdf.byteLength, mapa_campos: {}, activo: false,
      },
    });

    setSession(cat.parishA);
    const resA = await GET();
    expect(resA.status).toBe(200);
    const rowsA = await resA.json();
    expect(rowsA).toHaveLength(1);
    expect(rowsA[0].nombre).toBe('A');

    setSession(cat.parishB);
    const resB = await GET();
    const rowsB = await resB.json();
    expect(rowsB).toHaveLength(1);
    expect(rowsB[0].nombre).toBe('B');
  });

  it('sin sesion -> 401; sin permiso -> 403', async () => {
    setSession(null);
    expect((await GET()).status).toBe(401);
    setSession(cat.parishA, 'secretario');
    expect((await GET()).status).toBe(403);
  });
});

describe('GET /api/configuracion/moldes/[id] (descarga)', () => {
  it('cross-tenant -> 404', async () => {
    const pdf = await pdfConCampos(['c']);
    const m = await prisma.moldeConstancia.create({
      data: {
        id_parroquia: cat.parishA, sacramento: 'bautismo', tipo_constancia: 'predeterminado',
        nombre: 'A', archivo: Buffer.from(pdf), archivo_nombre: 'a.pdf',
        archivo_bytes: pdf.byteLength, mapa_campos: {}, activo: false,
      },
    });
    setSession(cat.parishB);
    const res = await getById(new Request('http://t'), ctx(m.id.toString()));
    expect(res.status).toBe(404);
  });
});

describe('GET /api/configuracion/moldes/[id]/campos', () => {
  it('lista nombres AcroForm', async () => {
    const pdf = await pdfConCampos(['campo_x', 'campo_y']);
    setSession(cat.parishA);
    const creado = await POST(makeReq(formDataWith(pdf)));
    const { id } = await creado.json();

    const res = await getCampos(new Request('http://t'), ctx(id));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.campos.sort()).toEqual(['campo_x', 'campo_y']);
  });

  it('cross-tenant -> 404', async () => {
    const pdf = await pdfConCampos(['c']);
    const m = await prisma.moldeConstancia.create({
      data: {
        id_parroquia: cat.parishA, sacramento: 'bautismo', tipo_constancia: 'predeterminado',
        nombre: 'A', archivo: Buffer.from(pdf), archivo_nombre: 'a.pdf',
        archivo_bytes: pdf.byteLength, mapa_campos: {}, activo: false,
      },
    });
    setSession(cat.parishB);
    const res = await getCampos(new Request('http://t'), ctx(m.id.toString()));
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/configuracion/moldes/[id]', () => {
  it('activar con mapa vacio -> 400', async () => {
    const pdf = await pdfConCampos(['c']);
    setSession(cat.parishA);
    const creado = await POST(makeReq(formDataWith(pdf)));
    const { id } = await creado.json();

    const res = await putById(makePutReq({ activo: true, mapa_campos: {} }), ctx(id));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/vacío/);
  });

  it('activar con token desconocido -> 400', async () => {
    const pdf = await pdfConCampos(['campo']);
    setSession(cat.parishA);
    const creado = await POST(makeReq(formDataWith(pdf)));
    const { id } = await creado.json();

    const res = await putById(
      makePutReq({ activo: true, mapa_campos: { campo: 'no.existe' } }),
      ctx(id)
    );
    expect(res.status).toBe(400);
  });

  it('activar con campo inexistente en PDF -> 400', async () => {
    const pdf = await pdfConCampos(['campo_real']);
    setSession(cat.parishA);
    const creado = await POST(makeReq(formDataWith(pdf)));
    const { id } = await creado.json();

    const res = await putById(
      makePutReq({ activo: true, mapa_campos: { campo_falso: 'persona.dni' } }),
      ctx(id)
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/no existe/);
  });

  it('activar con mapa valido -> 200 y activo=true', async () => {
    const pdf = await pdfConCampos(['nombre_completo']);
    setSession(cat.parishA);
    const creado = await POST(makeReq(formDataWith(pdf)));
    const { id } = await creado.json();

    const res = await putById(
      makePutReq({ activo: true, mapa_campos: { nombre_completo: 'persona.nombre_completo' } }),
      ctx(id)
    );
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.activo).toBe(true);
    expect(updated.mapa_campos).toEqual({ nombre_completo: 'persona.nombre_completo' });
  });

  it('cross-tenant PUT -> 404', async () => {
    const pdf = await pdfConCampos(['c']);
    const m = await prisma.moldeConstancia.create({
      data: {
        id_parroquia: cat.parishA, sacramento: 'bautismo', tipo_constancia: 'predeterminado',
        nombre: 'A', archivo: Buffer.from(pdf), archivo_nombre: 'a.pdf',
        archivo_bytes: pdf.byteLength, mapa_campos: {}, activo: false,
      },
    });
    setSession(cat.parishB);
    const res = await putById(makePutReq({ nombre: 'hack' }), ctx(m.id.toString()));
    expect(res.status).toBe(404);
  });
});

describe('UNIQUE parcial activo', () => {
  it('dos moldes activos para misma parroquia+sacramento+tipo -> 409', async () => {
    const pdf = await pdfConCampos(['c']);
    setSession(cat.parishA);
    const r1 = await POST(makeReq(formDataWith(pdf, { nombre: 'Molde 1' })));
    const id1 = (await r1.json()).id;
    const r2 = await POST(makeReq(formDataWith(pdf, { nombre: 'Molde 2' })));
    const id2 = (await r2.json()).id;

    await putById(
      makePutReq({ activo: true, mapa_campos: { c: 'persona.dni' } }),
      ctx(id1)
    );

    const res = await putById(
      makePutReq({ activo: true, mapa_campos: { c: 'persona.dni' } }),
      ctx(id2)
    );
    expect(res.status).toBe(409);
  });

  it('obtenerMoldeActivo es determinista (devuelve null si no hay activo)', async () => {
    const { obtenerMoldeActivo } = await import('@/lib/constancias/moldes');
    const pdf = await pdfConCampos(['c']);
    await prisma.moldeConstancia.create({
      data: {
        id_parroquia: cat.parishA, sacramento: 'matrimonio', tipo_constancia: 'predeterminado',
        nombre: 'A', archivo: Buffer.from(pdf), archivo_nombre: 'a.pdf',
        archivo_bytes: pdf.byteLength, mapa_campos: { c: 'persona.dni' }, activo: true,
      },
    });
    const m = await obtenerMoldeActivo(cat.parishA, 'matrimonio', 'predeterminado');
    expect(m).not.toBeNull();
    expect(m?.activo).toBe(true);
    const ninguno = await obtenerMoldeActivo(cat.parishA, 'bautismo', 'predeterminado');
    expect(ninguno).toBeNull();
  });
});

describe('DELETE /api/configuracion/moldes/[id]', () => {
  it('cross-tenant DELETE -> 404', async () => {
    const pdf = await pdfConCampos(['c']);
    const m = await prisma.moldeConstancia.create({
      data: {
        id_parroquia: cat.parishA, sacramento: 'bautismo', tipo_constancia: 'predeterminado',
        nombre: 'A', archivo: Buffer.from(pdf), archivo_nombre: 'a.pdf',
        archivo_bytes: pdf.byteLength, mapa_campos: {}, activo: false,
      },
    });
    setSession(cat.parishB);
    const res = await deleteById(new Request('http://t'), ctx(m.id.toString()));
    expect(res.status).toBe(404);
  });

  it('propio DELETE -> 200 y desaparece', async () => {
    const pdf = await pdfConCampos(['c']);
    setSession(cat.parishA);
    const creado = await POST(makeReq(formDataWith(pdf)));
    const { id } = await creado.json();
    const res = await deleteById(new Request('http://t'), ctx(id));
    expect(res.status).toBe(200);
    const after = await prisma.moldeConstancia.findUnique({ where: { id: BigInt(id) } });
    expect(after).toBeNull();
  });
});

describe('Auditoria', () => {
  it('registra CREATE, UPDATE y DELETE en bitacora_crud', async () => {
    const pdf = await pdfConCampos(['campo']);
    setSession(cat.parishA);
    const r1 = await POST(makeReq(formDataWith(pdf)));
    const { id } = await r1.json();

    await putById(
      makePutReq({ activo: true, mapa_campos: { campo: 'persona.dni' } }),
      ctx(id)
    );

    await deleteById(new Request('http://t'), ctx(id));

    const logs = await prisma.bitacoraCrud.findMany({
      where: { nombre_tabla: 'molde_constancia', id_tabla_afectado: BigInt(id) },
      orderBy: { fecha: 'asc' },
      select: { accion: true },
    });
    expect(logs.map((l) => l.accion)).toEqual(['C', 'U', 'D']);
  });
});
