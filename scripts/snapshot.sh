#!/usr/bin/env bash
# 검사용 스냅샷: 별도 로컬 D1(.harness/d1)에 마이그레이션·시드·검사용 글을 넣고, 로컬 Worker를 띄워
# 링크를 따라가며 페이지를 .harness/snapshot/ 에 저장한다. 운영 D1·파일럿 로컬 DB는 건드리지 않는다.
# 종료 코드: 0 PASS, 1 FAIL(열리지 않는 페이지), 2 SKIP(서버를 띄우지 못함)
set -uo pipefail
source "$(dirname "$0")/lib.sh"
cd "$ROOT"
H="$ROOT/.harness"; P="$H/d1"
rm -rf "$H"; mkdir -p "$SNAP"

if curl -s -o /dev/null --noproxy '*' "http://127.0.0.1:$CHECK_PORT/"; then
  skip "포트 $CHECK_PORT 를 이미 무언가가 쓰고 있음 (harness.config.sh의 CHECK_PORT)"; exit 2
fi
npx wrangler d1 migrations apply "$D1_NAME" --local --persist-to "$P" > "$H/setup.log" 2>&1 || { fail "로컬 마이그레이션 실패 ($H/setup.log)"; exit 1; }
for f in seeds/pilot.sql seeds/bsb-shunyi-fees.sql scripts/fixtures/*.sql; do
  npx wrangler d1 execute "$D1_NAME" --local --persist-to "$P" --file "$f" >> "$H/setup.log" 2>&1 || { fail "시드 실패: $f ($H/setup.log)"; exit 1; }
done

npx wrangler dev --port "$CHECK_PORT" --persist-to "$P" > "$H/dev.log" 2>&1 &
DEV=$!
trap 'pkill -f "wrangler dev --port $CHECK_PORT" 2>/dev/null; kill $DEV 2>/dev/null' EXIT
up=0
for _ in $(seq 1 60); do
  curl -s -o /dev/null --noproxy '*' "http://127.0.0.1:$CHECK_PORT/robots.txt" && { up=1; break; }
  sleep 1
done
[[ $up -eq 1 ]] || { skip "로컬 Worker가 뜨지 않음 ($H/dev.log)"; exit 2; }

python3 "$ROOT/scripts/crawl.py" "http://127.0.0.1:$CHECK_PORT" "$SNAP" "$ROOT/scripts/access-matrix.txt" "$H/access.txt"
