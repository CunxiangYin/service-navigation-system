#!/bin/bash

# 服务导航系统 - 统一生产环境管理脚本
# 支持 start, stop, restart, status 等操作

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

# PID文件和日志文件路径
PID_FILE="$PROJECT_ROOT/.service-nav.pid"
LOG_FILE="$PROJECT_ROOT/service-nav.log"

# 默认端口
DEFAULT_PORT=80
PORT=$DEFAULT_PORT
FORCE_BUILD=false

# 显示帮助信息
show_help() {
    echo "使用方法: $0 {start|stop|restart|status} [选项]"
    echo ""
    echo "命令:"
    echo "  start    启动服务"
    echo "  stop     停止服务"
    echo "  restart  重启服务"
    echo "  status   查看服务状态"
    echo ""
    echo "选项:"
    echo "  --port PORT    指定端口号 (默认: 80)"
    echo "  --build        强制重新构建 (仅用于 start/restart)"
    echo "  --daemon       后台运行模式 (仅用于 start/restart)"
    echo "  --help         显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start                  # 前台启动服务，使用默认端口80"
    echo "  $0 start --daemon         # 后台启动服务"
    echo "  $0 start --port 8080      # 使用8080端口启动"
    echo "  $0 start --build          # 重新构建并启动"
    echo "  $0 stop                   # 停止服务"
    echo "  $0 restart                # 重启服务"
    echo "  $0 status                 # 查看服务状态"
}

# 检查是否以root权限运行（80端口需要）
check_sudo() {
    if [ "$1" == "80" ] && [ "$EUID" -ne 0 ]; then
        echo -e "${RED}错误: 80端口需要管理员权限${NC}"
        echo -e "${YELLOW}请使用: sudo $0 $COMMAND [选项]${NC}"
        echo -e "${YELLOW}或使用其他端口: $0 $COMMAND --port 8080${NC}"
        exit 1
    fi
}

# 检查端口是否被占用
check_port() {
    local PORT=$1
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        local PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t 2>/dev/null | head -1)
        # 检查是否是我们自己的服务
        if [ -f "$PID_FILE" ] && [ "$(cat $PID_FILE)" == "$PID" ]; then
            return 0
        fi
        echo -e "${RED}错误: 端口 $PORT 已被占用${NC}"
        echo -e "${YELLOW}当前占用进程:${NC}"
        lsof -Pi :$PORT -sTCP:LISTEN
        return 1
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
        echo -e "${GREEN}✓ 构建完成${NC}"
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

# 启动服务（前台模式）
start_foreground() {
    local PORT=$1
    echo -e "${YELLOW}启动前台服务 (端口 $PORT)...${NC}"
    
    get_local_ip
    
    echo ""
    echo -e "${GREEN}===========================================${NC}"
    echo -e "${GREEN}         服务启动成功！${NC}"
    echo -e "${GREEN}===========================================${NC}"
    echo ""
    echo -e "${BLUE}访问地址:${NC}"
    echo -e "  本机访问: ${GREEN}http://localhost:$PORT${NC}"
    if [ "$LOCAL_IP" != "localhost" ]; then
        echo -e "  局域网访问: ${GREEN}http://$LOCAL_IP:$PORT${NC}"
    fi
    echo ""
    echo -e "${YELLOW}服务运行中... (按 Ctrl+C 停止)${NC}"
    echo ""
    
    # 启动服务器
    npx serve -s dist -l $PORT
}

# 启动服务（后台模式）
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
        echo -e "  查看状态: ${YELLOW}$0 status${NC}"
        echo -e "  查看日志: ${YELLOW}tail -f $LOG_FILE${NC}"
        echo -e "  停止服务: ${YELLOW}$0 stop${NC}"
        echo -e "  重启服务: ${YELLOW}$0 restart${NC}"
        echo ""
    else
        echo -e "${RED}错误: 服务启动失败${NC}"
        echo -e "${YELLOW}查看日志: tail -f $LOG_FILE${NC}"
        rm -f "$PID_FILE"
        exit 1
    fi
}

# 启动服务
do_start() {
    # 检查是否已经在运行
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  服务已在运行中 (PID: $OLD_PID)${NC}"
            echo -e "${YELLOW}请先停止服务: $0 stop${NC}"
            exit 1
        else
            # PID文件存在但进程不存在，清理PID文件
            rm -f "$PID_FILE"
        fi
    fi
    
    check_sudo $PORT
    check_port $PORT
    check_dependencies
    install_dependencies
    build_production
    
    if [ "$DAEMON_MODE" == "true" ]; then
        start_daemon $PORT
    else
        start_foreground $PORT
    fi
}

