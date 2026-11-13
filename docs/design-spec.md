# 디자인 명세 — 추출 초안 (코드 기준 2026-11-13 · 피그마 없음)

> **추출 초안**: /adopt 추출 모드로 운영 중인 코드에서 실제 쓰인 값을 모아 만든 초안이다. 피그마 파일이 없으므로 기준은 `src/render.ts`의 `STYLE` 문자열(91~120행)과 `src/index.ts`의 화면 HTML이다.
> - 값은 모두 코드에 실제로 있는 값이다. 통합안도 실제 쓰인 값 중에서만 골랐다 (새 값 없음).
> - 계산·추론으로 얻은 내용(화면 너비별 동작, 실제 렌더링 크기 등)에는 "(추정)"을 붙였다. `npx wrangler dev`나 브라우저로 직접 재지는 않았고, 클래스 사용 여부는 `.harness/snapshot/`(check.sh 15의 검사용 스냅샷, 2026-11-13)으로 대조했다.
> - PRD.md·seo-plan.md가 아직 없어 화면 ID는 가칭이다 (P-01~P-07). 역기획 PRD가 나오면 맞춘다.
> - 사람이 정한 방향 (decisions.md 2026-11-12): 위키식 참고 자료 톤 유지, 정보(학교 카드·요약표)를 앞에, 학교 사진 없음(저작권), 화면은 고딕, 글 본문은 명조.

---

## 0. 추출 결과 (빈도표)

### 0-1. 색상
모든 색은 `:root` CSS 변수(라이트·다크)로 정의되어 있고, 변수 밖 색상 하드코딩은 **0건**이다 (`src/render.ts`, `src/index.ts` 모두 hex·rgb 값 없음, `style=` 속성 없음).

| 현재 변수 | 라이트 | 다크 | 사용 횟수 | 사용처 |
|---|---|---|---|---|
| `--muted` | #5d6763 | #9aa5a0 | 10 | 헤더 메뉴, .notice, .meta/.sources, .crumbs(+링크), .card dt, .tag, .infobox th, footer |
| `--line` | #e2e0d8 | #2b322f | 8 | header 아래선, .notice, th/td 아래선, ul.plain li, .card, .tag, .infobox, footer 윗선 |
| `--accent` | #1f6f5c | #6fcfb4 | 8 | 로고 "Wiki", 메뉴 hover, 모든 링크 `a`, .tldr 머리글, .card h3 hover, .chip 글자, .trust 윗선, summary |
| `--fg` | #1d2321 | #e8ebe8 | 3 | body 글자, 로고, .card h3 링크 |
| `--card` | #ffffff | #1b201e | 3 | header 배경, .card, .infobox |
| `--accent-soft` | #e7f1ed | #1f2d28 | 2 | .tldr 배경, .chip 배경 |
| `--bg` | #fbfaf7 | #141816 | 1 | body 배경 |

- 다크 모드는 `@media (prefers-color-scheme:dark)`로만 바뀐다 (사용자 전환 버튼 없음). `color-scheme`도 함께 지정됨.
- 그라데이션·투명도·rgba 값 없음.

### 0-2. 글꼴
| 값 | 횟수 | 위치 |
|---|---|---|
| `system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans KR",sans-serif` | 1 | body (화면 전체 고딕) |
| `Georgia,"Noto Serif KR",serif` | 1 | `article p, article li` (글 본문 명조) |
| `system-ui,sans-serif` | 1 | `.tldr b` ("In short"/"요약" 머리글) |
| `inherit` | 1 | `article .meta, article .notice, article .sources li` (글 안에서 고딕으로 되돌림) |

- 웹 글꼴을 불러오지 않는다. "Noto Sans KR"/"Noto Serif KR"은 기기에 설치된 경우에만 쓰이고, 없으면 system-ui(Windows 맑은 고딕, macOS·iOS Apple SD Gothic Neo 등)와 기본 serif(Windows 바탕, macOS AppleMyungjo 등)로 대체된다 (추정).

### 0-3. 글자 크기
`rem` 기준은 html에 지정이 없어 브라우저 기본 16px로 계산했다 (추정).

| 값 | 약 px | 횟수 | 위치 |
|---|---|---|---|
| 14px | 14 | 6 | .notice, .meta/.sources, .crumbs, .card dl, .card .more, footer |
| 15px | 15 | 3 | table, .trust li, .infobox table |
| .95rem | 15.2 | 1 | header nav |
| 12px | 12 | 2 | .tag, .tldr b (font 묶음 안) |
| 12.5px | 12.5 | 1 | .chip |
| 17px | 17 | 1 | body (font 묶음 안) |
| 1.05rem | 16.8 | 1 | h3 |
| 1.06rem | 16.96 | 1 | article p, li |
| 1.08rem | 17.28 | 1 | .tldr p |
| 1.1rem | 17.6 | 1 | .lead |
| 1.12rem | 17.92 | 1 | .card h3 |
| 1.15rem | 18.4 | 1 | header a.home |
| 1.3rem | 20.8 | 1 | h2 |
| clamp(1.7rem,4vw,2.3rem) | 27.2~36.8 | 1 | h1 |

- px 9종·rem 9종이 섞여 있다 (4장 D-04).

### 0-4. 굵기 · 줄간격 · 자간
| 종류 | 값 | 횟수 | 위치 |
|---|---|---|---|
| 굵기 | 600 | 4 | .tldr b, ul.plain li>a, .chip, summary |
| 굵기 | 750 | 1 | header a.home |
| 굵기 | 500 | 1 | .infobox th |
| 굵기 | (브라우저 기본 bold) | - | h1~h3, b, 표 th (CSS 값 없음) |
| 줄간격 | 1.5 | 4 | .notice, .meta/.sources, .trust li, footer |
| 줄간격 | 1.45 | 2 | table, .card dl |
| 줄간격 | 1.65 | 1 | body (h2·h3·본문은 이 값을 물려받음) |
| 줄간격 | 1.4 | 1 | .tldr b |
| 줄간격 | 1.3 | 1 | .card h3 |
| 줄간격 | 1.15 | 1 | h1 |
| 줄간격 | 1 | 1 | .chip |
| 자간 | -.02em | 1 | h1 |
| 자간 | -.01em | 1 | header a.home |
| 자간 | .06em | 1 | .tldr b (대문자 변환과 함께) |

