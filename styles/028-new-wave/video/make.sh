#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
exec bash "$REPO_ROOT/drafts/new-wave/film/make.sh"
