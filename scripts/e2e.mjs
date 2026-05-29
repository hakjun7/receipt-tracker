import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("scripts/screenshots/e2e");
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
const consoleErrors = [];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const page = await ctx.newPage();

page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`  📸 ${name}.png`);
}

console.log("1. dashboard (empty) → click 영수증 추가");
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(300);
await shot("01-dashboard-empty");
await page.getByRole("link", { name: "영수증 추가" }).first().click();
await page.waitForURL("**/upload");
await shot("02-upload-empty");

console.log("2. upload receipt3.png");
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles(path.resolve("images/receipt3.png"));
await page.waitForTimeout(300);
await shot("03-upload-preview");

console.log("3. click 분석 시작, wait for redirect to detail");
const t0 = Date.now();
await page.getByRole("button", { name: "분석 시작" }).click();
await page.waitForURL(/\/receipts\/[a-f0-9-]+$/, { timeout: 30000 });
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`  ⏱ extraction round-trip: ${elapsed}s`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(500);
await shot("04-detail-receipt3");

console.log("4. read populated fields");
const store = await page.locator("#store").inputValue();
const date = await page.locator("#date").inputValue();
const total = await page.locator("#total").inputValue();
console.log(`  store: ${store}`);
console.log(`  date : ${date}`);
console.log(`  total: ${total}`);
if (!store || !date || !total || total === "0") {
  errors.push(`fields not populated: store=${store}, date=${date}, total=${total}`);
}

console.log("5. expand 원본 추출 데이터");
await page.getByText(/원본 추출 데이터/).click();
await page.waitForTimeout(200);
await shot("05-detail-raw-expanded");

console.log("6. back to dashboard, expect 1 card");
await page.getByRole("link", { name: "목록" }).click();
await page.waitForURL("http://localhost:3000/");
await page.waitForTimeout(400);
await shot("06-dashboard-after-1");

console.log("7. upload second receipt (receipt4.png)");
await page.getByRole("link", { name: "영수증 추가" }).first().click();
await page.waitForURL("**/upload");
await page.locator('input[type="file"]').setInputFiles(path.resolve("images/receipt4.png"));
await page.waitForTimeout(300);
const t1 = Date.now();
await page.getByRole("button", { name: "분석 시작" }).click();
await page.waitForURL(/\/receipts\/[a-f0-9-]+$/, { timeout: 30000 });
console.log(`  ⏱ extraction round-trip: ${((Date.now() - t1) / 1000).toFixed(1)}s`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(500);
const store2 = await page.locator("#store").inputValue();
const total2 = await page.locator("#total").inputValue();
console.log(`  store: ${store2}`);
console.log(`  total: ${total2}`);
await shot("07-detail-receipt4");

console.log("8. dashboard with 2 receipts");
await page.getByRole("link", { name: "목록" }).click();
await page.waitForURL("http://localhost:3000/");
await page.waitForTimeout(400);
await shot("08-dashboard-after-2");

console.log("9. edit + save flow");
await page.locator("a:has-text('메가MGC커피'), a:has-text('GS25')").first().click();
await page.waitForURL(/\/receipts\/[a-f0-9-]+$/);
await page.locator("#memo").fill("출장 점심");
await page.getByRole("button", { name: "저장" }).click();
await page.waitForTimeout(500);
await shot("09-detail-after-edit");

console.log("10. delete flow");
page.on("dialog", (d) => d.accept());
await page.getByRole("button", { name: "삭제" }).click();
await page.waitForURL("http://localhost:3000/");
await page.waitForTimeout(400);
await shot("10-dashboard-after-delete");

await browser.close();

console.log("\n=== summary ===");
console.log(`page errors  : ${errors.length}`);
errors.forEach((e) => console.log("  ", e));
console.log(`console errors: ${consoleErrors.length}`);
consoleErrors.forEach((e) => console.log("  ", e));
console.log(`screenshots → ${OUT}`);
process.exit(errors.length ? 1 : 0);
