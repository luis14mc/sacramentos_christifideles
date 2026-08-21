const baseUrl = process.env.BASE_URL?.replace(/\/$/, '');
if (!baseUrl) {
  console.error('BASE_URL es obligatorio. Ejemplo: BASE_URL=https://staging.example.com npm run smoke');
  process.exit(2);
}

async function check(path, expected = 200) {
  const res = await fetch(`${baseUrl}${path}`, { redirect: 'manual', cache: 'no-store' });
  if (res.status !== expected) {
    throw new Error(`${path}: esperado ${expected}, recibido ${res.status}`);
  }
  return res;
}

try {
  const health = await check('/api/health');
  const body = await health.json();
  if (body.status !== 'ok' || body.database !== 'ok') throw new Error('/api/health no reportó estado saludable');

  // Un endpoint protegido sin sesión debe rechazar acceso. Esto valida que staging
  // no dejó APIs sensibles abiertas accidentalmente.
  await check('/api/dashboard', 401);

  console.log('Smoke test PASS: health + protección de endpoint');
} catch (error) {
  console.error('Smoke test FAIL:', error instanceof Error ? error.message : error);
  process.exit(1);
}
