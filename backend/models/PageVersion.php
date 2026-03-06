<?php

require_once __DIR__ . '/../db.php';

class PageVersion {
    public static function listByPage(int $pageId): array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare(
            'SELECT pv.id, pv.page_id, pv.version_number, pv.title, pv.content, pv.summary, pv.status, pv.note, pv.edited_at, u.display_name AS edited_by_name
             FROM page_versions pv
             JOIN users u ON u.id = pv.edited_by
             WHERE pv.page_id = ?
             ORDER BY pv.version_number DESC'
        );
        $stmt->execute([$pageId]);
        return $stmt->fetchAll();
    }

    public static function getByNumber(int $pageId, int $versionNumber): ?array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare('SELECT * FROM page_versions WHERE page_id = ? AND version_number = ?');
        $stmt->execute([$pageId, $versionNumber]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function create(int $pageId, int $versionNumber, string $title, string $content, ?string $summary, string $status, int $editedBy, ?string $note): void {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare(
            'INSERT INTO page_versions (page_id, version_number, title, content, summary, status, edited_by, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$pageId, $versionNumber, $title, $content, $summary, $status, $editedBy, $note]);
    }
}
