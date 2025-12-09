import {
  getSessionId,
  ensureUser,
  runModel,
  FREE_USAGE_LIMIT,
} from "./_utils";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Session-Id");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { tier = "free" } = req.query;
  const { input = "" } = req.body || {};
  const sessionId = getSessionId(req);
  const state = ensureUser(sessionId);

  if (tier === "free" && state.freeUsed >= FREE_USAGE_LIMIT) {
    return res.status(402).send("免费次数已用完，请付费后重试。");
  }
  if (tier === "paid" && state.credits <= 0) {
    return res.status(402).send("付费额度不足，请先支付。");
  }

  try {
    const result = await runModel({ input, tier: tier === "paid" ? "paid" : "free" });

    if (tier === "free") {
      state.freeUsed += 1;
    } else if (tier === "paid") {
      state.credits = Math.max(0, state.credits - 1);
    }
    return res.json(result);
  } catch (e) {
    console.error("analyze error", e);
    return res.status(500).send(e.message || "分析失败");
  }
}
import { getSessionId, ensureUser, runModel } from "./_utils.js";

const FREE_USAGE_LIMIT = Number(process.env.FREE_USAGE_LIMIT || 3);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Session-Id");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const { tier = "free" } = req.query;
    const { input = "" } = req.body || {};
    const sessionId = getSessionId(req);
    const state = ensureUser(sessionId);

    // 额度/免费校验
    if (tier === "free" && state.freeUsed >= FREE_USAGE_LIMIT) {
      res.status(402).send("免费次数已用完，请付费后重试。");
      return;
    }
    if (tier === "paid" && state.credits <= 0) {
      res.status(402).send("付费额度不足，请先支付。");
      return;
    }

    const result = await runModel({ input, tier: tier === "paid" ? "paid" : "free" });

    // 扣减/累计
    if (tier === "free") {
      state.freeUsed += 1;
    } else if (tier === "paid") {
      state.credits = Math.max(0, state.credits - 1);
    }

    res.status(200).json(result);
  } catch (e) {
    console.error("analyze error", e);
    res.status(500).send(e.message || "分析失败");
  }
}
