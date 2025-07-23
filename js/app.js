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
        appEl.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-lg font-semibold mb-3">Inbox</h2>
        <p class="text-gray-500">Quick entries will appear here.</p>
      </div>`;
    },

    today: () => {

        appEl.innerHTML = `
      <div class="space-y-6">
        <!-- Habits Card -->
              <section class="bg-neutral-50 dark:bg-neutral-800 rounded-lg shadow p-4">
        <h2 class="text-2xl font-semibold mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">Habits</h2>
         <ul class="space-y-3">
            ${plannerData.habits.map(h => `
              <li class="flex items-center">
                <button data-habit="${h.id}"
        class="mr-3 w-5 h-5 border-2 border-gray-300 rounded-sm hover:border-primary-500 transition transform active:scale-95"></button>
                <span class="text-neutral-700 dark:text-neutral-200">${h.text}</span>
              </li>`).join('')}
          </ul>
        </section>

        <!-- Today’s Tasks Card -->
       <section class="bg-neutral-50 dark:bg-neutral-800 rounded-lg shadow p-4">
         <h2 class="text-2xl font-semibold mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">Today’s Tasks</h2>
         <ul id="task-list" class="space-y-3 text-neutral-700"></ul>
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
        appEl.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold">Goals</h2>
      <button id="add-goal"
              class="px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-700">
        New
      </button>
    </div>
    <section class="bg-neutral-50 dark:bg-neutral-800 rounded-lg shadow p-4">
      <ul class="space-y-3">
        ${plannerData.goals.length
                ? plannerData.goals.map(g => `
            <li class="flex justify-between items-center">
              <span>${g.text} <small class="text-neutral-500 dark:text-neutral-400">(${g.horizon})</small></span>
              <button data-delete-goal="${g.id}"
                      class="text-red-500 hover:text-red-700 transition-colors active:scale-95">
                ✕
              </button>
            </li>`).join('')
                : `<li class="text-neutral-500">No goals yet.</li>`}
      </ul>
    </section>`;

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
        +
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
        appEl.innerHTML = `
    <section class="bg-neutral-50 dark:bg-neutral-800 rounded-lg shadow p-4 mb-6">
      <h2 class="text-2xl font-semibold mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">Stats</h2>
      <canvas id="statsChart" class="w-full h-48"></canvas>
    </section>`;

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
            data.push(tasksDone, habitsDone);
        }
        // Render Chart.js bar
        new Chart(document.getElementById('statsChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Completions',
                    data,
                    backgroundColor: 'rgba(79,70,229,0.7)',
                    borderRadius: 4,
                    maxBarThickness: 32
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                },
                plugins: { legend: { display: false } },
                responsive: true, maintainAspectRatio: false
            }
        });
    },

    affirm: () => {
        // Pick a random affirmation
        const idx = Math.floor(Math.random() * plannerData.affirmations.length);
        const text = plannerData.affirmations[idx]?.text || '';
        appEl.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-lg font-semibold">Affirmation</h2>
        <p class="text-gray-700 italic">"${text}"</p>
        <div>
          <h3 class="font-medium mb-2">How are you feeling?</h3>
          <input type="range" id="mood" min="0" max="5" value="3"
                 class="w-full"/>
          <button id="save-mood"
                  class="mt-2 px-4 py-2 bg-primary-500 text-white rounded">Save Mood</button>
        </div>
      </div>`;
        document.getElementById('save-mood').onclick = () => {
            const v = +document.getElementById('mood').value;
            plannerData.moodLog.push({ date: new Date().toISOString().slice(0, 10), moodValue: v });
            saveData(plannerData);
            alert('Mood saved!');
        };
    }
};

function renderTasks() {
    const ul = document.getElementById('task-list');
    ul.innerHTML = '';
    const today = new Date().toISOString().slice(0, 10);
    plannerData.tasks
        .filter(t => t.dueDate === today && !t.done)
        .forEach(t => {
            const li = document.createElement('li');
            li.className = 'flex items-center';
            li.innerHTML = `
       <button data-task="${t.id}"
        class="mr-3 w-5 h-5 border-2 border-gray-300 rounded-sm hover:border-primary-500 transition transform active:scale-95"></button>
        <span>${t.text}</span>
      `;
            ul.appendChild(li);
            li.querySelector('[data-task]').onclick = e => {
                const id = +e.currentTarget.getAttribute('data-task');
                const t = plannerData.tasks.find(t => t.id === id);
                t.done = !t.done;
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

// Floating “+” to add a task for today
document.getElementById('fab').addEventListener('click', () => {
    const text = prompt('Add a task for today:');
    if (!text) return;
    const id = Date.now();
    const dueDate = new Date().toISOString().slice(0, 10);
    plannerData.tasks.push({ id, text, dueDate, tags: [], done: false });
    saveData(plannerData);
    if (appEl.innerHTML.includes("Today’s Tasks")) renderTasks();
});
