<?php
// models/Page.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/PageVersion.php';

class Page {
    public $id;
    public $title;
    public $content;
    public $parent_id;
    public $area_id;
    public $is_public;
    public $created_at;
    public $updated_at;

    /**
     * Ruft alle Seiten aus der Datenbank ab.
     *
     * @return array
     */
    public static function getAll() {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query("SELECT * FROM pages");
        return $stmt->fetchAll();
    }

    /**
     * Speichert die Seite (Neu- oder Update) und erstellt anschließend eine Version.
     */
    public function save() {
        $db = Database::getInstance()->getConnection();
        if ($this->id) {
            $stmt = $db->prepare("UPDATE pages SET title = ?, content = ?, parent_id = ?, area_id = ?, is_public = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$this->title, $this->content, $this->parent_id, $this->area_id, $this->is_public, $this->id]);
        } else {
            $stmt = $db->prepare("INSERT INTO pages (title, content, parent_id, area_id, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
            $stmt->execute([$this->title, $this->content, $this->parent_id, $this->area_id, $this->is_public]);
            $this->id = $db->lastInsertId();
        }
        // Erzeuge einen Versionsdatensatz
        PageVersion::createVersion($this);
    }
}
