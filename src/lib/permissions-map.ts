import { isFullAccessRole } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { PAGES, type PageUrl } from '@/lib/pages';
import {
  defaultPermissions,
  fullPermissions,
  type UserPermissions,
} from '@/types/permissions';
import type { TenantContext } from '@/lib/tenant';

type PageFlags = {
  ver: boolean;
  crear: boolean;
  actualizar: boolean;
  borrar: boolean;
};

const SACRAMENTO_PAGES: PageUrl[] = [
  PAGES.BAUTISMOS,
  PAGES.PRIMERA_COMUNION,
  PAGES.CONFIRMACIONES,
  PAGES.MATRIMONIOS,
];

/** Respaldo alineado con src/lib/rbac.ts (instalaciones sin tr_rol_pagina). */
const LEGACY_PAGE_ACTIONS: Record<
  string,
  Partial<Record<PageUrl, Partial<PageFlags>>>
> = {
  parroco: {
    [PAGES.DASHBOARD]: { ver: true },
    [PAGES.PERSONAS]: { ver: true, crear: true, actualizar: true, borrar: true },
    [PAGES.BAUTISMOS]: { ver: true, crear: true, actualizar: true, borrar: true },
    [PAGES.PRIMERA_COMUNION]: { ver: true, crear: true, actualizar: true, borrar: true },
    [PAGES.CONFIRMACIONES]: { ver: true, crear: true, actualizar: true, borrar: true },
    [PAGES.MATRIMONIOS]: { ver: true, crear: true, actualizar: true, borrar: true },
    [PAGES.CONSTANCIAS]: { ver: true, crear: true },
    [PAGES.REPORTES]: { ver: true },
    [PAGES.CONFIGURACION]: { ver: true },
    [PAGES.USUARIOS]: { ver: true },
  },
  secretario: {
    [PAGES.DASHBOARD]: { ver: true },
    [PAGES.PERSONAS]: { ver: true, crear: true, actualizar: true, borrar: true },
    [PAGES.BAUTISMOS]: { ver: true, crear: true, actualizar: true, borrar: true },
    [PAGES.PRIMERA_COMUNION]: { ver: true, crear: true, actualizar: true, borrar: true },
    [PAGES.CONFIRMACIONES]: { ver: true, crear: true, actualizar: true, borrar: true },
    [PAGES.MATRIMONIOS]: { ver: true, crear: true, actualizar: true, borrar: true },
    [PAGES.CONSTANCIAS]: { ver: true, crear: true },
    [PAGES.REPORTES]: { ver: true },
    [PAGES.CONFIGURACION]: { ver: true },
    [PAGES.USUARIOS]: { ver: true },
  },
  catequista: {
    [PAGES.DASHBOARD]: { ver: true },
    [PAGES.PERSONAS]: { ver: true },
    [PAGES.BAUTISMOS]: { ver: true, crear: true, actualizar: true },
    [PAGES.PRIMERA_COMUNION]: { ver: true, crear: true, actualizar: true },
    [PAGES.CONFIRMACIONES]: { ver: true, crear: true, actualizar: true },
    [PAGES.CONSTANCIAS]: { ver: true },
  },
  'solo lectura': {
    [PAGES.DASHBOARD]: { ver: true },
    [PAGES.PERSONAS]: { ver: true },
    [PAGES.BAUTISMOS]: { ver: true },
    [PAGES.PRIMERA_COMUNION]: { ver: true },
    [PAGES.CONFIRMACIONES]: { ver: true },
    [PAGES.MATRIMONIOS]: { ver: true },
    [PAGES.CONSTANCIAS]: { ver: true },
    [PAGES.REPORTES]: { ver: true },
  },
};

function emptyFlags(): PageFlags {
  return { ver: false, crear: false, actualizar: false, borrar: false };
}

function legacyFlagsByUrl(roleName: string): Map<string, PageFlags> {
  const map = new Map<string, PageFlags>();
  const legacy = LEGACY_PAGE_ACTIONS[roleName.toLowerCase()];
  if (!legacy) return map;

  for (const [url, flags] of Object.entries(legacy)) {
    map.set(url, {
      ver: flags.ver ?? false,
      crear: flags.crear ?? false,
      actualizar: flags.actualizar ?? false,
      borrar: flags.borrar ?? false,
    });
  }
  return map;
}

function getFlags(
  byUrl: Map<string, PageFlags>,
  url: PageUrl
): PageFlags {
  return byUrl.get(url) ?? emptyFlags();
}

function anySacrament(
  byUrl: Map<string, PageFlags>,
  pick: keyof PageFlags
): boolean {
  return SACRAMENTO_PAGES.some((url) => getFlags(byUrl, url)[pick]);
}

function buildFromUrlMap(byUrl: Map<string, PageFlags>): UserPermissions {
  const personas = getFlags(byUrl, PAGES.PERSONAS);
  const usuarios = getFlags(byUrl, PAGES.USUARIOS);
  const constancias = getFlags(byUrl, PAGES.CONSTANCIAS);
  const config = getFlags(byUrl, PAGES.CONFIGURACION);

  return {
    canViewDashboard: getFlags(byUrl, PAGES.DASHBOARD).ver,
    canViewPersonas: personas.ver,
    canManagePersonas:
      personas.crear || personas.actualizar || personas.borrar,
    canViewUsuarios: usuarios.ver,
    canManageUsuarios:
      usuarios.crear || usuarios.actualizar || usuarios.borrar,
    canViewSacramentos: anySacrament(byUrl, 'ver'),
    canCreateSacramentos: anySacrament(byUrl, 'crear'),
    canEditSacramentos: anySacrament(byUrl, 'actualizar'),
    canDeleteSacramentos: anySacrament(byUrl, 'borrar'),
    canViewConstancias: constancias.ver,
    canGenerateConstancias: constancias.crear,
    canViewReportes: getFlags(byUrl, PAGES.REPORTES).ver,
    canViewConfiguracion: config.ver,
    canManageConfiguracion:
      config.crear || config.actualizar || config.borrar,
  };
}

export async function resolveUserPermissions(
  ctx: TenantContext
): Promise<UserPermissions> {
  if (isFullAccessRole(ctx.roleName)) {
    return fullPermissions;
  }

  const rows = await prisma.trRolPagina.findMany({
    where: {
      id_rol: ctx.roleId,
      pagina: { estado: 1 },
    },
    include: { pagina: { select: { url: true } } },
  });

  const byUrl = new Map<string, PageFlags>();

  if (rows.length > 0) {
    for (const row of rows) {
      byUrl.set(row.pagina.url, {
        ver: row.puede_ver === 1,
        crear: row.puede_crear === 1,
        actualizar: row.puede_actualizar === 1,
        borrar: row.puede_borrar === 1,
      });
    }
    return buildFromUrlMap(byUrl);
  }

  const legacy = legacyFlagsByUrl(ctx.roleName);
  if (legacy.size > 0) {
    return buildFromUrlMap(legacy);
  }

  return defaultPermissions;
}