### 0-5. 간격 (padding · margin · gap, 여러 값은 하나씩 셈)
| 값 | 횟수 | | 값 | 횟수 |
|---|---|---|---|---|
| 0 | 18 | | .9rem | 1 |
| 1rem | 6 | | 1.1rem | 1 |
| .75rem | 4 | | 1.15rem | 1 |
| 1.25rem | 3 | | 1.2rem | 1 |
| 2rem | 3 | | 1.5rem | 1 |
| .35rem | 2 | | 2.25rem | 1 |
| .4rem | 2 | | 3rem | 1 |
| .5rem | 2 | | .2rem | 1 |
| .55rem | 2 | | .25rem | 1 |
| .6rem | 2 | | auto | 2 |
| .8rem | 2 | | 16px (`max(16px, safe-area)`) | 2 |
| .15rem | 2 | | | |

0과 auto를 빼면 서로 다른 간격 값이 **21종**이다.

### 0-6. 모서리 · 선 · 그림자 · 폭
| 종류 | 값 | 횟수 | 위치 |
|---|---|---|---|
| 모서리 | 12px | 2 | .card, .infobox |
| 모서리 | 999px | 2 | .chip, .tag |
| 모서리 | 8px | 1 | .notice |
| 모서리 | 10px | 1 | .tldr |
| 선 | 1px solid var(--line) | 8 | header, .notice, th/td, ul.plain li, .card, .tag, .infobox, footer |
| 선 | 2px solid var(--accent) | 1 | .trust li 윗선 |
| 그림자 | (없음) | 0 | - |
| 폭 | 46rem | 1 | .wrap 기본 |
| 폭 | 68rem | 1 | body.wide .wrap |
| 폭 | 40rem | 1 | .lead |
| 폭 | 9.5rem | 1 | .infobox th |
| 폭 | minmax(19rem,1fr) | 1 | .grid 칸 최소 |
| 폭 | minmax(14rem,1fr) | 1 | .trust 칸 최소 |
| 브레이크포인트 | (없음) | 0 | 너비 미디어 쿼리 0건. clamp·auto-fill 그리드·flex-wrap으로 대응 |

### 0-7. 하드코딩 위치 (변수 밖 값)
**합계 93건** (선언 기준, 전부 `src/render.ts` STYLE). `src/index.ts`는 0건 (인라인 style·색상 값 없음).
- 종류별: 간격 31 · 글자 크기 20 · 선 굵기 9 · 줄간격 9 · 폭 7 · 모서리 6 · 굵기 5 · 자간 3 · 글꼴 묶음(font) 2 · 글꼴 1
- 색상은 0건 (선 9건은 색은 변수, 굵기 1px/2px만 고정값).
- "통합 토큰" 열은 1장 통합안을 적용했을 때 바뀔 변수다. 값이 달라지는 항목은 1장 각 표의 "흡수" 열에 있다.

