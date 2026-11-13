#!/usr/bin/env bash
# 안전장치(.claude/hooks/guard.sh)가 scripts/guard-cases.txt의 명령을 기대대로 막거나 허용하는지 확인한다.
# 명령은 실행하지 않는다. 브랜치 관련 판정은 현재 브랜치 기준이라 작업 브랜치에서 실행한다.
# 종료 코드 0 PASS, 1 FAIL
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CLAUDE_PROJECT_DIR="$ROOT"
bad=0
while IFS=$'\t' read -r want cmd; do
  [[ -z "$want" || "$want" == \#* ]] && continue
  printf '%s' "$cmd" | python3 -c 'import json,sys; print(json.dumps({"tool_input":{"command":sys.stdin.read()}}))' \
    | bash "$ROOT/.claude/hooks/guard.sh" >/dev/null 2>&1
  rc=$?
  got=$([[ $rc -eq 2 ]] && echo BLOCK || echo ALLOW)
  if [[ "$got" == "$want" ]]; then echo "  [PASS] $got  $cmd"; else echo "  [FAIL] 기대 $want, 실제 $got  $cmd"; bad=1; fi
done < "$ROOT/scripts/guard-cases.txt"
exit $bad
