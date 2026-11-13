# SEO 계획 (v1 초안 · 2026-11-13 · /adopt 역기획)

- 작성: seo 에이전트 (기획 모드, 현재 운영 중인 공개 페이지 기준)
- 상태: **초안, 사람 승인 전**. 코드·문구는 바꾸지 않았다. 이 문서의 문구·규칙 변경은 모두 "제안"이며 적용은 사람 승인 후 (CLAUDE.md 15장).
- 전제(2026-11-12 결정): 주 독자는 전 세계 영어권 부모, 목표는 구글 검색과 AI 답변(ChatGPT·Perplexity 등) 노출. 영어 기본, 글만 한국어 자동 번역. 네이버는 주 대상이 아니다(한국어 독자는 부차적).
- 근거 자료: `src/index.ts`, `src/render.ts`, `src/pipeline.ts`(슬러그), `src/generate.ts`(작성 지시), `wrangler.toml`, 운영 주소 `https://ischoolwiki.sky-b9d.workers.dev` 실제 응답(curl, 2026-11-13), WebSearch 결과(구글 계열 결과 유형 참고용).
- 표기: 검색량·클릭 수는 도구로 확인하지 못했다 → 전부 "측정 필요". 추정은 "(추정)".
- PRD.md가 아직 없다. 3장 끝의 "PRD 10장 SEO 요구사항 후보"는 planner가 PRD를 쓸 때 옮겨 넣는다.

---

## 0. 현재 상태 요약 (코드 + 운영 응답 확인)

### 0-1. 라우트와 메타 생성 방식
| 페이지 | URL 규칙 (`src/index.ts`) | `<title>` | meta description | h1 | canonical | hreflang | Schema.org |
|---|---|---|---|---|---|---|---|
| 첫 화면 | `/` | "International schools in Asia \| iSchoolWiki" (고정) | 고정 문장 1개 | "International schools in Asia, from their own published sources" | `SITE_URL/` | 없음 | WebSite, ItemList(학교) |
| 글 목록(영) | `/blog/` (`/blog`도 200) | "Articles \| iSchoolWiki" | "Articles" (제목과 같음) | "Articles" | `/blog/` | en↔ko | 없음 |
| 글 목록(한) | `/ko/blog/` | "국제학교 글 모음 \| iSchoolWiki" | "국제학교 글 모음" | 같음 | `/ko/blog/` | en↔ko | 없음 |
| 글(영) | `/blog/<slug>` | 글 제목 + " \| iSchoolWiki" | 글의 tldr | 글 제목 | 자기 주소 | 같은 slug로 게시된 언어끼리 | BlogPosting(+about EducationalOrganization, citation, speakable), FAQPage, BreadcrumbList |
| 글(한) | `/ko/blog/<slug>` (영어 slug 그대로) | 번역 제목 + 브랜드 | 번역 tldr | 번역 제목 | 자기 주소 | en↔ko | 위와 같음, inLanguage ko |
| 학교 | `/wiki/<school>` (bsb-shunyi, dais, bst-tashkent) | 학교 이름 + 브랜드 | "{학교}, {도시}: key facts with sources and articles." (3곳 같은 틀) | 학교 이름 | 자기 주소 | 없음(영어만) | EducationalOrganization(url=학교 공식 사이트, address) |
| 도시 비교 | `/compare/<city>-international-schools` | "International schools in {City}" + 브랜드 | "{title}: a side-by-side comparison with sources." | title과 같음 | 자기 주소 | 없음(영어만) | ItemList |
| 운영자 정보 | `/about`, `/ko/about` | "About" / "운영자 정보" | "Who operates iSchoolWiki" / "iSchoolWiki 운영자 정보" | "About iSchoolWiki" / "운영자 정보" | 자기 주소 | en↔ko | 없음 |
| 404 | 그 외 전부 | "Page not found" | 같음 | 같음 | `/404` (실제 없는 주소) | 없음 | 없음 |

공통 (`src/render.ts` `page()`):
- canonical·og:url = `SITE_URL + path`. `SITE_URL`은 `wrangler.toml`에서 `https://ischoolwiki.com` → workers.dev에서 받은 페이지도 canonical은 ischoolwiki.com.
- og:title, og:description 있음. **og:image 없음**, og:type은 모든 페이지 "article", og:site_name·og:locale 없음.
- hreflang에 **x-default 없음**.
- 모든 페이지 `<head>`의 RSS 링크는 영어 피드 하나(`/rss.xml`).
- 본문은 서버에서 완성된 HTML (JS로 본문 채우는 것 없음). 학교 페이지의 "All recorded facts" 표는 `<details>` 안(접힘)이지만 HTML에 있음.

