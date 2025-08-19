#!/bin/bash

# 服务导航系统 - 统一生产环境管理脚本
# 支持前后端一起启动

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
FRONTEND_PID_FILE="$PROJECT_ROOT/.service-nav-frontend.pid"
BACKEND_PID_FILE="$PROJECT_ROOT/.service-nav-backend.pid"
FRONTEND_LOG_FILE="$PROJECT_ROOT/service-nav-frontend.log"
BACKEND_LOG_FILE="$PROJECT_ROOT/service-nav-backend.log"

# 默认端口
DEFAULT_FRONTEND_PORT=80
DEFAULT_BACKEND_PORT=8000
FRONTEND_PORT=$DEFAULT_FRONTEND_PORT
BACKEND_PORT=$DEFAULT_BACKEND_PORT
FORCE_BUILD=false
ENABLE_BACKEND=true
ENABLE_FRONTEND=true

# 显示帮助信息
show_help() {
    echo "使用方法: $0 {start|stop|restart|status} [选项]"
    echo ""
    echo "命令:"
    echo "  start    启动服务（默认同时启动前后端）"
    echo "  stop     停止服务"
    echo "  restart  重启服务"
    echo "  status   查看服务状态"
    echo ""
    echo "选项:"
    echo "  --frontend-port PORT   前端端口 (默认: 80)"
    echo "  --backend-port PORT    后端端口 (默认: 8000)"
    echo "  --frontend-only        仅启动前端"
    echo "  --backend-only         仅启动后端"
    echo "  --build                强制重新构建前端"
    echo "  --daemon               后台运行模式"
    echo "  --help                 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start                        # 同时启动前后端"
    echo "  $0 start --daemon               # 后台启动前后端"
    echo "  $0 start --frontend-only        # 仅启动前端"
    echo "  $0 start --backend-only         # 仅启动后端"
    echo "  $0 start --frontend-port 3000   # 指定前端端口"
    echo "  $0 stop                         # 停止所有服务"
    echo "  $0 status                       # 查看服务状态"
}

# 检查是否以root权限运行（80端口需要）
check_sudo() {
    if [ "$1" == "80" ] && [ "$EUID" -ne 0 ]; then
        echo -e "${RED}错误: 80端口需要管理员权限${NC}"
        echo -e "${YELLOW}请使用: sudo $0 $COMMAND [选项]${NC}"
        echo -e "${YELLOW}或使用其他端口: $0 $COMMAND --frontend-port 8080${NC}"
        exit 1
    fi
}

# 检查端口是否被占用
check_port() {
    local PORT=$1
    local SERVICE=$2
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        local PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t 2>/dev/null | head -1)
        # 检查是否是我们自己的服务
        if [ "$SERVICE" == "frontend" ] && [ -f "$FRONTEND_PID_FILE" ] && [ "$(cat $FRONTEND_PID_FILE)" == "$PID" ]; then
            return 0
        fi
        if [ "$SERVICE" == "backend" ] && [ -f "$BACKEND_PID_FILE" ] && [ "$(cat $BACKEND_PID_FILE)" == "$PID" ]; then
            return 0
        fi
        echo -e "${RED}错误: 端口 $PORT 已被占用 ($SERVICE)${NC}"
        echo -e "${YELLOW}当前占用进程:${NC}"
        lsof -Pi :$PORT -sTCP:LISTEN
        return 1
    fi
}

# 检查Python依赖（后端）
check_python_dependencies() {
    echo -e "${YELLOW}检查Python依赖...${NC}"
    
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}错误: 未找到 Python3${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Python: $(python3 --version)${NC}"
    
    # 检查虚拟环境
    if [ ! -d "backend/venv" ]; then
        echo -e "${YELLOW}创建Python虚拟环境...${NC}"
        cd backend
        python3 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        cd ..
    fi
}

