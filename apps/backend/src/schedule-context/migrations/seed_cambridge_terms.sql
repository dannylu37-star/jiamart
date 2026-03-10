-- 剑桥大学及 Anglia Ruskin 大学 2025-26 学年假期（Burleigh St store_id=1）
-- 来源：University of Cambridge 官网 / ARU 官网

INSERT IGNORE INTO store_university_terms (store_id, university, term_name, start_date, end_date) VALUES
-- University of Cambridge
(1, 'University of Cambridge', 'Christmas Vacation',   '2025-12-07', '2026-01-14'),
(1, 'University of Cambridge', 'Easter Vacation',      '2026-03-21', '2026-04-24'),
(1, 'University of Cambridge', 'Summer Vacation',      '2026-06-19', '2026-10-06'),
(1, 'University of Cambridge', 'Lent Term',            '2026-01-15', '2026-03-20'),
(1, 'University of Cambridge', 'Easter Term',          '2026-04-25', '2026-06-18'),

-- Anglia Ruskin University (ARU, Cambridge Campus)
(1, 'Anglia Ruskin University', 'Christmas Vacation',  '2025-12-20', '2026-01-05'),
(1, 'Anglia Ruskin University', 'Easter Vacation',     '2026-04-03', '2026-04-14'),
(1, 'Anglia Ruskin University', 'Summer Break',        '2026-06-12', '2026-09-20'),

-- 学生返校高峰（采购需求增大）
(1, 'University of Cambridge', 'Fresher Week Michaelmas 2026', '2026-10-07', '2026-10-09'),
(1, 'Anglia Ruskin University', 'Fresher Week 2026',           '2026-09-21', '2026-09-25');
