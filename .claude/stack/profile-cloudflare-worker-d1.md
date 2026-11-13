# 프로필: Cloudflare Worker + D1 (서버 렌더링) — ischoolwiki 활성 프로필
CLAUDE.md 10~13장에 적용되어 있다. 요약:

- 페이지: Worker(`src/index.ts`)가 요청마다 HTML을 만든다. 정적 파일·빌드 폴더 없음
- 데이터: D1, `migrations/` 마이그레이션 파일로만 스키마 변경
- 비밀 값: 운영 `wrangler secret`, 로컬 `.dev.vars` (파일럿 스크립트가 만들고 지움)
- 배포물 격리: Worker는 코드의 라우트만 응답한다. `[assets]`·`[site]`를 쓰지 않는 한 내부 파일이 열리지 않는다
- 검사 명령: `bash scripts/check.sh` (코드 → 로컬 Worker 스냅샷 → HTML 구조 → 링크 → 관리 경로·내부 파일 접근 → 비밀 값)
- 로컬 서버: `npx wrangler dev` (검사는 check.sh 15번이 별도 포트·별도 로컬 DB로 띄운다)
- 사람만: `npm run deploy`, `npm run db:migrate:remote`, `wrangler d1 … --remote`, `wrangler secret …`, `wrangler rollback`
- 주의: 안전장치 원본은 `wrangler pages deploy`만 막는다. Worker에서는 `wrangler deploy`·`npm run deploy` 차단이 꼭 필요하다
