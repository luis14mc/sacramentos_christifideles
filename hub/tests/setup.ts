const url = process.env.HUB_TEST_DATABASE_URL;
if (!url) {
  throw new Error('Tests del hub bloqueados: HUB_TEST_DATABASE_URL es obligatoria.');
}
const { hostname, pathname } = new URL(url);
if (!['localhost', '127.0.0.1'].includes(hostname) && !/test/i.test(pathname)) {
  throw new Error('Tests del hub bloqueados: HUB_TEST_DATABASE_URL debe ser local o una BD *test*.');
}
process.env.DATABASE_URL = url;
process.env.HUB_CLAVE_MAESTRA = Buffer.alloc(32, 7).toString('base64');
