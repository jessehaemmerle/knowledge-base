<?php

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Util.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Area.php';
require_once __DIR__ . '/../models/Page.php';

class SetupController {
    public function status(): void {
        Response::json(['setup_required' => User::countAll() === 0]);
    }

    public function initialize(): void {
        if (User::countAll() > 0) {
            Response::json(['error' => 'Setup wurde bereits abgeschlossen.'], 409);
            return;
        }

        $data = Request::json();
        $displayName = trim((string) ($data['display_name'] ?? ''));
        $username = trim((string) ($data['username'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        if ($displayName === '' || $username === '' || $password === '') {
            Response::json(['error' => 'display_name, username und password sind erforderlich.'], 400);
            return;
        }

        if (strlen($password) < 8) {
            Response::json(['error' => 'Passwort muss mindestens 8 Zeichen haben.'], 400);
            return;
        }

        if (!preg_match('/^[a-zA-Z0-9._-]{3,50}$/', $username)) {
            Response::json(['error' => 'Username muss 3-50 Zeichen lang sein und darf nur Buchstaben, Zahlen, Punkt, Unterstrich, Bindestrich enthalten.'], 400);
            return;
        }

        try {
            $user = User::createOwner($username, $displayName, $password);

            $area = Area::create('Allgemein', Util::slugify('Allgemein'), 'Erster Bereich fuer den Wiki-Start');

            Page::create([
                'area_id' => $area['id'],
                'parent_id' => null,
                'title' => 'Willkommen im Wiki',
                'slug' => Util::slugify('Willkommen im Wiki'),
                'content' => '<h2>Willkommen</h2><p>Das Setup ist abgeschlossen. Du kannst jetzt Seiten, Bereiche und Versionen verwalten.</p>',
                'summary' => 'Startseite nach Setup',
                'status' => 'published',
                'is_public' => 1,
                'note' => 'Initiale Seite aus Setup',
            ], (int) $user['id']);

            $_SESSION['user_id'] = (int) $user['id'];
            session_regenerate_id(true);

            Response::json([
                'user' => [
                    'id' => (int) $user['id'],
                    'username' => $user['username'],
                    'display_name' => $user['display_name'],
                    'role' => $user['role'],
                ],
            ], 201);
        } catch (PDOException $e) {
            Response::json(['error' => 'Setup fehlgeschlagen. Username oder Slug existiert bereits.'], 409);
        }
    }
}
