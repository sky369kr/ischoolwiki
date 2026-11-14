# 결정 기록
(형식: CLAUDE.md 14장)

## 2026-11-12 · 주 독자와 언어
- 결정: 주 독자는 전 세계 영어권 부모, 목표는 검색·AI 답변 노출. 영어 기본, 한국어는 자동 번역. 화면은 위키식 참고 자료 톤을 유지하되 학교 카드·요약표로 정보를 앞에 둔다. / 이유: 사용자 결정 / 영향: src/index.ts, src/render.ts, src/summary.ts

## 2026-11-12 · 자동 게시
- 결정: `AUTO_PUBLISH = "false"` 유지. 첫 자동 실행 뒤 대기 글을 사람이 읽고 켤지 결정. 도메인 연결도 그 뒤. / 이유: 파일럿 표본이 학교 2곳·글 2건 / 영향: wrangler.toml

## 2026-11-13 · 하네스 v4 적용 방식
- 결정: 하네스 v4를 설치하되 기본 프로필(정적 HTML + Pages)을 이 프로젝트의 Cloudflare Worker + D1 구조로 바꿔 적용. / 이유: Worker가 코드의 라우트만 응답하므로 dist/ 허용 목록 방식이 필요 없고, 원본 안전장치는 Pages 배포만 막아 Worker 배포(`wrangler deploy`)를 막지 못함 / 영향: CLAUDE.md 10~13장, harness.config.sh, .claude/hooks/guard.sh, .claude/settings.json, scripts/check.d/, scripts/snapshot.sh, scripts/crawl.py, scripts/access-matrix.txt, 에이전트·명령 문서 머리의 적용 메모
- 결정: push 정책 A, 보호 브랜치 main. 에이전트는 작업 브랜치에만 커밋·push하고, main 병합과 운영 배포는 사람이 한다. / 이유: 하네스 기본값, Git 연동 배포가 없어 작업 브랜치 push가 공개로 이어지지 않음 / 영향: 지금까지처럼 AI가 main에 직접 합치지 않음
- 결정 (변경, 같은 날): PR 병합은 AI가 한다. 조건은 PR을 거칠 것, 병합 직전 `bash scripts/check.sh` 전체 PASS, 검사한 커밋 SHA로 병합. 운영 배포·원격 DB·비밀 값·AUTO_PUBLISH는 계속 사람만. main 직접 커밋·push와 강제 push는 계속 차단. / 이유: 사람 요청("앞으로 병합 직접 해줘") / 영향: CLAUDE.md 1장 7번, 12장
- 결정: PR #1은 검사 FAIL(도시 비교 페이지 제목 단계 h1→h3)을 같은 PR에서 고치고 전체 PASS 후 병합 (선택지 A) / 이유: 사람 선택
- 결정: `.dev.vars.example`은 만들지 않음 (하네스의 비밀 파일 차단 규칙 `.dev.vars.*`에 걸림). 비밀 값 이름은 CLAUDE.md 10-1에 적음.
- 결정: 하네스 원본 중 Pages 전용 파일(build-dist.sh, verify-dist.sh, dist-include.txt, deploy.sh, check.d/10-dist.sh)은 가져오지 않음. 원본은 docs/harness/README.md와 .claude/stack/profile-static-cloudflare-d1.md로 참고만.

## 2026-11-13 · 자동 게시 켜기
- 결정: `AUTO_PUBLISH = "true"`. 첫 운영 실행으로 대기 중인 글 4개(영어 2, 한국어 2)도 운영자가 원격 D1에서 게시 상태로 바꾼다. / 이유: 파일럿 8차와 첫 운영 실행 모두 사실 오류·출처 오인용 없음(원문 대조). 남은 문제는 표현 수준(메뉴 목록을 게시물 내용처럼 씀, 보증금 환불 조건 일부 생략, 기숙 항목 6개 중 2개만 적어 전부처럼 읽힘) / 영향: wrangler.toml, 운영 배포 필요. 2주 동안 매일 게시 글을 사람이 훑어보고, 문제가 있으면 `/admin/unpublish`로 내린다

## 2026-11-13 · 처음 글 채우기와 주제별 안내 글 (범위 변경)
- 결정: 고객 학교에 보여 줄 글을 먼저 채운다. 목표는 "자료가 되는 만큼, 학교당 7~10편" (숫자를 맞추려고 늘리지 않음). 이후에는 매일 01:17 UTC 자동 실행 그대로. / 이유: 운영자 요청
- 결정: 주제별 안내 글 기능 추가. 그날 쓸 새 소식이 없으면 기록된 사실만으로 학비·교육과정·기숙·입학 중 하나를 쓴다. 주제당 사실 3건 이상일 때만, 학교·주제마다 한 번만 시도(`guide_attempts`). 안내 글은 그 주제의 사실만 보고, 같은 검증(규칙 + 근거 검사 + 한 번 고쳐 쓰기)을 거친다. / 영향: src/guides.ts, src/pipeline.ts, src/generate.ts, migrations/0006 (원격 적용은 사람)
- 결정: 소식 글 한 편이 묶는 소식을 5건에서 3건으로 줄인다. / 이유: 같은 소식으로 더 많은 글, 글마다 초점이 좁아짐
- 결정: `MAX_POSTS_PER_SCHOOL_PER_MONTH` 5 → 12 (계속 유지) / 이유: 운영자 결정

