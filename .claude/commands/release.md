---
description: 정기 릴리스 사이클. "plan"은 다음 릴리스 항목 선정, "run"은 승인된 항목을 S4·S5 루프로 처리하고 출시 점검까지 진행한다.
---

인자: $ARGUMENTS (plan 또는 run)

## plan
1. 모드가 "안정화"면 P1만 대상임을 먼저 알린다.
2. ops(릴리스 계획 모드) → docs/ops/releases.md (최대 RELEASE_MAX_ITEMS개)
3. 승인 후 tasks.md에 추가, 버전 번호(v1.x) 확정, stage.md 다음 릴리스 예정일 갱신

## run
1. 작업 브랜치 `work/v1.x-release` 에서 진행 (보호 브랜치면 새로 만든다)
2. 이번 릴리스 항목만 처리. 다른 버전 항목은 건드리지 않는다
3. 항목마다 developer → qa → (공개 페이지면) seo 감사 → aeo. 수정 3회 제한, 회귀 시 정지
4. 3회 안에 PASS 못 한 항목은 이번 릴리스에서 빼고 다음으로 (릴리스 전체를 붙잡지 않는다)
5. `bash scripts/check.sh` 전체 재실행
6. release(출시 점검 모드) 중 A, C, D, F, I 자동 항목 재점검
7. 릴리스 노트(releases.md): 변경 사항, 빠진 항목과 이유, 확인 방법, 필요한 원격 마이그레이션
8. 배포 승인 요청 → 사람이 배포(원격 마이그레이션 포함) 후 "배포 완료" → release(출시 후 확인 모드) → inbox.md 해당 항목 "종료", stage.md 버전·다음 릴리스 예정일 갱신
