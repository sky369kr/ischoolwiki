#!/usr/bin/env bash
# 운영 반영을 한 번에: 운영 DB에 학교 자료 넣기 → (필요하면) 배포 → 글 쓰기 반복.
# 사람만 실행한다 (CLAUDE.md 1장 7, 13장). AI가 실행하면 .claude/hooks/guard.sh 가 막는다.
#
# 사용법 (맥 터미널, ischoolwiki 폴더에서):
#   ./scripts/publish-school.sh <학교-slug> [--deploy] [--runs N]
#     <학교-slug>  seeds/<학교-slug>.sql 이 있으면 운영 DB에 넣는다. 없으면 이 단계를 건너뛴다.
#                  자료 없이 글 쓰기만 하려면 slug 대신 - 를 쓴다.
#     --deploy     코드가 바뀐 PR을 받은 뒤라면 붙인다 (npm run deploy).
#     --runs N     글 쓰기 최대 횟수 (기본 6). 그 학교에 새로 쓴 글이 없으면 일찍 멈춘다.
# 관리 비밀번호는 시작할 때 한 번 붙여 넣는다 (화면에 안 보임). 끝나면 지워진다.
set -euo pipefail
cd "$(dirname "$0")/.."

SLUG="${1:-}"
[ -n "$SLUG" ] || { sed -n '5,10p' "$0"; exit 1; }
shift
DEPLOY=0
RUNS=6
while [ $# -gt 0 ]; do
  case "$1" in
    --deploy) DEPLOY=1 ;;
    --runs) RUNS="$2"; shift ;;
    *) echo "모르는 옵션: $1" >&2; exit 1 ;;
  esac
  shift
done

SITE="$(. ./harness.config.sh && echo "$SITE_URL")"

if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "CLOUDFLARE_API_TOKEN 이 설정돼 있습니다 (다른 프로젝트 토큰일 수 있음). 지우고 진행합니다."
  unset CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
fi

echo "== 1. 최신 코드 받기"
[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || { echo "main 브랜치에서 실행하세요: git checkout main" >&2; exit 1; }
git pull --ff-only

if [ "$SLUG" != "-" ] && [ -f "seeds/$SLUG.sql" ]; then
  echo "== 2. 운영 DB에 seeds/$SLUG.sql 넣기 (확인 질문에 y)"
  npx wrangler d1 execute ischoolwiki --remote --file "seeds/$SLUG.sql"
else
  echo "== 2. 넣을 학교 자료 없음: 건너뜀"
fi

if [ "$DEPLOY" = 1 ]; then
  echo "== 3. 배포"
  npm run deploy
else
  echo "== 3. 배포 안 함 (--deploy 없음)"
fi

echo "== 4. 글 쓰기"
printf '관리 비밀번호를 붙여 넣고 Enter (화면에 안 보임): '
read -rs ADMIN_TOKEN; echo
[ "${#ADMIN_TOKEN}" -ge 32 ] || { echo "비밀번호 길이가 이상합니다 (${#ADMIN_TOKEN}자). 다시 실행하세요." >&2; exit 1; }
trap 'unset ADMIN_TOKEN' EXIT

for i in $(seq 1 "$RUNS"); do
  echo "-- 실행 $i/$RUNS (2~5분 걸릴 수 있음)"
  OUT=$(curl -sS -m 1800 -X POST -H "authorization: Bearer $ADMIN_TOKEN" "$SITE/admin/run")
  if [ "$OUT" = "Unauthorized" ]; then echo "관리 비밀번호가 틀렸습니다." >&2; exit 1; fi
  # 학교별 결과 한 줄씩. 이번 학교(또는 - 일 때 전체)에 새 글이 없으면 멈춘다.
  WROTE=$(printf '%s' "$OUT" | SLUG="$SLUG" python3 -c '
import json, os, sys
r = json.load(sys.stdin)
slug = os.environ["SLUG"]
wrote = False
for s in r.get("schools", []):
    write = next((x for x in s["steps"] if x.startswith("write:")), "")
    print("   ", s["slug"], "|", write[:160], file=sys.stderr)
    if (slug == "-" or s["slug"] == slug) and ("published" in write or "held" in write):
        wrote = True
print("yes" if wrote else "no")
')
  if [ "$WROTE" = "no" ]; then echo "새로 쓴 글 없음: 멈춤"; break; fi
done

echo "== 끝. 확인: $SITE/blog"
if [ "$SLUG" != "-" ]; then echo "   학교 페이지: $SITE/wiki/$SLUG"; fi
echo "   보류된 글이 있으면 위 결과에 held 가 보입니다. 알려 주세요."
