#!/usr/bin/env node
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.local") });

const recording = [];
let stepCounter = 0;

async function capturePageState(page, action, screenshotName) {
  stepCounter++;
  const url = page.url();
  const title = await page.title();

  const screenshotDir = path.resolve(__dirname, "recordings");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const screenshotPath = path.join(screenshotDir, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const buttons = await page.locator("button").all();
  const buttonTexts = [];
  for (const button of buttons) {
    const text = (await button.textContent())?.trim();
    if (text) {
      buttonTexts.push(text);
    }
  }

  const visibleElements = [];
  const h1Text = await page
    .locator("h1")
    .first()
    .textContent({ timeout: 2000 })
    .catch(() => "");
  if (h1Text) {
    visibleElements.push(`H1: ${h1Text.trim()}`);
  }

  const step = {
    step: stepCounter,
    action,
    url,
    title,
    screenshotPath: path.basename(screenshotPath),
    visibleElements,
    buttons: buttonTexts.slice(0, 15),
    timestamp: Date.now(),
  };

  recording.push(step);
  console.log(`\n✓ Step ${stepCounter}: ${action}`);
  console.log(`  URL: ${url}`);
  console.log(`  Buttons found: ${buttonTexts.length}`);
  if (buttonTexts.length > 0) {
    console.log(`  First buttons: ${buttonTexts.slice(0, 5).join(", ")}`);
  }

  return step;
}

async function main() {
  console.log("🎬 Starting workflow recording...\n");

  const SESSION_SECRET = process.env.SESSION_SECRET;
  const API_JWT_PUBLIC_KEY = process.env.API_JWT_PUBLIC_KEY;

  if (!SESSION_SECRET || !API_JWT_PUBLIC_KEY) {
    throw new Error(
      "SESSION_SECRET and API_JWT_PUBLIC_KEY must be set in .env.local"
    );
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  const baseUrl = "http://localhost:3000";
  const opportunityId = process.env.PLAYWRIGHT_BR8037_ORG_OPPORTUNITY_ID || "e7349d47-4c62-41e8-a92d-a2f219ebaf7c";

  function createSpoofedSessionCookie() {
    const payload = Buffer.from(
      JSON.stringify({
        user_id: "7edb5704-9d3b-4099-9e10-fbb9f2729aff",
        iat: Math.floor(Date.now() / 1000),
        aud: "simpler-grants-api",
        iss: "simpler-grants-api",
        email: null,
        session_duration_minutes: 30,
      })
    ).toString("base64");

    return `${Buffer.from("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9").toString("base64")}.${payload}.signature`;
  }

  const sessionCookie = createSpoofedSessionCookie();
  await context.addCookies([
    {
      name: "session",
      value: sessionCookie,
      domain: "localhost",
      path: "/",
    },
  ]);

  const page = await context.newPage();

  try {
    console.log("📍 Navigating to home page...");
    await page.goto(`${baseUrl}/?_ff=authOn:true`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await capturePageState(page, "Home page loaded", "01-home.png");

    console.log("\n📍 Navigating to opportunity page...");
    await page.goto(`${baseUrl}/opportunity/${opportunityId}?_ff=authOn:true`, {
      waitUntil: "domcontentloaded",
      timeout: 180000,
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await capturePageState(page, "Opportunity page loaded", "02-opportunity.png");

    console.log("\n📍 Looking for 'Start Application' or similar button...");
    const startButton = page
      .getByRole("button", { name: /start.*application/i })
      .or(page.getByRole("button", { name: /apply/i }));

    const isVisible = await startButton.isVisible().catch(() => false);
    if (isVisible) {
      console.log("✓ Found button, clicking...");
      await startButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log(
        "⚠ Button not found automatically. Showing all buttons on page:"
      );
      const allButtons = await page.locator("button").all();
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        console.log(`  ${i + 1}. "${text?.trim()}"`);
      }
    }

    await capturePageState(page, "After clicking button", "03-after-click.png");

    console.log("\n" + "=".repeat(70));
    console.log("🎬 RECORDING CAPTURED");
    console.log("=".repeat(70));

    recording.forEach((step) => {
      console.log(`\nStep ${step.step}: ${step.action}`);
      console.log(`  Screenshot: ${step.screenshotPath}`);
      console.log(`  URL: ${step.url}`);
      console.log(`  Buttons: ${step.buttons.join(", ") || "none"}`);
    });

    const recordingDir = path.resolve(__dirname, "recordings");
    const recordingPath = path.join(recordingDir, "recording.json");
    fs.writeFileSync(recordingPath, JSON.stringify(recording, null, 2));

    console.log("\n✓ Recording saved!");
    console.log(`  JSON: ${recordingPath}`);
    console.log(`  Screenshots: ${recordingDir}/`);
    console.log("\n👀 Browser is still open for inspection.");
    console.log("Close the browser when done.\n");

    await new Promise(() => {});
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