### 0-2. 운영 주소 실측 (2026-11-13, workers.dev)
| 확인 | 결과 |
|---|---|
| `/`, `/blog/`, `/ko/blog/`, `/wiki/bst-tashkent`, `/compare/tashkent-international-schools`, `/blog/bst-tashkent-tuition-and-fees-2026-27-british-school-of-tashkent`, 같은 글 `/ko/…`, `/about`, sitemap.xml, rss.xml, llms.txt, robots.txt | 전부 200 |
| title·description·h1·canonical·hreflang | 0-1 표와 일치. 글 en↔ko hreflang 상호 연결 확인 |
| `/blog` `/about/` `/wiki/bst-tashkent/` `/wiki/bst-tashkent?x=1` | 200 (리디렉트 없음, canonical이 하나로 모음) |
| `/nope`, `/ko/`, `/index.html`, `/ko/wiki/bst-tashkent` | 404 |
| 교체 전 글 주소 `/blog/bsb-shunyi-british-school-of-beijing-shunyi-university-offers-2025-2026` | **404** (교체 글은 `…-2025-2026-2`) |
| 응답 헤더 | `X-Robots-Tag` 없음, `cache-control: public, max-age=300` |
| `https://ischoolwiki.com/`, `https://www.ischoolwiki.com/…` | **미확인** (이 환경의 프록시가 연결 실패 502. 도메인 연결 배포 여부를 확인하지 못함) |
| sitemap.xml | 공개 URL 47개(고정 5 + 학교 3 + 비교 3 + 영어 글 18 + 한국어 글 18). `lastmod` 없음 |
| rss.xml | 영어 글 18개. 한국어 피드 없음 |
| llms.txt | 학교 3 + 영어 글 18. 비교 페이지·운영자 정보 없음 |
| robots.txt | 전체 허용, `/admin/`만 제외, AI 크롤러 9종 명시 허용, Sitemap 줄은 ischoolwiki.com |

### 0-3. 측정값
- 영어 글 18편의 `<title>` 길이(브랜드 포함): **72~126자, 18편 전부 60자 초과**. 구글 검색 결과에서 제목은 화면 폭 기준으로 잘리며 대략 50~60자 근처부터 잘린다(추정).
- meta description(= tldr) 길이: 177~334자. 결과 화면에서는 대략 150~160자 근처에서 잘린다(추정). tldr은 AI 답변이 인용하기 좋은 한 문장이라 그 자체는 장점.
- 슬러그 이중 접두사: `pipeline.ts`가 `{학교 slug}-{작성 모델의 slug}`로 만드는데, 모델 slug도 학교 이름으로 시작하는 경우가 많다. 18편 중 `bsb-shunyi-bsb-shunyi-…` 5편, `bst-tashkent-british-school-of-tashkent-…` 3편, `dais-dalian-american-international-school-…` 6편.

---

## 1. 대상 검색 질문

검색량: 전부 **측정 필요** (Search Console 연결 후 노출 질의로 확인). 상위 결과 유형은 2026-11-13 WebSearch로 본 것이며 구글 실제 화면과 다를 수 있다.

관찰(WebSearch): 학교 이름 + fees 류 질의의 상위는 **학교 공식 페이지(nordangliaeducation.com)**와 **학교 디렉터리·비교 사이트**(doris.school, international-schools-database.com, getwherenext.com, edarabia.com, schoozy.com 등)가 차지한다. 디렉터리끼리 같은 학교의 학비 숫자가 서로 다르게 나온다(예: BST Tashkent, BSB Shunyi). → iSchoolWiki가 내세울 수 있는 차이는 "숫자마다 학교 원문 출처"다. 디렉터리 중 하나는 BST를 캠퍼스별(Sayram, Kalandar)로 나눠 싣는다(이 사이트는 학교 하나로 다룸 → 9장 확인 필요 항목).

| 질문/키워드 (영어권 부모 말투) | 의도 | 구글 상위 유형 (관찰/추정) | 네이버 | 담당 페이지 |
|---|---|---|---|---|
| British School of Tashkent fees 2026 / BST Tashkent tuition 2026-27 | 정보 | 공식 학비 페이지, 디렉터리 (관찰) | 대상 아님 | 학비 글 `/blog/bst-tashkent-tuition-and-fees-2026-27-…`, 학교 `/wiki/bst-tashkent` |
| BSB Shunyi fees 2026-2027 / British School of Beijing Shunyi tuition | 정보 | 공식 학비 페이지·PDF, 디렉터리 (관찰) | 대상 아님 | 학비 글 `…-programmes-and-fees-2026-2027`, `…-early-years-…-fees-…`, `/wiki/bsb-shunyi` |
| Dalian American International School fees / DAIS tuition 2026 | 정보 | 디렉터리, 공식 (관찰) | 대상 아님 | 학비 글 `/blog/dais-…-fees-2026-27`, `/wiki/dais` |
| BSB Shunyi IB results 2026 / British School of Beijing IB average | 정보 | 공식 뉴스, 디렉터리 (관찰) | 대상 아님 | 결과 글 `…-2026-igcse-and-ib-diploma-results` |
| British School of Tashkent A level results / BST GCSE results | 정보 | 공식 뉴스 (추정) | 대상 아님 | 결과 글 `…-gcse-a-level-results-2025-26` |
| Does BSB Shunyi offer A levels or IB? / BSB Shunyi curriculum | 정보 | 공식, 디렉터리 (추정) | 대상 아님 | `/wiki/bsb-shunyi`, A Levels 글 |
| DAIS boarding / Dalian American International School boarding fees | 정보·비교 | 공식 (추정) | 대상 아님 | 기숙 글 2편, `/wiki/dais` |
| AP or A level school in Dalian | 비교 | 디렉터리 (추정) | 대상 아님 | 교육과정 글 `dais-programmes-…`, `/compare/dalian-international-schools` |
| international schools in Tashkent / British schools in Tashkent | 비교 | 디렉터리 목록 (관찰) | 대상 아님 | `/compare/tashkent-international-schools` |
| international schools in Dalian (fees) | 비교 | 디렉터리 목록 (관찰) | 대상 아님 | `/compare/dalian-international-schools` |
| international schools in Beijing | 비교 | 디렉터리 목록, 대형 가이드 (추정) | 대상 아님 | `/compare/beijing-international-schools` (현재 학교 1곳 → 2-4 참고) |
| British School of Tashkent BSO inspection / accreditation | 정보 | 공식, 인증기관 (추정) | 대상 아님 | BSO 글 |
| BSB Shunyi Oxbridge / university offers | 정보 | 공식 뉴스 (추정) | 대상 아님 | 대학 합격 글 `…-2025-2026-2` |
| 타슈켄트 영국국제학교 학비 / 다롄 미국국제학교 기숙사 (한국어) | 정보 | 측정 필요 | 블로그·카페 비중 높음(추정) | `/ko/blog/…` 번역 글 |

