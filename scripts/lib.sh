#!/usr/bin/env bash
# 공용 함수. 다른 스크립트에서 source 한다.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/harness.config.sh"
# 검사용 페이지 스냅샷 (scripts/snapshot.sh가 로컬 Worker에서 받아 저장한 HTML)
SNAP="$ROOT/.harness/snapshot"
pass(){ echo "  [PASS] $*"; }
fail(){ echo "  [FAIL] $*"; }
skip(){ echo "  [SKIP] $*"; }
warn(){ echo "  [WARN] $*"; }
