# 결정 기록
(형식: CLAUDE.md 14장)

## 2026-11-12 · 주 독자와 언어
- 결정: 주 독자는 전 세계 영어권 부모, 목표는 검색·AI 답변 노출. 영어 기본, 한국어는 자동 번역. 화면은 위키식 참고 자료 톤을 유지하되 학교 카드·요약표로 정보를 앞에 둔다. / 이유: 사용자 결정 / 영향: src/index.ts, src/render.ts, src/summary.ts

## 2026-11-12 · 자동 게시
- 결정: `AUTO_PUBLISH = "false"` 유지. 첫 자동 실행 뒤 대기 글을 사람이 읽고 켤지 결정. 도메인 연결도 그 뒤. / 이유: 파일럿 표본이 학교 2곳·글 2건 / 영향: wrangler.toml

## 2026-11-13 · 하네스 v4 적용 방식
- 결정: 하네스 v4를 설치하되 기본 프로필(정적 HTML + Pages)을 이 프로젝트의 Cloudflare Worker + D1 구조로 바꿔 적용. / 이유: Worker가 코드의 라우트만 응답하므로 dist/ 허용 목록 방식이 필요 없고, 원본 안전장치는 Pages 배포만 막아 Worker 배포(`wrangler deploy`)를 막지 못함 / 영향: CLAUDE.md 10~13장, harness.config.sh, .claude/hooks/guard.sh, .claude/settings.json, scripts/check.d/, scripts/snapshot.sh, scripts/crawl.py, scripts/access-matrix.txt, 에이전트·명령 문서 머리의 적용 메모
- 결정: push 정책 A, 보호 브랜치 main. 에이전트는 작업 브랜치에만 커밋·push하고, main 병합과 운영 배포는 사람이 한다. / 이유: 하네스 기본값, Git 연동 배포가 없어 작업 브랜치 push가 공개로 이어지지 않음 / 영향: 지금까지처럼 AI가 main에 직접 합치지 않음
- 결정: `.dev.vars.example`은 만들지 않음 (하네스의 비밀 파일 차단 규칙 `.dev.vars.*`에 걸림). 비밀 값 이름은 CLAUDE.md 10-1에 적음.
- 결정: 하네스 원본 중 Pages 전용 파일(build-dist.sh, verify-dist.sh, dist-include.txt, deploy.sh, check.d/10-dist.sh)은 가져오지 않음. 원본은 docs/harness/README.md와 .claude/stack/profile-static-cloudflare-d1.md로 참고만.
