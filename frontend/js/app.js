const API_BASE = '/api';

const state = {
  user: null,
  areas: [],
  pages: [],
  selectedPageId: null,
  filter: {
    q: '',
    area_id: '',
    status: '',
  },
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload;
}

function qs(id) {
  return document.getElementById(id);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function setVisible(elementId, visible) {
  qs(elementId).classList.toggle('hidden', !visible);
}

async function boot() {
  bindEvents();

  try {
    const me = await request('/auth/me');
    if (me.user) {
      state.user = me.user;
      await loadApp();
    } else {
      showLogin();
    }
  } catch (_) {
    showLogin();
  }
}

function showLogin() {
  setVisible('login-view', true);
  setVisible('app-view', false);
}

function showApp() {
  setVisible('login-view', false);
  setVisible('app-view', true);
  qs('welcome-user').textContent = `Angemeldet als ${state.user.display_name} (${state.user.role})`;
}

function bindEvents() {
  qs('login-form').addEventListener('submit', onLogin);
  qs('logout-btn').addEventListener('click', onLogout);

  qs('new-page-btn').addEventListener('click', () => openPageModal());
  qs('new-area-btn').addEventListener('click', () => openAreaModal());
  qs('cancel-page-btn').addEventListener('click', closePageModal);
  qs('cancel-area-btn').addEventListener('click', closeAreaModal);

  qs('page-form').addEventListener('submit', onPageSubmit);
  qs('area-form').addEventListener('submit', onAreaSubmit);

  qs('apply-filter-btn').addEventListener('click', onApplyFilter);
  qs('search-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      onApplyFilter();
    }
  });
}

async function onLogin(event) {
  event.preventDefault();
  const errorBox = qs('login-error');
  errorBox.classList.add('hidden');

  try {
    const payload = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: qs('username').value.trim(),
        password: qs('password').value,
      }),
    });

    state.user = payload.user;
    await loadApp();
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove('hidden');
  }
}

async function onLogout() {
  await request('/auth/logout', { method: 'POST' });
  state.user = null;
  showLogin();
}

async function loadApp() {
  showApp();
  await Promise.all([loadAreas(), loadPages(), loadDashboard()]);
}

async function loadDashboard() {
  const stats = await request('/dashboard/stats');
  qs('dashboard').innerHTML = `
    <div class="stat"><span>Seiten</span><strong>${stats.total_pages}</strong></div>
    <div class="stat"><span>Bereiche</span><strong>${stats.total_areas}</strong></div>
    <div class="stat"><span>Drafts</span><strong>${stats.draft_pages}</strong></div>
    <div class="stat"><span>Letzte Aenderung</span><strong>${stats.latest_changes[0] ? escapeHtml(stats.latest_changes[0].title) : '-'}</strong></div>
  `;
}

async function loadAreas() {
  state.areas = await request('/areas');

  const areaOptions = ['<option value="">Alle Bereiche</option>']
    .concat(state.areas.map((area) => `<option value="${area.id}">${escapeHtml(area.name)}</option>`))
    .join('');
  qs('area-filter').innerHTML = areaOptions;

  const pageAreaOptions = ['<option value="">-- Kein Bereich --</option>']
    .concat(state.areas.map((area) => `<option value="${area.id}">${escapeHtml(area.name)}</option>`))
    .join('');
  qs('page-area').innerHTML = pageAreaOptions;
}

function buildPageQuery() {
  const params = new URLSearchParams();
  if (state.filter.q) params.set('q', state.filter.q);
  if (state.filter.area_id) params.set('area_id', state.filter.area_id);
  if (state.filter.status) params.set('status', state.filter.status);
  const query = params.toString();
  return query ? `?${query}` : '';
}

async function loadPages() {
  state.pages = await request(`/pages${buildPageQuery()}`);
  renderPageList();

  if (state.selectedPageId) {
    const stillPresent = state.pages.some((page) => page.id === state.selectedPageId);
    if (!stillPresent) {
      state.selectedPageId = null;
      qs('page-details').innerHTML = '<p class="muted">Wähle eine Seite aus.</p>';
    }
  }
}

function renderPageList() {
  const list = qs('page-list');
  if (!state.pages.length) {
    list.innerHTML = '<p class="muted">Keine Seiten gefunden.</p>';
    return;
  }

  list.innerHTML = state.pages.map((page) => `
    <article class="page-item ${page.id === state.selectedPageId ? 'active' : ''}" data-page-id="${page.id}">
      <h3>${escapeHtml(page.title)}</h3>
      <p class="meta">${escapeHtml(page.area_name || 'Ohne Bereich')} | ${escapeHtml(page.status)} | ${page.is_public ? 'public' : 'intern'}</p>
      <p class="meta">Zuletzt: ${escapeHtml(page.updated_at)} von ${escapeHtml(page.updated_by_name)}</p>
      <p>${escapeHtml(page.summary || '').slice(0, 120)}</p>
    </article>
  `).join('');

  Array.from(document.querySelectorAll('.page-item')).forEach((node) => {
    node.addEventListener('click', () => selectPage(Number(node.dataset.pageId)));
  });
}

