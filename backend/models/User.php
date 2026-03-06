<?php

require_once __DIR__ . '/../db.php';

class User {
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
