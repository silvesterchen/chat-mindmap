# Chat MindMap Tool
一款画布式的AI对话工具，支持AI助手对话和上下文记忆。本项目在MacOS系统研发测试。

拥有以下优势：
- 1. 网状思维可视化，逻辑关联一眼看透，告别对话刷屏找重点～
- 2. 节点串联发散灵感，复杂逻辑直观呈现，比线性对话更懂你的思考节奏！
- 3. 画布式逻辑拆解，主题关联一键搭建，思维不设限，梳理更高效～

## 核心功能
- 思维导图编辑（双击编辑、字体调整、节点缩放）
- AI助手对话（打断功能、5轮上下文支持）
- LLM模型配置（多配置保存/切换）
- 对话历史持久化（按导图隔离，保存至文件）
- 文件管理（创建/重命名/删除导图/文件夹）

## 项目结构
- 后端: /chat_mindmap/backend (FastAPI)
- 前端: /chat_mindmap/frontend (React/Vite)

## 前置条件
- 安装Python 3.8+
- 安装Node.js 16+
- 安装npm 8+

## 启动步骤

### 方式一：一键启动（推荐）
1. 打开终端，进入项目根目录:
   ```bash
   cd chat_mindmap
   ```
2. 运行启动脚本:
   ```bash
   macos使用：
   chmod +x start.sh
   ./start.sh

   windwos使用：
   start.bat
   ```
3. 程序将自动安装依赖，自动启动后端和前端服务，按 `Ctrl+C` 可同时关闭。

### 方式二：手动启动

#### 1. 启动后端服务
1. 打开终端，进入后端目录:
   ```bash
   cd /chat_mindmap/backend
   ```
2. 创建并激活虚拟环境（可选但推荐）:
   ```bash
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   # 或 venv\Scripts\activate  # Windows
   ```
3. 安装后端依赖:
   ```bash
   pip install -r requirements.txt
   ```
4. 启动FastAPI服务器:
   ```bash
   python main.py
   ```
   - 服务器默认运行在 http://0.0.0.0:8000
   - 若端口8000被占用，可杀死占用进程（参考常见问题）后重新启动

#### 2. 启动前端服务
1. 打开新终端，进入前端目录:
   ```bash
   cd /chat_mindmap/frontend
   ```
2. 安装前端依赖:
   ```bash
   npm install
   ```
3. 启动Vite开发服务器:
   ```bash
   npm run dev
   ```
   - 服务器默认运行在 http://localhost:3000
   - 若端口3000被占用，Vite会自动尝试其他端口（如3000）

#### 3. 访问程序
- 在浏览器中输入前端服务器地址（如 http://localhost:3000）即可访问AI思维导图工具

## 常见问题
1. 后端端口8000被占用:
   ```bash
   # 查看占用进程ID
   lsof -ti:8000
   # 杀死进程（替换26284为实际进程ID）
   kill -9 26284
   ```
2. 前端依赖安装失败:
   ```bash
   # 删除 corrupted 文件
   rm -rf node_modules package-lock.json
   # 重新安装
   npm install
   ```
3. Vite命令未找到:
   ```bash
   npm install
   ```
