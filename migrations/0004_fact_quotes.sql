-- The exact sentence on the source page that states each fact, kept so a value can be audited later
-- and shown to the writer and the grounding check. NULL for myispp and manual rows, which have no page quote.
ALTER TABLE facts ADD COLUMN quote TEXT;
