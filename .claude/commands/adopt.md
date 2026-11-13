---
description: 하네스 없이 만들다 꼬인 기존 프로젝트를 하네스 구조로 편입한다. 코드를 바로 고치지 않고 현황 진단 → 역기획(PRD·디자인·구조 초안) → 안정화 계획까지 만든다. /setup 다음에 실행한다.
---

> **이 프로젝트 적용 메모 (ischoolwiki, Cloudflare Worker + D1)**: 아래 지시 중 정적 HTML·Pages 기준 항목은 CLAUDE.md 10~13장으로 대체한다.
> - `dist/`, `dist-include.txt`, `build-dist.sh`, `verify-dist.sh`, `deploy.sh` 없음 → 공개 페이지 검사는 `bash scripts/check.sh`(15번이 로컬 Worker를 띄워 `.harness/snapshot/`에 페이지 저장), 내부 문서 비공개는 11장
> - 로컬 서버 `npx wrangler pages dev dist` → 검사는 check.sh가 직접 띄운다. 손으로 볼 때는 `npx wrangler dev`
> - 회원 기능·MEMBER_COOKIE 없음 → `scripts/access-matrix.txt`는 관리 경로(/admin/*) 401과 내부 파일 404 검사용
> - 운영 배포는 사람이 main에서 `npm run deploy`, 롤백은 사람이 `npx wrangler rollback` (Cloudflare 대시보드 Workers > 배포 목록에서도 가능). 미리보기 배포 없음
> - 자동 글을 바꾸는 작업은 `./scripts/pilot.sh` 결과를 사람이 원문과 대조한다 (10-3)

이 명령에서는 사이트 코드·페이지 파일을 수정하지 않는다. 진단과 문서 작성만 한다.

## 1. 현황 진단 → docs/adopt-report.md
가장 위험한 것부터:
1. **내부 문서 노출**: `bash scripts/verify-live.sh` (운영), 저장소 전체 배포 여부, 사이트 원본 폴더 안의 .md·메모 파일 목록 (예: HANDOVER.md)
2. **비밀 값**: 저장소·git 기록에 키·토큰·.dev.vars가 커밋된 적이 있는지 (`git log --all -p -S` 로 주요 패턴 표본 확인)
3. **회원 보호**: 회원 전용으로 보이는 경로와 Functions 보호 방식, `.html` 직접 접근으로 열리는지 (로컬 서버로 비회원 확인)
4. **D1**: 마이그레이션 파일 존재 여부, 스키마가 파일로 관리되는지, 쿼리 방식(prepare+bind 여부)
5. **검사 결과**: `bash scripts/check.sh` (dist-include.txt는 /setup에서 맞춘 상태)
6. **구조 문제**: 중복 코드, 페이지마다 다른 헤더·푸터, 하드코딩 색·크기, 거대 파일, 사용하지 않는 파일
7. **문제 다발 지점**: `git log --format= --name-only | sort | uniq -c | sort -rn | head -20` (자주 고친 파일)
8. **기능 상태**: 실제로 동작/일부/깨짐 (로컬 서버에서 확인)
9. **SEO 기본**: 공개 페이지 title·description·h1·canonical·sitemap 상태

## 2. 역기획
- planner(역기획 모드): 현재 기능을 F-ID로 정리한 PRD 초안. start.md가 비어 있으면 추정 초안 (모든 추정에 "(추정)")
- designer(추출 모드): 실제 쓰인 색·글꼴·간격 빈도표와 토큰 통합안 → design-spec 초안
- architect(/adopt 모드): architecture.md "현재 구조"와 "목표 구조"
- seo(기획 모드): 현재 공개 페이지 기준 seo-plan 초안

## 3. 안정화 계획 → tasks.md
순서 (앞 단계가 끝나야 다음):
1. 내부 문서·비밀 노출 차단 (배포물 격리 적용, 필요 시 키 교체 — 사람 작업 표시)
2. 회원 보호 구멍
3. 검사 명령 전부 PASS (HTML 구조·링크·목차)
4. 변경 전 안전망: access-matrix 완성, 핵심 흐름 확인 절차 고정
5. 디자인 토큰 통합 (css/tokens.css)
6. 목표 구조로 단계적 이동 (작업마다 회귀 확인 기능 명시)
7. 깨진 기능 수정
8. 남은 신규 기능
- "전부 새로 짜기"와 "단계적 정리"의 비용·위험 비교와 추천안

## 4. 보고와 승인
- 진단 요약, 가장 위험한 문제 5개(P0 후보 먼저), 추천 경로, PRD 필수 기능 후보(사람이 고르도록)
- 승인 후 docs/stage.md: S1~S3 상태 "역기획 초안 — 승인 필요". 게이트 A~C를 순서대로 승인받은 뒤 /build로 S4 진행
- 교차 검토 권장: /review-pack architecture
