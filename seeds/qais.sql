-- Qingdao Amerasia International School (QAIS): school row, short names and facts from the school's own site.
-- Fees are read from the school's Tuition & Fees PDF (linked as "Tuition & Fees" in the site menu,
-- https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf, "EFFECTIVE: 1 AUGUST 2025", checked 2026-11-14).
-- The PDF prints amounts in ¥; the school is in China and pays into a Bank of China account, so RMB.
-- Bank details in the PDF are left out.
-- Programmes and accreditations are read from https://www.qingdaoamerasia.org/academics/ and /about/ (checked 2026-11-14).
-- news_feed is NULL: the school's news posts carry no publication date anywhere (page, sitemap, markup),
-- so an article could present an old event as recent. Operator decision 2026-11-14: fees and guides only.
-- myispp has a verified record, but with no fee data (its range is marked as an estimate), so src/ispp.ts skips it.
-- is_client = 0: not a client of the operator (confirmed by the operator 2026-11-14).
INSERT INTO schools (slug, name, city, city_slug, country, website, news_feed, ispp_school_id, is_client) VALUES
  ('qais', 'Qingdao Amerasia International School', 'Qingdao', 'qingdao', 'China',
   'https://www.qingdaoamerasia.org', NULL,
   'partner-china-qingdao-amerasia-international-school', 0)
ON CONFLICT (slug) DO UPDATE SET website = excluded.website, news_feed = excluded.news_feed, ispp_school_id = excluded.ispp_school_id,
  is_client = excluded.is_client;

-- "QAIS" and "Amerasia" are the names the school uses for itself throughout its site.
INSERT OR IGNORE INTO entities (school_slug, name, source_url) VALUES
  ('qais', 'QAIS', 'https://www.qingdaoamerasia.org'),
  ('qais', 'Amerasia', 'https://www.qingdaoamerasia.org');

