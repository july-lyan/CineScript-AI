# Vercel 部署指南

## 📋 前置准备

✅ 代码已推送到 GitHub: https://github.com/july-lyan/CineScript-AI.git
✅ Vercel Serverless Functions 已配置
✅ API 端点已就绪

---

## 🚀 部署步骤

### 1. 登录 Vercel

访问: https://vercel.com

- 使用 GitHub 账号登录（推荐）
- 授权 Vercel 访问你的 GitHub 仓库

### 2. 导入项目

1. 点击 "Add New..." → "Project"
2. 从列表中选择 `july-lyan/CineScript-AI`
3. 点击 "Import"

### 3. 配置项目

**Framework Preset**: 自动检测为 Vite ✅

**Root Directory**: `.` (默认)

**Build Command**: `npm run build` (自动填充)

**Output Directory**: `dist` (自动填充)

### 4. 配置环境变量（重要！）

在 "Environment Variables" 部分添加：

```
GEMINI_API_KEY=AIzaSyDyRHwVzwklBPXmrn4eQ1EJ97bfX74hCaA
```

**可选环境变量**（如果要分离免费/付费 Key）:
```
FREE_GENAI_KEY=your_free_key
PAID_GENAI_KEY=your_paid_key
```

**支付配置**（生产环境需要）:
```
PAY_MCH_ID=your_merchant_id
PAY_SIGN_KEY=your_sign_key
PAY_API_BASE=https://data.kuaizhifu.cn
PAY_NOTIFY_URL=https://your-app.vercel.app/api/pay/callback
PAY_RETURN_URL=https://your-app.vercel.app
PAY_PER_USE_PRICE=9.9
FREE_USAGE_LIMIT=3
```

### 5. 开始部署

点击 "Deploy" 按钮

⏱️ 部署通常需要 2-5 分钟

---

## ✅ 部署后验证

### 1. 检查构建日志

确保没有错误，应该看到：
```
✓ Build successful
✓ Serverless Functions deployed
```

### 2. 访问你的应用

Vercel 会自动分配一个域名：
```
https://cine-script-ai-xxx.vercel.app
```

### 3. 测试功能

- [ ] 页面正常加载
- [ ] 输入视频链接或描述
- [ ] 点击"解锁并生成"
- [ ] AI 分析正常返回结果
- [ ] 免费次数计数工作（3次后提示付费）
- [ ] 主题切换正常
- [ ] 复制功能正常

### 4. 测试 API 端点

```bash
# 健康检查（如果有的话）
curl https://your-app.vercel.app/api/analyze

# 测试分析接口
curl -X POST https://your-app.vercel.app/api/analyze?tier=free \
  -H "Content-Type: application/json" \
  -d '{"input":"测试视频描述"}'
```

---

## ⚠️ 常见问题

### Q1: 构建失败 "Module not found"
**A**: 确保所有依赖在 package.json 中，运行 `npm install` 检查

### Q2: API 返回 500 错误
**A**: 检查环境变量是否正确配置，特别是 `GEMINI_API_KEY`

### Q3: API 调用超时
**A**: Vercel Serverless Functions 默认超时 10s，已在 vercel.json 中设置为 60s

### Q4: CORS 错误
**A**: 已在每个 API 函数中配置 CORS 头，应该不会出现此问题

### Q5: 国内访问慢
**A**: 这是预期的，Vercel 服务器在国外。如需快速访问，参考 DEPLOYMENT.md 的阿里云方案

---

## 🔧 高级配置

### 自定义域名

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的域名（例如：cinescript.com）
3. 按提示配置 DNS 记录

### 环境变量更新

1. 进入项目 → Settings → Environment Variables
2. 修改或添加新变量
3. 需要重新部署才能生效：Deployments → 最新部署 → "Redeploy"

### 查看日志

1. 进入项目 → Deployments
2. 点击任意部署查看构建日志
3. Functions 标签页查看 API 调用日志

---

## 📊 监控和分析

Vercel 提供免费的分析功能：

- **Analytics**: 访问量、性能指标
- **Logs**: API 调用日志、错误追踪
- **Speed Insights**: 页面加载性能

---

## 💰 成本预估

Vercel **Hobby 计划**（免费）:
- ✅ 无限静态部署
- ✅ 100GB 带宽/月
- ✅ Serverless Functions: 100GB-Hrs/月
- ✅ 足够个人项目使用

**注意**:
- Gemini API 调用按 Google 计费（每次 ~¥0.01-0.05）
- 如果流量大，可能需要升级 Vercel Pro（$20/月）

---

## 🔄 后续更新

### 自动部署

已经配置好！每次推送到 GitHub main 分支，Vercel 会自动重新部署。

```bash
# 本地修改代码后
git add .
git commit -m "Update: xxx"
git push origin main

# Vercel 自动开始部署
```

### 手动重新部署

1. 进入 Vercel 项目
2. Deployments → 最新部署
3. 点击右侧 "..." → "Redeploy"

---

## 📞 技术支持

如遇问题：
1. 查看 Vercel 构建日志
2. 检查 Functions 日志
3. 参考 claude.md 和 DEPLOYMENT.md
4. Vercel 文档: https://vercel.com/docs

---

**部署时间**: 2025-12-09
**预计上线时间**: 5 分钟内
