<?php
// controllers/AreasController.php
require_once __DIR__ . '/../models/Area.php';

class AreasController {
    /**
     * GET /api/areas – Gibt alle Areas zurück.
     */
    public function listAreas() {
        $areas = Area::getAll();
        header('Content-Type: application/json');
        echo json_encode($areas);
    }

    /**
     * GET /api/areas/{id} – Gibt eine einzelne Area zurück.
     *
     * @param int $id
     */
    public function getArea($id) {
        $area = Area::getById($id);
        if ($area) {
            header('Content-Type: application/json');
            echo json_encode($area);
        } else {
            header("HTTP/1.1 404 Not Found");
            echo json_encode(["error" => "Area not found"]);
        }
    }

    /**
     * POST /api/areas – Erstellt eine neue Area.
     */
    public function createArea() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['name'])) {
            header("HTTP/1.1 400 Bad Request");
            echo json_encode(["error" => "Name is required"]);
            return;
        }
        $area = new Area();
        $area->name = $data['name'];
        $area->description = $data['description'] ?? '';
        $area->save();

        header('Content-Type: application/json');
        echo json_encode($area);
    }

    /**
     * PUT /api/areas/{id} – Aktualisiert eine bestehende Area.
     *
     * @param int $id
     */
    public function updateArea($id) {
        $data = json_decode(file_get_contents("php://input"), true);
        $existing = Area::getById($id);
        if (!$existing) {
            header("HTTP/1.1 404 Not Found");
            echo json_encode(["error" => "Area not found"]);
            return;
        }
        $area = new Area();
        $area->id = $id;
        $area->name = $data['name'] ?? $existing['name'];
        $area->description = $data['description'] ?? $existing['description'];
        $area->save();

        header('Content-Type: application/json');
        echo json_encode($area);
    }

    /**
     * DELETE /api/areas/{id} – Löscht eine Area.
     *
     * @param int $id
     */
    public function deleteArea($id) {
        $existing = Area::getById($id);
        if (!$existing) {
            header("HTTP/1.1 404 Not Found");
            echo json_encode(["error" => "Area not found"]);
            return;
        }
        Area::delete($id);
        header('Content-Type: application/json');
        echo json_encode(["message" => "Area deleted successfully"]);
    }
}
