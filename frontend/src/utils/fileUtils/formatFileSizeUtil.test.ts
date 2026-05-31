import { formatFileSize } from "src/utils/fileUtils/formatFileSizeUtil";

describe("formatFileSize", () => {
  it("returns '0 Bytes' for zero", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
  });

  it("formats bytes under 1 KB", () => {
    expect(formatFileSize(512)).toBe("512 Bytes");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
  });

  it("formats gigabytes", () => {
    expect(formatFileSize(1024 ** 3)).toBe("1 GB");
  });

  it("honours the decimals parameter", () => {
    expect(formatFileSize(1536, 2)).toBe("1.5 KB");
    expect(formatFileSize(1500, 3)).toBe("1.465 KB");
  });
});
