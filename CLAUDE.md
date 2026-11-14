# 프로젝트 하네스 규칙 v4 (모든 에이전트 공통)

이 파일은 이 프로젝트에서 일하는 메인 Claude(Stage Runner)와 모든 서브에이전트가 반드시 따르는 규칙이다.
세션을 시작할 때, 그리고 `/build` 등 명령을 실행할 때마다 다시 읽는다.
이 규칙과 사용자의 대화 지시가 충돌하면, 실행하기 전에 충돌 내용을 알리고 확인을 받는다.

---

## 1. 핵심 원칙
1. **사람은 방향을 정하고 판단한다. AI는 계획·구현·검증을 맡는다.**
2. AI는 "만들어줘"가 아니라 기준 문서(PRD, 디자인 시스템, 구조 설계)에 따라 일한다.
3. 한 번에 하나만 한다. 기능 하나, 수정 하나, 릴리스 하나.
4. 모든 작업은 PASS / FAIL / NEEDS_APPROVAL / BLOCKED 중 하나로 판정하고 끝낸다.
5. **끝나는 기준이 먼저다.** 완료 정의(5장)를 만족하면 더 좋게 만들 수 있어도 멈춘다.
6. 내부 문서(이 파일, docs/, .claude/)는 절대 공개 사이트에 나가지 않는다. (11장)
8. 이 사이트의 글은 AI가 자동으로 쓴다. 학교 사실은 학교가 공개한 자료에만 근거하고, 검증(`src/verify.ts`, `src/grounding.ts`)을 약하게 만들지 않는다.
7. 운영 배포, 원격 데이터베이스 변경, 운영 비밀 값, AUTO_PUBLISH는 사람만 한다. main 반영은 12장 조건(PR + check.sh 전체 PASS)을 만족할 때 AI가 PR을 병합한다. (12장, 13장)

## 2. 기준 문서 우선순위
1. `docs/PRD.md` — 무엇을, 누구를 위해, 어디까지 만들지
2. `docs/design-spec.md` + 피그마 — 화면과 디자인 시스템
3. `docs/architecture.md` — 폴더 구조, 데이터 모델, 라우트, 코드 규칙, 기능별 구현 지침
4. `docs/seo-plan.md` — 공개 페이지의 URL, 제목, 검색 의도
5. 이 파일 10장(기술 스택과 검사 명령) — 실행·검사·배포 방법
6. 그 외 사용자의 대화 지시

- PRD에 없는 기능은 만들지 않는다. 필요해 보이면 `docs/backlog.md`에 적는다.
- 범위 변경은 `/change` 절차를 거친다. 개발 중에 범위를 몰래 넓히지 않는다.
- architecture.md를 벗어나는 코드 배치·라이브러리·패턴은 쓰지 않는다. 바꿔야 하면 architect에게 되돌린다.
- 기준 문서끼리 충돌하면 추측하지 말고 NEEDS_APPROVAL로 멈춘다.

## 3. 에이전트와 책임
| 에이전트 | 하는 일 | 하지 않는 일 |
|---|---|---|
| planner | start.md → PRD, tasks.md, 범위 변경 분석 | 코드 작성 |
| seo | 기획 모드: 검색 의도·URL·메타 설계 / 감사 모드: 공개 페이지 점검 | 검색 콘솔 직접 제출, 문구 무단 변경 |
| designer | 브리프 모드: Claude Design·Figma용 브리프 / 명세 모드: Figma → design-spec | 피그마에 없는 값 지어내기 |
| architect | 구조 설계, 기능별 구현 지침, 구조 변경 판단 | 기능 구현 |
| developer | 기능 하나씩 구현, FAIL 항목 수정 | PRD·구조 밖 코드, 요청 없는 리팩터링 |
| qa | 검사 명령 실행, 수용 기준·디자인·구조·접근권한 검증 | 제품 코드 수정 |
| aeo | AI 답변 엔진 인용 최적화 | 사실 아닌 내용 생성, 숨김 지시문 |
| release | 출시 점검, 배포물 격리 확인, 배포·롤백 절차, 출시 후 확인 | 직접 운영 배포, 범위 밖 수정 |
| ops | 운영 요청 분류(P0~P3), 릴리스 계획, 주간 리뷰 | 분류 없이 개발 지시 |
| (외부) GPT 등 | 교차 검토 (PRD, 구조, 고위험 기능) | 직접 코드 수정 |
| Stage Runner | `/build` 실행 시 메인 Claude. 순서 관리, VERDICT 해석, 게이트 정지 | 직접 기획·구현·검증 |

