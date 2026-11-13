# 구조 설계 (v1 · 2026-11-13 · /adopt)

이미 운영 중인 사이트(Cloudflare Worker + D1, 서버 렌더링)를 하네스 구조로 편입하기 위한 구조 설계.
이 문서는 **제1부 현재 구조**(지금 코드가 실제로 하는 일)와 **제2부 목표 구조**(작은 단계로 옮겨 갈 모양)로 나뉜다.
기준: CLAUDE.md 10~13장·16장, docs/adopt-report.md, docs/decisions.md, `src/` 13개 파일, `migrations/0001~0006`, `test/` 9개 파일, `scripts/check.sh`·`check.d/`, `wrangler.toml`.

> 입력 상태
> - `docs/PRD.md`, `docs/design-spec.md`, `docs/seo-plan.md`, `docs/tasks.md`가 아직 없다(역기획 진행 중). 그래서 이 문서의 공개 URL은 **현재 코드 기준**이며, seo-plan이 나오면 5장·제2부 라우트 표와 대조를 다시 해야 한다. 기능 ID(F-xx)도 PRD가 정하므로, 제2부의 정리 작업은 임시 ID `R-0`~`R-6`으로 적는다.
> - 현재 모드는 **안정화**(2026-11-13~27, P0·P1만 처리). 동작을 바꾸지 않는 정리(R-0~R-2, R-6)는 등급상 P2이므로 원칙적으로 안정화 종료 뒤에 한다. 운영 사고와 직결된 R-4(글 교체 API)와 그 전제 단계를 안정화 중에 할지는 ops 분류와 사람 결정이 필요하다(제2부 6장).
> - 추정이 들어간 문장에는 "(추정)"을 붙였다.

---

## 0. 먼저 판단한 것: 내부 문서가 공개되는가 — 공개되지 않음
- `wrangler.toml`에 `[assets]`·`[site]`가 없고, Worker는 `src/index.ts`에 적힌 경로만 응답한다. 나머지는 모두 404 페이지.
- 저장소 파일을 읽어 응답하는 코드가 없다(Worker 번들에는 `src/`에서 import한 코드만 들어간다).
- 확인 수단: `bash scripts/check.sh 15 40`(로컬에서 `/CLAUDE.md`, `/docs/PRD.md`, `/wrangler.toml`, `/package.json` 404), `scripts/verify-live.sh`(운영 19개 경로 404, adopt-report 1장).
- 결론: 하네스 원본의 dist/ 허용 목록 방식은 필요 없다(CLAUDE.md 11장). 목표 구조에서도 이 성질을 유지한다(정적 자원 설정 추가 금지).

---

# 제1부 현재 구조

## 1. 기술 스택 (현재 = 확정)
| 영역 | 선택 | 버전(package.json) | 이유·메모 |
|---|---|---|---|
| 실행 | Cloudflare Workers, `nodejs_compat` | compatibility_date 2026-10-01 | 요청마다 HTML 생성. 정적 파일 없음 |
| 언어 | TypeScript (strict, noUncheckedIndexedAccess) | typescript ^7.0.2 | `tsc --noEmit`만, 빌드는 wrangler가 번들 |
| 데이터 | Cloudflare D1 (바인딩 `DB`, DB 이름 `ischoolwiki`) | — | 스키마는 `migrations/`로만 |
| AI | Anthropic API, `@anthropic-ai/sdk` | ^1.8.0 | 모델 `src/generate.ts`의 `MODEL` (`claude-opus-5-5`), 서버 측 대체 모델 베타 사용 |
| 출력 형식 검증 | `zod` | ^4.6.7 | AI 응답 JSON 스키마 |
| 테스트 | vitest (node 환경) | ^5.1.0 | `test/*.test.ts` |
| 도구 | wrangler | ^4.160.0 | 로컬 서버, 마이그레이션, `--dry-run` 번들 |
| 검사 스크립트 | bash + python3(표준 라이브러리만) | — | `scripts/` |

CLAUDE.md 10장과 차이 없음. 목표 구조에서도 바꾸지 않는다.

## 2. 허용 목록 (현재 = 목표)
| 라이브러리·외부 스크립트 | 용도 | 로드 방식 | 대체 금지 대상 |
|---|---|---|---|
| `@anthropic-ai/sdk` | 추출·작성·고쳐 쓰기·번역·근거 검사 호출 | npm, Worker 번들 | 직접 fetch로 API를 부르는 코드 금지(재시도·스트리밍 일관성) |
| `zod` | AI 응답 스키마 검증 | npm, Worker 번들 | 손으로 짠 JSON 형태 검사 금지 |
| `@cloudflare/workers-types`, `typescript`, `vitest`, `wrangler` | 개발·검사 전용 | devDependencies | — |
| Node 내장 `node:sqlite` | (목표 R-0) 테스트에서 실제 SQL로 D1 쿼리 확인 | 테스트 코드에서만 import | 새 테스트용 DB 라이브러리 도입 금지 |
| 외부 스크립트·CDN·웹폰트 | **없음** | — | 공개 페이지에 추가 금지(CLAUDE.md 10-4) |

여기 없는 것은 architect 승인 없이 추가하지 않는다. 이번 설계는 새 라이브러리를 제안하지 않는다.

## 3. 폴더·파일 역할 (현재)
```
/
  wrangler.toml          Worker 이름, D1 바인딩, Cron, 도메인 routes, vars(SITE_URL, SITE_NAME, MAX_POSTS…, AUTO_PUBLISH)
  package.json           스크립트(dev, deploy, typecheck, test, db:migrate:*)
  harness.config.sh      하네스 값(운영 주소, 브랜치, push 정책, 검사 포트)
  src/
    index.ts      387줄  진입점 + 라우팅 + 공개 페이지 6종(첫 화면, 소개, 글 목록, 글, 학교, 도시 비교)
                         + sitemap/rss/llms.txt/robots + 관리 API 4개 + 토큰 비교 + 응답 도우미 + D1 쿼리 다수
    render.ts     159줄  공통 HTML 틀 page(), 디자인 토큰(:root CSS 변수)과 STYLE 전체, markdownToHtml, esc, jsonLd
    summary.ts     75줄  학교 요약(교육과정·학비 범위·학년) — 기록된 사실로만 계산
    operator.ts    13줄  운영자 정보, 고객 학교 고지 문구
    pipeline.ts   313줄  Env·School 타입, runPipeline(학교별 collect→extract→write), syncIspp, collectNews,
                         extractNewFacts, writeForSchool(약 110줄), canRevise, saveArticle, unpublish, uniqueSlug, alert
    collect.ts    137줄  뉴스 RSS/목록 페이지 파싱, 본문만 자르기(articleHtml), 사실 추출 AI 호출 + filterGrounded
    generate.ts   171줄  MODEL, 작성·고쳐 쓰기·번역 AI 호출과 지시문
    grounding.ts   81줄  근거 검사 AI 호출(문장마다 자료 대조), fail closed, 일시 오류 1회 재시도
    verify.ts     298줄  규칙 검증(숫자·고유명사·중복·길이), 날짜 숫자 허용
    guides.ts      54줄  주제별 안내 글 주제 정의와 선택
    ispp.ts       148줄  myispp master.json → 학비 사실 변환·교체
    retry.ts       19줄  일시 오류 판별, 한 번 더 시도
    text.ts        15줄  HTML 엔티티 해독
  migrations/     0001~0006 (아래 6장)
  seeds/          pilot.sql(학교 3곳), bsb-shunyi-fees.sql, bst-tashkent.sql — 로컬·검사용. 운영 적용은 사람
  test/           단위 테스트 9개 파일 (아래 11장)
  scripts/        check.sh + check.d/(10,15,20,30,40,50), snapshot.sh, crawl.py, html_check.py, link_check.py,
                  access-matrix.txt, link-ignore.txt, pilot.sh, verify-live.sh, test-guard.sh, guard-cases.txt, lib.sh,
                  fixtures/check-articles.sql(검사 전용 게시 글 2편)
  tools/ai-measure/      사이트와 별개인 AI 답변 측정 도구 (배포 안 됨, Worker가 import하지 않음)
  docs/ .claude/  CLAUDE.md README.md start.md   내부 문서 (Worker 라우트 없음 → 공개 안 됨)
  .harness/ .wrangler/ node_modules/            로컬 산출물 (.gitignore)
```

