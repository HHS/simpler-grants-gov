/**
 * Utilities for downloading, unzipping, and verifying the contents of an
 * application submission zip file in Playwright e2e tests.
 *
 * The submission zip produced by CreateApplicationSubmissionTask contains:
 *   - <ShortFormName>.pdf  - one per included form (e.g. "SF424B.pdf")
 *   - GrantApplication.xml - full submission XML (if XML generation is enabled)
 *   - manifest.txt         - human-readable manifest listing every file
 *
 * Uses @zip.js/zip.js (an existing project dependency, already used for zip
 * handling in src/utils/opportunity/zipUtils.ts) rather than adding a new
 * zip library. Verification here is XML-only: GrantApplication.xml.
 * PDF entries are left unzipped along with everything
 * else in ZipContents.files if a caller wants to look at them, but this
 * module doesn't parse or assert on PDF content.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect, type Page } from "@playwright/test";
import * as zip from "@zip.js/zip.js";

// zip.js defaults to Web Workers, which aren't available in a plain Node
// (Playwright test) process - run inline instead.
zip.configure({ useWebWorkers: false });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ZipContents {
  /** Raw bytes keyed by file name (e.g. "SF424B.pdf", "GrantApplication.xml") */
  files: Map<string, Uint8Array>;
}

// ---------------------------------------------------------------------------
// Waiting for the zip to become available
// ---------------------------------------------------------------------------

/**
 * Waits for the application submission zip to become downloadable.
 *
 * Reloads the application page at a regular interval until the submission
 * download button is available or the timeout is reached.
 *
 * @param page Playwright Page object, already on the application page
 */
export async function waitForSubmissionZipReady(page: Page): Promise<void> {
  const downloadButton = page.getByTestId("application-submission-download");
  await expect(downloadButton).toBeEnabled({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Download & unzip
// ---------------------------------------------------------------------------

/**
 * Waits for the submission zip to be ready, clicks the download button,
 * waits for the browser download event, saves the file to a temp path,
 * unzips it in memory via @zip.js/zip.js, and returns a map of
 * file name → bytes for every entry in the zip.
 *
 * @param page Playwright Page object
 */
export async function downloadAndUnzipSubmission(
  page: Page,
): Promise<ZipContents> {
  await waitForSubmissionZipReady(page);

  const downloadButton = page.getByTestId("application-submission-download");

  const downloadPromise = page.waitForEvent("download");
  await downloadButton.click();
  const download = await downloadPromise;

  const tmpPath = path.join(os.tmpdir(), `submission-${Date.now()}.zip`);
  await download.saveAs(tmpPath);

  const zipBytes = new Uint8Array(fs.readFileSync(tmpPath));
  const files = new Map<string, Uint8Array>();

  const zipReader = new zip.ZipReader(new zip.Uint8ArrayReader(zipBytes));
  try {
    const entries = await zipReader.getEntries();
    for (const entry of entries) {
      // Skip directory entries
      if (entry.directory || !entry.getData) continue;
      const fileName = path.basename(entry.filename);
      const data = await entry.getData(new zip.Uint8ArrayWriter());
      files.set(fileName, data);
    }
  } finally {
    await zipReader.close();
  }

  // Clean up tmp file
  try {
    fs.unlinkSync(tmpPath);
  } catch {
    // non-fatal
  }

  return { files };
}

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

/**
 * Asserts that GrantApplication.xml exists in the zip and that its raw text
 * contains each of the provided expected strings (simple text search - no
 * full XML parsing needed for field value assertions).
 *
 * @param contents ZipContents returned by downloadAndUnzipSubmission
 * @param expectedStrings Strings that must appear in the XML text
 */
export function assertXmlContainsFields(
  contents: ZipContents,
  expectedFields: Record<string, { element: string; value: string }>,
): void {
  const xmlBytes = contents.files.get("GrantApplication.xml");

  if (!xmlBytes) {
    const available = [...contents.files.keys()].join(", ");
    throw new Error(
      `GrantApplication.xml not found in zip. Available files: ${available}`,
    );
  }

  const xmlText = Buffer.from(xmlBytes).toString("utf-8");

  for (const { element, value } of Object.values(expectedFields)) {
    expect(
      xmlText,
      `Expected GrantApplication.xml to contain <${element}>${value}</${element}>`,
    ).toContain(`<${element}>${value}</${element}>`);
  }
}
