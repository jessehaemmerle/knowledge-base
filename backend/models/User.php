<?php

require_once __DIR__ . '/../db.php';

class User {
    public static function countAll(): int {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query('SELECT COUNT(*) AS c FROM users');
        return (int) $stmt->fetch()['c'];
    }

    public static function getByUsername(string $username): ?array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare('SELECT id, username, display_name, password_hash, password_salt, password_iterations, role FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function getById(int $id): ?array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare('SELECT id, username, display_name, role, created_at FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function createOwner(string $username, string $displayName, string $password): array {
        $db = Database::getInstance()->getConnection();
        $iterations = 200000;
        $saltBytes = random_bytes(16);
        $saltHex = bin2hex($saltBytes);
        $hash = hash_pbkdf2('sha256', $password, $saltBytes, $iterations, 32, false);

        $stmt = $db->prepare(
            'INSERT INTO users (username, display_name, password_hash, password_salt, password_iterations, role) VALUES (?, ?, ?, ?, ?, ?)' 
        );
        $stmt->execute([$username, $displayName, $hash, $saltHex, $iterations, 'admin']);

        $id = (int) $db->lastInsertId();
        return self::getById($id) ?? [];
    }

    public static function verifyPassword(array $user, string $password): bool {
        $salt = hex2bin((string) $user['password_salt']);
        if ($salt === false) {
            return false;
        }
        $calc = hash_pbkdf2(
            'sha256',
            $password,
            $salt,
            (int) $user['password_iterations'],
            32,
            false
        );
        return hash_equals($user['password_hash'], $calc);
    }
}