## 4. 공통 요소 처리 (현재)
- 모든 공개 HTML은 `src/render.ts`의 `page(meta, body)` 하나로 감싼다. 헤더·푸터·메타(title, description, canonical, hreflang, og, RSS 링크, JSON-LD)·CSS가 한 곳에 있다. 정적 파일 복사 문제가 생기지 않는 구조라 그대로 유지한다.
- 공통 요소를 바꾸면 영향 범위 = 모든 공개 페이지. 확인은 `bash scripts/check.sh 15 20 30`.

## 5. 라우트 표 (현재, `src/index.ts`)
| 화면 | 경로 | 메서드 | 구분 | 응답 | 캐시 | 메타·구조화 데이터 |
|---|---|---|---|---|---|---|
| 도메인 정리 | 호스트 `www.ischoolwiki.com` 모든 경로 | 모두 | 공개 | 301 → apex, 경로·쿼리 유지 | — | — |
| 첫 화면 | `/` | GET(메서드 구분 없음) | 공개 | HTML 200 | `public, max-age=300` | WebSite, ItemList |
| 운영자 정보 | `/about`, `/ko/about` (끝 `/` 허용) | 〃 | 공개 | HTML 200 | 〃 | hreflang en/ko |
| 글 목록 | `/blog`, `/blog/`, `/ko/blog`, `/ko/blog/` | 〃 | 공개 | HTML 200 (최근 100편) | 〃 | hreflang en/ko |
| 글 | `/blog/{slug}`, `/ko/blog/{slug}` | 〃 | 공개 | HTML 200, 게시 글 없으면 404 페이지 | 〃 (404도 300초) | BlogPosting, FAQPage, BreadcrumbList, hreflang(같은 slug 번역) |
| 학교 | `/wiki/{slug}` | 〃 | 공개 | HTML 200 / 404 | 〃 | EducationalOrganization |
| 도시 비교 | `/compare/{city}-international-schools` | 〃 | 공개 | HTML 200 / 404 | 〃 | ItemList |
| sitemap | `/sitemap.xml` | 〃 | 공개 | XML (게시 글·학교·도시·고정 5개) | 없음 | — |
| RSS | `/rss.xml` | 〃 | 공개 | XML (영어 최근 50) | 없음 | — |
| llms.txt | `/llms.txt` | 〃 | 공개 | text | 없음 | — |
| robots | `/robots.txt` | 〃 | 공개 | text, `/admin/` 금지, AI 크롤러 허용 | 없음 | — |
| 그 외 | 모든 경로 | 〃 | — | 404 HTML | 없음 | — |
| 관리: 파이프라인 실행 | `/admin/run` | POST | 관리(Bearer) | JSON RunReport | 없음 | — |
| 관리: myispp 가져오기 | `/admin/import-ispp` | POST | 관리 | JSON | 없음 | — |
| 관리: 글 내리기 | `/admin/unpublish` `{run_id}` 또는 `{article_id, reason}` | POST | 관리 | JSON 내린 수 / 400 | 없음 | — |
| 관리: 보류 글 | `/admin/held` | GET | 관리 | JSON 최근 100건(id, 학교, 언어, 제목, 문제) | 없음 | — |
| 서버 오류 | 처리 중 예외 | — | — | 500 text "Server error" | 없음 | — |

- 회원 기능 없음 → 회원 전용·혼합 화면 없음. 보호 대상은 `/admin/*` 4개이며 모두 `scripts/access-matrix.txt`에 401로 등록되어 있다.
- 관리 경로는 토큰이 틀리면 경로 존재 여부와 관계없이 401(경로 노출 없음).
- 한국어 화면은 글·글 목록·운영자 정보뿐(결정: 주 독자는 영어권).
- 404 판정 방식 주의: 페이지 함수가 404 본문 문자열을 돌려주면 `html()`이 본문에 `<h1>Page not found</h1>`가 있는지 보고 상태를 404로 바꾼다. 페이지 문구에 우연히 같은 문자열이 들어가면 200 페이지가 404가 된다(취약, 제2부 R-2에서 정리).

## 6. D1 데이터 모델 (현재)
| 테이블 | 주요 열(제약) | 관계 | 개인정보 | 읽기 / 쓰기 |
|---|---|---|---|---|
| `schools` | slug PK, name, city, city_slug, country, website, news_feed, active, is_client(0002), ispp_school_id(0003) | — | 없음 | 공개 페이지 읽기 / 쓰기는 사람(시드·원격 SQL) |
| `facts` | id, school_slug FK, key, value, unit, as_of, source_url NOT NULL, source_kind ∈ {ispp_api, school_site, school_submission, manual}, fetched_at, quote(0004), UNIQUE(school_slug,key,value) | schools | 없음(학교 공개 자료) | 공개 페이지·파이프라인 읽기 / 추출 단계 INSERT OR IGNORE, ispp 단계는 `ispp_api` 행 DELETE 후 INSERT(가져오기 성공 시에만) |
| `entities` | (school_slug, name) PK, source_url | schools | 이름 목록에 교직원·학생 이름이 들어갈 수 있음(추정). 공개 페이지에는 표시 안 함 | 파이프라인만 |
| `source_items` | id, school_slug, url UNIQUE, title, summary, published_at, collected_at, extracted_at, facts_found, used_by FK articles | schools, articles | 없음 | 파이프라인만 |
| `articles` | id, school_slug, lang, translation_of FK self, slug, kind, title, tldr, body_md, faq_json, sources_json, status CHECK ∈ {held, verified, published, unpublished}, run_id, model, created_at, published_at, UNIQUE(lang,slug) | schools, self | 본문에 사람 이름 가능 → 학생 실명 금지 규칙(작성 지시 + 근거 검사) | 공개 페이지는 `status='published'`만 / 쓰기는 파이프라인(INSERT)과 관리 unpublish(UPDATE) |
| `verification_results` | id, article_id, passed, problems_json, checked_at | articles | 문제 설명에 본문 인용 포함 | 관리 `/admin/held`만 |
| `article_events` | id, article_id, from_status, to_status, reason, at | articles | 없음 | 쓰기만(감사 기록) |
| `article_revisions` (0005) | id, article_id, draft_json(첫 원고), problems_json | articles | 원고 본문 | 쓰기만(사람은 원격 SQL로 조회) |
| `guide_attempts` (0006) | id, school_slug, topic, article_id, outcome ∈ {verified, published, held, skipped}(제약 없음), detail, UNIQUE(school_slug, topic) | schools, articles | 없음 | 파이프라인만 |

