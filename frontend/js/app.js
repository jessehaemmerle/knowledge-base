const API_BASE = '/api';

const state = {
  user: null,
  areas: [],
  pages: [],
  navPages: [],
  selectedPageId: null,
  filter: {
    q: '',
    area_id: '',
    status: '',
  },
  collapsedTreeNodes: new Set(),
  favorites: [],
  recentPages: [],
};
let quill = null;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) return null;

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try { payload = JSON.parse(raw); } catch (_) { payload = null; }
  }

  if (!response.ok) {
    if (payload && payload.error) throw new Error(payload.error);
    throw new Error(raw || 'Request failed');
  }

  return payload;
}

function qs(id) { return document.getElementById(id); }

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function setVisible(elementId, visible) { qs(elementId).classList.toggle('hidden', !visible); }

function recentStorageKey() {
  return state.user ? `kb_recent_pages_${state.user.id}` : 'kb_recent_pages';
}

function loadRecentPagesFromStorage() {
  try {
    const raw = localStorage.getItem(recentStorageKey());
    state.recentPages = raw ? JSON.parse(raw) : [];
  } catch (_) {
    state.recentPages = [];
  }
}

function persistRecentPages() {
  localStorage.setItem(recentStorageKey(), JSON.stringify(state.recentPages.slice(0, 15)));
}

function addRecentPage(page) {
  const entry = { id: page.id, title: page.title, area_name: page.area_name || '' };
  state.recentPages = [entry].concat(state.recentPages.filter((p) => p.id !== page.id)).slice(0, 15);
  persistRecentPages();
  renderRecentPages();
}

function isFavorite(pageId) {
  return state.favorites.some((f) => Number(f.id) === Number(pageId));
}

function renderFavorites() {
  const container = qs('favorites-list');
  if (!state.favorites.length) {
    container.innerHTML = '<div class="muted">Keine Favoriten.</div>';
    return;
  }

  container.innerHTML = state.favorites
    .map((item) => `<div class="mini-item" data-fav-id="${item.id}">${escapeHtml(item.title)}</div>`)
    .join('');

  Array.from(container.querySelectorAll('.mini-item')).forEach((node) => {
    node.addEventListener('click', () => selectPage(Number(node.dataset.favId)));
  });
}

function renderRecentPages() {
  const container = qs('recent-pages-list');
  if (!state.recentPages.length) {
    container.innerHTML = '<div class="muted">Noch keine zuletzt gesehenen Seiten.</div>';
    return;
  }

  container.innerHTML = state.recentPages
    .map((item) => `<div class="mini-item" data-recent-id="${item.id}">${escapeHtml(item.title)}</div>`)
    .join('');

  Array.from(container.querySelectorAll('.mini-item')).forEach((node) => {
    node.addEventListener('click', () => selectPage(Number(node.dataset.recentId)));
  });
}

function renderSpaceHome() {
  const spaceHome = qs('space-home');
  const details = qs('page-details');
  const areaId = state.filter.area_id;

  if (state.selectedPageId) {
    spaceHome.classList.add('hidden');
    details.classList.remove('hidden');
    return;
  }

  details.classList.add('hidden');
  spaceHome.classList.remove('hidden');

  if (!areaId) {
    spaceHome.innerHTML = '<h3>Willkommen</h3><p>Waehle links einen Space oder eine Seite. Du kannst auch die Suche oben verwenden.</p>';
    return;
  }

  const area = state.areas.find((a) => String(a.id) === String(areaId));
  const roots = state.navPages.filter((p) => String(p.area_id) === String(areaId) && !p.parent_id);
  const rootList = roots.length
    ? `<ul>${roots.slice(0, 8).map((p) => `<li>${escapeHtml(p.title)}</li>`).join('')}</ul>`
    : '<p>Noch keine Root-Seiten in diesem Space.</p>';

  spaceHome.innerHTML = `
    <h3>${escapeHtml(area ? area.name : 'Space')}</h3>
    <p>${escapeHtml(area?.description || 'Space-Startseite')}</p>
    <p><strong>Root-Seiten:</strong></p>
    ${rootList}
  `;
}

