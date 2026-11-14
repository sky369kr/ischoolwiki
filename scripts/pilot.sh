#!/usr/bin/env bash
# Local pilot: fresh local D1, both seeds, one full pipeline run, then a summary of what was
# written and why anything was held. Nothing is deployed and AUTO_PUBLISH stays "false".
# Needs ANTHROPIC_API_KEY in the environment, or ISCHOOLWIKI_ANTHROPIC_KEY (cloud sessions filter
# out ANTHROPIC_API_KEY from environment variables); without a key the run stops after news collection.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT=${PORT:-8787}
TOKEN="pilot-$(date +%s)"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-${ISCHOOLWIKI_ANTHROPIC_KEY:-}}"

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "Neither ANTHROPIC_API_KEY nor ISCHOOLWIKI_ANTHROPIC_KEY is set: collection only, no extraction or writing." >&2
fi
# .dev.vars is git-ignored; written fresh so the key never lands in the repo or the command line.
umask 077
{
  [ -n "${ANTHROPIC_API_KEY:-}" ] && printf 'ANTHROPIC_API_KEY="%s"\n' "$ANTHROPIC_API_KEY"
  printf 'ADMIN_TOKEN="%s"\n' "$TOKEN"
} > .dev.vars

rm -rf .wrangler/state
npx wrangler d1 migrations apply ischoolwiki --local > /dev/null
npx wrangler d1 execute ischoolwiki --local --file seeds/pilot.sql > /dev/null
npx wrangler d1 execute ischoolwiki --local --file seeds/bsb-shunyi-fees.sql > /dev/null
npx wrangler d1 execute ischoolwiki --local --file seeds/bst-tashkent.sql > /dev/null
npx wrangler d1 execute ischoolwiki --local --file seeds/qais.sql > /dev/null
# ONLY=<school slug> runs the pipeline for that school alone (the others are set inactive in the local DB),
# so trying a new school does not spend API calls on the rest.
if [ -n "${ONLY:-}" ]; then
  npx wrangler d1 execute ischoolwiki --local --command "UPDATE schools SET active = CASE WHEN slug = '$ONLY' THEN 1 ELSE 0 END" > /dev/null
fi

if curl -s -o /dev/null "http://127.0.0.1:$PORT/robots.txt"; then
  echo "Port $PORT is already serving something (a leftover wrangler dev?). Stop it or set PORT." >&2
  exit 1
fi
LOG=$(mktemp)
npx wrangler dev --port "$PORT" > "$LOG" 2>&1 &
DEV=$!
# kill $DEV alone stops npx but leaves wrangler and workerd running on the port.
trap 'pkill -f "wrangler dev --port $PORT" 2>/dev/null; kill $DEV 2>/dev/null; rm -f .dev.vars' EXIT
for _ in $(seq 1 60); do curl -s -o /dev/null "http://127.0.0.1:$PORT/robots.txt" && break; sleep 1; done

# RUNS=n runs the pipeline n times in a row (as an operator filling a new site would), default 1.
for run in $(seq 1 "${RUNS:-1}"); do
  echo "== pipeline run $run"
  curl -sS -m 1800 -X POST -H "authorization: Bearer $TOKEN" "http://127.0.0.1:$PORT/admin/run" | python3 -m json.tool
done

q() { npx wrangler d1 execute ischoolwiki --local --json --command "$1" 2>/dev/null | python3 -c 'import json,sys; [print(r) for r in json.load(sys.stdin)[0]["results"]]'; }

# REWRITE=<English article id> then replaces that article through POST /admin/rewrite and shows that
# its old address redirects to the replacement.
if [ -n "${REWRITE:-}" ]; then
  OLD_SLUG=$(npx wrangler d1 execute ischoolwiki --local --json --command "SELECT slug FROM articles WHERE id = ${REWRITE}" 2>/dev/null | python3 -c 'import json,sys; r=json.load(sys.stdin)[0]["results"]; print(r[0]["slug"] if r else "")')
  echo "== rewrite article $REWRITE ($OLD_SLUG)"
  curl -sS -m 1800 -X POST -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
    -d "{\"article_id\":$REWRITE,\"reason\":\"pilot rewrite check\"}" "http://127.0.0.1:$PORT/admin/rewrite" | python3 -m json.tool
  echo "== old addresses after the rewrite"
  for path in "/blog/$OLD_SLUG" "/ko/blog/$OLD_SLUG"; do
    curl -s -o /dev/null -w "%{http_code} %{redirect_url} <- $path\n" "http://127.0.0.1:$PORT$path"
  done
fi
echo "== facts by school and source"
q "SELECT school_slug, source_kind, COUNT(*) n FROM facts GROUP BY 1, 2"
echo "== articles"
q "SELECT id, school_slug, lang, status, title FROM articles ORDER BY id"
echo "== held: problems"
q "SELECT a.id, a.lang, v.problems_json FROM articles a JOIN verification_results v ON v.article_id = a.id WHERE a.status = 'held'"
echo "== revised: first problems"
q "SELECT article_id, problems_json FROM article_revisions ORDER BY id"
echo "== guide attempts"
q "SELECT school_slug, topic, article_id, outcome, detail FROM guide_attempts ORDER BY id"
