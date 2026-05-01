// ── State ────────────────────────────────────────────────────────────────────
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  tasks: [],
  projects: [],
  users: [],
  currentPage: 'dashboard',
  taskFilter: 'all',
  modalType: null,
  editId: null,
};

const API = '';

// ── API Helper ────────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (state.token) opts.headers['Authorization'] = `Bearer ${state.token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API}/api${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  clearAuthError();
  try {
    const data = await api('POST', '/auth/login', { email, password });
    setAuth(data.token, data.user);
    await loadApp();
  } catch (e) {
    showAuthError(e.message);
  }
}

async function signup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  clearAuthError();
  try {
    const data = await api('POST', '/auth/signup', { name, email, password });
    setAuth(data.token, data.user);
    await loadApp();
  } catch (e) {
    showAuthError(e.message);
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  state.token = null;
  state.user = null;
  document.getElementById('auth-screen').style.display = '';
  document.getElementById('app-screen').style.display = 'none';
}

function setAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearAuthError() {
  const el = document.getElementById('auth-error');
  el.style.display = 'none';
  el.textContent = '';
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
}

function switchAuthTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (tab === 'login' ? 0 : 1) === i);
  });
  document.getElementById('login-form').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? '' : 'none';
  clearAuthError();
}

// ── App Init ──────────────────────────────────────────────────────────────────
async function loadApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = '';

  // Show/hide admin-only UI
  document.querySelectorAll('.admin-only').forEach((el) => {
    el.style.display = state.user.role === 'admin' ? '' : 'none';
  });

  // Render topbar user
  renderUserPill();

  await fetchAll();
  navigate('dashboard');
}

