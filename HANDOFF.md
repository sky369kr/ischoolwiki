# 인수인계 문서 (HANDOFF)

작성일: 2026-11-15 · 이 문서만 읽고 바로 작업을 이어갈 수 있게 쓴 요약이다. 규칙의 원본은 `CLAUDE.md`이고, 둘이 다르면 `CLAUDE.md`가 우선한다.

## 1. 프로젝트 개요

- **ischoolwiki.com**: 국제학교 위키 + 도시별 학교 비교 + AI 자동 블로그. 주 독자는 전 세계 영어권 학부모이고, 한국어 번역판도 낸다.
- 학교가 공개한 자료(소식 페이지, 학비 문서, myispp.com 데이터)에서 출처가 있는 사실만 모아 AI가 글을 쓰고, 검증을 통과한 글만 자동 게시한다.
- 운영사 36.9° AI Visibility(369degree.net)의 고객 학교가 검색엔진과 AI 답변에 정확하게 노출되도록 하는 것이 사업 목적이다. 고객 학교 페이지에는 유료 관계를 표시한다.

## 2. 기술 스택

| 영역 | 내용 |
| --- | --- |
| 언어 | TypeScript (`typescript` 7.0.2), ES 모듈 (`"type": "module"`) |
| 런타임 | Cloudflare Workers (`compatibility_date = "2026-10-01"`, `nodejs_compat`). 로컬 도구는 Node 22.23.4 |
| 프레임워크 | 없음. Worker 하나가 라우트별로 HTML을 서버에서 만든다 (`src/index.ts`, `src/render.ts`). 외부 JS·CDN 없음 |
| 주요 라이브러리 | `@anthropic-ai/sdk` 1.8.0, `zod` 4.6.7 |
| 개발 도구 | `wrangler` 4.160.0, `vitest` 5.1.0, `@cloudflare/workers-types` 5.20261110.1 |
| 패키지 매니저 | npm 10.9.9 (`package-lock.json`) |
| 데이터베이스 | Cloudflare D1 (바인딩 `DB`, 이름 `ischoolwiki`). 스키마는 `migrations/0001`~`0007` |
| 외부 API | Anthropic API: 사실 추출, 글 작성, 근거 검사, 번역. 모델은 `src/generate.ts`의 `MODEL = "claude-opus-5-5"`, 서버 측 `fallbacks: "default"` 사용. 그 밖에 myispp.com의 `https://myispp.com/data/master.json`(읽기 전용) |
| 스케줄 | Cron `17 1 * * *` (매일 01:17 UTC 파이프라인 실행) |
| 호스팅 | Cloudflare Workers, 사용자 지정 도메인 `ischoolwiki.com` (www는 apex로 301). workers.dev 주소는 꺼짐 |
| 비밀 값 | 운영은 `wrangler secret`(`ANTHROPIC_API_KEY`, `ADMIN_TOKEN`, `ALERT_WEBHOOK_URL`), 로컬은 `.dev.vars`. 클라우드 세션은 `ANTHROPIC_API_KEY`가 걸러지므로 `ISCHOOLWIKI_ANTHROPIC_KEY` 환경 변수를 쓴다 |
| 설정 값 (`wrangler.toml [vars]`) | `SITE_URL`, `SITE_NAME`, `MAX_POSTS_PER_SCHOOL_PER_MONTH = "12"`, `AUTO_PUBLISH = "true"` (사람만 바꾼다) |

AI 인용 측정 도구(`tools/ai-measure/`)는 별도로 OpenAI, Gemini, Perplexity, Anthropic, xAI API를 호출한다. 인증 방식은 아래 3장의 해당 항목 참고.

## 3. 프로젝트 구조

