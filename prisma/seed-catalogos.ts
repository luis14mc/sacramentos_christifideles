import { PrismaClient } from '@prisma/client';
import { sembrarCatalogos } from './catalogos/sembrar';

/** `pnpm db:seed:catalogos`: aplica solo los catálogos comunes (seguro en producción). */
const prisma = new PrismaClient();

sembrarCatalogos(prisma)
  .then(() => console.log('✓ Catálogos aplicados'))
  .catch((error) => {
    console.error('Error aplicando catálogos:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
