import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("scripts/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
const consoleErrors = [];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
const page = await ctx.newPage();

page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

console.log("→ dashboard (empty)");
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await shot("01-dashboard-empty");

console.log("→ upload page");
await page.goto("http://localhost:3000/upload", { waitUntil: "networkidle" });
await page.waitForTimeout(200);
await shot("02-upload-empty");

console.log("→ seed a fake receipt via localStorage");
await page.evaluate(() => {
  const r = {
    id: "test-fake-1",
    createdAt: new Date().toISOString(),
    imageDataUrl: "",
    rawFields: [
      { key: "store_info.name", type: "string", value: "테스트 가게", confidence: 0.95 },
      { key: "date", type: "date", value: "2026-05-15", confidence: 0.97 },
      { key: "total", type: "monetary_krw", value: "15,500", confidence: 0.99 },
    ],
    store: "테스트 가게",
    date: "2026-05-15",
    total: 15500,
  };
  const r2 = { ...r, id: "test-fake-2", store: "다른 가게", date: "2026-04-20", total: 8900 };
  localStorage.setItem("receipts.v1", JSON.stringify([r, r2]));
});

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await shot("03-dashboard-with-data");

console.log("→ detail page");
await page.goto("http://localhost:3000/receipts/test-fake-1", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await shot("04-detail");

console.log("→ mobile dashboard");
await ctx.close();
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mpage = await mctx.newPage();
mpage.on("pageerror", (e) => errors.push(`mobile pageerror: ${e.message}`));
mpage.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(`mobile: ${msg.text()}`);
});
await mpage.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await mpage.evaluate(() => {
  const r = {
    id: "test-fake-1",
    createdAt: new Date().toISOString(),
    imageDataUrl: "",
    rawFields: [],
    store: "테스트 가게",
    date: "2026-05-15",
    total: 15500,
  };
  localStorage.setItem("receipts.v1", JSON.stringify([r]));
});
await mpage.reload({ waitUntil: "networkidle" });
await mpage.waitForTimeout(300);
await mpage.screenshot({ path: path.join(OUT, "05-mobile-dashboard.png"), fullPage: true });

await browser.close();

console.log("\n=== summary ===");
console.log(`page errors: ${errors.length}`);
errors.forEach((e) => console.log("  ", e));
console.log(`console errors: ${consoleErrors.length}`);
consoleErrors.forEach((e) => console.log("  ", e));
console.log(`screenshots → ${OUT}`);
process.exit(errors.length ? 1 : 0);
