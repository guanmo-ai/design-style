#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
exec bash "$REPO_ROOT/drafts/art-nouveau/film/make.sh"