async function fetchAll() {
  try {
    const [tasks, projects, users] = await Promise.all([
      api('GET', '/tasks'),
      api('GET', '/projects'),
      api('GET', '/users'),
    ]);
    state.tasks = tasks;
    state.projects = projects;
    state.users = users;
  } catch (e) {
    toast('Failed to load data: ' + e.message);
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────
function navigate(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach((p) => (p.style.display = 'none'));
  document.getElementById(`page-${page}`).style.display = '';

  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  const navBtns = document.querySelectorAll('.nav-btn');
  const pages = ['dashboard', 'tasks', 'projects', 'team'];
  const idx = pages.indexOf(page);
  if (idx >= 0) navBtns[idx].classList.add('active');

  if (page === 'dashboard') renderDashboard();
  if (page === 'tasks') renderTasks();
  if (page === 'projects') renderProjects();
  if (page === 'team') renderTeam();
}

// ── Render Helpers ────────────────────────────────────────────────────────────
const COLORS = ['#dbeafe:#2563eb', '#dcfce7:#16a34a', '#fef3c7:#b45309', '#fce7f3:#be185d'];

function userColor(user) {
  const colors = [
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#dcfce7', text: '#15803d' },
    { bg: '#fef3c7', text: '#78350f' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#ede9fe', text: '#6d28d9' },
  ];
  const idx = parseInt(user.id, 16) % colors.length || user.name.charCodeAt(0) % colors.length;
  return colors[idx] || colors[0];
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function avatarHTML(user, size = 28) {
  const c = userColor(user);
  return `<div class="mini-avatar" style="width:${size}px;height:${size}px;background:${c.bg};color:${c.text}">${initials(user.name)}</div>`;
}

function statusLabel(s) {
  return { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' }[s] || s;
}

function effectiveStatus(task) {
  if (task.status === 'done') return 'done';
  const today = new Date().toISOString().split('T')[0];
  if (task.dueDate && task.dueDate < today) return 'overdue';
  return task.status;
}

function renderUserPill() {
  const u = state.user;
  const c = userColor(u);
  document.getElementById('user-pill').innerHTML = `
    <div class="user-avatar" style="background:${c.bg};color:${c.text}">${initials(u.name)}</div>
    <span>${u.name.split(' ')[0]}</span>
    <span class="role-badge role-${u.role}">${u.role}</span>
  `;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard() {
  const myTasks = state.tasks.filter((t) => t.assigneeId === state.user.id && t.status !== 'done');
  const done = state.tasks.filter((t) => t.status === 'done').length;
  const inProg = state.tasks.filter((t) => t.status === 'in_progress').length;
  const today = new Date().toISOString().split('T')[0];
  const overdue = state.tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'done').length;

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card stat-blue"><div class="stat-num">${state.tasks.length}</div><div class="stat-lbl">Total Tasks</div></div>
    <div class="stat-card stat-green"><div class="stat-num">${done}</div><div class="stat-lbl">Completed</div></div>
    <div class="stat-card stat-amber"><div class="stat-num">${inProg}</div><div class="stat-lbl">In Progress</div></div>
    <div class="stat-card stat-red"><div class="stat-num">${overdue}</div><div class="stat-lbl">Overdue</div></div>
  `;

  const myList = document.getElementById('my-tasks-list');
  if (myTasks.length === 0) {
    myList.innerHTML = '<div class="empty"><div class="empty-icon">✅</div>All caught up!</div>';
  } else {
    myList.innerHTML = myTasks.slice(0, 5).map((t) => taskCardHTML(t, false)).join('');
  }

  const projList = document.getElementById('projects-overview');
  projList.innerHTML = state.projects.map((p) => `
    <div class="project-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><div class="project-name">${p.name}</div><div class="project-desc">${p.description}</div></div>
        <span style="font-size:14px;font-weight:600;color:#2563eb">${p.progress}%</span>
      </div>
      <div class="project-progress">
        <div class="progress-label"><span>${p.doneCount}/${p.taskCount} tasks</span><span>${p.overdueCount > 0 ? `<span style="color:#dc2626">${p.overdueCount} overdue</span>` : 'on track'}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${p.progress}%"></div></div>
      </div>
    </div>
  `).join('');
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
function renderTasks() {
  const filters = [
    ['all', 'All'],
    ['todo', 'To Do'],
    ['in_progress', 'In Progress'],
    ['review', 'Review'],
    ['done', 'Done'],
    ['overdue', 'Overdue'],
  ];

  document.getElementById('task-filters').innerHTML = filters.map(([k, l]) =>
    `<div class="filter-chip ${state.taskFilter === k ? 'active' : ''}" onclick="setTaskFilter('${k}')">${l}</div>`
  ).join('');

  let filtered = [...state.tasks];
  if (state.taskFilter !== 'all') {
    if (state.taskFilter === 'overdue') {
      filtered = filtered.filter((t) => effectiveStatus(t) === 'overdue');
    } else {
      filtered = filtered.filter((t) => t.status === state.taskFilter && effectiveStatus(t) !== 'overdue');
    }
  }

  const list = document.getElementById('tasks-list');
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">📋</div>No tasks found</div>';
  } else {
    list.innerHTML = filtered.map((t) => taskCardHTML(t, true)).join('');
  }
}

function taskCardHTML(task, showActions) {
  const st = effectiveStatus(task);
  const stLabel = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done', overdue: 'Overdue' }[st];
  const assignee = state.users.find((u) => u.id === task.assigneeId) || { name: 'Unknown', id: '0' };
  const project = state.projects.find((p) => p.id === task.projectId);
  const isOverdue = st === 'overdue';
  const canEdit = state.user.role === 'admin' || task.assigneeId === state.user.id;

  const nextStatus = { todo: 'in_progress', in_progress: 'review', review: 'done' };
  const nextLabel = { todo: '→ Start', in_progress: '→ Review', review: '→ Done' };

  return `
    <div class="task-card">
      <div class="task-top">
        <div class="priority-dot p-${task.priority}" title="Priority: ${task.priority}"></div>
        <div style="flex:1">
          <div class="task-title ${task.status === 'done' ? 'done' : ''}">${task.title}</div>
          ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
        </div>
        ${state.user.role === 'admin' ? `<button class="btn-danger" onclick="deleteTask('${task.id}')">✕</button>` : ''}
      </div>
      <div class="task-meta">
        <span class="status-pill s-${st}">${stLabel}</span>
        ${avatarHTML(assignee, 22)}
        <span style="font-size:13px;color:#6b6b68">${assignee.name.split(' ')[0]}</span>
        ${task.dueDate ? `<span class="due-text ${isOverdue ? 'due-overdue' : ''}">Due ${task.dueDate}</span>` : ''}
        ${project ? `<span style="font-size:12px;color:#6b6b68">· ${project.name}</span>` : ''}
      </div>
      ${canEdit && showActions && task.status !== 'done' ? `
        <div class="task-actions">
          ${state.user.role === 'admin' ? `<button class="btn-secondary" onclick="openEditTask('${task.id}')">Edit</button>` : ''}
          <button class="btn-secondary" onclick="advanceTask('${task.id}', '${nextStatus[task.status]}')">${nextLabel[task.status]}</button>
        </div>
      ` : ''}
      ${canEdit && showActions && task.status === 'done' && state.user.role === 'admin' ? `
        <div class="task-actions">
          <button class="btn-secondary" onclick="advanceTask('${task.id}', 'todo')">↩ Reopen</button>
        </div>
      ` : ''}
    </div>
  `;
}

function setTaskFilter(f) {
  state.taskFilter = f;
  renderTasks();
}

async function advanceTask(id, newStatus) {
  try {
    const updated = await api('PUT', `/tasks/${id}`, { status: newStatus });
    const idx = state.tasks.findIndex((t) => t.id === id);
    if (idx >= 0) state.tasks[idx] = updated;
    await fetchAll();
    navigate(state.currentPage);
    toast('Task updated');
  } catch (e) {
    toast('Error: ' + e.message);
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await api('DELETE', `/tasks/${id}`);
    await fetchAll();
    navigate(state.currentPage);
    toast('Task deleted');
  } catch (e) {
    toast('Error: ' + e.message);
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────
function renderProjects() {
  const list = document.getElementById('projects-list');
  if (state.projects.length === 0) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">📁</div>No projects yet</div>';
    return;
  }
  list.innerHTML = state.projects.map((p) => `
    <div class="project-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="project-name">${p.name}</div>
          <div class="project-desc">${p.description || 'No description'}</div>
        </div>
        <span style="font-size:15px;font-weight:700;color:#2563eb">${p.progress}%</span>
      </div>
      <div class="project-progress">
        <div class="progress-label">
          <span>${p.doneCount}/${p.taskCount} tasks done</span>
          ${p.overdueCount > 0 ? `<span style="color:#dc2626;font-weight:500">${p.overdueCount} overdue</span>` : '<span style="color:#16a34a">On track</span>'}
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${p.progress}%"></div></div>
      </div>
      <div class="project-footer">
        <div class="member-stack">
          ${(p.members || []).slice(0, 5).map((m) => avatarHTML(m, 28)).join('')}
          ${(p.members || []).length > 5 ? `<span style="font-size:12px;color:#6b6b68;margin-left:8px">+${p.members.length - 5}</span>` : ''}
        </div>
        ${state.user.role === 'admin' ? `<button class="btn-danger" onclick="deleteProject('${p.id}')">Delete</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function deleteProject(id) {
  if (!confirm('Delete project and all its tasks?')) return;
  try {
    await api('DELETE', `/projects/${id}`);
    await fetchAll();
    renderProjects();
    toast('Project deleted');
  } catch (e) {
    toast('Error: ' + e.message);
  }
}

// ── Team ──────────────────────────────────────────────────────────────────────
function renderTeam() {
  const list = document.getElementById('team-list');
  list.innerHTML = state.users.map((u) => {
    const c = userColor(u);
    const myTasks = state.tasks.filter((t) => t.assigneeId === u.id);
    const done = myTasks.filter((t) => t.status === 'done').length;
    return `
      <div class="team-card">
        <div class="team-avatar" style="background:${c.bg};color:${c.text}">${initials(u.name)}</div>
        <div class="team-info">
          <div class="team-name">${u.name} ${u.id === state.user.id ? '<span style="font-size:12px;color:#6b6b68">(you)</span>' : ''}</div>
          <div class="team-email">${u.email}</div>
          <span class="role-badge role-${u.role}" style="margin-top:4px;display:inline-block">${u.role}</span>
        </div>
        <div class="team-stats">
          <div style="font-size:15px;font-weight:600">${done}/${myTasks.length}</div>
          <div>tasks done</div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Modals ────────────────────────────────────────────────────────────────────
function openModal(type, id = null) {
  state.modalType = type;
  state.editId = id;
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const confirm = document.getElementById('modal-confirm');

  overlay.style.display = 'flex';

  if (type === 'task') {
    const task = id ? state.tasks.find((t) => t.id === id) : null;
    title.textContent = task ? 'Edit Task' : 'New Task';
    confirm.textContent = task ? 'Update' : 'Create Task';
    confirm.onclick = submitTask;
    body.innerHTML = `
      <div class="form-group"><label>Title *</label><input id="f-title" value="${task ? task.title : ''}" placeholder="Task title" /></div>
      <div class="form-group"><label>Description</label><textarea id="f-desc" placeholder="Optional description">${task ? task.description : ''}</textarea></div>
      <div class="form-group"><label>Project *</label>
        <select id="f-project">
          ${state.projects.map((p) => `<option value="${p.id}" ${task && task.projectId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Assign To *</label>
        <select id="f-assignee">
          ${state.users.map((u) => `<option value="${u.id}" ${task && task.assigneeId === u.id ? 'selected' : ''}>${u.name} (${u.role})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Priority</label>
        <select id="f-priority">
          ${['low', 'medium', 'high'].map((p) => `<option value="${p}" ${task && task.priority === p ? 'selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Status</label>
        <select id="f-status">
          ${['todo', 'in_progress', 'review', 'done'].map((s) => `<option value="${s}" ${task && task.status === s ? 'selected' : ''}>${statusLabel(s)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Due Date</label><input type="date" id="f-due" value="${task && task.dueDate ? task.dueDate : ''}" /></div>
    `;
  }

  if (type === 'project') {
    title.textContent = 'New Project';
    confirm.textContent = 'Create Project';
    confirm.onclick = submitProject;
    body.innerHTML = `
      <div class="form-group"><label>Name *</label><input id="f-pname" placeholder="Project name" /></div>
      <div class="form-group"><label>Description</label><input id="f-pdesc" placeholder="Short description" /></div>
      <div class="form-group"><label>Add Members</label>
        <div style="max-height:180px;overflow-y:auto;border:1px solid #e2e0d8;border-radius:6px;padding:8px;">
          ${state.users.map((u) => `
            <label style="display:flex;align-items:center;gap:10px;padding:6px;cursor:pointer">
              <input type="checkbox" value="${u.id}" checked />
              ${avatarHTML(u, 24)} ${u.name}
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }
}

function openEditTask(id) {
  openModal('task', id);
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  closeModalDirect();
}

function closeModalDirect() {
  document.getElementById('modal-overlay').style.display = 'none';
  state.modalType = null;
  state.editId = null;
}

async function submitTask() {
  const title = document.getElementById('f-title').value.trim();
  const description = document.getElementById('f-desc').value.trim();
  const projectId = document.getElementById('f-project').value;
  const assigneeId = document.getElementById('f-assignee').value;
  const priority = document.getElementById('f-priority').value;
  const status = document.getElementById('f-status').value;
  const dueDate = document.getElementById('f-due').value;

  if (!title) return toast('Title is required');

  try {
    if (state.editId) {
      const updated = await api('PUT', `/tasks/${state.editId}`, { title, description, projectId, assigneeId, priority, status, dueDate: dueDate || null });
      const idx = state.tasks.findIndex((t) => t.id === state.editId);
      if (idx >= 0) state.tasks[idx] = updated;
      toast('Task updated');
    } else {
      const newTask = await api('POST', '/tasks', { title, description, projectId, assigneeId, priority, status, dueDate: dueDate || null });
      state.tasks.push(newTask);
      toast('Task created');
    }
    await fetchAll();
    closeModalDirect();
    navigate(state.currentPage);
  } catch (e) {
    toast('Error: ' + e.message);
  }
}

async function submitProject() {
  const name = document.getElementById('f-pname').value.trim();
  const description = document.getElementById('f-pdesc').value.trim();
  const memberIds = [...document.querySelectorAll('#modal-body input[type=checkbox]:checked')].map((cb) => cb.value);

  if (!name) return toast('Project name is required');

  try {
    const proj = await api('POST', '/projects', { name, description, memberIds });
    state.projects.push(proj);
    toast('Project created');
    await fetchAll();
    closeModalDirect();
    navigate(state.currentPage);
  } catch (e) {
    toast('Error: ' + e.message);
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  if (state.token && state.user) {
    try {
      const data = await api('GET', '/auth/me');
      state.user = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      await loadApp();
    } catch {
      logout();
    }
  }
})();
