import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";

// In-memory stores (demo only; replace with DB/Redis in production)
export const orders = new Map();
export const userState = new Map();

export const getSessionId = (req) => req.headers["x-session-id"] || req.headers["x-forwarded-for"] || "anonymous";

export const ensureUser = (sessionId) => {
  if (!userState.has(sessionId)) {
    userState.set(sessionId, { freeUsed: 0, credits: 0 });
  }
  return userState.get(sessionId);
};

// MD5 签名
export const buildSign = (params, signKey) => {
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
  const str = `${sorted}${signKey ? "&" + signKey : ""}`;
  return crypto.createHash("md5").update(str, "utf8").digest("hex");
};

export const verifySign = (params, sign, signKey) => buildSign(params, signKey) === sign;

export const buildPrompt = (input) => `
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

export const parseModelJson = (text) => {
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
  const apiKey = tier === "paid"
    ? (process.env.PAID_GENAI_KEY || process.env.GEMINI_API_KEY)
    : (process.env.FREE_GENAI_KEY || process.env.GEMINI_API_KEY);

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
