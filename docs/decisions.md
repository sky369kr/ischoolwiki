# 결정 기록
(형식: CLAUDE.md 14장)

## 2026-11-12 · 주 독자와 언어
- 결정: 주 독자는 전 세계 영어권 부모, 목표는 검색·AI 답변 노출. 영어 기본, 한국어는 자동 번역. 화면은 위키식 참고 자료 톤을 유지하되 학교 카드·요약표로 정보를 앞에 둔다. / 이유: 사용자 결정 / 영향: src/index.ts, src/render.ts, src/summary.ts

## 2026-11-12 · 자동 게시
- 결정: `AUTO_PUBLISH = "false"` 유지. 첫 자동 실행 뒤 대기 글을 사람이 읽고 켤지 결정. 도메인 연결도 그 뒤. / 이유: 파일럿 표본이 학교 2곳·글 2건 / 영향: wrangler.toml

## 2026-11-13 · 하네스 v4 적용 방식
- 결정: 하네스 v4를 설치하되 기본 프로필(정적 HTML + Pages)을 이 프로젝트의 Cloudflare Worker + D1 구조로 바꿔 적용. / 이유: Worker가 코드의 라우트만 응답하므로 dist/ 허용 목록 방식이 필요 없고, 원본 안전장치는 Pages 배포만 막아 Worker 배포(`wrangler deploy`)를 막지 못함 / 영향: CLAUDE.md 10~13장, harness.config.sh, .claude/hooks/guard.sh, .claude/settings.json, scripts/check.d/, scripts/snapshot.sh, scripts/crawl.py, scripts/access-matrix.txt, 에이전트·명령 문서 머리의 적용 메모
- 결정: push 정책 A, 보호 브랜치 main. 에이전트는 작업 브랜치에만 커밋·push하고, main 병합과 운영 배포는 사람이 한다. / 이유: 하네스 기본값, Git 연동 배포가 없어 작업 브랜치 push가 공개로 이어지지 않음 / 영향: 지금까지처럼 AI가 main에 직접 합치지 않음
- 결정 (변경, 같은 날): PR 병합은 AI가 한다. 조건은 PR을 거칠 것, 병합 직전 `bash scripts/check.sh` 전체 PASS, 검사한 커밋 SHA로 병합. 운영 배포·원격 DB·비밀 값·AUTO_PUBLISH는 계속 사람만. main 직접 커밋·push와 강제 push는 계속 차단. / 이유: 사람 요청("앞으로 병합 직접 해줘") / 영향: CLAUDE.md 1장 7번, 12장
- 결정: PR #1은 검사 FAIL(도시 비교 페이지 제목 단계 h1→h3)을 같은 PR에서 고치고 전체 PASS 후 병합 (선택지 A) / 이유: 사람 선택
- 결정: `.dev.vars.example`은 만들지 않음 (하네스의 비밀 파일 차단 규칙 `.dev.vars.*`에 걸림). 비밀 값 이름은 CLAUDE.md 10-1에 적음.
- 결정: 하네스 원본 중 Pages 전용 파일(build-dist.sh, verify-dist.sh, dist-include.txt, deploy.sh, check.d/10-dist.sh)은 가져오지 않음. 원본은 docs/harness/README.md와 .claude/stack/profile-static-cloudflare-d1.md로 참고만.

## 2026-11-13 · 자동 게시 켜기
- 결정: `AUTO_PUBLISH = "true"`. 첫 운영 실행으로 대기 중인 글 4개(영어 2, 한국어 2)도 운영자가 원격 D1에서 게시 상태로 바꾼다. / 이유: 파일럿 8차와 첫 운영 실행 모두 사실 오류·출처 오인용 없음(원문 대조). 남은 문제는 표현 수준(메뉴 목록을 게시물 내용처럼 씀, 보증금 환불 조건 일부 생략, 기숙 항목 6개 중 2개만 적어 전부처럼 읽힘) / 영향: wrangler.toml, 운영 배포 필요. 2주 동안 매일 게시 글을 사람이 훑어보고, 문제가 있으면 `/admin/unpublish`로 내린다

## 2026-11-13 · 처음 글 채우기와 주제별 안내 글 (범위 변경)
- 결정: 고객 학교에 보여 줄 글을 먼저 채운다. 목표는 "자료가 되는 만큼, 학교당 7~10편" (숫자를 맞추려고 늘리지 않음). 이후에는 매일 01:17 UTC 자동 실행 그대로. / 이유: 운영자 요청
- 결정: 주제별 안내 글 기능 추가. 그날 쓸 새 소식이 없으면 기록된 사실만으로 학비·교육과정·기숙·입학 중 하나를 쓴다. 주제당 사실 3건 이상일 때만, 학교·주제마다 한 번만 시도(`guide_attempts`). 안내 글은 그 주제의 사실만 보고, 같은 검증(규칙 + 근거 검사 + 한 번 고쳐 쓰기)을 거친다. / 영향: src/guides.ts, src/pipeline.ts, src/generate.ts, migrations/0006 (원격 적용은 사람)
- 결정: 소식 글 한 편이 묶는 소식을 5건에서 3건으로 줄인다. / 이유: 같은 소식으로 더 많은 글, 글마다 초점이 좁아짐
- 결정: `MAX_POSTS_PER_SCHOOL_PER_MONTH` 5 → 12 (계속 유지) / 이유: 운영자 결정

## 2026-11-13 · 학생 실명 쓰지 않기, 대학 합격 글 교체
- 결정: 학생·졸업생·가족의 개인 이름은 학교가 공개했더라도 쓰지 않는다(역할로 나오는 교직원 이름은 허용). 작성 지시와 근거 검사 양쪽에 넣음. 이미 게시된 BSB 대학 합격 글(운영 글 17번)은 내리지 않고 고친 버전으로 교체(선택지 B) / 이유: 사람 결정 / 영향: src/generate.ts, src/grounding.ts
- 같이 고친 것: HTML 엔티티가 남은 이름("King&rsquo;s") 인식, 목록 일부만 쓰면 일부라고 밝히기, 출처는 특징 있는 숫자나 인용 문장이 겹칠 때만 붙이기. 로컬 파일럿 10차(RUNS=5)에서 BSB 대학 합격 글에 학생 이름 없음·King's College London 6건 포함·학비 PDF 출처 없음, DAIS 졸업생 글의 학생 이름은 검사에서 걸려 고쳐 쓰기로 빠짐을 확인

## 2026-11-13 · 세 번째 파일럿 학교 BST(The British School of Tashkent)
- 결정: BST 추가. 운영사 고객 아님(is_client = 0, 운영자 확인). 학비는 학교 공식 2026/27 PDF에서 스크립트로 읽어 40건(학년별 합계 검산 통과). myispp의 BST 학비는 출처가 제3자 사이트이고 "연간" 값이 할인 후 점심 포함 금액이라 쓰지 않음 / 영향: seeds/bst-tashkent.sql (운영 DB 적용은 사람)
- 로컬 파일럿 11차(ONLY=bst-tashkent, RUNS=5): 영어 5편 중 게시 4, 보류 1. 게시 글의 숫자·인용은 원문과 일치. 보류 1편은 성적 등급 "B", "C"를 이름으로 본 오탐이라 등급 글자를 일반어 목록에 추가