제외하는 의도: "best international school in …", "… reviews". 작성 규칙상 평가·순위·후기를 쓰지 않으므로 이 의도를 노리면 검색 의도와 내용이 어긋난다. 비교 페이지는 "목록·사실 비교" 의도만 맡는다.

핵심 질문 5개 (우선 측정 대상, `docs/aeo-prompts.md`와 맞출 후보):
1. British School of Tashkent fees 2026-27
2. BSB Shunyi fees 2026-2027
3. Dalian American International School tuition and boarding
4. international schools in Tashkent
5. BSB Shunyi IB results 2026

---

## 2. 페이지별 설계 (공개 페이지만, 회원 전용 화면 없음)

규칙 표기: **현재** = 코드가 지금 하는 일 / **제안** = 승인 필요.

### P-01 첫 화면
- URL: `/`
- 핵심 의도: 사이트가 무엇인지 + 학교·도시로 들어가는 입구 (브랜드·탐색). 일반 질의("international schools in Asia")로 상위를 노리지 않는다(디렉터리와 경쟁, 학교 3곳으로는 부족 — 추정).
- title 현재: "International schools in Asia | iSchoolWiki"
- title 제안: "International schools in Beijing, Dalian and Tashkent | iSchoolWiki" — 도시 목록은 DB의 활성 학교 도시로 만들고, 4곳 이상이면 "in Asia"로 돌아간다. (도시명이 실제 다루는 범위를 정확히 알려 줌)
- description 현재 유지 가능. 제안: "Sourced profiles, fees and city comparisons for {n} international schools in {cities}. Every figure links to the school's own published source." (n·도시는 DB 값)
- h1: 현재 유지.
- 필수 섹션: 학교 카드(학비·학년, 출처 링크), 도시 칩, 최근 글 — 현재 있음.
- 내부 링크: 나감 → 모든 학교, 모든 비교, 최근 글 6편. 들어옴 → 모든 페이지 헤더.
- 구조화 데이터 후보: WebSite, ItemList (현재) + Organization(운영자, about 페이지와 일치) — aeo 확정.

### P-02 학교 프로필
- URL: `/wiki/<school-slug>`. slug는 학교 약칭 그대로(bsb-shunyi, dais, bst-tashkent). **바꾸지 않는다**(이미 공개·색인 대상).
- 핵심 의도: "{학교} fees / curriculum / year groups" — 학교 이름 검색에 대한 요약 답.
- 핵심 키워드: 학교 정식 이름 + 약칭(BSB Shunyi, DAIS, BST) / 보조: fees, tuition, curriculum, A level, IB, AP, boarding.
- title 현재: 학교 이름만 (예: "The British School of Tashkent | iSchoolWiki").
- title 제안 (데이터 기반, 없는 항목은 넣지 않음):
  - 학비 사실이 있으면: "{School name}: fees {학년도}, curriculum and facts | iSchoolWiki" (학년도는 tuition 사실의 as_of/값에서. 확인 불가면 연도 생략)
  - 학비가 없으면: "{School name}, {City}: curriculum and facts | iSchoolWiki"
  - 60자를 넘으면 브랜드 꼬리를 뗀다(P-04 규칙과 같음).
- description 현재: 세 학교가 같은 틀("…: key facts with sources and articles.").
- description 제안: "{School name} in {City}, {Country}: {교육과정 목록}. Annual tuition {최저}–{최고} {통화} ({학년도}) from the school's fee schedule. {n} facts, each with its source." — `summary.ts`가 이미 만드는 값만 사용, 없으면 그 문장 생략.
- h1: 학교 이름 (유지). 약칭이 있으면 h1 아래 메타 줄에 "(BSB Shunyi)"처럼 약칭 표기 제안 — 약칭으로 검색하는 부모를 위해. 약칭 출처는 학교 공식 사이트 표기여야 함.
- 필수 섹션: 요약표(위치, 교육과정, 학년, 연간 학비+출처, 공식 사이트) — 현재 있음 / 글 목록 — 있음 / 전체 사실 표 — 있음(접힘).
- 제안 섹션(승인 필요, PRD 범위 확인): "Fees" "Curriculum" 같은 주제별 짧은 h2 요약이 있으면 학교 이름+주제 질의에 직접 답이 됨. 지금은 같은 내용이 글(학비 안내 글)에 있으므로 우선 **학교 페이지에서 해당 주제 글로 눈에 띄는 링크**만 두는 것을 먼저 제안.
- 목차: 필요 없음(섹션 3개).
- 내부 링크: 들어옴 ← 첫 화면, 비교, 글(빵부스러기·정보 상자). 나감 → 비교, 글 최대 20편. 제안: 같은 도시 다른 학교(비교 페이지에 2곳 이상일 때).
- hreflang: 없음(영어만). 한국어 판 없음 → 2-6 참고.
- 구조화 데이터 후보: EducationalOrganization(현재). 제안: `@id`를 이 페이지 URL로 두고 `url`은 공식 사이트 대신 `sameAs`만 쓰는 방식 검토 — aeo 확정.

