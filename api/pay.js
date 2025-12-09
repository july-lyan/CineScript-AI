import querystring from "querystring";
import { getSessionId, orders, buildSign } from "./_utils.js";

const PAY_MCH_ID = process.env.PAY_MCH_ID || "1221";
const PAY_SIGN_KEY = process.env.PAY_SIGN_KEY || "UB9bu7KKX3bA9gZOk43OxRVl7Z4fsVK7";
const PAY_API_BASE = process.env.PAY_API_BASE || "https://data.kuaizhifu.cn";
const PAY_NOTIFY_URL = process.env.PAY_NOTIFY_URL || "https://your-domain.com/api/pay/callback";
const PAY_RETURN_URL = process.env.PAY_RETURN_URL || "https://your-domain.com";
const PAY_PER_USE_PRICE = Number(process.env.PAY_PER_USE_PRICE || 9.9);

// 生成支付链接
const createEasyPayOrder = async ({ orderId, channel, amount, clientIp }) => {
  const payload = {
    pid: PAY_MCH_ID,
    type: channel,
    out_trade_no: orderId,
    notify_url: PAY_NOTIFY_URL,
    return_url: PAY_RETURN_URL,
    name: "CineScript AI 按次付费",
    money: amount,
    clientip: clientIp || "",
    sign_type: "MD5",
  };
  const sign = buildSign(payload, PAY_SIGN_KEY);
  const query = querystring.stringify({ ...payload, sign });
  const payUrl = `${PAY_API_BASE}/submit.php?${query}`;
  return {
    payUrl,
    qrUrl: payUrl,
    raw: payload,
  };
};

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
    const { channel = "alipay", count = 1 } = req.body || {};
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const amount = Number((count * PAY_PER_USE_PRICE).toFixed(2));

    const clientIp = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "127.0.0.1";

    const { qrUrl, payUrl, raw } = await createEasyPayOrder({
      orderId,
      channel,
      amount,
      clientIp,
    });

    orders.set(orderId, {
      status: "pending",
      channel,
      count,
      amount,
      sessionId: getSessionId(req),
      raw,
    });

    res.status(200).json({ orderId, amount, qrUrl, payUrl, channel });
  } catch (e) {
    console.error("pay error", e);
    res.status(500).send("支付下单失败，请稍后重试");
  }
}
