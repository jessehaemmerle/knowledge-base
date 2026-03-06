<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/router.php';
require_once __DIR__ . '/core/Response.php';

session_name(getenv('APP_SESSION_NAME') ?: 'kb_session');
session_start();

$router = new Router();

$router->add('POST', '/api/auth/login', 'AuthController@login');
$router->add('GET', '/api/auth/me', 'AuthController@me');
$router->add('POST', '/api/auth/logout', 'AuthController@logout');

$router->add('GET', '/api/dashboard/stats', 'DashboardController@stats');

$router->add('GET', '/api/areas', 'AreasController@listAreas');
$router->add('GET', '/api/areas/{id}', 'AreasController@getArea');
$router->add('POST', '/api/areas', 'AreasController@createArea');
$router->add('PUT', '/api/areas/{id}', 'AreasController@updateArea');
$router->add('DELETE', '/api/areas/{id}', 'AreasController@deleteArea');

$router->add('GET', '/api/pages', 'PagesController@listPages');
$router->add('GET', '/api/pages/{id}', 'PagesController@getPage');
$router->add('POST', '/api/pages', 'PagesController@createPage');
$router->add('PUT', '/api/pages/{id}', 'PagesController@updatePage');
$router->add('DELETE', '/api/pages/{id}', 'PagesController@deletePage');
$router->add('GET', '/api/pages/{id}/versions', 'PagesController@listPageVersions');
$router->add('POST', '/api/pages/{id}/restore/{versionNumber}', 'PagesController@restorePageVersion');

try {
    $router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
} catch (Throwable $e) {
    $debug = getenv('APP_DEBUG') === '1';
    $payload = ['error' => 'Internal Server Error'];
    if ($debug) {
        $payload['details'] = $e->getMessage();
    }
    Response::json($payload, 500);
}
