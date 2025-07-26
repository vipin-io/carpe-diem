// SW registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  });
}

// --- Data Layer ---------------------------------------------------
const STORAGE_KEY = 'lifeVaultData';

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  
  // First-time sample data
  return {
    memories: [
      {
        id: 1,
        title: 'Finish project report',
        category: 'work',
        type: 'present',
        description: 'Complete the quarterly analysis report for the team meeting',
        createdAt: new Date().toISOString(),
        isLarge: true
      },
      {
        id: 2,
        title: 'Clean the kitchen',
        category: 'home',
        type: 'present',
        description: 'Deep clean and organize the kitchen space',
        createdAt: new Date().toISOString(),
        isLarge: false
      },
      {
        id: 3,
        title: 'Go for a run',
        category: 'health',
        type: 'present',
        description: 'Morning jog around the neighborhood',
        createdAt: new Date().toISOString(),
        isLarge: false
      },
      {
        id: 4,
        title: 'Email client feedback',
        category: 'work',
        type: 'present',
        description: 'Send the client the updated designs and gather feedback',
        createdAt: new Date().toISOString(),
        isLarge: false
      },
      {
        id: 5,
        title: 'Buy groceries',
        category: 'home',
        type: 'present',
        description: 'Weekly grocery shopping for the family',
        createdAt: new Date().toISOString(),
        isLarge: false
      }
    ],
    currentFilter: 'all'
  };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let vaultData = loadData();

// --- UI Management ------------------------------------------------
const appEl = document.getElementById('app');
const addModal = document.getElementById('add-modal');

// Category display names and emojis
const categoryInfo = {
  work: { name: 'Work', emoji: '💼' },
  health: { name: 'Health', emoji: '🏃‍♀️' },
  home: { name: 'Home', emoji: '🏠' },
  relationships: { name: 'Relationships', emoji: '❤️' },
  hobbies: { name: 'Hobbies', emoji: '🎨' },
  commitments: { name: 'Commitments', emoji: '📅' }
};

// Type display info
const typeInfo = {
  memory: { name: 'Memory', emoji: '📸' },
  present: { name: 'Present', emoji: '📌' },
  future: { name: 'Future', emoji: '🎯' }
};