### 6-1. 글 상태 흐름
```
            검증 통과 + AUTO_PUBLISH=true ─→ published ─┐
작성 → 검증 ┤ 검증 통과 + AUTO_PUBLISH=false ─→ verified ─┤  (사람이 원격 SQL로 published로 바꿈)
            └ 검증 실패 ───────────────────→ held ──────┤  (사람이 원격 SQL로만 바꿀 수 있음)
                                                         └─ /admin/unpublish ─→ unpublished (영어 + 그 번역 함께, 또는 run_id 단위)
```
- 상태 전이는 `article_events`에 모두 남는다(INSERT 시 NULL→상태, 내리기 시 상태→unpublished).
- unpublished 글도 `UNIQUE(lang, slug)`를 차지한다 → 같은 주제로 다시 쓰면 slug에 `-2`가 붙고 **옛 URL은 404**가 된다.
- `verified → published`, `held → published`를 하는 관리 API는 없다(사람이 원격 DB에서 직접).

### 6-2. 마이그레이션 규칙 (현재 지켜지고 있음, 목표에서도 유지)
- 파일 하나에 변경 하나, 번호 순. 되돌리기 방법 주석은 현재 파일에 없다 → 다음 파일부터 머리 주석에 되돌리기 방법을 적는다.
- 로컬 적용·검증(`npm run db:migrate:local`, check 15가 `.harness/d1`에 별도 적용)까지 AI, 원격 적용은 사람.
- 미리보기 배포·미리보기 D1 없음(배포는 사람이 main에서). 로컬 D1은 `.wrangler/state`(파일럿)와 `.harness/d1`(검사)로 분리됨.

## 7. 자동 글 파이프라인 (현재, `src/pipeline.ts`)
Cron `17 1 * * *`(매일 01:17 UTC) → `scheduled()` → `ctx.waitUntil(runPipeline(env))`, 결과는 `console.log` JSON. 같은 함수를 `POST /admin/run`이 부른다.

| 순서 | 단계 | 하는 일 | 실패 시 동작 |
|---|---|---|---|
| 0 | myispp 동기화 `syncIspp` | master.json을 먼저 받고, 연결된 학교마다 `ispp_api` 사실을 한 batch로 지우고 다시 넣음. 학교 도메인 출처만 | 받기 실패 → 아무것도 지우지 않음, 보고서에 `failed - …` 한 줄 |
| 1 | 수집 `collectNews` | 학교 `news_feed`(RSS 또는 뉴스 목록 HTML)를 읽어 `source_items`에 INSERT OR IGNORE | HTTP 오류(예: Nord Anglia 429) → 이 단계만 실패 기록, 다음 단계는 기존 자료로 진행 |
| 2 | 추출 `extractNewFacts` | 미추출 항목 최신 3건: 페이지 받기 → 관련 글 제목 이후 자르기 → 텍스트 → AI 추출 → 인용이 페이지에 있고 값을 포함할 때만 `facts`·`entities`에 저장 → `extracted_at` 기록 | AI 오류 → 예외로 단계 중단, 해당 항목 미추출로 남아 다음 날 재시도. **페이지 HTTP 오류(429 등) → 사실 0건으로 `extracted_at` 기록, 다시 읽지 않음**(그 소식은 영구히 글감에서 빠짐, 추정 영향) |
| 3 | 작성 `writeForSchool` | 아래 3-1~3-8 | 예외 → 단계 실패 기록, 다음 학교로 |
| 3-1 | 월 한도 | 이번 달 영어 verified+published 수 ≥ `MAX_POSTS_PER_SCHOOL_PER_MONTH`(12)면 종료 | — |
| 3-2 | 자료 고르기 | 사실 전체, 안 쓴 소식(facts_found>0) 최신 3건, 이전 글 50편. 소식이 없으면 `guides.ts`로 안 해 본 주제 선택(주제 사실 3건 이상), 안내 글은 그 주제 사실만 | 쓸 것 없음 → "nothing written" |
| 3-3 | 작성 | `writeArticle` (AI가 skip 가능 → 안내 글이면 `guide_attempts`에 skipped) | AI 오류 → 예외(아무것도 저장 안 됨, 소식 미소모 → 다음 날 재시도) |
| 3-4 | 검증 | 규칙 검증 `verifyArticle` + 근거 검사 `checkGrounding`. 근거 검사 API 일시 오류는 30초 뒤 1회 재시도, 그래도 실패하거나 응답이 이상하면 **문제 1건으로 처리(fail closed → held)** | — |
| 3-5 | 고쳐 쓰기 | 문제가 전부 문장 단위(unknown_entity, unsupported_number, unsupported_claim)이고 근거 검사가 돌았을 때만 `reviseArticle` **1회**, 같은 검증 다시. 중복·길이·검사 불가는 고쳐 쓰지 않음 | 고쳐 쓰기 AI 오류 → 예외(저장 안 됨) |
| 3-6 | 저장 | slug 정리·중복 회피, 출처 = 사용된 사실의 출처 + 소식 URL, `articles`+`verification_results`+`article_events`, 고쳐 썼으면 `article_revisions`, 안내 글이면 `guide_attempts`, 쓴 소식 `used_by` 표시(보류여도 소모) | 보류면 `ALERT_WEBHOOK_URL`로 알림 후 종료 |
| 3-7 | 번역 | 통과한 영어 글만 한국어로 `translateArticle` → 규칙 검증(한국어는 숫자만, 영어 글의 날짜 숫자 허용) → 저장(통과면 영어와 같은 상태, 실패면 held + 알림) | **번역 AI 오류 → 예외. 영어 글은 이미 저장·게시됨, 번역은 다시 시도되지 않음** |

- 학교마다·단계마다 try/catch로 격리되어 한 학교 실패가 다른 학교를 막지 않는다.
- 실행 시간: 학교 3곳 × AI 호출 최대 약 9회(추출 3 + 작성 1 + 근거 2 + 고쳐 쓰기 1 + 번역 1 …)가 순차. 학교가 늘면 Cron 실행 시간 한도에 걸릴 수 있다(추정). 지금 규모에서는 문제 보고 없음.

## 8. 외부 연동 (현재)
| 대상 | 위치 | 방식 | 실패 처리 |
|---|---|---|---|
| Anthropic API | `collect.ts`(추출), `generate.ts`(작성·고쳐 쓰기·번역), `grounding.ts`(근거 검사) | SDK 스트리밍, zod 출력 형식, 서버 측 대체 모델 베타, 지시문 캐시 | SDK 기본 재시도(추정 2회) 후 예외. 근거 검사만 추가 30초 1회 재시도 + fail closed |
| 학교 뉴스 페이지 | `schools.news_feed`, 각 소식 URL | fetch, User-Agent `iSchoolWikiBot/0.1` | 7장 참고 |
| myispp `https://myispp.com/data/master.json` | `ispp.ts` | fetch JSON | 받기 실패 시 삭제 없음. 학교 도메인이 아닌 출처는 버림 |
| 알림 웹훅 | `ALERT_WEBHOOK_URL`(선택) | POST JSON `article_held` | 실패 무시 |

