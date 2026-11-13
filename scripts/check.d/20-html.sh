#!/usr/bin/env bash
# HTML 구조 검사 (로컬 Worker 스냅샷 기준. 15번이 먼저 실행되어야 한다)
D="$(cd "$(dirname "$0")/.." && pwd)"
source "$D/lib.sh"
command -v python3 >/dev/null || { skip "python3 없음"; exit 2; }
[[ -d "$SNAP" ]] || { skip "스냅샷 없음 (bash scripts/check.sh 15 20)"; exit 2; }
python3 "$D/html_check.py" "$SNAP"
