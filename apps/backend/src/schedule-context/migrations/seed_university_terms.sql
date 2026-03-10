-- 英国主要大学 2025-2026 学年假期种子数据
-- store_id 对应各门店，university 字段可按门店调整
-- 参考：UCL / King's College London / Manchester / Birmingham / Edinburgh

INSERT IGNORE INTO store_university_terms (store_id, university, term_name, start_date, end_date) VALUES

-- London 门店 (store_id=1) - UCL & King's College 假期（学生多在 London）
(1, 'UCL', 'Christmas Vacation',        '2025-12-19', '2026-01-11'),
(1, 'UCL', 'Easter Vacation',           '2026-03-27', '2026-04-19'),
(1, 'UCL', 'Summer Vacation',           '2026-06-12', '2026-09-27'),
(1, "King's College London", 'Christmas Vacation', '2025-12-20', '2026-01-04'),
(1, "King's College London", 'Easter Vacation',    '2026-03-28', '2026-04-12'),
(1, "King's College London", 'Summer Vacation',    '2026-06-15', '2026-09-20'),

-- Manchester 门店 (store_id=2)
(2, 'University of Manchester', 'Christmas Vacation', '2025-12-22', '2026-01-11'),
(2, 'University of Manchester', 'Easter Vacation',    '2026-03-30', '2026-04-19'),
(2, 'University of Manchester', 'Summer Vacation',    '2026-06-08', '2026-09-14'),
(2, 'Manchester Metropolitan University', 'Christmas Vacation', '2025-12-20', '2026-01-04'),
(2, 'Manchester Metropolitan University', 'Easter Vacation',    '2026-03-28', '2026-04-12'),
(2, 'Manchester Metropolitan University', 'Summer Vacation',    '2026-06-12', '2026-09-20'),

-- Birmingham 门店 (store_id=3)
(3, 'University of Birmingham', 'Christmas Vacation', '2025-12-20', '2026-01-11'),
(3, 'University of Birmingham', 'Easter Vacation',    '2026-04-03', '2026-04-19'),
(3, 'University of Birmingham', 'Summer Vacation',    '2026-06-12', '2026-09-27'),
(3, 'Aston University', 'Christmas Vacation',         '2025-12-22', '2026-01-04'),
(3, 'Aston University', 'Easter Vacation',            '2026-04-03', '2026-04-14'),
(3, 'Aston University', 'Summer Vacation',            '2026-06-05', '2026-09-14'),

-- Edinburgh 门店 (store_id=4)
(4, 'University of Edinburgh', 'Christmas Vacation', '2025-12-20', '2026-01-11'),
(4, 'University of Edinburgh', 'Easter Vacation',    '2026-03-28', '2026-04-14'),
(4, 'University of Edinburgh', 'Summer Vacation',    '2026-05-29', '2026-09-14'),

-- 通用 (store_id=NULL，所有门店可见)
(NULL, 'General UK Universities', 'Freshers Week Autumn 2026', '2026-09-21', '2026-09-27');
