-- 검사 전용 글 (scripts/snapshot.sh가 .harness/d1 에만 넣는다. 운영·파일럿 DB에는 넣지 않는다).
-- 글 페이지·목록·FAQ·출처·번역 링크가 HTML 검사와 링크 검사를 거치도록 게시 상태 글 두 개를 둔다.
INSERT INTO articles (school_slug, lang, translation_of, slug, kind, title, tldr, body_md, faq_json, sources_json, status, run_id, model, published_at)
VALUES ('dais', 'en', NULL, 'check-fixture-article', 'programme', 'Check fixture article',
  'Fixture used only by the local page checks.',
  '## First section

A paragraph with a [link](https://www.daischina.org/) and **bold** text.

- one
- two

## Second section

Another paragraph.',
  '[{"question":"Is this a fixture?","answer":"Yes."}]',
  '["https://www.daischina.org/news"]',
  'published', 'check', 'check', '2026-01-01 00:00:00');

INSERT INTO articles (school_slug, lang, translation_of, slug, kind, title, tldr, body_md, faq_json, sources_json, status, run_id, model, published_at)
VALUES ('dais', 'ko', (SELECT id FROM articles WHERE lang = 'en' AND slug = 'check-fixture-article'), 'check-fixture-article', 'programme', '검사용 글', '로컬 페이지 검사에만 쓰는 글입니다.',
  '## 첫 부분

문단입니다.',
  '[{"question":"검사용인가요?","answer":"네."}]',
  '["https://www.daischina.org/news"]',
  'published', 'check', 'check', '2026-01-01 00:00:00');
