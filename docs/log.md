# 작업 일지
(형식: CLAUDE.md 14장. 모든 에이전트가 작업 끝마다 VERDICT와 함께 기록)

## 2026-11-13 · Stage Runner · /adopt
- 한 일: 현황 진단(docs/adopt-report.md), 역기획 위임 4건(planner→PRD.md, designer→design-spec.md, architect→architecture.md, seo→seo-plan.md), 안정화 계획(tasks.md)
- 결과: P0 없음, check.sh 전체 PASS. 기능 20개, 하드코딩 디자인 값 93건(색 0), 목표 구조 R-0~R-6, SEO 제안 우선순위표. 새로 발견: 소식 429 시 영구 제외, 번역 오류 시 재시도 없음, 교체 글의 옛 URL 404, workers.dev 중복 주소
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: S1~S3 역기획 / 근거: PRD 열린 질문 5, design-spec 결정 D-01~D-14, architecture 결정 4, seo-plan 결정 / 다음 담당: 사람 (게이트 A→B→C, 교차 검토 권장)

## 2026-11-13 · planner · S1 / PRD.md
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: S1 / PRD.md 역기획 v1 초안 / 근거: 기능 20개, 필수 후보 A~E, 열린 질문 Q1~Q5 / 다음 담당: 사람(게이트 A)

## 2026-11-13 · designer · S2 / design-spec.md
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: S2 / design-spec 추출 초안 / 근거: 하드코딩 93건(색 0), 토큰 통합안, 컴포넌트 18종, 화면 7개, 결정 D-01~D-14 / 다음 담당: 사람(게이트 B)

## 2026-11-13 · architect · S3 / architecture.md
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: S3 / 현재·목표 구조 / 근거: R-0~R-6, 단계적 정리 추천, 사람 결정 4건 / 다음 담당: 사람(게이트 C, 교차 검토 권장)

## 2026-11-13 · seo · S1 / seo-plan.md
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: S1 / seo-plan 초안 / 근거: workers.dev 중복, 교체 글 404, 학교 페이지 메타, 긴 제목·중복 슬러그, 메타 누락, 학교 1곳 비교 페이지 / 다음 담당: 사람

## 2026-11-13 · developer+qa(메인) · S4 / S-02, S-03, S-06
- 한 일: 소식 페이지 일시 오류 재시도(최대 3회, migration 0007 extract_attempts), 번역 재시도와 빠진 번역 채우기 단계, POST /admin/rewrite와 옛 주소 301(migration 0007 replaced_by)
- 결과: 단위 테스트 65개, check.sh 전체 PASS, 로컬 파일럿 12차(ONLY=bst-tashkent RUNS=2 REWRITE=1)에서 교체·301 확인
### VERDICT
- 결과: PASS / 단계/대상: S4 / S-02, S-03, S-06 / 근거: check.sh PASS, 파일럿 12차 / 다음 담당: 사람(운영 마이그레이션 0007·배포, 이미 교체된 글 3편의 replaced_by 채우기)

## 2026-11-14 · developer+qa(메인) · 운영 / QAIS 파일럿
- 한 일: seeds/qais.sql(학교·약칭 QAIS·Amerasia, 사실 29건: 학비 PDF 20건, 프로그램 6건, 인가·인증 3건). 파일럿 3회(ONLY=qais). 1·2차 결과를 원문과 대조해 seed 보완(프로그램 나이대 누락 → "나이 미기재"라는 틀린 문장, 조기 납부 할인 "may receive"를 단정으로 씀, 반년 납부 환불 규정 누락)
- 결과: 3차에서 학비 안내·프로그램 안내 영어 2편과 한국어 번역 2편 게시(보류 0). 원문 대조: 금액·학년·나이·환불·인가 문구 모두 일치. check.sh 전체 PASS
### VERDICT
- 결과: PASS / 단계/대상: 운영 / QAIS 파일럿 / 근거: 파일럿 3차, 원문 대조, check.sh PASS / 다음 담당: 사람(운영 D1에 seed 적용, 배포, /admin/run)

## 2026-11-14 · developer+qa(메인) · 운영 / BISP 파일럿, 개인 학생 글 제외(F-10), 추적 파라미터 제거(F-09)
- 한 일: seeds/bisp.sql(사실 48건, PDF에서 스크립트로 생성: 학기 3회 합계 = 연간 금액, 일회성 금액은 PDF 문구와 대조). 파일럿 1차(ONLY=bisp RUNS=5)에서 졸업생 한 명의 이야기(테니스 장학생·랭킹·대학)와 12학년 학생 수상으로 글이 써짐 → 추출 지시에 개인 학생·졸업생 제외 추가, parseFeed가 utm_* 제거(단위 테스트 1개 추가)
- 결과: 파일럿 2차에서 개인 소개 소식 3건 사실 0건, 출처 주소 깨끗함. 영어 4편·한국어 4편 게시(보류 0): 축구 캠프, Make & Create 캠프, 할로윈 수영 대회, 학비. 학비 표·기숙·교통·일회성·환불을 PDF와 대조해 일치. 미술 교사 소식이 학비 글의 출처로 붙는 문제 → backlog B-01
### VERDICT
- 결과: PASS / 단계/대상: 운영 / BISP 파일럿, F-09·F-10 수정 / 근거: 파일럿 2차, 원문 대조, check.sh PASS / 다음 담당: 사람(운영 seed 적용, 배포, /admin/run)

