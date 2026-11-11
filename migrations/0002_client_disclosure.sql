-- 1 when the school pays the operator for services; pages about it then say so.
ALTER TABLE schools ADD COLUMN is_client INTEGER NOT NULL DEFAULT 0;
