<?php
// index.php
require_once 'db.php';
require_once 'router.php';

$router = new Router();

// Routen für die Seitenverwaltung
$router->add('GET', '/api/pages', 'PagesController@listPages');
$router->add('POST', '/api/pages', 'PagesController@createPage');
// Route zum Abrufen der Versionen einer Seite
$router->add('GET', '/api/pages/{id}/versions', 'PagesController@listPageVersions');

// Routen für die Areas-Funktionalität
$router->add('GET', '/api/areas', 'AreasController@listAreas');
$router->add('GET', '/api/areas/{id}', 'AreasController@getArea');
$router->add('POST', '/api/areas', 'AreasController@createArea');
$router->add('PUT', '/api/areas/{id}', 'AreasController@updateArea');
$router->add('DELETE', '/api/areas/{id}', 'AreasController@deleteArea');

$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
