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
import { orders } from "../_utils.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  const { orderId } = req.query;
  const order = orderId ? orders.get(orderId) : null;

  if (!order) {
    res.status(404).json({ status: "not_found" });
    return;
  }

  res.status(200).json({
    status: order.status,
    paidCount: order.status === "success" ? order.count : 0,
  });
}
