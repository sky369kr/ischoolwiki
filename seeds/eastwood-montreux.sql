-- Eastwood Montreux (Montreux, Switzerland): school row, short names and facts from the school.
-- Sources: the school's website (checked 2026-11-14) and documents the school gave the operator on 2026-11-14:
-- "2026 Tuition Overview", "About" sheet, brochure. These documents are not on the school's website, so their facts
-- link to the website and name the document in the unit (operator decision 2026-11-14). When the school publishes
-- its fee schedule online, change source_url to that address.
-- Left out on purpose:
--   average IB scores (38.9 / 39) and "top 20" rankings: they describe Eastwood Global, the online school, not this
--   school, which opens in September 2026 and has no results yet;
--   student-to-teacher ratio: the documents disagree (10:1 in the brochure, 12:1 in the About sheet);
--   student testimonials (individual students).
-- No news feed: the school's website has no news section.
-- First school outside Asia: scope widened by the operator on 2026-11-14 (docs/decisions.md).
-- is_client = 1: the school is a client of the operator (operator, 2026-11-14). The site shows its standard
-- "Client of the site's operator" label and nothing more about the relationship.
INSERT INTO schools (slug, name, city, city_slug, country, website, news_feed, ispp_school_id, is_client) VALUES
  ('eastwood-montreux', 'Eastwood Montreux', 'Montreux', 'montreux', 'Switzerland',
   'https://www.eastwoodmontreux.ch', NULL, NULL, 1)
ON CONFLICT (slug) DO UPDATE SET website = excluded.website, news_feed = excluded.news_feed, ispp_school_id = excluded.ispp_school_id,
  is_client = excluded.is_client;

-- Names the school uses: Eastwood Global (its online academic provider), the castle campus and its programme.
INSERT OR IGNORE INTO entities (school_slug, name, source_url) VALUES
  ('eastwood-montreux', 'Eastwood', 'https://www.eastwoodmontreux.ch'),
  ('eastwood-montreux', 'Eastwood Global', 'https://www.eastwoodmontreux.ch'),
  ('eastwood-montreux', 'Château d''Arvel', 'https://www.eastwoodmontreux.ch/residency'),
  ('eastwood-montreux', 'IMPACT', 'https://www.eastwoodmontreux.ch'),
  ('eastwood-montreux', 'Lac Léman', 'https://www.eastwoodmontreux.ch'),
  ('eastwood-montreux', 'Lake Geneva', 'https://www.eastwoodmontreux.ch');

-- source_kind 'manual': entered by the operator. Tuition rows: the unit's last part is the age span the school
-- states ("middle school through graduation"), which the profile shows as its year-group range.
INSERT OR IGNORE INTO facts (school_slug, key, value, unit, as_of, source_url, source_kind) VALUES
  ('eastwood-montreux', 'annual_tuition_full_boarding', '99,000', 'CHF per year, 2026, full boarding (tuition, accommodation, meals and pastoral care; from the 2026 Tuition Overview, a document the school provided directly), middle school through graduation', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'annual_tuition_5_day_boarding', '75,000', 'CHF per year, 2026, 5-day boarding (from the 2026 Tuition Overview, a document the school provided directly), middle school through graduation', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'annual_tuition_day_students', '45,000', 'CHF per year, 2026, day students (from the 2026 Tuition Overview, a document the school provided directly), middle school through graduation', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'founding_family_rate_full_boarding', '92,000', 'CHF per year, 2026, founding family rate for full boarding (from the 2026 Tuition Overview, a document the school provided directly)', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'founding_family_rate_5_day_boarding', '70,000', 'CHF per year, 2026, founding family rate for 5-day boarding (from the 2026 Tuition Overview, a document the school provided directly)', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'founding_family_rate_day_students', '42,000', 'CHF per year, 2026, founding family rate for day students (from the 2026 Tuition Overview, a document the school provided directly)', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'founding_family_benefits', 'preferential tuition rates; lifetime membership of the Eastwood Founders'' Circle; invitations to Eastwood events in Montreux and abroad', 'for the first generation of Eastwood families (from the 2026 Tuition Overview, a document the school provided directly)', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'tuition_includes', 'full academic program (IB or American Diploma via Eastwood Global); IMPACT afternoons and mentoring across all six strands; leadership, outdoor and cultural programs; accommodation (for boarding students), meals and pastoral care; access to the Eastwood Passport, IMPACT Profile and Legacy Project network', '2026 (from the 2026 Tuition Overview, a document the school provided directly)', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'tuition_not_included', 'pocket money, travel, uniform, and specialist expeditions or external exam costs', '2026 (from the 2026 Tuition Overview, a document the school provided directly)', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'one_time_fee_application', '500', 'CHF, 2026, application fee for new students, due upon application (from the 2026 Tuition Overview, a document the school provided directly)', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'one_time_fee_security_deposit', '5,000', 'CHF, 2026, security deposit for new students to hold a place, due within 10 days of acceptance; refunded within 3 months of the end of the student''s time at Eastwood Montreux; non-refundable if enrollment is cancelled (from the 2026 Tuition Overview, a document the school provided directly)', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'one_time_fee_capital_improvement_fund', '5,000', 'CHF, 2026, capital improvement fund paid by new students to maintain and improve campus facilities, due within 30 days of acceptance (from the 2026 Tuition Overview, a document the school provided directly)', '2026', 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'opening_date', 'September 2026', 'school opening (About sheet, a document the school provided directly)', NULL, 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'school_type', 'boarding and day school, middle school through graduation', 'About sheet, a document the school provided directly', NULL, 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'campus', 'the historic Château d''Arvel, a fully renovated castle set above Lac Léman, with over 3,000m2 of space, boarding accommodation and sports facilities', 'About sheet, a document the school provided directly', NULL, 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'location', 'Avenue de Chillon 57, 1820 Montreux, Switzerland; 1 hour from Geneva Airport', 'About sheet, a document the school provided directly', NULL, 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'programme_qualifications', 'IB Diploma, American High School Diploma, and Cambridge IGCSE', 'qualifications named under Knowledge (About sheet, a document the school provided directly)', NULL, 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'programme_academic_delivery', 'academics delivered through Eastwood Global Plus, the online school Eastwood Global, which the brochure describes as one of 7 authorized online IB schools in the world, with onsite faculty giving additional face-to-face academic support in Montreux', 'brochure, a document the school provided directly', NULL, 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'ib_status', 'Eastwood Montreux International School is a candidate school for the Diploma Programme of the International Baccalaureate and is pursuing authorization as an IB World School; candidate status gives no guarantee that authorization will be granted', 'statement on the school website', NULL, 'https://www.eastwoodmontreux.ch/emfounders', 'manual'),
  ('eastwood-montreux', 'programme_daily_model', 'mornings are dedicated to academics with a flipped classroom approach; afternoons belong to IMPACT, a mentor-led program of real projects in six strands: Imagination, Movement, Planet, Action, Character and Technologies', 'About sheet, a document the school provided directly', NULL, 'https://www.eastwoodmontreux.ch', 'manual'),
  ('eastwood-montreux', 'short_residential_programs', '1–2 week residential intensives for ages 12–18 with full board in a lakeside château; the page says three programs are offered and describes Resilience & Courage (ages 12–18) and Design Your Life (ages 16–18)', 'holiday programs on the school website', NULL, 'https://www.eastwoodmontreux.ch/emprograms', 'manual');
