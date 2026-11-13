# 프로필: Next.js + Vercel + Supabase
이 스택 프로젝트에서는 아래 내용으로 CLAUDE.md 10장을 교체하고, 11장·13장도 맞게 고친다.

## 10-1. 구성
| 영역 | 사용 |
|---|---|
| 프레임워크 | Next.js (App Router), TypeScript |
| 스타일 | Tailwind CSS (디자인 토큰을 tailwind 설정과 CSS 변수로 등록) |
| 데이터·인증 | Supabase (RLS 필수) |
| 로컬 비밀 | `.env.local` |
| 배포 | Vercel |

## 10-2. 명령
| 목적 | 명령 | 누가 |
|---|---|---|
| 전체 검사 (QA 기준) | `npm run check` (= `next build && eslint . && tsc --noEmit && playwright test`) | 누구나 |
| 로컬 서버 | `npm run dev` | 누구나 |
| 로컬 DB | `supabase start`, `supabase db reset` | developer |
| 미리보기 배포 | 작업 브랜치 push 시 Vercel 자동 | 12장 정책 |
| 운영 배포 | main 병합 또는 `vercel --prod` | 사람만 |
| 원격 DB 마이그레이션 | `supabase db push` | 사람만 |

## 10-4. 스택 규칙
- 공개 페이지는 SSG 또는 SSR. 클라이언트 렌더링만으로 본문을 그리는 공개 페이지 금지.
- 로그인 필요 페이지는 noindex, sitemap 제외, 서버에서 세션 확인.
- 데이터 접근은 lib/data/ 함수로만. 모든 테이블 RLS 정책.

## 11장 대체 (배포물 격리)
- Next.js는 저장소 파일을 그대로 공개하지 않지만 `public/`은 그대로 공개된다. public/에 .md·내부 문서를 두지 않는다.
- check에 "public/에 금지 파일 없음" 검사를 넣는다.

## 13장 대체 (guard.sh 차단 대상)
- `vercel --prod`, `vercel deploy --prod`
- `supabase db push`, `supabase db reset --linked`, `supabase projects delete`
- git 규칙은 동일
