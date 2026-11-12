-- When a held English article gets its one repair pass, the draft the checker first read and the
-- problems it raised, so the repair can be audited (what was flagged, what changed).
CREATE TABLE article_revisions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id    INTEGER NOT NULL REFERENCES articles(id),
  draft_json    TEXT NOT NULL,
  problems_json TEXT NOT NULL,
  at            TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX article_revisions_article ON article_revisions(article_id);