### P-03 도시 비교
- URL: `/compare/<city>-international-schools` (유지).
- 핵심 의도: "international schools in {City}" — 목록과 학비·교육과정 나란히 보기.
- title 현재: "International schools in {City} | iSchoolWiki".
- title 제안: 학교 2곳 이상이면 "International schools in {City}, {Country}: fees and curricula compared". 1곳이면 아래 결정 사항.
- description 제안: "{n} international schools in {City} listed with annual tuition, curricula and year groups, each figure from the school's published source."
- h1: title과 같은 틀 (유지).
- 필수 섹션: 학교 카드, "Side by side" 표(2곳 이상일 때) — 현재 있음.
- **결정 필요 — 학교 1곳인 비교 페이지** (현재 베이징·다롄·타슈켄트 3곳 모두 학교 1곳):
  - 제목은 "International schools in Beijing"인데 내용은 학교 1곳 카드뿐 → 질의 의도(여러 학교 목록)와 어긋나고 학교 페이지와 내용이 겹친다.
  - 선택지 A: 학교 2곳 이상이 될 때까지 `noindex, follow` + sitemap·llms.txt 제외 (페이지·링크는 유지). 추천.
  - 선택지 B: 그대로 색인. 학교가 늘면 자연히 해소.
  - 선택지 C: 1곳일 때 비교 링크를 숨김. (화면 변경, 디자인 범위)
- 내부 링크: 들어옴 ← 첫 화면 칩, 학교 페이지. 나감 → 학교. 제안: 다른 도시 비교 링크.
- 구조화 데이터: ItemList(현재).

### P-04 글 (영어)
- URL: `/blog/<slug>`. slug 규칙은 3-3.
- 핵심 의도: 글마다 하나 (학비, 결과, 기숙, 교육과정, 입학, 학교 소식).
- title 현재: 글 제목(문장형, 학교 정식 이름 포함) + " | iSchoolWiki" — 18편 전부 60자 초과.
- title 제안 (둘 중 하나, 승인 필요):
  - A (코드만, 작성 파이프라인 무변경): 제목이 60자를 넘으면 브랜드 꼬리 " | iSchoolWiki"를 붙이지 않는다. 영향 적고 바로 가능.
  - B (작성 지시 변경, 파일럿 필요): 작성 결과에 `seo_title`(60자 이하, "{학교 약칭 또는 이름} {주제} {학년도}" 순, 예: "BST Tashkent fees 2026/27: tuition by year group")을 따로 받는다. h1은 지금 제목 유지. 검증기가 seo_title의 숫자·이름도 검사해야 하므로 `verify.ts` 대상 확대가 필요 → 고위험(교차 검토).
  - 추천: A 먼저, B는 Search Console 노출·클릭 데이터(측정 필요)를 보고 판단.
- description: tldr 그대로 (유지). 이유: 학교 출처 숫자가 들어간 한 문장이라 검색 결과·AI 인용 모두에 유리(추정). 잘림은 감수.
- h1: 글 제목 (유지). 제목 사례: "Tuition and fees for 2026/27 at The British School of Tashkent" — 핵심어(tuition, fees, 학년도, 학교)는 들어 있으나 학교 이름이 뒤에 있음. 작성 지시에 "학교 이름 또는 약칭을 제목 앞쪽에" 추가는 B와 같이 판단.
- 필수 섹션: 요약(tldr), 본문 ## 소제목, FAQ, 출처 — 현재 있음.
- 목차: 900단어 이하라 필요 없음. 앵커 id는 `#sources`만 사용 중(유지).
- 내부 링크: 들어옴 ← 글 목록, 학교 페이지, 첫 화면(최근 6편). 나감 → 학교 페이지, 글 목록. **제안: "More about {학교}" 같은 학교 다른 글 3~5편 목록** (현재 글끼리 서로 링크 없음).
- hreflang: en↔ko (현재, 확인됨). 제안: x-default = 영어 주소.
- 구조화 데이터: BlogPosting, FAQPage, BreadcrumbList (현재). 참고 사실: 구글은 2023년 8월부터 FAQ 리치 결과를 정부·보건 분야 권위 사이트로 제한했다 → 이 사이트에 FAQ 리치 결과는 기대하지 않는다. speakable은 구글 기준 베타·뉴스 대상. 유지 여부와 author·dateModified·image 보강은 aeo가 확정.

