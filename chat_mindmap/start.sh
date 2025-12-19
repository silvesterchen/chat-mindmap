#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}      AI Mind Map Tool 启动脚本      ${NC}"
echo -e "${BLUE}========================================${NC}"

# Get root directory
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${BLUE}正在停止服务...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo -e "${GREEN}服务已停止${NC}"
    exit
}

# Kill existing processes on ports 8000 and 3000
echo -e "${BLUE}正在清理旧进程...${NC}"
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

# Register cleanup function for SIGINT (Ctrl+C)
trap cleanup SIGINT SIGTERM

# 1. Start Backend
echo -e "${GREEN}[1/2] 正在启动后端服务...${NC}"
cd "$ROOT_DIR/backend"

# Check for virtual environment
if [ -d "venv" ]; then
    echo "激活虚拟环境..."
    source venv/bin/activate
else
    echo "创建虚拟环境..."
    python3 -m venv venv
    source venv/bin/activate
fi

# Install dependencies
echo "检查并安装依赖..."
pip install -r requirements.txt

# Run python server
# Use python3 if available, otherwise python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

echo "Starting backend with $PYTHON_CMD..."
$PYTHON_CMD main.py > backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已在后台启动 (PID: $BACKEND_PID)"

# 2. Start Frontend
echo -e "${GREEN}[2/2] 正在启动前端服务...${NC}"
cd "$ROOT_DIR/frontend"

# Check and install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "检测到前端依赖缺失，正在安装..."
    npm install
else
    echo "前端依赖已安装。"
fi

npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务已在后台启动 (PID: $FRONTEND_PID)"

# 3. Wait for services to warm up
echo -e "${BLUE}等待服务就绪...${NC}"
sleep 3

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   启动成功！请访问以下地址使用:   ${NC}"
echo -e "${GREEN}   http://localhost:3000           ${NC}"
echo -e "${GREEN}========================================${NC}"

# Open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    fi
fi

echo -e "${BLUE}按 Ctrl+C 停止所有服务${NC}"

# Keep script running to maintain background processes
wait
