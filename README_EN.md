[**English**](README_EN.md) | [**中文**](README.md)

# Chat MindMap Tool
🚀 Break free from linear conversations and start a new era of thought visualization!

A canvas-based AI dialogue tool that supports AI assistant conversations and context memory. With this tool, you can achieve a Q&A session between two agents to help you organize your thoughts, conduct research, and brainstorm. All you need to do is help the agent choose which question to ask.

> ✨ Developed mimicking the flowith interaction style, adapted for MacOS/Windows dual systems (Windows startup experience optimized).

<img width="1702" height="807" alt="image" src="https://github.com/user-attachments/assets/304f8f18-6257-4dbb-86de-3571cfbedf71" />
Demo Video: https://www.bilibili.com/video/BV1YGqhBKEf6/?vd_source=724965bec351ba7062c785c9203557e1

## 🎯 Core Value: Why Choose Chat MindMap?
- 🧠 **Mesh Thought Visualization**: See logical connections at a glance, say goodbye to scrolling through chats to find key points~
- 💡 **Node Series for Inspiration**: Complex logic presented intuitively, understands your thinking rhythm better than linear dialogue!
- 🎨 **Canvas-style Logic Breakdown**: Build topic associations with one click, unlimited thinking, more efficient organization~

## 📌 Applicable Scenarios
✅ Project Planning - Requirement breakdown, task assignment, progress control  
✅ Study Notes - Knowledge organization, concept association, efficient review  
✅ Brainstorming - Creative divergence, solution comparison, clear decision-making  
✅ Problem Analysis - Root cause tracing, solutions, risk assessment  

## 🔧 Core Features
- Mind Map Editing (Double-click to edit, Markdown rendering support, font adjustment, node zooming, one-click layout optimization)
- AI Assistant Dialogue (Interrupt function, 5-round context memory, customizable smart suggestions)
- Smart Document Export (One-click conversion of mind map content to Markdown documents, supporting stream generation, preview, copy, and download)
- LLM Model Configuration (Multi-configuration save/switch to meet different scenario needs)
- Dialogue History Persistence (Isolated by mind map, saved to file, inspiration never lost)
- File Management (Create/Rename/Delete mind maps/folders, clear management)
  
- Future Scene Templates (Project planning/Study notes preset templates, ready to use out of the box)

## 📂 Project Structure
- Backend: `/chat_mindmap/backend` (FastAPI)
- Frontend: `/chat_mindmap/frontend` (React/Vite)

## 📋 Prerequisites
- Install Python 3.8+
- Install Node.js 16+
- Install npm 8+

## ⚡ Quick Start (Get started in 1 minute)
### Method 1: One-click Start (Recommended)

1. Open terminal, enter project root directory:

   ```bash
   cd chat_mindmap
   ```
2. Run startup script:

   ```bash
   # MacOS:
   chmod +x start.sh
   ./start.sh
   
   # Windows:
   start.bat
   ```
3. The program will automatically install dependencies and start backend and frontend services. Press `Ctrl+C` to close both.

### Method 2: Manual Start

1. Start Backend Service
   1. Open terminal, enter backend directory:

   ```bash
   cd /chat_mindmap/backend
   ```
   2. Create and activate virtual environment (Optional but recommended):

   ```bash
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   # Or venv\Scripts\activate  # Windows
   ```
   3. Install backend dependencies:

   ```bash
   pip install -r requirements.txt
   ```
   4. Start FastAPI server:
   
   ```bash
   python main.py
   ```
   
   - Server runs by default at [http://0.0.0.0:8000](http://0.0.0.0:8000)
   - If port 8000 is occupied, kill the occupying process (see FAQ) and restart.

2. Start Frontend Service
   1. Open new terminal, enter frontend directory:

   ```bash
   cd /chat_mindmap/frontend
   ```
   2. Install frontend dependencies:

   ```bash
   npm install
   ```
   3. Start Vite development server:

   ```bash
   npm run dev
   ```
   - Server runs by default at [http://localhost:3000](http://localhost:3000)

3. Access Program
Enter `http://localhost:3000` in your browser to experience it!

## ❓ FAQ (Quick Check)
| Issue | Solution |
|-------|----------|
| Backend port 8000 occupied | `lsof -ti:8000` to check PID → `kill -9 PID` (macOS/Linux);<br>Windows: `netstat -ano | findstr :8000` to check PID → `taskkill /F /PID PID` |
| Frontend dependency install failed | `rm -rf node_modules package-lock.json` (macOS/Linux) /<br>`rd /s /q node_modules package-lock.json` (Windows) → Re-run `npm install` |
| Vite command not found | Confirm Node.js/npm installed → Re-run `npm install` to install dependencies |
| Windows startup script no response | Right-click `start.bat` → Select "Run as administrator" |

## 🎬 User Cases (Contributions Welcome!)
> Click [Issues](https://github.com/silvesterchen/chat-mindmap/issues) to share your usage scenario (Format: Scenario + Effect, e.g., "Study Scenario: Organized machine learning knowledge points, review efficiency improved by 50%"), quality cases will be showcased here~
- Case 1: @XXX - Used Chat MindMap to organize logic for graduate entrance exam politics chapters, connected 5 core exam points in 30 minutes, no need to flip through books repeatedly during review.
- Case 2: @XXX - Dual Agent collaboration to break down product requirements, completed "User Login Module" process organization in 1 hour, avoiding requirement omissions.

## 🤝 Contribution Plan
If you are familiar with the FastAPI/React tech stack, or have new feature ideas, welcome to submit PRs (Pull Requests) to participate in development!  
Current priority features to develop:
1. Export mind map to PNG/PDF format (High frequency demand)
2. Cloud sync function (Multi-device data interoperability)
3. More LLM model adaptations (Extended usage scenarios)

Contributors with successfully merged PRs will be credited in the "Contributors" section below and get "Priority Development Rights for Customized Features" (your needs will be scheduled for implementation first)!

### Contributors
- [silvesterchen](https://github.com/silvesterchen) (Project Initiator)
- (Looking forward to your name here!)

## 📞 Feedback & Communication
- Feature Suggestions/Bug Feedback: Submit [Issues](https://github.com/silvesterchen/chat-mindmap/issues)
- Usage Questions: Leave a message in Issues or comment section, reply within 24 hours~