## 4. Stage와 게이트, 모드

### 4-1. Stage
```
S1 기획        planner → seo(기획 모드) → [교차검토 PRD]        ─◆게이트 A: PRD 승인
S2 디자인      designer(브리프) → 사람: Claude Design 시안 → Figma 확정
               → designer(명세)                                  ─◆게이트 B: 디자인 시스템 승인
S3 구조 설계   architect → [교차검토 구조]                        ─◆게이트 C: 구조 승인
S4 구현 루프   기능마다 developer → qa   (FAIL이면 반복, 기능당 3회)
               고위험 기능은 [교차검토 기능] 추가
S5 최적화      seo(감사 모드) → aeo      (공개 페이지 기능만)
               ── PRD "필수" 기능이 모두 PASS 되는 순간: 범위 동결 제안 ──
S6 출시 준비   release(출시 점검)                                 ─◆게이트 D: 출시 승인 → 사람이 운영 배포
S7 운영        안정화 기간 → 정기 릴리스 주기 (ops 분류 → /release)
```

### 4-2. 모드 (docs/stage.md 맨 위에 기록)
| 모드 | 시작 조건 | 허용되는 일 |
|---|---|---|
| 개발 | 프로젝트 시작 | S1~S5 전부 |
| 출시 준비 | 범위 동결 승인 | 치명·주요 결함 수정, 출시 점검 실패 항목 수정만 |
| 안정화 | 첫 운영 배포 후 출시 후 확인 PASS | P0·P1만 처리. P2·P3는 기록만 |
| 운영 | 안정화 기간 종료 승인 | 정기 릴리스(최대 5항목), P0 핫픽스 |

### 4-3. 게이트
- 게이트 A~D에서는 반드시 멈추고 사람의 명시적 승인("승인", "진행해" 등 분명한 표현)을 받는다.
- "좋네", "음" 같은 모호한 반응은 승인이 아니다. 승인인지 다시 묻는다.
- 이전 Stage의 산출물과 게이트 승인이 없으면 다음 Stage로 가지 않는다.
- 승인은 docs/stage.md 게이트 칸과 docs/decisions.md에 날짜와 함께 기록한다.

## 5. 완료 정의와 범위 동결 (무한 루프 방지)

### 5-1. v1 완료 정의 (Definition of Done)
아래가 모두 참이면 v1은 끝난 것이다. 더 좋게 만들 수 있어도 끝이다.
1. PRD에서 우선순위 "필수"인 기능이 모두 "완료"
2. 열린 치명·주요 결함 0건 (qa-report, seo-report, aeo-report, reviews 기준)
3. `docs/release-checklist.md`의 자동 점검 PASS, 사람 점검 확인 완료
4. 게이트 D 승인

### 5-2. 범위 동결 (Scope Freeze)
- PRD "필수" 기능이 모두 "사람 확인 대기" 이상이 되면 Stage Runner는 범위 동결을 제안한다.
- 승인되면 모드를 "출시 준비"로 바꾸고, "필수"가 아닌 미완료 작업은 backlog.md로 옮긴다(v1.1 표시).
- 동결 이후 허용: 치명·주요 결함 수정, 출시 점검 실패 항목 수정.
- 동결 이후 금지: 디자인 미세 조정, 문구 다듬기, "있으면 좋음" 기능, 새 아이디어 → 전부 backlog.md.
- 동결 해제는 사람이 "범위 동결 해제"라고 명시하고 이유를 decisions.md에 남길 때만.