## 9. 인증·비밀 값 (현재)
- 관리 인증: `Authorization: Bearer <ADMIN_TOKEN>`. 양쪽을 SHA-256 해시 후 `timingSafeEqual`. 토큰이 비어 있으면 모두 401. 세션·쿠키 없음.
- 비밀 값(운영 `wrangler secret`, 로컬 `.dev.vars`): `ANTHROPIC_API_KEY`, `ADMIN_TOKEN`, `ALERT_WEBHOOK_URL`(선택). 공개 vars: `SITE_URL`, `SITE_NAME`, `MAX_POSTS_PER_SCHOOL_PER_MONTH`, `AUTO_PUBLISH`.
- `.dev.vars.example`은 만들지 않기로 결정됨(2026-11-13, 비밀 파일 차단 규칙과 충돌). 이름 목록은 CLAUDE.md 10-1과 `wrangler.toml` 주석.

## 10. 공통 처리 (현재)
- 오류: 공개 경로 예외 → 500 text. 관리 경로 JSON 본문이 잘못되면 `req.json()` 예외 → 500(400이 맞음).
- 입력 검증: 관리 `unpublish`만 `run_id`/`article_id` 존재 확인. 공개 경로는 정규식으로 slug 문자 제한(`[a-z0-9-]`).
- 날짜: D1 `datetime('now')` UTC 문자열, 화면은 앞 10자리(YYYY-MM-DD). RSS·JSON-LD는 ISO로 변환.
- 금액: `summary.ts` `formatAmount`(en-US 천 단위 구분). 학비는 기록된 사실에서만.
- 이미지: 없음. 다국어: en 기본, ko 번역(글·목록·소개).

## 11. 테스트·검사 범위 (현재)
| 파일 | 다루는 것 | 다루지 않는 것 |
|---|---|---|
| `verify.test.ts` | 숫자·이름·중복·길이·날짜·번역 숫자·등급 글자·엔티티 이름 등 (가장 두꺼움) | — |
| `collect.test.ts` | RSS/Atom/목록 파싱, filterGrounded, 관련 글 자르기 | 추출 AI 호출 |
| `grounding.test.ts` | 검사 결과 → 문제 변환, 요청에 인용 포함 | API 실패 시 fail closed 경로 |
| `retry.test.ts` | 일시 오류 판별, 1회 재시도 | — |
| `pipeline.test.ts` | `canRevise`만(2개) | **writeForSchool 흐름 전체, saveArticle, unpublish, 상태 전이** |
| `guides.test.ts`, `summary.test.ts`, `ispp.test.ts`, `render.test.ts` | 순수 함수, ispp 가짜 DB | — |
| (없음) | — | **페이지 함수·라우팅·관리 API의 단위 테스트**. 대신 check 15·20·30·40이 로컬 Worker 스냅샷으로 검사 |

- `bash scripts/check.sh`: 10 코드(테스트 63개) · 15 스냅샷(검사 전용 D1 + fixtures) · 20 HTML · 30 링크 · 40 접근 · 50 비밀 값. 현재 전체 PASS(adopt-report 5장).
- 스냅샷은 HTML 페이지만 저장한다(sitemap/rss/llms/robots는 링크로 연결되지 않아 저장 안 됨).
- 글 품질은 `./scripts/pilot.sh`(실제 AI 호출) + 사람의 원문 대조로만 확인된다.

## 12. 디자인 토큰 현황 (8장 매핑의 현재 값)
design-spec이 아직 없으므로 현재 코드의 토큰을 그대로 적는다. design-spec이 나오면 이름을 대조한다.
| CSS 변수(`src/render.ts` `:root`) | 밝은 화면 | 어두운 화면 | 쓰는 곳 |
|---|---|---|---|
| `--bg` | #fbfaf7 | #141816 | 페이지 배경 |
| `--card` | #ffffff | #1b201e | 헤더, 카드, 정보 상자 |
| `--fg` | #1d2321 | #e8ebe8 | 본문 글자 |
| `--muted` | #5d6763 | #9aa5a0 | 메타, 출처, 표 머리 |
| `--line` | #e2e0d8 | #2b322f | 경계선 |
| `--accent` | #1f6f5c | #6fcfb4 | 링크, 강조, 브랜드 "Wiki" |
| `--accent-soft` | #e7f1ed | #1f2d28 | 요약 상자, 칩 배경 |

| 컴포넌트 | 클래스·마크업 | 만드는 곳 |
|---|---|---|
| 페이지 틀 | `header .wrap / main.wrap / footer`, `body.wide` | `render.ts page()` |
| 학교 카드 | `.grid > .card` (`.meta`, `h3`, `.chips`, `dl`, `.tag`, `.more`) | `index.ts schoolCard` |
| 글 카드 / 글 목록 | `.grid > .card` / `ul.plain` | `index.ts articleCards`, `articleList` |
| 요약 상자 | `.tldr > b + p` | `index.ts articlePage` |
| 정보 상자 | `.infobox > table` | `articlePage`, `wikiPage` |
| 고객 고지 | `p.notice` | `index.ts clientNotice` |
| 신뢰 3항목 | `ul.trust` | `index.ts home` |
| 빵부스러기 | `nav.crumbs` | `articlePage`, `wikiPage` |
| 표 | `.scroll > table` | 본문 표, 사실 표, 비교 표 |
| 출처 목록 | `ul.sources` | `articlePage` |

- 색은 모두 변수. 글자 크기·여백·반경은 STYLE 안에 숫자로 있다(토큰 정의 파일 안이라 규칙 위반은 아님). 크기 토큰화는 근거(5-3)가 없어 목표 단계에 넣지 않는다.

## 13. 현재 구조의 문제 (adopt-report + 이번 확인)
| # | 문제 | 위치 | 영향 | 목표 단계 |
|---|---|---|---|---|
| P-1 | 라우팅·페이지 6종·피드·관리 API·D1 쿼리가 한 파일 | `src/index.ts` 387줄 | 화면 수정이 다른 화면으로 번짐 | R-2 |
| P-2 | 작성 흐름 전체가 한 함수(자료 고르기~번역, 약 110줄) | `pipeline.ts writeForSchool` | 작성 흐름 변경 때 회귀, 테스트 불가 | R-3 |
| P-3 | SQL 조각을 문자열로 이어 붙임 (값은 bind, 주입 위험 없음) | `index.ts published()`, `pipeline.ts unpublish()`의 `where`, **`pipeline.ts saveArticle()`의 `published_at` 조각(adopt-report에 없던 세 번째)** | 16장 문구 위반, 쿼리 전체를 한눈에 볼 수 없음 | R-1 |
| P-4 | 글 교체가 사람 손 3단계(내리기 → 원격 DB에서 `used_by` 되돌리기(안내 글이면 `guide_attempts`도) → `/admin/run`) | 운영 절차 | 이번 주 4회, 1회 중간 단계만 실행. `/admin/run`은 모든 학교를 돌리고, 되돌린 소식보다 새 소식이 먼저 뽑힐 수 있음(최신 3건 규칙) | R-4 |
| P-5 | 보류 글을 사람이 읽기 어려움(JSON, 본문 없음) | `/admin/held` | 일일 점검 비용 | R-5 |
| P-6 | 404를 본문 문자열로 판정 | `index.ts html()` | 문구 변경 시 상태 코드 오판 | R-2 |
| P-7 | 페이지·파이프라인 흐름 단위 테스트 없음 | `test/` | 정리 작업의 회귀를 잡을 수단 부족 | R-0 |
| P-8 | 번역 단계 오류 시 번역이 영구히 빠짐 | `writeForSchool` 3-7 | 한국어 글 누락(현재 1편 보류와는 별개) | 이번 범위 밖 → backlog 후보 |
| P-9 | 소식 페이지 HTTP 오류 시 그 소식이 영구히 소모 | `extractNewFacts` | 429 날 소식 누락(추정) | 이번 범위 밖 → backlog 후보 |
| P-10 | 글 교체 시 slug가 바뀌어 옛 URL 404 | `UNIQUE(lang, slug)` + `uniqueSlug` | 이미 게시·색인된 주소 손실(SEO) | R-4에서 사람 결정 |

