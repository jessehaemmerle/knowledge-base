# Knowledge Base Wiki (Dockerized)

Vollstaendige Wiki-Loesung mit:
- Initialem Setup (ersten Admin selbst anlegen)
- Login und Rollen (`admin`, `editor`, `viewer`)
- Bereichsverwaltung (`areas`)
- Seitenverwaltung mit Status (`draft`, `published`, `archived`)
- Volltextsuche (Titel/Inhalt/Zusammenfassung)
- Versionierung bei jeder Aenderung
- Restore auf beliebige Versionen
- Dashboard mit Kennzahlen

## Tech-Stack
- Frontend: Vanilla HTML/CSS/JavaScript
- Backend: PHP 8.3 (API)
- Datenbank: MariaDB 11
- Runtime: Docker Compose mit `nginx` + `php-fpm` + `mariadb`

## Start

```bash
docker compose up --build -d
```

Danach:
- App: http://localhost:8080
- API: `http://localhost:8080/api/...`

## Erster Start (Setup)
Beim ersten Aufruf erscheint ein Setup-Screen.
Dort legst du den ersten Benutzer an. Dieser wird automatisch `admin`.

## Services
- `web` (nginx): liefert Frontend und routed `/api/*` an PHP
- `php` (php-fpm): API-Backend
- `db` (mariadb): persistente Datenbank

## Wichtige Endpunkte
- `GET /api/setup/status`
- `POST /api/setup/initialize`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/dashboard/stats`
- `GET /api/areas`
- `POST /api/areas`
- `PUT /api/areas/{id}`
- `DELETE /api/areas/{id}`
- `GET /api/pages`
- `GET /api/pages/{id}`
- `POST /api/pages`
- `PUT /api/pages/{id}`
- `DELETE /api/pages/{id}`
- `GET /api/pages/{id}/versions`
- `POST /api/pages/{id}/restore/{versionNumber}`

## Datenpersistenz
MariaDB-Daten liegen in Docker-Volume `db_data`.

## Produktion
- Port-Mapping in `docker-compose.yml` anpassen (`8080:80`).
- DB-Credentials in Compose-Umgebungsvariablen setzen.
- `APP_DEBUG` auf `0` lassen.
- Reverse Proxy / TLS (z.B. Traefik oder Caddy) davorschalten.
