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

## 2026-11-15 · developer+qa(메인) · 안정화 / B-01 로컬 파일럿 (사람 맥에서 실행, ONLY=bisp RUNS=3)
- 한 일: 사람이 맥에서 파일럿 실행(클라우드는 학교 사이트 차단). 결과: 소식 글 3편(축구 캠프, Early Years 정원, Make & Create Camp)과 번역 3편 게시, 보류 0(이전 BISP 파일럿과 같음), 고쳐 쓰기 2회(빠진 내용 문장, "holiday camp" 추론). used_by는 쓴 소식 3건에만, 사실이 있는데 안 쓴 소식 3건(할로윈, 수영, Reception)은 NULL로 남음 → news_used 수정은 동작
- 결과: 글 5(Make & Create Camp)의 sources_json에 축구 캠프·정원·Reception 소식 페이지가 함께 붙음. 원인: 검증기가 숫자·문구가 겹치는 사실을 usedFactIds로 돌려주고, 그 사실의 source_url(다른 소식 페이지)이 출처에 들어감. 수정: 소식 차례 글에서는 학교 소식 페이지 중 글이 쓰지 않은 페이지를 사실 출처에서 뺀다(sourcesFor newsPages). 학비 PDF 같은 소식 아닌 출처는 유지, 주제 가이드는 그대로. 검증(통과 판정)은 바꾸지 않음. 단위 테스트 3개, check.sh 전체 PASS
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: 안정화 / B-01 (R-01) / 근거: 파일럿에서 used_by 정상, 출처 혼입 1건 추가 수정 / 다음 담당: 사람(수정 뒤 로컬 파일럿 재실행, 글 원문 대조 결과 공유)

## 2026-11-15 · developer+qa(메인) · 안정화 / B-01 로컬 파일럿 2차 (31a6504, 사람 맥에서 ONLY=bisp RUNS=3)
- 한 일: 출처 수정 뒤 파일럿 재실행. 영어 3편 중 2편 게시(정원, Make & Create Camp)와 번역 2편, 1편 보류(축구 캠프: 고쳐 쓴 뒤에도 "선수 프로그램과 별개 행사"라는 추론 문장을 근거 검사가 잡음)
- 결과: sources_json이 글마다 자기 소식 페이지 하나뿐(1차의 다른 소식 페이지 혼입 해소). used_by는 1차에서 쓴 소식에만 표시 확인. 게시 글 원문 대조는 사람이 학교 페이지와 확인("확인", 2026-11-15). 보류 1건은 근거 없는 문장을 막은 안전한 동작이나, 근거 검사 재료를 쓴 소식으로 좁힌 영향인지 작성기 편차인지 1회로는 구분 못 함 → 운영 일일 점검에서 보류 건수 관찰
### VERDICT
- 결과: PASS / 단계/대상: 안정화 / B-01 (R-01) / 근거: 파일럿 1·2차, 사람 원문 대조, check.sh PASS / 다음 담당: 사람(운영 배포, 이후 보류 건수 관찰)

## 2026-11-15 · release(메인) · 안정화 / B-01 파일럿 3차와 운영 배포
- 한 일: 사람이 main(병합 후)으로 로컬 파일럿 3차(ONLY=bisp RUNS=3) 실행. 영어 3편·번역 3편 게시, 보류 0, 고쳐 쓰기 2회(근거 없는 문장 제거). 소식 2건을 함께 쓴 글(할로윈 Pentathlon + 수영 과정)의 출처에 두 소식 페이지, used_by 둘 다 5. Make & Create Camp 글의 출처에 정원 소식·BTEC 페이지 → 본문에 garden·climbing·early years·BTEC가 실제로 있음 확인(정상). 쓰지 않은 Reception 소식은 used_by NULL. 이어서 사람이 운영 배포(Worker 버전 b170c6d0), verify-live.sh 19항목 PASS
- 결과: B-01(R-01) 완료. docs/ops/releases.md v1.0.1
### VERDICT
- 결과: PASS / 단계/대상: 안정화 / R-01 출시 후 확인 / 근거: 파일럿 3차, verify-live.sh PASS / 다음 담당: ops(매일 점검에서 보류 건수 관찰)

