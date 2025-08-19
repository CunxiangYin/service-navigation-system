#!/bin/bash

# 服务导航系统 - 后台生产环境启动脚本

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

# PID文件路径
PID_FILE="$PROJECT_ROOT/.service-nav.pid"
LOG_FILE="$PROJECT_ROOT/service-nav.log"

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}   服务导航系统 - 后台生产环境启动${NC}"
echo -e "${BLUE}===========================================${NC}"

# 检查是否以root权限运行（80端口需要）
check_sudo() {
    if [ "$1" == "80" ] && [ "$EUID" -ne 0 ]; then
        echo -e "${RED}错误: 80端口需要管理员权限${NC}"
        echo -e "${YELLOW}请使用: sudo $0 [端口号]${NC}"
        echo -e "${YELLOW}或使用其他端口: $0 8080${NC}"
        exit 1
    fi
}

# 检查是否已经在运行
check_running() {
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  服务已在运行中 (PID: $OLD_PID)${NC}"
            echo -e "${YELLOW}端口: $(lsof -p $OLD_PID -P | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)${NC}"
            echo ""
            read -p "是否停止当前服务并重新启动？ (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}停止当前服务...${NC}"
                kill "$OLD_PID" 2>/dev/null || true
                rm -f "$PID_FILE"
                sleep 2
            else
                exit 0
            fi
        else
            # PID文件存在但进程不存在，清理PID文件
            rm -f "$PID_FILE"
        fi
    fi
}

# 检查端口是否被占用
check_port() {
    local PORT=$1
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}错误: 端口 $PORT 已被占用${NC}"
        echo -e "${YELLOW}当前占用进程:${NC}"
        lsof -Pi :$PORT -sTCP:LISTEN
        echo ""
        echo -e "${YELLOW}请选择其他端口或停止占用进程${NC}"
        exit 1
    fi
}

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

# 安装依赖
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}安装依赖...${NC}"
        npm install
    else
        echo -e "${GREEN}✓ 依赖已存在${NC}"
    fi
    
    if ! command -v serve &> /dev/null; then
        echo -e "${YELLOW}安装 serve...${NC}"
        npm install -g serve
    else
        echo -e "${GREEN}✓ serve 已安装${NC}"
    fi
}

# 构建生产版本
build_production() {
    echo -e "${YELLOW}检查生产构建...${NC}"
    
    if [ ! -d "dist" ] || [ "$FORCE_BUILD" == "true" ]; then
        echo -e "${YELLOW}构建生产版本...${NC}"
        npm run build
        
        if [ ! -d "dist" ]; then
            echo -e "${RED}错误: 构建失败${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ 生产构建已存在${NC}"
        echo -e "${YELLOW}提示: 使用 --build 参数强制重新构建${NC}"
    fi
}

# 获取本机IP
get_local_ip() {
    # macOS获取IP的方法
    if [[ "$OSTYPE" == "darwin"* ]]; then
        LOCAL_IP=$(route get default 2>/dev/null | grep interface | awk '{print $2}' | xargs ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    else
        # Linux获取IP的方法
        LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP=$(ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
    
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP="localhost"
    fi
}

# 启动后台服务
start_daemon() {
    local PORT=$1
    echo -e "${YELLOW}启动后台服务 (端口 $PORT)...${NC}"
    
    # 启动serve并将输出重定向到日志文件
    nohup npx serve -s dist -l $PORT > "$LOG_FILE" 2>&1 &
    local PID=$!
    
    # 保存PID
    echo $PID > "$PID_FILE"
    
    # 等待服务启动
    sleep 2
    
    # 检查服务是否成功启动
    if ps -p $PID > /dev/null; then
        echo -e "${GREEN}✓ 服务已在后台启动${NC}"
        echo -e "${GREEN}PID: $PID${NC}"
        echo -e "${GREEN}日志文件: $LOG_FILE${NC}"
    else
        echo -e "${RED}错误: 服务启动失败${NC}"
        echo -e "${YELLOW}查看日志: tail -f $LOG_FILE${NC}"
        rm -f "$PID_FILE"
        exit 1
    fi
}

# 显示访问信息
show_info() {
    local PORT=$1
    get_local_ip
    
    echo ""
    echo -e "${GREEN}===========================================${NC}"
    echo -e "${GREEN}         后台服务启动成功！${NC}"
    echo -e "${GREEN}===========================================${NC}"
    echo ""
    echo -e "${BLUE}访问地址:${NC}"
    echo -e "  本机访问: ${GREEN}http://localhost:$PORT${NC}"
    if [ "$LOCAL_IP" != "localhost" ]; then
        echo -e "  局域网访问: ${GREEN}http://$LOCAL_IP:$PORT${NC}"
    fi
    echo ""
    echo -e "${BLUE}服务管理:${NC}"
    echo -e "  查看状态: ${YELLOW}./service-status.sh${NC}"
    echo -e "  查看日志: ${YELLOW}tail -f $LOG_FILE${NC}"
    echo -e "  停止服务: ${YELLOW}./service-stop.sh${NC}"
    echo -e "  重启服务: ${YELLOW}./service-restart.sh${NC}"
    echo ""
    echo -e "${BLUE}进程信息:${NC}"
    echo -e "  PID: ${GREEN}$(cat $PID_FILE)${NC}"
    echo -e "  PID文件: ${GREEN}$PID_FILE${NC}"
    echo ""
}

# 解析参数
PORT=8080
FORCE_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            FORCE_BUILD=true
            shift
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        [0-9]*)
            PORT="$1"
            shift
            ;;
        --help)
            echo "使用方法: $0 [选项] [端口号]"
            echo ""
            echo "选项:"
            echo "  --port PORT    指定端口号 (默认: 8080)"
            echo "  --build        强制重新构建"
            echo "  --help         显示帮助信息"
            echo ""
            echo "示例:"
            echo "  $0              # 使用默认端口8080"
            echo "  $0 3000         # 使用端口3000"
            echo "  $0 --port 80    # 使用端口80 (需要sudo)"
            echo "  $0 --build      # 强制重新构建并启动"
            exit 0
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            echo "使用 --help 查看帮助"
            exit 1
            ;;
    esac
done

# 主执行流程
main() {
    check_sudo $PORT
    check_running
    check_port $PORT
    check_dependencies
    install_dependencies
    build_production
    start_daemon $PORT
    show_info $PORT
    
    echo -e "${GREEN}🎉 后台服务已成功启动！${NC}"
}

# 错误处理
trap 'echo -e "\n${RED}启动失败${NC}"; exit 1' ERR

# 执行
main