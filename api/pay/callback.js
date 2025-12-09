import { orders, userState, ensureUser, verifySign } from "../_utils.js";

const PAY_MCH_ID = process.env.PAY_MCH_ID || "1221";
const PAY_SIGN_KEY = process.env.PAY_SIGN_KEY || "UB9bu7KKX3bA9gZOk43OxRVl7Z4fsVK7";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("fail");
    return;
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

  // 基本校验
  if (!orderId || !orders.has(orderId)) {
    res.status(400).send("fail");
    return;
  }
  if (pid && `${pid}` !== `${PAY_MCH_ID}`) {
    res.status(400).send("fail");
    return;
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
  if (sign && !verifySign(signParams, sign, PAY_SIGN_KEY)) {
    res.status(400).send("fail");
    return;
  }

  const order = orders.get(orderId);
  if (Number(money) !== Number(order.amount)) {
    res.status(400).send("fail");
    return;
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

  res.status(200).send("success");
}
