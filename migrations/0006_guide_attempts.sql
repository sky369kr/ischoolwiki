-- Topic guides (src/guides.ts) are tried once per school and topic. outcome is 'verified',
-- 'published', 'held' or 'skipped' (the writer declined, for example because an existing article
-- already covers the topic). article_id is NULL when skipped.
CREATE TABLE guide_attempts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  school_slug TEXT NOT NULL REFERENCES schools(slug),
  topic       TEXT NOT NULL,
  article_id  INTEGER REFERENCES articles(id),
  outcome     TEXT NOT NULL,
  detail      TEXT,
  at          TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (school_slug, topic)
);
