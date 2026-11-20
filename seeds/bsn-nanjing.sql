-- British School of Nanjing (Nanjing, China), a Nord Anglia Education school: school row, short names and facts.
-- Sources: the school's own pages, read on 2026-11-20 (operator request 2026-11-20: fees and school pages before
-- production): /bsn-nanjing/admissions/tuition-fees (2026-27 fees are an HTML table on that page; there is no fee
-- PDF), /bsn-nanjing/about-us and the five /bsn-nanjing/academic-excellence/ pages.
-- Notes on the fee table:
--   - the school's annual totals differ from the sum of its three term fees by 1 RMB in seven of the eight rows
--     (rounding); both figures are recorded exactly as published, and nothing is computed from them;
--   - bus Tier 3: its published annual fee (18,116) does not match its term fees (7,274 + 5,435 + 5,435 = 18,144);
--     all four figures are recorded as published (leaving the tier out made the writer say the school lists two
--     tiers, which is false). Ask the school which figure is right before relying on it;
--   - the unit says "Total Fees column", the school's own heading: the totals are not the sum of the term fees;
--   - the age column gives the age on 31 August of the first year group in each row.
-- Left out on purpose: "the longest running British school in the region", "award-winning", "the world's best
--   teachers" and similar claims; exam results compared with the UK average (no figures); one student's individual
--   result; parent, staff and student testimonials (individual people).
-- The news index uses English month names in its links (/news/2026/november/9/...), read by parseNewsIndex.
-- ispp_school_id is NULL until the school's myispp id is checked.
-- is_client = 0: not a client of the operator (operator, 2026-11-19). Name confirmed by the operator 2026-11-19.
INSERT INTO schools (slug, name, city, city_slug, country, website, news_feed, ispp_school_id, is_client) VALUES
  ('bsn-nanjing', 'British School of Nanjing', 'Nanjing', 'nanjing', 'China',
   'https://www.nordangliaeducation.com/bsn-nanjing',
   'https://www.nordangliaeducation.com/bsn-nanjing/news-search?pageNum=1&type=news',
   NULL, 0)
ON CONFLICT (slug) DO UPDATE SET website = excluded.website, news_feed = excluded.news_feed, ispp_school_id = excluded.ispp_school_id,
  is_client = excluded.is_client;

