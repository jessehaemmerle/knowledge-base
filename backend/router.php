<?php

class Router {
    private array $routes = [];

    public function add(string $method, string $pattern, string $handler): void {
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    public function dispatch(string $method, string $uri): void {
        $path = parse_url($uri, PHP_URL_PATH);
        $method = strtoupper($method);

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $regex = $this->convertPattern($route['pattern']);
            if (!preg_match($regex, $path, $matches)) {
                continue;
            }

            [$controllerName, $action] = explode('@', $route['handler']);
            require_once __DIR__ . '/controllers/' . $controllerName . '.php';
            $controller = new $controllerName();
            array_shift($matches);
            call_user_func_array([$controller, $action], $matches);
            return;
        }

        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Route not found'], JSON_UNESCAPED_UNICODE);
    }

    private function convertPattern(string $pattern): string {
        $escaped = preg_replace('/\{[a-zA-Z_][a-zA-Z0-9_]*\}/', '([a-zA-Z0-9\-]+)', $pattern);
        return '#^' . $escaped . '$#';
    }
}
