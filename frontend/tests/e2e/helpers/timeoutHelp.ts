// ============================================================================
// Timeout Configuration & Helpers
// ============================================================================
// Centralized timeout settings for all test operations
// ============================================================================

/**
 * Timeout Presets
 * Define standard timeout values for different types of operations
 */
const TIMEOUTS = {
  INSTANT: 5000,       // Quick operations (5 seconds)
  FAST: 10000,         // Fast-loading fields (10 seconds)
  DEFAULT: 30000,      // Default timeout for most operations (30 seconds)
  SLOW: 60000,         // Slow-loading fields (60 seconds)
  EXTENDED: 120000,    // Extended timeout for complex operations (2 minutes)
  TEST: 120000,        // Test execution timeout (2 minutes)
} as const;

type TimeoutPreset = keyof typeof TIMEOUTS;

/**
 * Get timeout value by preset name
 * @param preset - Timeout preset name (e.g., 'DEFAULT', 'FAST', 'SLOW', 'TEST')
 * @returns Timeout value in milliseconds
 *
 * @example
 * const timeout = getTimeout('DEFAULT');  // 30000ms
 * const timeout = getTimeout('SLOW');     // 60000ms
 * const timeout = getTimeout('TEST');     // 120000ms
 *
 * @example
 * // Use in test timeout
 * test.setTimeout(getTimeout('TEST'));
 *
 * @example
 * // Use in navigation
 * await safeGoto(testInfo, page, url, 'networkidle', getTimeout('SLOW'));
 */
function getTimeout(preset: TimeoutPreset = 'DEFAULT'): number {
  return TIMEOUTS[preset];
}

/**
 * Get all available timeout presets
 * @returns Object containing all timeout preset names and values
 *
 * @example
 * const allTimeouts = getAllTimeouts();
 * console.log(allTimeouts); // { INSTANT: 5000, FAST: 10000, ... }
 */
function getAllTimeouts(): typeof TIMEOUTS {
  return { ...TIMEOUTS };
}

/**
 * Check if a timeout preset exists
 * @param preset - Timeout preset name to check
 * @returns True if preset exists, false otherwise
 *
 * @example
 * if (hasTimeout('CUSTOM')) {
 *   // Use custom timeout
 * }
 */
function hasTimeout(preset: string): preset is TimeoutPreset {
  return preset in TIMEOUTS;
}

export { TIMEOUTS, getTimeout, getAllTimeouts, hasTimeout };
export type { TimeoutPreset };