### 5-3. "더 좋게" 요청 규칙 (모든 모드 공통)
- 개선 요청은 근거가 하나 이상 있어야 작업 대상이 된다: ① 사용자 문의·불만 ② 측정 지표 ③ 오류 로그 ④ 법·보안 요구.
- 근거 없는 "좀 더 세련되게", "조금 더 다듬어서"는 backlog.md로 보낸다.
- 같은 화면에 대한 디자인·문구 수정은 한 릴리스(또는 개발 모드에서는 한 번의 /build)에 1회만.
- 이미 "완료"된 기능을 다시 여는 것은 재현 가능한 결함일 때만.

## 6. 판정(VERDICT) 규칙
모든 에이전트는 작업이 끝나면 마지막에 아래 블록을 출력하고, 같은 내용을 docs/log.md에도 남긴다.
Stage Runner는 이 판정만 보고 다음 행동을 결정한다.

```
### VERDICT
- 결과: PASS | FAIL | NEEDS_APPROVAL | BLOCKED
- 단계/대상: (예: S4 / F-03)
- 근거: (한두 줄, 상세는 리포트 경로)
- 다음 담당: (에이전트명 또는 "사람")
```

| 판정 | 뜻 | Stage Runner 행동 |
|---|---|---|
| PASS | 기준을 모두 충족 | 다음 담당 실행 또는 다음 Stage |
| FAIL | 기준 미충족, 고칠 수 있음 | 수정 횟수 +1, 담당 에이전트로 되돌림 |
| NEEDS_APPROVAL | 사람 판단이 필요 | 질문 정리 후 멈춤 |
| BLOCKED | 진행 불가 | blocked.md 기록, 의존 없는 다음 작업으로 |

판정 원칙
- "대체로 괜찮음"은 판정이 아니다.
- 확인하지 못한 항목(미확인)이 하나라도 있으면 PASS를 주지 않는다. 미확인 사유가 환경 문제면 BLOCKED, 사람 확인이 필요하면 NEEDS_APPROVAL.
- 검사 명령(10장)이 "SKIP"을 낸 항목은 미확인으로 취급한다.

## 7. 작업 상태값 (docs/tasks.md)
| 상태 | 의미 | 다음 담당 |
|---|---|---|
| 대기 | 시작 전 | developer |
| 진행 | 구현 중 | developer |
| QA 대기 | 구현 완료 | qa |
| 수정 필요 | FAIL 판정 받음 | developer |
| 교차검토 대기 | 고위험 기능, QA PASS | 사람 (/review-pack) |
| SEO 감사 대기 | 공개 페이지 포함 기능, QA PASS | seo → aeo |
| 사람 확인 대기 | 자동 검증 모두 PASS | 사람 |
| 완료 | 사람 확인 끝 | - |
| 막힘 | BLOCKED | 사람 |

tasks.md 표 형식
```
| 순서 | 기능 ID | 기능명 | 우선순위 | 위험도 | 화면 | 공개 여부 | 의존 | 상태 | 수정 횟수 | 버전 | 메모 |
```
- 우선순위: 필수 / 있으면 좋음
- 위험도: 일반 / 고위험 (인증, 회원 권한, 결제, 개인정보, 데이터 삭제, 외부 연동)
- 공개 여부: 공개 / 회원 전용 / 혼합
- 버전: v1, v1.1 … (운영 모드에서 릴리스 번호)

## 8. 반복 제한과 중단 조건
- 기능당 수정(FAIL → 재작업)은 최대 3회. QA, SEO, AEO, 교차검토, 출시 점검 실패를 모두 합산한다. (`수정 2/3`)
- 문서 단계(PRD, 디자인 명세, 구조 설계)의 수정 요청은 단계당 최대 3회.
- 핫픽스 수정은 최대 2회. 넘으면 롤백을 제안한다.
- 즉시 멈추고 `docs/blocked.md` 기록 후 보고하는 경우:
  - 3회 수정 후에도 FAIL
  - 같은 원인의 FAIL이 2회 연속
  - 기준 문서끼리 충돌
  - 외부 계정, API 키, 결제 정보, 운영 데이터베이스 접근이 필요
  - 기존 데이터 삭제, 대규모 구조 변경이 필요
  - 하나를 고치자 이전에 PASS였던 기능이 FAIL로 바뀜 (회귀)
  - 안전장치(13장)에 막힌 명령을 다른 방식으로 우회해야만 진행되는 상황
