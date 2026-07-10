import path from "path";

const TEST_UPLOAD_DIR = path.resolve(__dirname, "../../test-upload-files");

export const otherNarrativeAttachmentHappyPathTestData: Record<string, string> =
  {
    attachments: `${TEST_UPLOAD_DIR}/sample-upload-kb.pdf`,
  };
