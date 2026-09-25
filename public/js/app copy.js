/**
 * TaskMaster Pro - Frontend Application Core
 * Luxury Dark Mode UI interacting directly with Express.js RESTful API & MySQL
 */

const API_BASE = '/api/v1';

// State
let allTodos = [];
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const dbStatusBadge = document.getElementById('dbStatusBadge');
const dbStatusText = document.getElementById('dbStatusText');
const seedDemoBtn = document.getElementById('seedDemoBtn');

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

const createTaskForm = document.getElementById('createTaskForm');
const taskTitleInput = document.getElementById('taskTitle');
const charCounter = document.getElementById('charCounter');
const taskDescInput = document.getElementById('taskDescription');
const taskStatusSelect = document.getElementById('taskStatus');
const submitCreateBtn = document.getElementById('submitCreateBtn');

const tasksContainer = document.getElementById('tasksContainer');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterPills = document.querySelectorAll('.pill-btn');

// Edit Modal
const editModalOverlay = document.getElementById('editModalOverlay');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskId = document.getElementById('editTaskId');
const editTaskTitle = document.getElementById('editTaskTitle');
const editTaskDescription = document.getElementById('editTaskDescription');
const editTaskStatus = document.getElementById('editTaskStatus');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const toastContainer = document.getElementById('toastContainer');

// ==================== KHỞI ĐỘNG ====================
document.addEventListener('DOMContentLoaded', () => {
  checkDbHealth();
  fetchTodos();
  setupEventListeners();
});

// ==================== GỌI API BACKEND ====================

// 1. Kiểm tra kết nối MySQL
async function checkDbHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (data.success) {
      dbStatusText.textContent = 'MySQL Live';
      dbStatusBadge.style.display = 'flex';
    } else {
      throw new Error();
    }
  } catch (err) {
    dbStatusText.textContent = 'MySQL Offline';
    dbStatusBadge.style.background = 'rgba(244, 63, 94, 0.12)';
    dbStatusBadge.style.borderColor = 'rgba(244, 63, 94, 0.35)';
    dbStatusBadge.style.color = '#fb7185';
    const pulse = dbStatusBadge.querySelector('.pulse-dot');
    if (pulse) {
      pulse.style.backgroundColor = '#f43f5e';
      pulse.style.boxShadow = '0 0 8px #f43f5e';
    }
  }
}

