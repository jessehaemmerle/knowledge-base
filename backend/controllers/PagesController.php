<?php

require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Util.php';
require_once __DIR__ . '/../models/Page.php';
require_once __DIR__ . '/../models/PageVersion.php';

class PagesController {
    public function listPages(): void {
        $user = Auth::requireUser();

        $filters = [
            'area_id' => Request::query('area_id'),
            'status' => Request::query('status'),
            'q' => Request::query('q'),
        ];

        Response::json(Page::list($filters, $user));
    }

    public function getPage(string $id): void {
        $user = Auth::requireUser();
        $page = Page::getById((int) $id, $user);
        if ($page === null) {
            Response::json(['error' => 'Seite nicht gefunden.'], 404);
            return;
        }
        Response::json($page);
    }

    public function createPage(): void {
        $user = Auth::requireRole(['admin', 'editor']);
        $data = Request::json();
        $payload = $this->buildPayload($data);
        if (isset($payload['error'])) {
            Response::json(['error' => $payload['error']], 400);
            return;
        }

        try {
            $page = Page::create($payload, (int) $user['id']);
            Response::json($page, 201);
        } catch (PDOException $e) {
            Response::json(['error' => 'Seite konnte nicht erstellt werden (Slug evtl. bereits vorhanden).'], 409);
        }
    }

    public function updatePage(string $id): void {
        $user = Auth::requireRole(['admin', 'editor']);
        $data = Request::json();
        $payload = $this->buildPayload($data);
        if (isset($payload['error'])) {
            Response::json(['error' => $payload['error']], 400);
            return;
        }

        try {
            $page = Page::update((int) $id, $payload, (int) $user['id']);
            if ($page === null) {
                Response::json(['error' => 'Seite nicht gefunden.'], 404);
                return;
            }
            Response::json($page);
        } catch (PDOException $e) {
            Response::json(['error' => 'Seite konnte nicht aktualisiert werden (Slug evtl. bereits vorhanden).'], 409);
        }
    }

    public function deletePage(string $id): void {
        Auth::requireRole(['admin']);
        $deleted = Page::delete((int) $id);
        if (!$deleted) {
            Response::json(['error' => 'Seite nicht gefunden.'], 404);
            return;
        }
        Response::noContent();
    }

    public function listPageVersions(string $id): void {
        Auth::requireUser();
        Response::json(PageVersion::listByPage((int) $id));
    }

    public function restorePageVersion(string $id, string $versionNumber): void {
        $user = Auth::requireRole(['admin', 'editor']);
        $page = Page::restoreVersion((int) $id, (int) $versionNumber, (int) $user['id']);
        if ($page === null) {
            Response::json(['error' => 'Seite oder Version nicht gefunden.'], 404);
            return;
        }
        Response::json($page);
    }

    private function buildPayload(array $data): array {
        $title = trim((string) ($data['title'] ?? ''));
        if ($title === '') {
            return ['error' => 'Titel ist erforderlich.'];
        }

        $content = trim((string) ($data['content'] ?? ''));
        if ($content === '') {
            return ['error' => 'Inhalt ist erforderlich.'];
        }

        $slug = trim((string) ($data['slug'] ?? ''));
        if ($slug === '') {
            $slug = Util::slugify($title);
        }

        $status = (string) ($data['status'] ?? 'published');
        if (!in_array($status, ['draft', 'published', 'archived'], true)) {
            return ['error' => 'Ungueltiger Status.'];
        }

        return [
            'area_id' => isset($data['area_id']) && $data['area_id'] !== '' ? (int) $data['area_id'] : null,
            'parent_id' => isset($data['parent_id']) && $data['parent_id'] !== '' ? (int) $data['parent_id'] : null,
            'title' => $title,
            'slug' => $slug,
            'content' => Util::sanitizeHtml($content),
            'summary' => trim((string) ($data['summary'] ?? '')),
            'status' => $status,
            'is_public' => !empty($data['is_public']) ? 1 : 0,
            'note' => trim((string) ($data['note'] ?? '')),
        ];
    }
}