P-8·P-9는 동작 변경(파이프라인 수정)이라 구조 정리와 섞지 않는다. 필요하면 ops가 등급을 매겨 별도 작업으로.

---

# 제2부 목표 구조

## 1. 원칙
1. **동작을 바꾸는 단계와 옮기기만 하는 단계를 섞지 않는다.** 옮기기 단계는 스냅샷이 바이트 단위로 같아야 끝난다.
2. 한 단계 = PR 하나 = 되돌리기 쉬운 크기(대략 변경 400줄 이하, 추정).
3. 검증기(`verify.ts`, `grounding.ts`)와 AI 지시문(`generate.ts`, `collect.ts`)은 **이 정리에서 손대지 않는다.** 파일 위치도 그대로 둔다(커밋 이력과 테스트가 가장 많이 쌓인 곳).
4. 새 라이브러리 없음. 스키마 변경 없음(R-4의 선택지 C를 고르지 않는 한).

## 2. 목표 폴더 구조와 "이 코드는 여기에"
```
src/
  index.ts            진입점만: www 리디렉트, fetch → routes, scheduled → pipeline.run (약 30줄)
  routes.ts           공개 경로 표(정규식 → 페이지 함수) 한 곳. 새 공개 경로는 여기에만 추가
  http.ts             응답 도우미(html/xml/text/json, notFound, 캐시 헤더 상수), 페이지 결과 타입
  admin.ts            관리 인증(sameSecret)과 /admin/* 경로 표. 관리 경로는 여기에만 추가
  pages/
    home.ts about.ts blog.ts article.ts wiki.ts compare.ts   화면 하나당 파일 하나 (화면 전용 마크업)
    parts.ts          두 화면 이상이 쓰는 조각: schoolCard, articleCards, articleList, summaryRows,
                      clientNotice, plural, humanKey
  feeds.ts            robots.txt, sitemap.xml, rss.xml, llms.txt
  db/
    articles.ts       articles·verification_results·article_events·article_revisions 쿼리 (고정 SQL + bind)
    schools.ts        schools, facts, entities 읽기 쿼리
    sources.ts        source_items 쿼리
    guides.ts         guide_attempts 쿼리
  pipeline/
    run.ts            runPipeline, syncIspp (학교·단계 격리, 보고서)
    collect.ts        collectNews (뉴스 → source_items)
    extract.ts        extractNewFacts (페이지 → facts/entities)
    write.ts          writeForSchool = 아래 단계 함수를 순서대로 부르는 지휘 함수(약 30줄)
    steps.ts          단계 함수: checkMonthlyLimit, pickMaterial, draft, evaluateAndRevise, saveEnglish, translateAll
    rewrite.ts        글 교체 (R-4)
    types.ts          Env, School, RunReport
  admin/held.ts       보류 글 보기 HTML (R-5)
  render.ts summary.ts operator.ts text.ts retry.ts            그대로
  collect.ts generate.ts grounding.ts verify.ts guides.ts ispp.ts  그대로 (파싱·AI 호출·검증·주제·myispp)
test/
  helpers/d1.ts       node:sqlite 위에 D1 최소 인터페이스(prepare/bind/all/first/run/batch) + migrations 적용 (R-0)
  helpers/ai.ts       AI 호출 대역(작성·고쳐 쓰기·번역·근거 검사 응답을 테스트가 정함) (R-3)
  db.test.ts  pipeline-write.test.ts  rewrite.test.ts  admin.test.ts  (단계별 추가)
scripts/
  snapshot-diff.sh    스냅샷 기준 저장·비교 (R-0)
```
규칙
- D1 쿼리는 `src/db/*.ts` 함수로만(R-1에서 articles부터, R-6에서 나머지). 모든 SQL은 파일 안의 고정 문자열 + `bind`. 값 개수가 변하는 `IN (?,?,…)` 자리표시자 생성만 예외로 허용하고 `db/` 안에 둔다.
- 페이지 함수는 `Promise<PageResult | null>`을 돌려주고, null이면 `routes.ts`가 404를 만든다(본문 문자열 판정 폐지).
- AI 호출 함수는 `pipeline/steps.ts`가 인자로 받는다(기본값 = 실제 함수). 테스트는 대역을 넘긴다. 새 의존성 주입 도구 없이 함수 인자로만.
- 관리 경로는 전부 `admin.ts` 표에 있고, 운영 데이터를 바꾸는 것(run, import-ispp, unpublish, rewrite)은 POST만.

## 3. 목표 라우트 표 (현재와 다른 줄만)
| 경로 | 메서드 | 구분 | 응답 | 캐시 | 단계 |
|---|---|---|---|---|---|
| 공개 경로 전부 | — | 공개 | **현재와 바이트 단위 동일** | 현재와 동일 | R-2 |
| 404 | — | — | 404 HTML, 상태는 페이지 함수의 null로 결정 | 현재와 동일(글 404 300초 포함, 바꾸지 않음) | R-2 |
| `/admin/*` 응답 전부 | — | 관리 | 현재와 동일 + `cache-control: no-store`, 잘못된 JSON 본문은 400 | no-store | R-2 |
| `/admin/rewrite` | POST `{article_id, reason}` | 관리, **사람만 호출** | JSON(내린 글, 되돌린 소식, 새 글 id·상태·문제) | no-store | R-4 |
| `/admin/held?format=html` | GET | 관리 | HTML(noindex) 보류 글 읽기 화면. 형식 지정 없으면 현재 JSON | no-store | R-5 |

`scripts/access-matrix.txt`에 추가할 줄: `POST /admin/rewrite 401`(R-4), `GET  /admin/held?format=html 401`(R-5).
공개 URL은 바뀌지 않는다 → seo-plan과의 대조는 seo-plan 작성 후 한 번.

## 4. 단계 목록 (순서·의존·확인 방법·위험도)

