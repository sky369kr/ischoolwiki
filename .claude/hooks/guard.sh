#!/usr/bin/env bash
# 안전장치: Claude Code가 Bash 명령을 실행하기 전에 검사한다 (PreToolUse 훅).
# 종료 코드 2 = 실행 차단 (stderr 메시지가 Claude에게 전달됨), 0 = 허용
# 규칙 설명: CLAUDE.md 13장. 설정 값: harness.config.sh

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PROD_BRANCH="main"; PROTECTED_BRANCHES="main"; PUSH_POLICY="A"
[[ -f "$ROOT/harness.config.sh" ]] && source "$ROOT/harness.config.sh"

input="$(cat)"
if command -v python3 >/dev/null 2>&1; then
  cmd="$(printf '%s' "$input" | python3 -c 'import sys,json
try: print(json.load(sys.stdin).get("tool_input",{}).get("command",""))
except Exception: print("")' 2>/dev/null)"
fi
[[ -z "${cmd:-}" ]] && cmd="$input"
# 여러 줄 명령을 한 줄로
c="$(printf '%s' "$cmd" | tr '\n' ' ')"

block(){
  echo "[하네스 안전장치] 차단: $1" >&2
  echo "이 작업은 사람이 직접 실행해야 합니다. 우회하지 말고, 사람에게 정확한 명령과 이유를 보고하세요. (CLAUDE.md 13장)" >&2
  exit 2
}
has(){ printf '%s' "$c" | grep -Eq -e "$1"; }

# 1) 원격 D1
if has 'wrangler[^;&|]*d1[^;&|]*(execute|migrations[[:space:]]+apply)' && has '--remote'; then
  block "원격 D1 실행·마이그레이션 (--remote)"
fi
if has 'wrangler[^;&|]*d1[[:space:]]+delete'; then block "D1 데이터베이스 삭제"; fi

# 2) Pages 배포
if has 'wrangler[^;&|]*pages[[:space:]]+deploy'; then
  for b in $PROD_BRANCH $PROTECTED_BRANCHES; do
    if has "--branch[= ]+['\"]?$b(['\" ]|$)"; then block "운영·보호 브랜치($b)로 Pages 배포"; fi
  done
  if ! has '--branch'; then block "브랜치를 지정하지 않은 Pages 배포 (운영으로 배포될 수 있음). scripts/deploy.sh preview 를 사용하세요"; fi
fi
if has 'deploy\.sh[[:space:]]+production'; then block "운영 배포 스크립트"; fi
if has 'wrangler[^;&|]*pages[[:space:]]+project[[:space:]]+delete'; then block "Pages 프로젝트 삭제"; fi
if has 'wrangler[^;&|]*(pages[[:space:]]+)?secret[[:space:]]+(put|delete|bulk)'; then block "운영 비밀 값 변경"; fi

# 2-1) Worker 배포·운영 변경 (이 프로젝트는 Pages가 아니라 Worker. CLAUDE.md 10장)
#      --dry-run 은 아무것도 올리지 않으므로 허용
if has '(^|[;&| ])(npx[[:space:]]+)?wrangler([[:space:]]+[^;&|[:space:]]+)*[[:space:]]+(deploy|publish)([[:space:]]|$|;|&|\|)' && ! has '--dry-run'; then
  block "Worker 운영 배포 (wrangler deploy)"
fi
if has 'wrangler[^;&|]*versions[[:space:]]+deploy|wrangler[^;&|]*rollback|wrangler[^;&|]*triggers[[:space:]]+deploy'; then
  block "Worker 버전 배포·롤백·트리거 변경"
fi
if has '(^|[;&| ])(npx[[:space:]]+)?wrangler[[:space:]]+delete'; then block "Worker 삭제"; fi
if has 'npm[[:space:]]+run[[:space:]]+(deploy|db:migrate:remote)([[:space:]]|$|;|&)'; then
  block "운영 배포·원격 마이그레이션 npm 스크립트"
fi
if has 'publish-school\.sh'; then
  block "운영 반영 스크립트 (운영 DB에 학교 자료, 배포, 운영 글 쓰기). 사람이 맥에서 실행"
fi

# 3) Git
cur="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
is_protected(){ for b in $PROTECTED_BRANCHES $PROD_BRANCH; do [[ "$1" == "$b" ]] && return 0; done; return 1; }

if has '(^|[;&| ])git[[:space:]]+push'; then
  if [[ "$PUSH_POLICY" == "B" ]]; then block "정책 B: 모든 git push는 사람 승인 후"; fi
  if has 'push[^;&|]*(--force|[[:space:]]-f([[:space:]]|$)|--force-with-lease|--mirror|--all|--delete|[[:space:]]-d[[:space:]]|[[:space:]]:[^ ]+)'; then
    block "강제 push / 전체 push / 원격 브랜치 삭제"
  fi
  for b in $PROTECTED_BRANCHES $PROD_BRANCH; do
    if has "push[^;&|]*([[:space:]]|:)$b([[:space:]]|$|;|&)"; then block "보호 브랜치($b)로 push"; fi
  done
  if is_protected "$cur" && ! has 'push[^;&|]*[[:space:]](origin|upstream)[[:space:]]+[^-]'; then
    block "현재 보호 브랜치($cur)에서 대상 미지정 push"
  fi
fi
if is_protected "$cur"; then
  if has '(^|[;&| ])git[[:space:]]+(commit|merge|rebase|cherry-pick|revert|reset[[:space:]]+--hard)'; then
    block "보호 브랜치($cur)에서 직접 커밋·병합. 작업 브랜치를 만들어 진행하세요 (git switch -c work/...)"
  fi
fi
if has 'git[[:space:]]+(checkout|switch)[^;&|]*(main|production)' && has '&&[[:space:]]*git[[:space:]]+(merge|commit)'; then
  block "보호 브랜치로 전환 후 병합·커밋"
fi

# 4) 위험한 삭제
if has 'rm[[:space:]]+-[a-zA-Z]*r[a-zA-Z]*f|rm[[:space:]]+-[a-zA-Z]*f[a-zA-Z]*r'; then
  if has 'rm[^;&|]*[[:space:]](/|~|\.|\./|\*|\.git|\$HOME)([[:space:]]|$|/\*)' ; then
    block "프로젝트 최상단·홈·.git 등을 지우는 rm -rf"
  fi
fi

# 5) 비밀 파일 출력
if has '(cat|less|more|head|tail|bat|type|cp|scp|curl[^;&|]*-F)[^;&|]*\.(dev\.vars|env)([[:space:]]|$|\.local|\.production)'; then
  block "비밀 파일(.dev.vars, .env) 읽기·복사"
fi

exit 0