## 2026-11-17 · qa(메인) · 안정화 / B-01 출시 후 관찰 파일럿 (사람 맥, main 95038a2 포함, ONLY=bisp RUNS=3)
- 한 일: 사람이 맥에서 파일럿 재실행(클라우드는 학교 사이트 여전히 프록시 403). 소식 10건 수집, 영어 3편 중 2편 게시(Year 3 이집트+걷기 행사+BTEC 영양, 오즈의 마법사 공연)와 번역 2편, 1편 보류(축구 캠프+Early Years 정원: "Years 2–6"을 "primary-age children"으로 바꾼 추론 문장을 근거 검사가 잡음)
- 결과: B-01 동작 정상 — 글 1은 소식 1·2·3, 글 3은 소식 4, 글 5는 소식 7·8만 출처·used_by. 사실 0건인 개인 학생·졸업생 소식 4건(5·6·9·10)은 used_by NULL. 새 관찰: 글 3(오즈의 마법사)의 출처에 학비 PDF가 붙음 → 소식 아닌 출처는 설계상 유지되므로, 본문이 학비 PDF의 사실(학년·연령 등)을 실제로 썼는지 본문 확인 필요(미확인). 보류 1건은 파일럿 2차와 같은 축구 캠프 글, 같은 종류(근거 없는 추론)로 안전한 동작. 원문 대조는 클라우드에서 학교 사이트 차단으로 하지 못함
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: 안정화 / R-01 관찰 / 근거: used_by·출처 정상, 글 3의 학비 PDF 출처는 본문 확인 전이라 미확인 / 다음 담당: 사람(글 3 본문 공유 또는 확인)

## 2026-11-17 · qa(메인) · 안정화 / B-01 관찰 후속: 글 3 학비 PDF 출처 확인
- 한 일: 사람이 공유한 글 3 본문을 seeds/bisp.sql 사실과 대조
- 결과: 학비 PDF 출처는 오표기. 본문 "100 THB"(티켓값)가 학비 PDF 환불 규정 사실의 "100%"와 숫자 토큰 "100"으로 맞물려 usedFactIds에 들어감(verify.ts checkNumbers: 3자리 이상 숫자는 단위 무시하고 사용 표시). 본문은 학비·환불을 전혀 쓰지 않음. 반대로 "About the school"이 쓴 IB 인증·IGCSE/IB·BTEC 사실(secondary, ib-diploma-programme, btec 페이지)은 풀어 쓴 문장이라 출처에 없음. B-01(소식 페이지)과 별개인 사실 출처 매칭 문제 → backlog B-02. 문장 자체는 seed 사실과 일치(근거 있음)
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: 안정화 / B-02 신규 결함 / 근거: 글 3 본문과 seeds/bisp.sql 대조, docs/backlog.md B-02 / 다음 담당: 사람(ops 분류 P1 여부 결정)

## 2026-11-17 · developer(메인) · 안정화 / B-02 (R-02, P1) 수정
- 한 일: ① verify.ts checkNumbers: 출처 판단(usedFactIds)에서 퍼센트("100%", "per cent")와 일반 숫자("100 THB")를 다른 값으로 봄. 숫자 뒷받침(통과·보류 판정)은 바꾸지 않음 ② generate.ts: 작성기·고쳐 쓰기 출력에 fact_sources_used(글이 쓴 사실의 source) 추가 ③ pipeline.ts sourcesFor: 작성기가 이름 댄 사실 페이지를 출처에 더함. 사실의 source가 아닌 주소는 무시, 쓰지 않은 소식 페이지는 B-01대로 제외. 단위 테스트 4개 추가
- 결과: check.sh 전체 PASS. 파일럿(실제 작성기가 fact_sources_used를 맞게 채우는지, 보류 증가 여부)과 원문 대조는 아직 — 클라우드는 학교 사이트 차단
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: 안정화 / B-02 (R-02) / 근거: check.sh PASS, 파일럿 미실행 / 다음 담당: 사람(맥에서 파일럿, 교차 검토 여부 결정)