## 2026-11-13 · 학생 실명 쓰지 않기, 대학 합격 글 교체
- 결정: 학생·졸업생·가족의 개인 이름은 학교가 공개했더라도 쓰지 않는다(역할로 나오는 교직원 이름은 허용). 작성 지시와 근거 검사 양쪽에 넣음. 이미 게시된 BSB 대학 합격 글(운영 글 17번)은 내리지 않고 고친 버전으로 교체(선택지 B) / 이유: 사람 결정 / 영향: src/generate.ts, src/grounding.ts
- 같이 고친 것: HTML 엔티티가 남은 이름("King&rsquo;s") 인식, 목록 일부만 쓰면 일부라고 밝히기, 출처는 특징 있는 숫자나 인용 문장이 겹칠 때만 붙이기. 로컬 파일럿 10차(RUNS=5)에서 BSB 대학 합격 글에 학생 이름 없음·King's College London 6건 포함·학비 PDF 출처 없음, DAIS 졸업생 글의 학생 이름은 검사에서 걸려 고쳐 쓰기로 빠짐을 확인

## 2026-11-13 · 세 번째 파일럿 학교 BST(The British School of Tashkent)
- 결정: BST 추가. 운영사 고객 아님(is_client = 0, 운영자 확인). 학비는 학교 공식 2026/27 PDF에서 스크립트로 읽어 40건(학년별 합계 검산 통과). myispp의 BST 학비는 출처가 제3자 사이트이고 "연간" 값이 할인 후 점심 포함 금액이라 쓰지 않음 / 영향: seeds/bst-tashkent.sql (운영 DB 적용은 사람)
- 로컬 파일럿 11차(ONLY=bst-tashkent, RUNS=5): 영어 5편 중 게시 4, 보류 1. 게시 글의 숫자·인용은 원문과 일치. 보류 1편은 성적 등급 "B", "C"를 이름으로 본 오탐이라 등급 글자를 일반어 목록에 추가

## 2026-11-13 · 표 표시, 규칙 이전 글의 학생 실명
- 결정: 글 본문의 마크다운 표를 HTML 표로 표시(그동안 글자 그대로 보였음, 운영자 지적). 학생 실명 규칙 이전에 게시된 글 중 학생 이름이 있는 BSB 학생 미술 글(운영 13번)과 커뮤니티 행사 글(운영 21번)은 대학 합격 글과 같은 방식으로 교체 / 이유: 운영자 지적, 2026-11-13 학생 실명 결정 / 영향: src/render.ts

## 2026-11-13 · 안정화 운영, API 재시도, 도메인 연결
- 결정: 2026-11-13~27을 안정화 기간으로 하고, 매일 자동 실행(10:17 KST) 뒤 게시 글을 AI가 원문과 대조해 보고(예약 작업). 문제 글은 사람이 내린다 / 이유: 사람 요청 "1~4 진행"
- 결정: 근거 검사가 API 일시 오류(429·5xx·과부하·시간 초과)로 실패하면 30초 뒤 한 번 더 시도(`src/retry.ts`). 다시 실패하면 지금처럼 보류(fail closed) / 이유: 2026-11-13 503 오류로 멀쩡한 글이 보류되고 소식이 소모됨
- 결정: ischoolwiki.com, www.ischoolwiki.com을 Worker 사용자 지정 도메인으로 연결(Cloudflare 영역은 이미 있음). www는 apex로 301 / 영향: wrangler.toml, src/index.ts. 배포는 사람

## 2026-11-13 · 도메인 연결 결과
- 결과: https://ischoolwiki.com 200, www → apex 301, /admin/ 401. `routes`를 넣으면서 wrangler가 workers.dev를 기본으로 꺼 옛 주소는 404. 중복 주소 문제(seo-plan 1순위, tasks S-07)는 이것으로 해결. 관리 요청(/admin/*)은 이제 https://ischoolwiki.com 으로 보낸다. harness.config.sh SITE_URL 변경, verify-live PASS

## 2026-11-13 · /adopt 결정 (운영자 "추천대로")
- 결정: v1 필수 기능 = PRD 후보 A~E (start.md 4번). F-03·F-06·F-15·F-16·F-17은 있으면 좋음 / 영향: PRD, tasks.md
- 결정: 사업 목표 숫자는 2026-11-27 안정화 종료 때 실측 기준선을 보고 정한다(Q2). 한국어 학교·비교·첫 화면은 v1 밖(Q3). v1은 파일럿 3개 학교(Q4)
- 결정: 안정화 중에는 P1 3건만: 소식 일시 오류 시 다시 읽기(S-02), 번역 오류 시 다시 시도(S-03), 글 교체 API와 옛 주소 301(S-06, Q5 일부 승격). 보류 글 화면 등 나머지는 정기 릴리스
- 결정: 교체된 글의 옛 주소는 새 글로 301 (seo-plan 2순위, architecture 선택지 B)
- 결정: 교차검토 생략(PRD, architecture) / 이유: 운영 중 사이트의 역기획 문서
- 게이트 A(PRD)·B(디자인 명세)·C(구조 설계) 승인 2026-11-13

