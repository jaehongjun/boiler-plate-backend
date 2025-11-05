-- Add more participants to IR activities for richer display

-- First, let's get some activity IDs (you may need to adjust these based on your actual data)
-- Run this query first to see your activity IDs:
-- SELECT id, title FROM ir_activities LIMIT 10;

-- Add more KB participants (면담자)
-- Assuming you have users with these IDs (adjust based on your actual user IDs)
INSERT INTO ir_activity_kb_participants (activity_id, user_id, role, created_at)
SELECT
  a.id,
  u.id,
  CASE
    WHEN random() < 0.5 THEN 'IR Manager'
    ELSE 'IR Coordinator'
  END,
  NOW()
FROM ir_activities a
CROSS JOIN (
  SELECT id FROM users ORDER BY RANDOM() LIMIT 3
) u
WHERE NOT EXISTS (
  SELECT 1 FROM ir_activity_kb_participants
  WHERE activity_id = a.id AND user_id = u.id
)
LIMIT 50;

-- Add more investors (투자자)
INSERT INTO ir_activity_visitors (activity_id, visitor_name, visitor_type, company, created_at)
SELECT
  id,
  CASE (random() * 10)::int
    WHEN 0 THEN 'BlackRock Investment'
    WHEN 1 THEN 'Fidelity Investments'
    WHEN 2 THEN 'Vanguard Group'
    WHEN 3 THEN 'State Street Global'
    WHEN 4 THEN 'Capital Group'
    WHEN 5 THEN 'JP Morgan Asset Management'
    WHEN 6 THEN 'Goldman Sachs Asset Management'
    WHEN 7 THEN 'Morgan Stanley Investment'
    WHEN 8 THEN 'UBS Asset Management'
    ELSE 'Credit Suisse Asset Management'
  END,
  'investor',
  CASE (random() * 10)::int
    WHEN 0 THEN 'BlackRock Inc.'
    WHEN 1 THEN 'Fidelity Investments Inc.'
    WHEN 2 THEN 'The Vanguard Group'
    WHEN 3 THEN 'State Street Corporation'
    WHEN 4 THEN 'Capital Group Companies'
    WHEN 5 THEN 'JPMorgan Chase & Co.'
    WHEN 6 THEN 'Goldman Sachs Group Inc.'
    WHEN 7 THEN 'Morgan Stanley'
    WHEN 8 THEN 'UBS Group AG'
    ELSE 'Credit Suisse Group AG'
  END,
  NOW()
FROM ir_activities
WHERE category = '외부'
  AND (random() * 10)::int < 7
LIMIT 30;

-- Add more brokers (브로커)
INSERT INTO ir_activity_visitors (activity_id, visitor_name, visitor_type, company, created_at)
SELECT
  id,
  CASE (random() * 8)::int
    WHEN 0 THEN 'John Smith'
    WHEN 1 THEN 'Sarah Johnson'
    WHEN 2 THEN 'Michael Chen'
    WHEN 3 THEN 'Emily Williams'
    WHEN 4 THEN 'David Park'
    WHEN 5 THEN 'Jennifer Lee'
    WHEN 6 THEN 'Robert Kim'
    ELSE 'Lisa Anderson'
  END,
  'broker',
  CASE (random() * 5)::int
    WHEN 0 THEN 'Morgan Stanley'
    WHEN 1 THEN 'Goldman Sachs'
    WHEN 2 THEN 'JP Morgan'
    WHEN 3 THEN 'Citigroup'
    ELSE 'Bank of America Securities'
  END,
  NOW()
FROM ir_activities
WHERE category = '외부'
  AND (random() * 10)::int < 6
LIMIT 25;

-- Add participants to sub-activities as well
-- Add KB participants to sub-activities
INSERT INTO ir_sub_activity_kb_participants (sub_activity_id, user_id, role, created_at)
SELECT
  s.id,
  u.id,
  'IR Staff',
  NOW()
FROM ir_sub_activities s
CROSS JOIN (
  SELECT id FROM users ORDER BY RANDOM() LIMIT 2
) u
WHERE NOT EXISTS (
  SELECT 1 FROM ir_sub_activity_kb_participants
  WHERE sub_activity_id = s.id AND user_id = u.id
)
LIMIT 30;

-- Add investors to sub-activities
INSERT INTO ir_sub_activity_visitors (sub_activity_id, visitor_name, visitor_type, company, created_at)
SELECT
  id,
  CASE (random() * 6)::int
    WHEN 0 THEN 'T. Rowe Price Associates'
    WHEN 1 THEN 'Wellington Management'
    WHEN 2 THEN 'Invesco Ltd.'
    WHEN 3 THEN 'Allianz Global Investors'
    WHEN 4 THEN 'Northern Trust Asset Management'
    ELSE 'BNY Mellon Investment Management'
  END,
  'investor',
  CASE (random() * 6)::int
    WHEN 0 THEN 'T. Rowe Price Group'
    WHEN 1 THEN 'Wellington Management Company'
    WHEN 2 THEN 'Invesco Ltd.'
    WHEN 3 THEN 'Allianz SE'
    WHEN 4 THEN 'Northern Trust Corporation'
    ELSE 'The Bank of New York Mellon Corporation'
  END,
  NOW()
FROM ir_sub_activities
WHERE (random() * 10)::int < 6
LIMIT 20;

-- Add brokers to sub-activities
INSERT INTO ir_sub_activity_visitors (sub_activity_id, visitor_name, visitor_type, company, created_at)
SELECT
  id,
  CASE (random() * 6)::int
    WHEN 0 THEN 'Tom Harris'
    WHEN 1 THEN 'Jessica Brown'
    WHEN 2 THEN 'Daniel Martinez'
    WHEN 3 THEN 'Amanda Taylor'
    WHEN 4 THEN 'Chris Wilson'
    ELSE 'Michelle Davis'
  END,
  'broker',
  CASE (random() * 4)::int
    WHEN 0 THEN 'Deutsche Bank'
    WHEN 1 THEN 'Barclays'
    WHEN 2 THEN 'Credit Suisse'
    ELSE 'UBS Investment Bank'
  END,
  NOW()
FROM ir_sub_activities
WHERE (random() * 10)::int < 5
LIMIT 15;

-- Verify the results
SELECT
  'Activity Participants' as type,
  COUNT(*) as count
FROM ir_activity_kb_participants
UNION ALL
SELECT
  'Activity Visitors (Investors)',
  COUNT(*)
FROM ir_activity_visitors
WHERE visitor_type = 'investor'
UNION ALL
SELECT
  'Activity Visitors (Brokers)',
  COUNT(*)
FROM ir_activity_visitors
WHERE visitor_type = 'broker'
UNION ALL
SELECT
  'Sub-Activity Participants',
  COUNT(*)
FROM ir_sub_activity_kb_participants
UNION ALL
SELECT
  'Sub-Activity Visitors (Investors)',
  COUNT(*)
FROM ir_sub_activity_visitors
WHERE visitor_type = 'investor'
UNION ALL
SELECT
  'Sub-Activity Visitors (Brokers)',
  COUNT(*)
FROM ir_sub_activity_visitors
WHERE visitor_type = 'broker';
