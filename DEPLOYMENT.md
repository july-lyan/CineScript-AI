# CineScript AI 部署指南

## ✅ 最小可行部署完成状态

**完成日期**: 2025-12-09
**部署状态**: MVP 就绪（免费功能可用）

### 已完成的配置

- ✅ 依赖安装完成（216个包）
- ✅ Gemini API Key 已配置
- ✅ 前端构建成功 (dist/ 目录)
- ✅ 后端服务测试通过
- ✅ 前端开发服务器测试通过

### 当前运行状态

```bash
✅ 后端服务: http://localhost:4000 (进程ID: 9a73cc)
✅ 前端开发: http://localhost:3000 (进程ID: 3df4ad)
✅ 生产构建: dist/ 目录已生成
```

---

## 🚀 本地运行指南

### 方式1: 开发模式（推荐用于测试）

在两个终端窗口分别运行：

```bash
# 终端1: 启动后端服务
npm run server
# 输出: Server listening on port 4000

# 终端2: 启动前端开发服务器
npm run dev
# 输出: Local: http://localhost:3000/
```

访问: http://localhost:3000

### 方式2: 生产预览模式

```bash
# 终端1: 启动后端
npm run server

# 终端2: 预览生产构建
npm run preview
```

---

## 📦 生产部署方案

### 方案A: Vercel (推荐 - 最简单)

**前端部署 (Vercel)**:
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录并部署前端
cd /Users/july/Documents/视频分析和脚本输出
vercel

# 配置说明:
# - Framework: Vite
# - Build Command: npm run build
# - Output Directory: dist
```

**后端部署 (Vercel Serverless)**:
- 需要将 server/index.js 改造为 Serverless Functions
- 或单独部署到 Railway/Render

### 方案B: 传统服务器 (阿里云/腾讯云)

#### 1. 准备服务器环境

```bash
# SSH 连接到服务器
ssh root@your-server-ip

# 安装 Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2（进程管理）
npm install -g pm2

# 安装 Nginx
sudo apt-get install nginx
```

#### 2. 上传项目文件

```bash
# 在本地执行
# 上传后端文件
scp -r server package.json package-lock.json .env.local root@your-server:/var/www/cinescript-api/

# 上传前端构建文件
scp -r dist root@your-server:/var/www/cinescript-frontend/
```

#### 3. 配置后端服务

```bash
# SSH 到服务器
cd /var/www/cinescript-api/
npm install --production

