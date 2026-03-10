-- vendor management tables (ops database)
CREATE TABLE IF NOT EXISTS vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(100),
  contact_email VARCHAR(200),
  contact_phone VARCHAR(50),
  payment_terms VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  sku_code VARCHAR(100),
  unit VARCHAR(50) NOT NULL COMMENT 'e.g. 箱, kg, 瓶',
  unit_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'GBP',
  shelf_life_days INT,
  lead_time_days INT,
  is_active BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE TABLE IF NOT EXISTS vendor_order_forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  original_filename VARCHAR(300) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  status ENUM('pending','parsed','reviewed','error') DEFAULT 'pending',
  parsed_data JSON,
  review_notes TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);
