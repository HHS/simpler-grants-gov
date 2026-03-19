// // ============================================================================
// // Test Data Utilities
// // ============================================================================
// // Helper functions for generating dynamic test data values
// // Includes fiscal year calculations, timestamps, and unique identifiers
// // ============================================================================

// // ============================================================================
// // CONFIGURATION & CONSTANTS
// // ============================================================================

// // Fiscal year configuration
// const FISCAL_YEAR_START_MONTH = 9; // October (0-indexed as 9)

// // ============================================================================
// // PRIVATE/INTERNAL HELPER FUNCTIONS
// // ============================================================================

// /**
//  * Pad a number with leading zero if single digit
//  * @param n - Number to pad
//  * @returns Padded number string
//  */
// function pad(n: number): string {
//   return String(n).padStart(2, "0");
// }

// // ============================================================================
// // DYNAMIC VALUE GENERATORS
// // ============================================================================

// /**
//  * Generate timestamp string in format: YYYY-MM-DD HH:MM:SS
//  * Useful for creating unique test data and application names
//  *
//  * @returns Formatted timestamp string
//  *
//  * @example
//  * const timestamp = testDataHelp_getTimestamp(); // "2026-02-13 14:30:45"
//  * const appName = `Test at ${timestamp}`;
//  */
// export function testDataHelp_getTimestamp(): string {
//   const d = new Date();
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
//     d.getHours(),
//   )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
// }

// /**
//  * Generate simple date string in format: YYYY-MM-DD
//  * @returns Formatted date string
//  *
//  * @example
//  * const dateString = testDataHelp_getDateString(); // "2026-02-13"
//  */
// export function testDataHelp_getDateString(): string {
//   const d = new Date();
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// }

// /**
//  * Calculate current fiscal year and quarter
//  * Fiscal year runs from Oct 1 - Sep 30
//  *
//  * @returns Object with prevYear, quarter, and lastDayOfPrevQuarter
//  *
//  * @example
//  * const { prevYear, quarter, lastDayOfPrevQuarter } = testDataHelp_calculateYearData();
//  * // Returns: { prevYear: "2025", quarter: "2", lastDayOfPrevQuarter: "2025-12-31" }
//  */
// export function testDataHelp_calculateYearData(): {
//   lastDayOfPrevQuarter: string;
//   prevYear: string;
//   quarter: string;
// } {
//   const now = new Date();
//   const currentYear = now.getFullYear();
//   const currentMonth = now.getMonth();

//   // Fiscal year starts in October (month 9)
//   const fiscalYear =
//     currentMonth >= FISCAL_YEAR_START_MONTH ? currentYear + 1 : currentYear;
//   const prevYear = String(fiscalYear - 1);

//   // Calculate quarter (1-4)
//   const quarterMonth = (currentMonth - FISCAL_YEAR_START_MONTH + 12) % 12;
//   const quarter = String(Math.floor(quarterMonth / 3) + 1);

//   // Calculate last day of previous quarter
//   const prevQuarterEndMonth =
//     FISCAL_YEAR_START_MONTH + (parseInt(quarter, 10) - 2) * 3 + 2;
//   const prevQuarterEndDate = new Date(currentYear, prevQuarterEndMonth + 1, 0);
//   const lastDayOfPrevQuarter = `${prevQuarterEndDate.getFullYear()}-${pad(
//     prevQuarterEndDate.getMonth() + 1,
//   )}-${pad(prevQuarterEndDate.getDate())}`;

//   return { lastDayOfPrevQuarter, prevYear, quarter };
// }

// /**
//  * Get current fiscal year and quarter (alias for calculateYearData)
//  * @returns Object with prevYear, quarter, and lastDayOfPrevQuarter
//  *
//  * @example
//  * const yearData = testDataHelp_getFiscalYearQuarter();
//  */
// export function testDataHelp_getFiscalYearQuarter(): {
//   lastDayOfPrevQuarter: string;
//   prevYear: string;
//   quarter: string;
// } {
//   return testDataHelp_calculateYearData();
// }

// /**
//  * Get current year as string
//  * @returns Current year as string (e.g., "2026")
//  *
//  * @example
//  * const year = testDataHelp_getCurrentYear(); // "2026"
//  */
// export function testDataHelp_getCurrentYear(): string {
//   return String(new Date().getFullYear());
// }

// /**
//  * Get current month (1-12)
//  * @returns Current month as string (e.g., "02" for February)
//  *
//  * @example
//  * const month = testDataHelp_getCurrentMonth(); // "02"
//  */
// export function testDataHelp_getCurrentMonth(): string {
//   return pad(new Date().getMonth() + 1);
// }

// /**
//  * Get current day of month
//  * @returns Current day as string (e.g., "13")
//  *
//  * @example
//  * const day = testDataHelp_getCurrentDay(); // "13"
//  */
// export function testDataHelp_getCurrentDay(): string {
//   return pad(new Date().getDate());
// }

// /**
//  * Generate unique identifier using timestamp
//  * @param prefix - Optional prefix for the identifier
//  * @returns Unique identifier string
//  *
//  * @example
//  * const uniqueId = testDataHelp_generateUniqueId("TEST");
//  * // Returns: "TEST_20260213_143045"
//  */
// export function testDataHelp_generateUniqueId(prefix = "ID"): string {
//   const timestamp = testDataHelp_getTimestamp().replace(/[:\s-]/g, "");
//   return `${prefix}_${timestamp}`;
// }

// /**
//  * Generate unique application name using timestamp
//  * @param baseAppName - Optional base name for the application
//  * @returns Unique application name
//  *
//  * @example
//  * const appName = testDataHelp_generateUniqueAppName("MyApp");
//  * // Returns: "MyApp_at_2026-02-13 14:30:45"
//  *
//  * @example
//  * const appName = testDataHelp_generateUniqueAppName();
//  * // Returns: "Test at 2026-02-13 14:30:45"
//  */
// export function testDataHelp_generateUniqueAppName(
//   baseAppName = "Test",
// ): string {
//   return `${baseAppName} at ${testDataHelp_getTimestamp()}`;
// }

// /**
//  * Generate a date relative to today
//  * @param offsetDays - Number of days to offset (negative for past, positive for future)
//  * @returns Date string in YYYY-MM-DD format
//  *
//  * @example
//  * const yesterday = testDataHelp_getDateOffset(-1);
//  * const nextWeek = testDataHelp_getDateOffset(7);
//  */
// export function testDataHelp_getDateOffset(offsetDays: number): string {
//   const d = new Date();
//   d.setDate(d.getDate() + offsetDays);
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// }

// /**
//  * Export constants for external use
//  */
// export const testDataConstants = {
//   FISCAL_YEAR_START_MONTH,
// };
