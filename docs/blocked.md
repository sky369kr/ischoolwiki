# 막힌 항목
(형식: CLAUDE.md 14장)

## [B-01] 파일럿 실행 불가 · 2026-11-15 (해결: 사람이 맥에서 로컬 파일럿 실행, 2026-11-15)
- 증상: 파이프라인 변경(B-01)은 실제 AI 호출 파일럿과 원문 대조가 필요한데, 이 클라우드 세션에 ISCHOOLWIKI_ANTHROPIC_KEY 환경 변수가 없음
- 시도한 방법: 1) 환경 변수 확인 2) 단위 테스트·check.sh 전체로 확인 가능한 범위까지 검증(PASS)
- 추정 원인: 클라우드 환경 설정에 키가 빠짐
- 사람이 결정할 것: A) 클라우드 환경에 ISCHOOLWIKI_ANTHROPIC_KEY를 넣고 새 세션에서 파일럿(ONLY=bisp RUNS=3, API 비용 발생) — 추천 / B) 로컬에서 사람이 ./scripts/pilot.sh 실행 후 결과 공유
- 갱신 2026-11-15: 키는 해결(A). 파일럿을 실행했으나 클라우드 환경 네트워크 정책이 학교 사이트를 막아(프록시 CONNECT 403, workerd DNS 실패) 소식 수집 0건 → news_used·출처·used_by 동작을 여전히 확인 못 함 (docs/log.md 같은 날 "B-01 파일럿")
- 사람이 결정할 것(갱신): A) 환경 설정 → Network access → Allowed domains에 `www.bisphuket.ac.th`, `cdn.bisphuket.ac.th` 추가(패키지 관리자 허용 유지) 후 새 세션에서 같은 파일럿 재실행 — 추천 / B) 로컬에서 사람이 `ONLY=bisp RUNS=3 ./scripts/pilot.sh` 실행 후 결과 공유
