#!/bin/bash

# 添加示例服务的脚本

API_URL="http://localhost:8001/api/services/add"

echo "添加示例服务到服务导航系统..."

# 添加开发环境服务
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "dev-api-1",
    "name": "开发API服务器",
    "url": "http://192.168.1.100:3000",
    "description": "主开发环境的API服务器",
    "category": "1",
    "status": "online",
    "tags": ["API", "REST", "开发"]
  }' 2>/dev/null

echo "✓ 添加开发API服务器"

# 添加测试环境服务
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-api-1",
    "name": "测试环境API",
    "url": "http://test-api.local:8000",
    "description": "测试环境API服务",
    "category": "2",
    "status": "online",
    "tags": ["测试", "API", "QA"]
  }' 2>/dev/null

echo "✓ 添加测试环境API"

# 添加生产环境服务
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "prod-lb-1",
    "name": "生产负载均衡器",
    "url": "https://lb.production.com",
    "description": "生产环境负载均衡入口",
    "category": "3",
    "status": "online",
    "tags": ["负载均衡", "生产", "高可用"]
  }' 2>/dev/null

echo "✓ 添加生产负载均衡器"

# 添加监控系统
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "monitor-grafana-1",
    "name": "Grafana监控",
    "url": "http://grafana.local:3000",
    "description": "系统性能监控仪表板",
    "category": "4",
    "status": "online",
    "tags": ["监控", "可视化", "指标"]
  }' 2>/dev/null

echo "✓ 添加Grafana监控"

# 添加数据库服务
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "db-mysql-1",
    "name": "MySQL主数据库",
    "url": "mysql://192.168.1.50:3306",
    "description": "主数据库服务器",
    "category": "5",
    "status": "online",
    "tags": ["数据库", "MySQL", "存储"]
  }' 2>/dev/null

echo "✓ 添加MySQL数据库"

# 添加Redis缓存
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cache-redis-1",
    "name": "Redis缓存服务",
    "url": "redis://192.168.1.60:6379",
    "description": "分布式缓存服务",
    "category": "5",
    "status": "online",
    "tags": ["缓存", "Redis", "NoSQL"]
  }' 2>/dev/null

echo "✓ 添加Redis缓存"

# 添加文档工具
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "doc-swagger-1",
    "name": "Swagger API文档",
    "url": "http://api-docs.local/swagger",
    "description": "API接口文档",
    "category": "6",
    "status": "online",
    "tags": ["文档", "API", "Swagger"]
  }' 2>/dev/null

echo "✓ 添加Swagger文档"

# 添加开发工具
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tool-jenkins-1",
    "name": "Jenkins CI/CD",
    "url": "http://jenkins.local:8080",
    "description": "持续集成和部署平台",
    "category": "7",
    "status": "online",
    "tags": ["CI/CD", "自动化", "构建"]
  }' 2>/dev/null

echo "✓ 添加Jenkins CI/CD"

# 添加GitLab
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tool-gitlab-1",
    "name": "GitLab代码仓库",
    "url": "http://gitlab.local",
    "description": "内部代码版本管理系统",
    "category": "7",
    "status": "online",
    "tags": ["Git", "版本控制", "代码管理"]
  }' 2>/dev/null

echo "✓ 添加GitLab"

# 添加Kibana
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "monitor-kibana-1",
    "name": "Kibana日志查看",
    "url": "http://kibana.local:5601",
    "description": "ELK日志分析平台",
    "category": "4",
    "status": "online",
    "tags": ["日志", "分析", "ELK"]
  }' 2>/dev/null

echo "✓ 添加Kibana日志"

echo ""
echo "✅ 示例服务添加完成！"
echo "请刷新页面查看"