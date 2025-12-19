@echo off
setlocal

echo ========================================
echo      AI Mind Map Tool 启动脚本 (Windows)
echo ========================================

:: Get root directory
set "ROOT_DIR=%~dp0"

:: Kill existing processes on ports 8000 and 3000
echo 正在清理旧进程...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1

:: 1. Start Backend
echo [1/2] 正在启动后端服务...
cd /d "%ROOT_DIR%backend"

:: Check for virtual environment
if exist "venv" (
    echo 激活虚拟环境...
    call venv\Scripts\activate.bat
) else (
    echo 创建虚拟环境...
    python -m venv venv
    call venv\Scripts\activate.bat
)

:: Install dependencies
echo 检查并安装依赖...
pip install -r requirements.txt

:: Run python server in background
echo Starting backend...
start /b python main.py > backend.log 2>&1

:: 2. Start Frontend
echo [2/2] 正在启动前端服务...
cd /d "%ROOT_DIR%frontend"

:: Check and install frontend dependencies
if not exist "node_modules" (
    echo 检测到前端依赖缺失，正在安装...
    call npm install
) else (
    echo 前端依赖已安装。
)

echo Starting frontend...
start /b npm run dev > frontend.log 2>&1

:: 3. Wait for services to warm up
echo 等待服务就绪...
timeout /t 3 /nobreak >nul

echo ========================================
echo    启动成功！请访问以下地址使用:
echo    http://localhost:3000
echo ========================================

:: Open browser
start http://localhost:3000

echo 按任意键停止所有服务并退出...

pause >nul

:: Cleanup
echo 正在停止服务...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
echo 服务已停止
