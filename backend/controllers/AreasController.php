<?php

require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Util.php';
require_once __DIR__ . '/../models/Area.php';

class AreasController {
    public function listAreas(): void {
        Auth::requireUser();
        Response::json(Area::listAll());
    }

    public function getArea(string $id): void {
        Auth::requireUser();
        $area = Area::getById((int) $id);
        if ($area === null) {
            Response::json(['error' => 'Bereich nicht gefunden.'], 404);
            return;
        }
        Response::json($area);
    }

    public function createArea(): void {
        Auth::requireRole(['admin', 'editor']);
        $data = Request::json();

        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            Response::json(['error' => 'Name ist erforderlich.'], 400);
            return;
        }

        $slug = trim((string) ($data['slug'] ?? ''));
        if ($slug === '') {
            $slug = Util::slugify($name);
        }
        $description = trim((string) ($data['description'] ?? ''));

        try {
            $area = Area::create($name, $slug, $description);
            Response::json($area, 201);
        } catch (PDOException $e) {
            Response::json(['error' => 'Bereich konnte nicht erstellt werden (Slug evtl. bereits vorhanden).'], 409);
        }
    }

    public function updateArea(string $id): void {
        Auth::requireRole(['admin', 'editor']);
        $existing = Area::getById((int) $id);
        if ($existing === null) {
            Response::json(['error' => 'Bereich nicht gefunden.'], 404);
            return;
        }

        $data = Request::json();
        $name = trim((string) ($data['name'] ?? $existing['name']));
        $slug = trim((string) ($data['slug'] ?? $existing['slug']));
        $description = trim((string) ($data['description'] ?? $existing['description']));
        if ($slug === '') {
            $slug = Util::slugify($name);
        }

        try {
            $area = Area::update((int) $id, $name, $slug, $description);
            Response::json($area ?? ['error' => 'Bereich nicht gefunden.'], $area ? 200 : 404);
        } catch (PDOException $e) {
            Response::json(['error' => 'Bereich konnte nicht aktualisiert werden (Slug evtl. bereits vorhanden).'], 409);
        }
    }

    public function deleteArea(string $id): void {
        Auth::requireRole(['admin']);
        $existing = Area::getById((int) $id);
        if ($existing === null) {
            Response::json(['error' => 'Bereich nicht gefunden.'], 404);
            return;
        }
        Area::delete((int) $id);
        Response::noContent();
    }
}
