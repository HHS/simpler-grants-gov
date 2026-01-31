import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

import { expect, test } from "@playwright/test";
import { createSpoofedSessionCookie } from "../loginUtils";
import { initializeSessionSecrets } from "../loginUtils";

test("debug - check page loads", async ({ page, context }) => {
  initializeSessionSecrets();
  
  const baseUrl = "http://localhost:3000";
  const opportunityId = process.env.PLAYWRIGHT_BR8037_ORG_OPPORTUNITY_ID || "a569b88e-3c28-43ad-80ea-b76e9b2edead";
  
  console.log(`Opportunity ID: ${opportunityId}`);
  
  // Create spoofed session
  await createSpoofedSessionCookie(context);
  
  // Navigate
  console.log(`Navigating to: ${baseUrl}/opportunity/${opportunityId}?_ff=authOn:true`);
  await page.goto(`${baseUrl}/opportunity/${opportunityId}?_ff=authOn:true`);
  
  // Wait for page to load
  await page.waitForLoadState("domcontentloaded");
  
  // Get page title
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // Get all buttons
  const buttons = await page.getByRole("button").all();
  console.log(`Found ${buttons.length} buttons`);
  
  for (let i = 0; i < Math.min(buttons.length, 5); i++) {
    const text = await buttons[i].textContent();
    console.log(`  Button ${i}: ${text}`);
  }
  
  // Check for start application button specifically
  const startBtn = page.getByRole("button", { name: /start.*application/i });
  const count = await startBtn.count();
  console.log(`Start Application buttons found: ${count}`);
});
