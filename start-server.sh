#!/bin/bash

# 服务导航系统 - 一键启动脚本

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 服务导航系统 - 一键启动${NC}"
echo ""

# 检测操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}检测到 macOS 系统${NC}"
    echo -e "${BLUE}启动生产环境...${NC}"
    sudo ./scripts/start-production-macos.sh
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${YELLOW}检测到 Linux 系统${NC}"
    echo -e "${BLUE}启动生产环境...${NC}"
    sudo ./scripts/start-production.sh
else
    echo -e "${YELLOW}未知系统，尝试 macOS 模式...${NC}"
    sudo ./scripts/start-production-macos.sh
fi