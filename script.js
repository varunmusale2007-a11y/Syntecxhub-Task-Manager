/**
 * ============================================================================
 * TASKFLOW SAAS TASK MANAGER — APPLICATION ENGINE
 * Syntecxhub Internship Task 3 Project 1
 * Pure Vanilla JavaScript (ES6+) — Zero External Dependencies
 * ============================================================================
 */

(function () {
  'use strict';

  // Storage Keys
  const STORAGE_KEYS = {
    TASKS: 'syntecx_taskflow_tasks',
    THEME: 'syntecx_taskflow_theme',
    USER: 'syntecx_taskflow_user',
    VIEW_MODE: 'syntecx_taskflow_view_mode'
  };

  // Default Sample Tasks for First-time Users
  const SAMPLE_TASKS = [
    {
      id: 'task_sample_1',
      title: 'Finalize Q4 API Architecture & Documentation',
      description: 'Prepare RESTful API endpoint definitions, request/response schema specifications, and OpenAPI Swagger documentation for review.',
      priority: 'high',
      status: 'in_progress',
      dueDate: getRelativeDateString(2), // 2 days from now
      category: 'Development',
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'task_sample_2',
      title: 'Review pull requests for authentication refactor',
      description: 'Audit code reviews for token storage, rate-limiting middleware, and unit test coverage across authorization endpoints.',
      priority: 'medium',
      status: 'pending',
      dueDate: getRelativeDateString(1), // Tomorrow
      category: 'Work',
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
    },
    {
      id: 'task_sample_3',
      title: 'Design dark-mode color tokens & Figma components',
      description: 'Extract accessible contrast ratios (WCAG AA), finalize indigo-violet primary accents, and establish card elevation levels.',
      priority: 'high',
      status: 'completed',
      dueDate: getRelativeDateString(-2), // 2 days ago
      category: 'Design',
      createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'task_sample_4',
      title: 'Prepare presentation slides for sprint demo',
      description: 'Summarize sprint key deliverables, live user journey flows, and analytics metrics for client stakeholder meeting.',
      priority: 'medium',
      status: 'pending',
      dueDate: getRelativeDateString(4), // 4 days from now
      category: 'Work',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'task_sample_5',
      title: 'Submit weekly internship progress report',
      description: 'Document Task 3 Project 1 implementation details, responsive layout testing across devices, and GitHub Pages deployment URL.',
      priority: 'high',
      status: 'pending',
      dueDate: getRelativeDateString(-1), // Yesterday (Overdue demo)
      category: 'Urgent',
      createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
    },
    {
      id: 'task_sample_6',
      title: 'Organize study notes on frontend performance',
      description: 'Review critical rendering path, CSS containment, layout shift optimization, and vanilla DOM manipulation best practices.',
      priority: 'low',
      status: 'completed',
      dueDate: getRelativeDateString(7), // 7 days from now
      category: 'Personal',
      createdAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ];

  // Application State
  const state = {
    tasks: [],
    currentView: 'dashboard',
    viewMode: 'grid', // 'grid' | 'table'
    theme: 'light',
    userName: 'Alex Johnson',
    editingTaskId: null,
    pendingAction: null, // Stores callback for confirmation modal
    filters: {
      search: '',
      status: 'all',
      priority: 'all',
      sortBy: 'dueDateAsc'
    }
  };

  // Helper: compute relative ISO date string (YYYY-MM-DD)
  function getRelativeDateString(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Helper: escape HTML to avoid XSS
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Helper: generate unique task ID
  function generateId() {
    return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
  }

  // ==========================================================================
  // STORAGE & DATA ACCESS
  // ==========================================================================
  const Storage = {
    loadTasks() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
        if (raw === null) {
          // First time user: initialize with sample tasks
          this.saveTasks(SAMPLE_TASKS);
          return [...SAMPLE_TASKS];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error('Error loading tasks from localStorage:', err);
        return [];
      }
    },

    saveTasks(tasks) {
      try {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      } catch (err) {
        console.error('Error saving tasks to localStorage:', err);
        showToast('Storage quota exceeded or storage disabled.', 'error');
      }
    },

    loadTheme() {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.THEME);
        if (saved) return saved;
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        return 'light';
      } catch {
        return 'light';
      }
    },

    saveTheme(theme) {
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
      } catch (err) {
        console.error('Error saving theme preference:', err);
      }
    },

    loadUser() {
      try {
        return localStorage.getItem(STORAGE_KEYS.USER) || 'Alex Johnson';
      } catch {
        return 'Alex Johnson';
      }
    },

    saveUser(name) {
      try {
        localStorage.setItem(STORAGE_KEYS.USER, name);
      } catch (err) {
        console.error('Error saving user profile:', err);
      }
    },

    loadViewMode() {
      try {
        return localStorage.getItem(STORAGE_KEYS.VIEW_MODE) || 'grid';
      } catch {
        return 'grid';
      }
    },

    saveViewMode(mode) {
      try {
        localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
      } catch (err) {
        console.error('Error saving view mode:', err);
      }
    }
  };

  // ==========================================================================
  // DOM ELEMENT SELECTORS
  // ==========================================================================
  const DOM = {
    // Layout & Navigation
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    closeSidebarBtn: document.getElementById('close-sidebar-btn'),
    navLinks: document.querySelectorAll('.nav-link'),
    views: document.querySelectorAll('.content-view'),
    
    // Header controls
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    globalSearchInput: document.getElementById('global-search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    headerAddTaskBtn: document.getElementById('header-add-task-btn'),
    sidebarAddTaskBtn: document.getElementById('sidebar-add-task-btn'),
    sidebarUserName: document.getElementById('sidebar-user-name'),
    sidebarUserAvatar: document.getElementById('sidebar-user-avatar'),

    // Nav counters
    badgeTotal: document.getElementById('badge-total-tasks'),
    badgePending: document.getElementById('badge-pending-tasks'),
    badgeInProgress: document.getElementById('badge-in-progress-tasks'),
    badgeCompleted: document.getElementById('badge-completed-tasks'),

    // Dashboard View elements
    dashboardDate: document.getElementById('dashboard-current-date'),
    dashboardGreeting: document.getElementById('dashboard-welcome-heading'),
    welcomePendingHighlight: document.getElementById('welcome-pending-highlight'),
    statTotal: document.getElementById('stat-total-count'),
    statPending: document.getElementById('stat-pending-count'),
    statInProgress: document.getElementById('stat-inprogress-count'),
    statCompleted: document.getElementById('stat-completed-count'),
    statOverdue: document.getElementById('stat-overdue-count'),
    rateBadge: document.getElementById('completion-percentage-badge'),
    circularProgressBar: document.getElementById('circular-progress-bar'),
    circularPercentageText: document.getElementById('circular-percentage-text'),
    barSegCompleted: document.getElementById('bar-seg-completed'),
    barSegInProgress: document.getElementById('bar-seg-inprogress'),
    barSegPending: document.getElementById('bar-seg-pending'),
    legendCompleted: document.getElementById('legend-completed-count'),
    legendInProgress: document.getElementById('legend-inprogress-count'),
    legendPending: document.getElementById('legend-pending-count'),
    upcomingDeadlinesList: document.getElementById('upcoming-deadlines-list'),
    dashboardRecentTasks: document.getElementById('dashboard-recent-tasks'),

    // Tasks View elements
    tasksViewTitle: document.getElementById('tasks-view-title'),
    tasksViewSubtitle: document.getElementById('tasks-view-subtitle'),
    viewSearchInput: document.getElementById('view-search-input'),
    filterStatusSelect: document.getElementById('filter-status-select'),
    filterPrioritySelect: document.getElementById('filter-priority-select'),
    filterSortSelect: document.getElementById('filter-sort-select'),
    viewModeGridBtn: document.getElementById('view-mode-grid-btn'),
    viewModeTableBtn: document.getElementById('view-mode-table-btn'),
    tasksCardsGrid: document.getElementById('tasks-cards-grid'),
    tasksTableWrapper: document.getElementById('tasks-table-wrapper'),
    tasksTableBody: document.getElementById('tasks-table-body'),
    tasksEmptyState: document.getElementById('tasks-empty-state'),
    emptyStateTitle: document.getElementById('empty-state-title'),
    emptyStateMessage: document.getElementById('empty-state-message'),
    activeFiltersBar: document.getElementById('active-filters-bar'),
    activeFilterChips: document.getElementById('active-filter-chips'),
    clearFiltersBtn: document.getElementById('clear-filters-btn'),

    // Settings elements
    settingsProfileForm: document.getElementById('settings-profile-form'),
    settingsUsernameInput: document.getElementById('settings-username-input'),
    themeRadioLight: document.getElementById('theme-radio-light'),
    themeRadioDark: document.getElementById('theme-radio-dark'),
    btnResetSample: document.getElementById('btn-reset-sample'),
    btnExportJson: document.getElementById('btn-export-json'),
    btnImportJson: document.getElementById('btn-import-json'),
    importJsonInput: document.getElementById('import-json-input'),
    btnClearAll: document.getElementById('btn-clear-all'),

    // Task Modal elements
    taskModal: document.getElementById('task-modal'),
    taskModalCloseBtn: document.getElementById('task-modal-close-btn'),
    taskModalCancelBtn: document.getElementById('task-modal-cancel-btn'),
    taskForm: document.getElementById('task-form'),
    taskIdHidden: document.getElementById('task-id-hidden'),
    taskTitleInput: document.getElementById('task-title-input'),
    taskDescInput: document.getElementById('task-desc-input'),
    taskPriorityInput: document.getElementById('task-priority-input'),
    taskStatusInput: document.getElementById('task-status-input'),
    taskDateInput: document.getElementById('task-date-input'),
    taskCategoryInput: document.getElementById('task-category-input'),
    taskModalTitle: document.getElementById('task-modal-title'),
    submitBtnText: document.getElementById('submit-btn-text'),
    titleErrorMsg: document.getElementById('title-error-msg'),
    quickDateBtns: document.querySelectorAll('.quick-date-btn'),

    // Confirmation Modal elements
    confirmModal: document.getElementById('confirm-modal'),
    confirmModalTitle: document.getElementById('confirm-modal-title'),
    confirmModalMessage: document.getElementById('confirm-modal-message'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
    confirmProceedBtn: document.getElementById('confirm-proceed-btn'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // ==========================================================================
  // DATE & TIME HELPERS
  // ==========================================================================
  function formatFriendlyDate(dateString) {
    if (!dateString) return 'No due date';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    
    // Check if valid date
    if (isNaN(date.getTime())) return dateString;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return target.toLocaleDateString(undefined, options);
  }

  function formatShortDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function isOverdue(dueDateString) {
    if (!dueDateString) return false;
    const parts = dueDateString.split('-');
    if (parts.length !== 3) return false;
    const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    target.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return target < today;
  }

  function getDueStatusClass(dueDateString, status) {
    if (status === 'completed') return 'due-upcoming';
    if (!dueDateString) return 'due-upcoming';
    
    const parts = dueDateString.split('-');
    const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    target.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'due-overdue';
    if (diffDays === 0) return 'due-today';
    return 'due-upcoming';
  }

  // ==========================================================================
  // TOAST NOTIFICATION ENGINE
  // ==========================================================================
  function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    switch (type) {
      case 'success':
        iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        break;
      case 'error':
        iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        break;
      case 'warning':
        iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        break;
      default:
        iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-content">${escapeHTML(message)}</div>
      <button class="toast-close-btn" aria-label="Dismiss toast">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', () => removeToast(toast));

    DOM.toastContainer.appendChild(toast);

    const timer = setTimeout(() => {
      removeToast(toast);
    }, duration);

    function removeToast(el) {
      clearTimeout(timer);
      el.classList.add('toast-hiding');
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 250);
    }
  }

  // ==========================================================================
  // CONFIRMATION DIALOG MODAL
  // ==========================================================================
  function openConfirmModal({ title, message, confirmText = 'Confirm', isDanger = true, onConfirm }) {
    DOM.confirmModalTitle.textContent = title;
    DOM.confirmModalMessage.textContent = message;
    DOM.confirmProceedBtn.textContent = confirmText;
    
    if (isDanger) {
      DOM.confirmProceedBtn.className = 'btn btn-danger';
    } else {
      DOM.confirmProceedBtn.className = 'btn btn-primary';
    }

    state.pendingAction = onConfirm;
    DOM.confirmModal.classList.remove('hidden');
    DOM.confirmProceedBtn.focus();
  }

  function closeConfirmModal() {
    DOM.confirmModal.classList.add('hidden');
    state.pendingAction = null;
  }

  DOM.confirmCancelBtn.addEventListener('click', closeConfirmModal);
  DOM.confirmProceedBtn.addEventListener('click', () => {
    if (typeof state.pendingAction === 'function') {
      state.pendingAction();
    }
    closeConfirmModal();
  });

  // ==========================================================================
  // THEME MANAGEMENT
  // ==========================================================================
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    Storage.saveTheme(theme);

    if (DOM.themeRadioLight && DOM.themeRadioDark) {
      DOM.themeRadioLight.checked = (theme === 'light');
      DOM.themeRadioDark.checked = (theme === 'dark');
    }
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme} mode`, 'info');
  }

  DOM.themeToggleBtn.addEventListener('click', toggleTheme);
  if (DOM.themeRadioLight) {
    DOM.themeRadioLight.addEventListener('change', () => applyTheme('light'));
  }
  if (DOM.themeRadioDark) {
    DOM.themeRadioDark.addEventListener('change', () => applyTheme('dark'));
  }

  // ==========================================================================
  // USER PROFILE MANAGEMENT
  // ==========================================================================
  function updateProfileUI() {
    if (DOM.sidebarUserName) DOM.sidebarUserName.textContent = state.userName;
    if (DOM.sidebarUserAvatar) {
      const initials = state.userName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'US';
      DOM.sidebarUserAvatar.textContent = initials;
    }
    if (DOM.settingsUsernameInput) DOM.settingsUsernameInput.value = state.userName;
  }

  if (DOM.settingsProfileForm) {
    DOM.settingsProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = DOM.settingsUsernameInput.value.trim();
      if (val) {
        state.userName = val;
        Storage.saveUser(val);
        updateProfileUI();
        renderDashboard();
        showToast('Profile name updated successfully!', 'success');
      }
    });
  }

  // ==========================================================================
  // ROUTING & NAVIGATION
  // ==========================================================================
  function navigateTo(viewId) {
    const validViews = ['dashboard', 'all-tasks', 'pending', 'in-progress', 'completed', 'settings'];
    if (!validViews.includes(viewId)) {
      viewId = 'dashboard';
    }

    state.currentView = viewId;

    // Update active nav links
    DOM.navLinks.forEach(link => {
      const linkView = link.getAttribute('data-view');
      link.classList.toggle('active', linkView === viewId);
    });

    // Update displayed section
    DOM.views.forEach(section => {
      section.classList.remove('active');
    });

    if (viewId === 'dashboard') {
      const dash = document.getElementById('dashboard-view');
      if (dash) dash.classList.add('active');
      renderDashboard();
    } else if (viewId === 'settings') {
      const sett = document.getElementById('settings-view');
      if (sett) sett.classList.add('active');
    } else {
      // It's a task listing view (all-tasks, pending, in-progress, completed)
      const tasksView = document.getElementById('tasks-view');
      if (tasksView) tasksView.classList.add('active');
      
      // Auto-set the status filter to match the navigated view tab
      if (viewId === 'pending') {
        state.filters.status = 'pending';
        DOM.tasksViewTitle.textContent = 'Pending Tasks';
        DOM.tasksViewSubtitle.textContent = 'Tasks awaiting initiation or further review.';
      } else if (viewId === 'in-progress') {
        state.filters.status = 'in_progress';
        DOM.tasksViewTitle.textContent = 'In Progress Tasks';
        DOM.tasksViewSubtitle.textContent = 'Active workflows currently under execution.';
      } else if (viewId === 'completed') {
        state.filters.status = 'completed';
        DOM.tasksViewTitle.textContent = 'Completed Tasks';
        DOM.tasksViewSubtitle.textContent = 'Finished tasks and archived achievements.';
      } else {
        state.filters.status = 'all';
        DOM.tasksViewTitle.textContent = 'All Tasks';
        DOM.tasksViewSubtitle.textContent = 'Manage, prioritize, and track all your workflow tasks.';
      }

      if (DOM.filterStatusSelect) {
        DOM.filterStatusSelect.value = state.filters.status;
      }

      renderTasksView();
    }

    // Close mobile drawer on navigation
    closeMobileSidebar();

    // Scroll to top of main content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle URL hash routing
  function handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash);
  }

  window.addEventListener('hashchange', handleHashChange);

  // Mobile sidebar controls
  function openMobileSidebar() {
    DOM.sidebar.classList.add('open');
    DOM.sidebarOverlay.classList.add('active');
  }

  function closeMobileSidebar() {
    DOM.sidebar.classList.remove('open');
    DOM.sidebarOverlay.classList.remove('active');
  }

  DOM.mobileMenuBtn.addEventListener('click', openMobileSidebar);
  DOM.closeSidebarBtn.addEventListener('click', closeMobileSidebar);
  DOM.sidebarOverlay.addEventListener('click', closeMobileSidebar);

  // ==========================================================================
  // CRUD OPERATIONS FOR TASKS
  // ==========================================================================
  function createTask({ title, description, priority, status, dueDate, category }) {
    const newTask = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'medium',
      status: status || 'pending',
      dueDate: dueDate || '',
      category: category || 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    state.tasks.unshift(newTask);
    Storage.saveTasks(state.tasks);
    updateAllViews();
    showToast(`Task "${newTask.title}" created successfully!`, 'success');
  }

  function updateTask(id, updates) {
    const index = state.tasks.findIndex(t => t.id === id);
    if (index === -1) return;

    state.tasks[index] = {
      ...state.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    Storage.saveTasks(state.tasks);
    updateAllViews();
    showToast('Task details updated successfully!', 'success');
  }

  function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    const title = task ? task.title : 'Task';

    openConfirmModal({
      title: 'Delete Task',
      message: `Are you sure you want to permanently delete "${title}"? This action cannot be reversed.`,
      confirmText: 'Delete Permanently',
      isDanger: true,
      onConfirm: () => {
        state.tasks = state.tasks.filter(t => t.id !== id);
        Storage.saveTasks(state.tasks);
        updateAllViews();
        showToast(`Task deleted successfully.`, 'info');
      }
    });
  }

  function toggleTaskComplete(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTask(id, { status: newStatus });

    if (newStatus === 'completed') {
      showToast(`Task marked as completed! 🎉`, 'success');
    } else {
      showToast(`Task reopened as pending.`, 'info');
    }
  }

  function changeTaskStatus(id, newStatus) {
    updateTask(id, { status: newStatus });
  }

  // ==========================================================================
  // BADGES & STATS CALCULATION ENGINE
  // ==========================================================================
  function computeStats() {
    const total = state.tasks.length;
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;

    state.tasks.forEach(t => {
      if (t.status === 'completed') {
        completed++;
      } else {
        if (t.status === 'in_progress') inProgress++;
        else pending++;

        if (t.dueDate && isOverdue(t.dueDate)) {
          overdue++;
        }
      }
    });

    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, pending, inProgress, completed, overdue, completionRate };
  }

  function renderSidebarBadges() {
    const stats = computeStats();
    if (DOM.badgeTotal) DOM.badgeTotal.textContent = stats.total;
    if (DOM.badgePending) DOM.badgePending.textContent = stats.pending;
    if (DOM.badgeInProgress) DOM.badgeInProgress.textContent = stats.inProgress;
    if (DOM.badgeCompleted) DOM.badgeCompleted.textContent = stats.completed;
  }

  // ==========================================================================
  // VIEW 1: DASHBOARD RENDERING
  // ==========================================================================
  function renderDashboard() {
    const stats = computeStats();

    // 1. Current Date & Dynamic Greeting
    const now = new Date();
    const dateFormatted = now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    DOM.dashboardDate.textContent = dateFormatted;

    const hour = now.getHours();
    let greetingWord = 'Good morning';
    if (hour >= 12 && hour < 17) greetingWord = 'Good afternoon';
    else if (hour >= 17) greetingWord = 'Good evening';

    DOM.dashboardGreeting.textContent = `${greetingWord}, ${state.userName}!`;
    DOM.welcomePendingHighlight.textContent = `${stats.pending} task${stats.pending === 1 ? '' : 's'} pending`;

    // 2. Stat KPI Cards
    DOM.statTotal.textContent = stats.total;
    DOM.statPending.textContent = stats.pending;
    DOM.statInProgress.textContent = stats.inProgress;
    DOM.statCompleted.textContent = stats.completed;
    DOM.statOverdue.textContent = stats.overdue;

    // 3. Completion Rate Ring & Stacked Bar
    DOM.rateBadge.textContent = `${stats.completionRate}%`;
    DOM.circularPercentageText.textContent = `${stats.completionRate}%`;

    // Calculate circumference for r=50: 2 * PI * 50 = 314.159
    const circumference = 314.159;
    const offset = circumference - (stats.completionRate / 100) * circumference;
    DOM.circularProgressBar.style.strokeDashoffset = offset;

    // Segmented bar widths
    if (stats.total > 0) {
      const compPct = (stats.completed / stats.total) * 100;
      const inProgPct = (stats.inProgress / stats.total) * 100;
      const pendPct = (stats.pending / stats.total) * 100;

      DOM.barSegCompleted.style.width = `${compPct}%`;
      DOM.barSegInProgress.style.width = `${inProgPct}%`;
      DOM.barSegPending.style.width = `${pendPct}%`;
    } else {
      DOM.barSegCompleted.style.width = '0%';
      DOM.barSegInProgress.style.width = '0%';
      DOM.barSegPending.style.width = '0%';
    }

    DOM.legendCompleted.textContent = stats.completed;
    DOM.legendInProgress.textContent = stats.inProgress;
    DOM.legendPending.textContent = stats.pending;

    // 4. Upcoming Deadlines List (Next uncompleted tasks sorted by due date)
    const upcomingTasks = state.tasks
      .filter(t => t.status !== 'completed' && t.dueDate)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    if (upcomingTasks.length === 0) {
      DOM.upcomingDeadlinesList.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.88rem;">
          No upcoming deadlines scheduled. You're all caught up!
        </div>
      `;
    } else {
      DOM.upcomingDeadlinesList.innerHTML = upcomingTasks.map(task => {
        const dueClass = getDueStatusClass(task.dueDate, task.status);
        const dueLabel = formatFriendlyDate(task.dueDate);
        return `
          <div class="deadline-item">
            <div class="deadline-left">
              <button class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                      data-task-id="${task.id}" 
                      aria-label="Toggle task complete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <span class="deadline-title" title="${escapeHTML(task.title)}">${escapeHTML(task.title)}</span>
            </div>
            <div class="deadline-right">
              <span class="badge badge-priority-${task.priority}">${task.priority}</span>
              <span class="due-indicator ${dueClass}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${dueLabel}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }

    // 5. Recently Added Tasks Grid (Latest 4 created tasks)
    const recentTasks = [...state.tasks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);

    if (recentTasks.length === 0) {
      DOM.dashboardRecentTasks.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
          No tasks available. Click <strong>"Create Task"</strong> above to get started!
        </div>
      `;
    } else {
      DOM.dashboardRecentTasks.innerHTML = recentTasks.map(task => createTaskCardHTML(task)).join('');
    }
  }

  // ==========================================================================
  // VIEW 2: TASKS VIEW RENDERING (Grid / Table + Filters & Sort)
  // ==========================================================================
  function getFilteredAndSortedTasks() {
    let result = [...state.tasks];

    // Search filter (title and description)
    const term = state.filters.search.toLowerCase().trim();
    if (term) {
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(term)) ||
        (t.description && t.description.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (state.filters.status && state.filters.status !== 'all') {
      result = result.filter(t => t.status === state.filters.status);
    }

    // Priority filter
    if (state.filters.priority && state.filters.priority !== 'all') {
      result = result.filter(t => t.priority === state.filters.priority);
    }

    // Sort order
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    switch (state.filters.sortBy) {
      case 'dueDateAsc':
        result.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
        break;
      case 'dueDateDesc':
        result.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return b.dueDate.localeCompare(a.dueDate);
        });
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'priorityHigh':
        result.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
        break;
      case 'priorityLow':
        result.sort((a, b) => (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0));
        break;
      case 'titleAsc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return result;
  }

  function renderTasksView() {
    const filteredTasks = getFilteredAndSortedTasks();
    renderActiveFilterChips();

    const hasTasks = filteredTasks.length > 0;

    if (!hasTasks) {
      DOM.tasksCardsGrid.classList.add('hidden');
      DOM.tasksTableWrapper.classList.add('hidden');
      DOM.tasksEmptyState.classList.remove('hidden');

      if (state.filters.search || state.filters.status !== 'all' || state.filters.priority !== 'all') {
        DOM.emptyStateTitle.textContent = 'No matching tasks found';
        DOM.emptyStateMessage.textContent = 'Try adjusting your search criteria, changing status/priority filters, or resetting filters.';
      } else {
        DOM.emptyStateTitle.textContent = 'No tasks in this category';
        DOM.emptyStateMessage.textContent = 'Organize your productivity by scheduling a new task now.';
      }
      return;
    }

    DOM.tasksEmptyState.classList.add('hidden');

    if (state.viewMode === 'grid') {
      DOM.tasksCardsGrid.classList.remove('hidden');
      DOM.tasksTableWrapper.classList.add('hidden');
      DOM.tasksCardsGrid.innerHTML = filteredTasks.map(t => createTaskCardHTML(t)).join('');
    } else {
      DOM.tasksCardsGrid.classList.add('hidden');
      DOM.tasksTableWrapper.classList.remove('hidden');
      DOM.tasksTableBody.innerHTML = filteredTasks.map(t => createTaskTableRowHTML(t)).join('');
    }
  }

  function renderActiveFilterChips() {
    const chips = [];

    if (state.filters.search) {
      chips.push({
        type: 'search',
        label: `Search: "${escapeHTML(state.filters.search)}"`
      });
    }

    if (state.filters.status && state.filters.status !== 'all') {
      const statusLabels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
      chips.push({
        type: 'status',
        label: `Status: ${statusLabels[state.filters.status] || state.filters.status}`
      });
    }

    if (state.filters.priority && state.filters.priority !== 'all') {
      chips.push({
        type: 'priority',
        label: `Priority: ${state.filters.priority.toUpperCase()}`
      });
    }

    if (chips.length > 0) {
      DOM.activeFiltersBar.classList.remove('hidden');
      DOM.activeFilterChips.innerHTML = chips.map(c => `
        <span class="filter-chip">
          <span>${c.label}</span>
          <button class="chip-remove-btn" data-filter-type="${c.type}" aria-label="Remove filter">✕</button>
        </span>
      `).join('');
    } else {
      DOM.activeFiltersBar.classList.add('hidden');
      DOM.activeFilterChips.innerHTML = '';
    }
  }

  // Task HTML Builders
  function createTaskCardHTML(task) {
    const isCompleted = task.status === 'completed';
    const dueClass = getDueStatusClass(task.dueDate, task.status);
    const dueLabel = formatFriendlyDate(task.dueDate);

    let statusBadgeClass = 'badge-pending';
    let statusLabel = 'Pending';
    if (task.status === 'in_progress') {
      statusBadgeClass = 'badge-inprogress';
      statusLabel = 'In Progress';
    } else if (task.status === 'completed') {
      statusBadgeClass = 'badge-completed';
      statusLabel = 'Completed';
    }

    return `
      <article class="task-card ${isCompleted ? 'is-completed' : ''}" data-task-id="${task.id}">
        <div class="task-card-top">
          <div class="task-card-badges">
            <span class="badge ${statusBadgeClass}">${statusLabel}</span>
            <span class="badge badge-priority-${task.priority}">${task.priority}</span>
            ${task.category ? `<span class="badge badge-category">${escapeHTML(task.category)}</span>` : ''}
          </div>
          <div class="task-card-actions">
            <button class="card-action-btn edit-task-btn" data-task-id="${task.id}" title="Edit Task" aria-label="Edit Task">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button class="card-action-btn delete-btn delete-task-btn" data-task-id="${task.id}" title="Delete Task" aria-label="Delete Task">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="task-card-main">
          <div class="task-checkbox-wrap">
            <button class="task-checkbox ${isCompleted ? 'checked' : ''}" 
                    data-task-id="${task.id}" 
                    aria-label="Toggle task completed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>
          <div class="task-content-text">
            <h3 class="task-card-title">${escapeHTML(task.title)}</h3>
            ${task.description ? `<p class="task-card-desc">${escapeHTML(task.description)}</p>` : ''}
          </div>
        </div>

        <div class="task-card-footer">
          <span class="due-indicator ${dueClass}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${dueLabel}</span>
          </span>
          <span class="created-date" title="Created on ${task.createdAt}">Added ${formatShortDate(task.createdAt)}</span>
        </div>
      </article>
    `;
  }

  function createTaskTableRowHTML(task) {
    const isCompleted = task.status === 'completed';
    const dueClass = getDueStatusClass(task.dueDate, task.status);
    const dueLabel = formatFriendlyDate(task.dueDate);

    let statusBadgeClass = 'badge-pending';
    let statusLabel = 'Pending';
    if (task.status === 'in_progress') {
      statusBadgeClass = 'badge-inprogress';
      statusLabel = 'In Progress';
    } else if (task.status === 'completed') {
      statusBadgeClass = 'badge-completed';
      statusLabel = 'Completed';
    }

    return `
      <tr data-task-id="${task.id}">
        <td>
          <button class="task-checkbox ${isCompleted ? 'checked' : ''}" 
                  data-task-id="${task.id}" 
                  aria-label="Toggle task complete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
        </td>
        <td>
          <div class="table-task-info">
            <span class="table-task-title ${isCompleted ? 'text-decoration: line-through' : ''}">${escapeHTML(task.title)}</span>
            ${task.description ? `<span class="table-task-desc">${escapeHTML(task.description)}</span>` : ''}
          </div>
        </td>
        <td>
          <span class="badge badge-priority-${task.priority}">${task.priority}</span>
        </td>
        <td>
          <span class="due-indicator ${dueClass}">${dueLabel}</span>
        </td>
        <td>
          <span class="text-muted" style="font-size: 0.8rem;">${formatShortDate(task.createdAt)}</span>
        </td>
        <td>
          <div class="table-actions-cell">
            <button class="card-action-btn edit-task-btn" data-task-id="${task.id}" title="Edit Task" aria-label="Edit Task">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button class="card-action-btn delete-btn delete-task-btn" data-task-id="${task.id}" title="Delete Task" aria-label="Delete Task">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function updateAllViews() {
    renderSidebarBadges();
    if (state.currentView === 'dashboard') {
      renderDashboard();
    } else if (state.currentView === 'settings') {
      // settings doesn't need task list re-render
    } else {
      renderTasksView();
    }
  }

  // ==========================================================================
  // EVENT DELEGATION FOR TASK ACTIONS (Check, Edit, Delete)
  // ==========================================================================
  document.addEventListener('click', (e) => {
    // 1. Checkbox complete toggle
    const checkboxBtn = e.target.closest('.task-checkbox');
    if (checkboxBtn) {
      const taskId = checkboxBtn.getAttribute('data-task-id');
      if (taskId) {
        toggleTaskComplete(taskId);
      }
      return;
    }

    // 2. Edit task button
    const editBtn = e.target.closest('.edit-task-btn');
    if (editBtn) {
      const taskId = editBtn.getAttribute('data-task-id');
      if (taskId) {
        openEditTaskModal(taskId);
      }
      return;
    }

    // 3. Delete task button
    const deleteBtn = e.target.closest('.delete-task-btn');
    if (deleteBtn) {
      const taskId = deleteBtn.getAttribute('data-task-id');
      if (taskId) {
        deleteTask(taskId);
      }
      return;
    }

    // 4. Filter chip remove
    const chipRemove = e.target.closest('.chip-remove-btn');
    if (chipRemove) {
      const filterType = chipRemove.getAttribute('data-filter-type');
      if (filterType === 'search') {
        state.filters.search = '';
        DOM.globalSearchInput.value = '';
        DOM.viewSearchInput.value = '';
        DOM.clearSearchBtn.classList.add('hidden');
      } else if (filterType === 'status') {
        state.filters.status = 'all';
        DOM.filterStatusSelect.value = 'all';
      } else if (filterType === 'priority') {
        state.filters.priority = 'all';
        DOM.filterPrioritySelect.value = 'all';
      }
      renderTasksView();
      return;
    }

    // 5. Open Task Modal buttons
    if (e.target.closest('.open-task-modal-btn')) {
      openCreateTaskModal();
    }
  });

  // ==========================================================================
  // SEARCH, FILTER, AND SORT CONTROLS
  // ==========================================================================
  function handleSearchInput(value) {
    state.filters.search = value;
    DOM.globalSearchInput.value = value;
    DOM.viewSearchInput.value = value;

    if (value) {
      DOM.clearSearchBtn.classList.remove('hidden');
    } else {
      DOM.clearSearchBtn.classList.add('hidden');
    }

    // If searching while on Dashboard, switch to all-tasks view for instant results
    if (value && state.currentView === 'dashboard') {
      window.location.hash = '#all-tasks';
    } else {
      renderTasksView();
    }
  }

  DOM.globalSearchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
  DOM.viewSearchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));

  DOM.clearSearchBtn.addEventListener('click', () => {
    handleSearchInput('');
    DOM.globalSearchInput.focus();
  });

  DOM.filterStatusSelect.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    renderTasksView();
  });

  DOM.filterPrioritySelect.addEventListener('change', (e) => {
    state.filters.priority = e.target.value;
    renderTasksView();
  });

  DOM.filterSortSelect.addEventListener('change', (e) => {
    state.filters.sortBy = e.target.value;
    renderTasksView();
  });

  DOM.clearFiltersBtn.addEventListener('click', () => {
    state.filters.search = '';
    state.filters.status = 'all';
    state.filters.priority = 'all';
    DOM.globalSearchInput.value = '';
    DOM.viewSearchInput.value = '';
    DOM.filterStatusSelect.value = 'all';
    DOM.filterPrioritySelect.value = 'all';
    DOM.clearSearchBtn.classList.add('hidden');
    renderTasksView();
    showToast('Filters cleared', 'info');
  });

  // View Mode Switcher (Grid vs Table)
  DOM.viewModeGridBtn.addEventListener('click', () => {
    state.viewMode = 'grid';
    DOM.viewModeGridBtn.classList.add('active');
    DOM.viewModeTableBtn.classList.remove('active');
    Storage.saveViewMode('grid');
    renderTasksView();
  });

  DOM.viewModeTableBtn.addEventListener('click', () => {
    state.viewMode = 'table';
    DOM.viewModeTableBtn.classList.add('active');
    DOM.viewModeGridBtn.classList.remove('active');
    Storage.saveViewMode('table');
    renderTasksView();
  });

  // ==========================================================================
  // TASK MODAL MANAGEMENT (CREATE & EDIT)
  // ==========================================================================
  function openCreateTaskModal() {
    state.editingTaskId = null;
    DOM.taskModalTitle.textContent = 'Create New Task';
    DOM.submitBtnText.textContent = 'Create Task';
    DOM.taskForm.reset();
    DOM.taskIdHidden.value = '';
    DOM.taskDateInput.value = getRelativeDateString(1); // default to tomorrow
    DOM.titleErrorMsg.classList.remove('visible');
    DOM.taskTitleInput.classList.remove('has-error');

    DOM.taskModal.classList.remove('hidden');
    setTimeout(() => DOM.taskTitleInput.focus(), 60);
  }

  function openEditTaskModal(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    state.editingTaskId = id;
    DOM.taskModalTitle.textContent = 'Edit Task Details';
    DOM.submitBtnText.textContent = 'Save Changes';
    DOM.taskIdHidden.value = task.id;
    DOM.taskTitleInput.value = task.title;
    DOM.taskDescInput.value = task.description || '';
    DOM.taskPriorityInput.value = task.priority || 'medium';
    DOM.taskStatusInput.value = task.status || 'pending';
    DOM.taskDateInput.value = task.dueDate || '';
    DOM.taskCategoryInput.value = task.category || 'Work';
    DOM.titleErrorMsg.classList.remove('visible');

    DOM.taskModal.classList.remove('hidden');
    setTimeout(() => DOM.taskTitleInput.focus(), 60);
  }

  function closeTaskModal() {
    DOM.taskModal.classList.add('hidden');
    state.editingTaskId = null;
  }

  DOM.taskModalCloseBtn.addEventListener('click', closeTaskModal);
  DOM.taskModalCancelBtn.addEventListener('click', closeTaskModal);

  // Close modals on backdrop click
  DOM.taskModal.addEventListener('click', (e) => {
    if (e.target === DOM.taskModal) closeTaskModal();
  });

  DOM.confirmModal.addEventListener('click', (e) => {
    if (e.target === DOM.confirmModal) closeConfirmModal();
  });

  // Quick date helper pills
  DOM.quickDateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const days = parseInt(btn.getAttribute('data-days'), 10);
      DOM.taskDateInput.value = getRelativeDateString(days);
    });
  });

  // Task form submission
  DOM.taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = DOM.taskTitleInput.value.trim();
    if (!title) {
      DOM.titleErrorMsg.classList.add('visible');
      DOM.taskTitleInput.focus();
      return;
    }

    DOM.titleErrorMsg.classList.remove('visible');

    const taskData = {
      title: title,
      description: DOM.taskDescInput.value.trim(),
      priority: DOM.taskPriorityInput.value,
      status: DOM.taskStatusInput.value,
      dueDate: DOM.taskDateInput.value,
      category: DOM.taskCategoryInput.value
    };

    if (state.editingTaskId) {
      updateTask(state.editingTaskId, taskData);
    } else {
      createTask(taskData);
    }

    closeTaskModal();
  });

  // Header and Sidebar Add Task buttons
  DOM.headerAddTaskBtn.addEventListener('click', openCreateTaskModal);
  DOM.sidebarAddTaskBtn.addEventListener('click', openCreateTaskModal);

  // Keyboard Navigation: Escape closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!DOM.taskModal.classList.contains('hidden')) {
        closeTaskModal();
      } else if (!DOM.confirmModal.classList.contains('hidden')) {
        closeConfirmModal();
      } else if (DOM.sidebar.classList.contains('open')) {
        closeMobileSidebar();
      }
    }
  });

  // ==========================================================================
  // DATA MANAGEMENT (BACKUP, RESTORE, CLEAR)
  // ==========================================================================
  // 1. Reset to sample demo tasks
  DOM.btnResetSample.addEventListener('click', () => {
    openConfirmModal({
      title: 'Restore Sample Tasks',
      message: 'This will replace your current task list with the initial realistic demo tasks. Proceed?',
      confirmText: 'Restore Demo',
      isDanger: false,
      onConfirm: () => {
        state.tasks = JSON.parse(JSON.stringify(SAMPLE_TASKS));
        Storage.saveTasks(state.tasks);
        updateAllViews();
        showToast('Sample demo tasks restored!', 'success');
      }
    });
  });

  // 2. Clear all tasks
  DOM.btnClearAll.addEventListener('click', () => {
    openConfirmModal({
      title: 'Wipe All Tasks',
      message: 'Are you sure you want to permanently clear ALL tasks from localStorage? This cannot be undone.',
      confirmText: 'Clear All Data',
      isDanger: true,
      onConfirm: () => {
        state.tasks = [];
        Storage.saveTasks([]);
        updateAllViews();
        showToast('All tasks have been wiped from localStorage.', 'warning');
      }
    });
  });

  // 3. Export tasks to JSON file
  DOM.btnExportJson.addEventListener('click', () => {
    try {
      const dataStr = JSON.stringify(state.tasks, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `taskflow_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Task backup exported successfully as JSON!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export tasks backup.', 'error');
    }
  });

  // 4. Import tasks from JSON file
  DOM.btnImportJson.addEventListener('click', () => {
    DOM.importJsonInput.click();
  });

  DOM.importJsonInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) {
          throw new Error('Invalid JSON format: expected an array of tasks.');
        }

        // Validate basic task structure
        const validTasks = imported.filter(t => t && typeof t.title === 'string' && t.title.trim().length > 0);
        
        if (validTasks.length === 0) {
          showToast('No valid tasks found in the uploaded file.', 'error');
          return;
        }

        openConfirmModal({
          title: 'Import Tasks',
          message: `Found ${validTasks.length} valid tasks. Do you want to replace existing tasks or append them?`,
          confirmText: 'Append Tasks',
          isDanger: false,
          onConfirm: () => {
            // Append tasks with fresh IDs to prevent collisions
            const sanitized = validTasks.map(t => ({
              ...t,
              id: generateId()
            }));
            state.tasks = [...sanitized, ...state.tasks];
            Storage.saveTasks(state.tasks);
            updateAllViews();
            showToast(`Imported ${sanitized.length} tasks successfully!`, 'success');
          }
        });
      } catch (err) {
        console.error('Import parse error:', err);
        showToast('Invalid JSON file format.', 'error');
      } finally {
        DOM.importJsonInput.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  });

  // ==========================================================================
  // INITIALIZATION ON PAGE LOAD
  // ==========================================================================
  function init() {
    // 1. Initialize Theme
    const savedTheme = Storage.loadTheme();
    applyTheme(savedTheme);

    // 2. Initialize User Profile
    state.userName = Storage.loadUser();
    updateProfileUI();

    // 3. Initialize View Mode
    state.viewMode = Storage.loadViewMode();
    if (state.viewMode === 'table') {
      DOM.viewModeTableBtn.classList.add('active');
      DOM.viewModeGridBtn.classList.remove('active');
    } else {
      DOM.viewModeGridBtn.classList.add('active');
      DOM.viewModeTableBtn.classList.remove('active');
    }

    // 4. Load Tasks from LocalStorage
    state.tasks = Storage.loadTasks();

    // 5. Initial Render
    renderSidebarBadges();
    handleHashChange();

    console.log('%cTaskFlow SaaS Task Manager loaded successfully! (Syntecxhub Internship Task 3 Project 1)', 'color: #6366f1; font-weight: bold; font-size: 14px;');
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

