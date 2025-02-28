<?php
// db.php
class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        $dsn = "mysql:host=localhost;dbname=knowledgebase;charset=utf8mb4";
        $user = "dbuser";
        $pass = "dbpass";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        try {
            $this->pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }
}
