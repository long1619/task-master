/**
 * TaskMaster Pro - Frontend Application Core (Level 3 Production-Ready)
 * Luxury Dark Glassmorphism UI with Prisma ORM, Zod, Multer & Google Gemini AI
 */

const API_BASE = '/api/v1';
const TOKEN_KEY = 'taskmaster_jwt_token';
const REFRESH_TOKEN_KEY = 'taskmaster_refresh_token';
const USER_KEY = 'taskmaster_current_user';
const NOTIF_ENABLED_KEY = 'taskmaster_browser_notif_enabled';

// ==================== APP STATE ====================
let authToken = localStorage.getItem(TOKEN_KEY) || null;
let refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || null;
let currentUser = null;

let currentTodos = [];
let currentPagination = {
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  limit: 10,
  hasNextPage: false,
  hasPrevPage: false
};

let statusFilter = 'all';
let priorityFilter = 'all';
let sortBy = 'createdAt:desc';
let searchQuery = '';
let searchDebounceTimer = null;

let selectedCreateFile = null;
let currentViewMode = 'list';
let draggedTodoId = null;

let browserNotifEnabled = localStorage.getItem(NOTIF_ENABLED_KEY) === 'true';
let notifiedTaskIds = new Set();
let notifSchedulerInterval = null;

// ==================== NEW FEATURES STATE ====================
const THEME_KEY = 'taskmaster_theme';
let currentTheme = localStorage.getItem(THEME_KEY) || 'light';
let selectedTaskIds = new Set();
let calendarCurrentDate = new Date();
let selectedImportFile = null;

// ==================== COLLABORATION & RBAC STATE ====================
let currentWorkspaces = [];
let activeWorkspaceId = null;
let activeEditTaskId = null;
let adminUsersList = [];
let workspaceMembersCache = new Map(); // wsId -> members array

// ==================== DOM ELEMENTS ====================
// Status & Nav
const dbStatusBadge = document.getElementById('dbStatusBadge');
const dbStatusText = document.getElementById('dbStatusText');
const seedDemoBtn = document.getElementById('seedDemoBtn');

// New Header Controls: Trash, Analytics, Notification & Logout All
const trashCountBadge = document.getElementById('trashCountBadge');
const openTrashBtn = document.getElementById('openTrashBtn');
const openAnalyticsBtn = document.getElementById('openAnalyticsBtn');
const toggleNotificationBtn = document.getElementById('toggleNotificationBtn');
const bellIcon = document.getElementById('bellIcon');
const notificationBtnText = document.getElementById('notificationBtnText');
const logoutAllBtn = document.getElementById('logoutAllBtn');

// Trash Modal Elements
const trashModalOverlay = document.getElementById('trashModalOverlay');
const closeTrashModalBtn = document.getElementById('closeTrashModalBtn');
const trashListContainer = document.getElementById('trashListContainer');
const emptyTrashModalBtn = document.getElementById('emptyTrashModalBtn');

// Permanent Delete & Empty Trash Stacked Modals
const permanentDeleteModal = document.getElementById('permanentDeleteModal');
const closePermanentDeleteModalBtn = document.getElementById('closePermanentDeleteModalBtn');
const cancelPermanentDeleteModalBtn = document.getElementById('cancelPermanentDeleteModalBtn');
const submitPermanentDeleteModalBtn = document.getElementById('submitPermanentDeleteModalBtn');
const confirmPermanentDeleteTaskTitle = document.getElementById('confirmPermanentDeleteTaskTitle');

const emptyTrashConfirmModal = document.getElementById('emptyTrashConfirmModal');
const closeEmptyTrashConfirmBtn = document.getElementById('closeEmptyTrashConfirmBtn');
const cancelEmptyTrashConfirmBtn = document.getElementById('cancelEmptyTrashConfirmBtn');
const submitEmptyTrashConfirmBtn = document.getElementById('submitEmptyTrashConfirmBtn');
const emptyTrashConfirmMsg = document.getElementById('emptyTrashConfirmMsg');

// Analytics Modal Elements
const analyticsModalOverlay = document.getElementById('analyticsModalOverlay');
const closeAnalyticsModalBtn = document.getElementById('closeAnalyticsModalBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const printReportBtn = document.getElementById('printReportBtn');
const kpiCompletionRate = document.getElementById('kpiCompletionRate');
const kpiCompletedRatio = document.getElementById('kpiCompletedRatio');
const kpiRateBar = document.getElementById('kpiRateBar');
const kpiPendingCount = document.getElementById('kpiPendingCount');
const kpiInProgressCount = document.getElementById('kpiInProgressCount');
const kpiOverdueCount = document.getElementById('kpiOverdueCount');
const weeklyBarChart = document.getElementById('weeklyBarChart');
const priorityDistributionList = document.getElementById('priorityDistributionList');

// Stats Elements
const totalTasksCount = document.getElementById('totalTasksCount');
const pendingTasksCount = document.getElementById('pendingTasksCount');
const inProgressTasksCount = document.getElementById('inProgressTasksCount');
const completedTasksCount = document.getElementById('completedTasksCount');
const completionPercentage = document.getElementById('completionPercentage');
const progressFill = document.getElementById('progressFill');

const badgeAll = document.getElementById('badgeAll');
const badgePending = document.getElementById('badgePending');
const badgeInProgress = document.getElementById('badgeInProgress');
const badgeCompleted = document.getElementById('badgeCompleted');

// Create Task Form
const createTaskForm = document.getElementById('createTaskForm');
const taskTitleInput = document.getElementById('taskTitle');
const charCounter = document.getElementById('charCounter');
const taskDescInput = document.getElementById('taskDescription');
const taskStatusSelect = document.getElementById('taskStatus');
const taskPrioritySelect = document.getElementById('taskPriority');
const taskDueDateInput = document.getElementById('taskDueDate');
const fileDropzone = document.getElementById('fileDropzone');
const createFileInput = document.getElementById('createFileInput');
const dropzoneContent = document.getElementById('dropzoneContent');
const selectedFilePreview = document.getElementById('selectedFilePreview');
const previewFileName = document.getElementById('previewFileName');
const previewFileSize = document.getElementById('previewFileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const submitCreateBtn = document.getElementById('submitCreateBtn');

// Toolbar & Feed
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const statusFilterPills = document.querySelectorAll('#statusFilterPills .pill-btn');
const filterPrioritySelect = document.getElementById('filterPrioritySelect');
const sortBySelect = document.getElementById('sortBySelect');
const tasksContainer = document.getElementById('tasksContainer');

// View Switcher & Kanban Elements
const viewListBtn = document.getElementById('viewListBtn');
const viewKanbanBtn = document.getElementById('viewKanbanBtn');
const kanbanBoardWrapper = document.getElementById('kanbanBoardWrapper');
const kanbanPendingZone = document.getElementById('kanbanPendingZone');
const kanbanInProgressZone = document.getElementById('kanbanInProgressZone');
const kanbanCompletedZone = document.getElementById('kanbanCompletedZone');
const kanbanPendingBadge = document.getElementById('kanbanPendingBadge');
const kanbanInProgressBadge = document.getElementById('kanbanInProgressBadge');
const kanbanCompletedBadge = document.getElementById('kanbanCompletedBadge');
const triggerReminderEmailBtn = document.getElementById('triggerReminderEmailBtn');

// Pagination
const paginationBar = document.getElementById('paginationBar');
const pagStart = document.getElementById('pagStart');
const pagEnd = document.getElementById('pagEnd');
const pagTotal = document.getElementById('pagTotal');
const paginationControls = document.getElementById('paginationControls');
const limitSelect = document.getElementById('limitSelect');

// Edit Modal
const editModalOverlay = document.getElementById('editModalOverlay');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskId = document.getElementById('editTaskId');
const editTaskTitle = document.getElementById('editTaskTitle');
const editTaskDescription = document.getElementById('editTaskDescription');
const editTaskStatus = document.getElementById('editTaskStatus');
const editTaskPriority = document.getElementById('editTaskPriority');
const editTaskDueDate = document.getElementById('editTaskDueDate');
const editAttachmentsSection = document.getElementById('editAttachmentsSection');
const editAttachmentsList = document.getElementById('editAttachmentsList');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Upload Attachment Modal
const uploadAttachmentModal = document.getElementById('uploadAttachmentModal');
const uploadTargetTaskId = document.getElementById('uploadTargetTaskId');
const uploadTargetTaskTitle = document.getElementById('uploadTargetTaskTitle');
const uploadAttachmentForm = document.getElementById('uploadAttachmentForm');
const modalFileInput = document.getElementById('modalFileInput');
const modalDropPrompt = document.getElementById('modalDropPrompt');
const modalSelectedFile = document.getElementById('modalSelectedFile');
const modalFileName = document.getElementById('modalFileName');
const modalFileSize = document.getElementById('modalFileSize');
const modalClearFileBtn = document.getElementById('modalClearFileBtn');
const closeUploadModalBtn = document.getElementById('closeUploadModalBtn');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');


// Auth
const authGuestView = document.getElementById('authGuestView');
const authUserView = document.getElementById('authUserView');
const navUserAvatar = document.getElementById('navUserAvatar');
const navUserName = document.getElementById('navUserName');
const navUserRole = document.getElementById('navUserRole');
const logoutBtn = document.getElementById('logoutBtn');
const openAuthModalBtn = document.getElementById('openAuthModalBtn');

const authModalOverlay = document.getElementById('authModalOverlay');
const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const registerName = document.getElementById('registerName');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const quickTestLoginBtn = document.getElementById('quickTestLoginBtn');

const toastContainer = document.getElementById('toastContainer');

// ==================== KHỞI ĐỘNG ỨNG DỤNG ====================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setupEventListeners();
  checkDbHealth();
  setViewMode(currentViewMode);
  initNotificationState();
  startBrowserNotificationScheduler();
  initAiCoPilot();
  await initAuthState();
});

// ==================== WRAPPER GỌI API (KÈM SILENT REFRESH TOKEN) ====================
let isRefreshingToken = false;

async function trySilentRefreshToken() {
  if (!refreshToken || isRefreshingToken) return false;
  isRefreshingToken = true;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      authToken = result.accessToken || result.token;
      refreshToken = result.refreshToken;
      localStorage.setItem(TOKEN_KEY, authToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      return true;
    }
  } catch (err) {
    console.warn('⚠️ [Token Refresh] Không thể làm mới token:', err.message);
  } finally {
    isRefreshingToken = false;
  }
  return false;
}

