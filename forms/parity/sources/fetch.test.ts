import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, expect, it, vi } from "vitest";

const inputs = vi.hoisted(() => ({ directory: "", url: "https://example.test/form.xsd" }));
vi.mock("../diffs/index.ts", () => ({ DIFFS: [{ slug: "test-form" }] }));
vi.mock("../harness/load.ts", () => ({
  get LOCK_FILE() { return path.join(inputs.directory, "sources.lock.json"); },
  cachePath: () => path.join(inputs.directory, "cached.xsd"),
  loadPlans: () => new Map([["test-form", { xsd_url: inputs.url }]]),
}));
vi.mock("./download.ts", () => ({ download: vi.fn() }));

afterEach(() => {
  rmSync(inputs.directory, { recursive: true, force: true });
  vi.resetAllMocks();
  vi.resetModules();
});

it("stops at a changed hash without a retry, cache write or lockfile update", async () => {
  inputs.directory = mkdtempSync(path.join(tmpdir(), "parity-source-lock-"));
  const lockFile = path.join(inputs.directory, "sources.lock.json");
  const original = JSON.stringify({ [inputs.url]: "expected-old-hash" });
  writeFileSync(lockFile, original);
  const { download } = await import("./download.ts");
  vi.mocked(download).mockResolvedValue(Buffer.from("upstream changed"));

  await expect(import("./fetch.ts")).rejects.toThrow("changed upstream");
  expect(download).toHaveBeenCalledExactlyOnceWith(inputs.url);
  expect(readFileSync(lockFile, "utf8")).toBe(original);
  expect(() => readFileSync(path.join(inputs.directory, "cached.xsd"))).toThrow();
});