async function boot() {
  bindEvents();
  try {
    const setup = await request('/setup/status');
    if (setup.setup_required) return showSetup();

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

function showSetup() {
  setVisible('setup-view', true);
  setVisible('login-view', false);
  setVisible('app-view', false);
}

function showLogin() {
  setVisible('setup-view', false);
  setVisible('login-view', true);
  setVisible('app-view', false);
}

function showApp() {
  setVisible('setup-view', false);
  setVisible('login-view', false);
  setVisible('app-view', true);
  closePageEditor();
  qs('welcome-user').textContent = `Angemeldet als ${state.user.display_name} (${state.user.role})`;
}

function bindEvents() {
  qs('setup-form').addEventListener('submit', onSetupSubmit);
  qs('login-form').addEventListener('submit', onLogin);
  qs('logout-btn').addEventListener('click', onLogout);

  qs('new-page-btn').addEventListener('click', () => openPageModal());
  qs('new-area-btn').addEventListener('click', () => openAreaModal());
  qs('cancel-page-btn').addEventListener('click', closePageEditor);
  qs('cancel-page-btn-bottom').addEventListener('click', closePageEditor);
  qs('cancel-area-btn').addEventListener('click', closeAreaModal);

  qs('page-form').addEventListener('submit', onPageSubmit);
  qs('area-form').addEventListener('submit', onAreaSubmit);

  qs('apply-filter-btn').addEventListener('click', onApplyFilter);
  qs('search-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') onApplyFilter();
  });

  qs('nav-all').addEventListener('click', () => applyQuickNav(''));
  qs('nav-drafts').addEventListener('click', () => applyQuickNav('draft'));
  qs('nav-published').addEventListener('click', () => applyQuickNav('published'));
  initQuillEditor();

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      qs('search-input').focus();
    }
  });
}

function showEditorView() {
  qs('workspace').classList.add('hidden');
  qs('page-editor-view').classList.remove('hidden');
}

function closePageEditor() {
  qs('page-editor-view').classList.add('hidden');
  qs('workspace').classList.remove('hidden');
}

function initQuillEditor() {
  if (quill !== null) return;
  if (typeof Quill === 'undefined') {
    alert('Der WYSIWYG-Editor konnte nicht geladen werden. Bitte Internetzugriff auf cdn.jsdelivr.net pruefen.');
    return;
  }

  quill = new Quill('#page-content-editor', {
    theme: 'snow',
    placeholder: 'Schreibe den Seiteninhalt...',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ header: [2, 3, false] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block', 'link'],
        ['clean'],
      ],
    },
  });
}

function getEditorHtml() {
  if (!quill) return '';
  return quill.root.innerHTML.trim();
}

function setEditorHtml(html) {
  if (!quill) return;
  if (html && html.trim()) {
    quill.root.innerHTML = html;
  } else {
    quill.setText('');
  }
}

function editorHasText() {
  if (!quill) return false;
  return quill.getText().trim().length > 0;
}

function applyQuickNav(status) {
  state.filter.status = status;
  state.filter.area_id = '';
  qs('status-filter').value = status;
  qs('area-filter').value = '';
  updateQuickNavButtons();
  onApplyFilter();
}

function updateQuickNavButtons() {
  const mapping = { '': 'nav-all', draft: 'nav-drafts', published: 'nav-published' };
  ['nav-all', 'nav-drafts', 'nav-published'].forEach((id) => qs(id).classList.remove('active-nav'));
  qs(mapping[state.filter.status] || 'nav-all').classList.add('active-nav');
}

function buildNavQuery() {
  const params = new URLSearchParams();
  if (state.filter.area_id) params.set('area_id', state.filter.area_id);
  if (state.filter.status) params.set('status', state.filter.status);
  const query = params.toString();
  return query ? `?${query}` : '';
}

async function loadNavPages() {
  state.navPages = await request(`/pages${buildNavQuery()}`);
  renderPageTree();
}

