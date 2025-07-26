// SW registration — insert at the top of js/app.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')    // ← relative path
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  });
}

// Theme Management
const savedTheme = localStorage.getItem('theme') || 'cosmic';
document.body.classList.add(`theme-${savedTheme}`);

function initThemeSelector() {
  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.checked = radio.value === savedTheme;
    radio.addEventListener('change', e => {
      // Remove old theme
      const allThemes = ['cosmic', 'glass'];
      allThemes.forEach(theme => document.body.classList.remove(`theme-${theme}`));
      // Add new theme
      const newTheme = e.target.value;
      document.body.classList.add(`theme-${newTheme}`);
      localStorage.setItem('theme', newTheme);
    });
  });
}

// Navigation Management
function setActiveNav(viewName) {
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.classList.remove('active');
    const textSpan = btn.querySelector('.nav-text');
    if (textSpan) textSpan.classList.remove('active');
  });
  
  const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    const textSpan = activeBtn.querySelector('.nav-text');
    if (textSpan) textSpan.classList.add('active');
  }
}

// --- Data Layer ---------------------------------------------------
const STORAGE_KEY = 'plannerData';

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // First‑time defaults
    return {
        inbox: [],
        tasks: [],
        habits: [
            { id: 1, text: 'Wash hair', tags: [], lastDoneDate: null },
            { id: 2, text: 'Do skin care', tags: [], lastDoneDate: null }
        ],
        goals: [
            // { id, text, horizon: 'weekly'|'monthly'|'yearly', targetDate, linkedTaskIds: [] }
        ],
        affirmations: [
            { id: 1, text: 'I follow through on my plans.' },
            { id: 2, text: 'Every step forward counts.' }
        ],
        moodLog: []
    };
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let plannerData = loadData();