- 한 번의 `/build`에서 처리할 기능 수 기본값은 3개.
- 같은 에이전트를 같은 대상으로 연속 4회 이상 호출하게 되면 무조건 멈춘다.

## 9. 교차 검토 (다른 AI)
같은 AI가 만들고 검사하면 같은 맹점을 공유한다.
- 필수: S1의 PRD, S3의 구조 설계
- 기능 단위: tasks.md에서 "고위험"인 기능
- 절차: `/review-pack 대상` → 사람이 GPT에 붙여 넣거나 Codex CLI로 실행 → 결과를 docs/reviews/에 저장 → `/review-apply 대상`
- 교차 검토 의견은 "제안"이다. 해당 에이전트가 기준 문서와 실제 코드로 사실을 확인해 반영/보류/기각을 판단하고, 기준 문서를 바꾸는 반영은 사람 승인을 받는다.
- 사람이 "교차검토 생략"이라고 하면 생략 사실을 stage.md와 decisions.md에 기록하고 진행한다.

---

## 10. 기술 스택과 검사 명령 (활성 프로필)

> 이 장은 프로젝트마다 다르다. 현재 활성 프로필: **Cloudflare Worker + D1 (서버 렌더링)** — `.claude/stack/profile-cloudflare-worker-d1.md`
> 하네스 원본의 기본 프로필(정적 HTML + Pages Functions)은 `.claude/stack/profile-static-cloudflare-d1.md`에 보관만 한다.
> 프로젝트별 값(사이트 주소, Worker 이름, 브랜치 이름, 검사 포트)은 `harness.config.sh` 한 곳에서 관리한다.

### 10-1. 구성
| 영역 | 사용 | 메모 |
|---|---|---|
| 페이지 | Worker가 요청마다 HTML을 만든다 (`src/index.ts` 라우트, `src/render.ts` 공통 틀) | 정적 HTML 파일·빌드 폴더 없음. 공개 페이지 본문은 서버에서 HTML로 완성되어 나간다 |
| 자동 글 파이프라인 | `src/pipeline.ts` (Cron 매일 01:17 UTC): 수집 → 추출 → 작성 → 검증 → 번역 | 검증 `src/verify.ts`, 근거 검사 `src/grounding.ts`. **검증을 약하게 만드는 변경은 고위험(교차 검토 필수)** |
| AI 호출 | Anthropic API (`src/generate.ts`, `src/collect.ts`, `src/grounding.ts`) | 모델 이름은 `src/generate.ts`의 `MODEL` |
| 데이터 | Cloudflare D1 (바인딩 `DB`) | 스키마 변경은 `migrations/`의 마이그레이션 파일로만 |
| 비밀 값 | 운영: `wrangler secret` (ANTHROPIC_API_KEY, ADMIN_TOKEN, ALERT_WEBHOOK_URL) / 로컬: `.dev.vars` | 절대 커밋·출력하지 않음. `scripts/pilot.sh`는 .dev.vars를 만들고 끝나면 지운다. 클라우드 세션은 키를 `ISCHOOLWIKI_ANTHROPIC_KEY` 환경 변수로 받는다 |
| 관리 경로 | `/admin/*` (Bearer ADMIN_TOKEN) | 회원 기능은 없다 |
| 호스팅 | Cloudflare Workers (`wrangler.toml`), https://ischoolwiki.com (사용자 지정 도메인, www는 apex로 301). workers.dev 주소는 꺼짐(2026-11-13) — 관리 요청도 ischoolwiki.com으로 |

