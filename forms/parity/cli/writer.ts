/** Guarded JSON replacement; no source discovery, AST mutation or candidate execution. */
import { lstat, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { resolve, readRecord, storeEntry } from "../diffs/store.ts";
import type {
  Comparison,
  FormDiff,
  Discrepancy,
  Recorded,
  Value,
} from "../harness/model.ts";

export function preview(
  registered: { file: string; diff: FormDiff },
  comparison: Comparison,
  target: NonNullable<Discrepancy["recordAs"]>,
  entry: Recorded & { plan?: Value; source?: Value },
) {
  const record = readRecord(registered.file);
  if (!isDeepStrictEqual(record.diff, registered.diff))
    throw new Error(
      "Evaluated record changed; rerun findings before retrying.",
    );
  if (target.key === "__proto__" || target.register === "renamed")
    throw new Error("Unsupported record target; no record was written.");
  const data = structuredClone(record.data);
  const registers = (data[comparison] ??= {});
  const entries = (registers[target.register] ??= {});
  const beforeEntry = entries[target.key];
  entries[target.key] = storeEntry(entry, record.reasons, beforeEntry);
  const expected = {
    ...record.diff,
    [comparison]: {
      ...record.diff[comparison],
      [target.register]: {
        ...record.diff[comparison]?.[target.register],
        [target.key]: entry,
      },
    },
  };
  if (!isDeepStrictEqual(resolve(data, record.reasons), expected))
    throw new Error("Proposed data changes more than the selected record.");
  return {
    ...record,
    after: JSON.stringify(data, null, 2) + "\n",
    change: {
      comparison,
      ...target,
      before: beforeEntry ?? null,
      after: entries[target.key],
    },
  };
}
export type Preview = ReturnType<typeof preview>;

export async function commit(edit: Preview, dryRun: boolean) {
  const stat = await lstat(edit.file);
  if (!stat.isFile() || stat.isSymbolicLink())
    throw new Error("Record destination must remain a regular file.");
  async function unchanged() {
    if (
      (await readFile(edit.file, "utf8")) !== edit.before ||
      (await readFile(edit.reasonFile, "utf8")) !== edit.reasonsBefore
    )
      throw new Error(
        "Record or shared reasons changed; rerun findings before retrying.",
      );
  }
  await unchanged();
  if (dryRun) return;
  const temporary = path.join(
    path.dirname(edit.file),
    `.${path.basename(edit.file)}.accept-${randomUUID()}`,
  );
  try {
    await writeFile(temporary, edit.after, {
      flag: "wx",
      mode: stat.mode & 0o777,
    });
    await unchanged();
    await rename(temporary, edit.file);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}
