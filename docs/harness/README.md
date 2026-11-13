# 웹사이트 프로젝트 Claude Code 하네스 v4

"만들어줘 → 고쳐줘"를 끝없이 반복하는 바이브 코딩 대신,
**기준 문서 → 역할별 에이전트 → PASS/FAIL 판정 루프 → 사람 승인 → 출시 → 운영** 구조로 서비스를 끝까지 완성하고 운영하기 위한 파일 묶음입니다.

사람은 방향을 정하고 판단합니다. AI는 계획·구현·검증을 맡습니다.
그리고 무엇보다, **언제 끝나는지**가 먼저 정해져 있습니다.

> 기본 스택 프로필: 정적 HTML + Cloudflare Pages Functions + D1 (beyondthai.net 기준)
> 다른 스택은 `.claude/stack/` 프로필로 CLAUDE.md 10장을 교체합니다.

---

## v4에서 반영한 검토 의견

| 지적 | 해결 |
|---|---|
| 1. 기술 스택이 Next.js 기준, QA가 `npm run build` | CLAUDE.md 10장을 **정적 HTML + Pages Functions + D1**로 교체. QA 기준을 `bash scripts/check.sh` 하나로 통일 (배포물 격리, HTML 구조, 링크·목차, 회원·비회원 접근, 비밀 값). 기존 검사 스크립트는 `scripts/check.d/`에 연결 |
| 2. 저장소 전체 배포로 docs/, CLAUDE.md, .claude/ 공개 | CLAUDE.md 11장 **배포물 격리**. 허용 목록(`scripts/dist-include.txt`)에 있는 것만 `dist/`로 복사, `verify-dist.sh`가 내부 파일 포함 시 배포 중단, `verify-live.sh`가 운영 주소에서 CLAUDE.md·docs/PRD.md·HANDOVER.md 등이 열리지 않는지 확인 |
| 3. 안전장치가 Vercel·Supabase 기준 | `.claude/settings.json` + **`.claude/hooks/guard.sh`** 두 겹. 운영 배포(`pages deploy --branch=production`, 브랜치 미지정 배포, `deploy.sh production`), 원격 DB(`d1 execute/migrations apply --remote`), 보호 브랜치 push·커밋·병합, 강제 push, 비밀 파일 읽기 차단. 옵션 순서와 상관없이 판별 |
| 4. 클라우드 세션 자동 push와 "push는 승인 후" 충돌 | **정책 A를 기본값**으로 구현: 작업 브랜치 push는 자유, main·production 반영과 운영 배포만 승인. 정책 B는 `harness.config.sh`에서 `PUSH_POLICY="B"`로 전환 (세션 자동 push 규칙을 꺼야 함) |

정책 A의 전제: Cloudflare Pages가 Git 연동이면 **출력 폴더를 `dist`로 바꾼 뒤에** 쓰세요. 그 전에는 작업 브랜치 push가 미리보기 배포를 만들고, 미리보기 주소에서 문서가 열릴 수 있습니다.

---

## 설치 순서 (중요 — 이 순서대로)

1. **현재 노출부터 확인**: 운영 주소에서 `/HANDOVER.md`, `/CLAUDE.md` 등이 열리는지 브라우저로 확인
2. 이 폴더의 내용을 프로젝트 최상단에 복사 (숨김 폴더 `.claude`, `.gitignore`, `.dev.vars.example` 포함). 기존 `.gitignore`가 있으면 내용을 합치세요
3. `harness.config.sh` 입력: SITE_URL, PAGES_PROJECT, PROD_BRANCH, PROTECTED_BRANCHES, PUSH_POLICY
4. **아직 커밋·push하지 말고** Claude Code에서 `/setup` 실행
   - dist-include.txt를 실제 사이트 구조에 맞추고 `bash scripts/check.sh 10`이 PASS인지 확인
   - Git 연동이면 Cloudflare Pages 대시보드에서 빌드 명령 `bash scripts/build-dist.sh && bash scripts/verify-dist.sh`, 출력 폴더 `dist`로 변경
5. 그다음 커밋·push
6. 기존 코드가 있으면 `/adopt`, 새로 시작이면 `start.md` 작성 후 `/build`

---

## 전체 흐름

