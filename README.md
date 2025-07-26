# Life Vault

A modern Progressive Web App (PWA) for capturing and organizing your life's memories, present moments, and future aspirations across different categories like work, health, home, relationships, hobbies, and commitments.

---

## 🔍 Table of Contents

1. [Features](#features)  
2. [Demo & Installation](#demo--installation)  
3. [Getting Started (Local Development)](#getting-started-local-development)  
4. [Deploying to GitHub Pages](#deploying-to-github-pages)  
5. [Tech Stack](#tech-stack)  
6. [Project Structure](#project-structure)  
7. [Usage](#usage)  
8. [Contributing & Feedback](#contributing--feedback)  
9. [License](#license)  

---

## ✨ Features

- **Categorized Memory Cards**: Organize entries by life categories (Work, Health, Home, Relationships, Hobbies, Commitments)
- **Time-based Organization**: Capture memories (past), present moments, and future goals
- **Visual Card Layout**: Beautiful card-based interface with category-specific colors
- **Smart Filtering**: Filter by categories, days, or time periods
- **Responsive Design**: Optimized for mobile and desktop use
- **Offline Support**: PWA functionality with service worker caching
- **Local Storage**: All data stored locally in your browser - no accounts needed
- **Modern UI**: Dark theme with glassmorphism effects and smooth animations

---

## 🚀 Demo & Installation

1. **Open the live demo**:  
   https://your‑username.github.io/life-vault/  
2. **Install on Mobile**:  
   - Open in Chrome/Safari → Tap "Install" banner or "Add to Home screen"
3. **Use offline**:  
   - Your data and assets are cached via service worker; no network needed

---

## 🛠 Getting Started (Local Development)

```bash
# 1. Clone the repo
git clone https://github.com/your‑username/life-vault.git
cd life-vault

# 2. Open in your editor (VS Code recommended)
code .

# 3. Serve locally
#   • Install "Live Server" extension for VS Code, or
#   • Run a simple Python server:
python3 -m http.server 8000
# Then browse to http://localhost:8000

# 4. Toggle mobile preview:
#   • Open Chrome DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)
```

---

## 🚀 Deploying to GitHub Pages

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial Life Vault setup"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to repo Settings → Pages
   - Source: Deploy from branch → `main` → `/` (root)
   - Save and wait ~5 minutes

3. **Visit your live app**:
   `https://your-username.github.io/life-vault/`

---

## 🛠 Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Tailwind CSS + Custom CSS Variables
- **PWA**: Service Worker, Web App Manifest
- **Storage**: LocalStorage API
- **Icons**: Emoji + Custom CSS
- **Build**: None required (vanilla JS)

---

## 📁 Project Structure

```
life-vault/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── service-worker.js       # SW for offline support
├── js/
│   └── app.js             # Main app logic
├── assets/
│   └── icons/             # PWA icons
└── README.md              # This file
```

---

## 📱 Usage

### Adding Memories
1. Tap the **+** button
2. Enter a title and description
3. Select a category (Work, Health, Home, etc.)
4. Choose the type (Memory, Present, Future)
5. Save to add to your vault

### Filtering & Organization
- Use the **filter pills** to view specific categories
- **Day filters** help organize by timeframes
- **Category filters** show memories by life area

### Editing & Deleting
- **Tap any card** to edit its details
- **Delete button** appears in edit mode
- Changes are saved automatically

---

## 🤝 Contributing & Feedback

This is a personal project, but suggestions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests for improvements
- Share feedback on the user experience

---

## 📄 License

MIT License - feel free to use this project as a starting point for your own life organization app!