요약
| 단계 | 내용 | 동작 변화 | 의존 | 위험도 | 파일럿 |
|---|---|---|---|---|---|
| R-0 | 회귀 기준 도구: 스냅샷 비교, 실제 SQL 테스트 도우미 | 없음(검사 도구만) | — | 일반(낮음) | 불필요 |
| R-1 | SQL 조각 3곳을 고정 쿼리 함수로 (`src/db/articles.ts`) | 없음 | R-0 | 일반 | 불필요 |
| R-2 | `index.ts`를 routes/http/admin/feeds/pages로 나누기 | 없음(관리 응답 no-store·400만 추가) | R-0, R-1 | 일반 | 불필요 |
| R-3 | `pipeline.ts`를 폴더로, `writeForSchool`을 단계 함수로 | 없음 | R-0, R-1 | **고위험**(검증 흐름을 옮김) | **필요** |
| R-4 | 글 교체 관리 API `/admin/rewrite` | 있음(새 관리 기능) | R-3 | **고위험**(운영 데이터 변경, 관리 인증) | **필요** |
| R-5 | 보류 글 읽기 화면 `/admin/held?format=html` | 있음(읽기 전용) | R-2 | 일반 | 불필요 |
| R-6 | 남은 D1 쿼리를 `src/db/`로 (손대는 김에, 별도 일정 없음) | 없음 | R-1~R-3 | 일반 | 불필요 |

### R-0 회귀 기준 도구
- 만들 파일: `scripts/snapshot-diff.sh`(`save`: `.harness/snapshot`과 `/sitemap.xml`·`/rss.xml`·`/llms.txt`·`/robots.txt` 응답을 `.baseline/`에 복사 / `compare`: diff, 다르면 FAIL), `test/helpers/d1.ts`(node:sqlite로 `migrations/*.sql` 적용한 메모리 DB를 D1 모양으로 감싼 것), `test/db.test.ts`(도우미 자체 확인: 마이그레이션 6개 적용, prepare/bind/batch).
- 수정: `.gitignore`에 `.baseline/`. `scripts/snapshot.sh`가 `.harness/`를 지우므로 기준은 그 밖에 둔다. 피드 4개는 `crawl.py`에 고정 경로로 저장하게 하거나 diff 스크립트가 직접 받는다(developer 선택, 둘 중 하나).
- 스냅샷이 실행마다 같은지 먼저 확인한다: `check.sh 15` 두 번 → compare가 같음(추정: 같음. 날짜는 fixtures 고정값, 사실 `fetched_at`은 화면에 없음).
- 회귀 확인: `bash scripts/check.sh` 전체 PASS, 테스트 수 63 → 증가만.
- 위험: 낮음. node:sqlite는 Node 22에서 실험 기능(경고 출력). 막히면 `ispp.test.ts`의 가짜 DB 방식으로 대체하고 그 단계 테스트는 SQL 문자열 검사로 낮춘다(BLOCKED가 아니라 대체).

### R-1 SQL 조각 → 고정 쿼리
- 만들 파일: `src/db/articles.ts`. 함수 예: `latestPublished(db, lang, limit)`, `publishedByLang(db, lang, limit)`, `publishedArticle(db, lang, slug)`, `publishedSiblings(db, slug)`, `publishedBySchool(db, lang, school, limit)`, `allPublished(db)`, `insertArticle(db, row)`(published_at은 `CASE WHEN ?1 = 'published' THEN datetime('now') END` 같은 bind 방식), `findLive(db, {run_id}|{article_id})`, `markUnpublished(db, rows, reason)`.
- 수정: `index.ts`의 `published()` 호출 7곳, `pipeline.ts`의 `saveArticle`·`unpublish`.
- 테스트 추가(`test/db.test.ts`): published만 나오는지, 언어·학교 필터, 정렬·LIMIT, insert 시 published일 때만 published_at, unpublish가 영어+번역을 함께 내리고 events를 남기는지, 이미 unpublished면 0.
- 회귀 확인: `bash scripts/check.sh` 전체 + `scripts/snapshot-diff.sh compare` 동일.
- 파일럿 불필요(작성·검증 흐름 불변, saveArticle은 실제 SQL 테스트로 확인).

### R-2 `index.ts` 나누기
- 나눠서 두 PR: **R-2a** `http.ts`·`admin.ts`·`feeds.ts` 분리, 관리 응답 no-store, 잘못된 JSON 400 / **R-2b** `routes.ts`·`pages/*`·`pages/parts.ts` 분리, null → 404 방식.
- 옮기기만 한다. 마크업 문자열은 한 글자도 바꾸지 않는다(디자인·문구 수정 금지, 5-3).
- 테스트 추가(`test/admin.test.ts`): 토큰 없음·틀림 401, 경로 없음 404(토큰 있을 때), 잘못된 JSON 400, unpublish 인자 누락 400. 라우팅 표 테스트: 각 정규식이 기존과 같은 경로를 받는지(끝 `/` 포함).
- 회귀 확인: `bash scripts/check.sh` 전체(15·20·30·40 핵심) + snapshot-diff 동일(공개 페이지·피드 바이트 동일). 관리 응답은 헤더만 달라짐.
- 회귀 위험: 모든 공개 페이지, sitemap/rss/llms, 관리 경로 401.

### R-3 파이프라인 폴더화와 `writeForSchool` 단계 함수 (고위험 → 교차 검토)
- **R-3a** 파일 이동만: `pipeline.ts` → `pipeline/{types,run,collect,extract,write}.ts`. import 경로만 바뀜. `index.ts`(또는 R-2 후 `admin.ts`)의 import 수정.
- **R-3b** 단계 함수: `checkMonthlyLimit` → `pickMaterial`(사실·소식·이전 글·안내 주제·entities) → `draft` → `evaluateAndRevise`(규칙+근거, 고쳐 쓰기 1회, 결과·첫 원고) → `saveEnglish`(slug, 출처, 저장, revisions, guide_attempts, used_by, 알림) → `translateAll`. AI 함수 묶음(`{write, revise, translate, ground, extract}`)을 인자로 받는다.
- 지켜야 할 불변식(테스트로 고정):
  1. 근거 검사가 실패·예외면 held(fail closed). 고쳐 쓰기는 최대 1회, 고친 뒤 **같은 검증 전체**를 다시 한다.
  2. 고쳐 쓸 수 없는 문제(중복·길이·검사 불가)는 바로 held.
  3. held여도 쓴 소식은 `used_by`로 소모, 안내 글은 `guide_attempts`에 기록.
  4. 번역은 영어가 통과한 경우에만, 번역 검증 실패는 번역만 held.
  5. 상태는 `AUTO_PUBLISH === "true"`일 때만 published.
  6. DB 쓰기 순서와 내용이 현재와 같다(articles → verification_results+events → revisions → guide_attempts → used_by).
- 테스트 추가(`test/pipeline-write.test.ts`, 실제 SQL 도우미 + AI 대역): 위 1~6 각각, 월 한도, 소식 없을 때 안내 글 선택, skip 응답.
- 회귀 확인: `bash scripts/check.sh` 전체 + snapshot-diff 동일 + **`./scripts/pilot.sh`(RUNS=2, API 비용 발생)** 결과를 직전 파일럿과 비교(게시/보류 비율, 보류 사유 종류), 게시 글 1편 이상을 사람이 원문과 대조해 qa-report에 기록(10-3).
- 회귀 위험: 자동 글 게시 전체, 안내 글, 번역, 월 한도. **검증을 약하게 만드는 변경이 섞이면 안 된다** — 교차 검토에서 `verify.ts`·`grounding.ts`·`generate.ts` diff가 0인지 확인.