| Stage | 내용 | 담당 | 사람이 할 일 |
|---|---|---|---|
| S1 기획 | start.md → PRD(필수 기능 = v1 완료 정의), 검색 설계 | planner, seo | start.md 작성, GPT 교차검토, **게이트 A** |
| S2 디자인 | 브리프 → 시안 → 디자인 시스템 명세 | designer | Claude Design 시안, Figma 확정, **게이트 B** |
| S3 구조 | 폴더·라우트·D1·인증·배포물·기능별 지침 | architect | GPT 교차검토, **게이트 C** |
| S4 구현 루프 | 기능 하나씩 구현 ⇄ 검증 (3회 제한) | developer, qa | 고위험 기능 교차검토 |
| S5 최적화 | 구글·네이버 SEO, AI 답변(AEO/GEO) | seo, aeo | 문구·크롤러 정책 결정 |
| — | 필수 기능 전부 PASS → **범위 동결** | Stage Runner | 동결 승인 |
| S6 출시 준비 | 출시 점검표, 운영 매뉴얼, 노출 검사 | release | **게이트 D**, 원격 마이그레이션·운영 배포 |
| S7 운영 | 14일 안정화 → 2주 단위 릴리스(최대 5항목) | ops, release | 요청 붙여 넣기, 릴리스 승인, 지표 입력 |

모든 에이전트는 `PASS / FAIL / NEEDS_APPROVAL / BLOCKED`로 끝나고, Stage Runner(`/build`)가 그 판정만 보고 다음으로 넘기거나 되돌리거나 멈춥니다.

## 끝나는 기준 (무한 루프 방지)
- **v1 완료 정의**: 필수 기능 전부 완료 + 치명·주요 결함 0 + 출시 점검표 통과 + 출시 승인. 더 좋게 만들 수 있어도 여기서 끝입니다.
- **필수 = start.md 4번에 적은 것만** (최대 5개). 나머지는 "있으면 좋음".
- **범위 동결**: 필수가 다 PASS되면 자동 제안. 이후엔 출시를 막는 문제만 고치고 나머지는 v1.1 백로그로.
- **"더 좋게"에는 근거 필요**: 사용자 문의, 지표, 오류 로그, 법·보안 중 하나. 같은 화면 수정은 릴리스당 1회.
- **반복 한도**: 기능당 수정 3회, 같은 원인 2회 연속·회귀 발생 시 자동 정지.
- **운영 중 요청은 바로 개발하지 않음**: P0만 즉시 핫픽스, 나머지는 분류해서 2주마다 묶어 처리.

---

## 명령
| 명령 | 하는 일 |
|---|---|
| `/setup` | 설치 직후 1회: 노출 확인, 설정·배포물·안전장치·push 정책 점검 |
| `/adopt` | 꼬인 기존 프로젝트 진단 → 역기획 → 안정화 계획 |
| `/build [개수]` | Stage Runner. 다음 할 일부터 자동 진행 (기본 기능 3개) |
| `/status` | 실행 없이 현황 보고 (v1 완료까지 남은 것 맨 위) |
| `/review-pack [prd\|architecture\|F-04]` | GPT 교차 검토 요청서 생성 |
| `/review-apply [대상]` | 교차 검토 결과를 반영/보류/기각 판단 후 반영 |
| `/change [내용]` | 범위 변경을 모든 기준 문서에 일관 반영 |
| `/audit [페이지]` | SEO·AEO·운영 노출 정기 점검 |
| `/launch` | 완료 확인 → 범위 동결 → 출시 점검 → 출시 승인 → 출시 후 확인 |
| `/triage [요청]` | 운영 요청·문의·오류를 P0~P3로 분류 |
| `/release plan` / `/release run` | 정기 릴리스 계획 / 실행 |
| `/hotfix [내용]` | P0 긴급 수정 또는 롤백 |
| `/weekly` | 주간 운영 리뷰 |

## 에이전트 (.claude/agents/)
| 파일 | 역할 |
|---|---|
| planner.md | start.md → PRD·tasks.md, 필수/있으면 좋음, 위험도, 변경·역기획 모드 |
| seo.md | 기획 모드: 검색 의도·URL·메타 / 감사 모드: 공개 페이지 점검 |
| designer.md | 브리프 모드(Claude Design 프롬프트, AI스러운 디자인 금지) / 명세 모드(Figma → CSS 변수 토큰) |
| architect.md | 폴더·공통 요소·라우트·D1·인증·배포물·기능별 구현 지침 |
| developer.md | 기능 단위 구현, FAIL 수정, 핫픽스 |
| qa.md | check.sh + 수용 기준·예외·회귀·디자인·구조·보안 검증 |
| aeo.md | AI 크롤러, 구조화 데이터, 답변형 콘텐츠, 인용 측정 |
| release.md | 출시 점검표(A~J), runbook, 출시 후 확인 |
| ops.md | 요청 분류, 릴리스 계획, 주간 리뷰 |