| # | 행 | 선택자 | 종류 | 현재 값 | 통합 토큰 |
|---|---|---|---|---|---|
| 1 | 93 | `body` | 글꼴 묶음 | `font:17px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans KR",sans-serif` | --text-base/--leading-body --font-sans |
| 2 | 94 | `.wrap` | 폭 | `max-width:46rem` | --measure |
| 3 | 94 | `.wrap` | 간격 | `padding-left:max(16px,env(safe-area-inset-left))` | --gutter |
| 4 | 94 | `.wrap` | 간격 | `padding-right:max(16px,env(safe-area-inset-right))` | --gutter |
| 5 | 95 | `body.wide .wrap` | 폭 | `max-width:68rem` | --measure-wide |
| 6 | 96 | `header` | 선 | `border-bottom:1px solid var(--line)` | --border-width + --color-border |
| 7 | 96 | `header .wrap` | 간격 | `padding-block:.9rem` | --space-4 |
| 8 | 96 | `header .wrap` | 간격 | `gap:1.25rem` | --space-5 |
| 9 | 97 | `header a.home` | 굵기 | `font-weight:750` | --weight-bold |
| 10 | 97 | `header a.home` | 크기 | `font-size:1.15rem` | --text-lg |
| 11 | 97 | `header a.home` | 자간 | `letter-spacing:-.01em` | --tracking-tight |
| 12 | 98 | `header nav` | 간격 | `gap:1rem` | --space-4 |
| 13 | 98 | `header nav` | 크기 | `font-size:.95rem` | --text-ui |
| 14 | 99 | `main` | 간격 | `padding-block:2rem 3rem` | --space-6 --space-7 |
| 15 | 100 | `h1` | 크기 | `font-size:clamp(1.7rem,4vw,2.3rem)` | --text-h1 |
| 16 | 100 | `h1` | 줄간격 | `line-height:1.15` | --leading-tight |
| 17 | 100 | `h1` | 자간 | `letter-spacing:-.02em` | --tracking-tight |
| 18 | 100 | `h1` | 간격 | `margin:0 0 .75rem` | 0 0 --space-3 |
| 19 | 100 | `h2` | 크기 | `font-size:1.3rem` | --text-h2 |
| 20 | 100 | `h2` | 간격 | `margin:2.25rem 0 .75rem` | --space-6 0 --space-3 |
| 21 | 100 | `h3` | 크기 | `font-size:1.05rem` | --text-base |
| 22 | 100 | `h3` | 간격 | `margin:1.5rem 0 .4rem` | --space-5 0 --space-2 |
| 23 | 101 | `article p,article li` | 글꼴 | `font-family:Georgia,"Noto Serif KR",serif` | --font-serif |
| 24 | 101 | `article p,article li` | 크기 | `font-size:1.06rem` | --text-base |
| 25 | 103 | `.lead` | 크기 | `font-size:1.1rem` | --text-lg |
| 26 | 103 | `.lead` | 폭 | `max-width:40rem` | --measure-lead |
| 27 | 104 | `.notice` | 선 | `border:1px solid var(--line)` | --border-width + --color-border |
| 28 | 104 | `.notice` | 모서리 | `border-radius:8px` | --radius-sm |
| 29 | 104 | `.notice` | 간격 | `padding:.6rem .8rem` | --space-2 --space-3 |
| 30 | 104 | `.notice` | 크기 | `font-size:14px` | --text-sm |
| 31 | 104 | `.notice` | 줄간격 | `line-height:1.5` | --leading-compact |
| 32 | 105 | `.tldr` | 모서리 | `border-radius:10px` | --radius-md |
| 33 | 105 | `.tldr` | 간격 | `padding:1rem 1.15rem` | --space-4 --space-5 |
| 34 | 105 | `.tldr` | 간격 | `margin:1.25rem 0` | --space-5 0 |
| 35 | 105 | `.tldr b` | 글꼴 묶음 | `font:600 12px/1.4 system-ui,sans-serif` | --weight-semibold --text-xs/--leading-compact --font-sans |
| 36 | 105 | `.tldr b` | 자간 | `letter-spacing:.06em` | --tracking-caps |
| 37 | 105 | `.tldr b` | 간격 | `margin-bottom:.25rem` | --space-1 |
| 38 | 106 | `.tldr p` | 크기 | `font-size:1.08rem` | --text-lg |
| 39 | 107 | `.meta,.sources` | 크기 | `font-size:14px` | --text-sm |
| 40 | 107 | `.meta,.sources` | 줄간격 | `line-height:1.5` | --leading-compact |
| 41 | 107 | `.crumbs` | 크기 | `font-size:14px` | --text-sm |
| 42 | 107 | `.crumbs` | 간격 | `margin-bottom:.75rem` | --space-3 |
| 43 | 108 | `table` | 크기 | `font-size:15px` | --text-ui |
| 44 | 108 | `table` | 줄간격 | `line-height:1.45` | --leading-compact |
| 45 | 108 | `th,td` | 선 | `border-bottom:1px solid var(--line)` | --border-width + --color-border |
| 46 | 108 | `th,td` | 간격 | `padding:.5rem` | --space-2 |
| 47 | 109 | `ul.plain li` | 간격 | `padding:.75rem 0` | --space-3 0 |
| 48 | 109 | `ul.plain li` | 선 | `border-bottom:1px solid var(--line)` | --border-width + --color-border |
| 49 | 109 | `ul.plain li>a` | 굵기 | `font-weight:600` | --weight-semibold |
| 50 | 110 | `.grid` | 간격 | `gap:1rem` | --space-4 |
| 51 | 110 | `.grid` | 폭 | `grid-template-columns:repeat(auto-fill,minmax(19rem,1fr))` | (컴포넌트 고유값) |
| 52 | 111 | `.card` | 선 | `border:1px solid var(--line)` | --border-width + --color-border |
| 53 | 111 | `.card` | 모서리 | `border-radius:12px` | --radius-md |
| 54 | 111 | `.card` | 간격 | `padding:1.1rem 1.2rem` | --space-4 --space-5 |
| 55 | 111 | `.card` | 간격 | `gap:.55rem` | --space-2 |
| 56 | 112 | `.card h3` | 크기 | `font-size:1.12rem` | --text-lg |
| 57 | 112 | `.card h3` | 줄간격 | `line-height:1.3` | --leading-snug |
| 58 | 113 | `.card dl` | 폭 | `grid-template-columns:auto 1fr` | (구조값, 토큰 아님) |
| 59 | 113 | `.card dl` | 간격 | `gap:.2rem .8rem` | --space-1 --space-3 |
| 60 | 113 | `.card dl` | 크기 | `font-size:14px` | --text-sm |
| 61 | 113 | `.card dl` | 줄간격 | `line-height:1.45` | --leading-compact |
| 62 | 114 | `.chips` | 간격 | `gap:.35rem` | --space-1 |
| 63 | 114 | `.chip` | 크기 | `font-size:12.5px` | --text-xs |
| 64 | 114 | `.chip` | 줄간격 | `line-height:1` | --leading-none |
| 65 | 114 | `.chip` | 간격 | `padding:.35rem .55rem` | --space-1 --space-2 |
| 66 | 114 | `.chip` | 모서리 | `border-radius:999px` | --radius-pill |
| 67 | 114 | `.chip` | 굵기 | `font-weight:600` | --weight-semibold |
| 68 | 115 | `.tag` | 크기 | `font-size:12px` | --text-xs |
| 69 | 115 | `.tag` | 선 | `border:1px solid var(--line)` | --border-width + --color-border |
| 70 | 115 | `.tag` | 모서리 | `border-radius:999px` | --radius-pill |
| 71 | 115 | `.tag` | 간격 | `padding:.15rem .5rem` | --space-1 --space-2 |
| 72 | 116 | `.card .more` | 크기 | `font-size:14px` | --text-sm |
| 73 | 117 | `.trust` | 간격 | `gap:1rem` | --space-4 |
| 74 | 117 | `.trust` | 폭 | `grid-template-columns:repeat(auto-fit,minmax(14rem,1fr))` | (컴포넌트 고유값) |
| 75 | 117 | `.trust` | 간격 | `margin:2rem 0 0` | --space-6 0 0 |
| 76 | 117 | `.trust li` | 선 | `border-top:2px solid var(--accent)` | --border-width-strong + --color-primary |
| 77 | 117 | `.trust li` | 간격 | `padding-top:.6rem` | --space-2 |
| 78 | 117 | `.trust li` | 크기 | `font-size:15px` | --text-ui |
| 79 | 117 | `.trust li` | 줄간격 | `line-height:1.5` | --leading-compact |
| 80 | 117 | `.trust b` | 간격 | `margin-bottom:.15rem` | --space-1 |
| 81 | 118 | `.infobox` | 선 | `border:1px solid var(--line)` | --border-width + --color-border |
| 82 | 118 | `.infobox` | 모서리 | `border-radius:12px` | --radius-md |
| 83 | 118 | `.infobox` | 간격 | `padding:.4rem 1rem` | --space-2 --space-4 |
| 84 | 118 | `.infobox` | 간격 | `margin:1.25rem 0` | --space-5 0 |
| 85 | 118 | `.infobox table` | 크기 | `font-size:15px` | --text-ui |
| 86 | 118 | `.infobox th` | 굵기 | `font-weight:500` | --weight-medium |
| 87 | 118 | `.infobox th` | 폭 | `width:9.5rem` | (컴포넌트 고유값) |
| 88 | 119 | `details` | 간격 | `margin-top:1rem` | --space-4 |
| 89 | 119 | `summary` | 굵기 | `font-weight:600` | --weight-semibold |
| 90 | 120 | `footer` | 선 | `border-top:1px solid var(--line)` | --border-width + --color-border |
| 91 | 120 | `footer` | 크기 | `font-size:14px` | --text-sm |
| 92 | 120 | `footer` | 줄간격 | `line-height:1.5` | --leading-compact |
| 93 | 120 | `footer .wrap` | 간격 | `padding-block:2rem` | --space-6 |

---

## 1. 디자인 토큰 (통합안)

원칙
- 새 값은 만들지 않았다. 같은 역할로 쓰이고 차이가 작은 값은 가장 많이 쓰인 값(동률이면 가까운 값)으로 묶었다.
- 변수 이름은 하네스 형식(역할 이름)으로 제안한다. 지금 이름에서 바꾸는 것이므로 architect 매핑표가 필요하다 (4장 D-01).
- 정의 위치는 지금처럼 `src/render.ts` `STYLE`의 `:root` (CLAUDE.md 10-4).

### 색상 (7개, 값 변경 없음 — 이름만 정리)
대비는 WCAG 상대 휘도 공식으로 계산한 값이다.