### R-4 글 교체 관리 API `/admin/rewrite` (고위험 → 교차 검토, 사람만 호출)
- 요청: `POST /admin/rewrite {"article_id": N, "reason": "…"}`. N이 번역이면 원본 영어 글로 바꿔 처리. `run_id` 일괄은 받지 않는다(한 번에 한 편).
- 처리 순서(한 요청 안에서):
  1. 원본·번역 조회. 원본이 published/verified/held이면 영어+번역을 unpublished로(`article_events` reason = `rewrite: <reason>`). 이미 unpublished이고 후속 글이 없으면 그대로 진행(재호출 가능 = 멱등).
  2. 원본이 쓴 소식(`used_by = N`)의 `used_by`를 NULL로. 안내 글이면 같은 주제를 다시 쓰도록 표시.
  3. **그 소식(또는 그 주제 사실)만으로** R-3의 단계 함수를 그 학교 하나에 대해 실행(전체 `/admin/run` 아님). 월 한도는 적용하지 않는다(교체는 순증 0).
  4. 새 글 저장 후 옛 글에 `article_events`(`unpublished → unpublished`, reason `replaced by #새id`)로 연결 기록, 안내 글이면 `guide_attempts` 행을 새 article_id·outcome으로 UPDATE(삭제 아님).
  5. 새 글이 held이거나 작성 오류면: 옛 글은 내려간 채로 두고(문제 글을 다시 올리지 않음), 소식은 되돌린 상태로 남겨 응답에 그 사실을 적는다. 다시 호출하면 3단계부터.
- 사람 결정 필요(R-4 착수 전):
  - **slug(P-10)**: A) 새 slug(현재 방식, 옛 URL 404) / B) 옛 URL → 새 URL 301(리디렉트 저장용 마이그레이션 필요) / C) 옛 행의 slug를 바꿔 새 글이 같은 slug를 씀(데이터 변경, 같은 URL 유지). 추천 **A**로 시작(스키마·과거 데이터 변경 없음), 교체된 3편의 주소 손실은 seo가 영향 평가 후 B를 backlog로. 같은 URL 유지가 중요하다고 판단하면 C.
  - 교체 사유를 작성 AI에 전달할지: 전달하면 작성 지시 변경(파이프라인 동작 변경)이므로 **이번에는 전달하지 않음**을 추천.
- 테스트 추가(`test/rewrite.test.ts`): 원본·번역 함께 내림, 번역 id로 호출해도 원본 처리, 소식 되돌림이 그 글의 것만, 새 글이 되돌린 소식만 사용, 월 한도 무시, held 시 옛 글 미복구·재호출 가능, 안내 글 UPDATE, 토큰 없이 401.
- 회귀 확인: `bash scripts/check.sh` 전체(40에 `POST /admin/rewrite 401` 추가) + snapshot-diff 동일 + **로컬 파일럿에서 교체 1회**(pilot.sh에 `REWRITE=<id>` 선택 실행 추가, 로컬 DB만) 결과를 사람이 원문과 대조.
- 운영: 호출은 사람만(운영 데이터 변경, CLAUDE.md 10-4). runbook에 정확한 curl과 토큰을 채팅에 붙이지 않는 방법을 release가 적는다. 운영 배포는 사람.
- 회귀 위험: unpublish, 월 한도, 안내 글, 공개 목록·sitemap(내려간 글 제외).

### R-5 보류 글 읽기 화면
- `GET /admin/held?format=html`: 보류 글마다 id·학교·언어·생성일·원본(번역이면), 제목·요약·본문(`markdownToHtml`), 문제 목록(근거 검사 문장 단위), 고쳐 쓰기 전 첫 문제(`article_revisions`), 출처. `<meta name="robots" content="noindex">`, no-store, 공개 `page()` 틀이 아니라 관리용 최소 틀(canonical·hreflang·JSON-LD 없음). 토큰 형식 없이 JSON은 현재 그대로.
- 사용법(runbook): 사람이 `curl -H "authorization: Bearer …" "<주소>/admin/held?format=html" -o held.html` 후 파일을 연다(브라우저가 Bearer 헤더를 보낼 수 없으므로). 대안인 로컬 변환 스크립트보다 운영자 단계가 적어 추천.
- 테스트: 401, 보류 글만(게시 글 미포함), 본문 HTML 이스케이프, noindex·no-store 헤더.
- 회귀 확인: `bash scripts/check.sh` 전체(40에 `GET /admin/held?format=html 401`) + snapshot-diff 동일. 파일럿 불필요.
- 위험: 일반(읽기 전용). 보류 글 본문이 공개 경로에 나오지 않는지가 핵심 → 401 검사와 crawl이 `/admin/`을 따라가지 않음으로 확인.

### R-6 남은 D1 접근 모으기
- `index.ts`(R-2 후 `pages/*`)·`pipeline/*`·`ispp.ts`에 남은 쿼리를 `db/schools.ts`, `db/sources.ts`, `db/guides.ts`로. 일정을 따로 잡지 않고 해당 파일을 다른 이유로 고칠 때 같이 옮긴다(옮기기만, 같은 PR에서 동작 변경 금지).
- 회귀 확인: check 전체 + snapshot-diff.

## 5. "전부 새로 짜기" 대 "단계적 정리"
| 항목 | 전부 새로 짜기 | 단계적 정리 (R-0~R-6) |
|---|---|---|
| 작업량(추정) | 소스 약 1,900줄 재작성 + 테스트 재구성, 파일럿 여러 차례. 기능 1~2개 분량 × 5~8 | 단계당 PR 1개, 7개. R-3·R-4만 파일럿 |
| 운영 중단 위험 | 한 번에 바꿔 배포 → 문제 원인 찾기 어려움, 롤백 시 기능 전부 되돌아감 | 단계마다 배포·롤백 단위가 작음 |
| 검증기 회귀 | 높음: 오탐·누락 수정 10회 이력이 코드 세부에 있음. 다시 쓰면 같은 문제를 다시 겪음(adopt-report 7장) | 없음: 검증기·지시문 파일은 건드리지 않음 |
| 글 품질 확인 비용 | 파이프라인 전체를 사람이 다시 대조해야 함(API 비용·사람 시간 큼) | R-3·R-4에서만 파일럿 + 대조 |
| 하네스 규칙 | 안정화·동결 규칙과 정면 충돌(대규모 구조 변경 → 8장 중단 조건) | 단계별로 등급·승인 가능 |
| 얻는 것 | 처음부터 깔끔한 구조 | 같은 목표 구조에 도달, 다만 시간이 걸림 |
| 가장 큰 위험 | 숨은 규칙 상실(예: held여도 소식 소모, 번역 숫자 허용 규칙) | R-3에서 흐름 순서가 미세하게 바뀌는 것 → 불변식 테스트로 막음 |

**추천: 단계적 정리.** 사이트가 동작하고, 가장 큰 위험은 코드 구조가 아니라 글 품질과 운영 절차(P-4)에 있다. 새로 짜면 위험이 줄지 않고 검증기 이력을 잃는다.

