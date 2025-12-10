import { getStore, ensureUser, verifySign, PAY_MCH_ID } from "../_utils";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

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

  if (!orderId) return res.status(400).send("fail");

  const { orders } = getStore();
  if (!orders.has(orderId)) {
    return res.status(400).send("fail");
  }
  if (pid && `${pid}` !== `${PAY_MCH_ID}`) {
    return res.status(400).send("fail");
  }

  // 验签
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
    getStore().users.set(order.sessionId, state);
  }

  return res.send("success");
}
