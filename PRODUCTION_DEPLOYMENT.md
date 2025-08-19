# 生产环境部署指南

## 🚀 快速启动

### macOS 系统（推荐）

```bash
# 启动生产环境（80端口，局域网访问）
sudo ./scripts/start-production-macos.sh

# 停止服务
sudo ./stop-production.sh

# 查看状态
./scripts/status-check.sh
```

### Linux 系统（systemd服务）

```bash
# 部署为系统服务
sudo ./scripts/start-production.sh

# 停止系统服务
sudo ./scripts/stop-production.sh

# 查看状态
./scripts/status-check.sh
```

## 📋 部署脚本说明

### 1. start-production-macos.sh
- **用途**: macOS系统生产环境启动
- **特点**: 前台运行，适合开发测试
- **端口**: 80
- **权限**: 需要sudo
- **停止**: Ctrl+C 或运行 `sudo ./stop-production.sh`

### 2. start-production.sh
- **用途**: Linux系统systemd服务部署
- **特点**: 后台服务，开机自启
- **端口**: 80
- **权限**: 需要sudo
- **管理**: systemctl命令

### 3. stop-production.sh
- **用途**: 停止生产环境服务
- **功能**: 
  - 停止系统服务
  - 清理端口占用
  - 可选删除服务文件

### 4. status-check.sh
- **用途**: 检查服务运行状态
- **功能**:
  - 服务状态检查
  - 端口占用检查
  - 网络连通性测试
  - 项目文件检查

## 🌐 访问方式

### 本机访问
```
http://localhost
```

### 局域网访问
```
http://[您的IP地址]
```

### 获取本机IP地址
```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Linux
ip addr show | grep "inet " | grep -v 127.0.0.1
hostname -I
```

## 🔧 系统要求

### 必需软件
- **Node.js** (v16+)
- **npm** (v8+)
- **系统权限** (80端口需要管理员权限)

### 可选软件
- **serve** (自动安装)

## 🛠 部署步骤详解

### 自动部署（推荐）
```bash
# 1. 进入项目目录
cd /Users/jasonyin/project/homepage/service-nav

# 2. 运行部署脚本
sudo ./scripts/start-production-macos.sh
```

### 手动部署
```bash
# 1. 安装依赖
npm install

# 2. 构建生产版本
npm run build

# 3. 安装serve
npm install -g serve

# 4. 启动服务
sudo serve -s dist -l 80 --host 0.0.0.0
```

## 🔒 安全配置

### 防火墙设置

#### macOS
```bash
# 允许80端口
sudo pfctl -f /etc/pf.conf
```

#### Linux (ufw)
```bash
sudo ufw allow 80
sudo ufw reload
```

#### Linux (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

### 权限说明
- **80端口**: 需要管理员权限
- **文件访问**: 脚本会创建必要的服务文件
- **网络访问**: 绑定到 0.0.0.0 允许局域网访问

## 📊 监控和管理

### 查看服务状态
```bash
# 检查服务状态
sudo systemctl status service-nav

# 查看实时日志
sudo journalctl -u service-nav -f

# 检查端口占用
lsof -i :80
```

### 服务管理命令
```bash
# 启动服务
sudo systemctl start service-nav

# 停止服务
sudo systemctl stop service-nav

# 重启服务
sudo systemctl restart service-nav

# 启用开机自启
sudo systemctl enable service-nav

# 禁用开机自启
sudo systemctl disable service-nav
```

## 🐛 故障排除

### 常见问题

#### 1. 端口80被占用
```bash
# 查看占用进程
sudo lsof -i :80

# 终止占用进程
sudo kill -9 [PID]
```

#### 2. 权限不足
```bash
# 确保使用sudo运行
sudo ./scripts/start-production-macos.sh
```

#### 3. 无法访问服务
```bash
# 检查防火墙设置
sudo ufw status

# 检查服务状态
./scripts/status-check.sh
```

#### 4. 构建失败
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build
```

### 日志位置
- **系统日志**: `journalctl -u service-nav`
- **构建日志**: npm构建过程中的输出
- **访问日志**: serve命令的输出

## 📁 生成的文件

部署过程会创建以下文件：

### 系统文件（Linux）
- `/etc/systemd/system/service-nav.service` - systemd服务文件

### 项目文件
- `./dist/` - 生产构建文件
- `./production-server.sh` - 生产服务启动脚本
- `./stop-production.sh` - 服务停止脚本

## 🔄 更新部署

```bash
# 1. 停止当前服务
sudo ./scripts/stop-production.sh

# 2. 拉取最新代码（如果使用git）
git pull

# 3. 重新部署
sudo ./scripts/start-production-macos.sh
```

## 📞 技术支持

如遇到问题，请检查：
1. 运行 `./scripts/status-check.sh` 查看详细状态
2. 查看系统日志了解错误信息
3. 确认网络和防火墙配置
4. 验证Node.js和npm版本

---

## 🎯 部署检查清单

- [ ] Node.js已安装 (v16+)
- [ ] npm已安装 (v8+)
- [ ] 80端口未被占用
- [ ] 具有管理员权限
- [ ] 防火墙已配置
- [ ] 网络连接正常
- [ ] 项目依赖已安装
- [ ] 生产构建成功
- [ ] 服务启动正常
- [ ] 本机访问正常
- [ ] 局域网访问正常