#!/usr/bin/env bash
# 관리 경로 보호와 내부 파일 비공개 (scripts/access-matrix.txt). 15번 스냅샷이 요청한 결과를 읽는다.
D="$(cd "$(dirname "$0")/.." && pwd)"
source "$D/lib.sh"
R="$ROOT/.harness/access.txt"
[[ -f "$R" ]] || { skip "접근 결과 없음 (bash scripts/check.sh 15 40)"; exit 2; }
[[ -s "$R" ]] || { skip "access-matrix.txt에 검사 항목 없음"; exit 2; }
sed 's/^OK /  [PASS] /; s/^BAD /  [FAIL] /' "$R"
grep -q '^BAD ' "$R" && exit 1
exit 0