## 2026-11-19 · developer(메인) · 안정화 / BSN Nanjing 파일럿 준비 (사람 요청)
- 한 일: seeds/bsn-nanjing.sql(학교 행, 소식 색인 주소, 짧은 이름 BSN). BSB Shunyi와 같은 Nord Anglia 사이트 구조를 따름. 클라우드에서 학교 사이트·myispp가 막혀 수동 사실(학비 등)은 없음, ispp_school_id NULL, is_client 0(사람 확인 대기). pilot.sh: seed 추가, ONLY에 여러 학교(쉼표) 허용
- 결과: 로컬 D1에 seed 적용·ONLY=bisp,bsn-nanjing 활성화 확인, check.sh 전체 PASS. 파일럿은 사람이 맥에서 실행
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: 안정화 / BSN Nanjing 파일럿 준비 / 근거: seed 적용 확인, check.sh PASS, 학교 이름·소식 주소·is_client 미확인 / 다음 담당: 사람(is_client 답, 맥에서 파일럿)

## 2026-11-19 · qa+developer(메인) · 안정화 / B-02 파일럿 1차 (사람 맥, 2bacbc6, ONLY=bisp,bsn-nanjing RUNS=3) → 수정 1/3
- 한 일: 파일럿 결과와 본문 대조. 영어 3편·번역 3편 게시, 보류 0(직전 1). 학비 글(1) 출처는 학비 PDF 2개뿐, 표의 금액 전부 seeds/bisp.sql과 일치. 글 3·5에 IB·IGCSE·BTEC 학교 페이지가 출처로 들어감(B-02 빠진 출처 해소), 학비 PDF가 학비 아닌 글에 붙지 않음(B-02 잘못 붙은 출처 해소)
- 결과: FAIL — 새 빠진 출처. 글 3이 오즈의 마법사 공연(소식 6)의 날짜·티켓값을 쓰는데 소식 6 페이지가 출처에 없고 used_by NULL(다시 글감이 됨). 글 5의 BTEC 영양 수업 문장도 소식 5 페이지가 출처에 없음. 원인: 작성기는 작성 차례에 받은 소식(최대 3건) 밖의 소식 페이지 사실도 사실 목록으로 받는데, sourcesFor가 B-01 규칙으로 news_used에 없는 소식 페이지를 모두 뺌. 수정: 작성기가 fact_sources_used로 직접 댄 소식 페이지는 출처에 넣고, 아직 쓰이지 않았으면 used_by도 표시. 숫자·문구 일치로만 걸린 소식 페이지는 B-01대로 제외. 단위 테스트 갱신, check.sh 전체 PASS
- BSN Nanjing: "collect: 0 new of 0 items" — 소식 색인 페이지에서 /news/YYYY/M/D/ 형식 링크를 하나도 찾지 못함(주소 또는 링크 형식이 BSB Shunyi와 다름). 클라우드에서 학교 사이트가 막혀 확인 못 함
### VERDICT
- 결과: FAIL / 단계/대상: 안정화 / B-02 (R-02), 수정 1/3 / 근거: 파일럿 본문 대조(소식 6·5 출처 누락) / 다음 담당: 사람(수정 뒤 맥에서 파일럿 재실행)

## 2026-11-19 · qa(메인) · 안정화 / B-02 파일럿 2차 (사람 맥, 874a8f4, ONLY=bisp RUNS=3)
- 한 일: 영어 3편·번역 3편 게시, 보류 0. 글마다 출처를 본문과 대조
- 결과: 출처 전부 본문과 맞음. 글 1(학비): 학비 PDF 2개 + 본문의 IGCSE·IB·BTEC 문단에 맞는 학교 페이지 3개. 글 3: 소식 3·4·5·6(오즈의 마법사 포함) + 프로그램 페이지, 소식 6 used_by 3(1차의 빠진 출처·재사용 문제 해소). 글 5: 축구 캠프 소식 + 학년별 나이 표를 쓴 학비 PDF·Little Ducks PDF + BTEC 소식·페이지. 학비 아닌 글에 학비 PDF가 숫자 우연으로 붙는 경우 없음. 사실 0건 소식 5건 used_by NULL. 학비 표 금액은 seeds/bisp.sql(PDF 대조 완료본)과 일치. 남은 확인: 소식 글(3·5)의 날짜·시간·금액·이름을 학교 소식 페이지와 사람이 대조(클라우드는 학교 사이트 차단). 관찰: 글 3 제목의 "November 2026"은 검증 통과했으나 오즈 소식 날짜 근거가 약함(1차 검사가 같은 문장을 지적) — B-02와 별개
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: 안정화 / B-02 (R-02) / 근거: 파일럿 2차 출처 대조 정상, check.sh PASS, 소식 원문 대조만 사람 확인 대기 / 다음 담당: 사람(원문 대조 "확인")

