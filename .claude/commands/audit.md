---
description: 개발 진행과 별개로, 현재 구현된 공개 페이지 전체의 SEO·AEO 점검과 운영 노출 검사를 실행한다. 인자로 특정 페이지 ID나 경로를 줄 수 있다.
---

개발 단계는 진행하지 말고 아래만 해줘.

1. 대상: $ARGUMENTS 가 있으면 그 페이지만, 없으면 PRD의 공개·혼합 페이지 중 구현된 전부
2. `bash scripts/check.sh 10 20 30 50`
3. `bash scripts/verify-live.sh` (운영 주소). FAIL이면 맨 위에 P0로 보고하고 나머지 진행 전에 알려줘
4. seo(감사 모드) → aeo
5. tasks.md는 바꾸지 말고, seo-report.md·aeo-report.md에 "정기 감사 YYYY-MM-DD" 섹션으로 기록
6. 보고: 페이지별 통과/실패 요약, 바로 고칠 기술 문제(심각도 순), 문구 제안(승인 필요), 내가 결정할 것
7. 고칠 문제가 있으면: 개발 모드면 tasks.md 등록 여부를, 운영 모드면 /triage 등록 여부를 묻기
