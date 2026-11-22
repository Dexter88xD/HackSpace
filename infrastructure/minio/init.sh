#!/bin/sh
set -eu
umask 077

: "${MINIO_ROOT_USER:?MinIO administrator username is required}"
: "${MINIO_ROOT_PASSWORD:?MinIO administrator password is required}"
: "${MINIO_ACCESS_KEY:?MinIO application access key is required}"
: "${MINIO_SECRET_KEY:?MinIO application secret key is required}"

if [ "$MINIO_ACCESS_KEY" = "$MINIO_ROOT_USER" ] || [ "$MINIO_SECRET_KEY" = "$MINIO_ROOT_PASSWORD" ]; then
  echo 'MinIO application credentials must not reuse the root username or password' >&2
  exit 1
fi

export MC_CONFIG_DIR
MC_CONFIG_DIR="$(mktemp -d)"
trap 'rm -rf "$MC_CONFIG_DIR"' EXIT

mc alias set provision http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null
for bucket in default avatar submission hackathon; do
  mc mb --ignore-existing "provision/$bucket" >/dev/null
  mc anonymous set none "provision/$bucket" >/dev/null
done

mc admin policy create provision hackspace-backend /provision/backend-policy.json >/dev/null
mc admin user add provision "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null

# MinIO reports an already attached policy as a no-op error on some versions.
if attach_result="$(mc admin policy attach provision hackspace-backend --user "$MINIO_ACCESS_KEY" 2>&1)"; then
  :
else
  case "$attach_result" in
    *'The specified policy change is already in effect'*) ;;
    *) echo 'Failed to attach MinIO application policy' >&2; exit 1 ;;
  esac
fi

echo 'MinIO buckets and restricted application identity provisioned'