// --- View Rendering ------------------------------------------------
const appEl = document.getElementById('app');
const views = {
    inbox: () => {
        setActiveNav('inbox');
        appEl.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold mb-6">Inbox</h2>
        <div class="card p-6">
          <div class="text-center py-8">
            <div class="text-6xl mb-4">📥</div>
            <p class="text-content text-lg">Quick entries will appear here</p>
            <p class="text-content opacity-70 mt-2">Use the + button to capture thoughts and ideas</p>
          </div>
        </div>
      </div>`;
    },

    today: () => {
        setActiveNav('today');
        appEl.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold mb-6">Today</h2>
        
        <!-- Habits Card -->
        <section class="card p-6">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <span class="text-2xl mr-3">⚡</span>
            Daily Habits
          </h3>
          <ul class="space-y-4">
            ${plannerData.habits.map(h => `
              <li class="flex items-center p-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all">
                <button data-habit="${h.id}" class="checkbox-modern mr-4"></button>
                <span class="text-content text-lg">${h.text}</span>
              </li>`).join('')}
          </ul>
        </section>

        <!-- Today's Tasks Card -->
        <section class="card p-6">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <span class="text-2xl mr-3">✓</span>
            Today's Tasks
          </h3>
          <ul id="task-list" class="space-y-4"></ul>
          ${plannerData.tasks.filter(t => t.dueDate === new Date().toISOString().slice(0, 10) && !t.done).length === 0 ? 
            '<div class="text-center py-6"><p class="text-content opacity-70">No tasks for today. Tap + to add one!</p></div>' : ''}
        </section>
      </div>`;
        renderTasks();
        // Habits toggle
        document.querySelectorAll('[data-habit]').forEach(btn => {
            btn.onclick = e => {
                const id = +e.currentTarget.getAttribute('data-habit');
                const today = new Date().toISOString().slice(0, 10);
                const h = plannerData.habits.find(h => h.id === id);
                h.lastDoneDate = (h.lastDoneDate === today ? null : today);
                saveData(plannerData);
                views.today();
            };
        });
    },

    goals: () => {
        setActiveNav('goals');
        appEl.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Goals</h2>
        <button id="add-goal" class="modern-button">
          <span class="mr-2">+</span> New Goal
        </button>
      </div>
      <section class="card p-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center">
          <span class="text-2xl mr-3">🎯</span>
          Your Goals
        </h3>
        <ul class="space-y-4">
          ${plannerData.goals.length
                ? plannerData.goals.map(g => `
            <li class="flex justify-between items-center p-4 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all">
              <div>
                <span class="text-content text-lg font-medium">${g.text}</span>
                <div class="text-content opacity-70 text-sm mt-1">${g.horizon} goal</div>
              </div>
              <button data-delete-goal="${g.id}" class="w-8 h-8 rounded-full hover:bg-red-500 hover:bg-opacity-20 flex items-center justify-center transition-all">
                <span class="text-red-400 text-lg">×</span>
              </button>
            </li>`).join('')
                : `<li class="text-center py-8">
                    <div class="text-4xl mb-4">🌟</div>
                    <p class="text-content opacity-70">No goals yet. Create your first goal!</p>
                   </li>`}
        </ul>
      </section>
    </div>`;

        // Hook up Add Goal
        document.getElementById('add-goal').onclick = () => {
            const text = prompt('Goal name?');
            if (!text) return;
            const horizon = prompt('Horizon? (weekly/monthly/yearly)', 'weekly');
            const id = Date.now();
            plannerData.goals.push({ id, text, horizon, linkedTaskIds: [], doneCount: 0 });
            saveData(plannerData);
            views.goals();
        };

        // Hook up Delete Goal
        document.querySelectorAll('[data-delete-goal]').forEach(btn => {
            btn.onclick = e => {
                const id = +e.currentTarget.getAttribute('data-delete-goal');
                plannerData.goals = plannerData.goals.filter(g => g.id !== id);
                saveData(plannerData);
                views.goals();
            };
        });
    },

    stats: () => {
        setActiveNav('stats');
        appEl.innerHTML = `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold mb-6">Stats</h2>
      <section class="card p-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center">
          <span class="text-2xl mr-3">📊</span>
          7-Day Progress
        </h3>
        <canvas id="statsChart" class="w-full h-64"></canvas>
      </section>
    </div>`;

        // Build data for last 7 days
        const labels = [], data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().slice(0, 10);
            labels.push(key.slice(5)); // MM-DD
            // Count tasks done on this date habits done
            const tasksDone = plannerData.tasks.filter(t => t.done && t.dueDate === key).length;
            const habitsDone = plannerData.habits.filter(h => h.lastDoneDate === key).length;
            data.push(tasksDone + habitsDone);
        }
        // Render Chart.js bar
        new Chart(document.getElementById('statsChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Completions',
                    data,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderRadius: 8,
                    maxBarThickness: 40
                }]
            },
            options: {
                scales: {
                    y: { 
                        beginAtZero: true, 
                        ticks: { 
                            stepSize: 1,
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: { 
                    legend: { display: false }
                },
                responsive: true, 
                maintainAspectRatio: false
            }
        });
    },

    settings: () => {
        setActiveNav('settings');
        appEl.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold mb-6">Settings</h2>
        
        <!-- Theme Selection -->
        <section class="card p-6">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <span class="text-2xl mr-3">🎨</span>
            Theme
          </h3>
          <div class="space-y-3">
            <label class="flex items-center p-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all cursor-pointer">
              <input type="radio" name="theme" value="cosmic" class="mr-4"/>
              <div>
                <div class="text-content font-medium">Cosmic</div>
                <div class="text-content opacity-70 text-sm">Deep space vibes with animated stars</div>
              </div>
            </label>
            <label class="flex items-center p-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all cursor-pointer">
              <input type="radio" name="theme" value="glass" class="mr-4"/>
              <div>
                <div class="text-content font-medium">Frosted Glass</div>
                <div class="text-content opacity-70 text-sm">Clean and minimal aesthetic</div>
              </div>
            </label>
          </div>
        </section>

        <!-- Affirmations -->
        <section class="card p-6">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <span class="text-2xl mr-3">💭</span>
            Daily Affirmation
          </h3>
          <div class="space-y-4">
            <div class="p-4 rounded-lg bg-white bg-opacity-10">
              <p class="text-content text-lg italic text-center">"${plannerData.affirmations[Math.floor(Math.random() * plannerData.affirmations.length)]?.text || 'I follow through on my plans.'}"</p>
            </div>
            
            <div>
              <h4 class="text-content font-medium mb-3">How are you feeling today?</h4>
              <input type="range" id="mood" min="0" max="5" value="3" class="w-full mb-3"/>
              <div class="flex justify-between text-sm text-content opacity-70">
                <span>😢</span>
                <span>😐</span>
                <span>😊</span>
              </div>
              <button id="save-mood" class="modern-button w-full mt-4">Save Mood</button>
            </div>
          </div>
        </section>
      </div>`;
      
        // Initialize theme selector
        initThemeSelector();
        
        // Save mood functionality
        document.getElementById('save-mood').onclick = () => {
            const v = +document.getElementById('mood').value;
            plannerData.moodLog.push({ date: new Date().toISOString().slice(0, 10), moodValue: v });
            saveData(plannerData);
            
            // Show modern success feedback
            const btn = document.getElementById('save-mood');
            const original = btn.innerHTML;
            btn.innerHTML = '✓ Saved!';
            btn.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
            setTimeout(() => {
                btn.innerHTML = original;
                btn.style.background = '';
            }, 2000);
        };
    }
};

function renderTasks() {
    const ul = document.getElementById('task-list');
    if (!ul) return;
    
    ul.innerHTML = '';
    const today = new Date().toISOString().slice(0, 10);
    plannerData.tasks
        .filter(t => t.dueDate === today && !t.done)
        .forEach(t => {
            const li = document.createElement('li');
            li.className = 'flex items-center p-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all';
            li.innerHTML = `
       <button data-task="${t.id}" class="checkbox-modern mr-4"></button>
        <span class="text-content text-lg">${t.text}</span>
      `;
            ul.appendChild(li);
            li.querySelector('[data-task]').onclick = e => {
                const id = +e.currentTarget.getAttribute('data-task');
                const task = plannerData.tasks.find(t => t.id === id);
                task.done = !task.done;
                saveData(plannerData);
                views.today();
            };
        });
}

// --- Navigation & FAB ---------------------------------------------
document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        views[view]();
    });
});

// Initialize default view
views.today();

// Floating "+" to add a task for today
document.getElementById('fab').addEventListener('click', () => {
    const text = prompt('Add a task for today:');
    if (!text) return;
    const id = Date.now();
    const dueDate = new Date().toISOString().slice(0, 10);
    plannerData.tasks.push({ id, text, dueDate, tags: [], done: false });
    saveData(plannerData);
    if (appEl.innerHTML.includes("Today's Tasks")) renderTasks();
});

// Initialize theme on page load
window.savedTheme = savedTheme;
