import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

interface RecordedStep {
  step: number;
  action: string;
  url: string;
  title: string;
  screenshotPath: string;
  visibleElements: string[];
  buttons: string[];
  timestamp: number;
}

const recording: RecordedStep[] = [];
let stepCounter = 0;

async function capturePageState(
  page: Page,
  action: string,
  screenshotName: string
) {
  stepCounter++;
  const url = page.url();
  const title = await page.title();

  // Take screenshot
  const screenshotDir = path.resolve(__dirname, "recordings");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  const screenshotPath = path.join(screenshotDir, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Find all buttons and their text
  const buttons = await page.locator("button").all();
  const buttonTexts: string[] = [];
  for (const button of buttons) {
    const text = (await button.textContent())?.trim();
    if (text) {
      buttonTexts.push(text);
    }
  }

  // Find visible headings and main text
  const visibleElements: string[] = [];
  const h1 = await page.locator("h1").textContent();
  if (h1) visibleElements.push(`H1: ${h1.trim()}`);
  const h2 = await page.locator("h2").first().textContent();
  if (h2) visibleElements.push(`H2: ${h2.trim()}`);

  const step: RecordedStep = {
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

test("record application workflow", async ({ page, browser, context }) => {
  console.log("🎬 Starting workflow recording...\n");

  const SESSION_SECRET = process.env.SESSION_SECRET;
  const API_JWT_PUBLIC_KEY = process.env.API_JWT_PUBLIC_KEY;

  if (!SESSION_SECRET || !API_JWT_PUBLIC_KEY) {
    throw new Error(
      "SESSION_SECRET and API_JWT_PUBLIC_KEY must be set in .env.local"
    );
  }

  const baseUrl = "http://localhost:3000";
  const opportunityId = "a569b88e-3c28-43ad-80ea-b76e9b2edead";

  // Create a spoofed session cookie
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

  try {
    // Step 1: Home page
    console.log("📍 Navigating to home page...");
    await page.goto(`${baseUrl}/?_ff=authOn:true`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await capturePageState(page, "Home page loaded", "01-home.png");

    // Step 2: Opportunity page
    console.log("\n📍 Navigating to opportunity page...");
    await page.goto(`${baseUrl}/opportunity/${opportunityId}?_ff=authOn:true`, {
      waitUntil: "domcontentloaded",
      timeout: 180000,
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await capturePageState(page, "Opportunity page loaded", "02-opportunity.png");

    // Step 3: Try to find and click "Start Application" button
    console.log("\n📍 Looking for 'Start Application' or similar button...");
    const startButton = page
      .getByRole("button", { name: /start.*application/i })
      .or(page.getByRole("button", { name: /apply/i }))
      .or(page.getByText(/start.*apply/i).first());

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

    // Save recording
    const recordingDir = path.resolve(__dirname, "recordings");
    const recordingPath = path.join(recordingDir, "recording.json");
    fs.writeFileSync(recordingPath, JSON.stringify(recording, null, 2));

    console.log("\n✓ Recording saved!");
    console.log(`  JSON: ${recordingPath}`);
    console.log(`  Screenshots: ${recordingDir}/`);
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
});
