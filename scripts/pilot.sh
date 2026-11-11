#!/usr/bin/env bash
# Local pilot: fresh local D1, both seeds, one full pipeline run, then a summary of what was
# written and why anything was held. Nothing is deployed and AUTO_PUBLISH stays "false".
# Needs ANTHROPIC_API_KEY in the environment (cloud environment secret or your shell);
# without it the run stops after news collection.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT=${PORT:-8787}
TOKEN="pilot-$(date +%s)"

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ANTHROPIC_API_KEY is not set: collection only, no extraction or writing." >&2
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

LOG=$(mktemp)
npx wrangler dev --port "$PORT" > "$LOG" 2>&1 &
DEV=$!
trap 'kill $DEV 2>/dev/null; rm -f .dev.vars' EXIT
for _ in $(seq 1 60); do curl -s -o /dev/null "http://127.0.0.1:$PORT/robots.txt" && break; sleep 1; done

echo "== pipeline run"
curl -sS -m 1800 -X POST -H "authorization: Bearer $TOKEN" "http://127.0.0.1:$PORT/admin/run" | python3 -m json.tool

q() { npx wrangler d1 execute ischoolwiki --local --json --command "$1" 2>/dev/null | python3 -c 'import json,sys; [print(r) for r in json.load(sys.stdin)[0]["results"]]'; }
echo "== facts by school and source"
q "SELECT school_slug, source_kind, COUNT(*) n FROM facts GROUP BY 1, 2"
echo "== articles"
q "SELECT id, school_slug, lang, status, title FROM articles ORDER BY id"
echo "== held: problems"
q "SELECT a.id, a.lang, v.problems_json FROM articles a JOIN verification_results v ON v.article_id = a.id WHERE a.status = 'held'"
