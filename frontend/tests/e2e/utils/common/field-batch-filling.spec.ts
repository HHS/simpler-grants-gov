// field-batch-filling.spec.ts
// Unit-style Playwright tests for shared batch fill loop behavior.
// Usage: npx playwright test tests/e2e/utils/common/field-batch-filling.spec.ts

import { expect, test } from "@playwright/test";
import { runFieldFillBatch } from "tests/e2e/utils/common/field-batch-filling";

test.describe("runFieldFillBatch", () => {
  test("stops on first error when continueOnError is false", async () => {
    const visited: number[] = [];

    await expect(
      runFieldFillBatch<number>({
        items: [1, 2, 3],
        fillItem: async (item) => {
          visited.push(item);
          if (item === 2) {
            throw new Error("boom-2");
          }
        },
      }),
    ).rejects.toThrow("boom-2");

    expect(visited).toEqual([1, 2]);
  });

  test("continues and throws aggregated default summary when continueOnError is true", async () => {
    await expect(
      runFieldFillBatch<number>({
        items: [1, 2, 3],
        continueOnError: true,
        fillItem: async (item) => {
          if (item === 1) {
            throw new Error("bad-1");
          }
          if (item === 3) {
            throw new Error("bad-3");
          }
        },
      }),
    ).rejects.toThrow("Failed to fill 2 item(s):\nbad-1\nbad-3");
  });

  test("resolves when continueOnError is true and all items succeed", async () => {
    const visited: number[] = [];

    await expect(
      runFieldFillBatch<number>({
        items: [1, 2, 3],
        continueOnError: true,
        fillItem: async (item) => {
          visited.push(item);
        },
      }),
    ).resolves.toBeUndefined();

    expect(visited).toEqual([1, 2, 3]);
  });

  test("uses custom formatError output in failure aggregation", async () => {
    await expect(
      runFieldFillBatch<number>({
        items: [1, 2],
        continueOnError: true,
        fillItem: async (item) => {
          if (item === 2) {
            throw "raw-error";
          }
        },
        formatError: (item, error) => `item-${item}: ${String(error)}`,
      }),
    ).rejects.toThrow("Failed to fill 1 item(s):\nitem-2: raw-error");
  });

  test("uses custom failureSummary output", async () => {
    await expect(
      runFieldFillBatch<number>({
        items: [10, 20],
        continueOnError: true,
        fillItem: async () => {
          throw new Error("failed");
        },
        formatError: (item) => `failed-${item}`,
        failureSummary: (count, failures) =>
          `Batch failed (${count}): ${failures.join(" | ")}`,
      }),
    ).rejects.toThrow("Batch failed (2): failed-10 | failed-20");
  });
});