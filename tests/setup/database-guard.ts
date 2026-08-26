const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'Tests blocked: TEST_DATABASE_URL is required and must point to an isolated test database.',
  );
}

let parsedUrl: URL;
try {
  parsedUrl = new URL(testDatabaseUrl);
} catch {
  throw new Error('Tests blocked: TEST_DATABASE_URL is invalid.');
}

const target = `${parsedUrl.hostname}/${parsedUrl.pathname.slice(1)}`;
const isLocal = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
const isMarkedTest = /(^|[-_.\/])(test|testing)([-_.\/]|$)/i.test(target);
const isMarkedProduction = /(^|[-_.\/])(prod|production)([-_.\/]|$)/i.test(target);

if (isMarkedProduction || (!isLocal && !isMarkedTest)) {
  throw new Error(
    'Tests blocked: TEST_DATABASE_URL must use localhost or an explicitly marked test/testing database.',
  );
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.DIRECT_URL = testDatabaseUrl;
