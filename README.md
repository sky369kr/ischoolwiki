# ischoolwiki

ischoolwiki.com: 아시아 국제학교 위키 + 도시별 비교 + 오토 블로그. Cloudflare Workers + Cron Trigger + D1.

## 구조

| 경로 | 내용 |
| --- | --- |
| `/wiki/{school}` | 학교 개요. 팩트 DB의 항목을 출처 링크와 함께 표로 보여줌 |
| `/compare/{city}-international-schools` | 같은 도시 학교들의 공통 항목 비교표 |
| `/blog/`, `/blog/{slug}` | 영어 글. TL;DR, FAQ, 출처 목록 |
| `/ko/blog/`, `/ko/blog/{slug}` | 한국어 번역 |
| `/sitemap.xml`, `/rss.xml`, `/llms.txt`, `/robots.txt` | 발행된 글 기준 자동 생성 |
| `/admin/run`, `/admin/import-ispp`, `/admin/held`, `/admin/unpublish` | `Authorization: Bearer $ADMIN_TOKEN` 필요 |

글 페이지에는 BlogPosting(+SpeakableSpecification), FAQPage, BreadcrumbList, 학교 페이지에는 EducationalOrganization, 비교 페이지에는 ItemList JSON-LD가 들어갑니다.

## 자동 발행 파이프라인 (매일 01:17 UTC)

학교마다 한 번에 하나씩, 아래 순서로 돕니다. 한 단계가 실패해도 다음 학교는 계속 진행합니다.

0. **myispp 기본 팩트** `src/ispp.ts` — 실행마다 한 번 `https://myispp.com/data/master.json`을 읽어 `schools.ispp_school_id`가 있는 학교의 `ispp_api` 팩트를 통째로 바꿉니다. 학비 데이터(`isdFees`)만 쓰고, myispp 상태가 `verified`이며 `isdFees.source`가 **그 학교 자체 도메인의 https URL**일 때만 넣습니다. 추정치(`tuitionRange`), 계산값(`firstYearCost`, `earlyBird`), 출처 없는 필드, 금액 없는 항목, 영어 이름이 없는 항목은 넣지 않습니다. 학년·학년도는 `unit`에 넣어 검증기가 글 속 숫자로 확인할 수 있게 합니다. myispp를 못 읽으면 아무것도 지우지 않습니다.
1. **수집** `src/collect.ts` — `schools.news_feed`에서 새 소식을 `source_items`에 저장. RSS/Atom이면 피드로, 아니면 뉴스 목록 HTML로 읽고 같은 사이트·같은 경로 아래의 `/news/YYYY/M/D/` 링크만 받음
2. **사실 추출** — 새 소식 페이지를 읽고 Claude가 사실과 고유명사를 뽑음. **원문에 인용문이 그대로 있고 그 인용문에 값이 들어 있을 때만** `facts` / `entities`에 저장
3. **글 생성** `src/generate.ts` — 팩트 DB와 새 소식만 재료로 영어 글 작성. 재료가 부족하면 모델이 `skip`으로 거절할 수 있음. 새 소식이 없으면 쓰지 않음. 월 최대 편수는 `MAX_POSTS_PER_SCHOOL_PER_MONTH`
4. **자동 검증** `src/verify.ts` — 하나라도 걸리면 `held`로 보류하고 `ALERT_WEBHOOK_URL`로 알림
   - 글 속 모든 숫자가 팩트 DB 값과 정확히 일치 (올해·내년 연도만 예외, 목록 번호는 제외)
   - 대문자 고유명사가 학교명·도시·국가·`entities`·팩트 값·커리큘럼 용어 목록에 있음 (영어만)
   - 같은 학교 기존 글과 제목이 같거나 본문 5-gram 유사도 0.3 이상이면 중복
   - 본문 600자 미만이면 보류
5. **번역** — 검증을 통과한 글만 한국어로 번역하고, 번역본도 숫자 검증을 다시 거침
6. **발행** — `AUTO_PUBLISH = "true"`일 때만 `published`. 기본값은 `"false"`라서 검증 통과 글도 `verified`에 머무름

모든 상태 변화는 `article_events`에 남고, `POST /admin/unpublish {"run_id": "..."}`로 한 번의 실행에서 나온 글을 한꺼번에 내릴 수 있습니다.

글 생성·추출·번역은 `claude-opus-5-5`를 쓰고, 안전 분류기가 요청을 거절할 때 다른 모델로 이어 쓰는 서버 측 fallback(`fallbacks: "default"`)을 켜 두었습니다.

### 검증의 알려진 한계

- 문장 첫 단어로 혼자 나온 고유명사(예: "Harvard admitted…")는 잡지 못합니다. 두 단어 이상 이어진 이름(예: "Harvard University")은 잡습니다.
- 숫자와 고유명사만 봅니다. "학생들이 만족한다" 같은 서술형 주장이 사실인지는 보지 않습니다.

## 로컬 실행

```bash
npm install
```

```bash
npm run db:migrate:local
```

```bash
npx wrangler d1 execute ischoolwiki --local --file seeds/pilot.sql
```

```bash
npx wrangler d1 execute ischoolwiki --local --file seeds/bsb-shunyi-fees.sql
```

