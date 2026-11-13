#!/usr/bin/env bash
# 비밀 값 검사: 배포될 Worker 번들(wrangler deploy --dry-run, 아무것도 올리지 않음)과 저장소에 올라간 파일
D="$(cd "$(dirname "$0")/.." && pwd)"
source "$D/lib.sh"
cd "$ROOT"
pattern='(sk-ant-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]+|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]+|AIza[0-9A-Za-z_-]{35}|gh[pousr]_[A-Za-z0-9]{30,})'
B="$ROOT/.harness/bundle"; rm -rf "$B"; mkdir -p "$B"
npx wrangler deploy --dry-run --outdir "$B" > "$ROOT/.harness/bundle.log" 2>&1 || { skip "번들 만들기 실패 (.harness/bundle.log)"; exit 2; }
hits=$(grep -rEnIo "$pattern" "$B" 2>/dev/null | head -10)
[[ -z "$hits" ]] || { fail "배포 번들에 비밀 값으로 보이는 문자열:"; echo "$hits" | cut -c1-120 | sed 's/^/        /'; exit 1; }
pass "배포 번들에 비밀 값 패턴 없음"
hits=$(git ls-files -z | xargs -0 grep -EnIo "$pattern" 2>/dev/null | head -10)
[[ -z "$hits" ]] || { fail "저장소 파일에 비밀 값으로 보이는 문자열:"; echo "$hits" | cut -c1-120 | sed 's/^/        /'; exit 1; }
pass "저장소 파일에 비밀 값 패턴 없음"
tracked=$(git ls-files | grep -E '(^|/)\.dev\.vars$|(^|/)\.env($|\.)' | grep -v example)
[[ -z "$tracked" ]] || { fail "비밀 파일이 저장소에 올라가 있음: $tracked"; exit 1; }
pass "비밀 파일이 저장소에 없음"
