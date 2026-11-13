-- A news page that answered with a temporary error (429, 5xx, network failure) is read again on a
-- later run instead of being recorded as having no facts. After MAX_PAGE_ATTEMPTS it is given up.
ALTER TABLE source_items ADD COLUMN extract_attempts INTEGER NOT NULL DEFAULT 0;

-- An article taken down and rewritten (POST /admin/rewrite) points at its replacement, so its old
-- address redirects there with 301 instead of answering 404.
ALTER TABLE articles ADD COLUMN replaced_by INTEGER REFERENCES articles(id);
