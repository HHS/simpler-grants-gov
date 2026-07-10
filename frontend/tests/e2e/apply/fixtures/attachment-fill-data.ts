import path from "path";

const TEST_UPLOAD_DIR = path.resolve(__dirname, "../../test-upload-files");

export const attachmentHappyPathTestData: Record<string, string> = {
  att1: `${TEST_UPLOAD_DIR}/sample-upload-kb.pdf`,
};