| 토큰 | CSS 변수(제안) | 현재 변수 | 라이트 | 다크 | 용도 | 대비 라이트 / 다크 |
|---|---|---|---|---|---|---|
| bg | `--color-bg` | `--bg` | #fbfaf7 | #141816 | 페이지 배경 | - |
| surface | `--color-surface` | `--card` | #ffffff | #1b201e | 헤더·카드·요약표 배경 | - |
| text | `--color-text` | `--fg` | #1d2321 | #e8ebe8 | 본문 글자, 제목 | bg 15.30:1 / 14.91:1 · surface 15.97:1 / 13.74:1 |
| text-muted | `--color-text-muted` | `--muted` | #5d6763 | #9aa5a0 | 보조 글자(메타, 경로, 푸터, 표 머리) | bg 5.61:1 / 7.05:1 · surface 5.86:1 / 6.50:1 |
| border | `--color-border` | `--line` | #e2e0d8 | #2b322f | 구분선, 카드·상자 테두리 (장식용) | bg 1.27:1 / 1.37:1 (글자에 쓰지 않음) |
| primary | `--color-primary` | `--accent` | #1f6f5c | #6fcfb4 | 링크, 로고 강조, 칩 글자, 요약 머리글, 강조선 | bg 5.77:1 / 9.61:1 · surface 6.02:1 / 8.85:1 · primary-soft 5.22:1 / 7.69:1 |
| primary-soft | `--color-primary-soft` | `--accent-soft` | #e7f1ed | #1f2d28 | In short 상자·칩 배경 | (배경) |

- 글자에 쓰이는 조합은 모두 4.5:1 이상 (가장 낮은 값: 라이트 primary on primary-soft 5.22:1, 칩·"In short" 머리글).
- 브랜드 색은 primary 하나뿐이다. 오류·경고·성공 색은 없다 (지금 화면에 필요한 곳 없음).

### 글꼴
| 토큰 | CSS 변수 | 값 | 용도 | 흡수 |
|---|---|---|---|---|
| font-sans | `--font-sans` | `system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans KR",sans-serif` | 화면 전체(고딕): 제목, 메뉴, 카드, 표, 메타 | `.tldr b`의 `system-ui,sans-serif` (한국어 글꼴 지정이 빠져 있던 값) |
| font-serif | `--font-serif` | `Georgia,"Noto Serif KR",serif` | 글 본문 문단·목록(명조), In short 문장, FAQ 답 | - |

### 타이포그래피
| 토큰 | CSS 변수 | 크기 | 굵기 | 줄간격 | 용도 | 흡수 (현재 값 → 통합 값) |
|---|---|---|---|---|---|---|
| h1 | `--text-h1` | clamp(1.7rem,4vw,2.3rem) | bold(700) | `--leading-tight` 1.15 | 화면 제목 | - |
| h2 | `--text-h2` | 1.3rem | bold(700) | (body 1.65 물려받음) | 섹션 제목 | - |
| lg | `--text-lg` | 1.1rem | - | - | .lead, .tldr p, .card h3, 로고 | 1.08rem(.tldr p), 1.12rem(.card h3), 1.15rem(로고) |
| base | `--text-base` | 17px | 400 | `--leading-body` 1.65 | 본문(고딕·명조), h3 | 1.06rem(article p/li, 16.96px), 1.05rem(h3, 16.8px) |
| ui | `--text-ui` | 15px | - | `--leading-compact` | 표, 신뢰 문구, 헤더 메뉴 | .95rem(헤더 메뉴, 15.2px) |
| sm | `--text-sm` | 14px | - | `--leading-compact` | 메타, 경로, 안내, 출처, 카드 정보, 푸터 | - |
| xs | `--text-xs` | 12px | - | - | 태그, In short 머리글, 칩 | 12.5px(.chip) |

| 토큰 | CSS 변수 | 값 | 흡수 |
|---|---|---|---|
| leading-body | `--leading-body` | 1.65 | - (한국어 가독성 기준 1.6 이상 충족) |
| leading-compact | `--leading-compact` | 1.5 | 1.45(table, .card dl), 1.4(.tldr b) |
| leading-snug | `--leading-snug` | 1.3 | - (.card h3) |
| leading-tight | `--leading-tight` | 1.15 | - (h1) |
| leading-none | `--leading-none` | 1 | - (.chip) |
| weight-medium | `--weight-medium` | 500 | - (.infobox th) |
| weight-semibold | `--weight-semibold` | 600 | - |
| weight-bold | `--weight-bold` | 700 (h1~h3·b·th의 브라우저 기본값) | 750(로고). system-ui가 가변 글꼴이 아니면 750과 700은 같게 보인다 (추정) |
| tracking-tight | `--tracking-tight` | -.02em | -.01em(로고) |
| tracking-caps | `--tracking-caps` | .06em | - (.tldr b, 대문자 머리글) |

- h3(16.8px)와 본문(17px)은 지금도 크기가 거의 같고 굵기로만 구분된다. 통합 후에도 같다 (4장 D-08).

### 간격 (21종 → 7단계 + 여백)
| 토큰 | CSS 변수 | 값 | 흡수 |
|---|---|---|---|
| space-1 | `--space-1` | .25rem | .15rem, .2rem, .35rem |
| space-2 | `--space-2` | .5rem | .4rem, .55rem, .6rem |
| space-3 | `--space-3` | .75rem | .8rem |
| space-4 | `--space-4` | 1rem | .9rem, 1.1rem |
| space-5 | `--space-5` | 1.25rem | 1.15rem, 1.2rem, 1.5rem |
| space-6 | `--space-6` | 2rem | 2.25rem |
| space-7 | `--space-7` | 3rem | - |
| gutter | `--gutter` | 16px | - (`.wrap` 좌우, 안전 영역과 큰 값 사용) |

눈에 띄게 달라지는 곳 (추정)
- `.chip` 위아래 여백 .35rem → .25rem: 칩 높이 약 23.7px → 약 20px. 도시 칩은 링크라서 누르는 영역이 작아진다. 예외로 `--space-2`를 쓸지 결정 필요 (4장 D-06).
- h2 위 여백 2.25rem → 2rem, h3 위 여백 1.5rem → 1.25rem: 섹션 사이가 조금 좁아진다.
- `.card` 안쪽 여백 1.1rem 1.2rem → 1rem 1.25rem, `.tldr` 1rem 1.15rem → 1rem 1.25rem.

### 모서리
| 토큰 | CSS 변수 | 값 | 용도 | 흡수 |
|---|---|---|---|---|
| radius-sm | `--radius-sm` | 8px | .notice | - |
| radius-md | `--radius-md` | 12px | .card, .infobox, .tldr | 10px(.tldr). 8px·12px와 거리가 같아 상자 계열인 12px로 둠 (4장 D-07) |
| radius-pill | `--radius-pill` | 999px | .chip, .tag | - |

