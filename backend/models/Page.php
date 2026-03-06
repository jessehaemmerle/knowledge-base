<?php

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/PageVersion.php';

class Page {
    public static function list(array $filters, array $viewer): array {
        $db = Database::getInstance()->getConnection();

        $conditions = [];
        $params = [];

        if (!empty($filters['area_id'])) {
            $conditions[] = 'p.area_id = ?';
            $params[] = (int) $filters['area_id'];
        }

        if (!empty($filters['status'])) {
            $conditions[] = 'p.status = ?';
            $params[] = $filters['status'];
        }

        if (!empty($filters['q'])) {
            $conditions[] = '(p.title LIKE ? OR p.content LIKE ? OR p.summary LIKE ?)';
            $like = '%' . $filters['q'] . '%';
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        if ($viewer['role'] === 'viewer') {
            $conditions[] = 'p.is_public = 1';
            $conditions[] = "p.status = 'published'";
        }

        $where = '';
        if (!empty($conditions)) {
            $where = 'WHERE ' . implode(' AND ', $conditions);
        }

        $sql = "SELECT p.id, p.area_id, p.parent_id, p.title, p.slug, p.summary, p.status, p.is_public, p.updated_at,
                       a.name AS area_name,
                       u.display_name AS updated_by_name
                FROM pages p
                LEFT JOIN areas a ON a.id = p.area_id
                JOIN users u ON u.id = p.updated_by
                {$where}
                ORDER BY p.updated_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function getById(int $id, array $viewer): ?array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare(
            "SELECT p.*, a.name AS area_name, cu.display_name AS created_by_name, uu.display_name AS updated_by_name
             FROM pages p
             LEFT JOIN areas a ON a.id = p.area_id
             JOIN users cu ON cu.id = p.created_by
             JOIN users uu ON uu.id = p.updated_by
             WHERE p.id = ?"
        );
        $stmt->execute([$id]);
        $page = $stmt->fetch();
        if (!$page) {
            return null;
        }

        if ($viewer['role'] === 'viewer' && ((int) $page['is_public'] !== 1 || $page['status'] !== 'published')) {
            return null;
        }

        $stmtVersion = $db->prepare('SELECT MAX(version_number) AS latest_version FROM page_versions WHERE page_id = ?');
        $stmtVersion->execute([$id]);
        $latest = $stmtVersion->fetch();
        $page['latest_version'] = $latest ? (int) $latest['latest_version'] : 0;

        return $page;
    }

    public static function create(array $payload, int $userId): array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare(
            'INSERT INTO pages (area_id, parent_id, title, slug, content, summary, status, is_public, created_by, updated_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $payload['area_id'],
            $payload['parent_id'],
            $payload['title'],
            $payload['slug'],
            $payload['content'],
            $payload['summary'],
            $payload['status'],
            $payload['is_public'],
            $userId,
            $userId,
        ]);

        $id = (int) $db->lastInsertId();
        PageVersion::create($id, 1, $payload['title'], $payload['content'], $payload['summary'], $payload['status'], $userId, $payload['note']);

        return self::getById($id, ['role' => 'admin']) ?? [];
    }

    public static function update(int $id, array $payload, int $userId): ?array {
        $existing = self::getById($id, ['role' => 'admin']);
        if ($existing === null) {
            return null;
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare(
            'UPDATE pages SET area_id = ?, parent_id = ?, title = ?, slug = ?, content = ?, summary = ?, status = ?, is_public = ?, updated_by = ?, updated_at = NOW() WHERE id = ?'
        );
        $stmt->execute([
            $payload['area_id'],
            $payload['parent_id'],
            $payload['title'],
            $payload['slug'],
            $payload['content'],
            $payload['summary'],
            $payload['status'],
            $payload['is_public'],
            $userId,
            $id,
        ]);

        $nextVersion = ((int) $existing['latest_version']) + 1;
        PageVersion::create($id, $nextVersion, $payload['title'], $payload['content'], $payload['summary'], $payload['status'], $userId, $payload['note']);

        return self::getById($id, ['role' => 'admin']);
    }

    public static function restoreVersion(int $id, int $versionNumber, int $userId): ?array {
        $existing = self::getById($id, ['role' => 'admin']);
        if ($existing === null) {
            return null;
        }

        $version = PageVersion::getByNumber($id, $versionNumber);
        if ($version === null) {
            return null;
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare(
            'UPDATE pages SET title = ?, content = ?, summary = ?, status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?'
        );
        $stmt->execute([
            $version['title'],
            $version['content'],
            $version['summary'],
            $version['status'],
            $userId,
            $id,
        ]);

        $nextVersion = ((int) $existing['latest_version']) + 1;
        PageVersion::create(
            $id,
            $nextVersion,
            $version['title'],
            $version['content'],
            $version['summary'],
            $version['status'],
            $userId,
            'Wiederhergestellt von Version ' . $versionNumber
        );

        return self::getById($id, ['role' => 'admin']);
    }

    public static function delete(int $id): bool {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare('DELETE FROM pages WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public static function dashboardStats(array $viewer): array {
        $db = Database::getInstance()->getConnection();

        $visibilityFilter = $viewer['role'] === 'viewer' ? 'WHERE is_public = 1 AND status = "published"' : '';

        $totalPages = (int) $db->query("SELECT COUNT(*) AS c FROM pages {$visibilityFilter}")->fetch()['c'];
        $totalAreas = (int) $db->query('SELECT COUNT(*) AS c FROM areas')->fetch()['c'];
        $draftPages = (int) $db->query('SELECT COUNT(*) AS c FROM pages WHERE status = "draft"')->fetch()['c'];
        $latestChanges = $db->query(
            'SELECT p.id, p.title, p.updated_at, u.display_name AS updated_by_name
             FROM pages p JOIN users u ON u.id = p.updated_by
             ORDER BY p.updated_at DESC LIMIT 8'
        )->fetchAll();

        return [
            'total_pages' => $totalPages,
            'total_areas' => $totalAreas,
            'draft_pages' => $draftPages,
            'latest_changes' => $latestChanges,
        ];
    }
}
