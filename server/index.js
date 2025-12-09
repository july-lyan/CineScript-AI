import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import express from "express";
import cors from "cors";
import crypto from "crypto";
import querystring from "querystring";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 4000;

// Env placeholders — 请在部署时配置
// 默认值使用用户提供的测试信息，生产请务必改为环境变量
const PAY_MCH_ID = process.env.PAY_MCH_ID || "1221";
const PAY_SIGN_KEY =
  process.env.PAY_SIGN_KEY || "UB9bu7KKX3bA9gZOk43OxRVl7Z4fsVK7";
const PAY_API_BASE =
  process.env.PAY_API_BASE || "https://data.kuaizhifu.cn";
const PAY_NOTIFY_URL =
  process.env.PAY_NOTIFY_URL || "https://your-domain.com/api/pay/callback";
const PAY_RETURN_URL =
  process.env.PAY_RETURN_URL || "https://your-domain.com/pay/return";
const PAY_PER_USE_PRICE = Number(process.env.PAY_PER_USE_PRICE || 9.9);
const FREE_USAGE_LIMIT = Number(process.env.FREE_USAGE_LIMIT || 3);
const FREE_GENAI_KEY = process.env.FREE_GENAI_KEY || process.env.GEMINI_API_KEY;
const PAID_GENAI_KEY = process.env.PAID_GENAI_KEY || process.env.GEMINI_API_KEY;

// In-memory stores (demo only; replace with DB/Redis in production)
const orders = new Map(); // orderId -> { status, count, channel, amount, sessionId, sign }
const userState = new Map(); // sessionId -> { freeUsed, credits }

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const getSessionId = (req) => req.headers["x-session-id"] || req.ip || "anonymous";

const ensureUser = (sessionId) => {
  if (!userState.has(sessionId)) {
    userState.set(sessionId, { freeUsed: 0, credits: 0 });
  }
  return userState.get(sessionId);
};

// MD5 签名（彩虹/易支付常规方式）
const buildSign = (params) => {
  const sorted = Object.keys(params)
    .filter(
      (k) =>
        params[k] !== undefined &&
        params[k] !== null &&
        params[k] !== "" &&
        k !== "sign"
    )
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const str = `${sorted}${PAY_SIGN_KEY ? "&" + PAY_SIGN_KEY : ""}`;
  return crypto.createHash("md5").update(str, "utf8").digest("hex");
};

const verifySign = (params, sign) => buildSign(params) === sign;

// 生成支付链接（GET 提交，前端可用二维码展示）
const createEasyPayOrder = async ({ orderId, channel, amount, clientIp }) => {
  const payload = {
    pid: PAY_MCH_ID,
    type: channel, // alipay/wechat
    out_trade_no: orderId,
    notify_url: PAY_NOTIFY_URL,
    return_url: PAY_RETURN_URL,
    name: "CineScript AI 按次付费",
    money: amount,
    clientip: clientIp || "",
    sign_type: "MD5",
  };
  const sign = buildSign(payload);
  const query = querystring.stringify({ ...payload, sign });
  const payUrl = `${PAY_API_BASE}/submit.php?${query}`;
  return {
    payUrl,
    qrUrl: payUrl,
    raw: payload,
  };
};

app.post("/api/pay", async (req, res) => {
  try {
    const { channel = "alipay", count = 1 } = req.body || {};
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const amount = Number((count * PAY_PER_USE_PRICE).toFixed(2));

    const { qrUrl, payUrl, raw } = await createEasyPayOrder({
      orderId,
      channel,
      amount,
      clientIp: req.ip,
    });

    orders.set(orderId, {
      status: "pending",
      channel,
      count,
      amount,
      sessionId: getSessionId(req),
      raw,
    });

    res.json({ orderId, amount, qrUrl, payUrl, channel });
  } catch (e) {
    console.error("pay error", e);
    res.status(500).send("支付下单失败，请稍后重试");
  }
});

app.get("/api/pay/status", (req, res) => {
  const { orderId } = req.query;
  const order = orderId ? orders.get(orderId) : null;
  if (!order) return res.status(404).json({ status: "not_found" });
  return res.json({
    status: order.status,
    paidCount: order.status === "success" ? order.count : 0,
  });
});

// 支付平台回调（易支付 notify_url）
app.post("/api/pay/callback", (req, res) => {
  const payload = req.body || {};
  const {
    pid,
    trade_no,
    out_trade_no: orderId,
    type,
    name,
    money,
    trade_status,
    sign,
    sign_type,
    ...rest
  } = payload;

  // 基本校验
  if (!orderId || !orders.has(orderId)) {
    return res.status(400).send("fail");
  }
  if (pid && `${pid}` !== `${PAY_MCH_ID}`) {
    return res.status(400).send("fail");
  }

  // 验签（忽略 sign/sign_type）
  const signParams = {
    pid,
    trade_no,
    out_trade_no: orderId,
    type,
    name,
    money,
    trade_status,
    ...rest,
  };
  if (sign && !verifySign(signParams, sign)) {
    return res.status(400).send("fail");
  }

  const order = orders.get(orderId);
  if (Number(money) !== Number(order.amount)) {
    return res.status(400).send("fail");
  }

  if (
    order.status !== "success" &&
    (trade_status === "TRADE_SUCCESS" ||
      trade_status === "SUCCESS" ||
      trade_status === "success")
  ) {
    order.status = "success";
    orders.set(orderId, order);
    const state = ensureUser(order.sessionId);
    state.credits += order.count;
    userState.set(order.sessionId, state);
  }

  return res.send("success");
});

