#!/bin/bash

# 服务导航系统 - 测试生产环境启动脚本（8080端口）

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
echo -e "${BLUE}   服务导航系统 - 测试生产环境启动${NC}"
echo -e "${BLUE}===========================================${NC}"

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未找到 Node.js${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: 未找到 npm${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"
    echo -e "${GREEN}✓ npm: $(npm --version)${NC}"
}

# 检查serve
check_serve() {
    if ! command -v npx serve &> /dev/null; then
        echo -e "${YELLOW}安装 serve...${NC}"
        npm install -g serve
    else
        echo -e "${GREEN}✓ serve 已安装${NC}"
    fi
}

# 获取本机IP
get_local_ip() {
    # macOS获取IP的方法
    LOCAL_IP=$(route get default | grep interface | awk '{print $2}' | xargs ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP="localhost"
    fi
}

# 启动服务
start_service() {
    echo -e "${YELLOW}启动生产服务器 (端口8080)...${NC}"
    
    get_local_ip
    
    echo ""
    echo -e "${GREEN}===========================================${NC}"
    echo -e "${GREEN}         测试服务启动成功！${NC}"
    echo -e "${GREEN}===========================================${NC}"
    echo ""
    echo -e "${BLUE}访问地址:${NC}"
    echo -e "  本机访问: ${GREEN}http://localhost:8080${NC}"
    if [ "$LOCAL_IP" != "localhost" ]; then
        echo -e "  局域网访问: ${GREEN}http://$LOCAL_IP:8080${NC}"
    fi
    echo ""
    echo -e "${BLUE}注意事项:${NC}"
    echo -e "  • 测试环境使用8080端口，无需管理员权限"
    echo -e "  • 生产环境请使用 ${YELLOW}sudo ./start-server.sh${NC} (80端口)"
    echo -e "  • 按 ${YELLOW}Ctrl+C${NC} 可停止服务"
    echo ""
    echo -e "${YELLOW}服务启动中... (按 Ctrl+C 停止)${NC}"
    echo ""
    
    # 启动服务器
    npx serve -s dist -l 8080 --host 0.0.0.0
}

# 主执行流程
main() {
    check_dependencies
    check_serve
    start_service
}

# 错误处理
trap 'echo -e "\n${RED}服务已停止${NC}"; exit 0' INT
trap 'echo -e "\n${RED}启动失败${NC}"; exit 1' ERR

# 执行
main