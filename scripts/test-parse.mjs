import { parseReceipt } from "../lib/parse-receipt.ts";

const fixtures = [
  {
    name: "receipt3 (GS25)",
    resp: {
      choices: [
        {
          message: {
            content: JSON.stringify({
              vendor_name: "GS25 강남대로점",
              transaction_date: "2026-05-21",
              total_amount: "8300",
              currency: "KRW",
              items: [
                { name: "삼다수 500ml", quantity: "1", price: "1100" },
                { name: "바나나우유 240ml", quantity: "1", price: "1800" },
              ],
            }),
          },
        },
      ],
    },
  },
  {
    name: "receipt4 (메가MGC)",
    resp: {
      choices: [
        {
          message: {
            content: JSON.stringify({
              vendor_name: "메가MGC커피 강남역점",
              transaction_date: "2026-05-21",
              total_amount: "4000",
              currency: "KRW",
              items: [{ name: "아메리카노 (ICE)", quantity: "1", price: "2000" }],
            }),
          },
        },
      ],
    },
  },
];

for (const f of fixtures) {
  const parsed = parseReceipt(f.resp);
  console.log(`\n=== ${f.name} ===`);
  console.log("store:", parsed.store);
  console.log("date :", parsed.date);
  console.log("total:", parsed.total);
  console.log("rawFields:", parsed.rawFields.length, "fields");
  parsed.rawFields.slice(0, 5).forEach((f) => console.log(" ", f.key, "=", f.value));
}