### 10-2. 명령
| 목적 | 명령 | 누가 |
|---|---|---|
| **전체 검사 (QA 기준)** | `bash scripts/check.sh` | 누구나 |
| 타입·단위 테스트만 | `bash scripts/check.sh 10` | 누구나 |
| 로컬 서버 | `npx wrangler dev` (http://localhost:8787) | 누구나 |
| 로컬 파일럿 (실제 AI 호출로 글 작성·검증) | `./scripts/pilot.sh` | developer, qa (API 비용 발생) |
| 로컬 DB 마이그레이션 | `npm run db:migrate:local` | developer |
| 안전장치 시험 | `bash scripts/test-guard.sh` | 누구나 |
| 운영 노출 검사 | `bash scripts/verify-live.sh` | release |
| **운영 배포** | `npm run deploy` (main에서) | **사람만** (13장에서 차단) |
| **원격 DB 마이그레이션·실행** | `npm run db:migrate:remote`, `wrangler d1 … --remote` | **사람만** (13장에서 차단) |
| **운영 비밀 값** | `npx wrangler secret put …` | **사람만** |
| **학교 추가·운영 반영 한 번에** (운영 DB에 seed, 배포, 글 쓰기 반복) | `./scripts/publish-school.sh <slug> [--deploy] [--runs N]` | **사람만** (13장에서 차단) |

### 10-3. 검사 명령 `scripts/check.sh` 구성
`scripts/check.d/`의 스크립트를 번호 순서로 실행하고 항목별 PASS / FAIL / SKIP을 요약한다.
| 순서 | 검사 | 내용 |
|---|---|---|
| 10 | 코드 | `tsc --noEmit` 타입 검사, `vitest` 단위 테스트 (검증기가 틀린 수치·지어낸 이름을 거르는지 포함) |
| 15 | 스냅샷 | 별도 로컬 D1(`.harness/d1`)에 마이그레이션·시드·검사용 글(`scripts/fixtures/`)을 넣고 로컬 Worker를 띄워, 첫 화면부터 링크를 따라가며 페이지를 `.harness/snapshot/`에 저장. 열리지 않는 내부 페이지가 있으면 FAIL |
| 20 | HTML 구조 | 스냅샷 페이지마다 h1 1개, title·meta description·lang·alt, 제목 단계 건너뜀, 중복 id, title 중복 |
| 30 | 링크·목차 | 스냅샷 안에서 내부 링크 대상과 `#앵커` 대상 id 존재 |
| 40 | 접근 | `scripts/access-matrix.txt`: 관리 경로가 토큰 없이 401, 내부 파일 경로가 404 |
| 50 | 비밀 값 | 배포될 번들(`wrangler deploy --dry-run`, 올리지 않음)과 저장소 파일에 키·토큰 패턴 없음, 비밀 파일 미커밋 |

- 20·30·40은 15의 결과를 쓴다. 일부만 돌릴 때도 `bash scripts/check.sh 15 20`처럼 15를 함께 넣는다.
- 결과에 SKIP이 하나라도 있으면 QA는 PASS를 주지 않는다 (6장).
- 자동 글의 품질(근거 없는 문장, 출처 오인용)은 check.sh로 잡히지 않는다. 파이프라인을 바꾸는 기능은 `./scripts/pilot.sh` 결과를 사람이 원문과 대조한 기록을 qa-report에 남긴다.

### 10-4. 스택 규칙
- 공개 페이지는 서버에서 완성된 HTML로 나간다. JS로 본문을 채우는 공개 페이지 금지. 외부 스크립트·CDN 없음 (architecture.md 허용 목록에 있을 때만).
- 디자인 토큰은 `src/render.ts`의 `:root` CSS 변수로만 정의하고, 화면 코드는 변수만 쓴다.
- 페이지에 나오는 학교 사실(숫자·이름)은 D1 `facts`에 출처와 함께 기록된 것만. 추정·보간 금지 (`src/summary.ts` 방식).
- D1 스키마 변경은 마이그레이션 파일로만. 로컬에서 적용·검증까지 하고, 원격 적용은 사람이 한다.
- `wrangler.toml`의 `AUTO_PUBLISH`는 사람이 결정한다. 에이전트는 바꾸지 않는다.
- 운영 데이터를 바꾸는 관리 요청(`/admin/run`, `/admin/unpublish` 등)은 사람만 보낸다.

## 11. 배포물 격리 (내부 문서 공개 방지)
이 프로젝트는 Worker가 코드에 정의된 라우트만 응답한다. 저장소 파일을 그대로 내보내는 정적 자원 설정(`[assets]`, `[site]`)이 없으므로 CLAUDE.md, docs/, .claude/는 사이트 주소로 열리지 않는다. 하네스 원본의 dist/ 허용 목록 방식은 쓰지 않는다.

규칙
1. `wrangler.toml`에 `[assets]`·`[site]`를 추가하지 않는다. 필요해지면 architect 결정과 사람 승인을 받고, 공개 폴더를 따로 두고 이 장을 다시 쓴다.
2. 내부 파일을 응답하는 라우트(파일 읽기, 디렉터리 노출)를 만들지 않는다.
3. `scripts/check.sh 40`이 로컬에서 `/CLAUDE.md`, `/docs/PRD.md`, `/wrangler.toml`, `/package.json`이 404인지 확인한다.
4. 운영 배포 후 `scripts/verify-live.sh`로 운영 주소에서 같은 경로가 열리지 않는지 확인한다.
5. 내부 문서는 docs/ 또는 .claude/ 아래에 둔다.

## 12. Git 브랜치·push·배포 정책
`harness.config.sh`의 `PUSH_POLICY`로 정한다. **현재: A**. 배포는 Git 연동이 아니라 사람이 main에서 `npm run deploy`로 한다. 그래서 작업 브랜치 push가 미리보기 배포를 만들지 않는다.

### 정책 A (현재)
| 행동 | 허용 |
|---|---|
| 작업 브랜치(main이 아닌 모든 브랜치)에서 커밋 | 자유 |
| 작업 브랜치 push | 자유 (클라우드 세션의 자동 push 규칙 허용) |
| main에 직접 커밋·push, 로컬에서 main으로 병합 | **금지** (13장에서 차단) |
| main 반영 (PR 병합) | **AI가 GitHub에서 PR을 병합** (2026-11-13 사람 결정). 조건: ① 작업 브랜치에서 PR 생성 ② 병합 직전 PR 머리 커밋에서 `bash scripts/check.sh` 전체 PASS (FAIL·SKIP이 하나라도 있으면 병합하지 않고 보고) ③ 병합할 때 검사한 커밋 SHA를 지정 ④ 게이트 A~D 대상이면 해당 게이트 승인 후. 병합 후 사람에게 알린다 |
| 강제 push, 브랜치 삭제 push, 원격 이력 변경 | **금지** |
| 운영 배포 | **사람만**: main 병합 후 `git pull && npm run deploy` |

### 정책 B (엄격)
- 모든 `git push`는 사람 승인 후에만. 13장 안전장치가 모든 push를 막는다.
- 클라우드 세션 설정에서 "작업 끝나면 커밋하고 push" 자동 규칙을 꺼야 한다. 끄지 않으면 세션이 매번 막혀 멈춘다.

### 공통
- 기능 하나가 PASS될 때마다 커밋: `[F-01] 기능명: 요약` / 수정은 `[F-01] fix: 요약` / 핫픽스는 `[HOTFIX] 요약`
- 작업 브랜치 이름: `work/버전-요약` 또는 세션이 자동으로 만든 브랜치 그대로
- 커밋 전에 `git status`로 .dev.vars, .env*, .harness/ 가 스테이징되지 않았는지 확인한다 (.gitignore에 포함).

## 13. 안전장치
두 겹으로 막는다. 둘 다 "실수 방지" 장치이며, 우회하려는 시도 자체가 금지다 (8장 중단 조건).

1. `.claude/settings.json` 권한 거부(deny): 비밀 파일 읽기(.env*, .dev.vars*), 강제 push, 비밀 값 관리, D1·Worker 삭제, `npm run deploy`, `npm run db:migrate:remote`, `wrangler deploy`.
2. `.claude/hooks/guard.sh` (모든 Bash 명령 실행 전 검사): 옵션 위치와 상관없이 판별해야 하는 것.
   - `wrangler d1 execute|migrations apply` + `--remote`
   - Worker 배포: `wrangler deploy`(`--dry-run` 제외), `versions deploy`, `rollback`, `triggers deploy`, `wrangler delete`, `npm run deploy`, `npm run db:migrate:remote`
   - 운영 비밀 값 변경 (`wrangler secret put|delete|bulk`)
   - 정책 A: main 커밋·push·병합, 강제 push / 정책 B: 모든 push
   - `rm -rf` 로 프로젝트 밖·최상단·.git 삭제, 비밀 파일 출력
- 안전장치는 명령 문자열 전체를 검사한다. 명령 안의 문자열(heredoc 내용 포함)에 차단 패턴이 있어도 막힌다. 그럴 때는 파일 쓰기 도구로 파일을 만든다 (우회가 아니라, 그 명령을 실행하지 않는 방법).
- 동작 확인: `bash scripts/test-guard.sh` (`scripts/guard-cases.txt`의 명령을 실행하지 않고 판정만 시험)
- 막히면 우회하지 말고 사람에게 "이 명령은 사람이 직접 실행해야 합니다"와 정확한 명령을 알려준다.

---

## 14. 문서 규칙
모든 내부 문서는 `docs/` 아래에 한국어로 작성한다. (사이트 원본 폴더에 두지 않는다)

| 파일 | 작성자 | 내용 |
|---|---|---|
| stage.md | Stage Runner | 모드, Stage, 게이트, 반복 횟수, 버전 |
| PRD.md | planner | 제품 요구사항 |
| tasks.md | planner 생성, 전원 갱신 | 작업 목록과 상태 (7장 형식) |
| seo-plan.md | seo | 공개 페이지 검색 설계 |
| design-brief.md | designer | Claude Design·Figma용 브리프 |
| design-spec.md | designer | 디자인 토큰, 컴포넌트, 화면 명세 |
| architecture.md | architect | 구조 설계, 기능별 구현 지침 |
| qa-report.md | qa | 기능별 검증 결과 |
| seo-report.md | seo | 공개 페이지 감사 |
| aeo-report.md / aeo-prompts.md | aeo | AI 답변 최적화, 측정 질문 |
| release-checklist.md | release | 출시 점검표와 결과 |
| runbook.md | release | 배포·롤백·장애 대응 절차 |
| reviews/ | 교차 검토 | 검토 요청서와 결과 |
| ops/inbox.md | ops | 운영 요청·오류 분류 |
| ops/releases.md | ops, release | 릴리스 계획과 노트 |
| ops/incidents.md | ops | 장애 기록 |
| ops/metrics.md | 사람 입력, ops 정리 | 주간 지표 |
| decisions.md | 전원 | 사람이 내린 결정 |
| backlog.md | 전원 | 범위 밖 아이디어 (근거·건수 누적) |
| blocked.md | 전원 | 막힌 항목 |
| log.md | 전원 | 작업 일지 (VERDICT 포함) |

### log.md 형식
```
## YYYY-MM-DD HH:MM · [에이전트명] · [Stage/대상]
- 한 일:
- 결과:
### VERDICT
- 결과: / 단계/대상: / 근거: / 다음 담당:
```

### blocked.md 형식
```
## [대상] 제목 · YYYY-MM-DD
- 증상:
- 시도한 방법: 1) 2) 3)
- 추정 원인:
- 사람이 결정할 것: 선택지 A / B와 각각의 영향, 추천안
```

### decisions.md 형식
```
## YYYY-MM-DD · 주제
- 결정: / 이유: / 영향 받는 문서·기능:
```

### backlog.md 형식
```
| ID | 날짜 | 내용 | 출처(에이전트/사람/운영 요청) | 근거 | 건수 | 대상 버전 |
```

## 15. 공개 페이지·회원 전용 페이지 규칙
- PRD 화면 목록의 모든 화면을 "공개", "회원 전용", "혼합(일부 회원 전용)"으로 표시한다.
- 회원 전용 화면: noindex, sitemap 제외, 서버(Functions)에서 접근 차단. 미리보기 문구도 공개 HTML에 노출하지 않는다.
- 혼합 화면: 공개 부분만 검색 대상. 회원 전용 부분이 공개 HTML 소스에 들어 있으면 안 된다.
- `scripts/access-matrix.txt`에 회원 전용·혼합 화면 경로를 모두 등록한다. 새 회원 전용 화면을 만들면 developer가 추가한다.
- 검색·AI 최적화를 이유로 PRD에 없는 페이지를 만들지 않는다. 제안은 backlog.md로.
- 사이트 문구(카피) 변경은 제안까지만, 적용은 사람 승인 후.

## 16. 코드 공통 규칙
- 비밀 값은 `.dev.vars`(로컬)와 Cloudflare 대시보드(운영)에만. 코드·문서·로그·커밋에 쓰지 않는다. 예시가 필요하면 `.dev.vars.example`에 변수 이름만.
- 디자인 값은 design-spec 토큰(CSS 변수)만. 색상·크기 하드코딩 금지.
- 파일 위치, 명명, 데이터 접근 방식은 architecture.md를 따른다. D1 접근은 architecture.md에서 정한 공용 함수 경유.
- 사용자 입력은 서버(Functions)에서 검증한다. D1 쿼리는 항상 바인딩(prepare + bind)으로. 문자열 이어붙여 SQL 만들기 금지.
- 테스트나 수용 기준을 통과시키려고 기준을 약하게 바꾸지 않는다.

## 17. 운영 모드 규칙 (S7)

### 17-1. 요청 등급 (모든 요청은 ops를 거친다)
| 등급 | 기준 | 처리 |
|---|---|---|
| P0 장애 | 사이트 접속 불가, 핵심 흐름(문의·가입·로그인·회원 콘텐츠) 불가, 개인정보·보안 문제, 내부 문서 노출, 잘못된 비용·일정 정보 노출 | 즉시 `/hotfix`, 사람에게 바로 보고 |
| P1 주요 결함 | 기능 일부 오류, 특정 기기·브라우저에서 사용 불가 | 다음 릴리스 최우선. 영향 크면 `/hotfix` |
| P2 개선 | 근거 있는 개선 (5-3) | 다음 릴리스 후보 |
| P3 아이디어·신규 기능 | 근거 약한 개선, 새 기능 | backlog. 다음 버전 기획 때 |

### 17-2. 안정화 기간
- 첫 운영 배포 후 14일(harness.config.sh의 STABILIZE_DAYS). P0·P1만 처리하고 P2·P3는 쌓기만 한다.
- 이 기간에 실제 데이터(문의, 지표, 오류, 검색 노출)를 모은다.
- 종료일이 지나면 ops가 요약하고, 사람이 승인하면 "운영" 모드로 전환한다.

### 17-3. 정기 릴리스
- 주기: 2주 (RELEASE_CYCLE_DAYS). 릴리스당 최대 5항목.
- 모든 항목은 S4·S5 루프를 그대로 거친다. 수정 3회 제한 동일.
- 3회 안에 PASS 못 한 항목은 이번 릴리스에서 빼고 다음으로 미룬다. 릴리스 전체를 붙잡지 않는다.
- 새 기능(P3 승격)은 `/change`로 PRD 버전을 올린 뒤에만 릴리스 후보.
- 배포 전 check.sh 전체, 배포 후 출시 후 확인과 verify-live.sh.

### 17-4. 버전
- v1.0.x 핫픽스 / v1.x 정기 릴리스 / v2 새 기획 사이클(S1부터)

## 18. 보고 형식 (멈출 때마다)
```
### 진행 보고 · 모드 [ ] · Stage [S?]
- 이번 실행에서 PASS:
- 사람 확인 대기: (확인 방법: 명령, 열어볼 URL)
- 막힘: (대상, 한 줄 사유)
- 결정해 주셔야 할 것: (선택지와 추천)
- 사람이 직접 실행할 명령: (운영 배포, 원격 DB 등 — 정확한 명령)
- 교차 검토 필요:
- v1 완료까지 남은 필수 기능: n개
- 다음 /build에서 할 일:
```
보고는 짧게. 상세는 docs 파일 경로로 안내한다.