### 선 · 그림자
| 토큰 | CSS 변수 | 값 | 용도 |
|---|---|---|---|
| border-width | `--border-width` | 1px | 구분선·테두리 전부 (색은 `--color-border`) |
| border-width-strong | `--border-width-strong` | 2px | .trust 항목 윗선 (색은 `--color-primary`) |
| 그림자 | (토큰 없음) | 사용 0건 | 그림자를 쓰지 않는 것이 현재 규칙이다. 유지 |

### 레이아웃 폭 · 브레이크포인트
| 토큰 | CSS 변수 | 값 | 용도 |
|---|---|---|---|
| measure | `--measure` | 46rem | 기본 화면 폭 (글·학교 프로필·목록·운영자 정보·404) |
| measure-wide | `--measure-wide` | 68rem | `body.wide` 화면 폭 (첫 화면·도시 비교) |
| measure-lead | `--measure-lead` | 40rem | .lead 문단 최대 폭 |

- 컴포넌트 고유값 (토큰으로 올리지 않음): `.grid` 칸 최소 19rem, `.trust` 칸 최소 14rem, `.infobox th` 폭 9.5rem, `.card dl` 열 `auto 1fr`.
- 브레이크포인트 토큰은 없다. 현재 설계는 미디어 쿼리 없이 유동적으로 바뀐다. 실제로 모양이 바뀌는 지점은 아래와 같다 (`*{box-sizing:border-box}`라 폭에 좌우 여백 32px 포함, 계산값이라 모두 추정).

| 지점 (화면 너비) | 바뀌는 것 |
|---|---|
| ~496px | .trust 1열 → 2열 (추정) |
| ~656px | .grid(카드) 1열 → 2열 (추정) |
| 680px ~ 920px | h1이 27.2px에서 36.8px로 커짐 (그 밖에서는 고정) |
| ~736px | .trust 3열, 기본 화면 폭(46rem) 꽉 참 |
| ~976px | .grid 2열 → 3열 (추정) |
| 1088px | wide 화면 폭(68rem) 꽉 참 |

### 통합 결과 요약
| 종류 | 현재 서로 다른 값 | 통합안 |
|---|---|---|
| 색 | 7 (라이트·다크 각각) | 7 (값 그대로, 이름만 역할형) |
| 글꼴 | 3 | 2 |
| 글자 크기 | 14 | 7 |
| 줄간격 | 7 | 5 |
| 굵기 | 3 + 기본 bold | 3 |
| 자간 | 3 | 2 |
| 간격 | 21 | 7 + gutter |
| 모서리 | 4 | 3 |
| 선 굵기 | 2 | 2 |
| 그림자 | 0 | 0 |

---

## 2. 컴포넌트

공통
- 피그마가 없으므로 "Figma 컴포넌트명"은 모두 없음. HTML 클래스명은 현재 코드 이름이다 (architect가 확정할 때까지 현재 이름 유지 제안).
- 상태: hover는 헤더 메뉴 링크와 카드 제목 링크에만 있다. focus 스타일은 정의되어 있지 않아 브라우저 기본 외곽선을 쓴다 (추정, 4장 D-05). 비활성·로딩 상태가 있는 컴포넌트는 없다 (버튼·입력 없음, 서버 렌더링).
- 화면 ID는 3장 표 참고.

| # | 컴포넌트 | HTML / 클래스 | 쓰는 토큰 (통합안) | 변형 · 상태 | 쓰이는 화면 |
|---|---|---|---|---|---|
| C-01 | 헤더 | `header > .wrap > a.home + nav` | surface 배경, border 아래선, 로고 text-lg·weight-bold·tracking-tight, "Wiki"만 primary / 메뉴 text-ui·text-muted, hover primary / 위아래 space-4(.9rem 흡수), 사이 space-5·space-4 | 영어 메뉴(Schools·Articles·About·한국어) / 한국어 메뉴(글 모음·English·운영자 정보). 로고 링크: 영어 `/`, 한국어 `/ko/blog/`. 줄바꿈 허용 | 전 화면 |
| C-02 | 푸터 | `footer > .wrap` | border 윗선, text-sm·leading-compact·text-muted, 위아래 space-6 | 영어 / 한국어 문구. 운영자 이름·브랜드·운영자 정보 링크 | 전 화면 |
| C-03 | 경로 표시 | `nav.crumbs` | text-sm·text-muted (링크도 muted), 아래 space-3 | 구분자 "›". 프로필: Home › 도시 / 글: 홈 › 글 모음 › 학교 | P-02, P-04 |
| C-04 | 학교 카드 | `.grid > .card` (div) | surface, border, radius-md, 안쪽 space-4 space-5, 세로 간격 space-2 / 위: `.meta` 도시·나라 / 제목 h3 text-lg·leading-snug·text, hover primary / C-06 칩 / `dl` 2열(text-sm, dt muted) / C-07 태그 / `.more` 맨 아래 text-sm | 칩·정보 행·태그·글 수는 데이터가 있을 때만. 정보 행: Year groups, Annual tuition(+source 링크). 첫 화면은 "· n articles", 도시 비교는 글 수 생략 | P-01, P-03 |
| C-05 | 글 카드 | `.grid > .card` (div) | C-04와 같은 상자 / `.meta` 학교·날짜, h3 제목, `p.meta` 요약 | 빈 상태: "No articles yet." | P-01 (Latest articles) |
| C-06 | 칩 | `.chips > .chip` | primary-soft 배경, primary 글자, text-xs, weight-semibold, leading-none, radius-pill, 안쪽 space-1 space-2, 칩 사이 space-1 | (1) `span.chip` 교육과정 표시(누를 수 없음) (2) `a.chip` 도시 비교 링크 "City, Country · n schools". 두 변형의 모양이 같다 (D-05) | P-01(둘 다), P-03(span) |
| C-07 | 태그 | `a.tag` | text-xs, text-muted, border, radius-pill, 안쪽 space-1 space-2, 왼쪽 정렬 | 고객 학교만: "Client of the site's operator" → /about | P-01, P-03 (카드 안) |
| C-08 | 요약표 (infobox) | `.infobox > table` | surface, border, radius-md, 안쪽 space-2 space-4, 위아래 space-5 / 표 text-ui, th 9.5rem·weight-medium·text-muted, 마지막 행 선 없음 | (A) 학교 프로필: 제목 없음. 위치·교육과정·학년·연간 학비(+출처)·공식 웹사이트·기록된 사실 수 (B) 글 페이지: h3 "About the school: 학교명"/"학교 개요: 학교명" + 위치·교육과정·학년·학비 + "Full school profile" 링크. 한국어 글은 행 이름 한국어 | P-02(A), P-04(B) |
| C-09 | In short 상자 | `.tldr > b + p` | primary-soft 배경, radius-md, 안쪽 space-4 space-5, 위아래 space-5 / 머리글 text-xs·weight-semibold·tracking-caps·대문자·primary / 문장 text-lg·font-serif | 영어 "In short", 한국어 "요약". speakable 대상(`.tldr`) | P-04 |
| C-10 | 고객 안내 notice | `p.notice` | border, radius-sm, 안쪽 space-2 space-3, text-sm·leading-compact·text-muted, 글 안에서도 고딕 | 고객 학교일 때만. 영어/한국어 문구(`src/operator.ts` CLIENT_NOTICE) | P-02, P-04 |
| C-11 | 글 목록 | `ul.plain > li` | 목록 표시 없음, 항목 위아래 space-3, 아래선 border, 제목 링크 weight-semibold, 아래 `.meta` 2줄(날짜·학교 / 요약) | 학교 프로필에서는 학교명 생략. 빈 상태: "No articles yet." / "아직 게시된 글이 없습니다." | P-02, P-05 |
| C-12 | 출처 목록 | `h2#sources + ul.sources` | text-muted, 링크 primary, 긴 주소 줄바꿈(`overflow-wrap:anywhere`), 고딕 | 주소를 그대로 보여 줌. 글 머리 메타의 "n sources" 링크가 `#sources`로 이동 | P-04 |
| C-13 | 표 (.scroll) | `div.scroll > table` | 표 text-ui·leading-compact, 셀 안쪽 space-2, 행 아래선 border, 왼쪽·위 정렬, 감싼 div 가로 스크롤 | (1) 글 본문 마크다운 표 (2) 학교 프로필 전체 사실 표(항목·값·기준일·출처) (3) 도시 비교 Side by side(학교 × 공통 항목, 값 없으면 "—") (4) 운영자 사업자 정보(th·td 2열) | P-04, P-02, P-03, P-06 |
| C-14 | 펼침 (details) | `details > summary` | 위 space-4, summary primary·weight-semibold·손가락 커서 | 기본 닫힘. "Show all n facts with sources" | P-02 |
| C-15 | 신뢰 문구 목록 | `ul.trust > li > b` | 그리드(칸 최소 14rem, 간격 space-4), 위 space-6, 항목 윗선 border-width-strong·primary, text-ui | 항목 3개 고정 문구(Sourced / Checked before publishing / Read daily) | P-01 |
| C-16 | 머리 문단 | `p.lead` | text-lg, text-muted, 최대 폭 measure-lead | - | P-01 |
| C-17 | 메타 글 | `.meta` (span·p·div) | text-sm·leading-compact·text-muted, 글 안에서도 고딕 | 날짜·학교·출처 수, 빈 상태 안내 문장에도 씀 | 전 화면(404 제외) |
| C-18 | 글 본문 | `article` 안 h2~h4·p·ul·ol | 제목 font-sans, 문단·목록 font-serif text-base, 긴 단어 줄바꿈 | 마크다운 변환(`markdownToHtml`): h2~h4, 목록, 굵게·기울임, 외부 링크(nofollow), 표(C-13). FAQ는 h2 + 질문 h3 + 답 p | P-04 |

