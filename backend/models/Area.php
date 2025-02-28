<?php
// models/Area.php
require_once __DIR__ . '/../db.php';

class Area {
    public $id;
    public $name;
    public $description;

    /**
     * Gibt alle Areas zurück.
     *
     * @return array
     */
    public static function getAll() {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query("SELECT * FROM areas");
        return $stmt->fetchAll();
    }

    /**
     * Gibt eine Area anhand ihrer ID zurück.
     *
     * @param int $id
     * @return mixed
     */
    public static function getById($id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT * FROM areas WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Speichert eine Area – als Insert (wenn neu) oder Update (bei vorhandener ID).
     */
    public function save() {
        $db = Database::getInstance()->getConnection();
        if ($this->id) {
            $stmt = $db->prepare("UPDATE areas SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$this->name, $this->description, $this->id]);
        } else {
            $stmt = $db->prepare("INSERT INTO areas (name, description) VALUES (?, ?)");
            $stmt->execute([$this->name, $this->description]);
            $this->id = $db->lastInsertId();
        }
    }

    /**
     * Löscht eine Area anhand ihrer ID.
     *
     * @param int $id
     */
    public static function delete($id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("DELETE FROM areas WHERE id = ?");
        $stmt->execute([$id]);
    }
}