## 2026-11-19 · qa(메인) · 안정화 / B-02 원문 대조 확인
- 한 일: 사람이 파일럿 2차의 소식 글(오즈의 마법사, 걷기 행사, 축구 캠프, BTEC 영양 수업)을 학교 소식 페이지와 대조 → "다 맞아"
- 결과: B-02 수정 완료. PR #24 병합 진행
### VERDICT
- 결과: PASS / 단계/대상: 안정화 / B-02 (R-02) / 근거: 파일럿 2차 출처 대조, 사람 원문 대조 확인, check.sh PASS / 다음 담당: 사람(운영 배포)

## 2026-11-19 · release(메인) · 안정화 / R-02 출시 후 확인
- 한 일: 사람이 main(aa72bc8)을 운영 배포(Worker 31574c4f). verify-live.sh 실행: 1·2회차는 두 경로(docs/log.md와 비밀 파일 경로)가 접속 실패로 SKIP, 3회차 19항목 모두 404 PASS
- 결과: B-02(R-02) 완료. docs/ops/releases.md v1.0.2
### VERDICT
- 결과: PASS / 단계/대상: 안정화 / R-02 출시 후 확인 / 근거: verify-live.sh 19항목 PASS / 다음 담당: ops(매일 점검에서 보류 건수·출처 관찰)

## 2026-11-20 · developer(메인) · 안정화 / BSN Nanjing 소식 수집 0건 원인 수정
- 한 일: 사람이 맥에서 소식 색인을 받아 봄(200, 108 KB). 기사 링크는 /bsn-nanjing/news/2026/november/9/... 처럼 월이 영어 이름이라, 숫자 월만 받던 parseNewsIndex가 하나도 고르지 못함(BSB Shunyi는 /news/2026/7/26/). collect.ts: 월 자리에 숫자 또는 영어 월 이름(대소문자 무관)을 받음. 날짜 없는 경로(/news/2025/august/a-levels-results/...)는 그 달 1일. 단위 테스트 1개
- 결과: check.sh 전체 PASS. BSN 파일럿은 사람이 맥에서 실행
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: 안정화 / BSN Nanjing 소식 수집 / 근거: 링크 형식 확인, 단위 테스트, check.sh PASS, 파일럿 미실행 / 다음 담당: 사람(맥에서 ONLY=bsn-nanjing 파일럿)