```
ischoolwiki/
├── CLAUDE.md                  하네스 규칙 v4. 모든 에이전트가 따르는 원본 규칙 (세션 시작 시 반드시 읽기)
├── start.md                   사람이 쓰는 유일한 기획 입력 파일 (v1 필수 기능 5개 승인 기록)
├── HANDOFF.md                 이 문서
├── README.md                  라우트, 파이프라인 단계, 로컬 실행 방법 (한국어)
├── harness.config.sh          사이트 주소, Worker·D1 이름, 보호 브랜치, push 정책(A)
├── wrangler.toml              Worker 설정: 도메인 라우트, D1 바인딩, Cron, [vars]
├── package.json               스크립트: dev, deploy, typecheck, test, db:migrate:local/remote
├── tsconfig.json              src, test만 타입 검사 (tools/는 포함 안 됨)
├── src/                       Worker 코드 (전부 600줄 미만)
│   ├── index.ts      (401줄)  진입점. fetch(라우트)와 scheduled(Cron) 처리
│   ├── pipeline.ts   (467줄)  자동 글 파이프라인 전체 흐름
│   ├── verify.ts     (298줄)  규칙 검증기: 숫자·고유명사·중복·길이 검사 (약하게 만드는 변경은 고위험)
│   ├── generate.ts   (171줄)  글 작성·고쳐 쓰기·번역 프롬프트와 Anthropic 호출, MODEL 상수
│   ├── collect.ts    (153줄)  RSS/뉴스 목록 파싱, 본문 추출, 사실 추출(인용문에 값이 있을 때만 저장)
│   ├── render.ts     (159줄)  공통 HTML 틀, 디자인 토큰(:root CSS 변수), 마크다운→HTML, JSON-LD
│   ├── ispp.ts       (148줄)  myispp.com master.json에서 학비만 가져오기 (verified + 학교 자체 도메인 출처일 때만)
│   ├── grounding.ts   (81줄)  AI 근거 검사: 글 문장이 재료(사실·소식)에 근거하는지 확인
│   ├── summary.ts     (75줄)  학교 카드·정보 상자용 요약. 기록된 사실로만 계산, 추정 없음
│   ├── guides.ts      (54줄)  새 소식이 없을 때 쓰는 주제 가이드(학비 안내 등), 학교·주제당 1회
│   ├── retry.ts       (19줄)  일시적 API 오류에 한 번 더 천천히 재시도
│   ├── text.ts        (15줄)  HTML 엔티티 해석
│   └── operator.ts    (13줄)  운영사 정보와 고객 학교 표시 문구 (/about, 푸터)
├── test/                      vitest 단위 테스트 (verify, grounding, collect, ispp, pipeline, render, retry, summary, guides)
├── migrations/                D1 스키마. 변경은 새 마이그레이션 파일로만, 원격 적용은 사람만
├── seeds/                     학교별 초기 데이터 SQL (pilot, bisp, bst-tashkent, qais, eastwood-montreux, bsb-shunyi-fees)
├── scripts/
│   ├── check.sh               전체 검사(QA 기준). check.d/의 10 코드 · 15 스냅샷 · 20 HTML · 30 링크 · 40 접근 · 50 비밀 값
│   ├── pilot.sh               로컬 D1에서 실제 AI 호출로 파이프라인 시험 (API 비용 발생)
│   ├── publish-school.sh      학교 추가·운영 반영 한 번에 (사람만 실행)
│   ├── verify-live.sh         운영 주소에서 내부 파일 비노출 확인
│   ├── test-guard.sh          안전장치 판정 시험 (guard-cases.txt)
│   └── crawl.py, html_check.py, link_check.py, snapshot.sh, lib.sh, fixtures/  검사 보조
├── docs/                      내부 문서 (공개 안 됨)
│   ├── PRD.md, architecture.md, design-spec.md, seo-plan.md   기준 문서 (우선순위는 CLAUDE.md 2장)
│   ├── stage.md               현재 모드(안정화, 2026-11-27 종료 예정)와 게이트 상태
│   ├── tasks.md, backlog.md, decisions.md, log.md, blocked.md   작업·결정·작업 기록
│   └── ops/                   운영 요청함, 장애, 지표, 릴리스 기록
├── .claude/
│   ├── agents/                planner, seo, designer, architect, developer, qa, aeo, release, ops 지침
│   ├── commands/              /build, /adopt, /change, /hotfix, /release, /status 등 명령
│   ├── hooks/guard.sh         모든 Bash 명령 전 검사 (main 커밋·push, 운영 배포, 원격 DB, 비밀 값 차단)
│   ├── settings.json          권한 거부 목록
│   └── stack/                 활성 스택 프로필 (Cloudflare Worker + D1)
└── tools/ai-measure/          AI 답변 인용 출처 측정 도구 (사이트와 별개, Worker 번들에 안 들어감)
    ├── measure.ts             질문 × AI 5종을 웹 검색 켜고 호출, 원본 응답을 results/<run>/raw/에 저장
    ├── aggregate.ts           출처 도메인 순위, 학교 자체 페이지 인용률, 학교 언급 점유율 집계 → report.md
    ├── domain-types.json      도메인 → 유형(학교 공식, 학교 비교, 언론, 블로그 등) 분류표
    ├── schools/               bis-hanoi.json, isph-hanoi.json (학교명·질문·언급 정규식 설정)
    ├── results/               bis-hanoi-2026-11-12, isph-hanoi-2026-11-13 원본 응답과 집계 결과
    └── README.md              실행 방법, API별 호출·출처 추출 방식
```

### 핵심 파일 내부 구조

600줄을 넘는 파일은 없다. 가장 큰 두 파일의 흐름만 적는다.

**`src/pipeline.ts`**
- `runPipeline(env, now)`: Cron과 `/admin/run`의 진입점. 먼저 `syncIspp`로 활성 학교 전체의 myispp 학비를 한 번 갱신한 뒤, 학교마다 `collectNews` → `extractNewFacts` → `writeForSchool` → `fillMissingTranslations` 순서로 돈다. 한 단계가 실패해도 다음 단계와 다음 학교는 계속한다.
- `writeForSchool`: 사실과 새 소식으로 글 작성(`generate.ts`) → `verifyArticle`(`verify.ts`) → `checkGrounding`(`grounding.ts`) → 고칠 수 있으면 `reviseArticle`로 한 번 고쳐 쓰고 다시 검증 → 통과하면 번역(`translateInto`) → `AUTO_PUBLISH`가 `"true"`면 `published`, 아니면 `verified`. 실패하면 `held`로 보류하고 `ALERT_WEBHOOK_URL`로 알림
- `rewriteArticle(env, articleId, reason)`: `/admin/rewrite`에서 게시 글 한 편을 다시 쓴다
- `canRevise`, `pageOutcome`: 고쳐 쓰기 가능 여부, 페이지 응답 코드별 처리(read/retry/skip)