// 2. Lấy danh sách Todos
async function fetchTodos() {
  try {
    const res = await fetch(`${API_BASE}/todos`);
    const result = await res.json();

    if (result.success) {
      allTodos = result.data || [];
      renderTodos();
      updateStats();
    } else {
      showToast(result.message || 'Lỗi khi tải dữ liệu', 'error');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    tasksContainer.innerHTML = `
      <div class="empty-canvas">
        <div class="empty-art" style="color: var(--brand-rose); border-color: rgba(244, 63, 94, 0.4);">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h4 class="empty-headline">Chưa thể kết nối tới MySQL Server!</h4>
        <p class="empty-guide">Vui lòng mở <strong>Laragon</strong> và bấm nút <strong>Start All</strong> để bật cổng 3306.</p>
      </div>
    `;
    showToast('Không thể kết nối đến MySQL Server!', 'error');
  }
}

// 3. Tạo mới Todo
async function handleCreateTask(e) {
  if (e) e.preventDefault();

  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();
  const status = taskStatusSelect.value;

  if (title.length < 3) {
    showToast('Tiêu đề công việc phải có ít nhất 3 ký tự!', 'error');
    taskTitleInput.focus();
    return;
  }

  submitCreateBtn.disabled = true;
  submitCreateBtn.innerHTML = `
    <span class="btn-text"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu MySQL...</span>
    <span class="hotkey-badge">...</span>
  `;

  try {
    const res = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status })
    });

    const result = await res.json();

    if (res.ok && result.success) {
      allTodos.unshift(result.data);
      createTaskForm.reset();
      charCounter.textContent = '0/100';
      taskStatusSelect.value = 'pending';
      renderTodos();
      updateStats();
      showToast('Đã thêm công việc vào MySQL thành công!', 'success');
    } else {
      showToast(result.message || 'Không thể tạo công việc', 'error');
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

// 4. Tạo dữ liệu mẫu tự động (Seed Demo Data)
async function handleSeedDemoData() {
  const sampleTasks = [
    {
      title: '⚡ Thiết kế Database Schema MySQL (Layered Architecture)',
      description: 'Khởi tạo bảng todos và users với các khóa chính, khóa ngoại, chỉ mục index và timestamp.',
      status: 'completed'
    },
    {
      title: '🔒 Xây dựng JWT Authentication & Phân quyền đa người dùng',
      description: 'Viết middleware xác thực Bearer token, băm mật khẩu bằng bcryptjs và kiểm tra quyền sở hữu Todo.',
      status: 'in_progress'
    },
    {
      title: '🚀 Xây dựng bộ lọc nâng cao, Phân trang và Validate với Zod',
      description: 'Hỗ trợ query ?page=1&limit=10, lọc theo priority và kiểm tra đầu vào trước khi vào Controller.',
      status: 'pending'
    },
    {
      title: '📦 Tích hợp Multer Upload file đính kèm cho Task',
      description: 'Cho phép đính kèm tài liệu PDF hoặc ảnh chụp màn hình vào ghi chú công việc.',
      status: 'pending'
    }
  ];

  seedDemoBtn.disabled = true;
  seedDemoBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang nạp...';

  try {
    for (const task of sampleTasks) {
      await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
    }
    showToast('Đã nạp thành công 4 công việc mẫu vào MySQL!', 'success');
    await fetchTodos();
  } catch (err) {
    showToast('Lỗi khi nạp dữ liệu mẫu!', 'error');
  } finally {
    seedDemoBtn.disabled = false;
    seedDemoBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Tạo dữ liệu mẫu</span>';
  }
}

// 5. Đổi trạng thái nhanh (Click Checkbox)
async function toggleTaskComplete(id, currentStatus) {
  const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

  try {
    const res = await fetch(`${API_BASE}/todos/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await res.json();

    if (res.ok && result.success) {
      const idx = allTodos.findIndex(t => t.id === id);
      if (idx !== -1) {
        allTodos[idx] = result.data;
        renderTodos();
        updateStats();
      }
      showToast(`Cập nhật: ${getStatusLabel(newStatus)}`, 'info');
    } else {
      showToast(result.message || 'Lỗi cập nhật', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi cập nhật trạng thái', 'error');
  }
}

// 6. Modal Sửa
function openEditModal(todo) {
  editTaskId.value = todo.id;
  editTaskTitle.value = todo.title;
  editTaskDescription.value = todo.description || '';
  editTaskStatus.value = todo.status || 'pending';
  editModalOverlay.classList.add('active');
  setTimeout(() => editTaskTitle.focus(), 150);
}

function closeEditModal() {
  editModalOverlay.classList.remove('active');
  editTaskForm.reset();
}

async function handleSaveEdit(e) {
  e.preventDefault();
  const id = editTaskId.value;
  const title = editTaskTitle.value.trim();
  const description = editTaskDescription.value.trim();
  const status = editTaskStatus.value;

  if (title.length < 3) {
    showToast('Tiêu đề phải có ít nhất 3 ký tự!', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status })
    });

    const result = await res.json();

    if (res.ok && result.success) {
      const idx = allTodos.findIndex(t => t.id == id);
      if (idx !== -1) {
        allTodos[idx] = result.data;
        renderTodos();
        updateStats();
      }
      closeEditModal();
      showToast('Đã lưu thay đổi vào MySQL!', 'success');
    } else {
      showToast(result.message || 'Cập nhật thất bại!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi lưu chỉnh sửa', 'error');
  }
}

// 7. Xóa Todo
async function handleDeleteTask(id, title) {
  if (!confirm(`Bạn có chắc chắn muốn xóa công việc:\n"${title}" khỏi MySQL?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'DELETE'
    });

    if (res.status === 204 || res.ok) {
      allTodos = allTodos.filter(t => t.id !== id);
      renderTodos();
      updateStats();
      showToast('Đã xóa công việc vĩnh viễn!', 'info');
    } else {
      const data = await res.json();
      showToast(data.message || 'Không thể xóa công việc!', 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi xóa công việc', 'error');
  }
}

// ==================== RENDERING ====================

function renderTodos() {
  // Lọc
  const filtered = allTodos.filter(todo => {
    const matchesFilter = (currentFilter === 'all') || (todo.status === currentFilter);
    const titleMatch = todo.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (todo.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && (titleMatch || descMatch);
  });

  // Empty state
  if (filtered.length === 0) {
    tasksContainer.innerHTML = `
      <div class="empty-canvas">
        <div class="empty-art">
          <i class="fa-solid fa-inbox"></i>
        </div>
        <h4 class="empty-headline">Chưa có công việc nào ở đây!</h4>
        <p class="empty-guide">${searchQuery ? 'Không tìm thấy kết quả phù hợp với từ khóa.' : 'Hãy tạo công việc mới ở khung bên trái hoặc bấm nút dưới để nạp dữ liệu mẫu nhanh.'}</p>
        ${!searchQuery ? `
          <button class="btn btn-seed" onclick="handleSeedDemoData()">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Tạo ngay 4 công việc mẫu
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  // Stream task items
  tasksContainer.innerHTML = filtered.map(todo => {
    const isDone = todo.status === 'completed';
    const chipClass = `chip-${todo.status}`;
    const label = getStatusLabel(todo.status);
    const timeFormatted = formatDate(todo.created_at || todo.createdAt);

    return `
      <div class="task-item ${isDone ? 'is-done' : ''}" data-id="${todo.id}">
        <div class="custom-check" onclick="toggleTaskComplete(${todo.id}, '${todo.status}')" title="${isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}">
          <i class="fa-solid fa-check"></i>
        </div>

        <div class="task-main">
          <div class="task-top">
            <h4 class="task-heading">${escapeHTML(todo.title)}</h4>
            <div class="task-controls">
              <button class="btn-icon-action" onclick="handleEditClick(${todo.id})" title="Chỉnh sửa">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button class="btn-icon-action btn-del" onclick="handleDeleteTask(${todo.id}, '${escapeHTML(todo.title)}')" title="Xóa">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>

          ${todo.description ? `<p class="task-body-text">${escapeHTML(todo.description)}</p>` : ''}

          <div class="task-footer">
            <span class="status-chip ${chipClass}">
              ${getStatusIcon(todo.status)} ${label}
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

// Cập nhật các chỉ số
function updateStats() {
  const total = allTodos.length;
  const pending = allTodos.filter(t => t.status === 'pending').length;
  const inProgress = allTodos.filter(t => t.status === 'in_progress').length;
  const completed = allTodos.filter(t => t.status === 'completed').length;

  totalTasksCount.textContent = total;
  pendingTasksCount.textContent = pending;
  inProgressTasksCount.textContent = inProgress;
  completedTasksCount.textContent = completed;

  badgeAll.textContent = total;
  badgePending.textContent = pending;
  badgeInProgress.textContent = inProgress;
  badgeCompleted.textContent = completed;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  completionPercentage.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

// Window bindings
window.handleEditClick = (id) => {
  const todo = allTodos.find(t => t.id === id);
  if (todo) openEditModal(todo);
};
window.toggleTaskComplete = toggleTaskComplete;
window.handleDeleteTask = handleDeleteTask;
window.handleSeedDemoData = handleSeedDemoData;

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  // Submit Form
  createTaskForm.addEventListener('submit', handleCreateTask);

  // Hotkey Ctrl + Enter
  taskTitleInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleCreateTask();
    }
  });

  taskDescInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleCreateTask();
    }
  });

  // Character counter
  taskTitleInput.addEventListener('input', (e) => {
    const len = e.target.value.length;
    charCounter.textContent = `${len}/100`;
  });

  // Seed Data Button
  seedDemoBtn.addEventListener('click', handleSeedDemoData);

  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    renderTodos();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderTodos();
  });

  // Filter Pills
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter');
      renderTodos();
    });
  });

  // Modal
  editTaskForm.addEventListener('submit', handleSaveEdit);
  closeEditModalBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);
  editModalOverlay.addEventListener('click', (e) => {
    if (e.target === editModalOverlay) closeEditModal();
  });
}

// ==================== HELPERS ====================

function getStatusLabel(status) {
  switch (status) {
    case 'pending': return 'Chờ thực hiện';
    case 'in_progress': return 'Đang xử lý';
    case 'completed': return 'Đã hoàn thành';
    default: return status;
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'pending': return '<i class="fa-regular fa-clock"></i>';
    case 'in_progress': return '<i class="fa-solid fa-arrows-rotate"></i>';
    case 'completed': return '<i class="fa-solid fa-check"></i>';
    default: return '';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'Vừa xong';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Vừa xong';

  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} - ${day}/${month}`;
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

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;

  let icon = 'fa-solid fa-circle-info';
  if (type === 'success') icon = 'fa-solid fa-circle-check';
  if (type === 'error') icon = 'fa-solid fa-circle-exclamation';

  toast.innerHTML = `
    <i class="${icon}"></i>
    <span class="toast-txt">${escapeHTML(message)}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