## 2026-11-13 · 옛 workers.dev 주소
- 결정: workers.dev는 꺼진 채로 둔다("주소는 지금 그대로") / 이유: 중복 주소가 사라졌고 관리 요청은 ischoolwiki.com으로 보낸다 / 영향: 없음(S-07 완료 그대로)

## 2026-11-14 · 네 번째 파일럿 학교 QAIS
- 결정: Qingdao Amerasia International School(slug qais)을 추가한다. 고객 아님(is_client 0). 학교 소식 글은 날짜가 어디에도 없어(페이지·sitemap·마크업) 소식 수집을 끄고(news_feed NULL), 학교 공식 학비 PDF(2025-08-01 시행)와 academics·about 페이지의 사실로 학교 페이지와 주제별 안내 글만 만든다
- 이유: 날짜 없는 소식으로 쓰면 오래된 행사를 최근 일처럼 쓸 위험이 있음. 운영자 선택(추천안)
- 영향: seeds/qais.sql, scripts/pilot.sh, scripts/snapshot.sh. 코드 변경 없음. /adopt Q4(v1 파일럿 3개 학교)를 운영자 지시로 4개로 넓힘

## 2026-11-14 · 다섯 번째 파일럿 학교 BISP, 개인 학생 글 제외, 추적 파라미터 제거
- 결정: British International School, Phuket(slug bisp)을 추가한다. 고객 아님(is_client 0). 소식은 학교 RSS(날짜 있음), 학비는 학교 PDF 2개(2026-2027 본교, Little Ducks)
- 결정: 학생·졸업생 한 사람을 다루는 소식("Meet Vanessa", 이달의 선수, 졸업생 이야기)은 글감으로 쓰지 않는다. 사실 추출에서 개인의 성적·수상·순위·대학·배경을 빼고, 한 사람을 소개하는 페이지는 빈 목록 / 이유: 이름을 빼도 본인이 특정되고, 출처 주소에 이름이 들어 있음(…-puthi/). 운영자 선택(추천안) / 영향: src/collect.ts EXTRACT_SYSTEM, 모든 학교
- 결정: 소식 주소의 utm_* 파라미터를 지운다 / 이유: 출처 목록에 그대로 보임. 기존 세 학교는 HTML 목록이라 원래 쿼리를 지우고 있어 중복 수집 없음 / 영향: src/collect.ts parseFeed

## 2026-11-14 · "학교가 밝히지 않은 것" 문장 금지
- 결정: 작성기는 학교 소식·페이지가 무엇을 말하지 않는지 쓰지 않는다. 학비 글에서 학비표에 없는 비용을 한 번 언급하는 것만 허용. 근거 검사는 그런 문장을 근거 없음으로 잡는다(검사 강화) / 이유: BISP 운영 글에서 "등록 방법·장소를 밝히지 않았다"고 썼지만 원문에는 있었음. 검사가 원문이 아니라 뽑아낸 사실만 보기 때문. 운영자 선택(추천안) / 영향: src/generate.ts, src/grounding.ts, 모든 학교. 운영 BISP 글 2편(축구 캠프, 프로그램 안내)은 /admin/rewrite로 교체

## 2026-11-14 · 범위 확대와 여섯 번째 학교 Eastwood Montreux
- 결정: 학교 범위를 아시아 밖으로 넓힌다(운영자 "범위를 넓혀 추가"). 사이트 문구의 "International schools in Asia" 변경은 문구 승인 대기 / 영향: docs/PRD.md 변경 이력
- 결정: Eastwood Montreux(slug eastwood-montreux, 스위스 몽트뢰) 추가. 운영자와 사업 관계가 있으므로 is_client 1(사이트 표준 "Client of the site's operator" 표시). 운영자는 표시를 빼 달라고 했으나, 관계를 숨기고 중립 자료처럼 올리면 독자를 오해하게 하고 표시·광고 법에 걸릴 수 있어 제안하지 않았고, 운영자가 고객 표시로 추가를 선택. 표시 문구에 관계의 종류는 쓰지 않는다
- 결정: 학교가 직접 준 문서(2026 Tuition Overview, About, 브로셔)는 출처 링크를 학교 홈페이지로 두고 단위 설명에 "a document the school provided directly"로 적는다(운영자 선택). 학교가 학비표를 홈페이지에 올리면 그 주소로 바꾼다
- 제외: Eastwood Global(온라인 학교)의 IB 평균 점수·순위(이 학교 실적 아님), 서로 다른 교사 비율(10:1 / 12:1), 학생 후기, 대행 제안서(내부 문서)
