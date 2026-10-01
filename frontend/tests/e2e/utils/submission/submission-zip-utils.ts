/**
 * Utilities for downloading, unzipping, and verifying the contents of an
 * application submission zip file in Playwright e2e tests.
 *
 * The submission zip produced by CreateApplicationSubmissionTask contains:
 *   - <ShortFormName>.pdf - one per included form (e.g. "SF424B.pdf")
 *   - GrantApplication.xml - full submission XML (if XML generation is enabled)
 *   - manifest.txt - human-readable manifest listing every file
 *
 * Uses @zip.js/zip.js (an existing project dependency, already used for zip
 * handling in src/utils/opportunity/zipUtils.ts) rather than adding a new
 * zip library.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect, type Page } from "@playwright/test";
import * as zip from "@zip.js/zip.js";
import { extractText, getDocumentProxy } from "unpdf";

// zip.js defaults to Web Workers, which aren't available in a plain Node
// (Playwright test) process - run inline instead.
zip.configure({ useWebWorkers: false });

export interface ZipContents {
  /** Raw bytes keyed by file name (e.g. "SF424B.pdf", "GrantApplication.xml") */
  files: Map<string, Uint8Array>;
}

/**
 * Waits for the application submission download button to become enabled.
 *
 * @param page Playwright Page object, already on the application page
 */
export async function waitForSubmissionZipReady(page: Page): Promise<void> {
  const downloadButton = page.getByTestId("application-submission-download");

  await expect(downloadButton).toBeEnabled({ timeout: 10_000 });
}

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

  const tmpPath = path.join(
    os.tmpdir(),
    `submission-${Date.now()}-${process.pid}.zip`,
  );

  try {
    await download.saveAs(tmpPath);

    const zipBytes = new Uint8Array(await fs.promises.readFile(tmpPath));
    const files = new Map<string, Uint8Array>();

    const zipReader = new zip.ZipReader(new zip.Uint8ArrayReader(zipBytes));

    try {
      const entries = await zipReader.getEntries();

      for (const entry of entries) {
        // Skip directory entries.
        if (entry.directory || !entry.getData) continue;

        const fileName = path.basename(entry.filename);
        const data = await entry.getData(new zip.Uint8ArrayWriter());

        files.set(fileName, data);
      }
    } finally {
      await zipReader.close();
    }

    return { files };
  } finally {
    await fs.promises.unlink(tmpPath).catch(() => {
      // Non-fatal cleanup failure.
    });
  }
}

/**
 * Asserts that GrantApplication.xml exists in the zip and that its raw text
 * contains each of the provided expected element/value pairs.
 *
 * @param contents ZipContents returned by downloadAndUnzipSubmission
 * @param expectedFields Expected XML element/value pairs
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

/**
 * Extracts the text of a PDF in the zip, with all pages merged into one
 * string. Whitespace is collapsed so assertions don't depend on PDF
 * line breaks.
 *
 * @param contents ZipContents returned by downloadAndUnzipSubmission
 * @param pdfFileName Entry name in the zip, e.g. "SF424B.pdf"
 */
export async function readPdfText(
  contents: ZipContents,
  pdfFileName: string,
): Promise<string> {
  const pdfBytes = contents.files.get(pdfFileName);

  if (!pdfBytes) {
    const available = [...contents.files.keys()].join(", ");

    throw new Error(
      `${pdfFileName} not found in zip. Available files: ${available}`,
    );
  }

  const pdf = await getDocumentProxy(new Uint8Array(pdfBytes));
  const { text } = await extractText(pdf, { mergePages: true });

  return text.replace(/\s+/g, " ").trim();
}

/**
 * Asserts that the named PDF in the zip exists, has extractable text,
 * and contains each expected string or pattern.
 *
 * @param contents ZipContents returned by downloadAndUnzipSubmission
 * @param pdfFileName Entry name in the zip, e.g. "SF424B.pdf"
 * @param expected Strings or patterns that must appear in the PDF text
 */
export async function assertPdfContainsText(
  contents: ZipContents,
  pdfFileName: string,
  expected: (string | RegExp)[],
): Promise<void> {
  const pdfText = await readPdfText(contents, pdfFileName);

  expect(
    pdfText.length,
    `${pdfFileName} has no extractable text`,
  ).toBeGreaterThan(0);

  for (const item of expected) {
    if (typeof item === "string") {
      expect(pdfText, `Expected ${pdfFileName} to contain "${item}"`).toContain(
        item,
      );
    } else {
      expect(pdfText, `Expected ${pdfFileName} to match ${item}`).toMatch(item);
    }
  }
}