---

## 3. 화면 명세

모든 화면은 **공개**다 (회원 기능 없음, CLAUDE.md 10-1). 회원 전용·혼합 화면이 없으므로 "권한 없음" 상태는 해당 없음. `/admin/*`은 화면이 아닌 API다 (토큰 없으면 글자만 있는 401).

| 화면 ID (가칭) | 화면 | 경로 | 언어 | 폭 |
|---|---|---|---|---|
| P-01 | 첫 화면 | `/` | 영어 | wide 68rem |
| P-02 | 학교 프로필 | `/wiki/{slug}` | 영어 | 기본 46rem |
| P-03 | 도시 비교 | `/compare/{city}-international-schools` | 영어 | wide 68rem |
| P-04 | 글 페이지 | `/blog/{slug}`, `/ko/blog/{slug}` | 영어·한국어 | 기본 46rem |
| P-05 | 글 목록 | `/blog/`, `/ko/blog/` | 영어·한국어 | 기본 46rem |
| P-06 | 운영자 정보 | `/about`, `/ko/about` | 영어·한국어 | 기본 46rem |
| P-07 | 찾을 수 없음 | 그 밖의 모든 경로, 없는 학교·글·도시 | 영어 | 기본 46rem |

공통 반응형 (모든 화면, 계산값이라 추정)
- 화면 폭 = min(화면 너비, 46rem 또는 68rem), 좌우 여백 16px(안전 영역이 더 크면 그 값). 375px에서 내용 폭 343px, 768px에서 704px(기본)·736px(wide), 1280px에서 704px(기본)·1056px(wide).
- 헤더: 로고와 메뉴가 한 줄에 안 들어가면 메뉴가 다음 줄로 내려간다. 375px 영어 메뉴(4개)는 두 줄이 될 가능성이 높다 (추정).
- h1: 680px 이하 27.2px, 920px 이상 36.8px, 그 사이 화면 너비의 4%.
- 표: 넓으면 `.scroll` 안에서 가로 스크롤 (페이지 자체는 가로 스크롤 없음).
- 로딩 상태: 서버에서 완성된 HTML을 보내므로 해당 없음 (모든 화면 공통).
- 오류 상태: 서버 오류는 디자인 틀 없이 글자 "Server error"(500)만 나간다 (모든 화면 공통, 4장 D-03).

### P-01 첫 화면 (공개, wide)
- Figma 프레임: 없음 / 관련 코드: `home()` (`src/index.ts` 72~96행)
- 섹션 순서와 컴포넌트
  1. h1 "International schools in Asia, from their own published sources"
  2. C-16 머리 문단
  3. C-15 신뢰 문구 3개
  4. h2#schools "Schools" → C-04 학교 카드 그리드 (나라·도시·이름 순)
  5. h2 "Browse by city" → C-06 도시 칩(링크)
  6. h2 "Latest articles" → C-05 글 카드 그리드 (영어 최신 6개)
- 제목 구조: h1 1개 → h2 3개 → 카드 제목 h3. 목차 없음. 헤더 "Schools" 메뉴가 `#schools`로 이동.
- 상태: 빈 글 → "No articles yet." / 학교 0개 → 카드 영역이 비고 도시 칩도 없음(문구 없음, 4장 D-09) / 학교 요약 사실이 없으면 카드에 칩·정보 행 없음.
- 반응형 (추정): 375 — 신뢰 문구·카드 1열 / 768 — 신뢰 문구 3열, 카드 2열 / 1280 — 카드 3열 (내용 폭 1056px).
- 접근성: 카드 전체가 아니라 제목과 "School profile" 링크만 누를 수 있음. 같은 학교로 가는 링크가 카드마다 2개.

