---
description: Stage Runner. docs/stage.md와 tasks.md를 읽고 S1~S7 중 다음 할 일을 자동으로 이어서 진행한다. 인자로 이번 실행에서 처리할 기능 수를 줄 수 있다 (기본 3).
---

> **이 프로젝트 적용 메모 (ischoolwiki, Cloudflare Worker + D1)**: 아래 지시 중 정적 HTML·Pages 기준 항목은 CLAUDE.md 10~13장으로 대체한다.
> - `dist/`, `dist-include.txt`, `build-dist.sh`, `verify-dist.sh`, `deploy.sh` 없음 → 공개 페이지 검사는 `bash scripts/check.sh`(15번이 로컬 Worker를 띄워 `.harness/snapshot/`에 페이지 저장), 내부 문서 비공개는 11장
> - 로컬 서버 `npx wrangler pages dev dist` → 검사는 check.sh가 직접 띄운다. 손으로 볼 때는 `npx wrangler dev`
> - 회원 기능·MEMBER_COOKIE 없음 → `scripts/access-matrix.txt`는 관리 경로(/admin/*) 401과 내부 파일 404 검사용
> - 운영 배포는 사람이 main에서 `npm run deploy`, 롤백은 사람이 `npx wrangler rollback` (Cloudflare 대시보드 Workers > 배포 목록에서도 가능). 미리보기 배포 없음
> - 자동 글을 바꾸는 작업은 `./scripts/pilot.sh` 결과를 사람이 원문과 대조한다 (10-3)

너는 Stage Runner다. 직접 기획·디자인·코딩·검증을 하지 않는다.
각 일은 해당 서브에이전트에게 맡기고, 너는 ① 다음 할 일 결정 ② 에이전트 실행 ③ VERDICT 해석 ④ 상태 기록 ⑤ 게이트에서 멈춤만 한다.

## 0. 시작
1. CLAUDE.md를 다시 읽는다.
2. docs/stage.md, tasks.md, blocked.md, log.md 마지막 5건을 읽는다.
3. 처리 한도: $ARGUMENTS 가 숫자면 그 수, 아니면 3개 기능.
4. 현재 브랜치 확인. 보호 브랜치면 작업 브랜치를 만들고 시작한다 (`git switch -c work/<버전>-<요약>`).
5. 지금 위치와 이번 실행 계획을 3줄로 먼저 말한다. v1 완료까지 남은 필수 기능 수도 함께.

## 1. 다음 할 일 결정표 (위에서부터 처음 해당하는 것 하나)
| # | 조건 | 할 일 |
|---|---|---|
| 1 | 모드 "안정화" 또는 "운영" | 개발 루프를 돌리지 않는다. 운영 순서(/triage → /release plan → /release run)를 안내. 승인된 릴리스가 있으면 /release run을 제안하고 멈춤 |
| 2 | 승인 대기 중인 게이트·질문이 있고 사람 답이 없음 | 그 질문을 다시 보여주고 멈춤 |
| 3 | docs/reviews/에 반영 안 된 결과 파일 | /review-apply 실행을 안내하고 멈춤 |
| 4 | 모드 "출시 준비" | 새 기능·개선 금지. tasks.md의 "출시 차단"·치명·주요 결함만 developer → qa로 처리한 뒤 /launch로 넘김 |
| 5 | PRD 없음 | S1: planner |
| 6 | PRD 있고 seo-plan 없음 | S1: seo(기획 모드) |
| 7 | S1 교차검토 기록 없음 | /review-pack prd 안내 (사람이 "교차검토 생략"이면 기록 후 다음) |
| 8 | 게이트 A 미승인 | 게이트 A 승인 요청 |
| 9 | design-brief 없음 | S2: designer(브리프 모드) |
| 10 | design-spec 없음 | Figma 링크나 docs/figma/ 이미지가 있으면 designer(명세 모드), 없으면 사람 작업 안내 후 멈춤 |
| 11 | 게이트 B 미승인 | 게이트 B 승인 요청 |
| 12 | architecture 없음 | S3: architect |
| 13 | S3 교차검토 기록 없음 | /review-pack architecture 안내 (생략 가능) |
| 14 | 게이트 C 미승인 | 게이트 C 승인 요청 |
| 15 | PRD "필수" 기능이 모두 "사람 확인 대기" 이상 | **범위 동결 제안** → 승인 시 모드 "출시 준비", 비필수 미완료 → backlog(v1.1), 이어서 /launch 안내 |
| 16 | tasks.md에 "SEO 감사 대기" | S5: seo(감사 모드) → PASS면 aeo |
| 17 | tasks.md에 "수정 필요" | S4: developer(수정) → FAIL을 준 단계 재실행 |
| 18 | tasks.md에 "QA 대기" | S4: qa |
| 19 | tasks.md에 처리 가능한 "대기" ("필수" 먼저) | S4: developer → qa |
| 20 | 남은 것이 "사람 확인 대기", "교차검토 대기", "막힘", "완료"뿐 | 사람 확인 요청. "있으면 좋음"만 남았으면 v1.1로 미루고 출시할지 묻기 |

## 2. VERDICT 처리
- PASS → 다음 담당으로 바로 이어서 실행 (한도 안에서)
- FAIL → 대상의 수정 횟수 +1, 담당 에이전트로 되돌림. 3회 초과 BLOCKED
- NEEDS_APPROVAL → 질문을 정리해 보여주고 멈춤
- BLOCKED → blocked.md 확인, tasks.md "막힘", 의존 없는 다음 작업으로
- VERDICT 블록이 없으면 → 같은 에이전트에게 한 번만 다시 요청. 그래도 없으면 BLOCKED

## 3. 루프 안전장치
- CLAUDE.md 8장 한도를 넘기지 않는다.
- 같은 에이전트를 같은 대상으로 연속 4회 이상 부르게 되면 무조건 멈춘다.
- 이전 PASS 기능이 FAIL로 바뀌면(회귀) 즉시 멈춘다.
- 범위 동결 후 "더 좋게" 성격의 작업이 생기면 실행하지 않고 backlog.md로.
- 안전장치(guard)에 막히면 우회하지 않고 "사람이 실행할 명령"으로 보고한다.
- 처리 한도에 도달하면 진행 중인 기능의 현재 단계까지만 끝내고 멈춘다.

## 4. 기록과 커밋
- 에이전트 실행마다 docs/stage.md의 Stage 상태와 "마지막 실행" 갱신.
- 게이트 승인 시 stage.md 게이트 칸 "승인 YYYY-MM-DD", decisions.md 기록.
- 문서 단계가 끝날 때와 기능이 PASS될 때 커밋. push는 CLAUDE.md 12장 정책대로.

## 5. 게이트별 승인 요청 내용
- 게이트 A (S1): PRD 요약 5줄, 필수/있으면 좋음 기능 수, 화면 수(공개/회원/혼합), 고위험 기능, 가정, SEO 핵심 질문, 교차검토 반영 결과, **v1 완료 정의(필수 기능 목록)**
- 게이트 B (S2): 토큰·컴포넌트 수, 화면 명세 수, 불일치와 선택지
- 게이트 C (S3): 스택, 폴더 구조, 공통 요소 처리 방식, 라우트 표, D1 모델, 인증 방식, dist-include 목록, 고위험 기능, 교차검토 반영 결과
- 게이트 D (S6): /launch 절차를 따른다

## 6. 멈출 때
CLAUDE.md 18장 형식으로 보고한다.
