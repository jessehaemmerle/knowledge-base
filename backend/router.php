<?php
// router.php
class Router {
    private $routes = [];

    public function add($method, $pattern, $handler) {
        $this->routes[] = ['method' => $method, 'pattern' => $pattern, 'handler' => $handler];
    }

    public function dispatch($method, $uri) {
        $uri = parse_url($uri, PHP_URL_PATH);
        foreach ($this->routes as $route) {
            if ($method === $route['method'] && preg_match($this->convertPattern($route['pattern']), $uri, $matches)) {
                list($controller, $action) = explode('@', $route['handler']);
                require_once 'controllers/' . $controller . '.php';
                $controllerInstance = new $controller();
                return call_user_func_array([$controllerInstance, $action], array_slice($matches, 1));
            }
        }
        header("HTTP/1.0 404 Not Found");
        echo json_encode(["error" => "Not Found"]);
    }

    private function convertPattern($pattern) {
        // Ersetze Parameter-Platzhalter (z. B. {id}) durch Regex-Gruppen
        $pattern = preg_replace('#\{[a-zA-Z0-9_]+\}#', '([a-zA-Z0-9_\-]+)', $pattern);
        return '#^' . $pattern . '$#';
    }
}
