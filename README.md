<div align="center">
<img width="1200" height="475" alt="CineScript AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# CineScript AI

**智能视频分析与脚本生成平台**

基于 Google Gemini API 的 AI 视频内容分析工具，支持视频链接解析与文案描述分析，一键生成专业拍摄脚本。

</div>

---

## 功能特性

### 视频智能分析
- 支持 YouTube / Bilibili / 小红书 视频链接解析
- 支持直接输入视频创意或文案描述
- AI 自动识别视频主题、目标受众、叙事结构

### 深度分析报告
- 核心主题提取
- 目标受众画像
- 叙事结构时间轴（章节、时间戳、功能解析）
- 关键洞察与价值点

### 全量文案整理
- 智能分段的视频文案提取
- 支持一键复制导出

### 专业拍摄脚本
- 自动生成分场景脚本
- 包含场景编号、地点、镜头类型
- 画面描述与音效/对白设计
- 支持一键复制导出

### 付费系统
- 免费试用 3 次
- 按次付费 ¥9.9/次
- 支持微信/支付宝/银行卡支付

### 其他特性
- 深色/浅色主题切换
- 响应式设计（支持移动端/桌面端）
- 开发者模式（仅本地 localhost 可用）

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite 6 + TailwindCSS |
| 后端 | Node.js + Express 4 |
| AI 模型 | Google Gemini API (gemini-2.5-flash / gemini-3-pro-preview) |
| 图标 | Lucide React |
| 支付 | 快支付/易支付聚合接口 |

---

## 快速开始

### 环境要求
- Node.js 18+

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key
# 编辑 .env.local 文件，设置你的 Gemini API Key
GEMINI_API_KEY=your_api_key_here

# 3. 启动后端服务（终端 1）
npm run server

# 4. 启动前端开发服务（终端 2）
npm run dev

# 5. 访问 http://localhost:3000
```

### 构建生产版本

```bash
npm run build
```

---

## 项目结构

```
├── index.tsx          # 前端 React 应用（单文件）
├── index.html         # HTML 入口
├── server/
│   └── index.js       # Express 后端服务
├── vite.config.ts     # Vite 构建配置
├── .env.local         # 环境变量配置
└── package.json       # 依赖配置
```

---

## 环境变量

在 `.env.local` 中配置：

```bash
# 必需
GEMINI_API_KEY=your_gemini_api_key

# 可选 - AI 模型 Key（不设置则使用 GEMINI_API_KEY）
FREE_GENAI_KEY=free_tier_key
PAID_GENAI_KEY=paid_tier_key

# 可选 - 支付配置（生产环境必需）
PAY_MCH_ID=merchant_id
PAY_SIGN_KEY=sign_key
PAY_NOTIFY_URL=https://your-domain.com/api/pay/callback
PAY_RETURN_URL=https://your-domain.com/pay/return
```

---

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/analyze?tier=free\|paid` | POST | 视频分析，body: `{input}` |
| `/api/pay` | POST | 创建支付订单，body: `{channel, count}` |
| `/api/pay/status` | GET | 查询支付状态，query: `orderId` |
| `/api/pay/callback` | POST | 支付回调 |
| `/health` | GET | 健康检查 |

---

## 开源协议

MIT License
