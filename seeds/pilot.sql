-- Pilot schools. news_feed is an RSS/Atom URL or, for schools without one, their news index page.
-- Neither school publishes RSS (checked 2026-11-11); DAIS news comes from daischina.org, not
-- dalianhuamei.cn, whose news mixes in Dalian Huamei School items.
INSERT INTO schools (slug, name, city, city_slug, country, website, news_feed) VALUES
  ('bsb-shunyi', 'British School of Beijing, Shunyi', 'Beijing', 'beijing', 'China',
   'https://www.nordangliaeducation.com/bsb-shunyi',
   'https://www.nordangliaeducation.com/bsb-shunyi/news-search?pageNum=1&type=news'),
  ('dais', 'Dalian American International School', 'Dalian', 'dalian', 'China',
   'https://www.daischina.org/',
   'https://www.daischina.org/news')
ON CONFLICT (slug) DO UPDATE SET website = excluded.website, news_feed = excluded.news_feed;
