// Serialización JSON segura para respuestas de API.
// Prisma devuelve BigInt en varias PKs/FKs; NextResponse.json no puede
// serializar BigInt. jsonSafe convierte recursivamente cualquier BigInt a
// string, preservando el resto de la estructura (incluidos includes anidados).
export function jsonSafe<T>(value: T): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v))
  );
}