async function selectPage(pageId) {
  state.selectedPageId = pageId;
  renderPageList();

  const [page, versions] = await Promise.all([
    request(`/pages/${pageId}`),
    request(`/pages/${pageId}/versions`),
  ]);

  const canEdit = state.user.role === 'admin' || state.user.role === 'editor';
  const canDelete = state.user.role === 'admin';

  qs('page-details').innerHTML = `
    <h3>${escapeHtml(page.title)}</h3>
    <p class="meta">Slug: ${escapeHtml(page.slug)} | Version: ${page.latest_version}</p>
    <p class="meta">Status: ${escapeHtml(page.status)} | Sichtbarkeit: ${page.is_public ? 'public' : 'intern'}</p>
    <p class="meta">Bereich: ${escapeHtml(page.area_name || 'Kein Bereich')}</p>
    <div class="page-body">${page.content}</div>

    <div class="actions" style="margin-top: 0.8rem;">
      ${canEdit ? '<button id="edit-page-btn">Bearbeiten</button>' : ''}
      ${canDelete ? '<button id="delete-page-btn" class="danger">Loeschen</button>' : ''}
    </div>

    <h3 style="margin-top: 1rem;">Versionen</h3>
    <div class="version-list">
      ${versions.map((version) => `
        <div class="version-item">
          <div>
            <strong>v${version.version_number}</strong>
            <div class="meta">${escapeHtml(version.edited_at)} von ${escapeHtml(version.edited_by_name)}</div>
            <div class="meta">${escapeHtml(version.note || '')}</div>
          </div>
          ${canEdit ? `<button class="ghost restore-btn" data-version="${version.version_number}">Restore</button>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  if (canEdit) {
    qs('edit-page-btn').addEventListener('click', () => openPageModal(page));
    Array.from(document.querySelectorAll('.restore-btn')).forEach((button) => {
      button.addEventListener('click', () => restoreVersion(page.id, Number(button.dataset.version)));
    });
  }

  if (canDelete) {
    qs('delete-page-btn').addEventListener('click', () => deletePage(page.id));
  }
}

async function restoreVersion(pageId, versionNumber) {
  if (!confirm(`Version ${versionNumber} wirklich wiederherstellen?`)) {
    return;
  }

  await request(`/pages/${pageId}/restore/${versionNumber}`, { method: 'POST' });
  await Promise.all([loadPages(), selectPage(pageId), loadDashboard()]);
}

function deletePage(pageId) {
  if (!confirm('Seite wirklich loeschen?')) {
    return;
  }

  request(`/pages/${pageId}`, { method: 'DELETE' })
    .then(async () => {
      state.selectedPageId = null;
      await Promise.all([loadPages(), loadDashboard()]);
      qs('page-details').innerHTML = '<p class="muted">Wähle eine Seite aus.</p>';
    })
    .catch((error) => alert(error.message));
}

function openPageModal(page = null) {
  if (state.user.role === 'viewer') {
    alert('Keine Berechtigung zum Bearbeiten.');
    return;
  }

  qs('page-modal-title').textContent = page ? 'Seite bearbeiten' : 'Neue Seite';
  qs('page-id').value = page ? page.id : '';
  qs('page-title').value = page?.title || '';
  qs('page-slug').value = page?.slug || '';
  qs('page-summary').value = page?.summary || '';
  qs('page-status').value = page?.status || 'draft';
  qs('page-public').checked = page ? page.is_public === 1 : true;
  qs('page-content').value = page?.content || '';
  qs('page-note').value = '';
  qs('page-area').value = page?.area_id || '';

  qs('page-modal').classList.remove('hidden');
}

function closePageModal() {
  qs('page-modal').classList.add('hidden');
}

async function onPageSubmit(event) {
  event.preventDefault();

  const pageId = qs('page-id').value;
  const body = {
    title: qs('page-title').value.trim(),
    slug: qs('page-slug').value.trim(),
    summary: qs('page-summary').value.trim(),
    area_id: qs('page-area').value,
    status: qs('page-status').value,
    is_public: qs('page-public').checked,
    note: qs('page-note').value.trim(),
    content: qs('page-content').value,
  };

  try {
    if (pageId) {
      await request(`/pages/${pageId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      state.selectedPageId = Number(pageId);
    } else {
      const created = await request('/pages', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      state.selectedPageId = created.id;
    }

    closePageModal();
    await Promise.all([loadPages(), loadDashboard()]);

    if (state.selectedPageId) {
      await selectPage(state.selectedPageId);
    }
  } catch (error) {
    alert(error.message);
  }
}

function openAreaModal() {
  if (state.user.role === 'viewer') {
    alert('Keine Berechtigung zum Erstellen von Bereichen.');
    return;
  }
  qs('area-name').value = '';
  qs('area-slug').value = '';
  qs('area-description').value = '';
  qs('area-modal').classList.remove('hidden');
}

function closeAreaModal() {
  qs('area-modal').classList.add('hidden');
}

async function onAreaSubmit(event) {
  event.preventDefault();
  try {
    await request('/areas', {
      method: 'POST',
      body: JSON.stringify({
        name: qs('area-name').value.trim(),
        slug: qs('area-slug').value.trim(),
        description: qs('area-description').value.trim(),
      }),
    });
    closeAreaModal();
    await loadAreas();
  } catch (error) {
    alert(error.message);
  }
}

async function onApplyFilter() {
  state.filter.q = qs('search-input').value.trim();
  state.filter.area_id = qs('area-filter').value;
  state.filter.status = qs('status-filter').value;
  state.selectedPageId = null;
  await loadPages();
  qs('page-details').innerHTML = '<p class="muted">Wähle eine Seite aus.</p>';
}

document.addEventListener('DOMContentLoaded', boot);
