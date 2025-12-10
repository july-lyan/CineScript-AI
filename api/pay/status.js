import { getStore } from "../_utils";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Session-Id");
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  const { orderId } = req.query;
  const { orders } = getStore();
  const order = orderId ? orders.get(orderId) : null;
  if (!order) return res.status(404).json({ status: "not_found" });
  return res.json({
    status: order.status,
    paidCount: order.status === "success" ? order.count : 0,
  });
}