async function apiFetch(endpoint, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  // Chỉ gắn Content-Type json nếu body không phải là FormData (để Multer tự xử lý boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  // Nếu gặp 401 Unauthorized (Access Token hết hạn 15m), tự động Refresh ngầm
  if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register' && endpoint !== '/auth/refresh-token') {
    const refreshSuccess = await trySilentRefreshToken();
    if (refreshSuccess) {
      headers['Authorization'] = `Bearer ${authToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      if (res.status !== 401) {
        return res;
      }
    }

    clearAuthState();
    openAuthModal('login');
    showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!', 'error');
    throw new Error('Unauthorized');
  }

  return res;
}

// ==================== AUTHENTICATION STATE ====================
async function initAuthState() {
  clearBulkSelection();
  if (authToken) {
    try {
      const res = await apiFetch('/auth/me');
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthState(data.data.user, authToken, refreshToken);
        await Promise.all([fetchTodos(), fetchStats(), fetchTrashCount()]);
        return;
      }
    } catch (err) {
      console.error('Auth check error:', err);
    }
  }

  clearAuthState();
  renderEmptyAuth();
}

function setAuthState(user, token, rToken = null) {
  currentUser = user;
  authToken = token;
  localStorage.setItem(TOKEN_KEY, token);

  if (rToken) {
    refreshToken = rToken;
    localStorage.setItem(REFRESH_TOKEN_KEY, rToken);
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  authGuestView.style.display = 'none';
  authUserView.style.display = 'flex';
  navUserName.textContent = user.name;
  navUserRole.textContent = user.role || 'user';
  navUserAvatar.textContent = (user.name || 'U').charAt(0).toUpperCase();

  // Hiển thị nút Quản trị nếu có role là 'admin'
  const openAdminBtn = document.getElementById('openAdminBtn');
  if (openAdminBtn) {
    openAdminBtn.style.display = (user && user.role === 'admin') ? 'inline-flex' : 'none';
  }

  closeAuthModal();

  // Nạp danh sách Không gian làm việc cho dropdowns
  fetchUserWorkspaces();
}

function clearAuthState() {
  currentUser = null;
  authToken = null;
  refreshToken = null;
  currentTodos = [];
  currentWorkspaces = [];
  activeWorkspaceId = null;
  activeEditTaskId = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  authGuestView.style.display = 'block';
  authUserView.style.display = 'none';

  // Ẩn nút Quản trị khi đăng xuất
  const openAdminBtn = document.getElementById('openAdminBtn');
  if (openAdminBtn) {
    openAdminBtn.style.display = 'none';
  }

  populateWorkspaceDropdowns();
  if (trashCountBadge) trashCountBadge.textContent = '0';
  resetStats();
}

function openAuthModal(tab = 'login') {
  authModalOverlay.classList.add('active');
  switchAuthTab(tab);
}

function closeAuthModal() {
  authModalOverlay.classList.remove('active');
  loginForm.reset();
  registerForm.reset();
}

function switchAuthTab(tab) {
  if (tab === 'login') {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
    setTimeout(() => loginEmail.focus(), 150);
  } else {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.style.display = 'flex';
    loginForm.style.display = 'none';
    setTimeout(() => registerName.focus(), 150);
  }
}

// Global exposure for auth modal
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;

async function handleLogin(e) {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      setAuthState(result.data.user, result.accessToken || result.token, result.refreshToken);
      showToast(`Chào mừng trở lại, ${result.data.user.name}!`, 'success');
      await Promise.all([fetchTodos(), fetchStats(), fetchTrashCount()]);
    } else {
      const msg = result.errors ? result.errors[0].message : (result.message || 'Đăng nhập thất bại!');
      showToast(msg, 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ khi đăng nhập!', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = registerName.value.trim();
  const email = registerEmail.value.trim();
  const password = registerPassword.value;

  try {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      setAuthState(result.data.user, result.accessToken || result.token, result.refreshToken);
      showToast(`Đăng ký thành công! Chào bạn ${result.data.user.name}`, 'success');
      await Promise.all([fetchTodos(), fetchStats(), fetchTrashCount()]);
    } else {
      const msg = result.errors ? result.errors[0].message : (result.message || 'Đăng ký thất bại!');
      showToast(msg, 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ khi đăng ký!', 'error');
  }
}

async function handleQuickTestLogin() {
  const demoEmail = 'pro@taskmaster.dev';
  const demoPass = 'password123';
  const demoName = 'Nguyen Van Pro';

  try {
    let res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: demoEmail, password: demoPass })
    });
    let result = await res.json();

    if (!res.ok) {
      res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: demoName, email: demoEmail, password: demoPass })
      });
      result = await res.json();
    }

    if (res.ok && result.success) {
      setAuthState(result.data.user, result.accessToken || result.token, result.refreshToken);
      showToast('Đã đăng nhập bằng tài khoản Demo thành công!', 'success');
      await Promise.all([fetchTodos(), fetchStats(), fetchTrashCount()]);
    } else {
      showToast(result.message || 'Không thể đăng nhập demo', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối khi đăng nhập demo', 'error');
  }
}

async function handleQuickAdminLogin() {
  const adminEmail = 'admin@taskmaster.dev';
  const adminPass = 'Admin@123456';

  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, password: adminPass })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      setAuthState(result.data.user, result.accessToken || result.token, result.refreshToken);
      showToast(`👑 Chào mừng Quản trị viên hệ thống: ${result.data.user.name}!`, 'success');
      await Promise.all([fetchTodos(), fetchStats(), fetchTrashCount()]);
    } else {
      showToast(result.message || 'Đăng nhập Admin thất bại!', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối khi đăng nhập tài khoản Admin!', 'error');
  }
}

async function handleLogoutCurrent() {
  try {
    if (refreshToken) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
    }
  } catch (_) {}
  clearAuthState();
  renderEmptyAuth();
  showToast('Đã đăng xuất khỏi tài khoản trên thiết bị này!', 'info');
}

async function handleLogoutAllDevices() {
  if (!confirm('Bạn có chắc chắn muốn đăng xuất khỏi toàn bộ tất cả các thiết bị? Mọi phiên làm việc khác sẽ bị hủy.')) {
    return;
  }

  try {
    await apiFetch('/auth/logout-all', { method: 'POST' });
  } catch (_) {}
  clearAuthState();
  renderEmptyAuth();
  showToast('Đã đăng xuất khỏi toàn bộ các thiết bị thành công!', 'success');
}

// ==================== FETCHING TODOS & STATS (LEVEL 3) ====================
async function checkDbHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (data.success) {
      if (dbStatusText) dbStatusText.textContent = 'Prisma Live';
      if (dbStatusBadge) dbStatusBadge.style.display = 'flex';
    }
  } catch (err) {
    if (dbStatusText) dbStatusText.textContent = 'DB Offline';
    if (dbStatusBadge) {
      dbStatusBadge.style.background = 'rgba(244, 63, 94, 0.12)';
      dbStatusBadge.style.borderColor = 'rgba(244, 63, 94, 0.35)';
      dbStatusBadge.style.color = '#fb7185';
    }
  }
}

async function fetchStats() {
  if (!authToken) return;
  try {
    const res = await apiFetch('/todos/stats');
    const result = await res.json();
    if (res.ok && result.success) {
      const stats = result.data;
      totalTasksCount.textContent = stats.total;
      pendingTasksCount.textContent = stats.pending;
      inProgressTasksCount.textContent = stats.inProgress;
      completedTasksCount.textContent = stats.completed;
      completionPercentage.textContent = `${stats.completionRate}%`;
      progressFill.style.width = `${stats.completionRate}%`;

      badgeAll.textContent = stats.total;
      badgePending.textContent = stats.pending;
      badgeInProgress.textContent = stats.inProgress;
      badgeCompleted.textContent = stats.completed;
    }
  } catch (err) {
    console.error('Stats error:', err);
  }
}

function resetStats() {
  totalTasksCount.textContent = '0';
  pendingTasksCount.textContent = '0';
  inProgressTasksCount.textContent = '0';
  completedTasksCount.textContent = '0';
  completionPercentage.textContent = '0%';
  progressFill.style.width = '0%';

  badgeAll.textContent = '0';
  badgePending.textContent = '0';
  badgeInProgress.textContent = '0';
  badgeCompleted.textContent = '0';
  paginationBar.style.display = 'none';
}

async function fetchTodos() {
  if (!authToken) {
    renderEmptyAuth();
    return;
  }

  if (currentViewMode === 'list') {
    tasksContainer.innerHTML = `
      <div class="loading-box">
        <div class="spinner"></div>
        <span>Đang đồng bộ dữ liệu từ Prisma & MySQL...</span>
      </div>
    `;
  }

  const query = new URLSearchParams({
    page: currentPagination.currentPage,
    limit: currentPagination.limit,
    status: statusFilter,
    priority: priorityFilter,
    sortBy: sortBy
  });

  if (searchQuery.trim()) {
    query.set('search', searchQuery.trim());
  }

  try {
    const res = await apiFetch(`/todos?${query.toString()}`);
    const result = await res.json();

    if (res.ok && result.success) {
      currentTodos = result.data || [];
      currentPagination = result.pagination;
      renderActiveView();
    } else {
      showToast(result.message || 'Không thể tải danh sách công việc', 'error');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    tasksContainer.innerHTML = `
      <div class="empty-canvas">
        <div class="empty-art" style="color: var(--brand-rose); border-color: rgba(244, 63, 94, 0.4);">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h4 class="empty-headline">Lỗi tải dữ liệu!</h4>
        <p class="empty-guide">Vui lòng kiểm tra lại kết nối cơ sở dữ liệu.</p>
      </div>
    `;
  }
}

// ==================== RENDERING UI ====================
function renderEmptyAuth() {
  if (kanbanBoardWrapper) kanbanBoardWrapper.style.display = 'none';
  if (tasksContainer) tasksContainer.style.display = 'flex';
  tasksContainer.innerHTML = `
    <div class="empty-canvas">
      <div class="empty-art">
        <i class="fa-solid fa-lock"></i>
      </div>
      <h4 class="empty-headline">Bạn chưa đăng nhập!</h4>
      <p class="empty-guide">Vui lòng đăng nhập để xem và quản lý danh sách công việc được bảo mật của riêng bạn.</p>
      <button type="button" class="btn btn-primary btn-open-login-prompt" id="emptyAuthLoginBtn" onclick="openAuthModal('login')" style="cursor: pointer; padding: 10px 22px; font-size: 0.95rem;">
        <i class="fa-solid fa-arrow-right-to-bracket"></i> Đăng nhập ngay
      </button>
    </div>
  `;
}

function renderTodos() {
  if (!authToken) {
    renderEmptyAuth();
    return;
  }

  if (currentTodos.length === 0) {
    tasksContainer.innerHTML = `
      <div class="empty-canvas">
        <div class="empty-art">
          <i class="fa-solid fa-inbox"></i>
        </div>
        <h4 class="empty-headline">Chưa có công việc nào!</h4>
        <p class="empty-guide">${searchQuery ? 'Không tìm thấy kết quả phù hợp với từ khóa.' : 'Hãy tạo công việc mới ở khung bên trái hoặc bấm nút dưới để nạp 4 việc mẫu.'}</p>
        ${!searchQuery ? `
          <button class="btn btn-seed" onclick="handleSeedDemoData()">
            <i class="fa-solid fa-seedling"></i> Tạo ngay 4 công việc mẫu
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  tasksContainer.innerHTML = currentTodos.map(todo => {
    const isDone = todo.status === 'completed';
    const chipClass = `chip-${todo.status}`;
    const statusLabel = getStatusLabel(todo.status);
    const timeFormatted = formatDate(todo.createdAt || todo.created_at);

    // Priority badge
    const priority = todo.priority || 'medium';
    const priorityHtml = getPriorityBadge(priority);

    // Due Date badge
    const dueBadgeHtml = getDueDateBadge(todo.dueDate || todo.due_date);

    // Subtasks badge (Next-Level AI)
    const subtasks = todo.subtasks || [];
    const subtasksDone = subtasks.filter(s => s.completed).length;
    const subtasksBadgeHtml = subtasks.length > 0 ? `
      <span class="badge task-subtask-pill ${subtasksDone === subtasks.length ? 'all-done' : ''}" title="${subtasksDone}/${subtasks.length} việc con đã hoàn thành">
        <i class="fa-solid fa-list-check"></i> ${subtasksDone}/${subtasks.length}
      </span>
    ` : '';

    // Workspace & Assignee & Comments Badges (Team Collaboration)
    const wsBadgeHtml = todo.workspace ? `
      <span class="badge task-workspace-pill" title="Dự án: ${escapeHTML(todo.workspace.name)}">
        <i class="fa-solid fa-folder"></i> ${escapeHTML(todo.workspace.name)}
      </span>
    ` : '';

    const assigneeBadgeHtml = todo.assignee ? `
      <span class="badge task-assignee-pill" title="Người thực hiện: ${escapeHTML(todo.assignee.name || todo.assignee.email)}">
        <i class="fa-solid fa-user-check"></i> ${escapeHTML(todo.assignee.name || todo.assignee.email.split('@')[0])}
      </span>
    ` : '';

    const commentsCount = (todo.comments && todo.comments.length) || (todo._count && todo._count.comments) || 0;
    const commentsBadgeHtml = commentsCount > 0 ? `
      <span class="badge task-comments-pill" title="${commentsCount} bình luận trao đổi" onclick="event.stopPropagation(); openEditModal(${todo.id}).then(() => switchEditModalTab('comments'))">
        <i class="fa-regular fa-comment-dots"></i> ${commentsCount}
      </span>
    ` : '';

    // Attachments
    const attachments = todo.attachments || [];
    const attachmentsHtml = attachments.length > 0 ? `
      <div class="task-attachments-box">
        <span style="font-size: 0.72rem; font-weight: 600; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-right: 4px;">
          <i class="fa-solid fa-paperclip"></i> Tệp:
        </span>
        ${attachments.map(att => `
          <a href="${att.filePath}" target="_blank" class="attachment-chip" title="Bấm để xem/tải: ${escapeHTML(att.fileName)}">
            <i class="${getFileIcon(att.mimeType || att.fileName)} att-icon"></i>
            <span class="att-name">${escapeHTML(att.fileName)}</span>
            <span class="att-size">${formatFileSize(att.fileSize)}</span>
            <button type="button" class="btn-del-att" onclick="handleDeleteAttachment(event, ${todo.id}, ${att.id})" title="Xóa tệp này">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </a>
        `).join('')}
      </div>
    ` : '';

    return `
      <div class="task-item ${isDone ? 'is-done' : ''} priority-${priority}" data-id="${todo.id}">
        <!-- Checkbox con để chọn thao tác hàng loạt (Bulk Action Checkbox) -->
        <div class="task-checkbox-col">
          <input 
            type="checkbox" 
            class="task-item-checkbox custom-checkbox" 
            id="task_cb_${todo.id}" 
            data-id="${todo.id}" 
            ${selectedTaskIds.has(Number(todo.id)) ? 'checked' : ''} 
            onchange="handleTaskCheckboxChange(event, ${todo.id})" 
            onclick="event.stopPropagation()" 
            title="Chọn công việc này để thao tác hàng loạt"
          >
        </div>

        <!-- Checkbox hoàn thành công việc (Task Complete Toggle Button) -->
        <button 
          type="button" 
          class="custom-check ${isDone ? 'checked' : ''}" 
          data-id="${todo.id}" 
          data-status="${todo.status}" 
          onclick="toggleTaskComplete(event, ${todo.id}, '${todo.status}')" 
          title="${isDone ? 'Bấm để đánh dấu chưa hoàn thành' : 'Bấm để đánh dấu đã hoàn thành'}" 
          aria-label="${isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}"
        >
          <i class="fa-solid fa-check" style="pointer-events: none;"></i>
        </button>

        <div class="task-main">
          <div class="task-top">
            <div class="task-title-group">
              <h4 class="task-heading">${escapeHTML(todo.title)}</h4>
              <div class="task-badges-row">
                ${priorityHtml}
                ${dueBadgeHtml}
                ${subtasksBadgeHtml}
                ${wsBadgeHtml}
                ${assigneeBadgeHtml}
                ${commentsBadgeHtml}
              </div>
            </div>

            <!-- Clear & Intuitive Action Buttons Group -->
            <div class="task-action-buttons">
              <!-- Edit Task -->
              <button type="button" class="btn-task-action btn-edit-act" data-id="${todo.id}" onclick="openEditModal(${todo.id})" title="Chỉnh sửa công việc này">
                <i class="fa-regular fa-pen-to-square"></i>
                <span>Sửa</span>
              </button>

              <!-- Delete Task with Confirmation Popup -->
              <button type="button" class="btn-task-action btn-del-act" data-id="${todo.id}" onclick="promptDeleteTask(${todo.id})" title="Xóa công việc này">
                <i class="fa-regular fa-trash-can"></i>
                <span>Xóa</span>
              </button>
            </div>
          </div>

          ${todo.description ? `<p class="task-body-text">${escapeHTML(todo.description)}</p>` : ''}

          ${attachmentsHtml}

          <div class="task-footer">
            <span class="status-chip ${chipClass}">
              ${getStatusIcon(todo.status)} ${statusLabel}
            </span>
            <span class="task-timestamp">
              <i class="fa-regular fa-clock"></i> ${timeFormatted}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==================== KANBAN, LIST & CALENDAR VIEW SWITCHER ====================
function renderActiveView() {
  const calendarViewWrapper = document.getElementById('calendarViewWrapper');
  const listSelectionBar = document.getElementById('listSelectionBar');

  if (currentViewMode === 'calendar') {
    if (tasksContainer) {
      tasksContainer.classList.add('is-hidden');
      tasksContainer.style.display = 'none';
      tasksContainer.innerHTML = '';
    }
    if (kanbanBoardWrapper) {
      kanbanBoardWrapper.classList.add('is-hidden');
      kanbanBoardWrapper.style.display = 'none';
    }
    if (paginationBar) paginationBar.style.display = 'none';
    if (listSelectionBar) listSelectionBar.style.display = 'none';
    if (calendarViewWrapper) {
      calendarViewWrapper.classList.remove('is-hidden');
      calendarViewWrapper.style.display = 'block';
    }
    renderCalendarView();
  } else if (currentViewMode === 'kanban') {
    if (tasksContainer) {
      tasksContainer.classList.add('is-hidden');
      tasksContainer.style.display = 'none';
      tasksContainer.innerHTML = '';
    }
    if (calendarViewWrapper) {
      calendarViewWrapper.classList.add('is-hidden');
      calendarViewWrapper.style.display = 'none';
    }
    if (paginationBar) paginationBar.style.display = 'none';
    if (listSelectionBar) listSelectionBar.style.display = 'none';
    if (kanbanBoardWrapper) {
      kanbanBoardWrapper.classList.remove('is-hidden');
      kanbanBoardWrapper.style.display = 'block';
    }
    renderKanbanBoard();
  } else {
    if (kanbanBoardWrapper) {
      kanbanBoardWrapper.classList.add('is-hidden');
      kanbanBoardWrapper.style.display = 'none';
    }
    if (calendarViewWrapper) {
      calendarViewWrapper.classList.add('is-hidden');
      calendarViewWrapper.style.display = 'none';
    }
    if (tasksContainer) {
      tasksContainer.classList.remove('is-hidden');
      tasksContainer.style.display = 'flex';
    }
    if (listSelectionBar) listSelectionBar.style.display = 'flex';
    renderTodos();
    renderPagination();
    updateBulkActionBar();
  }
}

function setViewMode(mode) {
  currentViewMode = mode;
  localStorage.setItem('taskmaster_view_mode', mode);

  const viewCalendarBtn = document.getElementById('viewCalendarBtn');
  const calendarViewWrapper = document.getElementById('calendarViewWrapper');
  const listSelectionBar = document.getElementById('listSelectionBar');

  if (mode === 'calendar') {
    if (viewListBtn) viewListBtn.classList.remove('active');
    if (viewKanbanBtn) viewKanbanBtn.classList.remove('active');
    if (viewCalendarBtn) viewCalendarBtn.classList.add('active');

    if (tasksContainer) {
      tasksContainer.classList.add('is-hidden');
      tasksContainer.style.display = 'none';
      tasksContainer.innerHTML = '';
    }
    if (kanbanBoardWrapper) {
      kanbanBoardWrapper.classList.add('is-hidden');
      kanbanBoardWrapper.style.display = 'none';
    }
    if (paginationBar) paginationBar.style.display = 'none';
    if (listSelectionBar) listSelectionBar.style.display = 'none';
    if (calendarViewWrapper) {
      calendarViewWrapper.classList.remove('is-hidden');
      calendarViewWrapper.style.display = 'block';
    }

    if (currentPagination.limit < 50) {
      currentPagination.limit = 100;
      fetchTodos();
    } else {
      renderCalendarView();
    }
  } else if (mode === 'kanban') {
    if (viewListBtn) viewListBtn.classList.remove('active');
    if (viewKanbanBtn) viewKanbanBtn.classList.add('active');
    if (viewCalendarBtn) viewCalendarBtn.classList.remove('active');

    if (tasksContainer) {
      tasksContainer.classList.add('is-hidden');
      tasksContainer.style.display = 'none';
      tasksContainer.innerHTML = '';
    }
    if (calendarViewWrapper) {
      calendarViewWrapper.classList.add('is-hidden');
      calendarViewWrapper.style.display = 'none';
    }
    if (paginationBar) paginationBar.style.display = 'none';
    if (listSelectionBar) listSelectionBar.style.display = 'none';
    if (kanbanBoardWrapper) {
      kanbanBoardWrapper.classList.remove('is-hidden');
      kanbanBoardWrapper.style.display = 'block';
    }

    if (currentPagination.limit < 50) {
      currentPagination.limit = 100;
      fetchTodos();
    } else {
      renderKanbanBoard();
    }
  } else {
    if (viewKanbanBtn) viewKanbanBtn.classList.remove('active');
    if (viewCalendarBtn) viewCalendarBtn.classList.remove('active');
    if (viewListBtn) viewListBtn.classList.add('active');

    if (kanbanBoardWrapper) {
      kanbanBoardWrapper.classList.add('is-hidden');
      kanbanBoardWrapper.style.display = 'none';
    }
    if (calendarViewWrapper) {
      calendarViewWrapper.classList.add('is-hidden');
      calendarViewWrapper.style.display = 'none';
    }
    if (tasksContainer) {
      tasksContainer.classList.remove('is-hidden');
      tasksContainer.style.display = 'flex';
    }
    if (listSelectionBar) listSelectionBar.style.display = 'flex';

    const defaultLimit = parseInt(limitSelect ? limitSelect.value : '10', 10);
    if (currentPagination.limit !== defaultLimit) {
      currentPagination.limit = defaultLimit;
      fetchTodos();
    } else {
      renderTodos();
      renderPagination();
      updateBulkActionBar();
    }
  }
}

function renderKanbanBoard() {
  if (!authToken) {
    renderEmptyAuth();
    return;
  }

  const pendingTasks = currentTodos.filter(t => t.status === 'pending');
  const inProgressTasks = currentTodos.filter(t => t.status === 'in_progress');
  const completedTasks = currentTodos.filter(t => t.status === 'completed');

  if (kanbanPendingBadge) kanbanPendingBadge.textContent = pendingTasks.length;
  if (kanbanInProgressBadge) kanbanInProgressBadge.textContent = inProgressTasks.length;
  if (kanbanCompletedBadge) kanbanCompletedBadge.textContent = completedTasks.length;

  const renderCards = (tasks, emptyLabel) => {
    if (tasks.length === 0) {
      return `
        <div class="kanban-empty">
          <i class="fa-regular fa-folder-open"></i>
          <span>${emptyLabel}</span>
        </div>
      `;
    }

    return tasks.map(todo => {
      const isDone = todo.status === 'completed';
      const priorityHtml = getPriorityBadge(todo.priority || 'medium');
      const dueBadgeHtml = getDueDateBadge(todo.dueDate || todo.due_date);
      const subtasks = todo.subtasks || [];
      const subtasksDone = subtasks.filter(s => s.completed).length;
      const subtasksBadgeHtml = subtasks.length > 0 ? `
        <span class="badge task-subtask-pill ${subtasksDone === subtasks.length ? 'all-done' : ''}" title="${subtasksDone}/${subtasks.length} việc con đã hoàn thành">
          <i class="fa-solid fa-list-check"></i> ${subtasksDone}/${subtasks.length}
        </span>
      ` : '';
      const attachments = todo.attachments || [];

      // Workspace & Assignee & Comments Badges (Team Collaboration)
      const wsBadgeHtml = todo.workspace ? `
        <span class="badge task-workspace-pill" title="Dự án: ${escapeHTML(todo.workspace.name)}">
          <i class="fa-solid fa-folder"></i> ${escapeHTML(todo.workspace.name)}
        </span>
      ` : '';

      const assigneeBadgeHtml = todo.assignee ? `
        <span class="badge task-assignee-pill" title="Người thực hiện: ${escapeHTML(todo.assignee.name || todo.assignee.email)}">
          <i class="fa-solid fa-user-check"></i> ${escapeHTML(todo.assignee.name || todo.assignee.email.split('@')[0])}
        </span>
      ` : '';

      const commentsCount = (todo.comments && todo.comments.length) || (todo._count && todo._count.comments) || 0;
      const commentsBadgeHtml = commentsCount > 0 ? `
        <span class="badge task-comments-pill" title="${commentsCount} bình luận" onclick="event.stopPropagation(); openEditModal(${todo.id}).then(() => switchEditModalTab('comments'))">
          <i class="fa-regular fa-comment-dots"></i> ${commentsCount}
        </span>
      ` : '';

      return `
        <div class="kanban-card" 
             data-id="${todo.id}">
          <div class="kanban-card-top">
            <h5 class="kanban-card-title ${isDone ? 'done' : ''}">${escapeHTML(todo.title)}</h5>
            <div class="kanban-card-actions">
              <button type="button" class="btn-kanban-act btn-edit-act" data-id="${todo.id}" onclick="openEditModal(${todo.id})" title="Chỉnh sửa công việc">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button type="button" class="btn-kanban-act btn-kanban-del btn-del-act" data-id="${todo.id}" onclick="promptDeleteTask(${todo.id})" title="Xóa công việc">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>

          ${todo.description ? `<p class="kanban-card-desc">${escapeHTML(todo.description)}</p>` : ''}

          <div class="kanban-card-meta">
            <div class="kanban-card-badges">
              ${priorityHtml}
              ${dueBadgeHtml}
              ${subtasksBadgeHtml}
              ${wsBadgeHtml}
              ${assigneeBadgeHtml}
              ${commentsBadgeHtml}
            </div>

            ${attachments.length > 0 ? `
              <span style="font-size: 0.72rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px;" title="${attachments.length} tệp đính kèm">
                <i class="fa-solid fa-paperclip"></i> ${attachments.length}
              </span>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  };

  if (kanbanPendingZone) kanbanPendingZone.innerHTML = renderCards(pendingTasks, 'Kéo thả việc chờ làm vào đây');
  if (kanbanInProgressZone) kanbanInProgressZone.innerHTML = renderCards(inProgressTasks, 'Kéo thả việc đang làm vào đây');
  if (kanbanCompletedZone) kanbanCompletedZone.innerHTML = renderCards(completedTasks, 'Kéo thả việc đã xong vào đây');

  initKanbanSortable();
}

let sortableInstances = [];

function initKanbanSortable() {
  sortableInstances.forEach(inst => {
    try { inst.destroy(); } catch (_) {}
  });
  sortableInstances = [];

  if (typeof Sortable === 'undefined') {
    console.warn('SortableJS library not loaded.');
    return;
  }

  const columns = [
    { zone: kanbanPendingZone, status: 'pending' },
    { zone: kanbanInProgressZone, status: 'in_progress' },
    { zone: kanbanCompletedZone, status: 'completed' }
  ];

  columns.forEach(({ zone, status }) => {
    if (!zone) return;

    const s = new Sortable(zone, {
      group: 'kanban-board-group',
      animation: 180,
      forceFallback: true,        // Kích hoạt engine con trỏ thuần, triệt tiêu xung đột drag native của Chromium
      fallbackClass: 'kanban-drag-fallback',
      ghostClass: 'kanban-ghost-card',
      chosenClass: 'kanban-chosen-card',
      filter: '.kanban-card-actions, .btn-kanban-act, .kanban-empty',
      preventOnFilter: false,
      draggable: '.kanban-card',
      fallbackTolerance: 3,       // Tránh kích hoạt kéo nhầm khi chỉ click vào card
      scroll: true,
      onAdd: function (evt) {
        const emptyEl = evt.to.querySelector('.kanban-empty');
        if (emptyEl) emptyEl.remove();
      },
      onEnd: async function (evt) {
        const itemEl = evt.item;
        const targetZone = evt.to;
        const fromZone = evt.from;
        const targetStatus = targetZone ? targetZone.getAttribute('data-status') : null;
        const fromStatus = fromZone ? fromZone.getAttribute('data-status') : null;
        const todoId = itemEl ? itemEl.getAttribute('data-id') : null;

        if (!todoId || !targetStatus || targetStatus === fromStatus) return;

        const todo = currentTodos.find(t => t.id == todoId);
        if (!todo) return;

        const oldStatus = todo.status;
        todo.status = targetStatus;

        // Cập nhật số đếm badge ngay lập tức
        updateKanbanBadges();

        try {
          const res = await apiFetch(`/todos/${todoId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: targetStatus })
          });
          const result = await res.json();

          if (res.ok && result.success) {
            showToast(`Đã chuyển sang: ${getStatusLabel(targetStatus)}`, 'success');
            await fetchStats();
            renderKanbanBoard();
          } else {
            todo.status = oldStatus;
            renderKanbanBoard();
            showToast(result.message || 'Lỗi cập nhật trạng thái!', 'error');
          }
        } catch (err) {
          todo.status = oldStatus;
          renderKanbanBoard();
          showToast('Lỗi mạng khi cập nhật trạng thái!', 'error');
        }
      }
    });

    sortableInstances.push(s);
  });
}

function updateKanbanBadges() {
  if (kanbanPendingBadge) kanbanPendingBadge.textContent = currentTodos.filter(t => t.status === 'pending').length;
  if (kanbanInProgressBadge) kanbanInProgressBadge.textContent = currentTodos.filter(t => t.status === 'in_progress').length;
  if (kanbanCompletedBadge) kanbanCompletedBadge.textContent = currentTodos.filter(t => t.status === 'completed').length;
}

async function handleTriggerReminderEmail() {
  if (!authToken) {
    showToast('Vui lòng đăng nhập để gửi email Bản tin AI!', 'error');
    openAuthModal('login');
    return;
  }

  const originalHtml = triggerReminderEmailBtn.innerHTML;
  triggerReminderEmailBtn.disabled = true;
  triggerReminderEmailBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles fa-spin"></i> <span>AI đang soạn mail...</span>`;

  try {
    const res = await apiFetch('/ai/send-briefing-email', {
      method: 'POST'
    });
    const result = await res.json();

    if (res.ok && result.success) {
      const data = result.data;
      showToast(result.message || 'Bản tin AI đã gửi thành công!', 'success');

      if (data && data.previewUrl) {
        console.log(`📬 [Ethereal Mail Preview URL]: ${data.previewUrl}`);
        setTimeout(() => {
          showToast(`Link xem email: ${data.previewUrl}`, 'info');
        }, 1000);
      }
    } else {
      showToast(result.message || 'Lỗi gửi email Bản tin AI!', 'error');
    }
  } catch (err) {
    console.error('Email error:', err);
    showToast('Lỗi kết nối khi gửi email Bản tin AI!', 'error');
  } finally {
    triggerReminderEmailBtn.disabled = false;
    triggerReminderEmailBtn.innerHTML = originalHtml;
  }
}


function renderPagination() {
  if (!authToken || currentPagination.totalItems === 0) {
    paginationBar.style.display = 'none';
    return;
  }

  paginationBar.style.display = 'flex';

  const { currentPage, totalPages, totalItems, limit, hasPrevPage, hasNextPage } = currentPagination;
  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalItems);

  pagStart.textContent = start;
  pagEnd.textContent = end;
  pagTotal.textContent = totalItems;
  limitSelect.value = limit;

  // Generate page numbers
  let controlsHtml = `
    <button class="pag-btn" ${!hasPrevPage ? 'disabled' : ''} onclick="goToPage(1)" title="Trang đầu">«</button>
    <button class="pag-btn" ${!hasPrevPage ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})" title="Trang trước">‹</button>
  `;

  // Sliding window page numbers (max 5 buttons)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let p = startPage; p <= endPage; p++) {
    controlsHtml += `
      <button class="pag-btn ${p === currentPage ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>
    `;
  }

  controlsHtml += `
    <button class="pag-btn" ${!hasNextPage ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})" title="Trang sau">›</button>
    <button class="pag-btn" ${!hasNextPage ? 'disabled' : ''} onclick="goToPage(${totalPages})" title="Trang cuối">»</button>
  `;

  paginationControls.innerHTML = controlsHtml;
}

function goToPage(page) {
  if (page < 1 || page > currentPagination.totalPages) return;
  clearBulkSelection();
  currentPagination.currentPage = page;
  fetchTodos();
}

window.goToPage = goToPage;
window.changePage = goToPage; // backward compatibility

// ==================== BADGE & FORMATTING HELPERS ====================
function getPriorityBadge(priority) {
  if (priority === 'high') {
    return `<span class="badge-priority badge-priority-high">🔴 Cao</span>`;
  }
  if (priority === 'low') {
    return `<span class="badge-priority badge-priority-low">🟢 Thấp</span>`;
  }
  return `<span class="badge-priority badge-priority-medium">🟡 Vừa</span>`;
}

function getDueDateBadge(dueDateStr) {
  if (!dueDateStr) return '';
  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return '';

  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formattedDate = `${due.getDate().toString().padStart(2, '0')}/${(due.getMonth() + 1).toString().padStart(2, '0')}`;

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays);
    return `<span class="badge-due badge-due-overdue" title="Hạn chót: ${due.toLocaleString()}"><i class="fa-solid fa-triangle-exclamation"></i> Quá hạn ${overdueDays > 0 ? overdueDays + ' ngày' : 'hôm nay'}</span>`;
  } else if (diffDays === 0 || diffDays === 1) {
    return `<span class="badge-due badge-due-today" title="Hạn chót: ${due.toLocaleString()}"><i class="fa-regular fa-clock"></i> Hôm nay</span>`;
  } else {
    return `<span class="badge-due badge-due-upcoming" title="Hạn chót: ${due.toLocaleString()}"><i class="fa-regular fa-calendar"></i> Hạn: ${formattedDate} (${diffDays} ngày nữa)</span>`;
  }
}

function getFileIcon(mimeTypeOrExt) {
  const str = (mimeTypeOrExt || '').toLowerCase();
  if (str.includes('image')) return 'fa-regular fa-file-image';
  if (str.includes('pdf')) return 'fa-regular fa-file-pdf';
  if (str.includes('word') || str.includes('doc')) return 'fa-regular fa-file-word';
  if (str.includes('excel') || str.includes('sheet') || str.includes('csv')) return 'fa-regular fa-file-excel';
  if (str.includes('zip') || str.includes('rar') || str.includes('compressed')) return 'fa-regular fa-file-zipper';
  if (str.includes('text')) return 'fa-regular fa-file-lines';
  return 'fa-regular fa-file';
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getStatusLabel(status) {
  switch (status) {
    case 'in_progress': return 'Đang xử lý';
    case 'completed': return 'Đã hoàn thành';
    default: return 'Chờ thực hiện';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'in_progress': return '<i class="fa-solid fa-arrows-rotate fa-spin-pulse"></i>';
    case 'completed': return '<i class="fa-solid fa-circle-check"></i>';
    default: return '<i class="fa-regular fa-clock"></i>';
  }
}

function formatDate(isoString) {
  if (!isoString) return 'Gần đây';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Gần đây';
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} • ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==================== EVENT HANDLERS ====================
function setupEventListeners() {
  // Hotkeys: Ctrl + Enter tạo task, '/' tìm kiếm, 'Escape' đóng modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('permanentDeleteModal')?.classList.contains('active')) {
        closePermanentDeleteModal();
        return;
      }
      if (document.getElementById('emptyTrashConfirmModal')?.classList.contains('active')) {
        closeEmptyTrashConfirmModal();
        return;
      }
      closeDeleteConfirmModal();
      closeEditModal();
      closeAuthModal();
      closeTrashModal();
      closeAnalyticsModal();
      closeImportModal();
      closeUploadModal();
      closeAiCoPilot();
      closeVoiceModal();
      closeWorkspaceModal();
      closeAdminModal();
    }
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleCreateTask();
    }
    if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Auth Modals & Triggers
  if (openAuthModalBtn) openAuthModalBtn.addEventListener('click', () => openAuthModal('login'));
  if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', closeAuthModal);
  if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
  if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
  if (quickTestLoginBtn) quickTestLoginBtn.addEventListener('click', handleQuickTestLogin);
  const quickAdminLoginBtn = document.getElementById('quickAdminLoginBtn');
  if (quickAdminLoginBtn) quickAdminLoginBtn.addEventListener('click', handleQuickAdminLogin);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogoutCurrent);
  if (logoutAllBtn) logoutAllBtn.addEventListener('click', handleLogoutAllDevices);

  // Trash Bin Triggers
  if (openTrashBtn) openTrashBtn.addEventListener('click', openTrashModal);
  if (closeTrashModalBtn) closeTrashModalBtn.addEventListener('click', closeTrashModal);
  if (emptyTrashModalBtn) emptyTrashModalBtn.addEventListener('click', promptEmptyTrash);

  // Stacked Modals (Permanent Delete & Empty Trash Confirm)
  if (closePermanentDeleteModalBtn) closePermanentDeleteModalBtn.addEventListener('click', closePermanentDeleteModal);
  if (cancelPermanentDeleteModalBtn) cancelPermanentDeleteModalBtn.addEventListener('click', closePermanentDeleteModal);
  if (submitPermanentDeleteModalBtn) submitPermanentDeleteModalBtn.addEventListener('click', () => executePermanentDelete());
  if (permanentDeleteModal) {
    permanentDeleteModal.addEventListener('click', (e) => {
      if (e.target === permanentDeleteModal) closePermanentDeleteModal();
    });
  }

  if (closeEmptyTrashConfirmBtn) closeEmptyTrashConfirmBtn.addEventListener('click', closeEmptyTrashConfirmModal);
  if (cancelEmptyTrashConfirmBtn) cancelEmptyTrashConfirmBtn.addEventListener('click', closeEmptyTrashConfirmModal);
  if (submitEmptyTrashConfirmBtn) submitEmptyTrashConfirmBtn.addEventListener('click', executeEmptyTrash);
  if (emptyTrashConfirmModal) {
    emptyTrashConfirmModal.addEventListener('click', (e) => {
      if (e.target === emptyTrashConfirmModal) closeEmptyTrashConfirmModal();
    });
  }

  // Analytics & Export Triggers
  if (openAnalyticsBtn) openAnalyticsBtn.addEventListener('click', openAnalyticsModal);
  if (closeAnalyticsModalBtn) closeAnalyticsModalBtn.addEventListener('click', closeAnalyticsModal);
  if (exportExcelBtn) exportExcelBtn.addEventListener('click', handleExportExcel);
  if (printReportBtn) printReportBtn.addEventListener('click', handlePrintReport);

  // Notification Bell Toggle
  if (toggleNotificationBtn) toggleNotificationBtn.addEventListener('click', handleToggleNotification);

  // Create Task Form
  if (createTaskForm) createTaskForm.addEventListener('submit', handleCreateTask);
  if (taskTitleInput) {
    taskTitleInput.addEventListener('input', () => {
      charCounter.textContent = `${taskTitleInput.value.length}/100`;
    });
  }

  // Next-Level AI: Voice-to-Task & Voice Chat Triggers
  const voiceToTaskBtn = document.getElementById('voiceToTaskBtn');
  if (voiceToTaskBtn) voiceToTaskBtn.addEventListener('click', () => startVoiceRecognition('task'));

  const aiVoiceChatBtn = document.getElementById('aiVoiceChatBtn');
  if (aiVoiceChatBtn) aiVoiceChatBtn.addEventListener('click', () => startVoiceRecognition('chat'));

  const closeVoiceModalBtn = document.getElementById('closeVoiceModalBtn');
  if (closeVoiceModalBtn) closeVoiceModalBtn.addEventListener('click', closeVoiceModal);

  const cancelVoiceBtn = document.getElementById('cancelVoiceBtn');
  if (cancelVoiceBtn) cancelVoiceBtn.addEventListener('click', closeVoiceModal);

  const stopAndParseVoiceBtn = document.getElementById('stopAndParseVoiceBtn');
  if (stopAndParseVoiceBtn) stopAndParseVoiceBtn.addEventListener('click', handleStopAndParseVoice);

  const voiceRecordingModal = document.getElementById('voiceRecordingModal');
  if (voiceRecordingModal) {
    voiceRecordingModal.addEventListener('click', (e) => {
      if (e.target === voiceRecordingModal) closeVoiceModal();
    });
  }

  // Next-Level AI: Smart Subtasks Triggers
  const btnAiGenerateSubtasks = document.getElementById('btnAiGenerateSubtasks');
  if (btnAiGenerateSubtasks) btnAiGenerateSubtasks.addEventListener('click', handleAiGenerateSubtasks);

  const btnAddSubtaskQuick = document.getElementById('btnAddSubtaskQuick');
  if (btnAddSubtaskQuick) btnAddSubtaskQuick.addEventListener('click', handleAddSubtaskQuick);

  const newSubtaskTitleInput = document.getElementById('newSubtaskTitleInput');
  if (newSubtaskTitleInput) {
    newSubtaskTitleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSubtaskQuick();
      }
    });
  }

  // File Dropzone in Create Form
  if (fileDropzone) {
    fileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropzone.classList.add('dragover');
    });
    fileDropzone.addEventListener('dragleave', () => fileDropzone.classList.remove('dragover'));
    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleSelectCreateFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (createFileInput) {
    createFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleSelectCreateFile(e.target.files[0]);
      }
    });
  }

  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearCreateFile();
    });
  }

  // Toolbar Events
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        searchQuery = searchInput.value;
        currentPagination.currentPage = 1;
        clearBulkSelection();
        fetchTodos();
      }, 350);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      currentPagination.currentPage = 1;
      clearBulkSelection();
      fetchTodos();
    });
  }

  // Status Filter Pills
  statusFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      statusFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      statusFilter = pill.getAttribute('data-status');
      currentPagination.currentPage = 1;
      clearBulkSelection();
      fetchTodos();
    });
  });

  // Priority Filter Select
  if (filterPrioritySelect) {
    filterPrioritySelect.addEventListener('change', () => {
      priorityFilter = filterPrioritySelect.value;
      currentPagination.currentPage = 1;
      clearBulkSelection();
      fetchTodos();
    });
  }

  // Sort By Select
  if (sortBySelect) {
    sortBySelect.addEventListener('change', () => {
      sortBy = sortBySelect.value;
      currentPagination.currentPage = 1;
      clearBulkSelection();
      fetchTodos();
    });
  }

  // Limit Select
  if (limitSelect) {
    limitSelect.addEventListener('change', () => {
      currentPagination.limit = parseInt(limitSelect.value, 10);
      currentPagination.currentPage = 1;
      clearBulkSelection();
      fetchTodos();
    });
  }

  // Seed Data Button
  if (seedDemoBtn) seedDemoBtn.addEventListener('click', handleSeedDemoData);


  // Edit Modal
  if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
  if (editTaskForm) editTaskForm.addEventListener('submit', handleSaveEdit);
  if (editModalOverlay) {
    editModalOverlay.addEventListener('click', (e) => {
      if (e.target === editModalOverlay) closeEditModal();
    });
  }

  if (authModalOverlay) {
    authModalOverlay.addEventListener('click', (e) => {
      if (e.target === authModalOverlay) closeAuthModal();
    });
  }

  // Delete Confirmation Modal Triggers
  const closeDeleteConfirmBtn = document.getElementById('closeDeleteConfirmBtn');
  const cancelDeleteModalBtn = document.getElementById('cancelDeleteModalBtn');
  const submitDeleteModalBtn = document.getElementById('submitDeleteModalBtn');
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');

  if (closeDeleteConfirmBtn) closeDeleteConfirmBtn.addEventListener('click', closeDeleteConfirmModal);
  if (cancelDeleteModalBtn) cancelDeleteModalBtn.addEventListener('click', closeDeleteConfirmModal);
  if (submitDeleteModalBtn) submitDeleteModalBtn.addEventListener('click', handleConfirmDeleteSubmit);
  if (deleteConfirmModal) {
    deleteConfirmModal.addEventListener('click', (e) => {
      if (e.target === deleteConfirmModal) closeDeleteConfirmModal();
    });
  }

  // Delegated click listeners for Edit, Delete and Login buttons anywhere in the DOM
  document.addEventListener('click', (e) => {
    const loginPromptBtn = e.target.closest('.btn-open-login-prompt, .btn-seed');
    if (loginPromptBtn && !authToken) {
      e.preventDefault();
      openAuthModal('login');
      return;
    }

    const editBtn = e.target.closest('.btn-edit-act');
    if (editBtn) {
      e.preventDefault();
      const id = editBtn.getAttribute('data-id') || editBtn.dataset.id;
      if (id) {
        openEditModal(Number(id));
      }
      return;
    }

    const delBtn = e.target.closest('.btn-del-act');
    if (delBtn) {
      e.preventDefault();
      const id = delBtn.getAttribute('data-id') || delBtn.dataset.id;
      if (id) {
        promptDeleteTask(Number(id));
      }
      return;
    }

    // Delegated click listeners for trash modal buttons
    const restoreBtn = e.target.closest('.btn-restore');
    if (restoreBtn) {
      e.preventDefault();
      const id = Number(restoreBtn.dataset.id || restoreBtn.getAttribute('data-id'));
      if (!isNaN(id)) {
        handleRestoreTask(id);
      }
      return;
    }

    const permDelBtn = e.target.closest('.btn-permanent-delete');
    if (permDelBtn) {
      e.preventDefault();
      const id = Number(permDelBtn.dataset.id || permDelBtn.getAttribute('data-id'));
      if (!isNaN(id)) {
        promptPermanentDelete(id);
      }
      return;
    }

    const emptyBtn = e.target.closest('#emptyTrashModalBtn, .btn-empty-trash');
    if (emptyBtn) {
      e.preventDefault();
      promptEmptyTrash();
      return;
    }
  });

  // Upload Attachment Modal
  if (closeUploadModalBtn) closeUploadModalBtn.addEventListener('click', closeUploadModal);
  if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', closeUploadModal);
  if (uploadAttachmentForm) uploadAttachmentForm.addEventListener('submit', handleSubmitUpload);

  if (modalFileInput) {
    modalFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        modalFileName.textContent = file.name;
        modalFileSize.textContent = formatFileSize(file.size);
        modalDropPrompt.style.display = 'none';
        modalSelectedFile.style.display = 'flex';
      }
    });
  }

  if (modalClearFileBtn) {
    modalClearFileBtn.addEventListener('click', () => {
      modalFileInput.value = '';
      modalDropPrompt.style.display = 'block';
      modalSelectedFile.style.display = 'none';
    });
  }

  // View Switcher (Danh sách vs Bảng Kanban vs Lịch biểu)
  if (viewListBtn) viewListBtn.addEventListener('click', () => setViewMode('list'));
  if (viewKanbanBtn) viewKanbanBtn.addEventListener('click', () => setViewMode('kanban'));
  const viewCalendarBtn = document.getElementById('viewCalendarBtn');
  if (viewCalendarBtn) viewCalendarBtn.addEventListener('click', () => setViewMode('calendar'));

  // Theme Toggle Button
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

  // Bulk Actions Listeners
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  if (selectAllCheckbox) selectAllCheckbox.addEventListener('change', handleSelectAllToggle);

  // Event delegation cho checkbox con và nút hoàn thành công việc
  if (tasksContainer) {
    tasksContainer.addEventListener('change', (e) => {
      const cb = e.target.closest('.task-item-checkbox');
      if (cb) {
        const id = Number(cb.dataset.id || cb.getAttribute('data-id'));
        if (!isNaN(id)) {
          if (cb.checked) {
            selectedTaskIds.add(id);
          } else {
            selectedTaskIds.delete(id);
          }
          updateBulkActionBar();
        }
      }
    });

    tasksContainer.addEventListener('click', async (e) => {
      const checkBtn = e.target.closest('.custom-check');
      if (checkBtn) {
        e.preventDefault();
        e.stopPropagation();
        const todoId = Number(checkBtn.dataset.id || checkBtn.getAttribute('data-id'));
        const curStatus = checkBtn.dataset.status || checkBtn.getAttribute('data-status');
        if (!isNaN(todoId)) {
          await toggleTaskComplete(e, todoId, curStatus);
        }
      }
    });
  }

  const bulkStatusPendingBtn = document.getElementById('bulkStatusPendingBtn');
  if (bulkStatusPendingBtn) bulkStatusPendingBtn.addEventListener('click', () => handleBulkUpdateStatus('pending'));

  const bulkStatusProgressBtn = document.getElementById('bulkStatusProgressBtn');
  if (bulkStatusProgressBtn) bulkStatusProgressBtn.addEventListener('click', () => handleBulkUpdateStatus('in_progress'));

  const bulkStatusCompleteBtn = document.getElementById('bulkStatusCompleteBtn');
  if (bulkStatusCompleteBtn) bulkStatusCompleteBtn.addEventListener('click', () => handleBulkUpdateStatus('completed'));

  const bulkPriorityHighBtn = document.getElementById('bulkPriorityHighBtn');
  if (bulkPriorityHighBtn) bulkPriorityHighBtn.addEventListener('click', () => handleBulkUpdatePriority('high'));

  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  if (bulkDeleteBtn) bulkDeleteBtn.addEventListener('click', handleBulkDelete);

  const bulkClearSelectionBtn = document.getElementById('bulkClearSelectionBtn');
  if (bulkClearSelectionBtn) bulkClearSelectionBtn.addEventListener('click', clearBulkSelection);

  // Calendar Navigation Listeners
  const calPrevMonthBtn = document.getElementById('calPrevMonthBtn');
  if (calPrevMonthBtn) calPrevMonthBtn.addEventListener('click', calPrevMonth);

  const calNextMonthBtn = document.getElementById('calNextMonthBtn');
  if (calNextMonthBtn) calNextMonthBtn.addEventListener('click', calNextMonth);

  const calTodayBtn = document.getElementById('calTodayBtn');
  if (calTodayBtn) calTodayBtn.addEventListener('click', calToday);

  // Excel/CSV Import Listeners
  const openImportBtn = document.getElementById('openImportBtn');
  if (openImportBtn) openImportBtn.addEventListener('click', openImportModal);

  const closeImportModalBtn = document.getElementById('closeImportModalBtn');
  if (closeImportModalBtn) closeImportModalBtn.addEventListener('click', closeImportModal);

  const cancelImportBtn = document.getElementById('cancelImportBtn');
  if (cancelImportBtn) cancelImportBtn.addEventListener('click', closeImportModal);

  const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
  if (downloadTemplateBtn) downloadTemplateBtn.addEventListener('click', handleDownloadTemplate);

  const startImportBtn = document.getElementById('startImportBtn');
  if (startImportBtn) startImportBtn.addEventListener('click', handleStartImport);

  const importDropzone = document.getElementById('importDropzone');
  const importFileInput = document.getElementById('importFileInput');
  const removeImportFileBtn = document.getElementById('removeImportFileBtn');

  if (importDropzone && importFileInput) {
    importDropzone.addEventListener('click', (e) => {
      if (e.target.closest('#removeImportFileBtn')) return;
      importFileInput.click();
    });

    importDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      importDropzone.classList.add('dragover');
    });

    importDropzone.addEventListener('dragleave', () => {
      importDropzone.classList.remove('dragover');
    });

    importDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      importDropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImportFileSelect(e.dataTransfer.files[0]);
      }
    });

    importFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImportFileSelect(e.target.files[0]);
      }
    });
  }

  if (removeImportFileBtn) {
    removeImportFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearImportFile();
    });
  }

  // Nút gửi email nhắc việc thủ công
  if (triggerReminderEmailBtn) {
    triggerReminderEmailBtn.addEventListener('click', handleTriggerReminderEmail);
  }

  // ==================== COLLABORATION & RBAC EVENT LISTENERS ====================
  // 1. Workspace Modal Triggers
  const openWorkspaceBtn = document.getElementById('openWorkspaceBtn');
  const closeWorkspaceModalBtn = document.getElementById('closeWorkspaceModalBtn');
  const workspaceModal = document.getElementById('workspaceModal');
  const btnShowCreateWorkspaceForm = document.getElementById('btnShowCreateWorkspaceForm');
  const btnCancelCreateWorkspace = document.getElementById('btnCancelCreateWorkspace');
  const btnCancelCreateWorkspace2 = document.getElementById('btnCancelCreateWorkspace2');
  const createWorkspaceForm = document.getElementById('createWorkspaceForm');
  const btnInviteMember = document.getElementById('btnInviteMember');

  if (openWorkspaceBtn) openWorkspaceBtn.addEventListener('click', openWorkspaceModal);
  if (closeWorkspaceModalBtn) closeWorkspaceModalBtn.addEventListener('click', closeWorkspaceModal);
  if (workspaceModal) {
    workspaceModal.addEventListener('click', (e) => {
      if (e.target === workspaceModal) closeWorkspaceModal();
    });
  }

  if (btnShowCreateWorkspaceForm) {
    btnShowCreateWorkspaceForm.addEventListener('click', () => {
      const createBox = document.getElementById('createWorkspaceBox');
      const detailBox = document.getElementById('workspaceDetailsBox');
      if (createBox) createBox.style.display = 'block';
      if (detailBox) detailBox.style.display = 'none';
      const nameInput = document.getElementById('newWorkspaceName');
      if (nameInput) setTimeout(() => nameInput.focus(), 150);
    });
  }

  const cancelCreateWs = () => {
    const createBox = document.getElementById('createWorkspaceBox');
    const detailBox = document.getElementById('workspaceDetailsBox');
    if (createBox) createBox.style.display = 'none';
    if (detailBox) detailBox.style.display = 'block';
  };
  if (btnCancelCreateWorkspace) btnCancelCreateWorkspace.addEventListener('click', cancelCreateWs);
  if (btnCancelCreateWorkspace2) btnCancelCreateWorkspace2.addEventListener('click', cancelCreateWs);
  if (createWorkspaceForm) createWorkspaceForm.addEventListener('submit', handleCreateWorkspace);
  if (btnInviteMember) btnInviteMember.addEventListener('click', handleInviteMember);

  // 2. Admin Modal Triggers
  const openAdminBtn = document.getElementById('openAdminBtn');
  const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');
  const adminDashboardModal = document.getElementById('adminDashboardModal');
  const adminUserSearchInput = document.getElementById('adminUserSearchInput');
  const adminRoleFilter = document.getElementById('adminRoleFilter');
  const adminStatusFilter = document.getElementById('adminStatusFilter');

  if (openAdminBtn) openAdminBtn.addEventListener('click', openAdminModal);
  if (closeAdminModalBtn) closeAdminModalBtn.addEventListener('click', closeAdminModal);
  if (adminDashboardModal) {
    adminDashboardModal.addEventListener('click', (e) => {
      if (e.target === adminDashboardModal) closeAdminModal();
    });
  }

  if (adminUserSearchInput) adminUserSearchInput.addEventListener('input', renderAdminUsersTable);
  if (adminRoleFilter) adminRoleFilter.addEventListener('change', renderAdminUsersTable);
  if (adminStatusFilter) adminStatusFilter.addEventListener('change', renderAdminUsersTable);

  // 3. Task Comments Submission
  const btnSubmitTaskComment = document.getElementById('btnSubmitTaskComment');
  const taskNewCommentInput = document.getElementById('taskNewCommentInput');
  if (btnSubmitTaskComment) btnSubmitTaskComment.addEventListener('click', handleSubmitTaskComment);
  if (taskNewCommentInput) {
    taskNewCommentInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitTaskComment();
      }
    });
  }

  // 4. Dropdown Workspace onchange -> Cập nhật Assignee
  const createTaskWorkspace = document.getElementById('createTaskWorkspace');
  if (createTaskWorkspace) {
    createTaskWorkspace.addEventListener('change', () => {
      updateAssigneeDropdown('createTaskWorkspace', 'createTaskAssignee');
    });
  }

  const editTaskWorkspace = document.getElementById('editTaskWorkspace');
  if (editTaskWorkspace) {
    editTaskWorkspace.addEventListener('change', () => {
      updateAssigneeDropdown('editTaskWorkspace', 'editTaskAssignee');
    });
  }
}

