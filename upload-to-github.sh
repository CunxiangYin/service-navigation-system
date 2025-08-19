#!/bin/bash

# GitHub上传脚本

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 服务导航系统 - GitHub上传脚本${NC}"
echo ""

# 检查是否已配置远程仓库
if git remote get-url origin &>/dev/null; then
    echo -e "${GREEN}✓ 远程仓库已配置${NC}"
    echo -e "远程仓库: $(git remote get-url origin)"
    echo ""
    
    # 询问是否推送
    read -p "是否推送到GitHub？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}推送代码到GitHub...${NC}"
        git push -u origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ 上传成功！${NC}"
            echo -e "仓库地址: $(git remote get-url origin)"
        else
            echo -e "${RED}❌ 上传失败${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  未配置远程仓库${NC}"
    echo ""
    echo -e "${BLUE}请先在GitHub创建仓库，然后运行：${NC}"
    echo ""
    echo -e "${YELLOW}git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git${NC}"
    echo -e "${YELLOW}git push -u origin main${NC}"
    echo ""
    echo -e "${BLUE}或者手动输入仓库URL：${NC}"
    read -p "GitHub仓库URL (https://github.com/username/repo.git): " REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        echo -e "${YELLOW}配置远程仓库...${NC}"
        git remote add origin "$REPO_URL"
        
        echo -e "${YELLOW}推送代码到GitHub...${NC}"
        git push -u origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ 上传成功！${NC}"
            echo -e "仓库地址: $REPO_URL"
        else
            echo -e "${RED}❌ 上传失败${NC}"
            echo -e "${YELLOW}请检查仓库URL和权限设置${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}已取消${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📋 下一步操作：${NC}"
echo -e "1. 在GitHub仓库页面添加描述和标签"
echo -e "2. 设置仓库可见性（公开/私有）"
echo -e "3. 创建Release版本（推荐v1.0.0）"
echo -e "4. 添加README徽章和截图"