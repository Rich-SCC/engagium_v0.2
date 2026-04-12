#!/usr/bin/env bash
set -euo pipefail

SECRETS_DIR="${1:-.secrets}"
FORCE="${FORCE:-false}"

if [[ ! -d "$SECRETS_DIR" ]]; then
  echo "Secrets directory not found: $SECRETS_DIR" >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required to generate secrets." >&2
  exit 1
fi

is_placeholder() {
  local value="$1"
  [[ -z "$value" || "$value" =~ CHANGE_ME|YOUR-|your-|example|placeholder ]]
}

write_secret_if_needed() {
  local file="$1"
  local existing=""
  if [[ -f "$file" ]]; then
    existing="$(tr -d '\r\n' < "$file")"
  fi

  if [[ "$FORCE" != "true" && -n "$existing" ]] && ! is_placeholder "$existing"; then
    echo "Skipping $file (already set). Use FORCE=true to overwrite."
    return 0
  fi

  openssl rand -hex 64 > "$file"
  chmod 600 "$file"
  echo "Generated $file"
}

write_secret_if_needed "$SECRETS_DIR/jwt_secret"
write_secret_if_needed "$SECRETS_DIR/jwt_refresh_secret"
write_secret_if_needed "$SECRETS_DIR/session_secret"

echo "Done."
