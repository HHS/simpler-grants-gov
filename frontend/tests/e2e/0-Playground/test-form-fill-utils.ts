// import { Locator, Page, TestInfo } from "@playwright/test";

// const TIMEOUTS = {
//   DEFAULT: 30000,
// } as const;

// const ERROR_ELEMENT_NOT_FOUND = "element not found within";
// const ANNOTATION_SKIPPED_FIELD = "skipped-field";
// const ATTACHMENT_SKIPPED_FIELD = "skipped-field-log";
// const SYMBOL_TIMER = "⏱️";
// const MSG_FILLED_SUCCESSFULLY = "Filled";
// const MSG_SELECTED_SUCCESSFULLY = "Selected";
// const MSG_TIMEOUT_NOT_FOUND = "TIMEOUT/NOT FOUND:";
// const MSG_SKIPPING = "skipping";

// function extractLineNumber(): number | undefined {
//   const stack = new Error().stack || "";
//   const lines = stack.split("\n");
//   for (const line of lines) {
//     if (line.includes("test-form-fill-utils.ts")) {
//       continue;
//     }
//     const match = line.match(/:(\d+):\d+\)?$/);
//     if (match) {
//       return parseInt(match[1], 10);
//     }
//   }
//   return undefined;
// }

// function incrementSoftFail(testInfo: TestInfo): void {
//   const info = testInfo as unknown as { _softFailCount?: number };
//   info._softFailCount = (info._softFailCount ?? 0) + 1;
// }

// async function handleFieldOperation(
//   testInfo: TestInfo,
//   locator: Locator,
//   operation: (loc: Locator) => Promise<void>,
//   fieldType: string,
//   timeoutMs?: number,
// ): Promise<boolean> {
//   const timeout = timeoutMs ?? TIMEOUTS.DEFAULT;
//   const lineNumber = extractLineNumber();
//   const lineLabel = lineNumber ? `Line ${lineNumber}` : "Line unknown";

//   try {
//     await locator.waitFor({ state: "attached", timeout });
//     await operation(locator);
//     return true;
//   } catch {
//     incrementSoftFail(testInfo);
//     const errorMsg = `${SYMBOL_TIMER} ${MSG_TIMEOUT_NOT_FOUND} ${lineLabel} ${fieldType} - ${ERROR_ELEMENT_NOT_FOUND} ${timeout}ms, ${MSG_SKIPPING}, locator: ${locator.toString()}`;
//     testInfo.annotations.push({
//       type: ANNOTATION_SKIPPED_FIELD,
//       description: errorMsg,
//     });
//     await testInfo.attach(ATTACHMENT_SKIPPED_FIELD, {
//       body: errorMsg,
//       contentType: "text/plain",
//     });
//     return false;
//   }
// }

// export async function safeHelp_safeFill(
//   testInfo: TestInfo,
//   locator: Locator,
//   value: string,
//   timeoutMs?: number,
// ): Promise<boolean> {
//   return handleFieldOperation(
//     testInfo,
//     locator,
//     (loc) => loc.fill(value),
//     MSG_FILLED_SUCCESSFULLY,
//     timeoutMs,
//   );
// }

// export async function safeHelp_fillFieldsByTestId(
//   testInfo: TestInfo,
//   page: Page,
//   fields: Array<{ testId: string; value: string }>,
//   timeoutMs?: number,
// ): Promise<void> {
//   for (const field of fields) {
//     await safeHelp_safeFill(
//       testInfo,
//       page.getByTestId(field.testId),
//       field.value,
//       timeoutMs,
//     );
//   }
// }

// export async function safeHelp_safeSelectOption(
//   testInfo: TestInfo,
//   locator: Locator,
//   value: string,
//   timeoutMs?: number,
// ): Promise<boolean> {
//   return handleFieldOperation(
//     testInfo,
//     locator,
//     async (loc) => {
//       await loc.selectOption(value);
//     },
//     MSG_SELECTED_SUCCESSFULLY,
//     timeoutMs,
//   );
// }

// export async function safeHelp_selectDropdownLocator(
//   testInfo: TestInfo,
//   page: Page,
//   selector: string,
//   value: string,
//   timeoutMs?: number,
// ): Promise<boolean> {
//   return safeHelp_safeSelectOption(
//     testInfo,
//     page.locator(selector),
//     value,
//     timeoutMs,
//   );
// }
