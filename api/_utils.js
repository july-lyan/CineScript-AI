import crypto from "crypto";
import querystring from "querystring";
import { GoogleGenAI } from "@google/genai";

// 环境变量读取（提供默认值仅便于本地调试，上线请改为环境变量）
export const PAY_MCH_ID = process.env.PAY_MCH_ID || "1221";
export const PAY_SIGN_KEY =
  process.env.PAY_SIGN_KEY || "UB9bu7KKX3bA9gZOk43OxRVl7Z4fsVK7";
export const PAY_API_BASE =
  process.env.PAY_API_BASE || "https://data.kuaizhifu.cn";
export const PAY_NOTIFY_URL =
  process.env.PAY_NOTIFY_URL || "https://your-domain.com/api/pay/callback";
export const PAY_RETURN_URL =
  process.env.PAY_RETURN_URL || "https://your-domain.com/pay/return";
export const PAY_PER_USE_PRICE = Number(process.env.PAY_PER_USE_PRICE || 9.9);
export const FREE_USAGE_LIMIT = Number(process.env.FREE_USAGE_LIMIT || 3);
export const FREE_GENAI_KEY =
  process.env.FREE_GENAI_KEY || process.env.GEMINI_API_KEY;
export const PAID_GENAI_KEY =
  process.env.PAID_GENAI_KEY || process.env.GEMINI_API_KEY;

// 在 Vercel 无状态环境下使用 globalThis 维持同实例内的内存缓存（非持久，建议后续接入 Redis/DB）
const globalStore =
  globalThis.__PAY_STORE__ ||
  (globalThis.__PAY_STORE__ = { orders: new Map(), users: new Map() });

export const getStore = () => globalStore;

export const getSessionId = (req) =>
  req.headers["x-session-id"] ||
  req.headers["x-sessionid"] ||
  req.headers["x-session_id"] ||
  req.headers["x-forwarded-for"] ||
  req.socket?.remoteAddress ||
  "anonymous";

export const ensureUser = (sessionId) => {
  const { users } = getStore();
  if (!users.has(sessionId)) {
    users.set(sessionId, { freeUsed: 0, credits: 0 });
  }
  return users.get(sessionId);
};

// MD5 签名（按文档：排序后拼接 &key，再 MD5）
export const buildSign = (params) => {
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

export const verifySign = (params, sign) => buildSign(params) === sign;

// 生成易支付支付链接（submit.php）
export const createEasyPayOrder = async ({ orderId, channel, amount, clientIp }) => {
  const payload = {
    pid: PAY_MCH_ID,
    type: channel, // alipay / wechat
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
  return { payUrl, qrUrl: payUrl, payload };
};

// 构建模型 prompt
const buildPrompt = (input) => `
角色与目标:
你是一名专业的视频内容分析师和脚本撰写专家。你的目标是分析用户提供的视频源（URL 或 描述），并生成两部分内容：1) 深度分析报告，2) 基于分析衍生的拍摄脚本。

语言要求:
**必须使用简体中文 (Simplified Chinese) 输出所有内容。**

重要指令:
1. 你是一个 API 端点。你的输出将被程序直接解析。
2. 不要在 JSON 前后输出任何对话、问候、解释或 Markdown 标记。
3. 只返回 JSON 对象本身。

任务:
1. 视频内容解读: 分析来源的主题、受众、结构和意图。
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
      { "section": "章节名称", "timestamp": "预估时间戳", "summary": "内容摘要", "narrativeFunction": "叙事功能" }
    ],
    "corePoints": ["核心观点 1", "核心观点 2"],
    "transcriptSegments": [
       { "title": "分段标题", "content": "详细文案内容..." }
    ]
  },
  "script": {
    "title": "脚本标题",
    "scenes": [
      { "sceneNumber": 1, "location": "场景/地点", "shotType": "镜头类型", "visuals": "视觉画面描述", "audio": "对白/旁白/音效" }
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

export const runModel = async ({ input, tier }) => {
  const apiKey = tier === "paid" ? PAID_GENAI_KEY : FREE_GENAI_KEY;
  if (!apiKey) {
    // 无 Key 时返回 mock
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
  const primaryModel = "gemini-3-pro-preview";
  const fallbackModel = "gemini-2.5-flash";
  const prompt = buildPrompt(input);

  try {
    const resp = await ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
    });
    const parsed = parseModelJson(resp.text || "");
    parsed.usedModel = primaryModel;
    return parsed;
  } catch (e) {
    console.warn("primary model failed, fallback to flash", e);
    const resp = await ai.models.generateContent({
      model: fallbackModel,
      contents: prompt,
    });
    const parsed = parseModelJson(resp.text || "");
    parsed.usedModel = fallbackModel;
    return parsed;
  }
};
