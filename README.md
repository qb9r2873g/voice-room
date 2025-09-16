# 匿名语音聊天室 (Anonymous Voice Room)

一个基于 Next.js + Supabase + WebRTC 的实时语音聊天应用，类似在线会议功能。

## ✨ 功能特点

- 🎙️ **实时语音通话**：基于 WebRTC P2P 技术，低延迟语音通信
- 🔒 **密码保护**：创建私密会议，支持密码验证
- 👥 **多人会议**：支持最多 10 人同时参与
- 🎯 **简单易用**：无需注册，设置昵称即可加入
- 🔇 **静音控制**：用户可以静音自己，主持人可以静音他人
- 📱 **响应式设计**：支持桌面和移动设备
- 🌐 **公开会议**：可创建公开会议供他人搜索加入

## 🏗️ 技术架构

### 前端技术栈
- **框架**：Next.js 15 + React 19 + TypeScript
- **样式**：Tailwind CSS
- **状态管理**：React Context + useReducer
- **表单处理**：React Hook Form + Zod 验证
- **实时通信**：WebRTC + 自定义信令服务

### 后端技术栈
- **数据库**：Supabase PostgreSQL
- **API**：Next.js API Routes
- **部署**：Vercel
- **身份验证**：密码加密 (bcrypt)

### 核心功能
- **P2P 语音通话**：直接点对点连接，减少服务器负载
- **信令服务**：通过数据库实现 WebRTC 信令协调
- **会议管理**：创建、加入、离开、结束会议
- **实时同步**：参与者状态实时更新

## 📋 页面结构

### 1. 首页 (`/`)
- 搜索正在进行的会议
- 展示公开会议列表
- 会议密码验证和加入

### 2. 创建会议页 (`/create`)
- 设置会议名称
- 配置会议密码
- 选择是否公开
- 设置最大参与人数

### 3. 会议房间页 (`/meeting/[id]`)
- 实时语音通话
- 参与者列表
- 静音/取消静音控制
- 主持人管理功能

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd voice-room
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量模板：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件，填入 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 数据库设置

1. 在 Supabase 中创建新项目
2. 在 SQL Editor 中运行 `supabase-schema.sql` 文件
3. 获取项目 URL 和 API 密钥

### 5. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

## 📱 使用指南

### 创建会议
1. 点击首页的 "创建会议" 按钮
2. 填写会议信息（名称、密码、是否公开等）
3. 创建成功后获得会议号和直接加入链接

### 加入会议
1. 在首页搜索会议或从公开列表选择
2. 输入会议密码（如果需要）
3. 设置您的昵称
4. 允许浏览器麦克风权限
5. 开始语音通话

### 会议控制
- **静音/取消静音**：点击麦克风图标
- **离开会议**：点击挂断按钮
- **主持人功能**：可以静音他人或结束会议

## 🛠️ 部署

详细部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/voice-room)

## 📊 项目结构

```
voice-room/
├── src/
│   ├── app/
│   │   ├── api/                 # API 路由
│   │   ├── create/              # 创建会议页
│   │   ├── meeting/             # 会议房间页
│   │   └── page.tsx             # 首页
│   ├── components/              # React 组件
│   ├── contexts/                # React Context
│   ├── hooks/                   # 自定义 Hooks
│   ├── lib/                     # 工具库
│   └── types/                   # TypeScript 类型
├── public/                      # 静态资源
├── supabase-schema.sql          # 数据库架构
├── DEPLOYMENT.md                # 部署指南
└── README.md                    # 项目说明
```

## 🔧 开发

### 可用脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run type-check   # TypeScript 类型检查
```

### 开发工具

- **ESLint**：代码质量检查
- **TypeScript**：类型安全
- **Prettier**：代码格式化

## 🚧 待开发功能

- [ ] 用户注册和登录系统
- [ ] 会议录制功能
- [ ] 屏幕共享
- [ ] 文字聊天
- [ ] 会议室背景设置
- [ ] 管理员面板
- [ ] 移动端优化
- [ ] 国际化支持

## 🐛 问题报告

如果您遇到问题，请：

1. 检查浏览器控制台错误
2. 确认麦克风权限已允许
3. 验证环境变量配置
4. 查看网络连接状态

常见问题解决方案请参考 [DEPLOYMENT.md](./DEPLOYMENT.md#故障排除)

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 后端即服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [WebRTC](https://webrtc.org/) - 实时通信技术
