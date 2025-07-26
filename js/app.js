// SW registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  });
}

// --- Data Layer & Categories -------------------------------------------
const STORAGE_KEY = 'guideLifeOptimizer';

// The 9 core categories as defined in the spec with enhanced metadata
const CATEGORIES = [
  { id: 'mind-growth', name: 'Mind & Growth', emoji: '🧠', shortName: 'Mind' },
  { id: 'health-wellness', name: 'Health & Wellness', emoji: '💚', shortName: 'Health' },
  { id: 'work-gig', name: 'Work & Side-Gig', emoji: '💼', shortName: 'Work' },
  { id: 'finances-bills', name: 'Finances & Bills', emoji: '💰', shortName: 'Money' },
  { id: 'relationships', name: 'Relationships', emoji: '❤️', shortName: 'People' },
  { id: 'creativity-hobbies', name: 'Creativity & Hobbies', emoji: '🎨', shortName: 'Create' },
  { id: 'home-errands', name: 'Home & Errands', emoji: '🏠', shortName: 'Home' },
  { id: 'emotions-reflection', name: 'Emotions & Reflection', emoji: '🌙', shortName: 'Reflect' },
  { id: 'miscellaneous', name: 'Miscellaneous', emoji: '📝', shortName: 'Other' }
];

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  
  // First-time sample data
  return {
    captures: [], // All captured thoughts/tasks/ideas
    habits: [
      { id: 1, text: 'Meditate', categories: ['health-wellness'], completed: false },
      { id: 2, text: 'Review goals', categories: ['mind-growth'], completed: false }
    ],
    goals: [], // North Stars
    morningRituals: [], // Daily morning check-ins
    eveningRituals: [], // Daily evening reflections
    currentView: 'ground',
    currentFilter: 'all',
    lastMorningRitual: null // Track if morning ritual done today
  };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let guideData = loadData();

// --- UI Management & Views -------------------------------------------
const appEl = document.getElementById('app');
const captureModal = document.getElementById('capture-modal');
const morningModal = document.getElementById('morning-modal');
const goalModal = document.getElementById('goal-modal');
const eveningModal = document.getElementById('evening-modal');

// Helper to get today's date string
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Helper to format relative time
function getRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// Check if morning ritual needed
function needsMorningRitual() {
  const today = getTodayString();
  return !guideData.lastMorningRitual || guideData.lastMorningRitual !== today;
}

// Enhanced category pills with animations and accessibility
function generateCategoryPills(containerSelector, selectedCategories = []) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  // Add fade-in animation to container
  container.style.opacity = '0';
  container.style.transform = 'translateY(20px)';
  
  container.innerHTML = CATEGORIES.map(cat => `
    <div class="category-pill" 
         data-category="${cat.id}"
         role="button"
         tabindex="0"
         aria-pressed="${selectedCategories.includes(cat.id)}"
         aria-label="Select ${cat.name} category"
         ${selectedCategories.includes(cat.id) ? 'data-selected="true"' : ''}>
      <span aria-hidden="true">${cat.emoji}</span>
      <span>${cat.shortName}</span>
    </div>
  `).join('');
  
  // Animate container in
  requestAnimationFrame(() => {
    container.style.transition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';
  });
  
  // Add enhanced click handlers with animations
  container.querySelectorAll('.category-pill').forEach((pill, index) => {
    // Apply selected state if needed
    if (selectedCategories.includes(pill.dataset.category)) {
      pill.classList.add('selected');
    }
    
    // Stagger animation for pills
    pill.style.animationDelay = `${index * 50}ms`;
    pill.style.animation = 'chipFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    
    // Enhanced click handler
    const handleSelect = () => {
      const wasSelected = pill.classList.contains('selected');
      pill.classList.toggle('selected');
      pill.setAttribute('aria-pressed', !wasSelected);
      
      // Trigger pulse animation
      pill.style.animation = 'chipPulse 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      
      // Reset animation after completion
      setTimeout(() => {
        pill.style.animation = '';
      }, 200);
      
      // Haptic feedback on supported devices
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    };
    
    pill.addEventListener('click', handleSelect);
    pill.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect();
      }
    });
  });
}

