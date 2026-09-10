/**
 * Builds deterministic happy-path data for the competition/application-package page.
 * Usage: import { buildApplicationPackageHappyPathFillData } from "tests/e2e/opportunity/fixtures/application-package-fill-data";
 */

import { ApplicationPackageFieldValueKey } from "tests/e2e/opportunity/fixtures/application-package-field-definitions";

/** Formats numbers as two-digit strings for deterministic date/time values. */
const pad2 = (value: number) => value.toString().padStart(2, "0");

/** Converts a Date to MM/DD/YYYY for date inputs. */
const toDateInputValue = (date: Date) => {
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}/${date.getFullYear()}`;
};

/** Returns a new Date offset by the given number of days. */
const addDays = (date: Date, daysToAdd: number) => {
  const updated = new Date(date);
  updated.setDate(updated.getDate() + daysToAdd);
  return updated;
};

/** Builds a stable timestamp-backed value to avoid collisions between runs. */
const buildTimestampValue = (prefix: string, now: Date) => {
  return `${prefix}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}-${now.getFullYear()}-${pad2(now.getHours())}-${pad2(now.getMinutes())}-${pad2(now.getSeconds())}`;
};

/** Builds happy-path Competition form data keyed by field definitions. */
export const buildApplicationPackageHappyPathFillData = (
  now: Date,
): Record<ApplicationPackageFieldValueKey, string> => {
  return {
    competitionId: buildTimestampValue("Competition", now),
    competitionTitle: buildTimestampValue("Competition Title", now),
    whoCanApply: "Organizations only",
    submissionsOpen: toDateInputValue(now),
    submissionsClose: toDateInputValue(addDays(now, 30)),
    extensionPeriod: "5",
    fullName: "Test Full Name",
    title: "Program Manager",
    emailAddress: "test@example.com",
    phoneNumber: "5555551234",
  };
};
