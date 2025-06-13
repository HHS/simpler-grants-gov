/**
 * @jest-environment node
 */

import { deduplicateFilename } from "src/utils/opportunity/zipDownloadUtils";

describe("deduplicateFilename", () => {
  it("adds a (1) sequence if previous filename has no sequence", () => {
    expect(deduplicateFilename("hello.txt")).toEqual("hello(1).txt");
  });
  it("adds to existing sequence if present", () => {
    expect(deduplicateFilename("hello(1).txt")).toEqual("hello(2).txt");
    // expect(deduplicateFilename("hello(1235).txt")).toEqual("hello(1236).txt");
  });
  it("handles a filename without an extension", () => {
    expect(deduplicateFilename("hello")).toEqual("hello(1)");
    expect(deduplicateFilename("hello(1)")).toEqual("hello(2)");
  });
  it("handles a filename with periods", () => {
    expect(deduplicateFilename("hello.something.txt")).toEqual(
      "hello.something(1).txt",
    );
    expect(deduplicateFilename("hello.something(1).txt")).toEqual(
      "hello.something(2).txt",
    );
    expect(deduplicateFilename("hello(3).something(1).txt")).toEqual(
      "hello(3).something(2).txt",
    );
  });
});