### P-05 글 (한국어 번역)
- URL: `/ko/blog/<영어와 같은 slug>` (유지, 3-3).
- 핵심 의도: 한국어로 같은 학교·주제를 찾는 부모(부차 대상).
- title·description·h1: 번역 제목·tldr (현재). 한국어 title은 30~40자 안팎이면 잘림 적음(추정). 길이 측정 필요.
- 내부 링크: 빵부스러기 "홈"·"글 모음"은 `/ko/blog/`, 학교 링크는 영어 `/wiki/…` (한국어 학교 페이지 없음). 헤더 "English"는 `/`로 감 → 제안: 지금 글의 영어판으로 연결.
- hreflang: ko↔en 상호 (확인).

### P-06 글 목록
- URL: `/blog/`, `/ko/blog/` (끝 슬래시 있음이 canonical).
- 의도: 사이트 안 탐색. 검색 유입 목표는 낮음.
- title 제안: "Articles on international schools in {cities} | iSchoolWiki" / "국제학교 글 모음 | iSchoolWiki"(유지).
- description 제안: 현재 "Articles"(제목과 같은 한 단어) → "Articles on fees, results, curricula and boarding at international schools in {cities}, written from each school's published sources." / 한국어 "…학교가 공개한 자료로 쓴 국제학교 학비·입시 결과·교육과정·기숙 글 모음".
- 현재 최대 100편만 표시 → 100편을 넘으면 그 이후 글은 목록에서 빠짐. 학교당 월 12편 한도라 학교 3곳 기준 약 3개월 뒤 도달(추정). 페이지 나누기 또는 학교별 묶음이 필요 → backlog 후보.

### P-07 운영자 정보
- URL: `/about`, `/ko/about`.
- 의도: 신뢰(누가, 어떤 방식으로 쓰는가, 고객 학교 공개). 검색 유입 목표 아님, AI 답변이 출처 신뢰를 판단할 때 쓰일 수 있음(추정).
- title 제안: "About iSchoolWiki: who runs it and how pages are written" / description: "Who operates iSchoolWiki, how articles are written from schools' published sources and checked before publishing, and which schools are clients." (현재 "Who operates iSchoolWiki"는 짧음)
- 구조화 데이터 후보: Organization(운영자) — aeo.

### P-08 404
- 상태 코드 404 정상. 제안: 404 페이지에서 canonical(`/404`)과 og:url을 빼고 `noindex` 추가(낮은 우선순위, 상태 코드 404면 색인되지 않음).

### 2-6. 한국어 페이지 범위 (현재 상태의 영향)
- 한국어가 있는 페이지: 글, 글 목록, 운영자 정보. 첫 화면·학교·비교는 영어만.
- 영향:
  1. 한국어 글에서 학교로 가면 영어 페이지로 넘어간다(언어 단절). 주 독자가 영어권이므로 v1에서는 허용 가능.
  2. 한국어 학교·비교 페이지가 없으니 "다롄 미국국제학교 학비" 같은 한국어 질의는 번역 글만 받는다. 이미 학비 글 번역이 있어 최소한의 답은 있음.
  3. 한국어 학교 페이지를 기계적으로 만들면 표 머리글만 한국어인 얇은 페이지가 될 위험(추정). 만들면 요약표·사실 표의 항목 이름 번역과 hreflang 짝이 함께 필요.
- 제안: v1은 현재 범위 유지. 한국어 학교·비교 페이지는 backlog(근거: 한국어 노출 질의 데이터 — Search Console 측정 후). PRD에 "한국어는 글·글 목록·운영자 정보만"을 명시.
- 네이버: 주 대상이 아니므로 서치어드바이저 등록은 선택. 하더라도 한국어 페이지만 의미 있음. 사람 결정.

---

## 3. 사이트 공통

### 3-1. 도메인 정책
- 대표 주소: `https://ischoolwiki.com` (apex, www 없음). 현재 코드: www → apex 301 (`src/index.ts`, 경로·쿼리 유지) — 코드상 맞음, 운영 동작은 **미확인**(도메인 응답을 이 환경에서 받지 못함).
- **workers.dev 중복**: `ischoolwiki.sky-b9d.workers.dev`가 모든 페이지를 200으로 응답, `X-Robots-Tag` 없음, canonical만 ischoolwiki.com을 가리킴.
  - 도메인 연결 전: canonical이 아직 열리지 않는 주소를 가리켜, 검색엔진이 canonical을 무시하고 workers.dev를 대표로 잡거나 둘 다 보류할 수 있음(추정).
  - 도메인 연결 후 제안(선택, 사람 결정):
    - A (추천): Worker에서 hostname이 `*.workers.dev`이면 apex로 301 (www 처리와 같은 방식). `/admin/*`는 리디렉트에서 뺄지 결정 필요(사람이 workers.dev로 관리 요청을 보내는지 확인). 이미 workers.dev 주소로 퍼진 링크도 살림.
    - B: `wrangler.toml`에 `workers_dev = false` → workers.dev 응답 자체를 끔. 단순하지만 옛 링크는 끊김.
    - 둘 다 적용 후 `harness.config.sh`의 `SITE_URL`을 `https://ischoolwiki.com`으로 바꿔 `verify-live.sh`가 대표 주소를 검사하게 함.
- 끝 슬래시 정책: 글 목록만 끝 슬래시(`/blog/`, `/ko/blog/`), 나머지는 없음 (현재 canonical과 같음). 다른 형태(`/blog`, `/about/`)는 지금 200 + canonical. 제안(낮음): 301로 정규화.
- `.html` 주소 없음(404) — 유지.
- 쿼리 문자열: 200 + canonical 자기 주소 (유지).

