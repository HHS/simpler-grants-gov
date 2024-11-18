import { BrowserContextOptions, Page } from "@playwright/test";

export interface PageProps {
  page: Page;
  browserName?: string;
  contextOptions?: BrowserContextOptions;
}
