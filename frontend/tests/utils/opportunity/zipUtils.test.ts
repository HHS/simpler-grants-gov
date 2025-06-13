/**
 * @jest-environment node
 */

// import * as zip from "@zip.js/zip.js";

import {
  attachmentsToZipEntries,
  deduplicateFilename,
} from "src/utils/opportunity/zipUtils";

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

describe("attachmentsToZipEntries", () => {
  it("returns an empty array if passed no attachments", () => {
    // @ts-ignore
    expect(attachmentsToZipEntries(null)).toEqual([]);
    expect(attachmentsToZipEntries([])).toEqual([]);
  });
  it("returns a basic list of filenames and HttpReader instances", () => {
    expect(
      attachmentsToZipEntries([
        {
          file_name: "file.txt",
          download_path: "/file.txt",
          updated_at: "yesterday",
        },
        {
          file_name: "file.csv",
          download_path: "/file.csv",
          updated_at: "tomorrow",
        },
      ]),
    ).toEqual([
      ["file.txt", expect.any(zip.HttpReader)],
      ["file.csv", expect.any(zip.HttpReader)],
    ]);
  });
  it("returns a basic list of filenames and HttpReader instances", () => {
    expect(
      attachmentsToZipEntries([
        {
          file_name: "file.txt",
          download_path: "/file.txt",
          updated_at: "yesterday",
        },
        {
          file_name: "file.csv",
          download_path: "/file.csv",
          updated_at: "tomorrow",
        },
      ]),
    ).toEqual([
      ["file.txt", expect.any(zip.HttpReader)],
      ["file.csv", expect.any(zip.HttpReader)],
    ]);

    expect();
  });
});
