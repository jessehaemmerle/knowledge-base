<?php

require_once __DIR__ . '/../db.php';

class Area {
    public static function listAll(): array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query('SELECT id, name, slug, description, created_at, updated_at FROM areas ORDER BY name ASC');
        return $stmt->fetchAll();
    }

    public static function getById(int $id): ?array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare('SELECT id, name, slug, description, created_at, updated_at FROM areas WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function create(string $name, string $slug, string $description): array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare('INSERT INTO areas (name, slug, description) VALUES (?, ?, ?)');
        $stmt->execute([$name, $slug, $description]);
        return self::getById((int) $db->lastInsertId());
    }

    public static function update(int $id, string $name, string $slug, string $description): ?array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare('UPDATE areas SET name = ?, slug = ?, description = ? WHERE id = ?');
        $stmt->execute([$name, $slug, $description, $id]);
        return self::getById($id);
    }

    public static function delete(int $id): void {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare('DELETE FROM areas WHERE id = ?');
        $stmt->execute([$id]);
    }
}