# 停止服务
do_stop() {
    echo -e "${YELLOW}停止服务...${NC}"
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}停止进程 (PID: $PID)...${NC}"
            kill "$PID"
            
            # 等待进程结束
            for i in {1..10}; do
                if ! ps -p "$PID" > /dev/null 2>&1; then
                    break
                fi
                sleep 1
            done
            
            # 如果进程仍在运行，强制终止
            if ps -p "$PID" > /dev/null 2>&1; then
                echo -e "${YELLOW}强制终止进程...${NC}"
                kill -9 "$PID" 2>/dev/null || true
            fi
            
            rm -f "$PID_FILE"
            echo -e "${GREEN}✓ 服务已停止${NC}"
        else
            echo -e "${YELLOW}进程不存在 (PID: $PID)${NC}"
            rm -f "$PID_FILE"
        fi
    else
        echo -e "${YELLOW}服务未运行（未找到PID文件）${NC}"
        
        # 尝试查找并停止serve进程
        SERVE_PID=$(pgrep -f "serve.*dist" 2>/dev/null || true)
        if [ -n "$SERVE_PID" ]; then
            echo -e "${YELLOW}发现serve进程 (PID: $SERVE_PID)，正在停止...${NC}"
            kill $SERVE_PID 2>/dev/null || true
            echo -e "${GREEN}✓ 已停止serve进程${NC}"
        fi
    fi
    
    # 清理日志文件（可选）
    if [ -f "$LOG_FILE" ]; then
        echo -e "${YELLOW}日志文件保留在: $LOG_FILE${NC}"
    fi
}

# 重启服务
do_restart() {
    echo -e "${BLUE}重启服务...${NC}"
    do_stop
    sleep 2
    do_start
}

# 查看服务状态
do_status() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}         服务导航系统 - 状态检查${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo ""
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 服务运行中${NC}"
            echo -e "  PID: ${GREEN}$PID${NC}"
            
            # 获取端口信息
            PORT_INFO=$(lsof -p $PID -P 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
            if [ -n "$PORT_INFO" ]; then
                echo -e "  端口: ${GREEN}$PORT_INFO${NC}"
            fi
            
            # 获取进程信息
            echo -e "  进程信息:"
            ps -p $PID -o pid,ppid,user,%cpu,%mem,etime,command | sed 's/^/    /'
            
            # 显示访问地址
            get_local_ip
            echo ""
            echo -e "${BLUE}访问地址:${NC}"
            echo -e "  本机: ${GREEN}http://localhost:${PORT_INFO:-80}${NC}"
            if [ "$LOCAL_IP" != "localhost" ]; then
                echo -e "  局域网: ${GREEN}http://$LOCAL_IP:${PORT_INFO:-80}${NC}"
            fi
            
            # 显示日志文件信息
            if [ -f "$LOG_FILE" ]; then
                echo ""
                echo -e "${BLUE}日志文件:${NC} $LOG_FILE"
                echo -e "${YELLOW}查看日志: tail -f $LOG_FILE${NC}"
                
                # 显示最后几行日志
                echo ""
                echo -e "${BLUE}最近日志:${NC}"
                tail -5 "$LOG_FILE" 2>/dev/null | sed 's/^/  /'
            fi
        else
            echo -e "${YELLOW}⚠️  PID文件存在但进程未运行${NC}"
            echo -e "  过期PID: $PID"
            echo -e "  ${YELLOW}建议运行: $0 start${NC}"
        fi
    else
        echo -e "${RED}✗ 服务未运行${NC}"
        echo -e "  ${YELLOW}启动服务: $0 start${NC}"
        
        # 检查是否有其他serve进程
        SERVE_PID=$(pgrep -f "serve.*dist" 2>/dev/null || true)
        if [ -n "$SERVE_PID" ]; then
            echo ""
            echo -e "${YELLOW}⚠️  发现其他serve进程:${NC}"
            ps -p $SERVE_PID -o pid,ppid,user,command | sed 's/^/  /'
        fi
    fi
    
    echo ""
}

# 解析命令
COMMAND=$1
shift || true

# 如果没有命令，显示帮助
if [ -z "$COMMAND" ]; then
    show_help
    exit 0
fi

# 解析选项
DAEMON_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            PORT="$2"
            shift 2
            ;;
        --build)
            FORCE_BUILD=true
            shift
            ;;
        --daemon)
            DAEMON_MODE=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            echo "使用 --help 查看帮助"
            exit 1
            ;;
    esac
done

# 执行命令
case $COMMAND in
    start)
        do_start
        ;;
    stop)
        do_stop
        ;;
    restart)
        do_restart
        ;;
    status)
        do_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}未知命令: $COMMAND${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac