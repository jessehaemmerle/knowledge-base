<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/Response.php';

class Auth {
    public static function user(): ?array {
        if (!isset($_SESSION['user_id'])) {
            return null;
        }
        return User::getById((int) $_SESSION['user_id']);
    }

    public static function requireUser(): array {
        $user = self::user();
        if ($user === null) {
            Response::json(['error' => 'Not authenticated'], 401);
            exit;
        }
        return $user;
    }

    public static function requireRole(array $allowed): array {
        $user = self::requireUser();
        if (!in_array($user['role'], $allowed, true)) {
            Response::json(['error' => 'Insufficient permissions'], 403);
            exit;
        }
        return $user;
    }
}
