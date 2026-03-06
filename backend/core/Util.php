<?php

class Util {
    public static function slugify(string $value): string {
        $lower = strtolower(trim($value));
        $slug = preg_replace('/[^a-z0-9]+/u', '-', $lower);
        $slug = trim($slug ?? '', '-');
        return $slug !== '' ? $slug : 'eintrag';
    }

    public static function sanitizeHtml(string $html): string {
        $allowed = '<p><br><strong><em><b><i><ul><ol><li><h1><h2><h3><h4><blockquote><code><pre><a>';
        return strip_tags($html, $allowed);
    }
}