## 2026-11-14 · developer+qa(메인) · 운영 / 빠진 내용 문장 금지(F-12, F-14)
- 한 일: 운영 BISP 글 6편 원문 대조 → 금액·날짜·이름 일치, 단 "발표에 등록 방법·장소가 없다" 같은 틀린 문장 발견. 작성 지시와 근거 검사 수정
- 결과: 파일럿 3차(ONLY=bisp RUNS=6) 영어 5편 게시, 보류 0, 빠진 내용 문장 0건(근거 검사가 1건을 잡아 고쳐 쓰기). check.sh PASS
### VERDICT
- 결과: PASS / 단계/대상: 운영 / F-12·F-14 / 근거: 파일럿 3차, check.sh PASS / 다음 담당: 사람(배포, 운영 글 2편 교체)

## 2026-11-14 · developer+qa(메인) · 운영 / Eastwood Montreux 파일럿
- 한 일: seeds/eastwood-montreux.sql(사실 21건). 파일럿 3회(ONLY=eastwood-montreux). 학비 안내·프로그램 안내 영어 2편 게시, 기숙 안내는 자료 부족으로 작성기가 건너뜀. 학비 글이 한 번 보류(납부 순서 문장) → 보류는 안전하게 동작
- 결과: 금액·납기·환불·IB 후보 상태가 학교 문서와 일치. IB는 "후보 학교"와 "온라인 학교 Eastwood Global"을 구분해 씀. check.sh PASS
### VERDICT
- 결과: PASS / 단계/대상: 운영 / Eastwood Montreux 파일럿 / 근거: 파일럿 3회, 문서 대조, check.sh PASS / 다음 담당: 사람(운영 seed 적용, /admin/run, 사이트 문구 결정)

## 2026-11-15 · developer(메인) · 안정화 / B-01 소식 출처 오표기 (R-01, P1)
- 한 일: 원인은 작성기에게 준 소식 최대 3건이 글에 쓰였는지와 상관없이 모두 출처 목록에 들어가고 used_by로 표시되던 것(pipeline.ts writeForSchool). 작성기 출력에 news_used(글이 쓴 소식 url)를 추가하고, 받은 소식 중 그 url과 정확히 같은 것만(usedNews) 출처·used_by·규칙 검증(newsTitles, 날짜)·근거 검사·고쳐 쓰기 재료로 쓴다. 쓰지 않은 소식은 used_by NULL로 남아 다음 글감이 된다. 검증 재료가 좁아지므로 검증은 더 엄격해짐(약화 아님). 단위 테스트 2개(usedNews)
- 결과: check.sh 전체 PASS. 파일럿 미실행: 이 세션에 ISCHOOLWIKI_ANTHROPIC_KEY 없음
### VERDICT
- 결과: BLOCKED / 단계/대상: 안정화 / B-01 (R-01) / 근거: check.sh PASS, 파일럿(작성기가 news_used를 맞게 채우는지, 보류 증가 여부) 미확인 — API 키 없음 / 다음 담당: 사람(키 제공 후 파일럿 ONLY=bisp, 교차 검토 여부 결정)

## 2026-11-15 · developer+qa(메인) · 안정화 / B-01 파일럿 (R-01, P1)
- 한 일: ISCHOOLWIKI_ANTHROPIC_KEY 확인 후 `ONLY=bisp RUNS=3 ./scripts/pilot.sh` 실행(종료 코드 0)
- 결과: 3회 모두 "collect: failed - internal error". wrangler 로그는 DNS 조회 실패, 같은 세션에서 `curl https://www.bisphuket.ac.th/feed/`는 프록시 CONNECT 403 → 이 클라우드 환경의 네트워크 정책이 학교 사이트(www.bisphuket.ac.th, cdn.bisphuket.ac.th)를 막음. 그래서 source_items 0건, 소식이 작성기에 한 번도 주어지지 않아 B-01의 핵심(news_used가 쓴 소식만 담는지, sources_json에 안 쓴 소식이 없는지, 안 쓴 소식 used_by NULL, 보류 증가 여부)은 확인하지 못함. 확인된 것: 소식 없는 학비 안내 글(영어 1·한국어 1) 검증 통과(고쳐 쓰기 1회, "Thai" 미등록 이름), 보류 0, sources_json은 학비 PDF 2개뿐(소식 url 없음), 본문 숫자 33개 모두 seeds/bisp.sql 사실과 일치(원본 PDF는 같은 이유로 직접 열지 못함). 프로그램·기숙 안내는 자료 부족으로 작성기가 건너뜀
### VERDICT
- 결과: BLOCKED / 단계/대상: 안정화 / B-01 (R-01) / 근거: 파일럿에서 학교 사이트 접근이 환경 네트워크 정책에 막혀 소식 수집 0건 → 핵심 동작 미확인. 병합하지 않음 / 다음 담당: 사람(환경 네트워크 허용 도메인에 www.bisphuket.ac.th·cdn.bisphuket.ac.th 추가 후 파일럿 재실행, 또는 로컬에서 파일럿)
