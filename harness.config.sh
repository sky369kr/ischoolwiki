# 하네스 프로젝트 설정 (프로젝트마다 수정)
# 스크립트와 안전장치(.claude/hooks/guard.sh)가 이 파일을 읽는다.
# 이 프로젝트는 Cloudflare Worker 하나가 모든 페이지를 코드로 만든다 (CLAUDE.md 10장).

# 사이트 운영 주소 (끝에 / 없이). 2026-11-13 도메인 연결, workers.dev는 꺼짐
SITE_URL="https://ischoolwiki.com"

# Worker 이름 (wrangler.toml의 name)과 D1 데이터베이스 이름
WORKER_NAME="ischoolwiki"
D1_NAME="ischoolwiki"

# 운영 브랜치: 배포는 사람이 main에서 `npm run deploy`로 한다 (Git 연동 배포 없음)
PROD_BRANCH="main"

# 직접 커밋·push·병합을 막을 보호 브랜치 (공백으로 구분)
PROTECTED_BRANCHES="main"

# push 정책: A = 작업 브랜치 push 허용, 보호 브랜치만 차단 / B = 모든 push 차단
PUSH_POLICY="A"

# 검사용 로컬 서버 포트 (scripts/snapshot.sh). 파일럿(8787)과 겹치지 않게
CHECK_PORT=8799

# 운영 안정화 기간(일), 정기 릴리스 주기(일), 릴리스당 최대 항목 수
STABILIZE_DAYS=14
RELEASE_CYCLE_DAYS=14
RELEASE_MAX_ITEMS=5
