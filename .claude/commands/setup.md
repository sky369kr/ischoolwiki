---
description: 하네스를 프로젝트에 처음 설치한 직후 한 번 실행한다. 설정 값, 배포물 격리, 안전장치, push 정책, 현재 운영 사이트의 내부 문서 노출 여부를 점검하고 사람이 해야 할 설정을 알려준다. 코드나 사이트 파일은 고치지 않는다.
---

> **이 프로젝트 적용 메모 (ischoolwiki, Cloudflare Worker + D1)**: 아래 지시 중 정적 HTML·Pages 기준 항목은 CLAUDE.md 10~13장으로 대체한다.
> - `dist/`, `dist-include.txt`, `build-dist.sh`, `verify-dist.sh`, `deploy.sh` 없음 → 공개 페이지 검사는 `bash scripts/check.sh`(15번이 로컬 Worker를 띄워 `.harness/snapshot/`에 페이지 저장), 내부 문서 비공개는 11장
> - 로컬 서버 `npx wrangler pages dev dist` → 검사는 check.sh가 직접 띄운다. 손으로 볼 때는 `npx wrangler dev`
> - 회원 기능·MEMBER_COOKIE 없음 → `scripts/access-matrix.txt`는 관리 경로(/admin/*) 401과 내부 파일 404 검사용
> - 운영 배포는 사람이 main에서 `npm run deploy`, 롤백은 사람이 `npx wrangler rollback` (Cloudflare 대시보드 Workers > 배포 목록에서도 가능). 미리보기 배포 없음
> - 자동 글을 바꾸는 작업은 `./scripts/pilot.sh` 결과를 사람이 원문과 대조한다 (10-3)

CLAUDE.md를 읽고 아래를 순서대로 점검해 표로 보고해줘. 사이트 파일·코드는 수정하지 말 것. (dist-include.txt, access-matrix.txt, .gitignore 같은 하네스 설정 파일 수정은 내 승인 후에)

1. **현재 운영 사이트 노출 확인 (가장 먼저)**
   - `bash scripts/verify-live.sh` (harness.config.sh의 SITE_URL)
   - FAIL이면 맨 위에 "P0: 내부 문서가 지금 공개되어 있음"으로 보고하고, 즉시 할 일(배포 설정 변경, 노출 파일 확인, 검색엔진 삭제 요청 여부)을 정리해줘.
2. **설정 값**: harness.config.sh의 SITE_URL, PAGES_PROJECT, PROD_BRANCH, PROTECTED_BRANCHES, PUSH_POLICY가 채워져 있는지. 비어 있으면 무엇을 어디서 확인해 넣어야 하는지.
3. **배포물 격리**
   - 저장소의 실제 사이트 구조(HTML이 있는 폴더, 정적 자원 폴더, _headers 등)를 보고 scripts/dist-include.txt 수정안을 만든다.
   - 승인되면 반영하고 `bash scripts/check.sh 10` 으로 확인한다.
   - 사이트 원본 폴더 안에 있는 .md 등 내부 문서를 찾아 목록으로 (예: HANDOVER.md). docs/로 옮길지 제안.
4. **배포 방식 확인**: Cloudflare Pages가 Git 연동인지 직접 업로드인지 나에게 묻고, Git 연동이면 대시보드에서 바꿔야 할 값(빌드 명령 `bash scripts/build-dist.sh && bash scripts/verify-dist.sh`, 출력 폴더 `dist`)을 안내한다.
5. **push 정책**: 클라우드 세션의 자동 push 규칙이 있는지 나에게 확인한다.
   - 정책 A(기본): 4번 Git 연동 설정이 끝나기 전에는 작업 브랜치 push가 미리보기 배포를 만들어 문서가 공개될 수 있음을 경고한다.
   - 정책 B를 원하면 harness.config.sh를 B로 바꾸고, 세션 자동 push 규칙을 꺼야 한다고 안내한다.
6. **안전장치 동작 확인**: `.claude/hooks/guard.sh`에 테스트 입력을 넣어 다음이 차단(종료 코드 2)되는지 확인하고 표로 보여준다. 실제 명령은 실행하지 않는다.
   - `npx wrangler d1 execute DB --remote --command "select 1"`
   - `npx wrangler pages deploy dist --branch=<PROD_BRANCH>`
   - `bash scripts/deploy.sh production`
   - `git push origin main`
   테스트 방법: `printf '{"tool_input":{"command":"<명령>"}}' | bash .claude/hooks/guard.sh; echo $?`
7. **.gitignore**: .dev.vars, .env*, dist/, .wrangler/ 포함 여부. 이미 커밋된 비밀 파일이 있으면 P0로 보고 (git 기록 정리와 키 교체 필요).
8. **검사 명령**: `bash scripts/check.sh` 실행 결과. 기존에 쓰던 검사 스크립트가 있으면 check.d/에 연결하는 방법을 제안.
9. **회원 접근 검사 준비**: scripts/access-matrix.txt에 넣을 회원 전용 경로 후보를 functions/와 사이트 구조에서 찾아 제안. MEMBER_COOKIE 설정 방법 안내.
10. **다음 단계**: 기존 코드가 있으면 `/adopt`, 새로 시작이면 start.md 작성 후 `/build`.

마지막에 "사람이 할 일" 체크리스트를 따로 정리해줘.