### P-02 학교 프로필 (공개, 기본)
- Figma 프레임: 없음 / 관련 코드: `wikiPage()` (237~265행)
- 섹션 순서
  1. C-03 경로: Home › 도시
  2. h1 학교명
  3. C-17 메타: "International school in 도시, 나라 · Compare schools in 도시"
  4. C-10 고객 안내 (고객 학교만)
  5. C-08(A) 요약표 — 결정 "정보를 앞에"에 맞게 h1 바로 아래
  6. h2 "Articles" → C-11 글 목록 (영어 최대 20개)
  7. h2 "All recorded facts" → C-14 펼침 안 C-13 사실 표
- 제목 구조: h1 → h2 2개. 목차 없음.
- 상태: 글 없음 → "No articles yet." / 사실 없음 → 요약표 "None yet; added as the school publishes", 아래 "No verified facts recorded yet." / 없는·비활성 학교 → P-07.
- 반응형 (추정): 375 — 요약표 머리칸 9.5rem(152px)에 값 칸 약 159px라 학비 행이 여러 줄이 된다. 사실 표(4열)는 가로 스크롤 / 768·1280 — 내용 폭 704px 고정.
- 접근성: 요약표는 `th`(행 머리)·`td` 구조. 사실 표는 `thead` 있음. 출처 링크 글자가 "link"/"source"뿐이라 링크만 모아 들으면 구분이 안 됨 (4장 D-10).

### P-03 도시 비교 (공개, wide)
- Figma 프레임: 없음 / 관련 코드: `comparePage()` (267~298행)
- 섹션 순서
  1. h1 "International schools in 도시"
  2. 소개 문단 (학교 수, 알파벳 순, 출처 안내) — 일반 p, 고딕
  3. h2 "Schools" → C-04 학교 카드 그리드 (글 수 생략)
  4. h2 "Side by side" → C-13 비교 표 (학교가 2곳 이상일 때만, 2곳 이상에 있는 항목만 열로)
- 경로 표시 없음 (P-02·P-04에는 있음, 4장 D-11).
- 상태: 학교 0곳 → P-07 / 1곳 → 비교 표 없음, 카드 하나 / 값 없음 → "—".
- 반응형 (추정): 375 — 카드 1열, 비교 표 가로 스크롤 / 768 — 카드 2열 / 1280 — 카드 3열. 학교가 1곳이면 1280에서 카드가 폭의 1/3만 차지 (`auto-fill`).

