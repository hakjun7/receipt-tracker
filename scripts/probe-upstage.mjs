import fs from "node:fs/promises";
import path from "node:path";

const KEY = process.env.UPSTAGE_API_KEY;
if (!KEY) throw new Error("Set UPSTAGE_API_KEY env var");

const imgPath = path.resolve("images/receipt3.png");
const bytes = await fs.readFile(imgPath);
const dataUrl = `data:image/png;base64,${bytes.toString("base64")}`;
console.log(`loaded ${imgPath} (${bytes.length} bytes)`);

const schema = {
  name: "receipt",
  schema: {
    type: "object",
    properties: {
      vendor_name: { type: "string", description: "가게/매장 이름" },
      transaction_date: { type: "string", description: "거래 날짜 (YYYY-MM-DD)" },
      total_amount: { type: "string", description: "총 결제 금액 (숫자만)" },
      currency: { type: "string", description: "통화 (KRW/USD 등)" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            quantity: { type: "string" },
            price: { type: "string" },
          },
        },
      },
    },
    required: ["vendor_name", "total_amount"],
  },
};

const body = {
  model: "information-extract",
  messages: [
    {
      role: "user",
      content: [{ type: "image_url", image_url: { url: dataUrl } }],
    },
  ],
  response_format: { type: "json_schema", json_schema: schema },
};

console.log("→ POST /v1/information-extraction ...");
const t0 = Date.now();
const res = await fetch("https://api.upstage.ai/v1/information-extraction", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${KEY}`,
  },
  body: JSON.stringify(body),
});
const dt = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`← HTTP ${res.status} in ${dt}s`);
const text = await res.text();
console.log(text.slice(0, 4000));
