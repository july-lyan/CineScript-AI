import { createEasyPayOrder, getStore, getSessionId, PAY_PER_USE_PRICE } from "./_utils.js";

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

  try {
    const { channel = "alipay", count = 1 } = req.body || {};
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const amount = Number((count * PAY_PER_USE_PRICE).toFixed(2));

    const { qrUrl, payUrl, payload } = await createEasyPayOrder({
      orderId,
      channel,
      amount,
      clientIp: req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
    });

    const { orders } = getStore();
    orders.set(orderId, {
      status: "pending",
      channel,
      count,
      amount,
      sessionId: getSessionId(req),
      payload,
      createdAt: Date.now(),
    });

    return res.json({ orderId, amount, qrUrl, payUrl, channel });
  } catch (e) {
    console.error("pay error", e);
    return res.status(500).send("支付下单失败，请稍后重试");
  }
}