### P-04 글 페이지 (공개, 기본, 영어·한국어)
- Figma 프레임: 없음 / 관련 코드: `articlePage()` (190~235행)
- 섹션 순서
  1. C-03 경로: 홈 › 글 모음 › 학교명 (한국어 글은 "홈"도 `/ko/blog/`)
  2. h1 글 제목
  3. C-17 메타: 날짜 · 학교명 링크 · "n sources"(→ #sources)
  4. C-10 고객 안내 (고객 학교만)
  5. C-09 In short
  6. C-18 본문 (h2~h4, 표 C-13)
  7. h2 "Questions parents ask"/"자주 묻는 질문" → 질문 h3 + 답 p (있을 때만)
  8. h2#sources "Sources"/"출처" → C-12
  9. (article 밖) C-08(B) 학교 요약 상자
- 글꼴: 본문 문단·목록·In short 문장·FAQ 답은 명조, 제목·경로·메타·안내·출처·요약 상자는 고딕.
- 제목 구조: h1 → h2(본문) → h3. 본문 마크다운이 h4까지 허용. 요약 상자 제목은 h3인데 바로 앞이 h2 "Sources"라 단계는 맞음.
- 상태: 없는 글·미게시 글 → P-07 / FAQ 없음 → FAQ 섹션 없음 / 학교 정보 없음 → 요약 상자·경로의 학교 단계 없음.
- 반응형 (추정): 375 — 본문 17px 명조, 표 가로 스크롤, 긴 출처 주소 줄바꿈 / 768·1280 — 내용 폭 704px.
- 접근성: `lang`이 글 언어(en/ko)로 설정. 한국어 글은 Georgia에 한글이 없어 기기 명조로 대체 (추정).
- 결정 방향과의 차이: 학교 요약 상자가 글 맨 끝(출처 뒤)에 있다. "정보를 앞에" 결정을 글 페이지에도 적용할지 결정 필요 (4장 D-02).

### P-05 글 목록 (공개, 기본, 영어·한국어)
- Figma 프레임: 없음 / 관련 코드: `blogIndex()` (180~188행)
- 섹션 순서: h1 "Articles"/"국제학교 글 모음" → C-11 글 목록 (해당 언어 최신 100개, 날짜·학교·요약)
- 제목 구조: h1만. 목록 항목 제목은 제목 태그가 아닌 굵은 링크.
- 상태: 빈 목록 → "No articles yet." / "아직 게시된 글이 없습니다.". 100개 넘으면 나머지는 목록에 안 나옴 (페이지 나누기 없음).
- 반응형 (추정): 375·768·1280 모두 1열 목록, 차이는 내용 폭만.

### P-06 운영자 정보 (공개, 기본, 영어·한국어)
- Figma 프레임: 없음 / 관련 코드: `about()` (143~162행)
- 섹션 순서: h1 → 운영 설명 문단 → h2 "How pages are written"/"작성 방식" → 문단 → h2 "Business details"/"사업자 정보" → C-13 표(상호·대표자·사업자등록번호)
- article 밖이라 문단도 고딕.
- 상태: 고정 내용이라 빈 상태 없음.
- 반응형 (추정): 375에서 표 머리칸 "Korean business registration no."가 길어 여러 줄.

### P-07 찾을 수 없음 (공개, 기본)
- 관련 코드: `notFoundBody()` (368~370행). 상태 코드 404.
- 내용: h1 "Page not found" + "Back to the start" 링크. 헤더·푸터는 영어판.
- 한국어 경로에서 없는 글을 열어도 영어 404가 나온다 (4장 D-09).

---

## 4. 불일치 목록

| ID | 유형 | 내용 | 영향 | 제안 |
|---|---|---|---|---|
| D-01 | 규칙 위반 | 색 외의 디자인 값이 토큰 없이 93건 하드코딩 (0-7). CLAUDE.md 10-4·16장 "화면 코드는 변수만" 위반 | 값 수정이 여러 곳에 흩어짐 | 1장 통합안 적용. 지금은 안정화 모드(P0·P1만)라 **P2로 기록하고 첫 정기 릴리스에서 한 번에** 적용 (추천). 변수 이름 변경은 architect 매핑표 필요 |
| D-02 | 결정 방향 | "정보를 앞에" 결정과 달리 글 페이지의 학교 요약 상자가 글 맨 끝(출처 뒤, article 밖)에 있다 | 글로 들어온 독자가 학교 기본 정보를 늦게 봄 | 선택지 A: 지금 위치 유지(글이 주인공) / B: In short 아래로 이동. 추천: 사람 결정 (화면 문구·배치 변경이므로 15장에 따라 사람 승인) |
| D-03 | 상태 화면 | 서버 오류(500)가 디자인 틀 없는 글자 "Server error"로 나감. 404만 틀이 있음 | 오류 시 헤더·메뉴로 돌아갈 길 없음 | 404와 같은 틀의 오류 화면 추가 여부 결정. 범위 변경이면 backlog |
| D-04 | 단위 | 글자 크기에 px(14·15·17·12·12.5)과 rem이 섞임 | 브라우저 기본 글자 크기를 키운 사용자에게 px 값(본문 17px 포함)은 커지지 않음 (추정) | 선택지 A: 통합안 값 그대로(px 유지) / B: 같은 크기의 rem으로 표기(14px=.875rem 등, 기본 설정에서는 화면 변화 없음). 추천 B, 단 B는 표기 변환이라 사람 승인 필요 |
| D-05 | 컴포넌트 | (1) 칩이 링크(도시)와 비링크(교육과정)에 같은 모양 — 누를 수 있는지 구분 안 됨, 링크 칩 hover 없음 (2) focus 스타일 정의 없음, 헤더·카드 제목 링크는 밑줄 없이 색으로만 구분 | 키보드·터치 사용자 혼동 (추정) | 새 값 없이 가능한 안: 링크 칩에 기존 hover 규칙(primary)·밑줄 사용 여부 결정. focus는 브라우저 기본 유지 여부 결정 |
| D-06 | 통합 영향 | 간격 통합에서 칩 위아래 여백이 .35rem → .25rem이 되어 링크 칩 높이가 약 24px → 약 20px (추정) | WCAG 2.2 목표 크기(24px) 아래로 내려감 (추정) | 칩만 `--space-2`(.5rem) 예외 또는 현재 .35rem 유지. 추천: 칩 세로 여백은 통합에서 제외 |
| D-07 | 통합 판단 | .tldr 모서리 10px가 8px·12px와 거리가 같음 | 미미 | 12px(`--radius-md`) 추천 |
| D-08 | 위계 | h3(16.8px)와 본문(17px)이 같은 크기, 굵기·글꼴(고딕/명조)로만 구분 | 금지 목록 "비슷한 크기·굵기" 경계. 글 페이지에서는 고딕/명조 차이로 구분됨 | 유지 추천 (값을 새로 만들지 않는 범위에서는 h3를 text-lg로 올리는 선택지만 있음) |
| D-09 | 상태·언어 | 학교 0개일 때 첫 화면 학교·도시 영역에 안내 문구 없음 / 한국어 경로의 404가 영어 / 학교 프로필·도시 비교·첫 화면은 영어만 있어 한국어 글에서 링크하면 영어 화면으로 감 | 한국어 독자 경로 끊김 (adopt-report에도 기록) | 디자인이 아니라 PRD 범위 문제. 역기획 PRD에서 결정 |
| D-10 | 접근성 | 출처 링크 글자가 "link"/"source"/"출처"뿐 | 화면 읽기 프로그램의 링크 목록에서 구분 어려움 | 문구 변경은 제안까지만(15장). backlog 후보 |
| D-11 | 일관성 | 경로 표시가 P-02·P-04에는 있고 P-03에는 없음 | 미미 | 유지 또는 추가 결정 |
| D-12 | 글꼴 | `.tldr b`가 `system-ui,sans-serif`로 따로 지정되어 "Noto Sans KR" 지정이 빠짐 | 한국어 "요약" 머리글이 본문 고딕과 다른 글꼴이 될 수 있음 (추정) | 통합안에서 `--font-sans`로 흡수 (값 추가 없음) |
| D-13 | 의도와 실제 | 출처 목록 `.sources`는 14px로 지정했지만 `article li`(1.06rem) 규칙이 `li`에 직접 걸려 실제 항목은 약 17px (추정, CSS 우선순위 계산). 글꼴만 `article .sources li`로 고딕 처리됨 | 출처 목록이 의도보다 크게 보임 | 의도가 14px이면 `article .sources li`에 `--text-sm` 적용. 사람 확인 필요 |
| D-14 | 기준 문서 | PRD.md·seo-plan.md가 없어 화면 ID와 h1·필수 섹션을 대조할 수 없음 | 3단계 점검 2개 항목 미확인 | 역기획 PRD·seo-plan 확정 뒤 화면 ID와 h1 대조 |

---

## 5. 점검 결과

| 항목 | 결과 | 메모 |
|---|---|---|
| PRD의 모든 화면에 명세가 있다 | 미확인 | PRD 없음. 코드의 공개 라우트 7개(P-01~P-07)는 모두 명세함 |
| seo-plan의 h1·필수 섹션·목차 자리 | 미확인 | seo-plan 없음. h1 1개 규칙은 check.sh 20이 검사함 (이번에 실행하지 않음) |
| 빈·로딩·오류 상태 정의 | 일부 | 빈 상태: 글 목록·사실 표·카드 있음, 첫 화면 학교 0개 없음(D-09). 로딩: 해당 없음. 오류: 500 틀 없음(D-03). 회원 전용 화면 없음 |
| 모든 색·글꼴·간격이 토큰으로 설명됨 | 통합안 기준 예 / 현재 코드 아니오 | 색은 이미 변수. 나머지 93건은 통합안 적용 필요(D-01) |
| 본문 대비 4.5:1 이상 | 통과 | 글자 조합 최저 5.22:1 (라이트 primary on primary-soft) |
| 텍스트가 이미지 안에만 있는 부분 없음 | 통과 | 이미지 0개 (학교 사진 없음 결정) |
| 금지 목록 위반 없음 | 통과 | 그라데이션·그림자·유리 효과·이모지·일러스트·근거 없는 통계 0건. 첫 화면 신뢰 문구 3개(C-15)는 둥근 카드가 아닌 윗선 목록이고 내용이 실제 작동 방식(출처 링크·발행 전 검사·매일 수집)이라 위반 아님으로 판단 |

### VERDICT
- 결과: NEEDS_APPROVAL
- 단계/대상: S2 / design-spec 추출 초안 (게이트 B)
- 근거: 하드코딩 93건(색 0)과 토큰 통합안·컴포넌트 18종·화면 7개 명세 작성. 사람 결정 필요 항목 D-01~D-14, PRD·seo-plan 부재로 점검 2항목 미확인 (docs/design-spec.md)
- 다음 담당: 사람