// File dropzone helpers
function handleSelectCreateFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    showToast('Tệp quá lớn! Giới hạn tối đa là 5MB.', 'error');
    return;
  }
  selectedCreateFile = file;
  previewFileName.textContent = file.name;
  previewFileSize.textContent = `(${formatFileSize(file.size)})`;
  dropzoneContent.style.display = 'none';
  selectedFilePreview.style.display = 'flex';
}

function clearCreateFile() {
  selectedCreateFile = null;
  createFileInput.value = '';
  dropzoneContent.style.display = 'flex';
  selectedFilePreview.style.display = 'none';
}

// ==================== CRUD OPERATIONS ====================
async function handleCreateTask(e) {
  if (e) e.preventDefault();

  if (!authToken) {
    openAuthModal('login');
    showToast('Vui lòng đăng nhập để tạo công việc!', 'error');
    return;
  }

  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();
  const status = taskStatusSelect.value;
  const priority = taskPrioritySelect.value;
  const dueDate = taskDueDateInput.value ? new Date(taskDueDateInput.value).toISOString() : null;

  // Workspace & Assignee
  const wsSelect = document.getElementById('createTaskWorkspace');
  const asSelect = document.getElementById('createTaskAssignee');
  const workspaceId = wsSelect && wsSelect.value ? Number(wsSelect.value) : null;
  const assigneeId = asSelect && asSelect.value ? Number(asSelect.value) : null;

  if (title.length < 3) {
    showToast('Tiêu đề công việc phải có ít nhất 3 ký tự!', 'error');
    taskTitleInput.focus();
    return;
  }

  submitCreateBtn.disabled = true;
  submitCreateBtn.innerHTML = `<span><i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu Prisma...</span>`;

  try {
    const res = await apiFetch('/todos', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        status,
        priority,
        dueDate,
        workspaceId,
        assigneeId
      })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      const newTodo = result.data;

      // Nếu có chọn file đính kèm, upload file ngay
      if (selectedCreateFile) {
        const formData = new FormData();
        formData.append('file', selectedCreateFile);
        await apiFetch(`/todos/${newTodo.id}/attachments`, {
          method: 'POST',
          body: formData
        });
      }

      // Reset form
      createTaskForm.reset();
      charCounter.textContent = '0/100';
      clearCreateFile();
      taskStatusSelect.value = 'pending';
      taskPrioritySelect.value = 'medium';
      if (wsSelect) wsSelect.value = '';
      if (asSelect) {
        asSelect.innerHTML = '<option value="">(Chưa phân công)</option>';
        asSelect.value = '';
      }

      showToast('Đã thêm công việc thành công vào MySQL!', 'success');
      currentPagination.currentPage = 1;
      await Promise.all([fetchTodos(), fetchStats()]);
    } else {
      const msg = result.errors ? result.errors[0].message : (result.message || 'Lỗi khi tạo việc!');
      showToast(msg, 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi gửi dữ liệu lên máy chủ!', 'error');
  } finally {
    submitCreateBtn.disabled = false;
    submitCreateBtn.innerHTML = `
      <span class="btn-text"><i class="fa-solid fa-plus"></i> Tạo công việc ngay</span>
      <span class="hotkey-badge">Ctrl + ↵</span>
    `;
  }
}