-- Names the school's pages use: its short name, the group, the mountain beside the campus, the district, the award body.
INSERT OR IGNORE INTO entities (school_slug, name, source_url) VALUES
  ('bsn-nanjing', 'BSN', 'https://www.nordangliaeducation.com/bsn-nanjing'),
  ('bsn-nanjing', 'Nord Anglia Education', 'https://www.nordangliaeducation.com/bsn-nanjing/about-us'),
  ('bsn-nanjing', 'Cuiping Mountain', 'https://www.nordangliaeducation.com/bsn-nanjing/about-us'),
  ('bsn-nanjing', 'Jiangning', 'https://www.nordangliaeducation.com/bsn-nanjing/about-us'),
  ('bsn-nanjing', 'Han Fu Lu', 'https://www.nordangliaeducation.com/bsn-nanjing/about-us'),
  ('bsn-nanjing', 'Matthew Shephard', 'https://www.nordangliaeducation.com/bsn-nanjing/about-us'),
  ('bsn-nanjing', 'Pearson', 'https://www.nordangliaeducation.com/bsn-nanjing/academic-excellence/a-levels'),
  ('bsn-nanjing', 'Pioneer of the Year Award', 'https://www.nordangliaeducation.com/bsn-nanjing/academic-excellence/a-levels'),
  ('bsn-nanjing', 'Bank of China', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees');

-- source_kind 'manual': entered by the operator, not by the news pipeline or the myispp import.
INSERT OR IGNORE INTO facts (school_slug, key, value, unit, as_of, source_url, source_kind) VALUES
  ('bsn-nanjing', 'annual_tuition_pre_nursery_half_day', '121,919', 'RMB per year, the school''s Total Fees column, 2026-27, Pre-Nursery (half day), age 2 on 31 August', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_paid_annually_pre_nursery_half_day', '118,262', 'RMB per year when paid as one annual payment, 2026-27, Pre-Nursery (half day)', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_1_tuition_pre_nursery_half_day', '48,768', 'RMB, Term 1, 2026-27, Pre-Nursery (half day)', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_2_tuition_pre_nursery_half_day', '36,576', 'RMB, Term 2, 2026-27, Pre-Nursery (half day)', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_3_tuition_pre_nursery_half_day', '36,576', 'RMB, Term 3, 2026-27, Pre-Nursery (half day)', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_pre_nursery_full_day', '221,671', 'RMB per year, the school''s Total Fees column, 2026-27, Pre-Nursery (full day), age 2 on 31 August', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_paid_annually_pre_nursery_full_day', '215,020', 'RMB per year when paid as one annual payment, 2026-27, Pre-Nursery (full day)', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_1_tuition_pre_nursery_full_day', '88,668', 'RMB, Term 1, 2026-27, Pre-Nursery (full day)', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_2_tuition_pre_nursery_full_day', '66,501', 'RMB, Term 2, 2026-27, Pre-Nursery (full day)', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_3_tuition_pre_nursery_full_day', '66,501', 'RMB, Term 3, 2026-27, Pre-Nursery (full day)', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_nursery', '221,671', 'RMB per year, the school''s Total Fees column, 2026-27, Nursery, age 3 on 31 August', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_paid_annually_nursery', '215,020', 'RMB per year when paid as one annual payment, 2026-27, Nursery', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_1_tuition_nursery', '88,668', 'RMB, Term 1, 2026-27, Nursery', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_2_tuition_nursery', '66,501', 'RMB, Term 2, 2026-27, Nursery', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_3_tuition_nursery', '66,501', 'RMB, Term 3, 2026-27, Nursery', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_reception', '221,671', 'RMB per year, the school''s Total Fees column, 2026-27, Reception, age 4 on 31 August', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_paid_annually_reception', '215,020', 'RMB per year when paid as one annual payment, 2026-27, Reception', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_1_tuition_reception', '88,668', 'RMB, Term 1, 2026-27, Reception', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_2_tuition_reception', '66,501', 'RMB, Term 2, 2026-27, Reception', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_3_tuition_reception', '66,501', 'RMB, Term 3, 2026-27, Reception', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_year_1_3', '262,825', 'RMB per year, the school''s Total Fees column, 2026-27, Year 1-3, age 5 on 31 August', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_paid_annually_year_1_3', '254,940', 'RMB per year when paid as one annual payment, 2026-27, Year 1-3', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_1_tuition_year_1_3', '105,130', 'RMB, Term 1, 2026-27, Year 1-3', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_2_tuition_year_1_3', '78,848', 'RMB, Term 2, 2026-27, Year 1-3', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_3_tuition_year_1_3', '78,848', 'RMB, Term 3, 2026-27, Year 1-3', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_year_4_6', '273,338', 'RMB per year, the school''s Total Fees column, 2026-27, Year 4-6, age 8 on 31 August', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_paid_annually_year_4_6', '265,138', 'RMB per year when paid as one annual payment, 2026-27, Year 4-6', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_1_tuition_year_4_6', '109,335', 'RMB, Term 1, 2026-27, Year 4-6', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_2_tuition_year_4_6', '82,001', 'RMB, Term 2, 2026-27, Year 4-6', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_3_tuition_year_4_6', '82,001', 'RMB, Term 3, 2026-27, Year 4-6', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_year_7_10', '279,255', 'RMB per year, the school''s Total Fees column, 2026-27, Year 7-10, age 11 on 31 August', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_paid_annually_year_7_10', '270,878', 'RMB per year when paid as one annual payment, 2026-27, Year 7-10', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_1_tuition_year_7_10', '111,702', 'RMB, Term 1, 2026-27, Year 7-10', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_2_tuition_year_7_10', '83,777', 'RMB, Term 2, 2026-27, Year 7-10', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_3_tuition_year_7_10', '83,777', 'RMB, Term 3, 2026-27, Year 7-10', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_year_11_13', '286,640', 'RMB per year, the school''s Total Fees column, 2026-27, Year 11-13, age 15 on 31 August', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'annual_tuition_paid_annually_year_11_13', '278,040', 'RMB per year when paid as one annual payment, 2026-27, Year 11-13', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_1_tuition_year_11_13', '114,656', 'RMB, Term 1, 2026-27, Year 11-13', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_2_tuition_year_11_13', '85,992', 'RMB, Term 2, 2026-27, Year 11-13', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'term_3_tuition_year_11_13', '85,992', 'RMB, Term 3, 2026-27, Year 11-13', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'fee_currency', 'RMB; tuition can also be paid in USD, GBP or EUR at the prevailing Bank of China exchange rate', NULL, '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'one_time_fee_application', '2,500', 'RMB, non-refundable, payable upon applying to the school', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'refundable_deposit', '12,000', 'RMB, payable to secure a school place once a formal offer has been made; refundable, terms and conditions apply', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'one_time_fee_enrolment', '10,000', 'RMB, one-time, non-refundable, required upon enrolment confirmation', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'one_time_fee_eal', '18,000', 'RMB, one-time, non-refundable English as an Additional Language (EAL) charge, covering support for students who enrol without the appropriate grade-level English proficiency, for as long as needed', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'school_lunch', 'School lunches are complimentary for all full day enrolled students', NULL, '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'uniform_price_range', 'RMB 40 to RMB 400', 'per school uniform item at the school shop; a separate P.E. kit is also required', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_service', 'Arranged on request and at the school''s discretion; fees are based on the distance travelled from school; the school lists three bus tiers (Tier 1, Tier 2, Tier 3)', NULL, '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_1_annual', '13,255', 'RMB per year, bus Tier 1, 2026-27', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_1_term_1', '5,302', 'RMB, Term 1, bus Tier 1, 2026-27', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_1_term_2', '3,977', 'RMB, Term 2, bus Tier 1, 2026-27', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_1_term_3', '3,977', 'RMB, Term 3, bus Tier 1, 2026-27', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_2_annual', '15,686', 'RMB per year, bus Tier 2, 2026-27', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_2_term_1', '6,274', 'RMB, Term 1, bus Tier 2, 2026-27', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_2_term_2', '4,706', 'RMB, Term 2, bus Tier 2, 2026-27', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_2_term_3', '4,706', 'RMB, Term 3, bus Tier 2, 2026-27', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_3_annual', '18,116', 'RMB, per year, bus Tier 3, 2026-27, as published', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_3_term_1', '7,274', 'RMB, Term 1, bus Tier 3, 2026-27, as published', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_3_term_2', '5,435', 'RMB, Term 2, bus Tier 3, 2026-27, as published', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'bus_fee_tier_3_term_3', '5,435', 'RMB, Term 3, bus Tier 3, 2026-27, as published', '2026-27', 'https://www.nordangliaeducation.com/bsn-nanjing/admissions/tuition-fees', 'manual'),
  ('bsn-nanjing', 'affiliation', 'Part of the Nord Anglia Education family', NULL, NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/about-us', 'manual'),
  ('bsn-nanjing', 'founded', '2007', 'year the school was founded', NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/about-us', 'manual'),
  ('bsn-nanjing', 'students', 'more than 450', 'students', NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/about-us', 'manual'),
  ('bsn-nanjing', 'student_nationalities', 'over 30', 'countries the students come from', NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/about-us', 'manual'),
  ('bsn-nanjing', 'address', '16 Han Fu Lu, Jiangning, Nanjing, 211106', NULL, NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/about-us', 'manual'),
  ('bsn-nanjing', 'campus_location', 'The campus is a stone''s throw from Cuiping Mountain', NULL, NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/about-us', 'manual'),
  ('bsn-nanjing', 'principal', 'Matthew Shephard', 'Principal', NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/about-us', 'manual'),
  ('bsn-nanjing', 'programme_early_years', 'Pre-Nursery, Nursery and Reception children follow the British Early Years Foundation Stage (EYFS) curriculum', 'ages 2 to 5', NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/academic-excellence/early-years', 'manual'),
  ('bsn-nanjing', 'programme_primary', 'Students follow the English National Curriculum; English, science and maths are the fundamental components', 'ages 5 to 10', NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/academic-excellence/primary', 'manual'),
  ('bsn-nanjing', 'programme_primary_languages', 'Students are supported to learn German, Spanish or Mandarin', NULL, NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/academic-excellence/primary', 'manual'),
  ('bsn-nanjing', 'programme_lower_secondary', 'Key Stage 3: a tailored version of the English National Curriculum; students study English, maths, science, geography, history, drama, music, art, computing, modern foreign languages, Mandarin and PE', 'ages 10 to 14', NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/academic-excellence/lower-secondary', 'manual'),
  ('bsn-nanjing', 'programme_igcse', 'Key Stage 4: students aged 14 to 16 study for IGCSE exams; all study English language, English literature, maths and science, and typically study eight IGCSE subjects in total', NULL, NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/academic-excellence/upper-secondary', 'manual'),
  ('bsn-nanjing', 'programme_a_levels', 'In Years 12 and 13 (Sixth Form, ages 16 to 18) students typically study three or four A-levels over a two-year programme', NULL, NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/academic-excellence/upper-secondary', 'manual'),
  ('bsn-nanjing', 'a_level_award', 'The A-level programme won Pearson''s Pioneer of the Year Award in 2021', NULL, NULL, 'https://www.nordangliaeducation.com/bsn-nanjing/academic-excellence/a-levels', 'manual');
