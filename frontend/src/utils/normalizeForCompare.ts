import { isBooleanString, toBooleanString } from "src/utils/booleanStrings";


/**
 * Given an option’s value and the current field value, return a value that
 * compares correctly against the option’s representation (especially for
 * boolean radios where options are "true"/"false" strings).
 */
export function normalizeForCompare(
  optionValue: unknown,
  current: unknown,
): unknown {
  if (isBooleanString(optionValue)) {
    return toBooleanString(current);
  }

  return current;
}