const pendingCompleteSet = new Set();

async function toggleTaskComplete(arg1, arg2, arg3) {
  let e = null;
  let id = null;
  let currentStatus = null;

  if (arg1 && typeof arg1 === 'object' && (arg1.target || arg1.preventDefault)) {
    e = arg1;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    id = arg2;
    currentStatus = arg3;
  } else {
    id = arg1;
    currentStatus = arg2;
  }

  const todoId = Number(id);
  if (isNaN(todoId)) {
    console.error('ID công việc không hợp lệ:', id);
    return;
  }

  // Chống double-invocation nếu cả inline onclick và event delegation đều bắt sự kiện
  if (pendingCompleteSet.has(todoId)) return;
  pendingCompleteSet.add(todoId);

  // Tìm công việc trong danh sách hiện tại
  const todo = currentTodos.find(t => Number(t.id) === todoId);
  const curStatus = currentStatus || (todo ? todo.status : 'pending');
  const newStatus = curStatus === 'completed' ? 'pending' : 'completed';

  // 1. Phản hồi giao diện tức thì (Optimistic UI update) để người dùng không cảm giác bị đơ
  const btn = document.querySelector(`button.custom-check[data-id="${todoId}"]`);
  const card = document.querySelector(`.task-item[data-id="${todoId}"]`);
  if (btn) {
    btn.classList.toggle('checked', newStatus === 'completed');
    btn.setAttribute('data-status', newStatus);
    btn.setAttribute('title', newStatus === 'completed' ? 'Bấm để đánh dấu chưa hoàn thành' : 'Bấm để đánh dấu đã hoàn thành');
  }
  if (card) {
    card.classList.toggle('is-done', newStatus === 'completed');
  }

  try {
    const res = await apiFetch(`/todos/${todoId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      const idx = currentTodos.findIndex(t => Number(t.id) === todoId);
      if (idx !== -1) {
        currentTodos[idx] = result.data;
      }
      
      if (statusFilter !== 'all') {
        await fetchTodos();
      } else {
        renderActiveView();
      }
      await fetchStats();
      showToast(`Đã đổi trạng thái: ${getStatusLabel(newStatus)}`, 'success');
    } else {
      // Rollback optimistic UI nếu máy chủ báo lỗi
      if (btn) {
        btn.classList.toggle('checked', curStatus === 'completed');
        btn.setAttribute('data-status', curStatus);
      }
      if (card) {
        card.classList.toggle('is-done', curStatus === 'completed');
      }
      showToast(result.message || 'Không thể cập nhật trạng thái!', 'error');
    }
  } catch (err) {
    console.error('Lỗi toggleTaskComplete:', err);
    // Rollback optimistic UI nếu lỗi mạng
    if (btn) {
      btn.classList.toggle('checked', curStatus === 'completed');
      btn.setAttribute('data-status', curStatus);
    }
    if (card) {
      card.classList.toggle('is-done', curStatus === 'completed');
    }
    showToast('Lỗi mạng khi cập nhật trạng thái công việc!', 'error');
  } finally {
    pendingCompleteSet.delete(todoId);
  }
}

window.toggleTaskComplete = toggleTaskComplete;

async function openEditModal(todoId) {
  try {
    let todo = currentTodos.find(t => t.id == todoId);
    if (!todo) {
      try {
        const res = await apiFetch(`/todos/${todoId}`);
        const data = await res.json();
        if (res.ok && data.success) todo = data.data;
      } catch (err) {}
    }
    if (!todo) {
      showToast('Không tìm thấy thông tin công việc để sửa!', 'error');
      return;
    }

    activeEditTaskId = todo.id;

    // Reset về tab Details đầu tiên
    switchEditModalTab('details');

    const idInput = document.getElementById('editTaskId');
    const titleInput = document.getElementById('editTaskTitle');
    const descInput = document.getElementById('editTaskDescription');
    const statusInput = document.getElementById('editTaskStatus');
    const priorityInput = document.getElementById('editTaskPriority');
    const dueDateInput = document.getElementById('editTaskDueDate');
    const modal = document.getElementById('editModalOverlay');

    if (idInput) idInput.value = todo.id;
    if (titleInput) titleInput.value = todo.title || '';
    if (descInput) descInput.value = todo.description || '';
    if (statusInput) statusInput.value = todo.status || 'pending';
    if (priorityInput) priorityInput.value = todo.priority || 'medium';

    // Workspace & Assignee Selects
    populateWorkspaceSelectElement('editTaskWorkspace', todo.workspaceId || '');
    updateAssigneeDropdown('editTaskWorkspace', 'editTaskAssignee', todo.assigneeId || null);

    // Format dueDate for datetime-local input (YYYY-MM-DDTHH:mm)
    if (dueDateInput) {
      if (todo.dueDate || todo.due_date) {
        const d = new Date(todo.dueDate || todo.due_date);
        if (!isNaN(d.getTime())) {
          const pad = n => n.toString().padStart(2, '0');
          dueDateInput.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } else {
          dueDateInput.value = '';
        }
      } else {
        dueDateInput.value = '';
      }
    }

    // Attachments in edit modal
    const attSection = document.getElementById('editAttachmentsSection');
    const attList = document.getElementById('editAttachmentsList');
    const attachments = todo.attachments || [];
    if (attSection && attList) {
      if (attachments.length > 0) {
        attSection.style.display = 'block';
        attList.innerHTML = attachments.map(att => `
          <div class="attachment-chip">
            <i class="${getFileIcon(att.mimeType || att.fileName)} att-icon"></i>
            <span class="att-name">${escapeHTML(att.fileName)}</span>
            <span class="att-size">(${formatFileSize(att.fileSize)})</span>
            <button type="button" class="btn-del-att" onclick="handleDeleteAttachment(event, ${todo.id}, ${att.id})" title="Xóa file">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        `).join('');
      } else {
        attSection.style.display = 'none';
      }
    }

    // Subtasks in edit modal (Next-Level AI)
    renderEditSubtasks(todo.subtasks || [], todo.id);

    // Tải Bình luận & Nhật ký Hoạt động (Team Collaboration)
    loadTaskComments(todo.id);
    loadTaskActivities(todo.id);

    if (modal) {
      modal.classList.add('active');
    }
    if (titleInput) {
      setTimeout(() => titleInput.focus(), 150);
    }
  } catch (err) {
    console.error('Lỗi khi mở modal chỉnh sửa:', err);
    showToast('Lỗi khi mở form chỉnh sửa công việc!', 'error');
  }
}

function closeEditModal() {
  const modal = document.getElementById('editModalOverlay');
  const form = document.getElementById('editTaskForm');
  const subtaskInput = document.getElementById('newSubtaskTitleInput');
  if (subtaskInput) subtaskInput.value = '';
  if (modal) modal.classList.remove('active');
  if (form) form.reset();
  activeEditTaskId = null;
}

async function handleSaveEdit(e) {
  e.preventDefault();
  const idInput = document.getElementById('editTaskId');
  const titleInput = document.getElementById('editTaskTitle');
  const descInput = document.getElementById('editTaskDescription');
  const statusInput = document.getElementById('editTaskStatus');
  const priorityInput = document.getElementById('editTaskPriority');
  const dueDateInput = document.getElementById('editTaskDueDate');

  const wsSelect = document.getElementById('editTaskWorkspace');
  const asSelect = document.getElementById('editTaskAssignee');
  const workspaceId = wsSelect && wsSelect.value ? Number(wsSelect.value) : null;
  const assigneeId = asSelect && asSelect.value ? Number(asSelect.value) : null;

  const id = idInput ? idInput.value : null;
  const title = titleInput ? titleInput.value.trim() : '';
  const description = descInput ? descInput.value.trim() : '';
  const status = statusInput ? statusInput.value : 'pending';
  const priority = priorityInput ? priorityInput.value : 'medium';
  const dueDate = dueDateInput && dueDateInput.value ? new Date(dueDateInput.value).toISOString() : null;

  if (!id) return;
  if (title.length < 3) {
    showToast('Tiêu đề phải có ít nhất 3 ký tự!', 'error');
    return;
  }

  try {
    const res = await apiFetch(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title,
        description,
        status,
        priority,
        dueDate,
        workspaceId,
        assigneeId
      })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      const idx = currentTodos.findIndex(t => t.id == id);
      if (idx !== -1) {
        currentTodos[idx] = result.data;
        renderActiveView();
      }
      closeEditModal();
      await fetchStats();
      showToast('Đã lưu thay đổi vào MySQL thành công!', 'success');
    } else {
      showToast(result.message || 'Cập nhật thất bại!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi lưu chỉnh sửa', 'error');
  }
}

// ==================== SOFT DELETE, TRASH & UNDO (LEVEL 3 PRO) ====================
let pendingDeleteTaskId = null;

function promptDeleteTask(id, title) {
  const todo = currentTodos.find(t => t.id == id);
  const taskTitle = title || (todo ? todo.title : 'Công việc này');
  pendingDeleteTaskId = id;

  const titleEl = document.getElementById('confirmDeleteTaskTitle');
  if (titleEl) {
    titleEl.textContent = taskTitle;
  }

  const modal = document.getElementById('deleteConfirmModal');
  if (modal) {
    modal.classList.add('active');
  }
}

function promptDeleteFromEditModal() {
  const idInput = document.getElementById('editTaskId');
  const titleInput = document.getElementById('editTaskTitle');
  if (!idInput || !idInput.value) return;
  const id = Number(idInput.value);
  const title = titleInput ? titleInput.value : '';
  closeEditModal();
  promptDeleteTask(id, title);
}

function closeDeleteConfirmModal() {
  pendingDeleteTaskId = null;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

async function handleConfirmDeleteSubmit() {
  if (!pendingDeleteTaskId) return;
  const idToDelete = pendingDeleteTaskId;
  closeDeleteConfirmModal();
  await handleDeleteTask(idToDelete);
}

// Global exposure for delete confirm modal
window.promptDeleteTask = promptDeleteTask;
window.promptDeleteFromEditModal = promptDeleteFromEditModal;
window.closeDeleteConfirmModal = closeDeleteConfirmModal;
window.handleConfirmDeleteSubmit = handleConfirmDeleteSubmit;

async function handleDeleteTask(id, title) {
  try {
    const todo = currentTodos.find(t => t.id == id);
    const taskTitle = title || (todo ? todo.title : 'Công việc');

    const res = await apiFetch(`/todos/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      // Xóa lập tức khỏi giao diện
      const idx = currentTodos.findIndex(t => t.id == id);
      if (idx !== -1) {
        currentTodos.splice(idx, 1);
        renderActiveView();
      }
      await Promise.all([fetchStats(), fetchTrashCount()]);
      showUndoToast(id, taskTitle);
    } else {
      const data = await res.json();
      showToast(data.message || 'Không thể xóa công việc!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi xóa công việc', 'error');
  }
}

function showUndoToast(arg1, arg2) {
  let toastId = 'undo_' + Date.now();
  let subtitle = 'Đã chuyển vào thùng rác';
  let title = '';
  let onUndo = null;

  if (typeof arg2 === 'function') {
    // Bulk delete or callback style
    title = arg1;
    onUndo = arg2;
  } else {
    // Single task delete style: arg1 = taskId, arg2 = taskTitle
    const id = arg1;
    title = arg2 || 'Công việc';
    onUndo = async () => {
      await handleRestoreTask(id, true);
    };
  }

  const toast = document.createElement('div');
  toast.className = 'toast-item toast-undo-item';

  toast.innerHTML = `
    <div class="toast-undo-box">
      <div class="toast-undo-left">
        <div class="toast-bubble-icon toast-bubble-rose">
          <i class="fa-solid fa-trash-can"></i>
        </div>
        <div class="toast-undo-content">
          <span class="toast-undo-subtitle">${escapeHTML(subtitle)}</span>
          <span class="toast-undo-title" title="${escapeHTML(title)}">${escapeHTML(title)}</span>
        </div>
      </div>
      <button type="button" class="btn-toast-undo" id="${toastId}">
        <i class="fa-solid fa-rotate-left"></i>
        <span>Hoàn tác</span>
      </button>
    </div>
  `;

  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  const undoBtn = toast.querySelector(`#${toastId}`);
  let undone = false;

  if (undoBtn) {
    undoBtn.onclick = async () => {
      if (undone) return;
      undone = true;
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
      try {
        await onUndo();
      } catch (err) {
        showToast('Lỗi khi hoàn tác', 'error');
      }
    };
  }

  setTimeout(() => {
    if (!undone && toast.parentNode) {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }
  }, 7000);
}

async function fetchTrashCount() {
  if (!authToken) return;
  try {
    const res = await apiFetch('/todos/trash');
    const data = await res.json();
    if (res.ok && data.success) {
      const count = (data.data || []).length;
      if (trashCountBadge) {
        trashCountBadge.textContent = count;
        trashCountBadge.style.display = count > 0 ? 'inline-flex' : 'none';
      }
    }
  } catch (_) {}
}

async function openTrashModal() {
  if (!authToken) {
    openAuthModal('login');
    showToast('Vui lòng đăng nhập để xem thùng rác!', 'info');
    return;
  }

  trashModalOverlay.classList.add('active');
  trashListContainer.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #64748b;">
      <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.5rem; color: var(--brand-primary);"></i>
      <p style="margin-top: 10px;">Đang tải danh sách thùng rác...</p>
    </div>
  `;

  try {
    const res = await apiFetch('/todos/trash');
    const data = await res.json();

    if (res.ok && data.success) {
      const items = data.data || [];
      renderTrashList(items);
      if (trashCountBadge) {
        trashCountBadge.textContent = items.length;
        trashCountBadge.style.display = items.length > 0 ? 'inline-flex' : 'none';
      }
    } else {
      trashListContainer.innerHTML = `<div class="trash-empty-state"><p>${data.message || 'Lỗi khi tải thùng rác'}</p></div>`;
    }
  } catch (err) {
    trashListContainer.innerHTML = `<div class="trash-empty-state"><p>Lỗi kết nối khi tải thùng rác</p></div>`;
  }
}

function closeTrashModal() {
  trashModalOverlay.classList.remove('active');
}

function renderTrashList(items) {
  if (!items || items.length === 0) {
    trashListContainer.innerHTML = `
      <div class="trash-empty-state">
        <i class="fa-solid fa-trash-can"></i>
        <span>Thùng rác hiện đang trống!</span>
      </div>
    `;
    return;
  }

  trashListContainer.innerHTML = items.map(item => {
    const deletedTime = formatDate(item.deletedAt || item.deleted_at);
    return `
      <div class="trash-item-card" data-id="${item.id}">
        <div class="trash-item-left">
          <span class="trash-item-title">${escapeHTML(item.title)}</span>
          <div class="trash-item-meta">
            <span><i class="fa-regular fa-clock"></i> Xóa: ${deletedTime}</span>
            <span>Mức ưu tiên: ${item.priority || 'medium'}</span>
          </div>
        </div>
        <div class="trash-item-actions">
          <button type="button" class="btn-trash-action btn-restore" data-id="${item.id}" title="Khôi phục công việc này">
            <i class="fa-solid fa-rotate-left"></i> <span>Khôi phục</span>
          </button>
          <button type="button" class="btn-trash-action btn-permanent-delete" data-id="${item.id}" title="Xóa vĩnh viễn không thể phục hồi">
            <i class="fa-solid fa-trash-can"></i> <span>Xóa vĩnh viễn</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function handleRestoreTask(id, fromUndo = false) {
  const numId = Number(id);
  if (isNaN(numId)) return;

  const card = document.querySelector(`.trash-item-card[data-id="${numId}"]`);
  const btn = card ? card.querySelector('.btn-restore') : null;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Đang phục hồi...</span>';
  }

  try {
    const res = await apiFetch(`/todos/${numId}/restore`, {
      method: 'PATCH'
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast('Đã khôi phục công việc thành công!', 'success');
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px)';
        setTimeout(() => {
          card.remove();
          const remaining = document.querySelectorAll('.trash-item-card');
          if (!remaining || remaining.length === 0) {
            renderTrashList([]);
          }
        }, 200);
      }
      await Promise.all([fetchTodos(), fetchStats(), fetchTrashCount()]);
    } else {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> <span>Khôi phục</span>';
      }
      showToast(result.message || 'Khôi phục thất bại!', 'error');
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> <span>Khôi phục</span>';
    }
    showToast('Lỗi kết nối khi khôi phục công việc', 'error');
  }
}

