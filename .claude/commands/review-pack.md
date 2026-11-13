---
description: 다른 AI(GPT 등)에게 교차 검토를 맡길 요청서를 만든다. 인자로 대상(prd, architecture, 기능 ID 예: F-04)을 준다.
---

> **이 프로젝트 적용 메모 (ischoolwiki, Cloudflare Worker + D1)**: 아래 지시 중 정적 HTML·Pages 기준 항목은 CLAUDE.md 10~13장으로 대체한다.
> - `dist/`, `dist-include.txt`, `build-dist.sh`, `verify-dist.sh`, `deploy.sh` 없음 → 공개 페이지 검사는 `bash scripts/check.sh`(15번이 로컬 Worker를 띄워 `.harness/snapshot/`에 페이지 저장), 내부 문서 비공개는 11장
> - 로컬 서버 `npx wrangler pages dev dist` → 검사는 check.sh가 직접 띄운다. 손으로 볼 때는 `npx wrangler dev`
> - 회원 기능·MEMBER_COOKIE 없음 → `scripts/access-matrix.txt`는 관리 경로(/admin/*) 401과 내부 파일 404 검사용
> - 운영 배포는 사람이 main에서 `npm run deploy`, 롤백은 사람이 `npx wrangler rollback` (Cloudflare 대시보드 Workers > 배포 목록에서도 가능). 미리보기 배포 없음
> - 자동 글을 바꾸는 작업은 `./scripts/pilot.sh` 결과를 사람이 원문과 대조한다 (10-3)

대상: $ARGUMENTS

1. 자료 모으기
   - prd: start.md, docs/PRD.md, docs/seo-plan.md
   - architecture: PRD 기능·화면 요약, docs/architecture.md 전체, design-spec 토큰 요약, scripts/dist-include.txt, scripts/access-matrix.txt
   - 기능 ID: 해당 PRD 항목, architecture.md 구현 지침, 해당 기능 커밋 범위의 `git diff`, qa-report 해당 항목
2. 비밀 값(.dev.vars·.env 내용, 키, 토큰, 쿠키, 실제 개인정보)이 없는지 확인하고, 있으면 가린다.
3. docs/reviews/YYYY-MM-DD-[대상]-request.md 작성:

```
# 교차 검토 요청: [대상]

## 당신의 역할
당신은 이 자료를 처음 보는 시니어 [PM / 웹 아키텍트 / 보안 리뷰어]다.
작성자(다른 AI)의 의도를 좋게 해석하지 말고, 실제로 문제가 될 지점을 찾아라.

## 배경
서비스 한 문단, 대상 사용자, v1 범위, 기술 스택(정적 HTML + Cloudflare Pages Functions + D1 등)

## 검토 기준
[prd] 사용자 문제와 기능 연결이 약한 곳 / 측정 불가능한 수용 기준 / 빠진 예외 / 필수 범위가 과한 곳(줄일 수 있는 것) / 모순 / 개인정보·법적 위험
[architecture] PRD 기능 중 구조에서 빠진 것 / 과설계 / 하나 바꾸면 여러 곳이 깨질 결합 / 회원 전용 보호의 구멍(.html 직접 접근 등) / D1 권한·SQL 주입 / 배포물에 내부 파일이 섞일 위험 / 더 단순한 대안
[기능] 버그 가능성 / 인증 우회·권한·입력 검증·비밀 노출 / 예외 처리 누락 / 구조 규칙 위반 / 검사가 못 잡는 경우

## 자료
(모은 자료)

## 답변 형식 (반드시 이 표로)
| 번호 | 심각도(치명/주요/사소) | 위치 | 문제 | 근거 | 제안 |
마지막 줄: "전체 판단: 진행 가능 / 수정 후 진행 / 재설계 필요"
확실하지 않은 지적은 심각도 옆에 (추정).
```

4. 실행 안내
   - 수동: 내용을 ChatGPT(추론형 모델 권장)에 붙여 넣고, 답변을 docs/reviews/YYYY-MM-DD-[대상]-result.md 로 저장 → `/review-apply [대상]`
   - 자동(선택): Codex CLI가 설치돼 있으면 비대화형 실행으로 요청서를 넘기고 결과를 같은 경로에 저장하는 명령을 제안. 정확한 옵션은 `codex --help`로 먼저 확인하고, 실행은 내 승인 후에.
5. docs/stage.md 교차 검토 기록에 "요청됨" 추가

VERDICT: NEEDS_APPROVAL (외부 검토 대기)
