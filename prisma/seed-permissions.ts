import { PrismaClient } from '@prisma/client';

type PermFlags = {
  puede_ver: number;
  puede_crear: number;
  puede_actualizar: number;
  puede_borrar: number;
};

const FULL: PermFlags = {
  puede_ver: 1,
  puede_crear: 1,
  puede_actualizar: 1,
  puede_borrar: 1,
};

const READ: PermFlags = {
  puede_ver: 1,
  puede_crear: 0,
  puede_actualizar: 0,
  puede_borrar: 0,
};

const WRITE_NO_DELETE: PermFlags = {
  puede_ver: 1,
  puede_crear: 1,
  puede_actualizar: 1,
  puede_borrar: 0,
};

/** Pobla tr_rol_pagina según roles del seed (1-5). */
export async function seedRolePagePermissions(prisma: PrismaClient) {
  console.log('🔐 Asignando permisos rol-página...');

  const paginas = await prisma.pagina.findMany({ orderBy: { id_pagina: 'asc' } });
  if (paginas.length === 0) {
    console.warn('  ⚠️ No hay páginas; omitiendo permisos.');
    return;
  }

  async function grantAllPages(roleId: number, flags: PermFlags) {
    for (const pagina of paginas) {
      await prisma.trRolPagina.upsert({
        where: {
          id_rol_id_pagina: { id_rol: roleId, id_pagina: pagina.id_pagina },
        },
        update: flags,
        create: {
          id_rol: roleId,
          id_pagina: pagina.id_pagina,
          ...flags,
        },
      });
    }
  }

  async function grantPages(
    roleId: number,
    urls: string[],
    flags: PermFlags
  ) {
    for (const url of urls) {
      const pagina = paginas.find((p) => p.url === url);
      if (!pagina) continue;
      await prisma.trRolPagina.upsert({
        where: {
          id_rol_id_pagina: { id_rol: roleId, id_pagina: pagina.id_pagina },
        },
        update: flags,
        create: {
          id_rol: roleId,
          id_pagina: pagina.id_pagina,
          ...flags,
        },
      });
    }
  }

  // 1 Super Admin, 2 Admin Parroquia
  await grantAllPages(1, FULL);
  await grantAllPages(2, FULL);

  // 3 Secretario
  await grantAllPages(3, FULL);
  const usuariosPage = paginas.find((p) => p.url === '/usuarios');
  if (usuariosPage) {
    await prisma.trRolPagina.upsert({
      where: {
        id_rol_id_pagina: { id_rol: 3, id_pagina: usuariosPage.id_pagina },
      },
      update: { ...WRITE_NO_DELETE, puede_borrar: 0 },
      create: {
        id_rol: 3,
        id_pagina: usuariosPage.id_pagina,
        ...WRITE_NO_DELETE,
        puede_borrar: 0,
      },
    });
  }

  // 4 Catequista
  await grantPages(
    4,
    [
      '/dashboard',
      '/personas',
      '/bautismos',
      '/primera-comunion',
      '/confirmaciones',
      '/constancias',
    ],
    WRITE_NO_DELETE
  );

  // 5 Solo Lectura
  await grantAllPages(5, READ);

  console.log(`  ✅ Permisos asignados para ${paginas.length} páginas`);
}
