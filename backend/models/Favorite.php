<?php

require_once __DIR__ . '/../db.php';

class Favorite {
    private static function ensureTable(PDO $db): void {
        $db->exec(
            'CREATE TABLE IF NOT EXISTS user_page_favorites (
                user_id INT UNSIGNED NOT NULL,
                page_id INT UNSIGNED NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, page_id),
                CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_fav_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
                INDEX idx_fav_created (created_at)
            )'
        );
    }

    public static function listByUser(int $userId): array {
        $db = Database::getInstance()->getConnection();
        self::ensureTable($db);
        $stmt = $db->prepare(
            'SELECT p.id, p.title, p.slug, p.area_id, a.name AS area_name, p.updated_at
             FROM user_page_favorites f
             JOIN pages p ON p.id = f.page_id
             LEFT JOIN areas a ON a.id = p.area_id
             WHERE f.user_id = ?
             ORDER BY f.created_at DESC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public static function add(int $userId, int $pageId): void {
        $db = Database::getInstance()->getConnection();
        self::ensureTable($db);
        $stmt = $db->prepare('INSERT IGNORE INTO user_page_favorites (user_id, page_id) VALUES (?, ?)');
        $stmt->execute([$userId, $pageId]);
    }

    public static function remove(int $userId, int $pageId): void {
        $db = Database::getInstance()->getConnection();
        self::ensureTable($db);
        $stmt = $db->prepare('DELETE FROM user_page_favorites WHERE user_id = ? AND page_id = ?');
        $stmt->execute([$userId, $pageId]);
    }
}
