import { expect, Page, test } from "@playwright/test";
import { BrowserContextOptions } from "playwright-core";

export interface PageProps {
  page: Page;
  browserName?: string;
  contextOptions?: BrowserContextOptions;
}