let pendingPermanentDeleteId = null;

function promptPermanentDelete(id, optionalTitle) {
  const numId = Number(id);
  if (isNaN(numId)) return;

  pendingPermanentDeleteId = numId;
  const card = document.querySelector(`.trash-item-card[data-id="${numId}"]`);
  const title = optionalTitle || (card ? card.querySelector('.trash-item-title')?.textContent : 'công việc này');

  const titleEl = document.getElementById('confirmPermanentDeleteTaskTitle');
  if (titleEl) titleEl.textContent = title;

  const modal = document.getElementById('permanentDeleteModal');
  if (modal) {
    modal.classList.add('active');
  } else {
    if (confirm(`Hành động này KHÔNG THỂ HOÀN TÁC!\n\nBạn có chắc chắn muốn xóa VĨNH VIỄN công việc:\n"${title}"?`)) {
      executePermanentDelete(numId);
    }
  }
}

function closePermanentDeleteModal() {
  const modal = document.getElementById('permanentDeleteModal');
  if (modal) modal.classList.remove('active');
  pendingPermanentDeleteId = null;
}

async function executePermanentDelete(id) {
  const numId = Number(id || pendingPermanentDeleteId);
  if (isNaN(numId)) return;

  const submitBtn = document.getElementById('submitPermanentDeleteModalBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Đang xóa...</span>';
  }

  const card = document.querySelector(`.trash-item-card[data-id="${numId}"]`);
  const inlineBtn = card ? card.querySelector('.btn-permanent-delete') : null;
  if (inlineBtn) {
    inlineBtn.disabled = true;
    inlineBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Đang xóa...</span>';
  }

  try {
    const res = await apiFetch(`/todos/${numId}/permanent`, {
      method: 'DELETE'
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast('Đã xóa vĩnh viễn công việc khỏi hệ thống!', 'info');
      closePermanentDeleteModal();
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        setTimeout(() => {
          card.remove();
          const remaining = document.querySelectorAll('.trash-item-card');
          if (!remaining || remaining.length === 0) {
            renderTrashList([]);
          }
        }, 200);
      }
      await Promise.all([fetchStats(), fetchTrashCount()]);
    } else {
      showToast(result.message || 'Xóa vĩnh viễn thất bại!', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối khi xóa vĩnh viễn', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Xóa vĩnh viễn ngay';
    }
    if (inlineBtn) {
      inlineBtn.disabled = false;
      inlineBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> <span>Xóa vĩnh viễn</span>';
    }
  }
}

function promptEmptyTrash() {
  const remainingCards = document.querySelectorAll('.trash-item-card');
  if (!remainingCards || remainingCards.length === 0) {
    showToast('Thùng rác hiện đang trống!', 'info');
    return;
  }

  const msgEl = document.getElementById('emptyTrashConfirmMsg');
  if (msgEl) {
    msgEl.textContent = `Tất cả ${remainingCards.length} công việc trong thùng rác sẽ bị xóa vĩnh viễn và không thể khôi phục.`;
  }

  const modal = document.getElementById('emptyTrashConfirmModal');
  if (modal) {
    modal.classList.add('active');
  } else {
    if (confirm(`CẢNH BÁO: Hành động này KHÔNG THỂ HOÀN TÁC!\n\nBạn có chắc chắn muốn DỌN SẠCH TOÀN BỘ ${remainingCards.length} công việc trong thùng rác không?`)) {
      executeEmptyTrash();
    }
  }
}

function closeEmptyTrashConfirmModal() {
  const modal = document.getElementById('emptyTrashConfirmModal');
  if (modal) modal.classList.remove('active');
}

async function executeEmptyTrash() {
  const submitBtn = document.getElementById('submitEmptyTrashConfirmBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Đang dọn sạch...</span>';
  }

  const headerBtn = document.getElementById('emptyTrashModalBtn');
  if (headerBtn) {
    headerBtn.disabled = true;
    headerBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Đang dọn sạch...</span>';
  }

  try {
    const res = await apiFetch('/todos/trash/empty', {
      method: 'DELETE'
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast(result.message || 'Đã dọn sạch thùng rác thành công!', 'success');
      closeEmptyTrashConfirmModal();
      renderTrashList([]);
      await Promise.all([fetchStats(), fetchTrashCount()]);
    } else {
      showToast(result.message || 'Không thể dọn thùng rác', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi dọn thùng rác', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-broom"></i> Dọn sạch ngay';
    }
    if (headerBtn) {
      headerBtn.disabled = false;
      headerBtn.innerHTML = '<i class="fa-solid fa-broom"></i> <span>Dọn sạch thùng rác</span>';
    }
  }
}

// Ensure global access
window.handleRestoreTask = handleRestoreTask;
window.handlePermanentDeleteTask = promptPermanentDelete;
window.promptPermanentDelete = promptPermanentDelete;
window.closePermanentDeleteModal = closePermanentDeleteModal;
window.executePermanentDelete = executePermanentDelete;
window.handleEmptyTrash = promptEmptyTrash;
window.promptEmptyTrash = promptEmptyTrash;
window.closeEmptyTrashConfirmModal = closeEmptyTrashConfirmModal;
window.executeEmptyTrash = executeEmptyTrash;

// ==================== PRODUCTIVITY ANALYTICS & EXCEL EXPORT ====================
async function openAnalyticsModal() {
  if (!authToken) {
    openAuthModal('login');
    showToast('Vui lòng đăng nhập để xem báo cáo năng suất!', 'info');
    return;
  }

  analyticsModalOverlay.classList.add('active');

  try {
    const res = await apiFetch('/todos/analytics');
    const result = await res.json();

    if (res.ok && result.success) {
      renderAnalyticsData(result.data);
    } else {
      showToast(result.message || 'Lỗi khi tải dữ liệu báo cáo!', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối khi tải số liệu phân tích!', 'error');
  }
}

function closeAnalyticsModal() {
  analyticsModalOverlay.classList.remove('active');
}

function renderAnalyticsData(data) {
  const { overview, priorityBreakdown, weeklyProductivity } = data;

  // KPI Numbers
  if (kpiCompletionRate) kpiCompletionRate.textContent = `${overview.completionRate}%`;
  if (kpiCompletedRatio) kpiCompletedRatio.textContent = `${overview.completed}/${overview.total} việc`;
  if (kpiRateBar) kpiRateBar.style.width = `${overview.completionRate}%`;
  if (kpiPendingCount) kpiPendingCount.textContent = overview.pending;
  if (kpiInProgressCount) kpiInProgressCount.textContent = overview.inProgress;
  if (kpiOverdueCount) kpiOverdueCount.textContent = overview.overdue;

  // Weekly Productivity Bar Chart
  if (weeklyBarChart && weeklyProductivity) {
    const maxCompleted = Math.max(...weeklyProductivity.map(w => w.completedCount), 1);

    weeklyBarChart.innerHTML = weeklyProductivity.map(item => {
      const heightPercent = Math.max(8, Math.round((item.completedCount / maxCompleted) * 100));
      return `
        <div class="bar-column">
          <span class="bar-count">${item.completedCount}</span>
          <div class="bar-fill-track">
            <div class="bar-fill" style="height: ${heightPercent}%" title="${item.label}: Hoàn thành ${item.completedCount}, Tạo ${item.createdCount}"></div>
          </div>
          <span class="bar-label">${item.date}</span>
        </div>
      `;
    }).join('');
  }

  // Priority Distribution List
  if (priorityDistributionList && priorityBreakdown) {
    const total = Math.max(overview.total, 1);
    const highPct = Math.round((priorityBreakdown.high / total) * 100);
    const medPct = Math.round((priorityBreakdown.medium / total) * 100);
    const lowPct = Math.round((priorityBreakdown.low / total) * 100);

    priorityDistributionList.innerHTML = `
      <div class="priority-row">
        <div class="priority-row-meta">
          <span class="priority-row-name"><span class="dot dot-amber" style="background:#ef4444;"></span> Ưu tiên Cao</span>
          <span>${priorityBreakdown.high} việc (${highPct}%)</span>
        </div>
        <div class="priority-row-bar"><div class="priority-bar-fill fill-high" style="width: ${highPct}%"></div></div>
      </div>
      <div class="priority-row">
        <div class="priority-row-meta">
          <span class="priority-row-name"><span class="dot dot-amber" style="background:#f59e0b;"></span> Ưu tiên Vừa</span>
          <span>${priorityBreakdown.medium} việc (${medPct}%)</span>
        </div>
        <div class="priority-row-bar"><div class="priority-bar-fill fill-medium" style="width: ${medPct}%"></div></div>
      </div>
      <div class="priority-row">
        <div class="priority-row-meta">
          <span class="priority-row-name"><span class="dot dot-amber" style="background:#10b981;"></span> Ưu tiên Thấp</span>
          <span>${priorityBreakdown.low} việc (${lowPct}%)</span>
        </div>
        <div class="priority-row-bar"><div class="priority-bar-fill fill-low" style="width: ${lowPct}%"></div></div>
      </div>
    `;
  }
}

async function handleExportExcel() {
  if (!authToken) {
    showToast('Vui lòng đăng nhập để xuất dữ liệu!', 'error');
    return;
  }

  exportExcelBtn.disabled = true;
  exportExcelBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xuất Excel...';

  try {
    const res = await apiFetch('/todos/export');
    if (!res.ok) {
      throw new Error('Lỗi khi tải file Excel');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nowStr = new Date().toISOString().slice(0, 10);
    a.download = `TaskMaster_Bao_Cao_${nowStr}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast('Tải về báo cáo Excel thành công!', 'success');
  } catch (err) {
    showToast('Lỗi khi tạo và tải file Excel!', 'error');
  } finally {
    exportExcelBtn.disabled = false;
    exportExcelBtn.innerHTML = '<i class="fa-solid fa-file-excel"></i> Xuất Excel (.xlsx)';
  }
}

function handlePrintReport() {
  window.print();
}

// ==================== BROWSER NOTIFICATION & AUDIO CHIME ====================
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // Note D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // Note A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.15); // Note A5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.15);
    osc1.stop(now + 0.7);
    osc2.stop(now + 0.7);
  } catch (e) {
    console.warn('AudioContext autoplay policy prevented audio:', e);
  }
}

function initNotificationState() {
  updateNotificationButtonUI();
}

function updateNotificationButtonUI() {
  if (!notificationBtnText || !bellIcon) return;

  if (browserNotifEnabled) {
    notificationBtnText.textContent = 'Nhắc việc: Bật';
    bellIcon.style.color = '#10b981';
  } else {
    notificationBtnText.textContent = 'Nhắc việc: Tắt';
    bellIcon.style.color = '#94a3b8';
  }
}

async function handleToggleNotification() {
  if (!browserNotifEnabled) {
    if (!('Notification' in window)) {
      showToast('Trình duyệt của bạn không hỗ trợ Web Notification API.', 'error');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      browserNotifEnabled = true;
      localStorage.setItem(NOTIF_ENABLED_KEY, 'true');
      updateNotificationButtonUI();
      playNotificationChime();
      showToast('Đã kích hoạt chuông nhắc việc trực tiếp trên trình duyệt!', 'success');
      checkUpcomingTasks();
    } else {
      showToast('Trình duyệt đã từ chối quyền thông báo. Vui lòng cấp quyền trong cài đặt trình duyệt!', 'error');
    }
  } else {
    browserNotifEnabled = false;
    localStorage.setItem(NOTIF_ENABLED_KEY, 'false');
    updateNotificationButtonUI();
    showToast('Đã tắt chuông nhắc việc trên trình duyệt.', 'info');
  }
}

function startBrowserNotificationScheduler() {
  if (notifSchedulerInterval) clearInterval(notifSchedulerInterval);
  notifSchedulerInterval = setInterval(checkUpcomingTasks, 60000); // Quét mỗi 60 giây
}

function checkUpcomingTasks() {
  if (!browserNotifEnabled || !authToken || !currentTodos || currentTodos.length === 0) {
    return;
  }

  const now = new Date();

  currentTodos.forEach(task => {
    if (task.status === 'completed' || !task.dueDate) return;
    if (notifiedTaskIds.has(task.id)) return;

    const due = new Date(task.dueDate);
    if (isNaN(due.getTime())) return;

    const diffMinutes = Math.round((due.getTime() - now.getTime()) / 60000);

    // Báo trước hạn trong vòng 30 phút hoặc vừa quá hạn trong vòng 10 phút
    if (diffMinutes <= 30 && diffMinutes >= -10) {
      notifiedTaskIds.add(task.id);
      playNotificationChime();

      const timeText = diffMinutes < 0 ? `đã quá hạn ${Math.abs(diffMinutes)} phút` : `sắp đến hạn trong ${diffMinutes} phút nữa`;

      if (Notification.permission === 'granted') {
        const notif = new Notification('TaskMaster Pro • Nhắc nhở công việc!', {
          body: `Công việc: "${task.title}" ${timeText} (${formatDate(task.dueDate)})!`,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234f46e5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
        });

        notif.onclick = () => {
          window.focus();
          const el = document.querySelector(`[data-id="${task.id}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.6)';
            setTimeout(() => el.style.boxShadow = '', 2500);
          }
        };
      }

      showToast(`⏰ Nhắc nhở: "${task.title}" ${timeText}!`, 'info');
    }
  });
}

// ==================== ATTACHMENT MODAL & ACTIONS ====================
function openUploadModal(todoId, title) {
  uploadTargetTaskId.value = todoId;
  uploadTargetTaskTitle.textContent = `Tải file cho: "${title}"`;
  modalFileInput.value = '';
  modalDropPrompt.style.display = 'block';
  modalSelectedFile.style.display = 'none';
  uploadAttachmentModal.classList.add('active');
}

function closeUploadModal() {
  uploadAttachmentModal.classList.remove('active');
  uploadAttachmentForm.reset();
}

async function handleSubmitUpload(e) {
  e.preventDefault();
  const todoId = uploadTargetTaskId.value;
  const file = modalFileInput.files[0];

  if (!file) {
    showToast('Vui lòng chọn một file!', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('File vượt quá giới hạn 5MB!', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitUploadBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải lên...';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await apiFetch(`/todos/${todoId}/attachments`, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();

    if (res.ok && result.success) {
      closeUploadModal();
      showToast('Đã tải tệp đính kèm lên thành công!', 'success');
      await fetchTodos();
    } else {
      showToast(result.message || 'Lỗi tải tệp tin!', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối khi tải tệp tin', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Tải tệp lên ngay';
  }
}

async function handleDeleteAttachment(e, todoId, attachmentId) {
  if (e) e.preventDefault();
  if (e) e.stopPropagation();

  if (!confirm('Bạn có chắc muốn xóa tệp đính kèm này?')) return;

  try {
    const res = await apiFetch(`/todos/${todoId}/attachments/${attachmentId}`, {
      method: 'DELETE'
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast('Đã xóa tệp đính kèm!', 'info');
      // Nếu đang mở edit modal thì refresh lại
      if (editModalOverlay.classList.contains('active')) {
        closeEditModal();
      }
      await fetchTodos();
    } else {
      showToast(result.message || 'Lỗi khi xóa tệp đính kèm!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi xóa tệp đính kèm', 'error');
  }
}

// ==================== SEED DEMO DATA (LEVEL 3) ====================
async function handleSeedDemoData() {
  if (!authToken) {
    openAuthModal('login');
    showToast('Vui lòng đăng nhập trước khi tạo dữ liệu mẫu!', 'info');
    return;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const sampleTasks = [
    {
      title: '🛡️ Triển khai Bảo mật Express: Helmet, CORS & Rate Limiter',
      description: 'Thiết lập các HTTP security headers, cấu hình CSP và giới hạn tần suất request để chống brute force và tấn công DDoS.',
      status: 'completed',
      priority: 'high',
      dueDate: yesterday.toISOString()
    },
    {
      title: '⚡ Tích hợp Prisma ORM & Prisma Migrate (MySQL 8.4)',
      description: 'Chuyển đổi toàn bộ câu lệnh SQL thuần sang Prisma Client type-safe, tạo migrations tự động và lược đồ dữ liệu quan hệ.',
      status: 'completed',
      priority: 'high',
      dueDate: yesterday.toISOString()
    },
    {
      title: '📁 Xây dựng API Upload File đính kèm với Multer (Max 5MB)',
      description: 'Hỗ trợ tải lên ảnh, PDF, tài liệu văn phòng, kiểm tra mimetype an toàn và phục vụ file tĩnh qua /uploads static.',
      status: 'in_progress',
      priority: 'medium',
      dueDate: tomorrow.toISOString()
    },
    {
      title: '🔍 Tối ưu hóa Bộ lọc, Sắp xếp đa chiều & Phân trang Zod',
      description: 'Validate request query parameters chặt chẽ bằng Zod Schema và truy vấn phân trang linh hoạt qua Prisma Client.',
      status: 'pending',
      priority: 'low',
      dueDate: nextWeek.toISOString()
    }
  ];

  seedDemoBtn.disabled = true;
  seedDemoBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang nạp...';

  try {
    for (const task of sampleTasks) {
      await apiFetch('/todos', {
        method: 'POST',
        body: JSON.stringify(task)
      });
    }
    showToast('Đã nạp 4 công việc mẫu chuẩn Cấp độ 3 vào tài khoản của bạn!', 'success');
    currentPagination.currentPage = 1;
    await Promise.all([fetchTodos(), fetchStats()]);
  } catch (err) {
    showToast('Lỗi khi nạp dữ liệu mẫu!', 'error');
  } finally {
    seedDemoBtn.disabled = false;
    seedDemoBtn.innerHTML = '<i class="fa-solid fa-seedling"></i> <span>Tạo dữ liệu mẫu</span>';
  }
}


// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;

  let icon = '<i class="fa-solid fa-circle-info"></i>';
  if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'error') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';

  toast.innerHTML = `
    <div class="toast-content-wrapper">
      <div class="toast-bubble-icon toast-bubble-${type}">${icon}</div>
      <span class="toast-message-text">${escapeHTML(message)}</span>
    </div>
  `;

  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Expose functions globally for inline HTML onclick handlers
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.promptDeleteTask = promptDeleteTask;
window.closeDeleteConfirmModal = closeDeleteConfirmModal;
window.handleConfirmDeleteSubmit = handleConfirmDeleteSubmit;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.toggleTaskComplete = toggleTaskComplete;
window.handleDeleteTask = handleDeleteTask;
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.handleDeleteAttachment = handleDeleteAttachment;
window.goToPage = goToPage;
window.changePage = goToPage; // backward compatibility
window.promptDeleteFromEditModal = promptDeleteFromEditModal;
window.setViewMode = setViewMode;
window.handleTriggerReminderEmail = handleTriggerReminderEmail;

// Advanced Features Window Handlers
window.openTrashModal = openTrashModal;
window.closeTrashModal = closeTrashModal;
window.handleRestoreTask = handleRestoreTask;
window.handlePermanentDeleteTask = handlePermanentDeleteTask;
window.handleEmptyTrash = handleEmptyTrash;
window.openAnalyticsModal = openAnalyticsModal;
window.closeAnalyticsModal = closeAnalyticsModal;
window.handleExportExcel = handleExportExcel;
window.handlePrintReport = handlePrintReport;
window.handleToggleNotification = handleToggleNotification;
window.handleLogoutCurrent = handleLogoutCurrent;
window.handleLogoutAllDevices = handleLogoutAllDevices;

// Next-Level AI Window Handlers
window.handleAiGenerateSubtasks = handleAiGenerateSubtasks;
window.handleAddSubtaskQuick = handleAddSubtaskQuick;
window.handleToggleSubtask = handleToggleSubtask;
window.handleDeleteSubtask = handleDeleteSubtask;
window.startVoiceRecognition = startVoiceRecognition;
window.closeVoiceModal = closeVoiceModal;
window.handleStopAndParseVoice = handleStopAndParseVoice;

// ==================== THEME CONTROLLER (DARK / LIGHT MODE) ====================
function initTheme() {
  if (!localStorage.getItem(THEME_KEY) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    currentTheme = 'dark';
  }
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  const themeIcon = document.getElementById('themeIcon');
  const themeBtnText = document.getElementById('themeBtnText');

  if (theme === 'dark') {
    if (themeIcon) {
      themeIcon.className = 'fa-solid fa-sun';
      themeIcon.style.color = '#f59e0b';
    }
    if (themeBtnText) themeBtnText.textContent = 'Sáng';
  } else {
    if (themeIcon) {
      themeIcon.className = 'fa-solid fa-moon';
      themeIcon.style.color = '#6366f1';
    }
    if (themeBtnText) themeBtnText.textContent = 'Tối';
  }
}

function toggleTheme() {
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  showToast(`Đã chuyển sang giao diện ${nextTheme === 'dark' ? 'Tối (Obsidian Dark)' : 'Sáng (Crisp Light)'}`, 'info');
}

// ==================== BULK ACTIONS CONTROLLER ====================
function handleTaskCheckboxChange(e, taskId) {
  if (e && e.stopPropagation) e.stopPropagation();
  const id = Number(taskId);
  if (isNaN(id)) return;

  const checkbox = (e && e.target && e.target.type === 'checkbox')
    ? e.target
    : document.getElementById(`task_cb_${id}`);

  if (checkbox && checkbox.checked) {
    selectedTaskIds.add(id);
  } else {
    selectedTaskIds.delete(id);
  }
  updateBulkActionBar();
}

window.handleTaskCheckboxChange = handleTaskCheckboxChange;

function handleSelectAllToggle(e) {
  const isChecked = e.target.checked;
  const pageIds = currentTodos.map(t => Number(t.id));

  if (isChecked) {
    pageIds.forEach(id => selectedTaskIds.add(id));
  } else {
    pageIds.forEach(id => selectedTaskIds.delete(id));
  }

  updateBulkActionBar();
}

window.handleSelectAllToggle = handleSelectAllToggle;

function clearBulkSelection() {
  selectedTaskIds.clear();
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  }
  updateBulkActionBar();
}

window.clearBulkSelection = clearBulkSelection;

function updateBulkActionBar() {
  const count = selectedTaskIds.size;
  const bulkActionBar = document.getElementById('bulkActionBar');
  const bulkSelectedCount = document.getElementById('bulkSelectedCount');
  const bulkDeleteCount = document.getElementById('bulkDeleteCount');
  const selectionCounterText = document.getElementById('selectionCounterText');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');

  // 1. Cập nhật số lượng đếm ở cả thanh công cụ trên và thanh nổi dưới
  if (bulkSelectedCount) bulkSelectedCount.textContent = count;
  if (bulkDeleteCount) bulkDeleteCount.textContent = count;
  if (selectionCounterText) selectionCounterText.textContent = `${count} mục đã chọn`;

  // 2. Đồng bộ trạng thái checked của TẤT CẢ checkbox con trong DOM hiện tại
  document.querySelectorAll('.task-item-checkbox').forEach(cb => {
    const id = Number(cb.dataset.id || cb.getAttribute('data-id'));
    if (!isNaN(id)) {
      cb.checked = selectedTaskIds.has(id);
    }
  });

  // 3. Đồng bộ trạng thái checkbox master (Chọn tất cả trên trang này)
  if (selectAllCheckbox) {
    const pageIds = currentTodos.map(t => Number(t.id));
    const checkedCountOnPage = pageIds.filter(id => selectedTaskIds.has(id)).length;
    const allChecked = pageIds.length > 0 && checkedCountOnPage === pageIds.length;
    const someChecked = checkedCountOnPage > 0 && checkedCountOnPage < pageIds.length;

    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = someChecked;
  }

  // 4. Hiển thị hoặc ẩn thanh thao tác hàng loạt
  if (bulkActionBar) {
    if (count > 0 && currentViewMode === 'list') {
      bulkActionBar.style.display = 'flex';
      setTimeout(() => bulkActionBar.classList.add('visible'), 10);
    } else {
      bulkActionBar.classList.remove('visible');
      setTimeout(() => {
        if (!bulkActionBar.classList.contains('visible')) {
          bulkActionBar.style.display = 'none';
        }
      }, 350);
    }
  }
}

window.updateBulkActionBar = updateBulkActionBar;

async function handleBulkUpdateStatus(status) {
  if (selectedTaskIds.size === 0) return;
  const ids = Array.from(selectedTaskIds);

  try {
    const res = await apiFetch('/todos/bulk/status', {
      method: 'PATCH',
      body: JSON.stringify({ ids, status })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast(result.message, 'success');
      clearBulkSelection();
      await fetchTodos();
      await fetchStats();
    } else {
      showToast(result.message || 'Lỗi cập nhật trạng thái hàng loạt!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi cập nhật hàng loạt!', 'error');
  }
}

async function handleBulkUpdatePriority(priority) {
  if (selectedTaskIds.size === 0) return;
  const ids = Array.from(selectedTaskIds);

  try {
    const res = await apiFetch('/todos/bulk/priority', {
      method: 'PATCH',
      body: JSON.stringify({ ids, priority })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast(result.message, 'success');
      clearBulkSelection();
      await fetchTodos();
    } else {
      showToast(result.message || 'Lỗi cập nhật mức ưu tiên hàng loạt!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi cập nhật hàng loạt!', 'error');
  }
}

async function handleBulkDelete() {
  const ids = Array.from(selectedTaskIds);
  if (ids.length === 0) return;

  if (!confirm(`Bạn có chắc chắn muốn chuyển ${ids.length} công việc đã chọn vào thùng rác?`)) return;

  try {
    const res = await apiFetch('/todos/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      clearBulkSelection();
      await fetchTodos();
      await fetchStats();
      await fetchTrashList();

      showUndoToast(
        `Đã chuyển ${result.count || ids.length} công việc vào thùng rác.`,
        async () => {
          for (const id of ids) {
            await apiFetch(`/todos/${id}/restore`, { method: 'PATCH' });
          }
          await fetchTodos();
          await fetchStats();
          await fetchTrashList();
          showToast('Đã hoàn tác khôi phục các công việc!', 'success');
        }
      );
    } else {
      showToast(result.message || 'Không thể xóa các công việc đã chọn!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi xóa hàng loạt!', 'error');
  }
}

// ==================== CALENDAR VIEW CONTROLLER ====================
function renderCalendarView() {
  if (!authToken) {
    renderEmptyAuth();
    return;
  }

  const calendarDaysGrid = document.getElementById('calendarDaysGrid');
  const calendarMonthTitle = document.getElementById('calendarMonthTitle');
  if (!calendarDaysGrid || !calendarMonthTitle) return;

  const year = calendarCurrentDate.getFullYear();
  const month = calendarCurrentDate.getMonth();

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  calendarMonthTitle.textContent = `${monthNames[month]}, ${year}`;

  const firstDay = new Date(year, month, 1);
  let firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Thứ 2 = 0, CN = 6

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let html = '';

  // 1. Ngày cuối tháng trước
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = formatDateStr(prevDate);
    html += renderCalDayCell(dayNum, true, false, dateStr);
  }

  // 2. Các ngày trong tháng hiện tại
  for (let day = 1; day <= daysInMonth; day++) {
    const curDate = new Date(year, month, day);
    const dateStr = formatDateStr(curDate);
    const isToday = dateStr === todayStr;
    html += renderCalDayCell(day, false, isToday, dateStr);
  }

  // 3. Ngày đầu tháng tiếp theo
  const totalCellsSoFar = firstDayOfWeek + daysInMonth;
  const nextDaysCount = (7 - (totalCellsSoFar % 7)) % 7;
  for (let day = 1; day <= nextDaysCount; day++) {
    const nextDate = new Date(year, month + 1, day);
    const dateStr = formatDateStr(nextDate);
    html += renderCalDayCell(day, true, false, dateStr);
  }

  calendarDaysGrid.innerHTML = html;
}

function formatDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderCalDayCell(dayNum, isOtherMonth, isToday, dateStr) {
  const dayTasks = currentTodos.filter(t => {
    if (!t.dueDate) return false;
    const taskDateStr = new Date(t.dueDate).toISOString().slice(0, 10);
    return taskDateStr === dateStr;
  });

  const tasksHtml = dayTasks.map(t => {
    const priorityClass = `priority-${t.priority || 'medium'}`;
    const statusClass = t.status === 'completed' ? 'status-completed' : '';
    return `
      <div class="cal-task-chip ${priorityClass} ${statusClass}" data-id="${t.id}" onclick="event.stopPropagation(); openEditModal(${t.id})" title="${escapeHTML(t.title)} (${getStatusLabel(t.status)})">
        <i class="${t.status === 'completed' ? 'fa-solid fa-check' : 'fa-regular fa-clock'}"></i>
        <span>${escapeHTML(t.title)}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="cal-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}" data-date="${dateStr}" onclick="handleCalendarDayClick('${dateStr}')" title="Bấm để lên lịch công việc vào ngày ${dateStr}">
      <div class="cal-day-header">
        <span class="cal-day-num">${dayNum}</span>
        ${dayTasks.length > 0 ? `<span style="font-size: 0.7rem; font-weight: 700; color: var(--brand-primary);">${dayTasks.length} việc</span>` : ''}
      </div>
      <div class="cal-day-tasks">
        ${tasksHtml}
      </div>
    </div>
  `;
}

function handleCalendarDayClick(dateStr) {
  const taskDueDateInput = document.getElementById('taskDueDate');
  const taskTitleInput = document.getElementById('taskTitle');
  if (taskDueDateInput) {
    taskDueDateInput.value = `${dateStr}T09:00`;
  }
  if (taskTitleInput) {
    taskTitleInput.focus();
    taskTitleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  showToast(`Đã chọn ngày hạn chót: ${dateStr}`, 'info');
}

function calPrevMonth() {
  calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
  renderCalendarView();
}

function calNextMonth() {
  calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
  renderCalendarView();
}

function calToday() {
  calendarCurrentDate = new Date();
  renderCalendarView();
}

// ==================== EXCEL/CSV IMPORT CONTROLLER ====================
function openImportModal() {
  const overlay = document.getElementById('importModalOverlay');
  const statusBox = document.getElementById('importStatusBox');
  const startBtn = document.getElementById('startImportBtn');
  if (overlay) overlay.classList.add('active');
  if (statusBox) statusBox.style.display = 'none';
  if (startBtn) startBtn.disabled = true;
  clearImportFile();
}

function closeImportModal() {
  const overlay = document.getElementById('importModalOverlay');
  if (overlay) overlay.classList.remove('active');
  clearImportFile();
}

function clearImportFile() {
  selectedImportFile = null;
  const fileInput = document.getElementById('importFileInput');
  const dropContent = document.getElementById('importDropContent');
  const fileSelected = document.getElementById('importFileSelected');
  const startBtn = document.getElementById('startImportBtn');

  if (fileInput) fileInput.value = '';
  if (dropContent) dropContent.style.display = 'block';
  if (fileSelected) fileSelected.style.display = 'none';
  if (startBtn) startBtn.disabled = true;
}

function handleImportFileSelect(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext !== 'xlsx' && ext !== 'csv') {
    showToast('Chỉ chấp nhận tệp định dạng .xlsx hoặc .csv!', 'error');
    return;
  }

  selectedImportFile = file;
  const dropContent = document.getElementById('importDropContent');
  const fileSelected = document.getElementById('importFileSelected');
  const fileNameEl = document.getElementById('importFileName');
  const fileSizeEl = document.getElementById('importFileSize');
  const startBtn = document.getElementById('startImportBtn');

  if (dropContent) dropContent.style.display = 'none';
  if (fileSelected) fileSelected.style.display = 'flex';
  if (fileNameEl) fileNameEl.textContent = file.name;
  if (fileSizeEl) fileSizeEl.textContent = `(${formatFileSize(file.size)})`;
  if (startBtn) startBtn.disabled = false;
}

async function handleDownloadTemplate() {
  try {
    const res = await apiFetch('/todos/import/template');
    if (!res.ok) throw new Error('Không thể tải file mẫu');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TaskMaster_Mau_Nhap_Cong_Viec.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    showToast('Đã tải xuống file mẫu thành công!', 'success');
  } catch (err) {
    showToast('Lỗi khi tải file mẫu Excel!', 'error');
  }
}

async function handleStartImport() {
  if (!selectedImportFile) return;

  const startBtn = document.getElementById('startImportBtn');
  const statusBox = document.getElementById('importStatusBox');

  if (startBtn) {
    startBtn.disabled = true;
    startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
  }

  try {
    const formData = new FormData();
    formData.append('file', selectedImportFile);

    const res = await apiFetch('/todos/import', {
      method: 'POST',
      body: formData
    });

    const result = await res.json();

    if (res.ok && result.success) {
      if (statusBox) {
        statusBox.className = 'import-status-box success';
        statusBox.textContent = `🎉 ${result.message}`;
        statusBox.style.display = 'block';
      }
      showToast(result.message, 'success');
      await fetchTodos();
      await fetchStats();
      setTimeout(() => {
        closeImportModal();
      }, 1500);
    } else {
      if (statusBox) {
        statusBox.className = 'import-status-box error';
        statusBox.textContent = `❌ ${result.message || 'Lỗi nhập dữ liệu!'}`;
        statusBox.style.display = 'block';
      }
      showToast(result.message || 'Lỗi nhập dữ liệu!', 'error');
    }
  } catch (err) {
    if (statusBox) {
      statusBox.className = 'import-status-box error';
      statusBox.textContent = '❌ Lỗi kết nối máy chủ!';
      statusBox.style.display = 'block';
    }
  } finally {
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Bắt đầu nhập dữ liệu';
    }
  }
}

// Global exposure
window.handleTaskCheckboxChange = handleTaskCheckboxChange;
window.handleCalendarDayClick = handleCalendarDayClick;
window.calPrevMonth = calPrevMonth;
window.calNextMonth = calNextMonth;
window.calToday = calToday;
window.openImportModal = openImportModal;
window.closeImportModal = closeImportModal;
window.toggleTheme = toggleTheme;
window.toggleAiCoPilot = toggleAiCoPilot;
window.openAiCoPilot = openAiCoPilot;
window.closeAiCoPilot = closeAiCoPilot;
window.clearAiChatHistory = clearAiChatHistory;

// ==================== AI CO-PILOT (GEMINI 2.5 FLASH) ====================
let aiChatHistory = [];
let isAiResponding = false;

const aiCoPilotTriggerBtn = document.getElementById('aiCoPilotTriggerBtn');
const aiChatDrawer = document.getElementById('aiChatDrawer');
const aiCloseChatBtn = document.getElementById('aiCloseChatBtn');
const aiClearChatBtn = document.getElementById('aiClearChatBtn');
const aiMessagesContainer = document.getElementById('aiMessagesContainer');
const aiChatForm = document.getElementById('aiChatForm');
const aiChatInput = document.getElementById('aiChatInput');
const aiSendBtn = document.getElementById('aiSendBtn');

function initAiCoPilot() {
  if (aiCoPilotTriggerBtn) {
    aiCoPilotTriggerBtn.addEventListener('click', toggleAiCoPilot);
  }
  if (aiCloseChatBtn) {
    aiCloseChatBtn.addEventListener('click', closeAiCoPilot);
  }
  if (aiClearChatBtn) {
    aiClearChatBtn.addEventListener('click', clearAiChatHistory);
  }
  if (aiChatForm) {
    aiChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendAiMessage();
    });
  }

  // Suggestion chips & action button delegation
  if (aiMessagesContainer) {
    aiMessagesContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.ai-chip');
      if (chip) {
        const prompt = chip.getAttribute('data-prompt') || chip.textContent.trim();
        if (prompt) {
          sendAiMessage(prompt);
        }
      }

      const actionBtn = e.target.closest('.btn-ai-action-create');
      if (actionBtn && !actionBtn.classList.contains('completed')) {
        handleAiActionCreateTask(actionBtn);
      }
    });
  }
}

function toggleAiCoPilot() {
  if (!aiChatDrawer) return;
  if (aiChatDrawer.style.display === 'none' || !aiChatDrawer.classList.contains('active')) {
    openAiCoPilot();
  } else {
    closeAiCoPilot();
  }
}

function openAiCoPilot() {
  if (!aiChatDrawer) return;

  if (!authToken) {
    openAuthModal('login');
    showToast('Vui lòng đăng nhập để trò chuyện với Trợ lý AI!', 'info');
    return;
  }

  aiChatDrawer.style.display = 'flex';
  void aiChatDrawer.offsetWidth; // Force reflow for CSS transition
  aiChatDrawer.classList.add('active');

  if (aiMessagesContainer) {
    aiMessagesContainer.scrollTop = aiMessagesContainer.scrollHeight;
  }
  if (aiChatInput) {
    setTimeout(() => aiChatInput.focus(), 150);
  }
}

function closeAiCoPilot() {
  if (!aiChatDrawer) return;
  aiChatDrawer.classList.remove('active');
  setTimeout(() => {
    if (!aiChatDrawer.classList.contains('active')) {
      aiChatDrawer.style.display = 'none';
    }
  }, 250);
}

function clearAiChatHistory() {
  aiChatHistory = [];
  if (aiMessagesContainer) {
    aiMessagesContainer.innerHTML = `
      <div class="ai-msg ai-msg-assistant">
        <div class="ai-msg-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
        <div class="ai-msg-content">
          <p>Xin chào! Tôi là <strong>Trợ lý AI</strong>. Tôi có thể giúp bạn:</p>
          <ul>
            <li>Tóm tắt & phân tích các việc cần làm hôm nay</li>
            <li>Lên kế hoạch và tự động đề xuất tạo công việc mới</li>
            <li>Đề xuất xử lý việc gấp hoặc quá hạn</li>
          </ul>
          <p class="ai-msg-hint">💡 Hãy chọn gợi ý nhanh bên dưới hoặc gõ yêu cầu của bạn!</p>
        </div>
      </div>

      <div class="ai-quick-suggestions" id="aiQuickSuggestions">
        <button type="button" class="ai-chip" data-prompt="Hôm nay tôi có công việc gì gấp hoặc quá hạn không?">
          🔥 Việc gấp & quá hạn?
        </button>
        <button type="button" class="ai-chip" data-prompt="Tóm tắt tiến độ và năng suất làm việc của tôi hiện tại">
          📊 Tóm tắt tiến độ
        </button>
        <button type="button" class="ai-chip" data-prompt="Lên kế hoạch 3 bước để chuẩn bị ra mắt tính năng mới">
          🚀 Lên kế hoạch việc mới
        </button>
        <button type="button" class="ai-chip" data-prompt="Tạo giúp tôi 1 việc: Kiểm tra bảo mật và tối ưu cơ sở dữ liệu với mức ưu tiên Cao">
          ➕ Đề xuất tạo việc nhanh
        </button>
      </div>
    `;
  }
  showToast('Đã làm mới cuộc hội thoại với Trợ lý AI', 'info');
  if (aiChatInput) aiChatInput.focus();
}

async function sendAiMessage(customText = null) {
  if (isAiResponding) return;

  const text = (customText || (aiChatInput ? aiChatInput.value : '')).trim();
  if (!text) return;

  if (!authToken) {
    openAuthModal('login');
    showToast('Vui lòng đăng nhập để sử dụng Trợ lý AI!', 'info');
    return;
  }

  // Clear input
  if (aiChatInput) aiChatInput.value = '';

  // Append user message bubble
  appendUserMessage(text);

  // Set loading state
  isAiResponding = true;
  if (aiSendBtn) aiSendBtn.disabled = true;
  if (aiChatInput) aiChatInput.disabled = true;

  // Append typing indicator
  const typingEl = appendTypingIndicator();

  try {
    const res = await apiFetch('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: text,
        history: aiChatHistory
      })
    });

    const result = await res.json();

    // Remove typing indicator
    if (typingEl && typingEl.parentNode) {
      typingEl.parentNode.removeChild(typingEl);
    }

    if (res.ok && result.success) {
      const { reply, actions } = result.data;

      // Update in-memory history (limit to last 20 messages)
      aiChatHistory.push({ role: 'user', text });
      aiChatHistory.push({ role: 'model', text: reply });
      if (aiChatHistory.length > 20) {
        aiChatHistory = aiChatHistory.slice(-20);
      }

      // Render assistant response
      appendAssistantMessage(reply, actions);
    } else {
      appendAssistantMessage(result.message || 'Rất tiếc, AI không thể xử lý yêu cầu lúc này. Vui lòng thử lại sau ít phút.');
      showToast(result.message || 'Lỗi khi trò chuyện với Trợ lý AI', 'error');
    }
  } catch (err) {
    if (typingEl && typingEl.parentNode) {
      typingEl.parentNode.removeChild(typingEl);
    }
    appendAssistantMessage('Lỗi kết nối máy chủ khi gọi Trợ lý AI. Vui lòng kiểm tra lại kết nối mạng!');
  } finally {
    isAiResponding = false;
    if (aiSendBtn) aiSendBtn.disabled = false;
    if (aiChatInput) {
      aiChatInput.disabled = false;
      aiChatInput.focus();
    }
    if (aiMessagesContainer) {
      aiMessagesContainer.scrollTop = aiMessagesContainer.scrollHeight;
    }
  }
}

function appendUserMessage(text) {
  if (!aiMessagesContainer) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = 'ai-msg ai-msg-user';
  msgDiv.innerHTML = `
    <div class="ai-msg-content">
      ${escapeHTML(text).replace(/\n/g, '<br>')}
    </div>
  `;
  aiMessagesContainer.appendChild(msgDiv);
  aiMessagesContainer.scrollTop = aiMessagesContainer.scrollHeight;
}

function appendTypingIndicator() {
  if (!aiMessagesContainer) return null;

  const typingDiv = document.createElement('div');
  typingDiv.className = 'ai-msg ai-msg-assistant';
  typingDiv.innerHTML = `
    <div class="ai-msg-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
    <div class="ai-typing-indicator">
      <span class="ai-typing-dot"></span>
      <span class="ai-typing-dot"></span>
      <span class="ai-typing-dot"></span>
    </div>
  `;
  aiMessagesContainer.appendChild(typingDiv);
  aiMessagesContainer.scrollTop = aiMessagesContainer.scrollHeight;
  return typingDiv;
}

function formatAiMarkdown(rawText) {
  if (!rawText) return '';

  // Remove action blocks so raw JSON isn't displayed to user
  let text = rawText.replace(/```action_create_todo[\s\S]*?```/g, '').trim();

  // Escape HTML entities to prevent XSS
  text = escapeHTML(text);

  // Bold **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic *text*
  text = text.replace(/(^|[^*])\*(.*?)\*(?![\*])/g, '$1<em>$2</em>');

  // Inline code `code`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Split into lines for list processing
  const lines = text.split('\n');
  let inList = false;
  let formattedHtml = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check bullet points
    if (line.startsWith('- ') || line.startsWith('* ') || /^(\d+)\.\s/.test(line)) {
      if (!inList) {
        inList = true;
        formattedHtml += '<ul>';
      }
      const itemContent = line.replace(/^(-\s|\*\s|\d+\.\s)/, '');
      formattedHtml += `<li>${itemContent}</li>`;
    } else {
      if (inList) {
        inList = false;
        formattedHtml += '</ul>';
      }
      if (line === '') {
        formattedHtml += '<div style="height: 6px;"></div>';
      } else {
        formattedHtml += `<p>${line}</p>`;
      }
    }
  }

  if (inList) {
    formattedHtml += '</ul>';
  }

  return formattedHtml;
}

function appendAssistantMessage(text, actions = []) {
  if (!aiMessagesContainer) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = 'ai-msg ai-msg-assistant';

  const formattedHtml = formatAiMarkdown(text);

  // Generate action cards if any
  let actionsHtml = '';
  if (actions && actions.length > 0) {
    const cards = actions.map((act) => {
      if (act.type === 'create_todo' && act.data && act.data.title) {
        const title = escapeHTML(act.data.title);
        const priority = act.data.priority || 'medium';
        const dueDate = act.data.dueDate || '';

        let priorityLabel = 'Vừa';
        let priorityClass = 'ai-badge-priority-medium';
        if (priority === 'high') {
          priorityLabel = '🔴 Cao';
          priorityClass = 'ai-badge-priority-high';
        } else if (priority === 'low') {
          priorityLabel = '🟢 Thấp';
          priorityClass = 'ai-badge-priority-low';
        } else {
          priorityLabel = '🟡 Vừa';
        }

        const dueLabel = dueDate ? `<span class="ai-action-badge ai-badge-due"><i class="fa-regular fa-calendar"></i> ${formatDate(dueDate)}</span>` : '';

        return `
          <div class="ai-action-card">
            <div class="ai-action-card-header">
              <span class="ai-action-task-title"><i class="fa-solid fa-list-check" style="color: #6366f1;"></i> ${title}</span>
              <div class="ai-action-badges">
                <span class="ai-action-badge ${priorityClass}">${priorityLabel}</span>
                ${dueLabel}
              </div>
            </div>
            <button 
              type="button" 
              class="btn-ai-action-create" 
              data-title="${escapeHTML(act.data.title)}" 
              data-priority="${priority}" 
              data-due="${dueDate}"
            >
              <i class="fa-solid fa-plus"></i> Thêm việc này vào danh sách
            </button>
          </div>
        `;
      }
      return '';
    }).join('');

    if (cards) {
      actionsHtml = `<div class="ai-actions-wrapper">${cards}</div>`;
    }
  }

  msgDiv.innerHTML = `
    <div class="ai-msg-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
    <div class="ai-msg-content">
      ${formattedHtml}
      ${actionsHtml}
    </div>
  `;

  aiMessagesContainer.appendChild(msgDiv);
  aiMessagesContainer.scrollTop = aiMessagesContainer.scrollHeight;
}

async function handleAiActionCreateTask(buttonEl) {
  const title = buttonEl.getAttribute('data-title');
  const priority = buttonEl.getAttribute('data-priority') || 'medium';
  const dueDateStr = buttonEl.getAttribute('data-due') || '';

  if (!title) return;

  buttonEl.disabled = true;
  buttonEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang tạo việc...';

  try {
    const payload = {
      title,
      priority,
      status: 'pending'
    };
    if (dueDateStr) {
      payload.dueDate = new Date(dueDateStr).toISOString();
    }

    const res = await apiFetch('/todos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok && result.success) {
      buttonEl.classList.add('completed');
      buttonEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã thêm thành công!';
      showToast(`AI đã tạo công việc: "${title}"`, 'success');
      await Promise.all([fetchTodos(), fetchStats()]);
    } else {
      buttonEl.disabled = false;
      buttonEl.innerHTML = '<i class="fa-solid fa-plus"></i> Thử lại';
      showToast(result.message || 'Không thể tạo công việc từ AI', 'error');
    }
  } catch (err) {
    buttonEl.disabled = false;
    buttonEl.innerHTML = '<i class="fa-solid fa-plus"></i> Thử lại';
    showToast('Lỗi mạng khi tạo công việc từ AI', 'error');
  }
}

// ==================== NEXT-LEVEL AI: SMART SUBTASKS (CHECKLIST) ====================
let currentEditingTodoSubtasks = [];
let currentEditingTodoId = null;

function renderEditSubtasks(subtasks, todoId) {
  currentEditingTodoSubtasks = Array.isArray(subtasks) ? [...subtasks] : [];
  currentEditingTodoId = todoId;

  const counterEl = document.getElementById('editSubtasksCounter');
  const progressWrap = document.getElementById('editSubtasksProgressWrap');
  const progressFill = document.getElementById('editSubtasksProgressFill');
  const listEl = document.getElementById('editSubtasksList');

  const total = currentEditingTodoSubtasks.length;
  const done = currentEditingTodoSubtasks.filter(s => s.completed).length;

  if (counterEl) {
    counterEl.textContent = `${done}/${total}`;
  }

  if (progressWrap && progressFill) {
    if (total > 0) {
      progressWrap.style.display = 'block';
      const pct = Math.round((done / total) * 100);
      progressFill.style.width = `${pct}%`;
      if (pct === 100) {
        progressFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
      } else {
        progressFill.style.background = 'linear-gradient(90deg, #6366f1, #8b5cf6)';
      }
    } else {
      progressWrap.style.display = 'none';
      progressFill.style.width = '0%';
    }
  }

  if (!listEl) return;

  if (total === 0) {
    listEl.innerHTML = `
      <p class="subtasks-empty-hint">
        <i class="fa-solid fa-list-check" style="opacity: 0.5; margin-right: 4px;"></i>
        Chưa có việc con nào. Bấm <strong>"AI Chia việc"</strong> để AI tự động phân rã thành các bước!
      </p>
    `;
    return;
  }

  listEl.innerHTML = currentEditingTodoSubtasks.map(s => {
    const isCompleted = s.completed === true;
    return `
      <div class="subtask-item ${isCompleted ? 'completed' : ''}" data-id="${s.id}">
        <label class="subtask-checkbox-label">
          <input 
            type="checkbox" 
            class="subtask-chk" 
            ${isCompleted ? 'checked' : ''} 
            onchange="handleToggleSubtask(${todoId}, ${s.id}, this.checked)"
          >
          <span class="subtask-title">${escapeHTML(s.title)}</span>
        </label>
        <button 
          type="button" 
          class="btn-del-subtask" 
          onclick="handleDeleteSubtask(${todoId}, ${s.id})" 
          title="Xóa việc con này"
        >
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;
  }).join('');
}

async function handleAiGenerateSubtasks() {
  if (!currentEditingTodoId) return;

  const btn = document.getElementById('btnAiGenerateSubtasks');
  const originalHtml = btn ? btn.innerHTML : '';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Đang phân rã...</span>`;
  }

  try {
    const res = await apiFetch(`/todos/${currentEditingTodoId}/subtasks/ai-generate`, {
      method: 'POST'
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast(result.message || 'Đã phân rã công việc thành công!', 'success');
      const updatedSubtasks = result.data.subtasks || [];
      
      // Cập nhật trong mảng currentTodos
      const targetTodo = currentTodos.find(t => t.id == currentEditingTodoId);
      if (targetTodo) {
        targetTodo.subtasks = updatedSubtasks;
      }

      renderEditSubtasks(updatedSubtasks, currentEditingTodoId);
      renderTodos();
      renderKanbanBoard();
    } else {
      showToast(result.message || 'Không thể chia nhỏ công việc bằng AI!', 'error');
    }
  } catch (err) {
    console.error('Lỗi AI chia việc:', err);
    showToast('Lỗi kết nối khi gọi AI chia việc!', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

async function handleAddSubtaskQuick() {
  if (!currentEditingTodoId) return;

  const input = document.getElementById('newSubtaskTitleInput');
  const title = input ? input.value.trim() : '';

  if (!title) {
    showToast('Vui lòng nhập nội dung việc con!', 'warning');
    if (input) input.focus();
    return;
  }

  const addBtn = document.getElementById('btnAddSubtaskQuick');
  if (addBtn) addBtn.disabled = true;

  try {
    const res = await apiFetch(`/todos/${currentEditingTodoId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      const newSubtask = result.data;
      currentEditingTodoSubtasks.push(newSubtask);

      const targetTodo = currentTodos.find(t => t.id == currentEditingTodoId);
      if (targetTodo) {
        if (!targetTodo.subtasks) targetTodo.subtasks = [];
        targetTodo.subtasks.push(newSubtask);
      }

      renderEditSubtasks(currentEditingTodoSubtasks, currentEditingTodoId);
      renderTodos();
      renderKanbanBoard();

      if (input) {
        input.value = '';
        input.focus();
      }
    } else {
      showToast(result.message || 'Không thể thêm việc con!', 'error');
    }
  } catch (err) {
    console.error('Lỗi thêm subtask:', err);
    showToast('Lỗi mạng khi thêm việc con!', 'error');
  } finally {
    if (addBtn) addBtn.disabled = false;
  }
}

async function handleToggleSubtask(todoId, subtaskId, isChecked) {
  try {
    const res = await apiFetch(`/todos/${todoId}/subtasks/${subtaskId}/toggle`, {
      method: 'PATCH'
    });
    const result = await res.json();

    if (res.ok && result.success) {
      // Cập nhật trạng thái
      const subtask = currentEditingTodoSubtasks.find(s => s.id == subtaskId);
      if (subtask) subtask.completed = isChecked;

      const targetTodo = currentTodos.find(t => t.id == todoId);
      if (targetTodo && targetTodo.subtasks) {
        const tSub = targetTodo.subtasks.find(s => s.id == subtaskId);
        if (tSub) tSub.completed = isChecked;
      }

      renderEditSubtasks(currentEditingTodoSubtasks, todoId);
      renderTodos();
      renderKanbanBoard();

      if (result.data?.progress?.allDone) {
        showToast('🎉 Tuyệt vời! Bạn đã hoàn thành toàn bộ việc con!', 'success');
      }
    } else {
      showToast(result.message || 'Không thể đổi trạng thái việc con!', 'error');
      renderEditSubtasks(currentEditingTodoSubtasks, todoId);
    }
  } catch (err) {
    console.error('Lỗi toggle subtask:', err);
    showToast('Lỗi mạng khi cập nhật việc con!', 'error');
    renderEditSubtasks(currentEditingTodoSubtasks, todoId);
  }
}

async function handleDeleteSubtask(todoId, subtaskId) {
  try {
    const res = await apiFetch(`/todos/${todoId}/subtasks/${subtaskId}`, {
      method: 'DELETE'
    });
    const result = await res.json();

    if (res.ok && result.success) {
      currentEditingTodoSubtasks = currentEditingTodoSubtasks.filter(s => s.id != subtaskId);

      const targetTodo = currentTodos.find(t => t.id == todoId);
      if (targetTodo && targetTodo.subtasks) {
        targetTodo.subtasks = targetTodo.subtasks.filter(s => s.id != subtaskId);
      }

      renderEditSubtasks(currentEditingTodoSubtasks, todoId);
      renderTodos();
      renderKanbanBoard();
      showToast('Đã xóa việc con!', 'info');
    } else {
      showToast(result.message || 'Không thể xóa việc con!', 'error');
    }
  } catch (err) {
    console.error('Lỗi xóa subtask:', err);
    showToast('Lỗi mạng khi xóa việc con!', 'error');
  }
}

// ==================== NEXT-LEVEL AI: VOICE-TO-TASK (WEB SPEECH API + GEMINI) ====================
let activeVoiceRecognition = null;
let voiceFinalTranscript = '';
let voiceInterimTranscript = '';
let voiceModalMode = 'task'; // 'task' | 'chat'

function startVoiceRecognition(mode = 'task') {
  if (!authToken) {
    showToast('Vui lòng đăng nhập để dùng tính năng giọng nói AI!', 'error');
    openAuthModal('login');
    return;
  }

  voiceModalMode = mode;
  voiceFinalTranscript = '';
  voiceInterimTranscript = '';

  const modal = document.getElementById('voiceRecordingModal');
  const titleEl = document.getElementById('voiceStatusTitle');
  const transcriptEl = document.getElementById('voiceTranscriptText');
  const micVis = document.getElementById('voiceMicVisualizer');
  const parseBtn = document.getElementById('stopAndParseVoiceBtn');

  if (titleEl) {
    titleEl.textContent = 'Đang lắng nghe bạn nói...';
  }
  if (transcriptEl) {
    transcriptEl.innerHTML = `<em>Đang nghe âm thanh từ microphone... Hãy nói tự nhiên bằng tiếng Việt</em>`;
  }
  if (micVis) {
    micVis.classList.add('active');
  }
  if (parseBtn) {
    parseBtn.disabled = false;
    parseBtn.innerHTML = mode === 'chat' 
      ? `<i class="fa-solid fa-paper-plane"></i> <span>Gửi câu hỏi</span>` 
      : `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Tạo việc ngay</span>`;
  }

  if (modal) modal.classList.add('active');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (titleEl) titleEl.textContent = 'Trình duyệt không hỗ trợ Web Speech API trực tiếp';
    if (transcriptEl) {
      transcriptEl.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">
          Trình duyệt của bạn chưa hỗ trợ micro tự động. Bạn có thể nhập nhanh câu lệnh tiếng Việt bên dưới:
        </div>
        <textarea id="voiceFallbackInput" style="width: 100%; height: 75px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; color: var(--text-main); font-family: inherit; font-size: 0.9rem;" placeholder="Ví dụ: Nhắc tôi 9h sáng mai họp review dự án với khách hàng mức ưu tiên cao"></textarea>
      `;
      const fallbackInput = document.getElementById('voiceFallbackInput');
      if (fallbackInput) setTimeout(() => fallbackInput.focus(), 150);
    }
    return;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      if (micVis) micVis.classList.add('active');
      if (titleEl) titleEl.textContent = 'Đang lắng nghe bạn nói...';
    };

    recognition.onresult = (event) => {
      voiceInterimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          voiceFinalTranscript += ' ' + event.results[i][0].transcript;
        } else {
          voiceInterimTranscript += event.results[i][0].transcript;
        }
      }

      const combined = (voiceFinalTranscript + ' ' + voiceInterimTranscript).trim();
      if (transcriptEl && combined) {
        transcriptEl.innerHTML = `<strong>"${escapeHTML(combined)}"</strong>`;
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech Recognition Warning:', event.error);
      if (event.error === 'not-allowed') {
        if (titleEl) titleEl.textContent = 'Quyền Microphone bị từ chối';
        if (transcriptEl) {
          transcriptEl.innerHTML = `
            <div style="font-size: 0.85rem; color: #f87171; margin-bottom: 8px;">
              Vui lòng cấp quyền Microphone cho trình duyệt hoặc gõ câu lệnh vào ô bên dưới:
            </div>
            <textarea id="voiceFallbackInput" style="width: 100%; height: 75px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; color: var(--text-main); font-family: inherit; font-size: 0.9rem;" placeholder="Ví dụ: Nhắc tôi 9h sáng mai họp review dự án với khách hàng"></textarea>
          `;
          const fallbackInput = document.getElementById('voiceFallbackInput');
          if (fallbackInput) setTimeout(() => fallbackInput.focus(), 150);
        }
      }
    };

    recognition.onend = () => {
      if (micVis) micVis.classList.remove('active');
    };

    activeVoiceRecognition = recognition;
    recognition.start();
  } catch (err) {
    console.error('Không thể kích hoạt Speech Recognition:', err);
  }
}

function closeVoiceModal() {
  if (activeVoiceRecognition) {
    try {
      activeVoiceRecognition.stop();
    } catch (e) {}
    activeVoiceRecognition = null;
  }
  const modal = document.getElementById('voiceRecordingModal');
  if (modal) modal.classList.remove('active');
}

async function handleStopAndParseVoice() {
  if (activeVoiceRecognition) {
    try {
      activeVoiceRecognition.stop();
    } catch (e) {}
    activeVoiceRecognition = null;
  }

  const fallbackInput = document.getElementById('voiceFallbackInput');
  let text = '';
  if (fallbackInput && fallbackInput.value.trim()) {
    text = fallbackInput.value.trim();
  } else {
    text = (voiceFinalTranscript + ' ' + voiceInterimTranscript).trim();
  }

  if (!text) {
    showToast('Chưa có nội dung giọng nói. Vui lòng nói hoặc nhập lệnh!', 'warning');
    return;
  }

  // Nếu mở từ AI Chat Drawer
  if (voiceModalMode === 'chat') {
    closeVoiceModal();
    openAiCoPilot();
    const chatInput = document.getElementById('aiChatInput');
    if (chatInput) {
      chatInput.value = text;
    }
    sendAiChatMessage(text);
    return;
  }

  // Mode: Voice-to-Task
  const parseBtn = document.getElementById('stopAndParseVoiceBtn');
  const titleEl = document.getElementById('voiceStatusTitle');

  if (parseBtn) {
    parseBtn.disabled = true;
    parseBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Gemini AI đang xử lý...</span>`;
  }
  if (titleEl) {
    titleEl.textContent = '🤖 Gemini AI đang phân tích dữ liệu giọng nói...';
  }

  try {
    const res = await apiFetch('/ai/voice-task', {
      method: 'POST',
      body: JSON.stringify({ transcript: text })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      closeVoiceModal();
      showToast(result.message || '✨ Đã tạo công việc thành công bằng giọng nói!', 'success');
      await Promise.all([fetchTodos(), fetchStats()]);
    } else {
      showToast(result.message || 'Không thể tạo công việc từ giọng nói!', 'error');
      if (titleEl) titleEl.textContent = 'Lỗi phân tích giọng nói';
    }
  } catch (err) {
    console.error('Lỗi Voice-to-Task:', err);
    showToast('Lỗi kết nối khi gửi dữ liệu giọng nói tới AI!', 'error');
    if (titleEl) titleEl.textContent = 'Lỗi kết nối máy chủ';
  } finally {
    if (parseBtn) {
      parseBtn.disabled = false;
      parseBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Tạo việc ngay</span>`;
    }
  }
}

// =========================================================================
// 👥 PHẦN 4: CỘNG TÁC NHÓM & QUẢN TRỊ (TEAM COLLABORATION & RBAC)
// =========================================================================

// --- 1. Tabs chuyển đổi trong Modal Sửa ---
function switchEditModalTab(tabName) {
  const tabBtnDetails = document.getElementById('tabBtnEditDetails');
  const tabBtnComments = document.getElementById('tabBtnEditComments');
  const tabBtnAudit = document.getElementById('tabBtnEditAudit');

  const paneDetails = document.getElementById('editTabDetailsPane');
  const paneComments = document.getElementById('editTabCommentsPane');
  const paneAudit = document.getElementById('editTabAuditPane');

  // Toggle active class on tab buttons
  if (tabBtnDetails) tabBtnDetails.classList.toggle('active', tabName === 'details');
  if (tabBtnComments) tabBtnComments.classList.toggle('active', tabName === 'comments');
  if (tabBtnAudit) tabBtnAudit.classList.toggle('active', tabName === 'audit');

  // Toggle display of tab panes
  if (paneDetails) {
    paneDetails.style.display = tabName === 'details' ? 'block' : 'none';
    paneDetails.classList.toggle('active', tabName === 'details');
  }
  if (paneComments) {
    paneComments.style.display = tabName === 'comments' ? 'block' : 'none';
    paneComments.classList.toggle('active', tabName === 'comments');
  }
  if (paneAudit) {
    paneAudit.style.display = tabName === 'audit' ? 'block' : 'none';
    paneAudit.classList.toggle('active', tabName === 'audit');
  }
}
window.switchEditModalTab = switchEditModalTab;

// --- 2. Bình luận công việc (Task Comments) ---
async function loadTaskComments(todoId) {
  const container = document.getElementById('editCommentsListContainer');
  const badge = document.getElementById('editCommentsCountBadge');
  if (!container) return;

  try {
    const res = await apiFetch(`/todos/${todoId}/comments`);
    const result = await res.json();

    if (res.ok && result.success) {
      const comments = result.data || [];
      if (badge) badge.textContent = comments.length;

      if (comments.length === 0) {
        container.innerHTML = `
          <div class="comments-empty-hint">
            <i class="fa-regular fa-comments" style="font-size: 1.5rem; opacity: 0.4; margin-bottom: 8px;"></i>
            <p>Chưa có bình luận nào cho công việc này.</p>
            <span>Hãy trao đổi và thảo luận công việc với đồng nghiệp bên dưới!</span>
          </div>
        `;
        return;
      }

      container.innerHTML = comments.map(c => {
        const isMine = currentUser && c.user && (c.user.id === currentUser.id);
        const canDelete = isMine || (currentUser && currentUser.role === 'admin');
        const userInitial = (c.user && c.user.name ? c.user.name.charAt(0) : 'U').toUpperCase();
        const userName = c.user ? c.user.name : 'Thành viên';
        const timeStr = formatDate(c.createdAt);

        return `
          <div class="comment-item ${isMine ? 'is-mine' : ''}" data-id="${c.id}">
            <div class="comment-avatar">${userInitial}</div>
            <div class="comment-bubble">
              <div class="comment-meta">
                <span class="comment-author">${escapeHTML(userName)}</span>
                <span class="comment-time">${timeStr}</span>
                ${canDelete ? `
                  <button type="button" class="btn-del-comment" onclick="handleDeleteTaskComment(${c.id})" title="Xóa bình luận này">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                ` : ''}
              </div>
              <div class="comment-text">${escapeHTML(c.content)}</div>
            </div>
          </div>
        `;
      }).join('');

      container.scrollTop = container.scrollHeight;
    }
  } catch (err) {
    console.error('Lỗi khi tải bình luận:', err);
  }
}

async function handleSubmitTaskComment() {
  if (!activeEditTaskId) return;
  const input = document.getElementById('taskNewCommentInput');
  const btn = document.getElementById('btnSubmitTaskComment');
  const content = input ? input.value.trim() : '';

  if (!content) {
    showToast('Vui lòng nhập nội dung bình luận!', 'warning');
    if (input) input.focus();
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang gửi...</span>`;
  }

  try {
    const res = await apiFetch(`/todos/${activeEditTaskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      if (input) input.value = '';
      showToast('Đã đăng bình luận thành công!', 'success');
      await Promise.all([
        loadTaskComments(activeEditTaskId),
        loadTaskActivities(activeEditTaskId),
        fetchTodos()
      ]);
    } else {
      showToast(result.message || 'Không thể gửi bình luận!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi gửi bình luận!', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Gửi bình luận</span>`;
    }
  }
}

async function handleDeleteTaskComment(commentId) {
  if (!activeEditTaskId) return;
  if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

  try {
    const res = await apiFetch(`/todos/${activeEditTaskId}/comments/${commentId}`, {
      method: 'DELETE'
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast('Đã xóa bình luận!', 'success');
      await Promise.all([
        loadTaskComments(activeEditTaskId),
        loadTaskActivities(activeEditTaskId),
        fetchTodos()
      ]);
    } else {
      showToast(result.message || 'Không thể xóa bình luận!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi xóa bình luận!', 'error');
  }
}
window.handleDeleteTaskComment = handleDeleteTaskComment;

// --- 3. Nhật ký hoạt động chi tiết (Activity Audit Log) ---
async function loadTaskActivities(todoId) {
  const container = document.getElementById('editAuditTimelineContainer');
  if (!container) return;

  try {
    const res = await apiFetch(`/todos/${todoId}/activities`);
    const result = await res.json();

    if (res.ok && result.success) {
      const activities = result.data || [];

      if (activities.length === 0) {
        container.innerHTML = `
          <div class="audit-empty-hint">
            <i class="fa-solid fa-clock-rotate-left" style="font-size: 1.5rem; opacity: 0.4; margin-bottom: 8px;"></i>
            <p>Chưa có lịch sử hoạt động nào được ghi nhận.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = activities.map(act => {
        const timeStr = formatDate(act.createdAt);
        const userName = act.user ? act.user.name : 'Hệ thống';
        
        let actionIcon = 'fa-solid fa-circle-info';
        let actionColor = 'var(--accent-color)';
        if (act.action === 'status_change') {
          actionIcon = 'fa-solid fa-arrows-rotate';
          actionColor = '#38bdf8';
        } else if (act.action === 'assignee_change') {
          actionIcon = 'fa-solid fa-user-check';
          actionColor = '#a855f7';
        } else if (act.action === 'duedate_change') {
          actionIcon = 'fa-regular fa-calendar-check';
          actionColor = '#f59e0b';
        } else if (act.action === 'priority_change') {
          actionIcon = 'fa-solid fa-fire';
          actionColor = '#ef4444';
        } else if (act.action === 'create') {
          actionIcon = 'fa-solid fa-plus';
          actionColor = '#10b981';
        } else if (act.action === 'comment') {
          actionIcon = 'fa-regular fa-comment-dots';
          actionColor = '#6366f1';
        }

        return `
          <div class="audit-timeline-item">
            <div class="audit-icon-wrap" style="color: ${actionColor}; background: rgba(255,255,255,0.05);">
              <i class="${actionIcon}"></i>
            </div>
            <div class="audit-body">
              <div class="audit-header">
                <strong class="audit-user">${escapeHTML(userName)}</strong>
                <span class="audit-time">${timeStr}</span>
              </div>
              <div class="audit-details-text">${escapeHTML(act.details || act.action)}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Lỗi khi nạp nhật ký kiểm toán:', err);
  }
}

// --- 4. Không gian làm việc (Workspaces & Dự án nhóm) ---
async function fetchUserWorkspaces() {
  if (!authToken) return;
  try {
    const res = await apiFetch('/workspaces');
    const result = await res.json();
    if (res.ok && result.success) {
      currentWorkspaces = result.data || [];
      populateWorkspaceDropdowns();
    }
  } catch (err) {
    console.error('Lỗi fetchUserWorkspaces:', err);
  }
}

function populateWorkspaceDropdowns() {
  populateWorkspaceSelectElement('createTaskWorkspace', '');
  populateWorkspaceSelectElement('editTaskWorkspace', '');
}

function populateWorkspaceSelectElement(selectId, selectedVal) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const prevVal = selectedVal !== undefined ? selectedVal : select.value;
  let optionsHtml = '<option value="">(Cá nhân / Không thuộc dự án)</option>';

  currentWorkspaces.forEach(ws => {
    optionsHtml += `<option value="${ws.id}" ${String(ws.id) === String(prevVal) ? 'selected' : ''}>${escapeHTML(ws.name)}</option>`;
  });

  select.innerHTML = optionsHtml;
}

async function updateAssigneeDropdown(workspaceSelectId, assigneeSelectId, targetAssigneeId = null) {
  const wsSelect = document.getElementById(workspaceSelectId);
  const asSelect = document.getElementById(assigneeSelectId);
  if (!asSelect) return;

  const wsId = wsSelect && wsSelect.value ? Number(wsSelect.value) : null;

  if (!wsId) {
    let selfOption = '';
    if (currentUser) {
      selfOption = `<option value="${currentUser.id}" ${targetAssigneeId == currentUser.id ? 'selected' : ''}>${escapeHTML(currentUser.name)} (Tôi)</option>`;
    }
    asSelect.innerHTML = `<option value="">(Chưa phân công)</option>${selfOption}`;
    if (targetAssigneeId) asSelect.value = targetAssigneeId;
    return;
  }

  try {
    let members = workspaceMembersCache.get(wsId);
    if (!members) {
      const res = await apiFetch(`/workspaces/${wsId}/members`);
      const result = await res.json();
      if (res.ok && result.success) {
        members = result.data || [];
        workspaceMembersCache.set(wsId, members);
      }
    }

    if (members && members.length > 0) {
      let optionsHtml = '<option value="">(Chưa phân công)</option>';
      members.forEach(m => {
        const u = m.user;
        if (u) {
          const isMe = currentUser && currentUser.id === u.id;
          const isSelected = targetAssigneeId && Number(targetAssigneeId) === Number(u.id);
          optionsHtml += `<option value="${u.id}" ${isSelected ? 'selected' : ''}>${escapeHTML(u.name)}${isMe ? ' (Tôi)' : ''} &lt;${escapeHTML(u.email)}&gt;</option>`;
        }
      });
      asSelect.innerHTML = optionsHtml;
      if (targetAssigneeId) asSelect.value = targetAssigneeId;
    } else {
      asSelect.innerHTML = '<option value="">(Không có thành viên)</option>';
    }
  } catch (err) {
    console.error('Lỗi khi nạp thành viên cho assignee dropdown:', err);
    asSelect.innerHTML = '<option value="">(Chưa phân công)</option>';
  }
}

function openWorkspaceModal() {
  const modal = document.getElementById('workspaceModal');
  if (modal) {
    modal.classList.add('active');
    loadWorkspaceList();
  }
}

function closeWorkspaceModal() {
  const modal = document.getElementById('workspaceModal');
  if (modal) modal.classList.remove('active');
}

async function loadWorkspaceList() {
  const container = document.getElementById('workspaceListContainer');
  if (!container) return;

  container.innerHTML = '<div class="workspace-empty-hint"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải danh sách dự án...</div>';

  try {
    const res = await apiFetch('/workspaces');
    const result = await res.json();

    if (res.ok && result.success) {
      currentWorkspaces = result.data || [];
      populateWorkspaceDropdowns();

      if (currentWorkspaces.length === 0) {
        container.innerHTML = `
          <div class="workspace-empty-hint">
            <p>Bạn chưa tham gia dự án nhóm nào.</p>
            <span>Bấm <strong>"+ Tạo mới"</strong> để lập không gian làm việc đầu tiên!</span>
          </div>
        `;
        const titleEl = document.getElementById('wsDetailTitle');
        const descEl = document.getElementById('wsDetailDesc');
        const memSec = document.getElementById('wsMembersSection');
        if (titleEl) titleEl.textContent = 'Chọn một dự án để xem chi tiết';
        if (descEl) descEl.textContent = '';
        if (memSec) memSec.style.display = 'none';
        return;
      }

      container.innerHTML = currentWorkspaces.map(ws => {
        const isOwner = currentUser && ws.ownerId === currentUser.id;
        const isActive = activeWorkspaceId === ws.id;
        const memberCount = ws.members ? ws.members.length : 1;

        return `
          <div class="ws-list-item ${isActive ? 'active' : ''}" onclick="selectWorkspace(${ws.id})">
            <div class="ws-item-title-row">
              <span class="ws-item-title">${escapeHTML(ws.name)}</span>
              ${isOwner ? '<span class="ws-badge-owner">Chủ sở hữu</span>' : ''}
            </div>
            <div class="ws-item-sub">
              <span><i class="fa-solid fa-users"></i> ${memberCount} thành viên</span>
            </div>
          </div>
        `;
      }).join('');

      if (!activeWorkspaceId && currentWorkspaces.length > 0) {
        selectWorkspace(currentWorkspaces[0].id);
      } else if (activeWorkspaceId) {
        selectWorkspace(activeWorkspaceId);
      }
    }
  } catch (err) {
    container.innerHTML = '<div class="workspace-empty-hint text-danger">Lỗi khi tải danh sách dự án.</div>';
  }
}

async function selectWorkspace(wsId) {
  activeWorkspaceId = wsId;
  const listItems = document.querySelectorAll('.ws-list-item');
  listItems.forEach(item => item.classList.remove('active'));

  const activeItem = document.querySelector(`.ws-list-item[onclick*="${wsId}"]`);
  if (activeItem) activeItem.classList.add('active');

  const titleEl = document.getElementById('wsDetailTitle');
  const descEl = document.getElementById('wsDetailDesc');
  const ownerBadge = document.getElementById('wsOwnerBadge');
  const membersSection = document.getElementById('wsMembersSection');
  const membersCountEl = document.getElementById('wsMembersCount');
  const membersListEl = document.getElementById('wsMembersList');

  const createBox = document.getElementById('createWorkspaceBox');
  const detailBox = document.getElementById('workspaceDetailsBox');
  if (createBox) createBox.style.display = 'none';
  if (detailBox) detailBox.style.display = 'block';

  try {
    const res = await apiFetch(`/workspaces/${wsId}`);
    const result = await res.json();

    if (res.ok && result.success) {
      const ws = result.data;
      if (titleEl) titleEl.textContent = ws.name;
      if (descEl) descEl.textContent = ws.description || 'Không gian làm việc chung dành cho các thành viên dự án.';

      const isOwner = currentUser && ws.ownerId === currentUser.id;
      if (ownerBadge) {
        ownerBadge.style.display = isOwner ? 'inline-flex' : 'none';
      }

      if (membersSection) membersSection.style.display = 'block';
      const members = ws.members || [];
      workspaceMembersCache.set(wsId, members);

      if (membersCountEl) membersCountEl.textContent = members.length;

      if (membersListEl) {
        membersListEl.innerHTML = members.map(m => {
          const u = m.user;
          if (!u) return '';
          const isItemOwner = ws.ownerId === u.id;
          const isMe = currentUser && currentUser.id === u.id;
          const canRemove = isOwner && !isItemOwner && !isMe;
          const initial = (u.name ? u.name.charAt(0) : 'U').toUpperCase();

          return `
            <div class="ws-member-item">
              <div class="ws-member-avatar">${initial}</div>
              <div class="ws-member-info">
                <span class="ws-member-name">${escapeHTML(u.name)}${isMe ? ' (Bạn)' : ''}</span>
                <span class="ws-member-email">${escapeHTML(u.email)}</span>
              </div>
              <div class="ws-member-role-col">
                <span class="ws-role-pill ${m.role === 'admin' || isItemOwner ? 'role-admin' : 'role-member'}">
                  ${isItemOwner ? 'Chủ dự án' : (m.role === 'admin' ? 'Quản lý' : 'Thành viên')}
                </span>
                ${canRemove ? `
                  <button type="button" class="btn-remove-member" onclick="handleRemoveMember(${ws.id}, ${u.id})" title="Xóa thành viên khỏi dự án">
                    <i class="fa-solid fa-user-xmark"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Lỗi khi nạp chi tiết dự án:', err);
  }
}
window.selectWorkspace = selectWorkspace;

async function handleCreateWorkspace(e) {
  if (e) e.preventDefault();
  const nameInput = document.getElementById('newWorkspaceName');
  const descInput = document.getElementById('newWorkspaceDesc');
  const name = nameInput ? nameInput.value.trim() : '';
  const description = descInput ? descInput.value.trim() : '';

  if (name.length < 2) {
    showToast('Tên dự án phải có ít nhất 2 ký tự!', 'error');
    if (nameInput) nameInput.focus();
    return;
  }

  try {
    const res = await apiFetch('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast('Đã tạo Không gian làm việc mới thành công!', 'success');
      const createBox = document.getElementById('createWorkspaceBox');
      const detailBox = document.getElementById('workspaceDetailsBox');
      if (createBox) createBox.style.display = 'none';
      if (detailBox) detailBox.style.display = 'block';
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';

      activeWorkspaceId = result.data.id;
      await loadWorkspaceList();
    } else {
      showToast(result.message || 'Không thể tạo dự án!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi tạo dự án!', 'error');
  }
}

async function handleInviteMember() {
  if (!activeWorkspaceId) {
    showToast('Vui lòng chọn một dự án trước khi mời thành viên!', 'warning');
    return;
  }

  const emailInput = document.getElementById('inviteMemberEmail');
  const roleSelect = document.getElementById('inviteMemberRole');
  const btn = document.getElementById('btnInviteMember');

  const email = emailInput ? emailInput.value.trim() : '';
  const role = roleSelect ? roleSelect.value : 'member';

  if (!email || !email.includes('@')) {
    showToast('Vui lòng nhập địa chỉ email hợp lệ!', 'error');
    if (emailInput) emailInput.focus();
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang mời...</span>`;
  }

  try {
    const res = await apiFetch(`/workspaces/${activeWorkspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast(`Đã mời thành công ${email} vào dự án!`, 'success');
      if (emailInput) emailInput.value = '';
      workspaceMembersCache.delete(activeWorkspaceId);
      await selectWorkspace(activeWorkspaceId);
    } else {
      showToast(result.message || 'Không thể mời thành viên!', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối khi gửi lời mời vào dự án!', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-user-plus"></i> <span>Mời</span>`;
    }
  }
}

async function handleRemoveMember(wsId, userId) {
  if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?')) return;

  try {
    const res = await apiFetch(`/workspaces/${wsId}/members/${userId}`, {
      method: 'DELETE'
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast('Đã gỡ thành viên khỏi dự án!', 'success');
      workspaceMembersCache.delete(wsId);
      await selectWorkspace(wsId);
    } else {
      showToast(result.message || 'Không thể xóa thành viên!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi xóa thành viên!', 'error');
  }
}
window.handleRemoveMember = handleRemoveMember;

// --- 5. Bảng Quản trị Admin Dashboard (RBAC) ---
function openAdminModal() {
  const modal = document.getElementById('adminDashboardModal');
  if (modal) {
    modal.classList.add('active');
    loadAdminDashboard();
  }
}

function closeAdminModal() {
  const modal = document.getElementById('adminDashboardModal');
  if (modal) modal.classList.remove('active');
}

async function loadAdminDashboard() {
  const statUsers = document.getElementById('adminStatTotalUsers');
  const statActive = document.getElementById('adminStatActiveUsers');
  const statLocked = document.getElementById('adminStatLockedUsers');
  const statTodos = document.getElementById('adminStatTotalTodos');
  const tableBody = document.getElementById('adminUsersTableBody');

  if (tableBody) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu người dùng toàn sàn...</td></tr>`;
  }

  try {
    const [statsRes, usersRes] = await Promise.all([
      apiFetch('/admin/stats'),
      apiFetch('/admin/users')
    ]);

    const statsData = await statsRes.json();
    const usersData = await usersRes.json();

    if (statsRes.ok && statsData.success) {
      const s = statsData.data;
      if (statUsers) statUsers.textContent = s.totalUsers || 0;
      if (statActive) statActive.textContent = s.activeUsers || 0;
      if (statLocked) statLocked.textContent = s.lockedUsers || 0;
      if (statTodos) statTodos.textContent = s.totalTodos || 0;
    }

    if (usersRes.ok && usersData.success) {
      adminUsersList = usersData.data || [];
      renderAdminUsersTable();
    }
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu admin:', err);
    showToast('Không thể tải thông tin quản trị hệ thống!', 'error');
  }
}

function renderAdminUsersTable() {
  const tableBody = document.getElementById('adminUsersTableBody');
  const searchInput = document.getElementById('adminUserSearchInput');
  const roleFilter = document.getElementById('adminRoleFilter');
  const statusFilter = document.getElementById('adminStatusFilter');

  if (!tableBody) return;

  const query = (searchInput ? searchInput.value.trim() : '').toLowerCase();
  const role = roleFilter ? roleFilter.value : 'all';
  const status = statusFilter ? statusFilter.value : 'all';

  let filtered = adminUsersList.filter(u => {
    if (query) {
      const matchName = (u.name || '').toLowerCase().includes(query);
      const matchEmail = (u.email || '').toLowerCase().includes(query);
      if (!matchName && !matchEmail) return false;
    }
    if (role !== 'all' && u.role !== role) return false;
    if (status === 'active' && u.isLocked) return false;
    if (status === 'locked' && !u.isLocked) return false;

    return true;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">Không tìm thấy người dùng phù hợp với bộ lọc.</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map(u => {
    const isMe = currentUser && currentUser.id === u.id;
    const isLocked = !!u.isLocked;
    const taskCount = u._count ? (u._count.todos || 0) : 0;
    const dateJoined = formatDate(u.createdAt);
    const initial = (u.name ? u.name.charAt(0) : 'U').toUpperCase();

    return `
      <tr class="${isLocked ? 'user-row-locked' : ''}">
        <td>
          <div class="admin-user-cell">
            <div class="admin-user-avatar">${initial}</div>
            <div class="admin-user-info">
              <strong>${escapeHTML(u.name)}${isMe ? ' (Bạn)' : ''}</strong>
              <span>${escapeHTML(u.email)}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${u.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}">
            ${u.role === 'admin' ? '<i class="fa-solid fa-shield-halved"></i> Admin' : '<i class="fa-solid fa-user"></i> User'}
          </span>
        </td>
        <td>
          <span class="user-tasks-count">${taskCount} việc</span>
        </td>
        <td>
          <span class="user-created-date">${dateJoined}</span>
        </td>
        <td>
          <span class="user-status-pill ${isLocked ? 'status-locked' : 'status-active'}">
            ${isLocked ? '<i class="fa-solid fa-lock"></i> Đã khóa' : '<i class="fa-solid fa-check"></i> Hoạt động'}
          </span>
        </td>
        <td>
          <div class="admin-actions-cell">
            <!-- Nút Khóa / Mở Khóa Tài Khoản -->
            <button 
              type="button" 
              class="btn-admin-act ${isLocked ? 'btn-unlock' : 'btn-lock'}" 
              onclick="handleToggleUserLock(${u.id}, ${isLocked})" 
              ${isMe ? 'disabled title="Bạn không thể tự khóa tài khoản của mình"' : `title="${isLocked ? 'Mở khóa tài khoản này' : 'Khóa tài khoản này'}"`}
            >
              <i class="fa-solid ${isLocked ? 'fa-lock-open' : 'fa-lock'}"></i>
              <span>${isLocked ? 'Mở khóa' : 'Khóa'}</span>
            </button>

            <!-- Nút Chuyển đổi vai trò RBAC -->
            <button 
              type="button" 
              class="btn-admin-act btn-role-toggle" 
              onclick="handleChangeUserRole(${u.id}, '${u.role === 'admin' ? 'user' : 'admin'}')" 
              ${isMe ? 'disabled title="Bạn không thể tự đổi vai trò của mình"' : `title="Đổi thành ${u.role === 'admin' ? 'User' : 'Admin'}"`}
            >
              <i class="fa-solid fa-repeat"></i>
              <span>${u.role === 'admin' ? 'Hạ quyền User' : 'Lên Admin'}</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function handleToggleUserLock(userId, currentLocked) {
  const actionText = currentLocked ? 'mở khóa' : 'khóa';
  if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản người dùng này?`)) return;

  try {
    const res = await apiFetch(`/admin/users/${userId}/lock`, {
      method: 'PUT',
      body: JSON.stringify({ isLocked: !currentLocked })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast(result.message || `Đã ${actionText} tài khoản thành công!`, 'success');
      await loadAdminDashboard();
    } else {
      showToast(result.message || `Không thể ${actionText} tài khoản!`, 'error');
    }
  } catch (err) {
    showToast(`Lỗi kết nối khi ${actionText} tài khoản!`, 'error');
  }
}
window.handleToggleUserLock = handleToggleUserLock;

async function handleChangeUserRole(userId, newRole) {
  const roleName = newRole === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng tiêu chuẩn (User)';
  if (!confirm(`Bạn có chắc chắn muốn chuyển đổi vai trò người này thành: ${roleName}?`)) return;

  try {
    const res = await apiFetch(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast(`Đã chuyển vai trò thành công sang: ${roleName}`, 'success');
      await loadAdminDashboard();
    } else {
      showToast(result.message || 'Không thể đổi vai trò người dùng!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi thay đổi vai trò!', 'error');
  }
}
window.handleChangeUserRole = handleChangeUserRole;



