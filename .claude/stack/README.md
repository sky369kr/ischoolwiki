# 스택 프로필
CLAUDE.md 10장은 프로젝트의 실제 기술 스택과 검사 명령을 정의한다.
새 프로젝트를 시작할 때 아래 중 맞는 프로필을 CLAUDE.md 10장에 붙여 넣고 고친다.

| 파일 | 대상 |
|---|---|
| profile-cloudflare-worker-d1.md | Cloudflare Worker + D1 서버 렌더링 (ischoolwiki 활성) |
| profile-static-cloudflare-d1.md | 정적 HTML + Cloudflare Pages Functions + D1 (하네스 원본 기본, beyondthai.net) |
| profile-nextjs-vercel-supabase.md | Next.js + Vercel + Supabase |

어느 프로필이든 바뀌지 않는 원칙
- QA 기준은 "검사 명령" 하나로 정의한다 (check.sh 또는 npm run check). 에이전트는 그 명령의 결과로 판정한다.
- 배포물 격리(CLAUDE.md 11장)와 안전장치(13장)는 스택에 맞게 고쳐서 반드시 유지한다.
