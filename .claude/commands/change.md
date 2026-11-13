---
description: 요구사항 변경(기능 추가·수정·삭제·우선순위 변경)을 PRD, SEO 계획, 디자인 명세, 구조 설계, 작업 목록에 일관되게 반영한다. 인자로 변경 내용을 적는다.
---

> **이 프로젝트 적용 메모 (ischoolwiki, Cloudflare Worker + D1)**: 아래 지시 중 정적 HTML·Pages 기준 항목은 CLAUDE.md 10~13장으로 대체한다.
> - `dist/`, `dist-include.txt`, `build-dist.sh`, `verify-dist.sh`, `deploy.sh` 없음 → 공개 페이지 검사는 `bash scripts/check.sh`(15번이 로컬 Worker를 띄워 `.harness/snapshot/`에 페이지 저장), 내부 문서 비공개는 11장
> - 로컬 서버 `npx wrangler pages dev dist` → 검사는 check.sh가 직접 띄운다. 손으로 볼 때는 `npx wrangler dev`
> - 회원 기능·MEMBER_COOKIE 없음 → `scripts/access-matrix.txt`는 관리 경로(/admin/*) 401과 내부 파일 404 검사용
> - 운영 배포는 사람이 main에서 `npm run deploy`, 롤백은 사람이 `npx wrangler rollback` (Cloudflare 대시보드 Workers > 배포 목록에서도 가능). 미리보기 배포 없음
> - 자동 글을 바꾸는 작업은 `./scripts/pilot.sh` 결과를 사람이 원문과 대조한다 (10-3)

변경 요청: $ARGUMENTS

바로 구현하지 말고 아래 순서로 처리해줘.

0. docs/stage.md 모드 확인
   - "출시 준비"(범위 동결): 결함 수정이 아니면 v1에 넣을 수 없다. v1.1 대상으로 기록할지 묻는다.
   - "안정화"/"운영": /triage를 거쳤는지 확인. 새 기능이면 다음 버전(v1.x) 대상으로 처리.
1. planner(변경 모드): 영향 분석표 (변경 유형, 영향 기능·화면, 완료된 작업, 위험도, start.md 범위 충돌, 필수/있으면 좋음 판단)
2. 공개 페이지 영향 → seo(기획 모드)로 seo-plan 변경안. URL 변경 시 기존 URL 리다이렉트(_redirects) 계획 필수
3. 화면 변경 → Figma 수정 필요 여부. 필요하면 사람이 수정 후 designer(명세 모드)
4. architect: architecture.md 영향 (새 파일·라우트·D1 마이그레이션·보호 경로·dist-include·access-matrix, 회귀 위험)
5. 고위험이면 /review-pack 권장
6. 모든 변경안을 한 번에 보여주고 승인을 기다린다
7. 승인 후: PRD·seo-plan·architecture 버전 올리기, tasks.md 갱신(완료 기능이 영향 받으면 "수정 필요"), decisions.md 기록
8. 구현은 다음 /build (운영 중이면 /release) 에서 진행한다고 안내