## 스크립트 (scripts/, 배포되지 않음)
| 파일 | 역할 |
|---|---|
| check.sh | QA 기준 전체 검사. `bash scripts/check.sh 30 40`처럼 일부만도 가능 |
| check.d/10-dist.sh | 배포물 만들기 + 격리 검사 |
| check.d/20-html.sh | HTML 구조 (h1, title, description, lang, alt, 제목 단계, 중복 id, title 중복) |
| check.d/30-links.sh | 내부 링크·앵커(목차) |
| check.d/40-access.sh | 회원·비회원 접근 (`.html` 우회 경로 포함). 로컬 서버와 `MEMBER_COOKIE` 필요 |
| check.d/50-secrets.sh | 배포물 비밀 값 패턴 |
| build-dist.sh / verify-dist.sh | 허용 목록 복사 / 금지 파일·누락 검사 |
| verify-live.sh | 운영·미리보기 주소에서 내부 문서 노출 검사 |
| deploy.sh | `preview`(작업 브랜치) / `production`(사람만, 확인 입력 필요) |
| dist-include.txt | 배포 허용 목록 (새 페이지·폴더 추가 시 함께 수정) |
| access-matrix.txt | 회원·비회원 기대 응답 |
| link-ignore.txt | 링크 검사 제외 경로 (/api/ 등) |

검사 스크립트 종료 코드: 0 PASS / 1 FAIL / 2 SKIP(미확인). SKIP이 있으면 PASS가 아닙니다.
회원 측 접근 검사: 테스트 계정으로 로그인한 쿠키를 셸에서 `export MEMBER_COOKIE='이름=값'`으로 넣고 실행합니다. 값은 어디에도 적지 마세요.

## 안전장치
- `.claude/settings.json`: 비밀 파일 읽기·수정, 강제 push, 비밀 값 관리, DB·프로젝트 삭제, 운영 배포 스크립트 거부
- `.claude/hooks/guard.sh`: 모든 Bash 명령 실행 전 검사 (원격 D1, 운영·브랜치 미지정 배포, 보호 브랜치 반영, 위험 삭제, 비밀 파일 출력)
- 실수 방지 장치입니다. 막히면 AI는 우회하지 않고 "사람이 실행할 명령"으로 보고합니다.
- 동작 확인: `printf '{"tool_input":{"command":"git push origin main"}}' | bash .claude/hooks/guard.sh; echo $?` → 2면 차단

## 디자인 작업 (S2)
1. `/build` → designer가 `docs/design-brief.md` 생성 (Claude Design 프롬프트 포함)
2. claude.ai Claude Design에서 시안 2가지 → 하나 선택
3. Figma에 변수(토큰)·컴포넌트로 정리 (브리프 체크리스트)
4. Figma 링크를 start.md 9번에 (또는 이미지를 `docs/figma/`에) → `/build` → `design-spec.md`

## 교차 검토 (GPT + Claude Code)
`/review-pack prd` → 요청서를 ChatGPT에 붙여 넣기 (또는 Codex CLI) → 답을 `docs/reviews/날짜-prd-result.md`로 저장 → `/review-apply prd`
필수: PRD, 구조 설계, 고위험 기능(인증·회원 권한·결제·개인정보·삭제·외부 연동)

## 프로젝트마다 바꿀 곳
- `harness.config.sh` (사이트 주소, Pages 프로젝트, 브랜치, push 정책, 운영 주기)
- `start.md`
- `scripts/dist-include.txt`, `scripts/access-matrix.txt`
- 스택이 다르면 CLAUDE.md 10·11·13장 (`.claude/stack/` 참고)

## 알아둘 한계
- 안전장치는 명령 문자열을 검사합니다. 완전한 보안 경계가 아니라 실수 방지용입니다. Cloudflare 계정 권한(운영 배포 토큰을 AI 환경에 두지 않기)과 함께 쓰세요.
- 훅(hooks) 기능은 Claude Code 버전에 따라 설정 형식이 다를 수 있습니다. `/setup` 6번에서 실제 차단되는지 꼭 확인하세요.
- 법·개인정보 항목은 점검 목록일 뿐, 법률 판단이 아닙니다.