## 2026-11-20 · qa(메인) · 안정화 / BSN Nanjing 파일럿 (사람 맥, 7d84021, ONLY=bsn-nanjing RUNS=3)
- 한 일: 영어 월 이름 수정 뒤 파일럿. 소식 20건 수집, 날짜 모두 URL과 일치(일 없는 2025/august 경로 2건은 8월 1일). 사실 32건(school_site). 영어 3편 중 2편 게시(학생회·학생 리더십, Greenhouse 식당·새 교과 리더)와 번역 2편, 1편 보류(Oxbridge 모의 면접·Academic Cup: "older students"라는 추론을 근거 검사가 잡음 — 안전한 동작)
- 결과: 학생 개인 이야기(Liya), 개별 대학 합격 소식, 입학 안내·캠프 홍보는 사실 0건으로 걸러짐(used_by NULL). 출처는 글마다 쓴 소식 페이지와 일치. 관찰: "Part of the Nord Anglia Education family"·과정 목록 같은 학교 소개 사실이 소식 페이지(11월 9일 첫 합격 소식 등)의 공통 문구에서 뽑혀, 그 소식 페이지가 학교 소개 문단의 출처로 붙음 — 사실과 출처는 맞지만 독자에게는 어색함. 학비 등 수동 사실 없음. 남은 확인: 게시 글을 학교 소식 원문과 사람이 대조
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: 안정화 / BSN Nanjing 소식 수집 (PR #30) / 근거: 파일럿 수집·출처 정상, check.sh PASS, 원문 대조 사람 확인 대기 / 다음 담당: 사람(원문 대조 "확인")

## 2026-11-20 · qa(메인) · 안정화 / BSN Nanjing 원문 대조 확인
- 한 일: 사람이 게시 글 2편(학생회·리더십, Greenhouse·새 교과 리더)을 학교 소식 원문과 대조 → "확인"
- 결과: PR #30 병합 진행
### VERDICT
- 결과: PASS / 단계/대상: 안정화 / BSN Nanjing 소식 수집 (PR #30) / 근거: 파일럿, 사람 원문 대조, check.sh PASS / 다음 담당: 사람(운영 배포, BSN 운영 반영 여부 결정)

## 2026-11-20 · developer(메인) · 안정화 / BSN Nanjing 학비·학교 소개 사실 (운영 반영 전, 사람 요청)
- 한 일: 환경 허용 도메인 추가 후 학교 페이지 7개를 직접 읽음(학비, about-us, academic-excellence 5개; 사이트가 요청을 자주 429로 막아 간격을 두고 재시도). 학비는 PDF가 아니라 학비 페이지 표. seeds/bsn-nanjing.sql에 사실 70건: 2026-27 학년별 학기 1·2·3·연합계·일시납 금액(8구간), 지원비·보증금·등록비·EAL, 점심, 교복, 버스 Tier 1·2, 결제 통화, 설립 2007, 학생 450명 이상·30개국 이상, 주소, 교장, 과정별(EYFS·Primary·KS3·IGCSE·A level) 내용, Pearson 2021 수상. seed의 숫자가 모두 학교 페이지에 있음을 스크립트로 확인
- 결과: 학교 표의 연합계가 세 학기 합과 1 RMB씩 다른 행 7개(반올림) — 발표된 그대로 기록. 버스 Tier 3은 연액(18,116)과 학기 합(18,144)이 맞지 않아 제외. 학교 홍보 문구("longest running", "award-winning"), UK 평균 비교, 학생 개인 성적, 후기는 제외. check.sh 전체 PASS
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: 안정화 / BSN Nanjing 사실 seed / 근거: 원문에서 직접 읽음, 숫자 대조, check.sh PASS, 파일럿 미실행 / 다음 담당: 사람(맥 또는 클라우드 파일럿 후 원문 대조)

## 2026-11-20 · qa(메인) · 안정화 / BSN Nanjing 학비 안내 파일럿 (클라우드, ONLY=bsn-nanjing RUNS=1 ×3)
- 한 일: 사실 seed로 학비 안내 글 작성. 1차 글에서 두 가지 오류 발견 → seed 수정: ① 연합계 단위를 "세 학기 합계"로 적어 작성기가 "학기 합"이라고 씀(실제는 1 RMB 차이) → 학교 표 이름 "Total Fees column"으로 ② 버스 Tier 3을 빼자 "두 등급을 안내"라는 틀린 문장 → Tier 3을 발표된 그대로 넣고 "세 등급" 사실 추가(사실 74건)
- 결과: 최종 글 게시(영어 1·한국어 1), 보류 0, 출처는 학비 페이지 하나. 본문·FAQ의 금액·학년·연령·조건이 모두 학교 학비 페이지 표와 일치(직접 대조). 소식 수집은 이 환경에서 실패(학교 사이트 429·프록시) — 맥 파일럿(2026-11-20)에서는 정상
### VERDICT
- 결과: PASS / 단계/대상: 안정화 / BSN Nanjing 사실 seed / 근거: 학비 페이지 직접 대조, check.sh PASS / 다음 담당: 사람(운영 반영 publish-school)

## 2026-11-21 · release(메인) · 안정화 / BSN Nanjing 운영 반영 (v1.0.3)
- 한 일: 사람이 main(77314f7)에서 publish-school.sh bsn-nanjing --deploy 실행. 운영 DB에 seed(쿼리 3개), 배포(Worker ff21b5e8, PR #30 수집기 수정 포함), 글 쓰기 6회
- 결과: BSN 영어 6편 게시(81·83·85·87·89·91), 한국어 5편 게시, 한국어 88 보류(원인 확인 대기). 다른 학교는 새 자료 없음. verify-live.sh 19항목 PASS. 클라우드에서는 운영 사이트가 막혀 게시 글을 직접 보지 못함
### VERDICT
- 결과: NEEDS_APPROVAL / 단계/대상: 안정화 / BSN 운영 반영 / 근거: 배포·verify-live PASS, 한국어 88 보류 사유 미확인 / 다음 담당: 사람(보류 사유 조회 결과 공유)
