CREATE TABLE schools (
  slug         TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  city         TEXT NOT NULL,
  city_slug    TEXT NOT NULL,
  country      TEXT NOT NULL,
  website      TEXT,
  news_feed    TEXT,
  active       INTEGER NOT NULL DEFAULT 1
);

-- The only material articles may state. Every row carries where it came from.
CREATE TABLE facts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  school_slug  TEXT NOT NULL REFERENCES schools(slug),
  key          TEXT NOT NULL,
  value        TEXT NOT NULL,
  unit         TEXT,
  as_of        TEXT,
  source_url   TEXT NOT NULL,
  source_kind  TEXT NOT NULL CHECK (source_kind IN ('ispp_api', 'school_site', 'school_submission', 'manual')),
  fetched_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (school_slug, key, value)
);
CREATE INDEX facts_school ON facts(school_slug);

-- Proper nouns an article may use for a school beyond its facts (programmes, partner universities, people).
CREATE TABLE entities (
  school_slug  TEXT NOT NULL REFERENCES schools(slug),
  name         TEXT NOT NULL,
  source_url   TEXT NOT NULL,
  PRIMARY KEY (school_slug, name)
);

CREATE TABLE source_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  school_slug  TEXT NOT NULL REFERENCES schools(slug),
  url          TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  summary      TEXT,
  published_at TEXT,
  collected_at TEXT NOT NULL DEFAULT (datetime('now')),
  extracted_at TEXT,
  facts_found  INTEGER NOT NULL DEFAULT 0,
  used_by      INTEGER REFERENCES articles(id)
);

CREATE TABLE articles (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  school_slug  TEXT NOT NULL REFERENCES schools(slug),
  lang         TEXT NOT NULL DEFAULT 'en',
  translation_of INTEGER REFERENCES articles(id),
  slug         TEXT NOT NULL,
  kind         TEXT NOT NULL,
  title        TEXT NOT NULL,
  tldr         TEXT NOT NULL,
  body_md      TEXT NOT NULL,
  faq_json     TEXT NOT NULL DEFAULT '[]',
  sources_json TEXT NOT NULL DEFAULT '[]',
  status       TEXT NOT NULL CHECK (status IN ('held', 'verified', 'published', 'unpublished')),
  run_id       TEXT NOT NULL,
  model        TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT,
  UNIQUE (lang, slug)
);
CREATE INDEX articles_status ON articles(status, published_at);
CREATE INDEX articles_school ON articles(school_slug, created_at);

CREATE TABLE verification_results (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id   INTEGER NOT NULL REFERENCES articles(id),
  passed       INTEGER NOT NULL,
  problems_json TEXT NOT NULL,
  checked_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Every status change, so a whole run can be taken down and the history kept.
CREATE TABLE article_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id   INTEGER NOT NULL REFERENCES articles(id),
  from_status  TEXT,
  to_status    TEXT NOT NULL,
  reason       TEXT,
  at           TEXT NOT NULL DEFAULT (datetime('now'))
);
