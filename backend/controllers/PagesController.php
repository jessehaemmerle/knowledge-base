<?php
// controllers/PagesController.php
require_once __DIR__ . '/../models/Page.php';
require_once __DIR__ . '/../models/PageVersion.php';

class PagesController {
    /**
     * GET /api/pages – Liste aller Seiten
     */
    public function listPages() {
        $pages = Page::getAll();
        header('Content-Type: application/json');
        echo json_encode($pages);
    }

    /**
     * POST /api/pages – Erstellen einer neuen Seite (erstellt gleichzeitig einen Versionsdatensatz)
     */
    public function createPage() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['title']) || !isset($data['content'])) {
            header("HTTP/1.1 400 Bad Request");
            echo json_encode(["error" => "Title and content are required"]);
            return;
        }
        $page = new Page();
        $page->title     = $data['title'];
        $page->content   = $data['content'];
        $page->parent_id = $data['parent_id'] ?? null;
        $page->area_id   = $data['area_id'] ?? null;
        $page->is_public = $data['is_public'] ?? true;
        $page->save();

        header('Content-Type: application/json');
        echo json_encode($page);
    }

    /**
     * GET /api/pages/{id}/versions – Gibt alle Versionen einer Seite zurück
     *
     * @param int $id
     */
    public function listPageVersions($id) {
        $versions = PageVersion::getVersions($id);
        header('Content-Type: application/json');
        echo json_encode($versions);
    }
}
