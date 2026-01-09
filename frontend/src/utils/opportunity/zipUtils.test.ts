/**
 * @jest-environment node
 */

import { HttpReader as FakeHttpReader } from "@zip.js/zip.js";
import {
  attachmentsToZipEntries,
  deduplicateFilename,
} from "src/utils/opportunity/zipUtils";

describe("deduplicateFilename", () => {
  it("returns original filename if no previous usage of name is found", () => {
    expect(deduplicateFilename("hello.txt", {})).toEqual("hello.txt");
  });
  it("adds existing sequence if present", () => {
    expect(deduplicateFilename("hello.txt", { "hello.txt": 1 })).toEqual(
      "hello(1).txt",
    );
  });
  it("handles a filename without an extension", () => {
    expect(deduplicateFilename("hello", { hello: 1 })).toEqual("hello(1)");
    expect(deduplicateFilename("hello", { hello: 2 })).toEqual("hello(2)");
  });
  it("handles a filename with periods and parentheses", () => {
    expect(
      deduplicateFilename("hello(3).something.txt", {
        "hello(3).something.txt": 2,
      }),
    ).toEqual("hello(3).something(2).txt");
  });
});

describe("attachmentsToZipEntries", () => {
  it("returns an empty array if passed no attachments", () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
      ["file.txt", expect.any(FakeHttpReader)],
      ["file.csv", expect.any(FakeHttpReader)],
    ]);
  });
  it("returns a list with all duplicate filenames handled", () => {
    expect(
      attachmentsToZipEntries([
        {
          file_name: "file.txt",
          download_path: "/anything/file.txt",
          updated_at: "yesterday",
        },
        {
          file_name: "file.txt",
          download_path: "/something/file.txt",
          updated_at: "tomorrow",
        },
        {
          file_name: "file.txt",
          download_path: "/another/file.txt",
          updated_at: "today",
        },
        {
          file_name: "Lou Bega - Mambo #5.mp3",
          download_path: "/good_songs/Lou Bega - Mambo #5.mp3",
          updated_at: "tomorrow",
        },
        {
          file_name: "Lou Bega - Mambo #5.mp3",
          download_path: "/bad_songs/Lou Bega - Mambo #5.mp3",
          updated_at: "today",
        },
        {
          file_name: "exec.bat",
          download_path: "/exec.bat",
          updated_at: "today",
        },
      ]),
    ).toEqual([
      ["file.txt", expect.any(FakeHttpReader)],
      ["file(1).txt", expect.any(FakeHttpReader)],
      ["file(2).txt", expect.any(FakeHttpReader)],
      ["Lou Bega - Mambo #5.mp3", expect.any(FakeHttpReader)],
      ["Lou Bega - Mambo #5(1).mp3", expect.any(FakeHttpReader)],
      ["exec.bat", expect.any(FakeHttpReader)],
    ]);
  });
});
