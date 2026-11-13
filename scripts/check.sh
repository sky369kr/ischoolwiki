#!/usr/bin/env bash
# 전체 검사 (QA 기준 명령). scripts/check.d/ 의 스크립트를 번호 순서로 실행한다.
# 각 스크립트 종료 코드: 0 PASS, 1 FAIL, 2 SKIP(미확인)
# 사용: bash scripts/check.sh            (전체)
#       bash scripts/check.sh 30 40      (번호로 일부만)
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
declare -a results
fails=0; skips=0
for s in "$DIR"/check.d/*.sh; do
  name="$(basename "$s" .sh)"
  if [[ $# -gt 0 ]]; then
    want=0; for a in "$@"; do [[ "$name" == "$a"* ]] && want=1; done
    [[ $want -eq 1 ]] || continue
  fi
  echo; echo "━━ $name ━━"
  bash "$s"; rc=$?
  case $rc in
    0) results+=("PASS  $name") ;;
    2) results+=("SKIP  $name"); skips=$((skips+1)) ;;
    *) results+=("FAIL  $name"); fails=$((fails+1)) ;;
  esac
done
echo; echo "════ 검사 요약 ════"
printf '%s\n' "${results[@]}"
if [[ $fails -gt 0 ]]; then echo "결과: FAIL ($fails건)"; exit 1; fi
if [[ $skips -gt 0 ]]; then echo "결과: 미확인 있음 (SKIP $skips건) — PASS 아님"; exit 2; fi
echo "결과: PASS"; exit 0
