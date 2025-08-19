#!/bin/bash

# 服务导航系统 - macOS生产环境启动脚本
# 适用于macOS系统，使用80端口进行局域网访问

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}   服务导航系统 - macOS生产环境启动${NC}"
echo -e "${BLUE}===========================================${NC}"

# 检查是否以root权限运行（80端口需要）
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}错误: 80端口需要管理员权限${NC}"
    echo -e "${YELLOW}请使用 sudo 运行此脚本:${NC}"
    echo -e "${YELLOW}sudo ./scripts/start-production-macos.sh${NC}"
    exit 1
fi

# 检查端口是否被占用
check_port() {
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}错误: 端口80已被占用${NC}"
        echo -e "${YELLOW}当前占用80端口的进程:${NC}"
        lsof -Pi :80 -sTCP:LISTEN
        echo ""
        read -p "是否终止占用进程并继续？ (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}终止占用进程...${NC}"
            lsof -ti:80 | xargs kill -9 2>/dev/null || true
            sleep 2
        else
            exit 1
        fi
    fi
}

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未找到 Node.js${NC}"
        echo -e "${YELLOW}请安装 Node.js: https://nodejs.org/${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: 未找到 npm${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"
    echo -e "${GREEN}✓ npm: $(npm --version)${NC}"
}

# 安装项目依赖
install_dependencies() {
    echo -e "${YELLOW}检查项目依赖...${NC}"
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}安装依赖...${NC}"
        npm install
    else
        echo -e "${GREEN}✓ 依赖已存在${NC}"
    fi
    
    # 安装serve（全局）
    if ! command -v serve &> /dev/null; then
        echo -e "${YELLOW}安装 serve...${NC}"
        npm install -g serve
    else
        echo -e "${GREEN}✓ serve 已安装${NC}"
    fi
}

# 构建生产版本
build_production() {
    echo -e "${YELLOW}构建生产版本...${NC}"
    
    # 清理旧构建
    if [ -d "dist" ]; then
        rm -rf dist
    fi
    
    # 设置环境变量
    export NODE_ENV=production
    
    # 构建
    npm run build
    
    if [ ! -d "dist" ]; then
        echo -e "${RED}错误: 构建失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 构建完成${NC}"
}

# 创建启动脚本
create_launch_script() {
    cat > "$PROJECT_ROOT/production-server.sh" << 'EOF'
#!/bin/bash
# 生产服务器启动脚本

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "启动服务导航系统生产服务器..."
echo "端口: 80"
echo "访问: http://localhost 或 http://$(hostname -I | awk '{print $1}')"
echo "按 Ctrl+C 停止服务"
echo ""

# 启动服务器
serve -s dist -l 80 --host 0.0.0.0
EOF

    chmod +x "$PROJECT_ROOT/production-server.sh"
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

# 创建停止脚本
create_stop_script() {
    cat > "$PROJECT_ROOT/stop-production.sh" << 'EOF'
#!/bin/bash
# 停止生产服务器

echo "正在停止服务导航系统..."

# 查找并终止serve进程
SERVE_PID=$(pgrep -f "serve.*dist.*80" 2>/dev/null || true)
if [ -n "$SERVE_PID" ]; then
    echo "终止进程: $SERVE_PID"
    kill $SERVE_PID
    echo "服务已停止"
else
    echo "未找到运行中的服务"
fi

# 检查80端口
if lsof -Pi :80 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "端口80仍被占用，强制清理..."
    lsof -ti:80 | xargs kill -9 2>/dev/null || true
fi

echo "清理完成"
EOF

    chmod +x "$PROJECT_ROOT/stop-production.sh"
}

# 启动服务
start_service() {
    echo -e "${YELLOW}启动生产服务器...${NC}"
    
    get_local_ip
    
    echo ""
    echo -e "${GREEN}===========================================${NC}"
    echo -e "${GREEN}         服务启动成功！${NC}"
    echo -e "${GREEN}===========================================${NC}"
    echo ""
    echo -e "${BLUE}访问地址:${NC}"
    echo -e "  本机访问: ${GREEN}http://localhost${NC}"
    if [ "$LOCAL_IP" != "localhost" ]; then
        echo -e "  局域网访问: ${GREEN}http://$LOCAL_IP${NC}"
    fi
    echo ""
    echo -e "${BLUE}控制命令:${NC}"
    echo -e "  停止服务: ${YELLOW}sudo ./stop-production.sh${NC}"
    echo -e "  查看状态: ${YELLOW}./scripts/status-check.sh${NC}"
    echo ""
    echo -e "${BLUE}注意事项:${NC}"
    echo -e "  • 服务将在前台运行，按 ${YELLOW}Ctrl+C${NC} 可停止"
    echo -e "  • 如需后台运行，请在命令后添加 ${YELLOW}&${NC}"
    echo -e "  • 防火墙可能需要允许80端口访问"
    echo ""
    echo -e "${YELLOW}启动中... (按 Ctrl+C 停止)${NC}"
    echo ""
    
    # 启动服务器
    serve -s dist -l 80
}

# 主执行流程
main() {
    check_port
    check_dependencies
    install_dependencies
    build_production
    create_launch_script
    create_stop_script
    start_service
}

# 错误处理
trap 'echo -e "\n${RED}服务已停止${NC}"; exit 0' INT
trap 'echo -e "\n${RED}启动失败${NC}"; exit 1' ERR

# 执行
main