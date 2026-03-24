import path from "path";

const TEST_UPLOAD_DIR = path.join(__dirname, "../../test-upload-files");

export const attachmentHappyPathTestData: Record<string, string> = {
  att1: path.join(TEST_UPLOAD_DIR, "sample-upload-kb.pdf"),
};
