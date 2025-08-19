#!/bin/bash

# 启动后端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}   服务导航系统 - 后端API启动${NC}"
echo -e "${BLUE}===========================================${NC}"

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}错误: 未找到 Python3${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python: $(python3 --version)${NC}"

# 创建后端目录（如果不存在）
if [ ! -d "backend" ]; then
    echo -e "${YELLOW}创建后端目录...${NC}"
    mkdir -p backend
fi

cd backend

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}创建Python虚拟环境...${NC}"
    python3 -m venv venv
fi

# 激活虚拟环境
echo -e "${YELLOW}激活虚拟环境...${NC}"
source venv/bin/activate

# 安装依赖
echo -e "${YELLOW}安装依赖...${NC}"
pip install -q fastapi uvicorn pydantic python-multipart

# 检查main.py是否存在
if [ ! -f "main.py" ]; then
    echo -e "${RED}错误: 未找到 main.py${NC}"
    echo -e "${YELLOW}请确保后端代码已就位${NC}"
    exit 1
fi

# 创建数据目录
mkdir -p data

# 启动后端服务
echo -e "${GREEN}启动后端服务...${NC}"
echo -e "${BLUE}API地址: http://localhost:8001${NC}"
echo -e "${BLUE}API文档: http://localhost:8001/docs${NC}"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"
echo ""

# 启动FastAPI
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload