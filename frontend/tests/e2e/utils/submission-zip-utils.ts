/**
 * Utilities for downloading, unzipping, and verifying the contents of an
 * application submission zip file in Playwright e2e tests.
 *
 * The submission zip produced by CreateApplicationSubmissionTask contains:
 *   - <ShortFormName>.pdf  — one per included form (e.g. "SF424B.pdf")
 *   - GrantApplication.xml — full submission XML (if XML generation is enabled)
 *   - manifest.txt         — human-readable manifest listing every file
 */

import * as fs from "fs";
import * as path from "path";
import { expect, Page } from "@playwright/test";
// yauzl and pdf-parse ship CJS-only — use require()
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yauzl = require("yauzl") as typeof import("yauzl");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (
  dataBuffer: Buffer,
) => Promise<{ text: string }>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ZipContents {
  /** Raw bytes keyed by file name (e.g. "SF424B.pdf", "GrantApplication.xml") */
  files: Map<string, Buffer>;
}

export interface PdfTextResult {
  /** All text extracted from the PDF (whitespace-normalized) */
  text: string;
}

// ---------------------------------------------------------------------------
// Download & unzip
// ---------------------------------------------------------------------------

/**
 * Clicks the application submission download button, waits for the browser
 * download event, saves the file to a temp path, unzips it in memory, and
 * returns a map of file name → Buffer for every entry in the zip.
 *
 * @param page Playwright Page object (must already be on the application page)
 */
export async function downloadAndUnzipSubmission(
  page: Page,
): Promise<ZipContents> {
  // Wait for download-ready state — button is only enabled once the zip is ready
  const downloadButton = page.getByTestId("application-submission-download");
  await expect(downloadButton).toBeVisible({ timeout: 120_000 });
  await expect(downloadButton).toBeEnabled({ timeout: 60_000 });

  const downloadPromise = page.waitForEvent("download");
  await downloadButton.click();
  const download = await downloadPromise;

  const tmpPath = path.join(
    require("os").tmpdir(),
    `submission-${Date.now()}.zip`,
  );
  await download.saveAs(tmpPath);

  const files = new Map<string, Buffer>();

  await new Promise<void>((resolve, reject) => {
    yauzl.open(tmpPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);
      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        const fileName = path.basename(entry.fileName);
        // Skip directory entries
        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry();
          return;
        }
        zipfile.openReadStream(entry, (streamErr, readStream) => {
          if (streamErr) return reject(streamErr);
          const chunks: Buffer[] = [];
          readStream.on("data", (chunk: Buffer) => chunks.push(chunk));
          readStream.on("end", () => {
            files.set(fileName, Buffer.concat(chunks));
            zipfile.readEntry();
          });
          readStream.on("error", reject);
        });
      });
      zipfile.on("end", resolve);
      zipfile.on("error", reject);
    });
  });

  // Clean up tmp file
  try {
    fs.unlinkSync(tmpPath);
  } catch {
    // non-fatal
  }

  return { files };
}

// ---------------------------------------------------------------------------
// PDF helpers
// ---------------------------------------------------------------------------

/**
 * Extracts all text from a PDF buffer using pdf-parse.
 * Returns a normalised (collapsed whitespace) text string.
 */
export async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  const result = await pdfParse(pdfBuffer);
  // Collapse excessive whitespace so callers can do simple `.includes()` checks
  return result.text.replace(/\s+/g, " ").trim();
}

/**
 * Asserts that a PDF entry with the given file name exists in the zip and
 * that its text content contains each of the provided expected strings.
 *
 * @param contents ZipContents returned by downloadAndUnzipSubmission
 * @param pdfFileName File name to look up (e.g. "SF424B.pdf")
 * @param expectedStrings Strings that must appear in the extracted PDF text
 */
export async function assertPdfContains(
  contents: ZipContents,
  pdfFileName: string,
  expectedStrings: string[],
): Promise<void> {
  const pdfBuffer = contents.files.get(pdfFileName);
  if (!pdfBuffer) {
    const available = [...contents.files.keys()].join(", ");
    throw new Error(
      `PDF "${pdfFileName}" not found in zip. Available files: ${available}`,
    );
  }

  const text = await extractPdfText(pdfBuffer);

  for (const expected of expectedStrings) {
    expect(
      text,
      `Expected PDF "${pdfFileName}" to contain: "${expected}"`,
    ).toContain(expected);
  }
}

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

/**
 * Asserts that GrantApplication.xml exists in the zip and that its raw text
 * contains each of the provided expected strings (simple text search — no
 * full XML parsing needed for field value assertions).
 *
 * @param contents ZipContents returned by downloadAndUnzipSubmission
 * @param expectedStrings Strings that must appear in the XML text
 */
export function assertXmlContains(
  contents: ZipContents,
  expectedStrings: string[],
): void {
  const xmlBuffer = contents.files.get("GrantApplication.xml");
  if (!xmlBuffer) {
    const available = [...contents.files.keys()].join(", ");
    throw new Error(
      `GrantApplication.xml not found in zip. Available files: ${available}`,
    );
  }

  const xmlText = xmlBuffer.toString("utf-8");

  for (const expected of expectedStrings) {
    expect(
      xmlText,
      `Expected GrantApplication.xml to contain: "${expected}"`,
    ).toContain(expected);
  }
}
