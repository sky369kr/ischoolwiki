#!/usr/bin/env bash
# 로컬 Worker를 띄워 공개 페이지를 .harness/snapshot/ 에 저장한다. 20·30·40번 검사가 이 결과를 쓴다.
bash "$(cd "$(dirname "$0")/.." && pwd)/snapshot.sh"
