# Modern Markdown Wiki

Ein selbst gehostetes Wiki mit moderner React-Oberflaeche, WYSIWYG-Editor und Markdown-Dateien als persistente Wissensbasis.

## Funktionen

- Login mit automatisch erzeugtem Admin-Benutzer
- Rollen: Admin, Editor, Viewer
- Seiten erstellen, lesen, bearbeiten, archivieren
- WYSIWYG-Editor mit Markdown-Speicherung
- Interne Wiki-Links per Seitensuche im Editor
- Markdown-Dateien unter `/data/pages`
- SQLite fuer Benutzer, Metadaten, Menue und Audit Log
- Version-Snapshots unter `/data/versions`
- Suche nach Titel, Beschreibung, Tags und Inhalt
- Moderne responsive UI mit Sidebar, Dark Mode und Command Palette
- Dockerfile und `docker-compose.yml`

## Start mit Docker

```bash
docker compose up -d
```

Die App ist danach unter `http://localhost:8080` erreichbar.

Standard-Login aus `docker-compose.yml`:

- E-Mail: `admin@example.local`
- Passwort: `ChangeMe123!`

Bitte `ADMIN_PASSWORD` und `JWT_SECRET` vor produktiver Nutzung aendern.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend/API: `http://localhost:8080`

## Datenablage

Im Container wird `DATA_DIR=/data` verwendet. Mit Docker Compose wird `./data` vom Host eingebunden.

- `data/wiki.sqlite`: Benutzer, Rollen, Seitenmetadaten, Menue, Audit Log
- `data/pages`: Markdown-Dateien der Wiki-Seiten
- `data/versions`: Markdown-Snapshots pro Speicherung
- `data/uploads`: vorbereitet fuer spaetere Medienverwaltung

## Backup

Fuer ein vollstaendiges Backup sichere den kompletten `data`-Ordner:

```bash
tar -czf wiki-backup.tar.gz data
```

Da Seiten als Markdown vorliegen, koennen sie zusaetzlich gut in Git versioniert oder mit normalen Dateibackups gesichert werden.

## Updates

```bash
docker compose down
docker compose build
docker compose up -d
```

Vor Updates sollte der `data`-Ordner gesichert werden.

## API

Wichtige Endpunkte:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/pages`
- `POST /api/pages`
- `GET /api/pages/:slug`
- `PATCH /api/pages/:slug`
- `DELETE /api/pages/:slug`
- `GET /api/menu`
- `GET /api/search?q=...`
- `GET /api/users`
- `GET /api/audit`

## Erweiterbare Bereiche

Diese MVP-Version ist bewusst stabil und ueberschaubar gehalten. Sinnvolle naechste Schritte:

- Drag-and-drop-Menuebaum im Frontend
- Autocomplete direkt beim Tippen von `[[`
- Erweiterte Rechte pro Seite oder Bereich
- Medienverwaltung mit Upload-Limits
- Volltextsuche via SQLite FTS5
- Logo-Upload und weitere Branding-Einstellungen
- Diff-Ansicht fuer Versionen