**`src/index.ts`**
- `fetch`: `/admin/*`는 `admin()`(Bearer `ADMIN_TOKEN` 필요), 나머지는 `site()`
- 공개 라우트: `/`, `/about`, `/blog`, `/blog/{slug}`(`/ko/` 접두 버전 포함), `/wiki/{school}`, `/compare/{city}-international-schools`, `/sitemap.xml`, `/rss.xml`, `/llms.txt`, `/robots.txt`
- 관리 라우트: `POST /admin/run`, `POST /admin/import-ispp`, `POST /admin/unpublish`, `POST /admin/rewrite`, `GET /admin/held`
- `scheduled`: Cron에서 `runPipeline` 호출

## 4. 지금 상태와 이어서 할 일

- **운영 모드:** 안정화 (첫 출시 2026-11-13, 종료 예정 2026-11-27). P0·P1만 처리하고 P2·P3는 `docs/ops/inbox.md`에 기록만 한다. 최근 작업 기록은 `docs/log.md` 끝부분.
- **커밋 방식:** main 직접 커밋·push는 안전장치가 막는다. 작업 브랜치에서 커밋하고 push한 뒤 PR을 만든다. PR 머리 커밋에서 `bash scripts/check.sh` 전체가 PASS여야 하고(SKIP도 불가), 검사한 SHA를 지정해 AI가 병합한다 (`CLAUDE.md` 12장).
- **사람만 하는 일:** 운영 배포(`npm run deploy`), 원격 D1 변경, `wrangler secret`, `AUTO_PUBLISH` 변경, 운영 `/admin/*` 호출, `scripts/publish-school.sh`. 막히면 우회하지 말고 정확한 명령을 사람에게 알린다.
- **AI 인용 측정 (`tools/ai-measure/`):**
  - 실행: `NODE_USE_ENV_PROXY=1 node tools/ai-measure/measure.ts --config tools/ai-measure/schools/<학교>.json` 다음에 `node tools/ai-measure/aggregate.ts --run <run>`
  - 인증: OpenAI·xAI·Perplexity는 클라우드 환경의 네트워크 시크릿(프록시가 헤더를 붙임)이라 코드에서 헤더를 보내지 않는다. Gemini는 `GOOGLE_AI_API_KEY`를 `x-goog-api-key` 헤더로 보낸다. Anthropic은 `ISCHOOLWIKI_ANTHROPIC_KEY`를 쓴다.
  - 프록시가 약 30초 동안 응답이 없으면 연결을 끊는다. 그래서 OpenAI, xAI, Gemini는 스트리밍으로 호출한다.
  - 같은 run 폴더로 다시 실행하면 성공한 호출은 건너뛴다. 측정할 때마다 API 비용이 들므로 반복 측정은 사용자에게 먼저 묻는다.
- **영업 산출물:** ISPH 제안서는 Claude Docs 문서로 있다. 영문 https://claude.ai/artifact/CUTXJGd1EmNU4dFUPKeKhN, 한글 https://claude.ai/artifact/1aLj8HXdbuUpUrAbbokL9Y. 평판 보고서와 합친 한국어 PDF도 만들었다(2026-11-17). 운영사가 실제로 하는 일만 넣는다: myispp.com 프로필, ischoolwiki.com 페이지와 기사, 블로거 네트워크, 월간 AI 보고서. 학교 웹사이트 개선 권고, 후기·디렉터리 정정 지원, 보도자료는 넣지 않는다.
- **제안서 가격 (고정, 2026-11-17 사용자 결정):** 모든 학교 제안서에서 **6개월 기준 총액**으로 Essential $3,000 / Growth $5,000 / Premium $7,000. 월 단가가 아니다(월 환산 약 $500 / $833 / $1,167). 계약은 6개월 단위. 사용자가 바꾸라고 하기 전에는 이 금액을 쓴다.
- **패키지 분량 (가격과 함께 고정, 2026-11-17 사용자 결정):** 이 가격에 아래 분량을 유지한다. ischoolwiki.com 기사 월 최대 4 / 8 / 12편, 블로거 글 없음 / 6개월 20건(네이버 10, 다음 10) / 기자단(외부 블로거) 6개월 20건(네이버 10, 다음 10), AI 질문 15 / 15 / 30개, 비교 경쟁 학교 3 / 5 / 8곳, 검토 통화 분기별 / 매달 / 매달 (Essential / Growth / Premium 순).
- **사용자 소통:** 사용자(36.9° AI Visibility 운영)와는 한국어로 소통한다. 사용자에게 보이는 답변도 한국어로 쓴다.