function renderMemories() {
  const filtered = vaultData.currentFilter === 'all' 
    ? vaultData.memories 
    : vaultData.memories.filter(m => 
        m.category === vaultData.currentFilter || 
        m.type === vaultData.currentFilter ||
        // Handle day filters (these would be actual dates in a real app)
        vaultData.currentFilter.toLowerCase().includes(m.title.toLowerCase().slice(0, 3))
      );

  if (filtered.length === 0) {
    appEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
        <h3 style="color: rgba(255, 255, 255, 0.9); margin-bottom: 8px;">No memories found</h3>
        <p style="color: rgba(255, 255, 255, 0.6);">Add your first memory using the + button</p>
      </div>
    `;
    return;
  }

  appEl.innerHTML = filtered.map(memory => {
    const category = categoryInfo[memory.category];
    const type = typeInfo[memory.type];
    
    return `
      <div class="memory-card category-${memory.category} ${memory.isLarge ? 'large' : ''}" 
           data-id="${memory.id}">
        <div class="category-tag">
          ${category.emoji} ${category.name}
        </div>
        <div class="card-title">${memory.title}</div>
        <div class="card-subtitle">${type.emoji} ${type.name}</div>
        ${memory.description ? `<p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.4; margin-top: 8px;">${memory.description}</p>` : ''}
      </div>
    `;
  }).join('');

  // Add click handlers to cards
  document.querySelectorAll('.memory-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id);
      editMemory(id);
    });
  });
}

function editMemory(id) {
  const memory = vaultData.memories.find(m => m.id === id);
  if (!memory) return;

  // Pre-fill the modal with existing data
  document.getElementById('memory-title').value = memory.title;
  document.getElementById('memory-category').value = memory.category;
  document.getElementById('memory-type').value = memory.type;
  document.getElementById('memory-description').value = memory.description || '';

  // Change modal title and add delete button
  const modalContent = document.querySelector('.modal-content');
  modalContent.querySelector('h3').textContent = 'Edit Memory';
  
  // Add delete button if it doesn't exist
  if (!modalContent.querySelector('.delete-btn')) {
    const buttonGroup = modalContent.querySelector('.button-group');
    buttonGroup.insertAdjacentHTML('afterbegin', `
      <button class="btn delete-btn" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3);">Delete</button>
    `);
    
    // Add delete handler
    modalContent.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this memory?')) {
        vaultData.memories = vaultData.memories.filter(m => m.id !== id);
        saveData(vaultData);
        closeModal();
        renderMemories();
      }
    });
  }

  // Update save handler to edit instead of create
  const saveBtn = document.getElementById('save-btn');
  saveBtn.onclick = () => saveEditedMemory(id);

  showModal();
}

function saveEditedMemory(id) {
  const title = document.getElementById('memory-title').value.trim();
  if (!title) return;

  const memory = vaultData.memories.find(m => m.id === id);
  memory.title = title;
  memory.category = document.getElementById('memory-category').value;
  memory.type = document.getElementById('memory-type').value;
  memory.description = document.getElementById('memory-description').value.trim();

  saveData(vaultData);
  closeModal();
  renderMemories();
}

function showModal() {
  addModal.classList.add('show');
}

function closeModal() {
  addModal.classList.remove('show');
  // Reset modal for new memory
  document.querySelector('.modal-content h3').textContent = 'Add New Memory';
  const deleteBtn = document.querySelector('.delete-btn');
  if (deleteBtn) deleteBtn.remove();
  
  // Reset save button handler
  document.getElementById('save-btn').onclick = saveNewMemory;
  
  // Clear form
  document.getElementById('memory-title').value = '';
  document.getElementById('memory-category').value = 'work';
  document.getElementById('memory-type').value = 'memory';
  document.getElementById('memory-description').value = '';
}

function saveNewMemory() {
  const title = document.getElementById('memory-title').value.trim();
  if (!title) return;

  const newMemory = {
    id: Date.now(),
    title: title,
    category: document.getElementById('memory-category').value,
    type: document.getElementById('memory-type').value,
    description: document.getElementById('memory-description').value.trim(),
    createdAt: new Date().toISOString(),
    isLarge: Math.random() > 0.7 // Random chance for large cards
  };

  vaultData.memories.unshift(newMemory);
  saveData(vaultData);
  closeModal();
  renderMemories();
}

// --- Event Handlers -----------------------------------------------

// Filter pills
document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    // Update active state
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    
    // Update filter and re-render
    vaultData.currentFilter = pill.dataset.filter;
    saveData(vaultData);
    renderMemories();
  });
});

// FAB to add new memory
document.getElementById('fab').addEventListener('click', () => {
  showModal();
});

// Modal handlers
document.getElementById('cancel-btn').addEventListener('click', closeModal);
document.getElementById('save-btn').addEventListener('click', saveNewMemory);

// Close modal when clicking outside
addModal.addEventListener('click', (e) => {
  if (e.target === addModal) {
    closeModal();
  }
});

// Settings button (placeholder)
document.getElementById('settings-btn').addEventListener('click', () => {
  alert('Settings coming soon! 🚀');
});

// Menu button (placeholder)
document.getElementById('menu-btn').addEventListener('click', () => {
  alert('More options coming soon! 📱');
});

// --- Initialize App -----------------------------------------------

// Set initial filter active state
document.querySelector(`[data-filter="${vaultData.currentFilter}"]`)?.classList.add('active');

// Initial render
renderMemories();

// Auto-save current filter when changed
const originalFilter = vaultData.currentFilter;
if (originalFilter !== 'all') {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-filter="${originalFilter}"]`)?.classList.add('active');
}
