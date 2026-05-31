import { formatFileSize } from "./formatFileSizeUtil";

describe("formatFileSize", () => {
  it("formats 0 bytes correctly", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
  });

  it("formats bytes correctly", () => {
    expect(formatFileSize(500)).toBe("500 Bytes");
  });

  it("formats kilobytes correctly", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1500)).toBe("1.5 KB");
  });

  it("formats megabytes correctly", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
    expect(formatFileSize(1500 * 1024)).toBe("1.5 MB");
  });

  it("formats gigabytes correctly", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("formats terabytes correctly", () => {
    expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe("1 TB");
  });

  it("respects the decimals parameter", () => {
    // 1500 bytes = 1.46484375 KB
    expect(formatFileSize(1500, 2)).toBe("1.46 KB");
    expect(formatFileSize(1500, 0)).toBe("1 KB");
    // 1.464 rounded to 3 decimals is 1.465
    expect(formatFileSize(1500, 3)).toBe("1.465 KB");
  });
});
