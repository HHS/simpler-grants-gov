// Manual test setup - run this to set up the browser for manual testing
// Load environment variables explicitly before any other imports
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

import { chromium } from "@playwright/test";
import { createSpoofedSessionCookie } from "./loginUtils";

async function setupBrowser() {
  const opportunityId =
    process.env.PLAYWRIGHT_BR8037_ORG_OPPORTUNITY_ID ||
    "a569b88e-3c28-43ad-80ea-b76e9b2edead";
  
  console.log("Setting up browser for manual testing...");
  console.log(`Opportunity ID: ${opportunityId}`);
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create and set spoofed session cookie
  console.log("Creating spoofed session cookie...");
  await createSpoofedSessionCookie(context);
  
  // Navigate to opportunity page
  const url = `http://localhost:3000/opportunity/${opportunityId}?_ff=authOn:true`;
  console.log(`Navigating to: ${url}`);
  await page.goto(url, { timeout: 180000 });
  
  console.log("✓ Browser is ready!");
  console.log("Manually perform these steps:");
  console.log("1. Click 'Start new application' button");
  console.log("2. Select 'Sally's Soup Emporium' from the organization dropdown");
  console.log("3. Fill in the application form");
  console.log("\nPress Enter in this terminal to close the browser when done...");
  
  // Keep browser open until user presses enter
  await new Promise((resolve) => {
    process.stdin.once("data", () => {
      resolve(undefined);
    });
  });

  await browser.close();
}

setupBrowser().catch(console.error);
