-- AI Forecast tables (ops database)

-- 预测任务记录
CREATE TABLE IF NOT EXISTS ai_forecast_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id INT,
  forecast_type ENUM('staffing','sales_7d','sales_30d','inventory') NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  status ENUM('pending','done','error') DEFAULT 'pending',
  result_data JSON COMMENT '预测结果 JSON',
  error_message TEXT
);

-- 排班草稿（AI生成，店长确认后正式）
CREATE TABLE IF NOT EXISTS ops_schedule_draft (
  id INT AUTO_INCREMENT PRIMARY KEY,
  forecast_run_id INT,
  store_id INT NOT NULL,
  staff_id INT NOT NULL COMMENT 'ops_staff.id',
  shift_date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  role VARCHAR(100),
  status ENUM('suggested','confirmed','rejected') DEFAULT 'suggested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 采购建议草稿
CREATE TABLE IF NOT EXISTS purchase_order_drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  forecast_run_id INT,
  store_id INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  sku_code VARCHAR(100),
  suggested_qty DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50),
  current_stock DECIMAL(10,2),
  lead_time_days INT,
  status ENUM('suggested','confirmed','rejected') DEFAULT 'suggested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SKU 配置表（lead time + 安全库存）
CREATE TABLE IF NOT EXISTS sku_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id INT,
  sku_code VARCHAR(100),
  product_name VARCHAR(200),
  lead_time_days INT DEFAULT 3,
  safety_stock_days INT DEFAULT 2,
  avg_daily_usage DECIMAL(10,2) COMMENT '每日平均用量，可由系统自动更新'
);
