<?php

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../models/User.php';

class AuthController {
    public function login(): void {
        $data = Request::json();
        $username = trim((string) ($data['username'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        if ($username === '' || $password === '') {
            Response::json(['error' => 'Username und Passwort sind erforderlich.'], 400);
            return;
        }

        $user = User::getByUsername($username);
        if ($user === null || !User::verifyPassword($user, $password)) {
            Response::json(['error' => 'Ungueltige Anmeldedaten.'], 401);
            return;
        }

        $_SESSION['user_id'] = (int) $user['id'];
        session_regenerate_id(true);

        Response::json([
            'user' => [
                'id' => (int) $user['id'],
                'username' => $user['username'],
                'display_name' => $user['display_name'],
                'role' => $user['role'],
            ]
        ]);
    }

    public function me(): void {
        if (!isset($_SESSION['user_id'])) {
            Response::json(['user' => null]);
            return;
        }

        $user = User::getById((int) $_SESSION['user_id']);
        Response::json(['user' => $user]);
    }

    public function logout(): void {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        Response::noContent();
    }
}
