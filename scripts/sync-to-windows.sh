#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_DEST="/mnt/c/dev/TempoGuitar"

DEST_DIR="${DEFAULT_DEST}"
DRY_RUN=0
DELETE_MODE=0

usage() {
  cat <<'EOF'
Usage:
  ./scripts/sync-to-windows.sh [destination] [--dry-run] [--delete]

Examples:
  ./scripts/sync-to-windows.sh
  ./scripts/sync-to-windows.sh /mnt/c/dev/TempoGuitar --dry-run
  ./scripts/sync-to-windows.sh --delete

Notes:
  - Default destination: /mnt/c/dev/TempoGuitar
  - This is a one-way sync: WSL repo -> Windows folder
  - --delete will remove files in destination that do not exist in source
EOF
}

while (($# > 0)); do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --delete)
      DELETE_MODE=1
      shift
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      DEST_DIR="$1"
      shift
      ;;
  esac
done

if ! command -v rsync >/dev/null 2>&1; then
  echo "Error: rsync is required but not found." >&2
  exit 1
fi

if [[ ! -d "${SRC_DIR}" ]]; then
  echo "Error: source directory does not exist: ${SRC_DIR}" >&2
  exit 1
fi

if [[ ! -d "${DEST_DIR}" ]]; then
  echo "Destination does not exist. Creating: ${DEST_DIR}"
  mkdir -p "${DEST_DIR}"
fi

RSYNC_ARGS=(
  -rlt
  --human-readable
  --itemize-changes
  --omit-dir-times
  --exclude ".git/"
  --exclude ".codex"
  --exclude "node_modules/"
  --exclude "src-tauri/target/"
  --exclude "dist/"
  --exclude ".DS_Store"
)

if ((DELETE_MODE == 1)); then
  RSYNC_ARGS+=(--delete)
fi

if ((DRY_RUN == 1)); then
  RSYNC_ARGS+=(--dry-run)
fi

echo "Sync source:      ${SRC_DIR}"
echo "Sync destination: ${DEST_DIR}"
echo "Dry run:          ${DRY_RUN}"
echo "Delete mode:      ${DELETE_MODE}"
echo

rsync "${RSYNC_ARGS[@]}" "${SRC_DIR}/" "${DEST_DIR}/"

echo
echo "Sync completed."