## 6. 적용 순서와 안정화 기간
- 순서(의존 관계): **R-0 → R-1 → R-2a → R-3 → R-4 → R-5 → R-2b**, R-6은 상시.
  - R-2a(관리·피드 분리)를 R-4·R-5 앞에 두어 새 관리 경로가 `index.ts`를 더 키우지 않게 한다. R-2b(페이지 분리)는 운영 가치가 가장 낮아 뒤로.
- 안정화 기간(~2026-11-27)에는 P0·P1만 한다(CLAUDE.md 4-2). 제안:
  - 글 교체 실수(P-4)는 운영 사고 이력이 있어 ops가 **P1로 분류할 근거가 있다**(1회 중간 단계만 실행, 5-3 근거 ③). P1이면 안정화 중에 R-0 → R-1 → R-3 → R-4까지 진행 가능(R-2a는 생략하고 R-4 경로 한 줄만 `index.ts`에 추가, 처리 코드는 `pipeline/rewrite.ts`).
  - 그 외(R-2, R-5, R-6)는 P2 → 안정화 종료 후 첫 정기 릴리스(최대 5항목)에 넣는다.
  - 이 분류는 ops와 사람이 정한다. 이 문서는 선택지만 제시한다.

## 7. 기능별 구현 지침 (12장)
기능 ID는 PRD가 정한다. 아래 F-00은 하네스 기본 설정의 현재 상태, R-*는 위 4장.

### F-00 프로젝트 기본 설정 (이미 운영 중 — 확인 항목)
| 항목 | 상태 | 메모 |
|---|---|---|
| 폴더 구성 | 있음(제1부 3장) | 목표 구조로 옮기는 것은 R-* |
| 디자인 토큰 | 있음(`render.ts :root`) | `css/tokens.css` 방식 아님(Worker 프로필) |
| 공통 레이아웃, 404 | 있음(`page()`, `notFoundBody`) | |
| robots.txt, sitemap.xml | 있음(동적 생성) | |
| Functions·_middleware·dist-include | 해당 없음 | Worker 프로필. 관리 보호는 `admin()`(목표: `admin.ts`) |
| D1 공용 접근 | 부분(`ispp.ts`만 db 인자) | R-1, R-6 |
| migrations | 0001~0006 | 다음 파일부터 되돌리기 주석 |
| .gitignore | 있음 | R-0에서 `.baseline/` 추가 |
| .dev.vars.example | 만들지 않음(결정됨) | 이름 목록은 CLAUDE.md 10-1 |
| access-matrix.txt | 있음(관리 4, 내부 파일 4) | R-4, R-5에서 각 1줄 추가 |
| `bash scripts/check.sh` 전체 실행 | 가능, 전체 PASS | |

### R-0 ~ R-6
- 만들 파일·수정할 파일·테스트·회귀 확인·위험도: 제2부 4장의 각 항목.
- 고위험(교차 검토 대상): **R-3, R-4**.
- 회귀 시 QA 재확인 목록: R-1(공개 페이지 전체, unpublish) / R-2(공개 페이지 전체, 피드, 관리 401) / R-3(자동 글 게시·보류·번역·안내 글·월 한도) / R-4(unpublish, 안내 글, 목록·sitemap) / R-5(관리 401, 공개 페이지에 보류 글 없음).

## 8. 결정 기록 (ADR)
| 번호 | 결정 | 대안 | 이유 | 날짜 |
|---|---|---|---|---|
| ADR-1 | 단계적 정리(R-0~R-6) | 전부 새로 짜기 | 운영 중, 검증기 이력 보존, 하네스 안정화 규칙 | 2026-11-13 |
| ADR-2 | 공개 페이지는 Worker 서버 렌더링 유지, 정적 자원 설정 금지 | Pages 정적 + Functions | 내부 문서 비공개가 구조로 보장됨, 현재 동작 | 2026-11-13 |
| ADR-3 | 회귀 기준 = 스냅샷 바이트 비교 + node:sqlite 실제 SQL 테스트 | 새 테스트 라이브러리(vitest-pool-workers 등) | 새 라이브러리 없이 가능 | 2026-11-13 |
| ADR-4 | 검증기·AI 지시문 파일은 정리 범위에서 제외 | 같이 모듈화 | 가장 자주 바뀌고 품질 직결, 이동만으로도 이력 추적이 어려워짐 | 2026-11-13 |
| ADR-5 | AI 호출은 함수 인자로 주입(기본값 실제 함수) | 전역 교체·모듈 모킹 | 흐름 테스트 가능, 도구 추가 없음 | 2026-11-13 |
| ADR-6 | 글 교체는 한 편 단위 관리 API, 먼저 내리고 다시 씀, 실패 시 옛 글 미복구 | 새 글 통과 후 교체 | 교체 사유가 대개 문제 내용(학생 실명 등)이라 즉시 내리는 쪽이 안전 | 2026-11-13 (사람 확인 필요) |
| ADR-7 | 교체 시 slug: 새 slug(A) 추천 | 301(B), slug 재사용(C) | 스키마·과거 데이터 변경 없음 | 사람 결정 대기 |
| ADR-8 | 보류 글 보기는 기존 관리 경로의 HTML 형식 | 로컬 변환 스크립트, 공개 관리 화면 | 운영자 단계 최소, 인증 방식 그대로 | 2026-11-13 |

## 9. 점검
- [ ] PRD의 모든 기능에 구현 지침 — **PRD 없음.** 기존 기능(adopt-report 8장)은 동작 중이라 신규 지침 없음, 정리 단계는 R-*로 작성. PRD가 나오면 기능 ID 대조 필요
- [x] 모든 화면이 라우트 표에 (현재 코드 기준 공개 화면 6종 + 피드 4 + 관리 4, 목표 관리 2 추가)
- [ ] 공개 URL이 seo-plan과 일치 — **seo-plan 없음.** 목표 구조는 공개 URL을 바꾸지 않음
- [x] 회원 전용 경로: 없음. 관리 경로 전부 access-matrix 대상, 추가 경로 명시. `.html` 우회: Worker 정규식 라우팅이라 `/x.html`류는 404(정적 파일 없음)
- [ ] design-spec의 토큰·컴포넌트 매핑 — **design-spec 없음.** 현재 토큰·컴포넌트 표로 대신함
- [x] 개인정보 열마다 권한 (articles 본문, entities, revisions — 공개는 published 글만)
- [x] 배포물 격리: dist-include 해당 없음, 정적 자원 설정 금지 유지, check 40·verify-live로 확인
- [x] 고위험 표시: R-3, R-4
- [ ] tasks.md 순서 — **tasks.md 없음.** 작성 시 6장 순서(R-0 → R-1 → R-2a → R-3 → R-4 → R-5 → R-2b)를 따를 것

### VERDICT
- 결과: NEEDS_APPROVAL
- 단계/대상: S3 / docs/architecture.md (/adopt, 게이트 C)
- 근거: 현재 구조·목표 구조(R-0~R-6)·비교·ADR 작성. PRD·design-spec·seo-plan·tasks.md가 없어 해당 대조 항목은 미확인. 사람 결정 필요: ① 구조 승인(교차 검토 권장) ② R-4를 P1로 보고 안정화 중 진행할지 ③ 교체 시 slug 정책(A/B/C, 추천 A) ④ ADR-6 교체 순서
- 다음 담당: 사람 (교차 검토 `/review-pack architecture` 후 게이트 C 승인)
