CREATE TABLE IF NOT EXISTS holiday_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  region VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_workday_adjusted TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_holiday_region_date (region, date)
);

CREATE TABLE IF NOT EXISTS store_weather (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id INT NOT NULL,
  forecast_date DATE NOT NULL,
  temp_max FLOAT NULL,
  temp_min FLOAT NULL,
  precip_prob FLOAT NULL,
  `condition` VARCHAR(255) NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_weather_store_date (store_id, forecast_date)
);

CREATE TABLE IF NOT EXISTS store_university_terms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id INT NOT NULL,
  university VARCHAR(255) NOT NULL,
  term_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);
