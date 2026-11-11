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
| `/admin/run`, `/admin/held`, `/admin/unpublish` | `Authorization: Bearer $ADMIN_TOKEN` 필요 |

글 페이지에는 BlogPosting(+SpeakableSpecification), FAQPage, BreadcrumbList, 학교 페이지에는 EducationalOrganization, 비교 페이지에는 ItemList JSON-LD가 들어갑니다.

## 자동 발행 파이프라인 (매일 01:17 UTC)

학교마다 한 번에 하나씩, 아래 순서로 돕니다. 한 단계가 실패해도 다음 학교는 계속 진행합니다.

1. **수집** `src/collect.ts` — `schools.news_feed`(RSS/Atom)에서 새 소식을 `source_items`에 저장
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
npx wrangler dev --var ADMIN_TOKEN:localtest
```

```bash
npm test
```

## 배포 (사용자 승인 후)

```bash
npx wrangler d1 create ischoolwiki
```

출력된 `database_id`를 `wrangler.toml`에 넣고:

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
- [x] 테스트 16개 (검증기가 틀린 수치·지어낸 이름·중복 글을 실제로 거르는지 포함)
- [ ] `ispp-school-api` Worker를 읽고 학교 기본 팩트를 `facts`(`source_kind = 'ispp_api'`)로 넣는 어댑터 작성. 아직 그 Worker의 응답 구조를 모름
- [ ] 파일럿 두 학교(BSB Shunyi, DAIS)의 공식 웹사이트·뉴스 피드 주소 확인 후 `schools` 갱신
- [ ] 파일럿으로 실제 Claude API 호출을 끝까지 돌려 보고 보류율 확인 → 그 뒤 `AUTO_PUBLISH = "true"`
- [ ] About·운영자 표기 페이지: 운영 주체를 어떻게 밝힐지 사업자 결정 필요 (인수인계 문서 7번 참고)
