# ai-measure: AI 답변의 인용 출처 측정

학교에 대한 질문을 AI 5종(OpenAI, Gemini, Perplexity, Claude, Grok)에 웹 검색을 켜고 물어보고,
각 답변이 근거로 쓴 URL을 모아 도메인별로 셉니다.

## 실행

```bash
npm ci
# 1) 질문 × 모델 호출. 원본 응답은 results/<run>/raw/<모델>__<질문id>.json 에 저장
NODE_USE_ENV_PROXY=1 node tools/ai-measure/measure.ts --config tools/ai-measure/schools/bis-hanoi.json
# 2) 집계. results/<run>/answers.json, summary.json, report.md 생성
NODE_USE_ENV_PROXY=1 node tools/ai-measure/aggregate.ts --run bis-hanoi-2026-11-12
```

- 다른 학교: `schools/bis-hanoi.json`을 복사해 `school`, `slug`, `questions`만 바꿉니다.
- 옵션: `--providers openai,xai` `--questions g01,b02` `--models gemini=gemini-3.5-flash` `--run <폴더명>`
- 같은 run 폴더에서 다시 실행하면 이미 성공한 호출은 건너뜁니다(실패한 것만 다시 호출, 중복 과금 없음).
- 클라우드 세션에서는 프록시가 약 30초 동안 응답이 없으면 연결을 끊으므로 OpenAI·xAI·Gemini는 스트리밍으로 호출합니다.
  Node 내장 fetch가 프록시를 쓰도록 `NODE_USE_ENV_PROXY=1`이 필요합니다.

## 인증

| 제공자 | 방식 |
|---|---|
| OpenAI, xAI, Perplexity | 환경의 네트워크 시크릿(프록시가 헤더를 붙임). 코드는 인증 헤더를 보내지 않음 |
| Gemini | `GOOGLE_AI_API_KEY` → `x-goog-api-key` 헤더 |
| Anthropic | `ANTHROPIC_API_KEY`, 없으면 `ISCHOOLWIKI_ANTHROPIC_KEY` |

키는 파일에 저장하지 않습니다(요청 본문만 저장).

## 호출 방식과 출처 추출

| 제공자 | API | 인라인 인용(cited) | 검색 결과 전체(retrieved) |
|---|---|---|---|
| OpenAI | Responses API + `web_search`, `include: web_search_call.action.sources` | `url_citation` 주석 | `web_search_call.action.sources` |
| Gemini | `streamGenerateContent` + `google_search` | `groundingSupports`가 가리키는 chunk | `groundingMetadata.groundingChunks` (리다이렉트 URI는 domain/title 또는 리다이렉트 대상으로 변환) |
| Perplexity | `/v1/agent` + `web_search` | `url_citation` 주석 | `search_results` 항목 |
| Claude | Messages API + `web_search_20260209` (pause_turn 이어 받기) | 텍스트 블록 `citations` | `web_search_tool_result` |
| xAI | Responses API + `web_search` | `url_citation` 주석 | `web_search_call.action.sources` |

순위는 답변마다 인라인 인용이 있으면 그것을, 없으면 검색 결과 전체를 그 답변의 "출처"로 씁니다
(answers.json의 `basis`에 어느 쪽인지 기록). 집계 기준:

- 인용 답변 수: 그 도메인을 한 번이라도 출처로 쓴 답변 수(순위 기준)
- 총 인용 수: 인라인 인용은 등장 횟수 전부, 검색 결과 기준 답변은 URL당 1회

도메인 유형은 `domain-types.json`(도메인 → 유형)에서 읽고, 없으면 "미분류"로 표시합니다.
