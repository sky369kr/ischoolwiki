#!/usr/bin/env bash
# 배포된 사이트에서 내부 문서 경로가 열리지 않는지 확인한다.
# 사용: bash scripts/verify-live.sh [주소]   (기본: SITE_URL. 미리보기 주소도 가능)
# 종료 코드: 0 PASS, 1 FAIL(노출), 2 미확인(접속 실패)
set -uo pipefail
source "$(dirname "$0")/lib.sh"
BASE="${1:-$SITE_URL}"; BASE="${BASE%/}"
echo "▶ 운영 노출 검사: $BASE"

paths=( /CLAUDE.md /README.md /start.md /HANDOVER.md /docs/PRD.md /docs/tasks.md /docs/log.md \
        /docs/architecture.md /.claude/settings.json /.claude/agents/planner.md /harness.config.sh \
        /scripts/pilot.sh /wrangler.toml /migrations/0001_init.sql /seeds/pilot.sql /.dev.vars /.env /.git/config /package.json )
markers='VERDICT|하네스|name: planner|PROTECTED_BRANCHES|\[core\]|# PRD|d1_databases|"dependencies"|permissions'
tmp="$(mktemp)"
bad=0
for p in "${paths[@]}"; do
  code=$(curl -s -o "$tmp" -w "%{http_code}" --max-time 15 "$BASE$p" || true)
  [[ -z "$code" ]] && code="000"
  if [[ "$code" == "200" ]]; then
    if grep -Eq "$markers" "$tmp"; then
      fail "$p → 200, 내부 내용 노출"; bad=1
    else
      warn "$p → 200 (내부 문서 내용은 아님. 404.html이 없어 기본 페이지로 폴백된 것으로 보임)"
    fi
  elif [[ "$code" == "000" ]]; then
    skip "$p → 접속 실패"; [[ $bad -eq 0 ]] && bad=2
  else
    pass "$p → $code"
  fi
done
rm -f "$tmp"
if [[ $bad -eq 0 ]]; then echo "✔ PASS"; exit 0; fi
if [[ $bad -eq 1 ]]; then echo "✘ FAIL — P0: 내부 문서 노출. 즉시 사람에게 보고"; exit 1; fi
echo "… 일부 미확인 (접속 실패)"; exit 2