# 使用 PM2 启动后端
pm2 start server/index.js --name cinescript-api
pm2 save
pm2 startup
```

#### 4. 配置 Nginx

创建配置文件: `/etc/nginx/sites-available/cinescript`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/cinescript-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置:
```bash
sudo ln -s /etc/nginx/sites-available/cinescript /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. 配置 HTTPS (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔧 环境变量配置

### 当前配置 (.env.local)
```bash
GEMINI_API_KEY=AIzaSyDyRHwVzwklBPXmrn4eQ1EJ97bfX74hCaA
```

### 生产环境推荐配置

创建 `.env.production`:

```bash
# Gemini API Keys
GEMINI_API_KEY=your_production_key
FREE_GENAI_KEY=your_free_tier_key
PAID_GENAI_KEY=your_paid_tier_key

# Server Config
PORT=4000
NODE_ENV=production

# Payment (生产必需 - 目前未配置)
PAY_MCH_ID=your_merchant_id
PAY_SIGN_KEY=your_sign_key
PAY_API_BASE=https://data.kuaizhifu.cn
PAY_NOTIFY_URL=https://your-domain.com/api/pay/callback
PAY_RETURN_URL=https://your-domain.com

# 价格配置
PAY_PER_USE_PRICE=9.9
FREE_USAGE_LIMIT=3
```

---

## ⚠️ 当前限制（MVP版本）

### 可用功能 ✅
- ✅ 视频分析和脚本生成
- ✅ 免费试用 3 次
- ✅ 主题切换（深色/浅色）
- ✅ 一键复制功能
- ✅ 开发者模式（本地Mac）

### 不可用功能 ❌
- ❌ **支付功能** (配置为测试值，无法实际收款)
- ❌ **数据持久化** (重启后数据丢失)
- ❌ **用户账户系统** (基于localStorage)

### 风险提示 ⚠️
1. **数据会丢失**: 用户额度和订单存储在内存中，服务重启即清空
2. **无法扩展**: 单实例运行，不支持负载均衡
3. **支付不可用**: 当前配置无法接收真实支付

---

## 🔍 测试清单

### 本地测试（开发模式）

访问 http://localhost:3000 并测试：

- [ ] 页面正常加载，UI显示正常
- [ ] 输入视频链接或描述，点击"解锁并生成"
- [ ] AI 分析正常返回结果
- [ ] 三栏布局正确显示（文案/分析/脚本）
- [ ] 复制按钮功能正常
- [ ] 深色/浅色模式切换正常
- [ ] 免费次数计数正常（3次后提示付费）
- [ ] 开发者模式显示（仅本地Mac）

### 示例测试输入

```
描述1: 一个关于如何制作咖啡拉花的教学视频，时长约5分钟，目标受众是咖啡爱好者

描述2: https://www.bilibili.com/video/BV1xx411c7mu (配合视频标题使用)

描述3: 一个旅行vlog，记录在京都的3天2夜之旅，包括清水寺、伏见稻荷大社等景点
```

---

## 📊 监控和日志

### 查看后端日志

```bash
# 开发模式
# 直接在终端查看输出

# 生产模式（PM2）
pm2 logs cinescript-api
pm2 monit
```

### 关键指标监控

```bash
# 后端健康检查
curl http://localhost:4000/health
# 期望返回: ok

# 前端健康检查
curl http://localhost:3000/
# 期望返回: HTML内容
```

---

## 🛑 停止服务

### 停止当前后台进程

```bash
# 查看后台进程
ps aux | grep node

# 或使用 bash ID
# 后端: 9a73cc
# 前端: 3df4ad

# 停止进程（如果需要）
# kill -9 <process_id>
```

### 生产环境（PM2）

```bash
pm2 stop cinescript-api
pm2 restart cinescript-api
pm2 delete cinescript-api
```

---

## 📞 下一步建议

### 立即可做
1. ✅ 在本地测试所有功能
2. ✅ 使用真实视频链接测试 AI 分析
3. ✅ 验证免费3次限制工作正常

### 短期优化（1周内）
1. 注册支付商户账号（易支付/快支付）
2. 选择数据库方案（MongoDB Atlas 免费版）
3. 选择部署平台（Vercel/Railway/自有服务器）

### 中期优化（1个月内）
1. 集成真实支付功能
2. 添加数据库持久化
3. 配置生产域名和HTTPS
4. 添加限流和安全措施

---

## 📂 项目文件结构

```
视频分析和脚本输出/
├── dist/                    # 生产构建文件 ✅
│   ├── index.html
│   └── assets/
│       └── index-ygH9_FMz.js
├── server/                  # 后端服务
│   └── index.js            # Express服务器
├── node_modules/           # 依赖包 ✅
├── .env.local             # 环境变量 ✅
├── package.json           # 依赖配置
├── index.tsx              # 前端入口
├── index.html             # HTML模板
├── vite.config.ts         # Vite配置
├── claude.md              # 项目分析报告
├── DEPLOYMENT.md          # 本文档
└── README.md              # 项目说明

✅ = 已配置/已生成
```

---

## 🆘 常见问题

### Q: API Key无效或额度不足？
A: 访问 https://aistudio.google.com/app/apikey 检查API Key状态和配额

### Q: 端口被占用？
A: 修改 vite.config.ts (前端) 或 server/index.js (后端) 中的端口号

### Q: 免费次数用完后如何重置？
A: 打开开发者工具(F12) → Application → Local Storage → 清除相关键值
或在本地Mac上点击页脚版权文字启用开发者模式，点击"Reset App State"

### Q: 生产环境如何配置支付？
A: 参考 claude.md 中的"支付服务配置"章节，需要真实商户号和密钥

---

**部署文档生成时间**: 2025-12-09 15:30
**下次更新**: 添加支付功能后
