#!/bin/bash

# 服务导航系统 - 状态检查脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取本机IP地址
get_local_ip() {
    LOCAL_IP=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' || hostname -I | awk '{print $1}')
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP="localhost"
    fi
}

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}     服务导航系统 - 状态检查${NC}"
echo -e "${BLUE}===========================================${NC}"

# 检查系统服务状态
echo -e "${YELLOW}📋 系统服务状态:${NC}"
if systemctl list-unit-files | grep -q "service-nav.service"; then
    if systemctl is-active --quiet service-nav; then
        echo -e "${GREEN}✓ 服务正在运行${NC}"
        SERVICE_STATUS="running"
    else
        echo -e "${RED}✗ 服务已停止${NC}"
        SERVICE_STATUS="stopped"
    fi
    
    if systemctl is-enabled --quiet service-nav; then
        echo -e "${GREEN}✓ 开机自启已启用${NC}"
    else
        echo -e "${YELLOW}⚠ 开机自启未启用${NC}"
    fi
else
    echo -e "${RED}✗ 系统服务未安装${NC}"
    SERVICE_STATUS="not_installed"
fi

echo ""

# 检查端口占用
echo -e "${YELLOW}🌐 端口状态:${NC}"
if lsof -Pi :80 -sTCP:LISTEN >/dev/null 2>&1; then
    PORT_PID=$(lsof -ti:80 2>/dev/null)
    PORT_PROCESS=$(ps -p $PORT_PID -o comm= 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ 端口80正在被使用${NC}"
    echo -e "  进程ID: $PORT_PID"
    echo -e "  进程名: $PORT_PROCESS"
else
    echo -e "${RED}✗ 端口80未被占用${NC}"
fi

echo ""

# 检查网络连通性
echo -e "${YELLOW}🔗 网络连通性测试:${NC}"
get_local_ip

# 测试本地连接
if curl -s --max-time 3 http://localhost:80 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 本地访问正常 (http://localhost)${NC}"
else
    echo -e "${RED}✗ 本地访问失败${NC}"
fi

# 测试局域网连接
if [ "$LOCAL_IP" != "localhost" ]; then
    if curl -s --max-time 3 http://$LOCAL_IP:80 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ 局域网访问正常 (http://$LOCAL_IP)${NC}"
    else
        echo -e "${RED}✗ 局域网访问失败${NC}"
    fi
fi

echo ""

# 检查项目文件
echo -e "${YELLOW}📁 项目文件状态:${NC}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$PROJECT_ROOT/package.json" ]; then
    echo -e "${GREEN}✓ package.json 存在${NC}"
else
    echo -e "${RED}✗ package.json 缺失${NC}"
fi

if [ -d "$PROJECT_ROOT/dist" ]; then
    echo -e "${GREEN}✓ dist 目录存在 (生产构建)${NC}"
    DIST_SIZE=$(du -sh "$PROJECT_ROOT/dist" | cut -f1)
    echo -e "  构建大小: $DIST_SIZE"
else
    echo -e "${RED}✗ dist 目录不存在 (需要构建)${NC}"
fi

if [ -d "$PROJECT_ROOT/node_modules" ]; then
    echo -e "${GREEN}✓ node_modules 存在${NC}"
else
    echo -e "${RED}✗ node_modules 缺失 (需要安装依赖)${NC}"
fi

echo ""

# 检查日志
echo -e "${YELLOW}📊 最近日志 (最后10行):${NC}"
if systemctl list-unit-files | grep -q "service-nav.service"; then
    journalctl -u service-nav --no-pager -n 10 --since "1 hour ago" 2>/dev/null || echo -e "${YELLOW}暂无日志${NC}"
else
    echo -e "${YELLOW}服务未安装，无日志可查看${NC}"
fi

echo ""

# 提供操作建议
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}         操作建议${NC}"
echo -e "${BLUE}===========================================${NC}"

if [ "$SERVICE_STATUS" = "running" ]; then
    echo -e "${GREEN}✅ 服务运行正常${NC}"
    echo ""
    echo -e "${BLUE}访问地址:${NC}"
    echo -e "  本机: ${GREEN}http://localhost${NC}"
    echo -e "  局域网: ${GREEN}http://$LOCAL_IP${NC}"
    echo ""
    echo -e "${BLUE}管理命令:${NC}"
    echo -e "  查看实时日志: ${YELLOW}sudo journalctl -u service-nav -f${NC}"
    echo -e "  重启服务: ${YELLOW}sudo systemctl restart service-nav${NC}"
    echo -e "  停止服务: ${YELLOW}sudo ./scripts/stop-production.sh${NC}"
elif [ "$SERVICE_STATUS" = "stopped" ]; then
    echo -e "${YELLOW}⚠️ 服务已安装但未运行${NC}"
    echo ""
    echo -e "${BLUE}启动命令:${NC}"
    echo -e "  启动服务: ${YELLOW}sudo systemctl start service-nav${NC}"
    echo -e "  或重新部署: ${YELLOW}sudo ./scripts/start-production.sh${NC}"
else
    echo -e "${RED}❌ 服务未安装${NC}"
    echo ""
    echo -e "${BLUE}安装命令:${NC}"
    echo -e "  部署生产环境: ${YELLOW}sudo ./scripts/start-production.sh${NC}"
fi

echo ""