const buildPrompt = (input) => `
角色与目标:
你是一名专业的视频内容分析师和脚本撰写专家。你的目标是分析用户提供的视频源（URL 或 描述），并生成两部分内容：1) 深度分析报告，2) 基于分析衍生的拍摄脚本。

语言要求:
**必须使用简体中文 (Simplified Chinese) 输出所有内容。**

重要指令:
1. 你是一个 API 端点。你的输出将被程序直接解析。
2. **不要** 在 JSON 前后输出任何对话、问候、解释或 Markdown 标记（如 \`\`\`json）。
3. **只返回 JSON 对象本身**。如果不确定或发生错误，也请返回包含错误信息的有效 JSON。

任务:
1. 视频内容解读: 分析来源的主题、受众、结构和意图。
   - 如果用户提供的是 URL (如 Bilibili, YouTube, 小红书/Xiaohongshu)，请务必使用搜索工具搜索该视频的标题、简介、评论或相关文章来获取内容上下文。
   - 针对小红书链接：可搜索 ID 或完整 URL，重点查找标题/正文文案。
2. 结构拆解: 将视频解构为关键部分（引言、主体、结尾）。
3. 核心观点提取: 识别主要论点或关键信息。
4. 文案整理: 根据声音内容/字幕/文案，整理详尽的视频文本内容（智能分段）。
5. 脚本撰写: 基于分析结果，创作结构化拍摄脚本。

用户输入上下文:
${input}

输出 JSON Schema:
{
  "analysis": {
    "theme": "视频的核心主题",
    "audience": "目标受众描述",
    "structure": [
      {
        "section": "章节名称",
        "timestamp": "预估时间戳",
        "summary": "内容摘要",
        "narrativeFunction": "叙事功能"
      }
    ],
    "corePoints": ["核心观点 1", "核心观点 2"],
    "transcriptSegments": [
       {
         "title": "分段标题",
         "content": "详细文案内容..."
       }
    ]
  },
  "script": {
    "title": "脚本标题",
    "scenes": [
      {
        "sceneNumber": 1,
        "location": "场景标题/地点",
        "shotType": "镜头类型",
        "visuals": "视觉画面描述",
        "audio": "对白/旁白/音效"
      }
    ]
  }
}
`;

const parseModelJson = (text) => {
  if (!text) throw new Error("AI 未返回结果");
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "");
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }
  return JSON.parse(cleaned);
};

const runModel = async ({ input, tier }) => {
  const apiKey = tier === "paid" ? PAID_GENAI_KEY : FREE_GENAI_KEY;
  if (!apiKey) {
    return {
      analysis: {
        theme: "示例主题",
        audience: "目标受众示例",
        structure: [
          {
            section: "开篇",
            timestamp: "00:00-00:30",
            summary: "开篇概要",
            narrativeFunction: "吸引注意",
          },
        ],
        corePoints: ["核心观点 1", "核心观点 2"],
        transcriptSegments: [{ title: "00:00 开场白", content: "这里是示例文案。" }],
      },
      script: {
        title: "示例脚本",
        scenes: [
          {
            sceneNumber: 1,
            location: "室内",
            shotType: "特写",
            visuals: "画面描述示例",
            audio: "对白示例",
          },
        ],
      },
      usedModel: tier === "paid" ? "paid-mock" : "free-mock",
      inputEcho: input,
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = tier === "paid" ? "gemini-3-pro-preview" : "gemini-2.5-flash";
  const prompt = buildPrompt(input);
  const resp = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  const parsed = parseModelJson(resp.text || "");
  parsed.usedModel = model;
  return parsed;
};

app.post("/api/analyze", async (req, res) => {
  const { tier = "free" } = req.query;
  const { input = "" } = req.body || {};
  const sessionId = getSessionId(req);
  const state = ensureUser(sessionId);

  // 额度/免费校验
  if (tier === "free" && state.freeUsed >= FREE_USAGE_LIMIT) {
    return res.status(402).send("免费次数已用完，请付费后重试。");
  }
  if (tier === "paid" && state.credits <= 0) {
    return res.status(402).send("付费额度不足，请先支付。");
  }

  try {
    const result = await runModel({ input, tier: tier === "paid" ? "paid" : "free" });

    // 扣减/累计
    if (tier === "free") {
      state.freeUsed += 1;
    } else if (tier === "paid") {
      state.credits = Math.max(0, state.credits - 1);
    }
    userState.set(sessionId, state);

    return res.json(result);
  } catch (e) {
    console.error("analyze error", e);
    return res.status(500).send(e.message || "分析失败");
  }
});

app.get("/health", (_, res) => res.send("ok"));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

