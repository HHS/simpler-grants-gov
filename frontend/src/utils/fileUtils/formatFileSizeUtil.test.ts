import { formatFileSize } from "src/utils/fileUtils/formatFileSizeUtil";

describe("formatFileSize", () => {
  it("returns '0 Bytes' for zero", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
  });

  it("formats bytes under 1 KB", () => {
    expect(formatFileSize(512)).toBe("512 Bytes");
  });

  it("formats exactly 1 KB", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1 MB");
  });

  it("formats large megabytes with decimal precision", () => {
    expect(formatFileSize(1572864)).toBe("1.5 MB");
  });

  it("formats gigabytes", () => {
    expect(formatFileSize(1073741824)).toBe("1 GB");
  });

  it("formats terabytes", () => {
    expect(formatFileSize(1099511627776)).toBe("1 TB");
  });

  it("respects custom decimal places", () => {
    expect(formatFileSize(1380, 2)).toBe("1.35 KB");
    expect(formatFileSize(1380)).toBe("1.3 KB");
  });

  it("handles 1 byte", () => {
    expect(formatFileSize(1)).toBe("1 Bytes");
  });

  it("handles values between KB and MB", () => {
    expect(formatFileSize(512000)).toBe("500 KB");
  });
});