# 检查Node依赖（前端）
check_node_dependencies() {
    echo -e "${YELLOW}检查Node.js依赖...${NC}"
    
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

# 安装后端依赖
install_backend_dependencies() {
    if [ ! -d "backend" ]; then
        echo -e "${YELLOW}后端目录不存在，跳过后端设置${NC}"
        ENABLE_BACKEND=false
        return
    fi
    
    echo -e "${YELLOW}安装后端依赖...${NC}"
    cd backend
    
    if [ -f "requirements.txt" ]; then
        source venv/bin/activate
        pip install -r requirements.txt
        echo -e "${GREEN}✓ 后端依赖安装完成${NC}"
    else
        echo -e "${YELLOW}未找到 requirements.txt，跳过后端依赖安装${NC}"
    fi
    
    cd ..
}

# 安装前端依赖
install_frontend_dependencies() {
    echo -e "${YELLOW}安装前端依赖...${NC}"
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo -e "${GREEN}✓ 前端依赖已存在${NC}"
    fi
    
    if ! command -v serve &> /dev/null; then
        echo -e "${YELLOW}安装 serve...${NC}"
        npm install -g serve
    else
        echo -e "${GREEN}✓ serve 已安装${NC}"
    fi
}

# 构建前端生产版本
build_frontend() {
    echo -e "${YELLOW}检查前端生产构建...${NC}"
    
    if [ ! -d "build" ] || [ "$FORCE_BUILD" == "true" ]; then
        echo -e "${YELLOW}构建前端生产版本...${NC}"
        npm run build
        
        if [ ! -d "build" ]; then
            echo -e "${RED}错误: 前端构建失败${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ 前端构建完成${NC}"
    else
        echo -e "${GREEN}✓ 前端生产构建已存在${NC}"
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

# 启动后端服务（后台）
start_backend_daemon() {
    if [ "$ENABLE_BACKEND" != "true" ]; then
        return
    fi
    
    if [ ! -d "backend" ]; then
        echo -e "${YELLOW}后端目录不存在，跳过后端启动${NC}"
        return
    fi
    
    echo -e "${YELLOW}启动后端服务 (端口 $BACKEND_PORT)...${NC}"
    
    cd backend
    source venv/bin/activate
    
    # 启动FastAPI后端
    nohup python -m uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > "$BACKEND_LOG_FILE" 2>&1 &
    local PID=$!
    
    # 保存PID
    echo $PID > "$BACKEND_PID_FILE"
    
    cd ..
    
    # 等待服务启动
    sleep 3
    
    # 检查服务是否成功启动
    if ps -p $PID > /dev/null; then
        echo -e "${GREEN}✓ 后端服务已启动 (PID: $PID)${NC}"
    else
        echo -e "${RED}错误: 后端服务启动失败${NC}"
        echo -e "${YELLOW}查看日志: tail -f $BACKEND_LOG_FILE${NC}"
        rm -f "$BACKEND_PID_FILE"
        return 1
    fi
}

# 启动前端服务（后台）
start_frontend_daemon() {
    if [ "$ENABLE_FRONTEND" != "true" ]; then
        return
    fi
    
    echo -e "${YELLOW}启动前端服务 (端口 $FRONTEND_PORT)...${NC}"
    
    # 启动前端服务
    nohup npx serve -s build -l $FRONTEND_PORT > "$FRONTEND_LOG_FILE" 2>&1 &
    local PID=$!
    
    # 保存PID
    echo $PID > "$FRONTEND_PID_FILE"
    
    # 等待服务启动
    sleep 2
    
    # 检查服务是否成功启动
    if ps -p $PID > /dev/null; then
        echo -e "${GREEN}✓ 前端服务已启动 (PID: $PID)${NC}"
    else
        echo -e "${RED}错误: 前端服务启动失败${NC}"
        echo -e "${YELLOW}查看日志: tail -f $FRONTEND_LOG_FILE${NC}"
        rm -f "$FRONTEND_PID_FILE"
        return 1
    fi
}

# 启动前端服务（前台）
start_frontend_foreground() {
    if [ "$ENABLE_FRONTEND" != "true" ]; then
        return
    fi
    
    echo -e "${YELLOW}启动前端服务 (端口 $FRONTEND_PORT)...${NC}"
    
    get_local_ip
    
    echo ""
    echo -e "${GREEN}===========================================${NC}"
    echo -e "${GREEN}         前端服务启动成功！${NC}"
    echo -e "${GREEN}===========================================${NC}"
    echo ""
    echo -e "${BLUE}前端访问地址:${NC}"
    echo -e "  本机访问: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
    if [ "$LOCAL_IP" != "localhost" ]; then
        echo -e "  局域网访问: ${GREEN}http://$LOCAL_IP:$FRONTEND_PORT${NC}"
    fi
    
    if [ "$ENABLE_BACKEND" == "true" ] && [ -d "backend" ]; then
        echo ""
        echo -e "${BLUE}后端API地址:${NC}"
        echo -e "  本机访问: ${GREEN}http://localhost:$BACKEND_PORT${NC}"
        echo -e "  API文档: ${GREEN}http://localhost:$BACKEND_PORT/docs${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}前端服务运行中... (按 Ctrl+C 停止)${NC}"
    echo ""
    
    # 启动前端服务器
    npx serve -s build -l $FRONTEND_PORT
}

# 启动服务
do_start() {
    # 检查前端是否已经在运行
    if [ "$ENABLE_FRONTEND" == "true" ] && [ -f "$FRONTEND_PID_FILE" ]; then
        OLD_PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  前端服务已在运行中 (PID: $OLD_PID)${NC}"
            echo -e "${YELLOW}请先停止服务: $0 stop${NC}"
            exit 1
        else
            rm -f "$FRONTEND_PID_FILE"
        fi
    fi
    
    # 检查后端是否已经在运行
    if [ "$ENABLE_BACKEND" == "true" ] && [ -f "$BACKEND_PID_FILE" ]; then
        OLD_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  后端服务已在运行中 (PID: $OLD_PID)${NC}"
            echo -e "${YELLOW}请先停止服务: $0 stop${NC}"
            exit 1
        else
            rm -f "$BACKEND_PID_FILE"
        fi
    fi
    
    # 检查端口
    if [ "$ENABLE_FRONTEND" == "true" ]; then
        check_sudo $FRONTEND_PORT
        check_port $FRONTEND_PORT "frontend"
    fi
    
    if [ "$ENABLE_BACKEND" == "true" ]; then
        check_port $BACKEND_PORT "backend"
    fi
    
    # 安装依赖和构建
    if [ "$ENABLE_FRONTEND" == "true" ]; then
        check_node_dependencies
        install_frontend_dependencies
        build_frontend
    fi
    
    if [ "$ENABLE_BACKEND" == "true" ]; then
        check_python_dependencies
        install_backend_dependencies
    fi
    
    # 启动服务
    if [ "$DAEMON_MODE" == "true" ]; then
        # 后台模式：先启动后端，再启动前端
        if [ "$ENABLE_BACKEND" == "true" ]; then
            start_backend_daemon
        fi
        
        if [ "$ENABLE_FRONTEND" == "true" ]; then
            start_frontend_daemon
        fi
        
        # 显示访问信息
        get_local_ip
        echo ""
        echo -e "${GREEN}===========================================${NC}"
        echo -e "${GREEN}         服务启动成功！${NC}"
        echo -e "${GREEN}===========================================${NC}"
        echo ""
        
        if [ "$ENABLE_FRONTEND" == "true" ]; then
            echo -e "${BLUE}前端访问地址:${NC}"
            echo -e "  本机: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
            if [ "$LOCAL_IP" != "localhost" ]; then
                echo -e "  局域网: ${GREEN}http://$LOCAL_IP:$FRONTEND_PORT${NC}"
            fi
        fi
        
        if [ "$ENABLE_BACKEND" == "true" ] && [ -d "backend" ]; then
            echo ""
            echo -e "${BLUE}后端API地址:${NC}"
            echo -e "  本机: ${GREEN}http://localhost:$BACKEND_PORT${NC}"
            echo -e "  API文档: ${GREEN}http://localhost:$BACKEND_PORT/docs${NC}"
        fi
        
        echo ""
        echo -e "${BLUE}服务管理:${NC}"
        echo -e "  查看状态: ${YELLOW}$0 status${NC}"
        echo -e "  查看前端日志: ${YELLOW}tail -f $FRONTEND_LOG_FILE${NC}"
        if [ "$ENABLE_BACKEND" == "true" ]; then
            echo -e "  查看后端日志: ${YELLOW}tail -f $BACKEND_LOG_FILE${NC}"
        fi
        echo -e "  停止服务: ${YELLOW}$0 stop${NC}"
        echo -e "  重启服务: ${YELLOW}$0 restart${NC}"
        echo ""
    else
        # 前台模式：先启动后端（后台），再启动前端（前台）
        if [ "$ENABLE_BACKEND" == "true" ]; then
            start_backend_daemon
        fi
        
        if [ "$ENABLE_FRONTEND" == "true" ]; then
            start_frontend_foreground
        fi
    fi
}

# 停止服务
do_stop() {
    echo -e "${YELLOW}停止服务...${NC}"
    
    # 停止前端服务
    if [ -f "$FRONTEND_PID_FILE" ]; then
        PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}停止前端服务 (PID: $PID)...${NC}"
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
                echo -e "${YELLOW}强制终止前端进程...${NC}"
                kill -9 "$PID" 2>/dev/null || true
            fi
            
            rm -f "$FRONTEND_PID_FILE"
            echo -e "${GREEN}✓ 前端服务已停止${NC}"
        else
            echo -e "${YELLOW}前端进程不存在 (PID: $PID)${NC}"
            rm -f "$FRONTEND_PID_FILE"
        fi
    else
        echo -e "${YELLOW}前端服务未运行（未找到PID文件）${NC}"
    fi
    
    # 停止后端服务
    if [ -f "$BACKEND_PID_FILE" ]; then
        PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}停止后端服务 (PID: $PID)...${NC}"
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
                echo -e "${YELLOW}强制终止后端进程...${NC}"
                kill -9 "$PID" 2>/dev/null || true
            fi
            
            rm -f "$BACKEND_PID_FILE"
            echo -e "${GREEN}✓ 后端服务已停止${NC}"
        else
            echo -e "${YELLOW}后端进程不存在 (PID: $PID)${NC}"
            rm -f "$BACKEND_PID_FILE"
        fi
    else
        echo -e "${YELLOW}后端服务未运行（未找到PID文件）${NC}"
    fi
    
    # 尝试查找并停止其他相关进程
    SERVE_PID=$(pgrep -f "serve.*build" 2>/dev/null || true)
    if [ -n "$SERVE_PID" ]; then
        echo -e "${YELLOW}发现serve进程 (PID: $SERVE_PID)，正在停止...${NC}"
        kill $SERVE_PID 2>/dev/null || true
        echo -e "${GREEN}✓ 已停止serve进程${NC}"
    fi
    
    UVICORN_PID=$(pgrep -f "uvicorn.*main:app" 2>/dev/null || true)
    if [ -n "$UVICORN_PID" ]; then
        echo -e "${YELLOW}发现uvicorn进程 (PID: $UVICORN_PID)，正在停止...${NC}"
        kill $UVICORN_PID 2>/dev/null || true
        echo -e "${GREEN}✓ 已停止uvicorn进程${NC}"
    fi
    
    # 保留日志文件信息
    if [ -f "$FRONTEND_LOG_FILE" ] || [ -f "$BACKEND_LOG_FILE" ]; then
        echo -e "${YELLOW}日志文件保留在:${NC}"
        [ -f "$FRONTEND_LOG_FILE" ] && echo -e "  前端: $FRONTEND_LOG_FILE"
        [ -f "$BACKEND_LOG_FILE" ] && echo -e "  后端: $BACKEND_LOG_FILE"
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
    
    # 检查前端服务状态
    echo -e "${BLUE}前端服务状态:${NC}"
    if [ -f "$FRONTEND_PID_FILE" ]; then
        PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓ 运行中${NC}"
            echo -e "  PID: ${GREEN}$PID${NC}"
            
            # 获取端口信息
            PORT_INFO=$(lsof -p $PID -P 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
            if [ -n "$PORT_INFO" ]; then
                echo -e "  端口: ${GREEN}$PORT_INFO${NC}"
            fi
            
            # 显示日志文件信息
            if [ -f "$FRONTEND_LOG_FILE" ]; then
                echo -e "  日志: $FRONTEND_LOG_FILE"
            fi
        else
            echo -e "  ${YELLOW}⚠️  PID文件存在但进程未运行${NC}"
            echo -e "  过期PID: $PID"
        fi
    else
        echo -e "  ${RED}✗ 未运行${NC}"
    fi
    
    # 检查后端服务状态
    echo ""
    echo -e "${BLUE}后端服务状态:${NC}"
    if [ ! -d "backend" ]; then
        echo -e "  ${YELLOW}后端目录不存在${NC}"
    elif [ -f "$BACKEND_PID_FILE" ]; then
        PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓ 运行中${NC}"
            echo -e "  PID: ${GREEN}$PID${NC}"
            
            # 获取端口信息
            PORT_INFO=$(lsof -p $PID -P 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
            if [ -n "$PORT_INFO" ]; then
                echo -e "  端口: ${GREEN}$PORT_INFO${NC}"
                echo -e "  API文档: ${GREEN}http://localhost:$PORT_INFO/docs${NC}"
            fi
            
            # 显示日志文件信息
            if [ -f "$BACKEND_LOG_FILE" ]; then
                echo -e "  日志: $BACKEND_LOG_FILE"
            fi
        else
            echo -e "  ${YELLOW}⚠️  PID文件存在但进程未运行${NC}"
            echo -e "  过期PID: $PID"
        fi
    else
        echo -e "  ${RED}✗ 未运行${NC}"
    fi
    
    # 显示访问地址
    get_local_ip
    echo ""
    echo -e "${BLUE}访问地址:${NC}"
    
    # 前端地址
    if [ -f "$FRONTEND_PID_FILE" ]; then
        PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            PORT_INFO=$(lsof -p $PID -P 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
            if [ -n "$PORT_INFO" ]; then
                echo -e "  前端本机: ${GREEN}http://localhost:${PORT_INFO}${NC}"
                if [ "$LOCAL_IP" != "localhost" ]; then
                    echo -e "  前端局域网: ${GREEN}http://$LOCAL_IP:${PORT_INFO}${NC}"
                fi
            fi
        fi
    fi
    
    # 后端地址
    if [ -f "$BACKEND_PID_FILE" ]; then
        PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            PORT_INFO=$(lsof -p $PID -P 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
            if [ -n "$PORT_INFO" ]; then
                echo -e "  后端API: ${GREEN}http://localhost:${PORT_INFO}${NC}"
                echo -e "  API文档: ${GREEN}http://localhost:${PORT_INFO}/docs${NC}"
            fi
        fi
    fi
    
    # 显示管理命令
    echo ""
    echo -e "${BLUE}管理命令:${NC}"
    echo -e "  启动服务: ${YELLOW}$0 start${NC}"
    echo -e "  停止服务: ${YELLOW}$0 stop${NC}"
    echo -e "  重启服务: ${YELLOW}$0 restart${NC}"
    
    # 显示日志查看命令
    if [ -f "$FRONTEND_LOG_FILE" ] || [ -f "$BACKEND_LOG_FILE" ]; then
        echo ""
        echo -e "${BLUE}查看日志:${NC}"
        [ -f "$FRONTEND_LOG_FILE" ] && echo -e "  前端日志: ${YELLOW}tail -f $FRONTEND_LOG_FILE${NC}"
        [ -f "$BACKEND_LOG_FILE" ] && echo -e "  后端日志: ${YELLOW}tail -f $BACKEND_LOG_FILE${NC}"
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
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        --backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --frontend-only)
            ENABLE_BACKEND=false
            shift
            ;;
        --backend-only)
            ENABLE_FRONTEND=false
            shift
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