### 3-2. canonical 규칙
- 모든 공개 페이지: `https://ischoolwiki.com` + 위 끝 슬래시 정책의 경로. 쿼리 없음.
- 한국어 페이지는 자기 한국어 주소(영어로 모으지 않음).
- 404는 canonical 없음(제안).

### 3-3. URL·슬러그 규칙
현재 (`src/pipeline.ts`):
- 영어 글: `uniqueSlug("en", "{학교 slug}-" + sanitizeSlug(모델이 준 slug))`. `sanitizeSlug`는 소문자 ASCII·하이픈, 70자 자름. 같은 slug가 이미 있으면(상태 무관, 내려진 글 포함) `-2`, `-3`…
- 번역 글: 영어 slug를 그대로 씀 → `/ko/blog/<같은 slug>`. hreflang 짝을 slug로 찾음(`published(env, "AND slug = ?")`).

문제와 제안:
1. **"-2" 접미사와 옛 주소 404** (확인됨): BSB 대학 합격 글을 교체하면서 옛 글은 unpublished, 새 글은 `…-2025-2026-2`. 옛 주소는 404. 학생 실명 규칙으로 BSB 미술 글·커뮤니티 글도 교체 예정(2026-11-13 결정) → 같은 일이 반복됨.
   - 제안 A (추천): 교체 관계를 기록(`articles.replaced_by` 같은 칸, 마이그레이션 필요)하고, 내려진 글 주소로 오면 교체 글로 **301**. 번역 주소도 같은 방식. 교체가 아닌 단순 내리기는 지금처럼 404(또는 410).
   - 제안 B: 교체 글이 옛 slug를 그대로 이어받기(옛 행의 slug를 보관용 값으로 바꾸고 새 글이 원래 slug 사용). 주소가 깨끗하지만 UNIQUE(lang, slug)와 감사 기록 처리 설계가 필요.
   - 이미 생긴 `…-2`는 그대로 둔다(또 바꾸면 주소가 한 번 더 바뀜). 옛 주소 → `-2` 301만 추가.
   - 구조·DB 변경이므로 architect 판단 + 사람 승인. 원격 마이그레이션은 사람.
2. **학교 이름 이중 접두사** (확인됨, 18편 중 14편): 새 글부터 `sanitizeSlug` 결과에서 학교 slug나 학교 정식 이름 단어로 시작하는 부분을 떼고 접두사를 붙이는 규칙 제안(예: `bst-tashkent-tuition-and-fees-2026-27`). 이미 게시된 글 slug는 **바꾸지 않는다**(바꾸면 301 지도 필요, 얻는 것보다 위험 큼 — 추정).
3. 번역 slug: 영어 slug 유지 (현재대로). 한국어 단어 slug는 퍼센트 인코딩으로 공유 시 길고 깨져 보이며, 검색 순위에 URL 단어 영향은 작다고 알려져 있음(추정). hreflang 짝 찾기도 단순하게 유지됨.
4. 새 페이지 유형 URL은 3단계 이하, 영문 소문자·하이픈 (현재 모두 충족).

### 3-4. 다국어(hreflang)
- 방식: 하위 경로 `/ko/`. 영어는 접두사 없음.
- 현재: 글·글 목록·운영자 정보에 en·ko 상호 연결. 번역이 보류되면 영어 글은 자기 자신만 표시(정상).
- 제안: 짝이 있는 페이지에 `hreflang="x-default"` = 영어 주소 추가.

### 3-5. sitemap.xml
- 현재: 공개 페이지 전부(47개), `/admin/` 없음, 404 페이지 없음. 동적 생성(요청마다 D1).
- 제안:
  - `<lastmod>`: 글은 `published_at`, 학교·비교는 그 학교 facts의 최근 기록 시각, 목록·첫 화면은 최신 글 시각. 구글은 lastmod가 꾸준히 정확할 때만 쓴다고 밝힘 → 실제 변경 시각만 넣는다.
  - 2-3 선택지 A를 고르면 학교 1곳 비교 페이지 제외.
  - 50,000 URL 한도까지 한 파일로 충분.

### 3-6. RSS
- 현재: 영어 글 50편, 채널 link가 사이트 주소. 한국어 페이지 `<head>`도 영어 피드를 가리킴.
- 제안(낮음): `/ko/rss.xml` 추가 시 한국어 페이지 head가 그 피드를 가리키게. 네이버 서치어드바이저를 쓸 때만 의미 큼(사람 결정). 신규 라우트이므로 PRD 반영 필요.

### 3-7. llms.txt
- 현재: 학교 3, 영어 글 18(제목+tldr). 형식은 llmstxt.org 제안 형식과 맞음.
- 사실: llms.txt를 실제로 읽어 쓰는 AI 서비스가 어디인지는 공개적으로 확인되지 않았다 → 효과는 측정 필요. 비용이 거의 없으니 유지.
- 제안: "City comparisons" 섹션(비교 페이지, 2-3 결정에 따름), "About / how pages are written"(운영자 정보) 한 줄, 글 100편 넘을 때 학교별 묶음.

### 3-8. robots.txt
- 현재 적절: 공개 페이지 막지 않음, `/admin/` 제외, AI 검색·학습 크롤러 명시 허용(노출 목표와 일치).
- `/api/` 경로는 없음. 회원 전용 경로 없음.
- 참고: `Google-Extended`는 크롤러가 아니라 Gemini 학습 사용 여부 표시. 허용이 목표와 맞는지는 사람 확인(현재 허용).

### 3-9. 404
- Worker가 모든 미정의 경로에 404 + 안내 페이지. 정상.

### 3-10. og·공유
- 제안: og:image(절대 주소, 사이트 공통 1장이라도), og:site_name "iSchoolWiki", og:type은 글만 article·나머지 website, og:locale(en_US / ko_KR). 이미지 파일을 내보내려면 `[assets]` 금지 규칙(11장) 때문에 Worker 라우트로 응답해야 함 → architect 결정.

### 3-11. 내부 링크 구조 (현재)
```
첫 화면 ─┬→ 학교(전부) ─┬→ 비교(자기 도시)
         ├→ 비교(전부)  └→ 그 학교 영어 글(최대 20)
         └→ 최근 글 6 ──→ 학교, 글 목록
헤더: Schools(/#schools) · Articles(/blog/) · About · 한국어(/ko/blog/)
한국어 글 → /ko/blog/, 영어 학교 페이지
```
- 빈 곳: 글 ↔ 같은 학교 다른 글 없음 / 비교 ↔ 다른 도시 없음 / 학교 페이지 → 주제 글(학비 등)이 목록 안에 섞여 있어 눈에 띄지 않음 / 한국어 글끼리 학교 기준 연결 없음.
- 고아 페이지: 없음(check 15가 첫 화면부터 모두 도달 확인). 단 글 목록 100편 제한 이후에는 생길 수 있음.

---

## 4. 콘솔 준비 (사람이 실행, 에이전트는 제출하지 않음)
- Google Search Console: **도메인 속성**(ischoolwiki.com, Cloudflare DNS에 TXT 추가) 추천 — apex·www·http/https를 한 번에 봄. 도메인 연결 배포 후 sitemap 제출: `https://ischoolwiki.com/sitemap.xml`.
- workers.dev는 소유 확인 대상이 아님(하위 도메인을 소유하지 않음) → 3-1의 301/비활성화로 정리.
- Bing Webmaster Tools: 선택. Search Console에서 가져오기 가능. ChatGPT 검색 등 일부 AI 검색이 Bing 색인을 쓴다는 보도가 있으나 이 사이트 영향은 측정 필요.
- 네이버 서치어드바이저: 선택(2-6). 하게 되면 소유 확인 메타 태그 자리(`naver-site-verification`, 값은 사람이 입력) 필요 — 지금 코드에는 없음.
- 측정 시작 항목: 질의별 노출·클릭·평균 순위(1장 핵심 질문 5개), 색인된 페이지 수, workers.dev 노출 여부.

---

## 5. 개선 제안 우선순위표

| 순위 | 제안 | 근거 (확인한 사실) | 예상 효과 | 비용·위험 | 담당 |
|---|---|---|---|---|---|
| 1 | workers.dev → apex 301 (또는 workers_dev 끄기) + 도메인 응답 확인 + `harness.config.sh` SITE_URL 변경 | workers.dev 전 페이지 200, X-Robots-Tag 없음, canonical은 다른 호스트. apex 응답 미확인 | 중복 색인·대표 주소 혼동 방지 (추정) | 코드 몇 줄, `/admin` 예외 결정 필요. 배포는 사람 | 사람 결정 → developer |
| 2 | 교체 글 옛 주소 → 새 주소 301 (교체 관계 기록), 앞으로 교체 시 자동 적용 | 옛 대학 합격 글 주소 404 확인, 같은 방식 교체 2건 더 예정(2026-11-13 결정) | 공유·색인된 옛 주소 유지, 404 감소 | 마이그레이션 + 라우트. 원격 적용은 사람 | architect → developer |
| 3 | 학교 페이지 title·description을 데이터 기반으로 (학비 학년도·교육과정) | "{학교} fees" 류가 핵심 질의, 현재 title은 이름만, description은 3곳 같은 틀 | 학교 이름 질의에서 결과 문구가 의도와 맞음 (추정, 측정 필요) | 코드만, summary.ts 값 재사용, 사실 아닌 값 없음 | developer (문구 승인 후) |
| 4 | 글 title 60자 초과 시 브랜드 꼬리 제거 + 새 글 slug 이중 접두사 제거 | 18편 전부 72~126자, 14편 slug 이중 접두사 | 제목 잘림 감소, 주소 가독성 (추정) | 코드만. 기존 slug는 안 바꿈 | developer |
| 5 | sitemap lastmod, hreflang x-default, og:site_name·og:type 정리 | sitemap에 lastmod 없음, x-default 없음, og:type 전부 article | 재크롤 신호, 언어 기본값 명확화 (추정) | 코드만, 낮음 | developer |
| 6 | 학교 1곳인 비교 페이지 처리 결정 (noindex,follow 추천) | 비교 3곳 모두 학교 1곳, 제목은 복수 목록 의도 | 얇은 페이지·의도 불일치 방지 (추정) | 결정만 필요, 코드 적음 | 사람 결정 |
| 7 | 글 하단 "같은 학교 다른 글" 링크, 비교 페이지 다른 도시 링크 | 글끼리 링크 0, 비교끼리 링크 0 | 크롤 경로·체류 (추정) | 화면 변경 → 디자인 범위 확인 | designer/architect |
| 8 | 글 목록 100편 제한 해소 (페이지 나누기 또는 학교별) | `LIMIT 100`, 월 최대 36편 생성 가능 | 고아 글 방지 | 화면·라우트 추가 → PRD 반영 필요 | backlog |
| 9 | og:image (공통 1장) | og:image 없음 | 공유 미리보기 | 이미지 라우트, 디자인 필요 | architect/designer |
| 10 | about·글 목록 description 보강, 첫 화면 title에 도시명 | description "Articles", "Who operates iSchoolWiki" | 작음 (추정) | 문구 승인 | 사람 승인 → developer |
| 11 | 글 seo_title 별도 생성 (제안 4의 B안) | 4번으로 부족할 때 | 측정 필요 | 작성·검증 변경 = 고위험, 파일럿·교차 검토 | 보류 (데이터 후) |
| 12 | 한국어 학교·비교 페이지, 한국어 RSS, 네이버 등록 | 한국어는 부차 대상(결정) | 측정 필요 | 새 페이지 = 범위 변경 | backlog |

