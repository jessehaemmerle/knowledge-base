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

INSERT INTO users (username, display_name, password_hash, password_salt, password_iterations, role)
SELECT 'admin', 'Administrator',
'883971ad963d7868b1cc841d5611faa51a97267e900cccb9746015df54ff1fef',
'89702074e816fec6b9c85a16190a5bf2',
200000,
'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO areas (name, slug, description)
SELECT 'Allgemein', 'allgemein', 'Zentraler Bereich fuer Startinhalte'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE slug = 'allgemein');

INSERT INTO pages (area_id, parent_id, title, slug, content, summary, status, is_public, created_by, updated_by)
SELECT a.id, NULL, 'Willkommen im Wiki', 'willkommen-im-wiki',
'<h2>Willkommen</h2><p>Dies ist die Startseite des Wissensportals.</p><p>Logge dich ein und beginne mit dem Aufbau eurer Wissensdatenbank.</p>',
'Startseite des Wikis', 'published', 1, u.id, u.id
FROM areas a
JOIN users u ON u.username = 'admin'
WHERE a.slug = 'allgemein'
AND NOT EXISTS (SELECT 1 FROM pages WHERE slug = 'willkommen-im-wiki');

INSERT INTO page_versions (page_id, version_number, title, content, summary, status, edited_by, note)
SELECT p.id, 1, p.title, p.content, p.summary, p.status, u.id, 'Initiale Version'
FROM pages p
JOIN users u ON u.username = 'admin'
WHERE p.slug = 'willkommen-im-wiki'
AND NOT EXISTS (SELECT 1 FROM page_versions WHERE page_id = p.id AND version_number = 1);
