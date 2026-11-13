---
description: S6 출시 준비. 완료 정의 확인 → 범위 동결 → 출시 점검표·운영 매뉴얼·자동 점검 → 게이트 D(출시 승인) → (사람 배포) → 출시 후 확인까지 진행한다.
---

> **이 프로젝트 적용 메모 (ischoolwiki, Cloudflare Worker + D1)**: 아래 지시 중 정적 HTML·Pages 기준 항목은 CLAUDE.md 10~13장으로 대체한다.
> - `dist/`, `dist-include.txt`, `build-dist.sh`, `verify-dist.sh`, `deploy.sh` 없음 → 공개 페이지 검사는 `bash scripts/check.sh`(15번이 로컬 Worker를 띄워 `.harness/snapshot/`에 페이지 저장), 내부 문서 비공개는 11장
> - 로컬 서버 `npx wrangler pages dev dist` → 검사는 check.sh가 직접 띄운다. 손으로 볼 때는 `npx wrangler dev`
> - 회원 기능·MEMBER_COOKIE 없음 → `scripts/access-matrix.txt`는 관리 경로(/admin/*) 401과 내부 파일 404 검사용
> - 운영 배포는 사람이 main에서 `npm run deploy`, 롤백은 사람이 `npx wrangler rollback` (Cloudflare 대시보드 Workers > 배포 목록에서도 가능). 미리보기 배포 없음
> - 자동 글을 바꾸는 작업은 `./scripts/pilot.sh` 결과를 사람이 원문과 대조한다 (10-3)

1. docs/stage.md 모드 확인
   - "개발": release(출시 점검 모드) 1단계로 완료 정의를 확인한다.
     - 미충족: 남은 필수 기능·결함 표를 보여주고 "/build로 남은 항목만 처리하세요"라고 안내하고 멈춘다.
     - 충족: 범위 동결을 제안한다. 승인되면 모드 "출시 준비", 범위 동결일 기록, tasks.md의 "필수"가 아닌 미완료 항목을 backlog.md로 옮긴다(대상 버전 v1.1). decisions.md 기록.
   - "출시 준비": 2번부터.
2. release(출시 점검 모드): release-checklist.md, runbook.md 작성과 자동 점검
   - 로컬 서버를 켜고 `bash scripts/check.sh` 전체. 회원 측 접근 검사(MEMBER_COOKIE)는 나와 함께 확인
   - 미리보기 배포가 가능하면(정책 A, PAGES_PROJECT 설정됨) `bash scripts/deploy.sh preview` 후 미리보기 주소로 `bash scripts/verify-live.sh <주소>`
3. 자동 점검 FAIL → tasks.md "출시 차단"으로 developer → qa (최대 3회). 해결 후 해당 항목만 재점검.
4. 자동 항목 모두 PASS → ◆게이트 D: 사람 확인 항목, 운영 D1 원격 마이그레이션 명령, 배포 절차, 롤백 절차를 보여주고 출시 승인을 기다린다.
5. 승인되면 사람이 할 일을 순서대로 정리해 준다 (원격 마이그레이션 → 운영 배포 또는 main 병합 → "배포 완료"라고 알려주기). 나는 운영 배포·원격 DB 명령을 실행하지 않는다.
6. 사람이 "배포 완료"를 알리면 release(출시 후 확인 모드). 이상 없으면:
   - stage.md: 모드 "안정화", 출시일, 안정화 종료 예정일(STABILIZE_DAYS 후), 버전 v1.0.0
   - decisions.md 출시 기록
   - Search Console·네이버 서치어드바이저 제출 안내, aeo-prompts.md 첫 측정 안내