---

## 6. PRD 10장 "SEO 요구사항" 후보 (planner가 PRD에 옮김, QA가 확인 가능한 문장)
1. 모든 공개 페이지(첫 화면, 글 목록 en/ko, 글 en/ko, 학교, 비교, 운영자 정보 en/ko)에 고유한 title, meta description, canonical, og:title, og:description, og:url이 있다. (check 20: title 중복 검사)
2. canonical과 og:url은 `https://ischoolwiki.com` + 정해진 경로(글 목록만 끝 슬래시)이며 쿼리 문자열이 없다.
3. 공개 페이지마다 h1이 정확히 1개이고 제목 단계를 건너뛰지 않는다. (check 20)
4. 공개 페이지 본문은 서버 HTML에 완성되어 있고 JS로 채우지 않는다.
5. 영어·한국어 짝이 있는 페이지는 서로를 hreflang으로 가리키고, x-default는 영어 주소다. (x-default는 승인 시)
6. sitemap.xml에는 게시된 글과 활성 학교·비교 페이지, 고정 페이지만 있고 `/admin/` 경로와 404 주소는 없다.
7. robots.txt는 공개 페이지를 막지 않고 `/admin/`을 막으며, sitemap 주소를 대표 도메인으로 적는다.
8. 정의되지 않은 경로는 404 상태와 안내 페이지를 돌려준다.
9. `www.ischoolwiki.com`의 모든 경로는 같은 경로의 apex로 301 한 번에 간다. (workers.dev 처리는 5장 1번 결정 후 추가)
10. 내려진 글이 다른 글로 교체된 경우, 옛 주소는 교체 글 주소로 301 한 번에 간다. (5장 2번 승인 시)
11. 글 페이지의 모든 `#앵커` 링크는 같은 페이지의 id로 이동한다. (check 30)
12. 페이지에 나오는 학교 숫자·이름은 출처가 있는 facts에서만 온다 — title·description에 쓰는 값 포함. (제안 3 적용 시)
13. 375px 폭에서 표는 가로 스크롤 상자 안에 있고 본문이 넘치지 않는다.

---

## 7. backlog "SEO 제안" 후보 (사람이 backlog.md에 옮김 — 이번 작업은 seo-plan.md만 작성)
- 글 목록 페이지 나누기 또는 학교별 글 목록 (5장 8)
- 한국어 학교·비교 페이지 (5장 12, 근거: 한국어 질의 측정 후)
- 한국어 RSS·네이버 서치어드바이저 (5장 12)
- og:image 라우트 (5장 9)

---

## 8. 측정 필요 목록
- 1장 질의별 검색량·노출·클릭·순위 (Search Console 연결 후)
- apex·www 실제 응답과 301 동작 (도메인 연결 배포 후 `curl -sI`)
- workers.dev 주소가 구글에 색인되어 있는지 (`site:` 검색은 참고만, Search Console 기준)
- 한국어 title 길이 분포, 한국어 질의 유입
- AI 답변 인용 여부 (aeo가 `docs/aeo-prompts.md`로 측정)

## 9. 확인 필요 (SEO 밖이지만 감사 중 발견, 사람·qa 판단)
- 디렉터리 사이트(doris.school)는 BST Tashkent를 Sayram·Kalandar 캠퍼스별로 나눠 싣고 학비도 다르게 적는다. 이 사이트의 BST 학비 글은 학교 공식 2026/27 PDF 기준이다(decisions.md). 그 PDF가 어느 캠퍼스 기준인지, 캠퍼스가 둘이면 글·학교 페이지에 그 사실이 필요한지 사람이 원문으로 확인 필요. 디렉터리 숫자가 맞다는 뜻은 아니다.

---

### VERDICT
- 결과: NEEDS_APPROVAL
- 단계/대상: S1(/adopt) / docs/seo-plan.md 초안
- 근거: 현재 공개 페이지 메타·URL·hreflang·Schema 정리와 운영 응답 실측 완료. workers.dev 중복 처리, 교체 글 301, 학교 1곳 비교 페이지 처리, 문구 제안은 사람 결정 필요. apex·www 응답과 검색량은 미확인(측정 필요).
- 다음 담당: 사람 (게이트 A 전 PRD와 함께 검토)
