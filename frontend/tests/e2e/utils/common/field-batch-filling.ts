// field-batch-filling.ts
// Runs shared fill loops with optional continue-on-error and aggregated failures.
// Usage: import { runFieldFillBatch } from "tests/e2e/utils/common/field-batch-filling";

type RunFieldFillBatchOptions<TItem> = {
  items: TItem[];
  fillItem: (item: TItem) => Promise<void>;
  continueOnError?: boolean;
  formatError?: (item: TItem, error: unknown) => string;
  failureSummary?: (failureCount: number, failures: string[]) => string;
};

export async function runFieldFillBatch<TItem>(
  options: RunFieldFillBatchOptions<TItem>,
): Promise<void> {
  const continueOnError = options.continueOnError ?? false;

  if (!continueOnError) {
    for (const item of options.items) {
      await options.fillItem(item);
    }
    return;
  }

  const failures: string[] = [];

  for (const item of options.items) {
    try {
      await options.fillItem(item);
    } catch (error) {
      const errorMessage = options.formatError
        ? options.formatError(item, error)
        : error instanceof Error
          ? error.message
          : String(error);
      failures.push(errorMessage);
    }
  }

  if (failures.length === 0) {
    return;
  }

  const summary = options.failureSummary
    ? options.failureSummary(failures.length, failures)
    : `Failed to fill ${failures.length} item(s):\n${failures.join("\n")}`;

  throw new Error(summary);
}