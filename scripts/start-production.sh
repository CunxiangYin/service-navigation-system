#!/bin/bash

# 服务导航系统 - 生产环境启动脚本
# 端口: 80 (局域网访问)

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
echo -e "${BLUE}     服务导航系统 - 生产环境启动中...${NC}"
echo -e "${BLUE}===========================================${NC}"

# 检查是否以root权限运行（80端口需要）
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}错误: 80端口需要root权限，请使用 sudo 运行此脚本${NC}"
    echo -e "${YELLOW}使用方法: sudo ./scripts/start-production.sh${NC}"
    exit 1
fi

# 检查端口是否被占用
check_port() {
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}错误: 端口80已被占用${NC}"
        echo -e "${YELLOW}请先停止占用80端口的服务，或运行停止脚本:${NC}"
        echo -e "${YELLOW}sudo ./scripts/stop-production.sh${NC}"
        exit 1
    fi
}

# 检查Node.js和npm
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
    
    echo -e "${GREEN}✓ Node.js 版本: $(node --version)${NC}"
    echo -e "${GREEN}✓ npm 版本: $(npm --version)${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${YELLOW}安装项目依赖...${NC}"
    
    if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
        npm install
    else
        echo -e "${GREEN}✓ 依赖已安装${NC}"
    fi
}

# 构建生产版本
build_production() {
    echo -e "${YELLOW}构建生产版本...${NC}"
    
    # 清理之前的构建
    if [ -d "dist" ]; then
        rm -rf dist
    fi
    
    # 设置生产环境变量
    export NODE_ENV=production
    export VITE_HOST=0.0.0.0
    export VITE_PORT=80
    
    # 构建
    npm run build
    
    if [ ! -d "dist" ]; then
        echo -e "${RED}错误: 构建失败，未找到 dist 目录${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 构建完成${NC}"
}

# 创建systemd服务文件
create_systemd_service() {
    echo -e "${YELLOW}创建系统服务...${NC}"
    
    # 创建服务文件
    cat > /etc/systemd/system/service-nav.service << EOF
[Unit]
Description=Service Navigation System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_ROOT
ExecStart=/usr/bin/npx serve -s dist -l 80 --host 0.0.0.0
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# 日志
StandardOutput=journal
StandardError=journal
SyslogIdentifier=service-nav

[Install]
WantedBy=multi-user.target
EOF

    # 重载systemd配置
    systemctl daemon-reload
    echo -e "${GREEN}✓ 系统服务已创建${NC}"
}

# 安装serve（如果没有）
install_serve() {
    if ! command -v npx serve &> /dev/null; then
        echo -e "${YELLOW}安装 serve 工具...${NC}"
        npm install -g serve
    fi
}

# 启动服务
start_service() {
    echo -e "${YELLOW}启动服务...${NC}"
    
    # 启用并启动服务
    systemctl enable service-nav
    systemctl start service-nav
    
    # 等待服务启动
    sleep 3
    
    # 检查服务状态
    if systemctl is-active --quiet service-nav; then
        echo -e "${GREEN}✓ 服务启动成功${NC}"
    else
        echo -e "${RED}错误: 服务启动失败${NC}"
        echo -e "${YELLOW}查看日志: journalctl -u service-nav -f${NC}"
        exit 1
    fi
}

# 获取本机IP地址
get_local_ip() {
    # 优先获取局域网IP
    LOCAL_IP=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' || hostname -I | awk '{print $1}')
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP="localhost"
    fi
}

# 显示访问信息
show_access_info() {
    get_local_ip
    
    echo ""
    echo -e "${GREEN}===========================================${NC}"
    echo -e "${GREEN}         服务启动成功！${NC}"
    echo -e "${GREEN}===========================================${NC}"
    echo ""
    echo -e "${BLUE}访问地址:${NC}"
    echo -e "  本机访问: ${GREEN}http://localhost${NC}"
    echo -e "  局域网访问: ${GREEN}http://$LOCAL_IP${NC}"
    echo ""
    echo -e "${BLUE}管理命令:${NC}"
    echo -e "  查看状态: ${YELLOW}sudo systemctl status service-nav${NC}"
    echo -e "  查看日志: ${YELLOW}sudo journalctl -u service-nav -f${NC}"
    echo -e "  重启服务: ${YELLOW}sudo systemctl restart service-nav${NC}"
    echo -e "  停止服务: ${YELLOW}sudo ./scripts/stop-production.sh${NC}"
    echo ""
    echo -e "${BLUE}防火墙设置:${NC}"
    echo -e "  如果无法访问，可能需要开放80端口:"
    echo -e "  ${YELLOW}sudo ufw allow 80${NC}"
    echo -e "  ${YELLOW}sudo firewall-cmd --permanent --add-port=80/tcp${NC}"
    echo -e "  ${YELLOW}sudo firewall-cmd --reload${NC}"
    echo ""
}

# 主执行流程
main() {
    echo -e "${YELLOW}开始启动生产环境...${NC}"
    
    check_port
    check_dependencies
    install_dependencies
    build_production
    install_serve
    create_systemd_service
    start_service
    show_access_info
    
    echo -e "${GREEN}🎉 生产环境启动完成！${NC}"
}

# 错误处理
trap 'echo -e "${RED}启动过程中发生错误，正在清理...${NC}"; systemctl stop service-nav 2>/dev/null || true; exit 1' ERR

# 执行主函数
main