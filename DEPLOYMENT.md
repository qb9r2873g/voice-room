# 部署指南 - 匿名语音聊天室

本指南将帮助您将语音聊天室应用部署到 Vercel + Supabase。

## 前置要求

- GitHub 账户
- Vercel 账户
- Supabase 账户

## 第一步：设置 Supabase 数据库

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 点击 "New project"
3. 选择组织并填写项目信息：
   - Name: `voice-room`
   - Database Password: 设置一个强密码
   - Region: 选择离您最近的区域

### 2. 设置数据库架构

1. 在 Supabase 控制台中，转到 "SQL Editor"
2. 创建新查询，复制 `supabase-schema.sql` 文件的全部内容
3. 点击 "Run" 执行 SQL
4. 确认所有表都已创建（meetings, participants, signaling_messages）

### 3. 获取 API 密钥

1. 转到 "Settings" > "API"
2. 复制以下信息：
   - Project URL
   - anon public key

## 第二步：部署到 Vercel

### 1. 推送代码到 GitHub

```bash
# 如果还没有初始化 git
git init
git add .
git commit -m "Initial commit: Voice Room App"

# 在 GitHub 上创建新仓库，然后：
git remote add origin https://github.com/YOUR_USERNAME/voice-room.git
git push -u origin main
```

### 2. 连接 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 从 GitHub 导入您的仓库
4. 项目设置：
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. 配置环境变量

在 Vercel 部署设置中添加环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 部署

点击 "Deploy" 开始部署。

## 第三步：本地开发设置

### 1. 安装依赖

```bash
npm install
```

### 2. 环境变量

复制 `.env.local.example` 为 `.env.local`：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件，填入您的 Supabase 配置：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

## 第四步：测试应用

### 1. 创建会议

1. 访问部署的应用
2. 点击 "创建会议"
3. 填写会议信息并创建

### 2. 测试语音通话

1. 在不同的浏览器/设备中打开同一个会议
2. 允许麦克风权限
3. 测试语音通话功能

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 Supabase URL 和 API 密钥是否正确
   - 确认数据库架构已正确创建

2. **语音通话无法连接**
   - 确保浏览器已允许麦克风权限
   - 检查网络防火墙设置
   - 在 HTTPS 环境下测试（本地可能需要 localhost）
   - **中国大陆用户**：应用已配置中国大陆友好的 ICE 服务器（腾讯云、阿里云）

3. **ICE 服务器连接问题**
   - 应用配置了多个 ICE 服务器，包括中国大陆友好的服务器
   - Google STUN 服务器在中国大陆可能不可用，但已配置为备用选项
   - 详细的 ICE 服务器配置说明请参考 [ICE_SERVERS.md](./ICE_SERVERS.md)


4. **部署失败**
   - 检查环境变量是否正确设置
   - 查看 Vercel 构建日志获取详细错误信息

### 调试步骤

1. 打开浏览器开发者工具
2. 查看 Console 和 Network 标签
3. 检查 API 调用是否成功
4. 验证 WebRTC 连接状态

## 性能优化

### 生产环境建议

1. **CDN 优化**：Vercel 自动提供 CDN
2. **数据库优化**：Supabase 提供连接池
3. **缓存策略**：Next.js 自动优化静态资源

### 监控和日志

1. Vercel 提供实时日志和分析
2. Supabase 提供数据库性能监控
3. 使用浏览器开发者工具监控 WebRTC 连接

## 安全考虑

1. **密码保护**：会议密码使用 bcrypt 加密
2. **HTTPS**：Vercel 自动提供 SSL 证书
3. **环境变量**：敏感信息通过环境变量管理

## 扩展功能

未来可以添加的功能：

1. 用户注册和登录
2. 会议录制
3. 屏幕共享
4. 文字聊天
5. 会议室背景
6. 管理员面板

---

如有问题，请检查：
- [Vercel 文档](https://vercel.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Next.js 文档](https://nextjs.org/docs)