<?php
// models/PageVersion.php
require_once __DIR__ . '/../db.php';

class PageVersion {
    public $id;
    public $page_id;
    public $content;
    public $edited_by; // Hier kann später die Benutzer-ID eingetragen werden (zunächst null)
    public $edited_at;
    public $note;

    /**
     * Erzeugt eine neue Versionseintragung für eine Seite.
     *
     * @param object $page Das Page-Objekt, dessen aktueller Inhalt versioniert werden soll.
     * @param mixed $edited_by Optional: Benutzer, der die Änderung vorgenommen hat.
     * @param string|null $note Optional: Hinweis zur Änderung.
     */
    public static function createVersion($page, $edited_by = null, $note = null) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("INSERT INTO page_versions (page_id, content, edited_by, edited_at, note) VALUES (?, ?, ?, NOW(), ?)");
        $stmt->execute([$page->id, $page->content, $edited_by, $note]);
    }

    /**
     * Liefert alle Versionen einer bestimmten Seite, absteigend sortiert nach Änderungsdatum.
     *
     * @param int $page_id
     * @return array
     */
    public static function getVersions($page_id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT * FROM page_versions WHERE page_id = ? ORDER BY edited_at DESC");
        $stmt->execute([$page_id]);
        return $stmt->fetchAll();
    }
}
