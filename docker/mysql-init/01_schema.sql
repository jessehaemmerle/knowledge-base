CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  password_hash CHAR(64) NOT NULL,
  password_salt CHAR(32) NOT NULL,
  password_iterations INT UNSIGNED NOT NULL DEFAULT 200000,
  role ENUM('admin','editor','viewer') NOT NULL DEFAULT 'editor',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS areas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS pages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  area_id INT UNSIGNED NULL,
  parent_id INT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  content LONGTEXT NOT NULL,
  summary TEXT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  is_public TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT UNSIGNED NOT NULL,
  updated_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pages_area FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
  CONSTRAINT fk_pages_parent FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE SET NULL,
  CONSTRAINT fk_pages_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_pages_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_pages_area_status (area_id, status),
  INDEX idx_pages_title (title)
);

CREATE TABLE IF NOT EXISTS page_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_id INT UNSIGNED NOT NULL,
  version_number INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  content LONGTEXT NOT NULL,
  summary TEXT NULL,
  status ENUM('draft','published','archived') NOT NULL,
  edited_by INT UNSIGNED NOT NULL,
  note VARCHAR(255) NULL,
  edited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_page_versions_number (page_id, version_number),
  CONSTRAINT fk_versions_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  CONSTRAINT fk_versions_user FOREIGN KEY (edited_by) REFERENCES users(id),
  INDEX idx_versions_page_date (page_id, edited_at)
);

CREATE TABLE IF NOT EXISTS user_page_favorites (
  user_id INT UNSIGNED NOT NULL,
  page_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, page_id),
  CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fav_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  INDEX idx_fav_created (created_at)
);
