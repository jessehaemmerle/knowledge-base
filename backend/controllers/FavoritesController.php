<?php

require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../models/Favorite.php';

class FavoritesController {
    public function listFavorites(): void {
        $user = Auth::requireUser();
        $items = Favorite::listByUser((int) $user['id']);
        Response::json($items);
    }

    public function addFavorite(string $pageId): void {
        $user = Auth::requireUser();
        Favorite::add((int) $user['id'], (int) $pageId);
        Response::noContent();
    }

    public function removeFavorite(string $pageId): void {
        $user = Auth::requireUser();
        Favorite::remove((int) $user['id'], (int) $pageId);
        Response::noContent();
    }
}
