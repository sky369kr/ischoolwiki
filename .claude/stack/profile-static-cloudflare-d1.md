# 프로필: 정적 HTML + Cloudflare Pages Functions + D1
하네스 원본의 기본 프로필. 이 프로젝트에는 쓰지 않는다 (활성: profile-cloudflare-worker-d1.md). 원본 보관용.

- 페이지: 정적 HTML/CSS/바닐라 JS, 빌드 도구 없음
- 서버: Pages Functions (`functions/`), 인증은 미들웨어
- 데이터: D1, `migrations/` 마이그레이션 파일로만 스키마 변경
- 로컬 비밀: `.dev.vars`
- 배포물: `scripts/build-dist.sh` 허용 목록 → `dist/`
- 검사 명령: `bash scripts/check.sh` (배포물 격리, HTML 구조, 링크·목차, 회원·비회원 접근, 비밀 값)
- 로컬 서버: `npx wrangler pages dev dist` (http://localhost:8788)
- 사람만: `scripts/deploy.sh production`, `wrangler d1 … --remote`
- 주의: Pages 미리보기 환경의 D1 바인딩이 운영 DB와 분리되어 있는지, Git 연동 시 출력 폴더가 dist인지
