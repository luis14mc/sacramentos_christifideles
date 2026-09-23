/**
 * Arranque en Railway: migraciones versionadas + Next.js en 0.0.0.0:PORT
 */
import { execSync } from 'node:child_process';

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL es obligatoria en Railway.');
  process.exit(1);
}

run('pnpm exec prisma migrate deploy');

const port = process.env.PORT || '3000';
run(`pnpm exec next start -H 0.0.0.0 -p ${port}`);
