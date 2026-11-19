-- The British School of Nanjing (Nanjing, China), a Nord Anglia Education school: school row and short names.
-- Added for a local pilot on 2026-11-19 (operator request). The school's pages could not be opened from the
-- cloud session that wrote this file (network policy), so:
--   - no manual facts yet: the pilot collects the school's news and extracts facts from those pages itself;
--     fee facts need the school's fee PDF (linked from /bsn-nanjing/admissions/tuition-fees) and are added later;
--   - the news index follows the same Nord Anglia site layout as BSB Shunyi (seeds/pilot.sql);
--   - ispp_school_id is NULL until the school's myispp id is checked;
--   - is_client = 0 until the operator says whether the school is a client.
-- Check the name, the news index and is_client against the school's website before applying this to production.
INSERT INTO schools (slug, name, city, city_slug, country, website, news_feed, ispp_school_id, is_client) VALUES
  ('bsn-nanjing', 'The British School of Nanjing', 'Nanjing', 'nanjing', 'China',
   'https://www.nordangliaeducation.com/bsn-nanjing',
   'https://www.nordangliaeducation.com/bsn-nanjing/news-search?pageNum=1&type=news',
   NULL, 0)
ON CONFLICT (slug) DO UPDATE SET website = excluded.website, news_feed = excluded.news_feed, ispp_school_id = excluded.ispp_school_id,
  is_client = excluded.is_client;

-- Short names the school goes by in its website path.
INSERT OR IGNORE INTO entities (school_slug, name, source_url) VALUES
  ('bsn-nanjing', 'BSN', 'https://www.nordangliaeducation.com/bsn-nanjing'),
  ('bsn-nanjing', 'British School of Nanjing', 'https://www.nordangliaeducation.com/bsn-nanjing');
