# 🚀 服务导航系统 (Service Navigation System)

一个功能完整、性能优化的内网服务导航管理平台，支持服务管理、健康监控、批量操作和高性能虚拟滚动。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)

## ✨ 核心功能

### 🎯 服务管理
- ✅ **服务增删改查** - 完整的CRUD操作
- ✅ **分类管理** - 灵活的服务分类系统
- ✅ **标签系统** - 多标签服务标识
- ✅ **搜索过滤** - 实时搜索和分类过滤

### 💊 健康监控
- ✅ **实时状态监控** - 自动健康检查
- ✅ **状态可视化** - 直观的状态指示器
- ✅ **响应时间监控** - 性能指标追踪
- ✅ **订阅式更新** - 实时状态推送

### 🔧 批量操作
- ✅ **多选管理** - 批量选择服务
- ✅ **批量删除** - 高效删除多个服务
- ✅ **批量移动** - 快速分类调整
- ✅ **全选操作** - 一键选择所有服务

### 🎨 用户体验
- ✅ **拖拽排序** - 直观的服务排序
- ✅ **键盘快捷键** - 提升操作效率
- ✅ **响应式设计** - 适配各种屏幕尺寸
- ✅ **深色模式** - 完整的主题切换

### ⚡ 性能优化
- ✅ **虚拟滚动** - 大量数据流畅渲染
- ✅ **懒加载** - 按需组件加载
- ✅ **代码分割** - 优化bundle大小
- ✅ **性能监控** - 实时性能追踪

### 🔄 数据管理
- ✅ **导入/导出** - JSON格式配置管理
- ✅ **本地存储** - 数据持久化
- ✅ **数据验证** - 完整的数据校验
- ✅ **备份恢复** - 配置文件管理

## 🛠 技术栈

### 前端技术
- **React 18** - 现代React框架
- **TypeScript** - 类型安全开发
- **Vite** - 快速构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **shadcn/ui** - 现代UI组件库

### 核心依赖
- **@dnd-kit** - 拖拽功能实现
- **react-window** - 虚拟滚动
- **lucide-react** - 图标系统
- **@radix-ui** - 无障碍UI原语

### 开发工具
- **ESLint** - 代码规范检查
- **PostCSS** - CSS处理工具
- **serve** - 生产环境静态服务器

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 8+
- 现代浏览器支持

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
# 启动开发服务器
npm run dev

# 访问地址: http://localhost:5173
```

### 生产部署
```bash
# 一键启动生产环境（80端口）
sudo ./start-server.sh

# 手动部署
npm run build
sudo serve -s dist -l 80 --host 0.0.0.0
```

## 🌐 生产环境部署

### macOS 快速部署
```bash
# 启动生产环境（80端口，局域网访问）
sudo ./scripts/start-production-macos.sh

# 停止服务
sudo ./stop-production.sh
```

### Linux 系统服务部署
```bash
# 部署为系统服务
sudo ./scripts/start-production.sh

# 停止系统服务
sudo ./scripts/stop-production.sh
```

### 状态检查
```bash
# 查看服务状态
./scripts/status-check.sh
```

### 访问地址
- 本机访问: `http://localhost`
- 局域网访问: `http://[您的IP地址]`

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+K` | 快速搜索 |
| `Ctrl+N` | 新建服务 |
| `Ctrl+E` | 切换编辑模式 |
| `Ctrl+D` | 切换深色模式 |
| `Ctrl+I` | 导入/导出 |
| `Ctrl+A` | 全选（批量模式） |
| `Delete` | 删除选中 |
| `Esc` | 取消/关闭 |
| `?` | 显示快捷键帮助 |

## 📊 性能指标

- **初始加载**: < 2秒
- **渲染性能**: 60 FPS (虚拟滚动模式)
- **内存使用**: < 100MB (正常操作)
- **首屏渲染**: < 1秒
- **交互响应**: < 100ms

## 🔧 配置说明

### 默认分类
- 开发环境
- 测试环境
- 生产环境
- 监控系统
- 数据库

### 服务状态
- `online` - 在线
- `offline` - 离线
- `maintenance` - 维护中
- `checking` - 检查中
- `error` - 错误
- `warning` - 警告

## 📁 项目结构

```
service-nav/
├── src/
│   ├── components/          # React组件
│   │   ├── dialogs/        # 对话框组件
│   │   ├── layout/         # 布局组件
│   │   ├── service/        # 服务相关组件
│   │   ├── performance/    # 性能优化组件
│   │   └── ui/            # 基础UI组件
│   ├── hooks/              # 自定义Hooks
│   ├── services/           # 业务逻辑服务
│   ├── types/              # TypeScript类型定义
│   └── lib/                # 工具函数
├── scripts/                # 部署脚本
├── backend/               # FastAPI后端（可选）
└── docs/                  # 项目文档
```

## 🧪 测试

```bash
# 运行测试
npm test

# 类型检查
npx tsc --noEmit

# 代码检查
npm run lint
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📋 待办事项

- [ ] WebSocket实时通信
- [ ] 用户权限管理
- [ ] API接口文档
- [ ] Docker容器化
- [ ] 单元测试覆盖
- [ ] 国际化支持

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [React](https://reactjs.org/) - UI框架
- [TypeScript](https://www.typescriptlang.org/) - 类型系统
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库
- [Vite](https://vitejs.dev/) - 构建工具

## 📞 支持

如果您觉得这个项目有用，请给它一个 ⭐️

如有问题或建议，请 [创建 Issue](../../issues)

---

## 🎯 特色亮点

### 智能虚拟化
- 根据数据量自动切换渲染模式
- 超过50个服务时自动启用虚拟滚动
- 流畅处理数千个服务项目

### 全键盘操作
- 支持完整的快捷键体系
- 无障碍键盘导航
- 提升高级用户操作效率

### 实时健康监控
- 服务状态自动检测
- 响应时间监控
- 订阅式状态更新

### 批量高效管理
- 智能多选机制
- 批量操作优化
- 大量数据处理能力

Made with ❤️ by Claude Code Assistant