function renderPageTree() {
  const container = qs('page-tree');
  if (!state.navPages.length) {
    container.innerHTML = '<div class="muted">Keine Seiten.</div>';
    return;
  }

  const byId = new Map(state.navPages.map((p) => [p.id, { ...p, children: [] }]));
  const roots = [];

  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id) && node.parent_id !== node.id) {
      byId.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title, 'de', { sensitivity: 'base' }));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  const rows = [];
  const walk = (node, depth) => {
    const hasChildren = node.children.length > 0;
    const collapsed = state.collapsedTreeNodes.has(node.id);
    const toggleChar = collapsed ? '+' : '-';

    rows.push(`
      <div class="tree-row" style="padding-left:${depth * 14 + 4}px;" data-page-id="${node.id}">
        <button type="button" class="tree-toggle ${hasChildren ? '' : 'empty'}" data-toggle-id="${node.id}">${hasChildren ? toggleChar : ''}</button>
        <div class="tree-title ${node.id === state.selectedPageId ? 'active' : ''}" data-title-id="${node.id}" title="${escapeHtml(node.title)}">${escapeHtml(node.title)}</div>
      </div>
    `);
    if (!collapsed) {
      node.children.forEach((child) => walk(child, depth + 1));
    }
  };
  roots.forEach((root) => walk(root, 0));

  container.innerHTML = rows.join('');

  Array.from(container.querySelectorAll('.tree-toggle')).forEach((button) => {
    if (button.classList.contains('empty')) return;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = Number(button.dataset.toggleId);
      if (state.collapsedTreeNodes.has(id)) {
        state.collapsedTreeNodes.delete(id);
      } else {
        state.collapsedTreeNodes.add(id);
      }
      renderPageTree();
    });
  });

  Array.from(container.querySelectorAll('.tree-title')).forEach((title) => {
    title.addEventListener('click', () => selectPage(Number(title.dataset.titleId)));
  });
}

function renderAreaNav() {
  const list = qs('area-nav-list');
  const allItemClass = state.filter.area_id === '' ? 'active' : '';
  const items = [`<li class="${allItemClass}" data-area-id="">Alle Bereiche</li>`]
    .concat(state.areas.map((area) => {
      const isActive = String(area.id) === String(state.filter.area_id);
      return `<li class="${isActive ? 'active' : ''}" data-area-id="${area.id}">${escapeHtml(area.name)}</li>`;
    }))
    .join('');

  list.innerHTML = items;

  Array.from(list.querySelectorAll('li')).forEach((li) => {
    li.addEventListener('click', async () => {
      state.filter.area_id = li.dataset.areaId || '';
      qs('area-filter').value = state.filter.area_id;
      state.selectedPageId = null;
      await Promise.all([loadNavPages(), loadPages()]);
      setBreadcrumb();
      renderAreaNav();
      renderSpaceHome();
    });
  });
}

function setBreadcrumb(page = null) {
  const parts = ['Home'];

  if (state.filter.area_id) {
    const area = state.areas.find((a) => String(a.id) === String(state.filter.area_id));
    if (area) parts.push(area.name);
  } else if (page && page.area_name) {
    parts.push(page.area_name);
  }

  if (page) {
    const map = new Map(state.navPages.map((p) => [p.id, p]));
    const chain = [];
    let current = page;
    const guard = new Set();

    while (current && current.parent_id && map.has(current.parent_id) && !guard.has(current.parent_id)) {
      guard.add(current.parent_id);
      const parent = map.get(current.parent_id);
      chain.unshift(parent.title);
      current = parent;
    }

    parts.push(...chain);
    parts.push(page.title);
  }

  qs('breadcrumb').textContent = parts.join(' / ');
}

function populateParentOptions(currentPage = null) {
  const select = qs('page-parent');
  const currentId = currentPage ? Number(currentPage.id) : null;

  const childrenMap = new Map();
  state.navPages.forEach((p) => {
    if (!childrenMap.has(p.parent_id)) childrenMap.set(p.parent_id, []);
    childrenMap.get(p.parent_id).push(p.id);
  });

  const blocked = new Set();
  if (currentId !== null) {
    blocked.add(currentId);
    const stack = [currentId];
    while (stack.length) {
      const id = stack.pop();
      const kids = childrenMap.get(id) || [];
      kids.forEach((k) => {
        if (!blocked.has(k)) {
          blocked.add(k);
          stack.push(k);
        }
      });
    }
  }

  const options = ['<option value="">-- Kein Parent --</option>']
    .concat(
      state.navPages
        .filter((p) => !blocked.has(p.id))
        .map((p) => `<option value="${p.id}">${escapeHtml(p.title)}</option>`)
    )
    .join('');

  select.innerHTML = options;
  select.value = currentPage?.parent_id || '';
}

