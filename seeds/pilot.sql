-- Pilot schools. website and news_feed stay NULL until the official URLs are confirmed.
INSERT OR IGNORE INTO schools (slug, name, city, city_slug, country, website, news_feed) VALUES
  ('bsb-shunyi', 'British School of Beijing, Shunyi', 'Beijing', 'beijing', 'China', NULL, NULL),
  ('dais', 'Dalian American International School', 'Dalian', 'dalian', 'China', NULL, NULL);
