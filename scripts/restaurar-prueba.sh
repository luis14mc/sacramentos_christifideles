#!/usr/bin/env bash
# Restauración de prueba desde el último respaldo cifrado en R2.
# Uso: BASE=loarque|cerrogrande|hub  RESTORE_DATABASE_URL=...  AGE_PRIVATE_KEY=...  \
#      BACKUP_S3_* ...  ./scripts/restaurar-prueba.sh
set -euo pipefail

BASE="${1:-${BASE:-}}"
if [ -z "$BASE" ]; then
  echo "Uso: $0 <loarque|cerrogrande|hub>" >&2
  echo "Variables: RESTORE_DATABASE_URL, AGE_PRIVATE_KEY, BACKUP_S3_ENDPOINT, BACKUP_S3_BUCKET," >&2
  echo "BACKUP_S3_ACCESS_KEY, BACKUP_S3_SECRET_KEY, BACKUP_DB_URL_LOARQUE, BACKUP_DB_URL_CERROGRANDE, BACKUP_DB_URL_HUB" >&2
  exit 1
fi

case "$BASE" in
  loarque | cerrogrande | hub) ;;
  *)
    echo "Base inválida: $BASE" >&2
    exit 1
    ;;
esac

require_var() {
  if [ -z "${!1:-}" ]; then
    echo "Falta variable de entorno: $1" >&2
    exit 1
  fi
}

for v in RESTORE_DATABASE_URL AGE_PRIVATE_KEY BACKUP_S3_ENDPOINT BACKUP_S3_BUCKET \
  BACKUP_S3_ACCESS_KEY BACKUP_S3_SECRET_KEY BACKUP_DB_URL_LOARQUE BACKUP_DB_URL_CERROGRANDE \
  BACKUP_DB_URL_HUB; do
  require_var "$v"
done

normalize_url() {
  # Compara host:puerto/ruta sin credenciales ni esquema (postgres vs postgresql)
  python3 - "$1" <<'PY'
import sys
from urllib.parse import urlparse
u = urlparse(sys.argv[1])
port = u.port
if port is None and u.scheme in ("postgresql", "postgres"):
    port = 5432
host = u.hostname or ""
netloc = f"{host}:{port}" if port else host
path = u.path or ""
print(f"{netloc}{path}")
PY
}

restore_norm="$(normalize_url "$RESTORE_DATABASE_URL")"
for label in LOARQUE CERROGRANDE HUB; do
  var="BACKUP_DB_URL_${label}"
  prod_norm="$(normalize_url "${!var}")"
  if [ "$restore_norm" = "$prod_norm" ]; then
    echo "RESTORE_DATABASE_URL apunta a la misma base que BACKUP_DB_URL_${label}. Abortando." >&2
    exit 1
  fi
done

table_count="$(psql "$RESTORE_DATABASE_URL" -tAc \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" \
  | tr -d '[:space:]')"
if [ "${table_count:-0}" != "0" ]; then
  echo "La base destino no está vacía (${table_count} tablas en public). Abortando." >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "Se requiere aws CLI." >&2
  exit 1
fi
if ! command -v age >/dev/null 2>&1; then
  echo "Se requiere age." >&2
  exit 1
fi

export AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-auto}"

prefix="${BASE}/"
latest_key="$(
  aws s3api list-objects-v2 \
    --bucket "$BACKUP_S3_BUCKET" \
    --prefix "$prefix" \
    --endpoint-url "$BACKUP_S3_ENDPOINT" \
    --query 'sort_by(Contents,&LastModified)[-1].Key' \
    --output text
)"
if [ -z "$latest_key" ] || [ "$latest_key" = "None" ]; then
  echo "No hay respaldos bajo ${prefix} en el bucket." >&2
  exit 1
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

encrypted="${work}/backup.dump.age"
plain="${work}/backup.dump"

aws s3 cp "s3://${BACKUP_S3_BUCKET}/${latest_key}" "$encrypted" \
  --endpoint-url "$BACKUP_S3_ENDPOINT" \
  --only-show-errors

printf '%s' "$AGE_PRIVATE_KEY" > "${work}/identity.txt"
age -d -i "${work}/identity.txt" -o "$plain" "$encrypted"
rm -f "${work}/identity.txt" "$encrypted"

pg_restore --clean --if-exists --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" "$plain"
rm -f "$plain"

if [ "$BASE" = hub ]; then
  critical=(instancia solicitud)
else
  critical=(persona bautismo primera_comunion confirmacion matrimonio numeradores usuario bitacora_crud)
fi

echo "Restauración desde ${latest_key} completada. Conteos:"
for table in "${critical[@]}"; do
  count="$(psql "$RESTORE_DATABASE_URL" -tAc "SELECT COUNT(*) FROM \"${table}\";" | tr -d '[:space:]')"
  echo "  ${table}: ${count}"
done
