#!/usr/bin/env bash
# 타입 검사와 단위 테스트 (검증기·렌더러·추출기 테스트 포함)
D="$(cd "$(dirname "$0")/.." && pwd)"
source "$D/lib.sh"
cd "$ROOT"
[[ -d node_modules ]] || { skip "node_modules 없음 (npm install 필요)"; exit 2; }
npm run -s typecheck > /tmp/harness-tsc.$$ 2>&1 || { fail "타입 오류"; sed 's/^/        /' /tmp/harness-tsc.$$ | head -30; rm -f /tmp/harness-tsc.$$; exit 1; }
rm -f /tmp/harness-tsc.$$
pass "타입 검사"
out="$(npx vitest run 2>&1)"; rc=$?
echo "$out" | grep -E "Test Files|Tests " | sed 's/^/  /'
[[ $rc -eq 0 ]] || { fail "테스트 실패"; echo "$out" | grep -E "FAIL|×|AssertionError" | head -20 | sed 's/^/        /'; exit 1; }
pass "단위 테스트"
