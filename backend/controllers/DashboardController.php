<?php

require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../models/Page.php';

class DashboardController {
    public function stats(): void {
        $user = Auth::requireUser();
        $stats = Page::dashboardStats($user);
        Response::json($stats);
    }
}
