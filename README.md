# Carpe Diem Planner

A zero‑friction, client‑only Progressive Web App (PWA) “life‑assistant” for capturing thoughts, managing habits and tasks, setting goals, and tracking your weekly progress—all in a polished, mobile‑first interface.

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

- **Inbox**: One‑tap “+” to capture any idea, task or note, with free‑form tags.  
- **Today**: Check off daily habits and one‑off tasks (due today or overdue).  
- **Goals**: Add/​delete weekly, monthly, or yearly goals; track simple % complete.  
- **Stats**: Automatic 7‑day bar chart of total completions (tasks + habits).  
- **Affirmations**: Daily randomized positive affirmation + one‑tap mood logging.  
- **Dark Mode**: Toggle between light and dark color schemes.  
- **PWA‑Ready**: Install to your phone’s home screen and use offline.  
- **Zero‑Backend**: All data lives in your browser’s LocalStorage; no server or auth.

---

## 🚀 Demo & Installation

1. **Open the live demo**:  
   https://your‑username.github.io/carpe-diem-planner/  
2. **Install on Android**:  
   - Open in Chrome → Tap “Install” banner or ⋮ menu → *Add to Home screen*.  
3. **Use offline**:  
   - Your data and assets are cached via service worker; no network needed.

---

## 🛠 Getting Started (Local Development)

```bash
# 1. Clone the repo
git clone https://github.com/your‑username/carpe-diem-planner.git
cd carpe-diem-planner

# 2. Open in your editor (VS Code recommended)
code .

# 3. Serve locally
#   • Install “Live Server” extension for VS Code, or
#   • Run a simple Python server:
python3 -m http.server 5500
# Then browse to http://localhost:5500

# 4. Toggle mobile preview:
#   • Open Chrome DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)
