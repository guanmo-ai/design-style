#!/usr/bin/env bash
set -euo pipefail
PLUSH_REPO_ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
exec bash "$PLUSH_REPO_ROOT/drafts/plush/film/make.sh"
