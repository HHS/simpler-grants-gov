import type { Attachment } from "src/types/attachmentTypes";
import { sortAttachments } from "src/utils/attachment/sortAttachments";

const makeAttachment = (
  file_name: string,
  file_size_bytes: number,
  updated_at: string,
): Attachment =>
  ({
    application_attachment_id: `id-${file_name}`,
    created_at: "2024-01-01T00:00:00Z",
    file_name,
    file_size_bytes,
    mime_type: "application/pdf",
    updated_at,
    download_path: `/download/${file_name}`,
  }) as Attachment;

const fixtures: Attachment[] = [
  makeAttachment("c.pdf", 1024, "2024-03-01T00:00:00Z"),
  makeAttachment("a.pdf", 512, "2024-01-01T00:00:00Z"),
  makeAttachment("b.pdf", 2048, "2024-02-01T00:00:00Z"),
];

describe("sortAttachments", () => {
  it("sorts by file_name ascending", () => {
    const result = sortAttachments(fixtures, "file_name", "asc");
    expect(result.map((a) => a.file_name)).toEqual(["a.pdf", "b.pdf", "c.pdf"]);
  });

  it("sorts by file_name descending", () => {
    const result = sortAttachments(fixtures, "file_name", "desc");
    expect(result.map((a) => a.file_name)).toEqual(["c.pdf", "b.pdf", "a.pdf"]);
  });

  it("sorts by file_size_bytes ascending", () => {
    const result = sortAttachments(fixtures, "file_size_bytes", "asc");
    expect(result.map((a) => a.file_size_bytes)).toEqual([512, 1024, 2048]);
  });

  it("sorts by file_size_bytes descending", () => {
    const result = sortAttachments(fixtures, "file_size_bytes", "desc");
    expect(result.map((a) => a.file_size_bytes)).toEqual([2048, 1024, 512]);
  });

  it("sorts by updated_at ascending", () => {
    const result = sortAttachments(fixtures, "updated_at", "asc");
    expect(result.map((a) => a.updated_at)).toEqual([
      "2024-01-01T00:00:00Z",
      "2024-02-01T00:00:00Z",
      "2024-03-01T00:00:00Z",
    ]);
  });

  it("sorts by updated_at descending", () => {
    const result = sortAttachments(fixtures, "updated_at", "desc");
    expect(result.map((a) => a.updated_at)).toEqual([
      "2024-03-01T00:00:00Z",
      "2024-02-01T00:00:00Z",
      "2024-01-01T00:00:00Z",
    ]);
  });

  it("does not mutate the original array", () => {
    const copy = [...fixtures];
    sortAttachments(fixtures, "file_name", "asc");
    expect(fixtures).toEqual(copy);
  });

  it("returns a new array", () => {
    const result = sortAttachments(fixtures, "file_name", "asc");
    expect(result).not.toBe(fixtures);
  });

  it("handles empty array", () => {
    const result = sortAttachments([], "file_name", "asc");
    expect(result).toEqual([]);
  });

  it("handles single element array", () => {
    const single = [fixtures[0]];
    const result = sortAttachments(single, "file_name", "asc");
    expect(result).toEqual(single);
  });

  it("handles equal values without error", () => {
    const equalFixtures: Attachment[] = [
      makeAttachment("a.pdf", 1024, "2024-01-01T00:00:00Z"),
      makeAttachment("b.pdf", 1024, "2024-01-01T00:00:00Z"),
    ];
    const result = sortAttachments(equalFixtures, "file_size_bytes", "asc");
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.file_size_bytes)).toEqual([1024, 1024]);
  });
});