async function onSetupSubmit(event) {
  event.preventDefault();
  const errorBox = qs('setup-error');
  errorBox.classList.add('hidden');

  const password = qs('setup-password').value;
  const passwordConfirm = qs('setup-password-confirm').value;
  if (password !== passwordConfirm) {
    errorBox.textContent = 'Passwoerter stimmen nicht ueberein.';
    errorBox.classList.remove('hidden');
    return;
  }

  try {
    const payload = await request('/setup/initialize', {
      method: 'POST',
      body: JSON.stringify({
        display_name: qs('setup-display-name').value.trim(),
        username: qs('setup-username').value.trim(),
        password,
      }),
    });

    state.user = payload.user;
    await loadApp();
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove('hidden');
  }
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
  state.favorites = [];
  state.recentPages = [];
  closePageEditor();
  showLogin();
}

async function loadFavorites() {
  state.favorites = await request('/favorites');
  renderFavorites();
}

async function loadApp() {
  showApp();
  updateQuickNavButtons();
  loadRecentPagesFromStorage();
  renderRecentPages();
  await Promise.all([loadAreas(), loadNavPages(), loadPages(), loadDashboard(), loadFavorites()]);
  setBreadcrumb();
  renderSpaceHome();
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
  qs('area-filter').value = state.filter.area_id;

  const pageAreaOptions = ['<option value="">-- Kein Bereich --</option>']
    .concat(state.areas.map((area) => `<option value="${area.id}">${escapeHtml(area.name)}</option>`))
    .join('');
  qs('page-area').innerHTML = pageAreaOptions;

  renderAreaNav();
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
    const stillPresent = state.navPages.some((page) => page.id === state.selectedPageId);
    if (!stillPresent) {
      state.selectedPageId = null;
      qs('page-details').innerHTML = '<p class="muted">Waehle eine Seite aus.</p>';
      setBreadcrumb();
      renderSpaceHome();
    }
  }
}

