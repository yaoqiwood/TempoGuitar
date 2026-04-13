#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_DEST="/mnt/c/dev/TempoGuitar"

DEST_DIR="${DEFAULT_DEST}"
DELETE_MODE=0
DRY_RUN=0
POLL_MODE=0
INTERVAL_SECONDS="1.5"
DEBOUNCE_MS=350

usage() {
  cat <<'EOF'
Usage:
  ./scripts/auto-sync-to-windows.sh [destination] [options]

Options:
  --delete            Mirror mode, delete files not present in source.
  --dry-run           Show what would sync without writing files.
  --poll              Force polling mode (skip inotify).
  --interval <sec>    Poll interval in seconds (default: 1.5).
  --debounce-ms <ms>  Minimum gap between inotify-triggered syncs (default: 350).
  -h, --help          Show help.

Examples:
  ./scripts/auto-sync-to-windows.sh
  ./scripts/auto-sync-to-windows.sh --delete
  ./scripts/auto-sync-to-windows.sh /mnt/c/dev/TempoGuitar --poll --interval 2

Notes:
  - One-way sync: WSL repo -> Windows folder.
  - Press Ctrl+C to stop.
EOF
}

while (($# > 0)); do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --delete)
      DELETE_MODE=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --poll)
      POLL_MODE=1
      shift
      ;;
    --interval)
      if (($# < 2)); then
        echo "Error: --interval requires a value." >&2
        exit 1
      fi
      INTERVAL_SECONDS="$2"
      shift 2
      ;;
    --debounce-ms)
      if (($# < 2)); then
        echo "Error: --debounce-ms requires a value." >&2
        exit 1
      fi
      DEBOUNCE_MS="$2"
      shift 2
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

sync_once() {
  local out=""
  out="$(rsync "${RSYNC_ARGS[@]}" "${SRC_DIR}/" "${DEST_DIR}/")"

  if [[ -n "${out}" ]]; then
    printf '[%s] Synced changes\n' "$(date '+%Y-%m-%d %H:%M:%S')"
    printf '%s\n\n' "${out}"
  fi
}

cleanup() {
  echo
  echo "Auto sync stopped."
}

trap cleanup INT TERM

echo "Auto sync source:      ${SRC_DIR}"
echo "Auto sync destination: ${DEST_DIR}"
echo "Dry run:               ${DRY_RUN}"
echo "Delete mode:           ${DELETE_MODE}"
echo

echo "Initial sync..."
sync_once

if ((POLL_MODE == 0)) && command -v inotifywait >/dev/null 2>&1; then
  echo "Mode: inotify watch"
  echo

  last_sync_ms=0
  while IFS= read -r _; do
    now_ms="$(date +%s%3N)"

    if (( now_ms - last_sync_ms < DEBOUNCE_MS )); then
      continue
    fi

    last_sync_ms="${now_ms}"
    sync_once
  done < <(
    inotifywait -m -r \
      --event close_write,create,delete,move,attrib \
      --format '%w%f' \
      --exclude '(^|/)(\.git|\.codex|node_modules|dist|src-tauri/target)(/|$)' \
      "${SRC_DIR}"
  )
else
  if ((POLL_MODE == 0)); then
    echo "Mode: polling (inotifywait not found)"
  else
    echo "Mode: polling (forced by --poll)"
  fi
  echo "Interval: ${INTERVAL_SECONDS}s"
  echo

  while true; do
    sync_once
    sleep "${INTERVAL_SECONDS}"
  done
fi