-- source_kind 'manual': entered by the operator, not by the news pipeline or the myispp import.
-- Tuition rows are youngest first: the profile's year-group range runs from the first to the last label.
INSERT OR IGNORE INTO facts (school_slug, key, value, unit, as_of, source_url, source_kind) VALUES
  ('qais', 'annual_tuition_montessori_toddler', '150,000', 'RMB per year, effective 1 August 2025, Montessori Toddler', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'annual_tuition_early_childhood', '160,000', 'RMB per year, effective 1 August 2025, Early Childhood (Montessori / IB PYP)', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'annual_tuition_grades_1_2', '214,000', 'RMB per year, effective 1 August 2025, Grades 1-2 (Montessori / IB PYP)', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'annual_tuition_grades_3_5', '214,000', 'RMB per year, effective 1 August 2025, Grades 3-5 (IB PYP)', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'annual_tuition_grades_6_10', '231,000', 'RMB per year, effective 1 August 2025, Grades 6-10 (IB MYP)', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'annual_tuition_grades_11_12', '239,000', 'RMB per year, effective 1 August 2025, Grades 11-12 (IB DP)', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'additional_fee_week_without_walls', '5,000 - 12,000', 'RMB per year, effective 1 August 2025, Week without Walls outdoor education trips (Grades 5-12); a standardized fee collected with the annual tuition invoice, based on the previous year''s trip cost; the difference is reimbursed or charged once the trip is finalized', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'one_time_fee_application', '3,000', 'RMB, effective 1 August 2025, application fee (non-refundable)', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'additional_fee_school_nutrition', '6,500', 'RMB per year, effective 1 August 2025, school nutrition (daily snack and lunch)', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'additional_fee_school_transportation', '8,500', 'RMB per year, effective 1 August 2025, school transportation (bus to and from school)', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'one_time_fee_deposit', '2,000', 'RMB, effective 1 August 2025, deposit (refundable upon graduation or withdrawal)', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'discount_early_payment', '2,000', 'RMB off tuition that families paying the full next year''s tuition before March 30 may receive, effective 1 August 2025', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'tuition_fee_lock_policy', 'Tuition fees are subject to increase annually; once a child is enrolled in a division, the annual tuition fee is locked for the duration of their time in that division, and moving to the next division (Toddler to Early Childhood, Early Childhood to Elementary, Elementary to MYP, MYP to DP) means paying the new tuition fee for that division', NULL, 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'late_fee_charge', '2', '% per month on tuition payments and balances not paid by the deadline, effective 1 August 2025', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'tuition_refund_full_year_before_sept_30', '75', '% maximum tuition refund on voluntary withdrawal before September 30, for families paying full-year tuition, effective 1 August 2025', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'tuition_refund_full_year_before_dec_16', '50', '% maximum tuition refund on voluntary withdrawal before December 16, for families paying full-year tuition, effective 1 August 2025', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'tuition_refund_full_year_before_feb_28', '25', '% maximum tuition refund on voluntary withdrawal before February 28 (no refund after February 28), for families paying full-year tuition, effective 1 August 2025', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'tuition_refund_half_year_before_sept_30', '50', '% maximum tuition refund on voluntary withdrawal before September 30, for families paying half-year tuition, effective 1 August 2025', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'tuition_refund_half_year_before_dec_16', 'no refund for semester 1', 'on voluntary withdrawal before December 16, for families paying half-year tuition, effective 1 August 2025', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'tuition_refund_half_year_before_feb_28', '50% of the amount paid for semester 2', 'maximum tuition refund on voluntary withdrawal before February 28 (no refund for semester 2 after February 28), for families paying half-year tuition, effective 1 August 2025', 'effective 1 August 2025', 'https://www.qingdaoamerasia.org/assets/cd449b79c37bb381.pdf', 'manual'),
  ('qais', 'programme_toddler', 'Montessori Infant & Toddler', 'Lower School programme, ages 1.5-3', NULL, 'https://www.qingdaoamerasia.org/academics/', 'manual'),
  ('qais', 'programme_early_childhood', 'Montessori and Early Childhood', 'Lower School programme, ages 3-6', NULL, 'https://www.qingdaoamerasia.org/academics/', 'manual'),
  ('qais', 'programme_grades_1_2', 'Montessori and IB PYP, Grades 1-2', 'Lower School programme, ages 6-8: the IB Primary Years Programme combined with the Montessori Lower Elementary curriculum', NULL, 'https://www.qingdaoamerasia.org/academics/', 'manual'),
  ('qais', 'programme_grades_3_5', 'IB PYP, Grades 3-5', 'Lower School programme, ages 8-11', NULL, 'https://www.qingdaoamerasia.org/academics/', 'manual'),
  ('qais', 'programme_grades_6_10', 'IB Middle Years Programme, Grades 6-10', 'Upper School programme, ages 11-16', NULL, 'https://www.qingdaoamerasia.org/academics/', 'manual'),
  ('qais', 'programme_grades_11_12', 'IB Diploma Programme, Grades 11-12', 'Upper School programme, ages 16-18; students choose 3 Higher Level and 3 Standard Level classes from 6 subject groups, plus the DP core (Theory of Knowledge, Extended Essay, Creativity, Activity, Service)', NULL, 'https://www.qingdaoamerasia.org/academics/', 'manual'),
  ('qais', 'ib_authorization', 'the first school in Shandong Province to be authorized for all three International Baccalaureate (IB) programs including PYP, MYP and DP', NULL, NULL, 'https://www.qingdaoamerasia.org/about/', 'manual'),
  ('qais', 'accreditation_ams', 'the first school in Asia to be accredited by the American Montessori Society (AMS) for its Toddler and Early Childhood Programs', 'accredited in 2014', '2014', 'https://www.qingdaoamerasia.org/about/', 'manual'),
  ('qais', 'accreditation_msa_cis', 'accredited by the Middle States Association (MSA) and the Council of International Schools (CIS)', NULL, NULL, 'https://www.qingdaoamerasia.org/about/', 'manual');