function renderPageList() {
  const list = qs('page-list');
  qs('pages-count').textContent = `${state.pages.length} Eintraege`;

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
  renderPageTree();
  renderSpaceHome();

  const [page, versions] = await Promise.all([request(`/pages/${pageId}`), request(`/pages/${pageId}/versions`)]);

  setBreadcrumb(page);

  const currentIndex = state.pages.findIndex((entry) => entry.id === pageId);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex >= 0 && currentIndex < state.pages.length - 1;

  const canEdit = state.user.role === 'admin' || state.user.role === 'editor';
  const canDelete = state.user.role === 'admin';
  const favLabel = isFavorite(page.id) ? 'Unstar' : 'Star';

  qs('page-details').innerHTML = `
    <h3>${escapeHtml(page.title)}</h3>
    <p class="meta">Slug: ${escapeHtml(page.slug)} | Version: ${page.latest_version}</p>
    <p class="meta">Status: ${escapeHtml(page.status)} | Sichtbarkeit: ${page.is_public ? 'public' : 'intern'}</p>
    <p class="meta">Bereich: ${escapeHtml(page.area_name || 'Kein Bereich')}</p>
    <div class="page-body">${page.content}</div>

    <div class="detail-nav">
      <button id="prev-page-btn" class="ghost" ${canPrev ? '' : 'disabled'}>Vorherige Seite</button>
      <button id="next-page-btn" class="ghost" ${canNext ? '' : 'disabled'}>Naechste Seite</button>
    </div>

    <div class="actions" style="margin-top: 0.8rem;">
      <button id="favorite-page-btn" class="ghost">${favLabel}</button>
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

  if (canPrev) qs('prev-page-btn').addEventListener('click', () => selectPage(state.pages[currentIndex - 1].id));
  if (canNext) qs('next-page-btn').addEventListener('click', () => selectPage(state.pages[currentIndex + 1].id));
  qs('favorite-page-btn').addEventListener('click', () => toggleFavorite(page.id));

  if (canEdit) {
    qs('edit-page-btn').addEventListener('click', () => openPageModal(page));
    Array.from(document.querySelectorAll('.restore-btn')).forEach((button) => {
      button.addEventListener('click', () => restoreVersion(page.id, Number(button.dataset.version)));
    });
  }

  if (canDelete) qs('delete-page-btn').addEventListener('click', () => deletePage(page.id));
  addRecentPage(page);
}

async function toggleFavorite(pageId) {
  if (isFavorite(pageId)) {
    await request(`/favorites/${pageId}`, { method: 'DELETE' });
  } else {
    await request(`/favorites/${pageId}`, { method: 'POST' });
  }
  await loadFavorites();
  if (state.selectedPageId === pageId) {
    await selectPage(pageId);
  }
}

async function restoreVersion(pageId, versionNumber) {
  if (!confirm(`Version ${versionNumber} wirklich wiederherstellen?`)) return;
  await request(`/pages/${pageId}/restore/${versionNumber}`, { method: 'POST' });
  await Promise.all([loadNavPages(), loadPages(), selectPage(pageId), loadDashboard()]);
}

function deletePage(pageId) {
  if (!confirm('Seite wirklich loeschen?')) return;

  request(`/pages/${pageId}`, { method: 'DELETE' })
    .then(async () => {
      state.selectedPageId = null;
      await Promise.all([loadNavPages(), loadPages(), loadDashboard()]);
      await loadFavorites();
      qs('page-details').innerHTML = '<p class="muted">Waehle eine Seite aus.</p>';
      setBreadcrumb();
      renderSpaceHome();
    })
    .catch((error) => alert(error.message));
}

function openPageModal(page = null) {
  if (state.user.role === 'viewer') return alert('Keine Berechtigung zum Bearbeiten.');

  qs('page-editor-title').textContent = page ? 'Seite bearbeiten' : 'Neue Seite erstellen';
  qs('page-id').value = page ? page.id : '';
  qs('page-title').value = page?.title || '';
  qs('page-slug').value = page?.slug || '';
  qs('page-summary').value = page?.summary || '';
  qs('page-status').value = page?.status || 'draft';
  qs('page-public').checked = page ? page.is_public === 1 : true;
  setEditorHtml(page?.content || '');
  qs('page-note').value = '';
  qs('page-area').value = page?.area_id || '';
  populateParentOptions(page);
  showEditorView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function onPageSubmit(event) {
  event.preventDefault();

  const pageId = qs('page-id').value;
  const body = {
    title: qs('page-title').value.trim(),
    slug: qs('page-slug').value.trim(),
    summary: qs('page-summary').value.trim(),
    area_id: qs('page-area').value,
    parent_id: qs('page-parent').value,
    status: qs('page-status').value,
    is_public: qs('page-public').checked,
    note: qs('page-note').value.trim(),
    content: getEditorHtml(),
  };

  if (!editorHasText()) {
    return alert('Bitte Inhalt fuer die Seite eingeben.');
  }

  try {
    if (pageId) {
      await request(`/pages/${pageId}`, { method: 'PUT', body: JSON.stringify(body) });
      state.selectedPageId = Number(pageId);
    } else {
      const created = await request('/pages', { method: 'POST', body: JSON.stringify(body) });
      state.selectedPageId = created.id;
    }

    closePageEditor();
    await Promise.all([loadNavPages(), loadPages(), loadDashboard(), loadFavorites()]);
    if (state.selectedPageId) await selectPage(state.selectedPageId);
  } catch (error) {
    alert(error.message);
  }
}

function openAreaModal() {
  if (state.user.role === 'viewer') return alert('Keine Berechtigung zum Erstellen von Bereichen.');
  qs('area-name').value = '';
  qs('area-slug').value = '';
  qs('area-description').value = '';
  qs('area-modal').classList.remove('hidden');
}

function closeAreaModal() { qs('area-modal').classList.add('hidden'); }

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

  updateQuickNavButtons();
  await Promise.all([loadNavPages(), loadPages()]);
  renderAreaNav();
  setBreadcrumb();
  qs('page-details').innerHTML = '<p class="muted">Waehle eine Seite aus.</p>';
  renderSpaceHome();
}

document.addEventListener('DOMContentLoaded', boot);