// Add CSS animation for chips
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes chipFadeIn {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;
document.head.appendChild(styleSheet);

// Get selected categories from pills
function getSelectedCategories(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return [];
  
  return Array.from(container.querySelectorAll('.category-pill.selected'))
    .map(pill => pill.dataset.category);
}

// --- View Renderers ------------------------------------------------

function renderGround() {
  setActiveNav('ground');
  
  // Check if morning ritual needed
  if (needsMorningRitual()) {
    showMorningRitual();
    return;
  }
  
  const today = getTodayString();
  const todaysCaptures = guideData.captures.filter(c => 
    c.createdAt && c.createdAt.startsWith(today)
  );
  
  const todaysHabits = guideData.habits;
  const todaysTasks = guideData.captures.filter(c => 
    c.type === 'task' && !c.completed && 
    (c.dueDate === today || !c.dueDate)
  );
  
  appEl.innerHTML = `
    <!-- Category Filter -->
    <div class="filter-pills">
      <button class="filter-pill ${guideData.currentFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      ${CATEGORIES.map(cat => `
        <button class="filter-pill ${guideData.currentFilter === cat.id ? 'active' : ''}" 
                data-filter="${cat.id}">${cat.emoji} ${cat.name}</button>
      `).join('')}
    </div>

    <!-- Morning Intention Card -->
    ${guideData.morningRituals.length > 0 ? (() => {
      const latest = guideData.morningRituals[guideData.morningRituals.length - 1];
      if (latest.date === today) {
        return `
          <div class="card gentle-echo">
            <div class="card-header">
              <div class="card-icon">🌅</div>
              <div>
                <div class="card-title">Today's Intention</div>
                <div class="card-subtitle">Mood: ${['😢', '😔', '😐', '😊', '😄'][latest.mood - 1]} ${latest.mood}/5</div>
              </div>
            </div>
            <p style="color: rgba(255, 255, 255, 0.9); font-style: italic;">"${latest.intention}"</p>
          </div>
        `;
      }
      return '';
    })() : ''}

    <!-- Habits Card -->
    <div class="card">
      <div class="card-header">
        <div class="card-icon">⚡</div>
        <div>
          <div class="card-title">Daily Habits</div>
          <div class="card-subtitle">${todaysHabits.filter(h => h.completed).length}/${todaysHabits.length} completed</div>
        </div>
      </div>
      ${todaysHabits.length > 0 ? `
        <div class="habits-list">
          ${todaysHabits.map(habit => `
            <div class="habit-item">
              <div class="task-checkbox ${habit.completed ? 'completed' : ''}" 
                   data-habit="${habit.id}"></div>
              <div class="task-text ${habit.completed ? 'completed' : ''}">${habit.text}</div>
            </div>
          `).join('')}
        </div>
      ` : '<p style="color: rgba(255, 255, 255, 0.6); text-align: center; padding: 20px;">No habits yet. Create your first habit!</p>'}
    </div>

    <!-- Today's Tasks -->
    <div class="card">
      <div class="card-header">
        <div class="card-icon">✓</div>
        <div>
          <div class="card-title">Today's Tasks</div>
          <div class="card-subtitle">${todaysTasks.length} pending</div>
        </div>
      </div>
      ${todaysTasks.length > 0 ? `
        <div class="tasks-list">
          ${todaysTasks.map(task => `
            <div class="task-item">
              <div class="task-checkbox ${task.completed ? 'completed' : ''}" 
                   data-task="${task.id}"></div>
              <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
            </div>
          `).join('')}
        </div>
      ` : '<p style="color: rgba(255, 255, 255, 0.6); text-align: center; padding: 20px;">No tasks for today. Use the + button to capture something!</p>'}
    </div>

    <!-- Recent Captures -->
    ${todaysCaptures.length > 0 ? `
      <div class="card">
        <div class="card-header">
          <div class="card-icon">📝</div>
          <div>
            <div class="card-title">Today's Captures</div>
            <div class="card-subtitle">${todaysCaptures.length} items</div>
          </div>
        </div>
        <div class="captures-list">
          ${todaysCaptures.slice(0, 5).map(capture => `
            <div class="timeline-item">
              <div class="timeline-date">${new Date(capture.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              <div class="timeline-content">${capture.text}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;
  
  // Add event listeners
  addFilterListeners();
  addTaskHabitListeners();
}

function renderHorizon() {
  setActiveNav('horizon');
  
  const weeklyGoals = guideData.goals.filter(g => g.horizon === 'weekly');
  const monthlyGoals = guideData.goals.filter(g => g.horizon === 'monthly');
  const yearlyGoals = guideData.goals.filter(g => g.horizon === 'yearly');
  
  appEl.innerHTML = `
    <!-- Add Goal Button -->
    <div style="text-align: center; margin-bottom: 20px;">
      <button class="btn btn-primary" id="add-goal-btn">
        ✨ New North Star
      </button>
    </div>

    <!-- Yearly Goals -->
    ${yearlyGoals.length > 0 ? `
      <div class="card">
        <div class="card-header">
          <div class="card-icon">🎯</div>
          <div>
            <div class="card-title">Yearly North Stars</div>
            <div class="card-subtitle">${yearlyGoals.length} goals</div>
          </div>
        </div>
        ${yearlyGoals.map(goal => `
          <div class="goal-item" style="padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 4px;">${goal.title}</div>
            ${goal.why ? `<div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 8px; font-style: italic;">"${goal.why}"</div>` : ''}
            <div style="font-size: 12px; color: rgba(255,255,255,0.6);">
              ${goal.categories.map(catId => {
                const cat = CATEGORIES.find(c => c.id === catId);
                return cat ? `${cat.emoji} ${cat.name}` : '';
              }).join(' • ')}
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Monthly Goals -->
    ${monthlyGoals.length > 0 ? `
      <div class="card">
        <div class="card-header">
          <div class="card-icon">📅</div>
          <div>
            <div class="card-title">Monthly Focus</div>
            <div class="card-subtitle">${monthlyGoals.length} goals</div>
          </div>
        </div>
        ${monthlyGoals.map(goal => `
          <div class="goal-item" style="padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 4px;">${goal.title}</div>
            ${goal.why ? `<div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 8px; font-style: italic;">"${goal.why}"</div>` : ''}
            <div style="font-size: 12px; color: rgba(255,255,255,0.6);">
              ${goal.categories.map(catId => {
                const cat = CATEGORIES.find(c => c.id === catId);
                return cat ? `${cat.emoji} ${cat.name}` : '';
              }).join(' • ')}
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Weekly Goals -->
    ${weeklyGoals.length > 0 ? `
      <div class="card">
        <div class="card-header">
          <div class="card-icon">📋</div>
          <div>
            <div class="card-title">This Week</div>
            <div class="card-subtitle">${weeklyGoals.length} goals</div>
          </div>
        </div>
        ${weeklyGoals.map(goal => `
          <div class="goal-item" style="padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 4px;">${goal.title}</div>
            ${goal.why ? `<div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 8px; font-style: italic;">"${goal.why}"</div>` : ''}
            <div style="font-size: 12px; color: rgba(255,255,255,0.6);">
              ${goal.categories.map(catId => {
                const cat = CATEGORIES.find(c => c.id === catId);
                return cat ? `${cat.emoji} ${cat.name}` : '';
              }).join(' • ')}
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${guideData.goals.length === 0 ? `
      <div class="card">
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🌟</div>
          <h3 style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px;">No North Stars Yet</h3>
          <p style="color: rgba(255, 255, 255, 0.6);">Create your first goal to light the way forward</p>
        </div>
      </div>
    ` : ''}
  `;
  
  // Add goal button listener
  const addGoalBtn = document.getElementById('add-goal-btn');
  if (addGoalBtn) {
    addGoalBtn.addEventListener('click', showGoalModal);
  }
}

function renderArchive() {
  setActiveNav('archive');
  
  // Get a random gentle echo
  const gentleEcho = getGentleEcho();
  
  // Get all captures in reverse chronological order
  const allEntries = [
    ...guideData.captures,
    ...guideData.morningRituals.map(r => ({...r, type: 'morning', text: `Morning intention: ${r.intention}`})),
    ...guideData.eveningRituals.map(r => ({...r, type: 'evening', text: `Grateful for: ${r.grateful}`}))
  ].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  
  appEl.innerHTML = `
    <!-- Gentle Echo -->
    ${gentleEcho ? `
      <div class="card gentle-echo">
        <div class="echo-label">Gentle Echo</div>
        <div class="card-header">
          <div class="card-icon">💭</div>
          <div>
            <div class="card-title">${getRelativeTime(gentleEcho.createdAt || gentleEcho.date)}</div>
            <div class="card-subtitle">A moment from your journey</div>
          </div>
        </div>
        <p style="color: rgba(255, 255, 255, 0.9); font-style: italic;">"${gentleEcho.text}"</p>
      </div>
    ` : ''}

    <!-- Archive Timeline -->
    <div class="card">
      <div class="card-header">
        <div class="card-icon">🗄️</div>
        <div>
          <div class="card-title">Your Journey</div>
          <div class="card-subtitle">${allEntries.length} entries</div>
        </div>
      </div>
      ${allEntries.length > 0 ? `
        <div class="timeline">
          ${allEntries.map(entry => `
            <div class="timeline-item">
              <div class="timeline-date">${getRelativeTime(entry.createdAt || entry.date)}</div>
              <div class="timeline-content">
                ${entry.type === 'morning' ? '🌅 ' : entry.type === 'evening' ? '🌙 ' : ''}
                ${entry.text}
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
          <h3 style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px;">Your Journey Begins</h3>
          <p style="color: rgba(255, 255, 255, 0.6);">Start capturing thoughts and moments to build your archive</p>
        </div>
      `}
    </div>
  `;
}

function renderStats() {
  setActiveNav('stats');
  
  // Calculate stats
  const totalCaptures = guideData.captures.length;
  const totalGoals = guideData.goals.length;
  const completedHabits = guideData.habits.filter(h => h.completed).length;
  const totalHabits = guideData.habits.length;
  
  // Get last 7 days completion data
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayCaptures = guideData.captures.filter(c => 
      c.createdAt && c.createdAt.startsWith(dateStr)
    ).length;
    
    last7Days.push({
      date: dateStr,
      label: date.toLocaleDateString([], { weekday: 'short' }),
      captures: dayCaptures
    });
  }
  
  appEl.innerHTML = `
    <!-- Overview Stats -->
    <div class="card">
      <div class="card-header">
        <div class="card-icon">📊</div>
        <div>
          <div class="card-title">Life Overview</div>
          <div class="card-subtitle">Your progress at a glance</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 16px;">
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: rgba(102, 126, 234, 0.9);">${totalCaptures}</div>
          <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">Total Captures</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: rgba(102, 126, 234, 0.9);">${totalGoals}</div>
          <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">North Stars</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: rgba(102, 126, 234, 0.9);">${completedHabits}/${totalHabits}</div>
          <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">Habits Today</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: rgba(102, 126, 234, 0.9);">${Math.round((totalCaptures / Math.max(1, (Date.now() - new Date('2024-01-01')) / (1000 * 60 * 60 * 24))) * 10) / 10}</div>
          <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">Daily Average</div>
        </div>
      </div>
    </div>

    <!-- 7-Day Activity -->
    <div class="card">
      <div class="card-header">
        <div class="card-icon">📈</div>
        <div>
          <div class="card-title">7-Day Activity</div>
          <div class="card-subtitle">Captures per day</div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: end; height: 120px; margin-top: 20px;">
        ${last7Days.map(day => `
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <div style="background: rgba(102, 126, 234, 0.6); width: 20px; height: ${Math.max(4, day.captures * 20)}px; border-radius: 2px; margin-bottom: 8px;"></div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7);">${day.label}</div>
            <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5);">${day.captures}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Category Breakdown -->
    <div class="card">
      <div class="card-header">
        <div class="card-icon">📋</div>
        <div>
          <div class="card-title">Category Focus</div>
          <div class="card-subtitle">Where you spend your energy</div>
        </div>
      </div>
      ${CATEGORIES.map(cat => {
        const count = guideData.captures.filter(c => c.categories && c.categories.includes(cat.id)).length;
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; align-items: center;">
              <span style="margin-right: 8px;">${cat.emoji}</span>
              <span style="color: rgba(255,255,255,0.9);">${cat.name}</span>
            </div>
            <span style="color: rgba(102, 126, 234, 0.9); font-weight: 600;">${count}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderEvening() {
  setActiveNav('evening');
  
  const today = getTodayString();
  const todaysEvening = guideData.eveningRituals.find(r => r.date === today);
  
  if (todaysEvening) {
    // Show today's completed evening ritual
    appEl.innerHTML = `
      <div class="card gentle-echo">
        <div class="card-header">
          <div class="card-icon">🌙</div>
          <div>
            <div class="card-title">Today's Reflection Complete</div>
            <div class="card-subtitle">Sleep well, tomorrow is a new day</div>
          </div>
        </div>
        <div style="margin-top: 16px;">
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 8px;">Grateful for:</div>
            <div style="color: rgba(255,255,255,0.8); font-style: italic;">"${todaysEvening.grateful}"</div>
          </div>
          <div>
            <div style="font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 8px;">Ready to let go of:</div>
            <div style="color: rgba(255,255,255,0.8); font-style: italic;">"${todaysEvening.letgo}"</div>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <button class="btn btn-secondary" onclick="showEveningRitual()">Reflect Again</button>
      </div>
    `;
  } else {
    // Show evening ritual prompt
    appEl.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-icon">🌙</div>
          <div>
            <div class="card-title">Evening Reflection</div>
            <div class="card-subtitle">End your day with gratitude and release</div>
          </div>
        </div>
        <div style="text-align: center; padding: 20px;">
          <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 20px; line-height: 1.5;">
            Take a moment to reflect on your day. What brought you joy? What can you release to find peace?
          </p>
          <button class="btn btn-primary" onclick="showEveningRitual()">
            Begin Evening Reflection
          </button>
        </div>
      </div>
      
      <!-- Recent Evening Reflections -->
      ${guideData.eveningRituals.length > 0 ? `
        <div class="card">
          <div class="card-header">
            <div class="card-icon">📚</div>
            <div>
              <div class="card-title">Past Reflections</div>
              <div class="card-subtitle">Your journey of gratitude</div>
            </div>
          </div>
          ${guideData.eveningRituals.slice(-5).reverse().map(ritual => `
            <div class="timeline-item">
              <div class="timeline-date">${getRelativeTime(ritual.date)}</div>
              <div class="timeline-content">
                <div style="margin-bottom: 8px;"><strong>Grateful:</strong> ${ritual.grateful}</div>
                <div><strong>Released:</strong> ${ritual.letgo}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }
}

// --- Helper Functions ----------------------------------------------

function getGentleEcho() {
  const allEntries = [
    ...guideData.captures,
    ...guideData.morningRituals.map(r => ({...r, text: r.intention})),
    ...guideData.eveningRituals.map(r => ({...r, text: r.grateful}))
  ].filter(e => e.createdAt || e.date);
  
  if (allEntries.length === 0) return null;
  
  return allEntries[Math.floor(Math.random() * allEntries.length)];
}

function setActiveNav(viewName) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeItem = document.querySelector(`[data-view="${viewName}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
  
  guideData.currentView = viewName;
  saveData(guideData);
}

function addFilterListeners() {
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      guideData.currentFilter = pill.dataset.filter;
      saveData(guideData);
      // Re-render current view with filter
      views[guideData.currentView]();
    });
  });
}

function addTaskHabitListeners() {
  // Habit checkboxes
  document.querySelectorAll('[data-habit]').forEach(checkbox => {
    checkbox.addEventListener('click', () => {
      const habitId = parseInt(checkbox.dataset.habit);
      const habit = guideData.habits.find(h => h.id === habitId);
      if (habit) {
        habit.completed = !habit.completed;
        saveData(guideData);
        renderGround();
      }
    });
  });
  
  // Task checkboxes
  document.querySelectorAll('[data-task]').forEach(checkbox => {
    checkbox.addEventListener('click', () => {
      const taskId = parseInt(checkbox.dataset.task);
      const task = guideData.captures.find(c => c.id === taskId);
      if (task) {
        task.completed = !task.completed;
        saveData(guideData);
        renderGround();
      }
    });
  });
}

// --- Modal Functions -----------------------------------------------

function showCaptureModal() {
  generateCategoryPills('#capture-categories');
  captureModal.classList.add('show');
}

function showMorningRitual() {
  generateCategoryPills('#morning-categories');
  morningModal.classList.add('show');
}

function showGoalModal() {
  generateCategoryPills('#goal-categories');
  goalModal.classList.add('show');
}

function showEveningRitual() {
  eveningModal.classList.add('show');
}

function hideAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('show');
  });
  
  // Clear form fields
  document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(field => {
    field.value = '';
  });
  
  // Clear category selections
  document.querySelectorAll('.category-pill').forEach(pill => {
    pill.classList.remove('selected');
    pill.setAttribute('aria-pressed', 'false');
  });
}

// Enhanced Start Day button with loading state
function handleStartDay() {
  const btn = document.getElementById('morning-save');
  const mood = parseInt(document.getElementById('morning-mood').value);
  const intention = document.getElementById('morning-intention').value.trim();
  
  if (!intention) {
    // Focus on the intention field with a gentle shake
    const intentionField = document.getElementById('morning-intention');
    intentionField.focus();
    intentionField.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
      intentionField.style.animation = '';
    }, 500);
    return;
  }
  
  // Show loading state
  btn.classList.add('loading');
  btn.textContent = '';
  
  // Simulate processing time for better UX
  setTimeout(() => {
    const categories = getSelectedCategories('#morning-categories');
    const morningRitual = {
      date: getTodayString(),
      mood: mood,
      intention: intention,
      categories: categories,
      createdAt: new Date().toISOString()
    };
    
    guideData.morningRituals.push(morningRitual);
    guideData.lastMorningRitual = getTodayString();
    saveData(guideData);
    
    // Show success state
    btn.classList.remove('loading');
    btn.classList.add('success');
    btn.textContent = '';
    
    // Close modal after success animation
    setTimeout(() => {
      hideAllModals();
      btn.classList.remove('success');
      btn.textContent = 'Start My Day';
      renderGround();
    }, 1500);
  }, 1000);
}

// Add shake animation
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;
document.head.appendChild(shakeStyle);

// --- Views Object ------------------------------------------------
const views = {
  ground: renderGround,
  horizon: renderHorizon,
  archive: renderArchive,
  stats: renderStats,
  evening: renderEvening
};

// --- Event Listeners ---------------------------------------------

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const view = item.dataset.view;
    views[view]();
  });
});

// FAB - opens capture modal
document.getElementById('fab').addEventListener('click', showCaptureModal);

// Capture Modal Events
document.getElementById('capture-cancel').addEventListener('click', hideAllModals);
document.getElementById('capture-save').addEventListener('click', () => {
  const text = document.getElementById('capture-text').value.trim();
  if (!text) return;
  
  const categories = getSelectedCategories('#capture-categories');
  const newCapture = {
    id: Date.now(),
    text: text,
    categories: categories,
    type: 'capture',
    createdAt: new Date().toISOString(),
    completed: false
  };
  
  guideData.captures.unshift(newCapture);
  saveData(guideData);
  hideAllModals();
  
  // Refresh current view
  views[guideData.currentView]();
});

// Enhanced Morning Ritual Events
document.getElementById('morning-save').addEventListener('click', handleStartDay);

// Goal Modal Events
document.getElementById('goal-cancel').addEventListener('click', hideAllModals);
document.getElementById('goal-save').addEventListener('click', () => {
  const title = document.getElementById('goal-title').value.trim();
  const why = document.getElementById('goal-why').value.trim();
  const horizon = document.getElementById('goal-horizon').value;
  
  if (!title) return;
  
  const categories = getSelectedCategories('#goal-categories');
  const newGoal = {
    id: Date.now(),
    title: title,
    why: why,
    horizon: horizon,
    categories: categories,
    createdAt: new Date().toISOString()
  };
  
  guideData.goals.push(newGoal);
  saveData(guideData);
  hideAllModals();
  
  renderHorizon();
});

// Evening Ritual Events
document.getElementById('evening-cancel').addEventListener('click', hideAllModals);
document.getElementById('evening-save').addEventListener('click', () => {
  const grateful = document.getElementById('evening-grateful').value.trim();
  const letgo = document.getElementById('evening-letgo').value.trim();
  
  if (!grateful || !letgo) return;
  
  const eveningRitual = {
    date: getTodayString(),
    grateful: grateful,
    letgo: letgo,
    createdAt: new Date().toISOString()
  };
  
  guideData.eveningRituals.push(eveningRitual);
  saveData(guideData);
  hideAllModals();
  
  renderEvening();
});

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideAllModals();
    }
  });
});

// Make functions global for onclick handlers
window.showEveningRitual = showEveningRitual;

// --- Initialize App ----------------------------------------------

// Load the last viewed screen or default to Ground
const initialView = guideData.currentView || 'ground';
views[initialView]();
