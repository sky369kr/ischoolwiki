# 릴리스 계획과 노트

## v1.0.1 · 2026-11-15 (안정화 P1)
- 항목: R-01 / B-01 글에 실제로 쓴 소식만 출처·"사용됨" 처리, 쓰지 않은 소식 페이지를 사실 출처에서 제외 (PR #19, main c9dfd4a)
- 검사: check.sh 전체 PASS(95038a2), 로컬 파일럿 3회(사람 맥), 사람 원문 대조
- 배포: 사람이 2026-11-15 `npm run deploy` (Worker 버전 b170c6d0-9be8-40f7-a4d7-1ff854aef980)
- 출시 후 확인: verify-live.sh 19항목 PASS
- 관찰: 매일 자동 실행의 보류 건수 (파일럿 2차에 1건, 3차에 0건)

## v1.0.2 · 2026-11-19 (안정화 P1)
- 항목: R-02 / B-02 사실 출처 오표기 — 퍼센트와 일반 숫자 구분, 작성기가 댄 사실 페이지(소식 페이지 포함)를 출처·used_by에 포함 (PR #24, main aa72bc8)
- 검사: check.sh 전체 PASS(7ea2465), 로컬 파일럿 2회(사람 맥, 1차 FAIL → 수정), 사람 원문 대조
- 배포: 사람이 2026-11-19 `npm run deploy` (Worker 버전 31574c4f-06c0-4aee-a898-4a9f31250f08)
- 출시 후 확인: verify-live.sh 19항목 PASS (1·2회차에 두 경로가 접속 실패로 SKIP, 3회차에 모두 404)
- 관찰: 매일 자동 실행의 보류 건수와 출처. 운영 Worker의 ANTHROPIC_API_KEY 교체 여부(2026-11-19 노출 키 폐기)

## v1.0.3 · 2026-11-21 (안정화, 일곱 번째 학교)
- 항목: 소식 주소의 영어 월 이름 읽기(PR #30), British School of Nanjing seed(학비·학교 소개 사실 74건, PR #32, main 77314f7)
- 검사: check.sh 전체 PASS(bdfacdb, ea256f6), BSN 파일럿(사람 맥: 소식 20건 수집, 원문 대조 확인 / 클라우드: 학비 안내 글 학비 표와 대조)
- 배포: 사람이 2026-11-21 `./scripts/publish-school.sh bsn-nanjing --deploy` (운영 DB에 seed, Worker 버전 ff21b5e8-3aa4-4812-9227-383cd496bd1f, 글 쓰기 6회)
- 결과: BSN 영어 6편(81·83·85·87·89·91) 게시, 한국어 5편 게시·1편(88) 보류
- 출시 후 확인: verify-live.sh 19항목 PASS