```bash
npx wrangler dev --var ADMIN_TOKEN:localtest
```

```bash
npm test
```

## 배포 (사용자 승인 후)

D1은 이미 만들어져 있고 `database_id`가 `wrangler.toml`에 들어 있습니다. 새 마이그레이션이 생기면:

```bash
npm run db:migrate:remote
```

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

```bash
npx wrangler secret put ADMIN_TOKEN
```

그다음 `wrangler.toml`의 `routes` 주석을 풀고 `npm run deploy`. 도메인 연결은 외부에 공개되는 작업이므로 사용자 확인 후에만 합니다.

## 현재 상태와 남은 일

- [x] 라우팅, 템플릿, Schema.org, sitemap/RSS/llms.txt/robots.txt
- [x] D1 스키마, Cron 파이프라인, 자동 검증, 버전·일괄 내리기
- [x] 테스트 37개 (검증기가 틀린 수치·지어낸 이름·중복 글을 실제로 거르는지 포함)
- [x] myispp 기본 팩트 어댑터 (`src/ispp.ts`). 조사 결과 `ispp-school-api` Worker는 게시글·회원 API라 학교 데이터가 없고, 학교 데이터는 myispp.com의 정적 `/data/master.json`에 있음. `tuition-collector` Worker(KV)는 제3자 사이트에서 긁은 값이고 출처 URL이 없어 쓰지 않음
- [x] BSB Shunyi 학비: myispp의 출처가 URL이 아니어서 어댑터로는 0건. 대신 학교가 공개한 2026-2027 학비 PDF 두 개(학비표·학비 정책)에서 40건을 `seeds/bsb-shunyi-fees.sql`로 넣음(`source_kind = 'manual'`, 은행 계좌·연락처는 제외). myispp 가져오기는 `ispp_api`만 지우므로 이 팩트는 유지됨. 다음 학년도 학비표가 나오면 이 시드를 새로 만들어야 함
- [x] 원격 D1 `ischoolwiki` 생성(APAC), 마이그레이션 0001~0003 적용 (`d1_migrations`에 기록되어 있어 `npm run db:migrate:remote`가 다시 실행하지 않음). 원격에 `seeds/pilot.sql`, `seeds/bsb-shunyi-fees.sql` 적용. DAIS의 `ispp_api` 팩트는 배포 후 첫 실행 때 들어옴
- [x] 파일럿 두 학교 모두 유료 고객(`is_client = 1`, 2026-11-11 운영자 확인)
- [x] 파일럿 두 학교 주소 (`seeds/pilot.sql`). 둘 다 RSS가 없어 뉴스 목록 페이지를 읽음. 로컬 실행에서 BSB Shunyi 20건, DAIS 11건 수집 확인
- [x] 운영자 정보 `/about`, `/ko/about`, 하단 표기. 상호·대표자·사업자등록번호·브랜드만 공개하고 주소는 뺌 (`src/operator.ts`)
- [x] 고객 학교 표시: `schools.is_client = 1`이면 그 학교의 개요·글 페이지에 유료 서비스 관계를 밝히는 문구가 나옴
- [x] 2차 검증(근거 검사, `src/grounding.ts`): 규칙 검증 뒤 모델이 영어 글의 문장마다 팩트·뉴스에 근거가 있는지 읽고, 근거 없는 추론·일반화·평가 문장을 `unsupported_claim`으로 보류함. 검사가 실패하면 보류(fail closed). 한국어 번역은 통과한 영어 글을 옮긴 것이라 숫자 검사만 함
- [x] 팩트 인용문 저장: 마이그레이션 0004로 `facts.quote` 추가. 학교 사이트에서 추출한 팩트는 원문 문장을 함께 저장해 나중에 값을 감사할 수 있음(myispp·수동 팩트는 NULL). **원격 D1에는 아직 0004를 적용하지 않았음** — 배포 전에 `npm run db:migrate:remote` 필요
- [x] 작성 어조(`src/generate.ts`): 학교가 공개한 내용을 담담하게 전달. 칭찬·비판 같은 평가 없음, 다른 학교와 비교 없음, 자료에 없는 내용은 부모에게 꼭 필요한 것만 끝부분에 한두 문장으로 중립적으로 언급. 예시로도 팩트에 없는 숫자·학년을 쓰지 않음
- [ ] 파일럿으로 실제 Claude API 호출을 끝까지 돌려 보고 보류율 확인 → 그 뒤 `AUTO_PUBLISH = "true"`
  - `./scripts/pilot.sh`: 로컬 D1을 새로 만들고 시드를 넣은 뒤 파이프라인을 한 번 돌려 글·보류 사유를 보여 줌. `ANTHROPIC_API_KEY`가 환경에 있어야 함. 클라우드 세션은 이 이름을 환경 변수에서 걸러내므로 클라우드 환경 변수에는 `ISCHOOLWIKI_ANTHROPIC_KEY=키`로 넣음(스크립트가 둘 다 읽음). 키 없이 돌린 2026-11-11 시험에서 myispp 가져오기(DAIS 10건)와 뉴스 수집(BSB 20건, DAIS 11건)까지 확인
