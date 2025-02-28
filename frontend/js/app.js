// app.js

// Basis-URL des Backends (anpassen, falls Backend z.B. in einem Unterordner liegt)
const API_BASE = '/api';

// Lädt alle Areas und füllt sowohl die Sidebar als auch das Area-Select im Formular
async function loadAreas() {
  try {
    const response = await fetch(`${API_BASE}/areas`);
    const areas = await response.json();
    const areaList = document.getElementById('area-list');
    const areaSelect = document.getElementById('area-select');
    
    areaList.innerHTML = '';
    areaSelect.innerHTML = '<option value="">-- Kein Bereich --</option>';

    areas.forEach(area => {
      // Sidebar-Eintrag
      const li = document.createElement('li');
      li.textContent = area.name;
      li.dataset.areaId = area.id;
      li.addEventListener('click', () => loadPages(area.id));
      areaList.appendChild(li);

      // Option im Select
      const option = document.createElement('option');
      option.value = area.id;
      option.textContent = area.name;
      areaSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Fehler beim Laden der Areas:', error);
  }
}

// Lädt alle Seiten (optional gefiltert nach Bereich)
async function loadPages(areaId = '') {
  try {
    let url = `${API_BASE}/pages`;
    // Bei Bedarf: Backend kann Filterparameter verarbeiten
    if (areaId) {
      url += `?area_id=${areaId}`;
    }
    const response = await fetch(url);
    const pages = await response.json();
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '';

    pages.forEach(page => {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      pageDiv.innerHTML = `
        <h3>${page.title}</h3>
        <p>${page.content.substring(0, 150)}...</p>
        <small>Erstellt am: ${page.created_at}</small>
      `;
      // Klick auf eine Seite könnte z.B. Details oder Versionen laden
      pageDiv.addEventListener('click', () => showPageDetails(page.id));
      contentArea.appendChild(pageDiv);
    });
  } catch (error) {
    console.error('Fehler beim Laden der Seiten:', error);
  }
}

// Beispiel: Details einer Seite inkl. Versionen laden (Erweiterung möglich)
async function showPageDetails(pageId) {
  try {
    const response = await fetch(`${API_BASE}/pages/${pageId}/versions`);
    const versions = await response.json();
    // Für dieses Beispiel geben wir die Versionen in der Konsole aus.
    console.log('Versionen für Seite ' + pageId, versions);
    alert(`Versionen für Seite ${pageId} werden in der Konsole angezeigt.`);
  } catch (error) {
    console.error('Fehler beim Laden der Versionen:', error);
  }
}

// Modal für das Erstellen einer neuen Seite steuern
function initModal() {
  const modal = document.getElementById('editor-modal');
  const newPageLink = document.getElementById('new-page-link');
  const closeModal = document.getElementById('close-modal');
  const pageForm = document.getElementById('page-form');

  newPageLink.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.remove('hidden');
  });

  closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Formular-Submit: Neue Seite erstellen
  pageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('page-title').value;
    const content = document.getElementById('page-content').innerHTML;
    const areaId = document.getElementById('area-select').value;
    const newPage = {
      title,
      content,
      area_id: areaId,
      is_public: true
    };

    try {
      const response = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPage)
      });
      const result = await response.json();
      console.log('Seite erstellt:', result);
      modal.classList.add('hidden');
      // Aktualisiere die Seite-Liste
      loadPages();
    } catch (error) {
      console.error('Fehler beim Erstellen der Seite:', error);
    }
  });
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
  loadAreas();
  loadPages();
  initModal();
});
