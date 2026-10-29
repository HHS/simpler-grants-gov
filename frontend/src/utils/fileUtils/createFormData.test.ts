/**
 * @jest-environment ./src/utils/testing/jsdomNodeEnvironment.ts
 */

import { createFormDataForFile } from "./createFormData";

describe("createFormDataForFile", () => {
  it("returns form data with file attached at specified key", async () => {
    const result = await createFormDataForFile(
      new File(["test content"], "test.txt", {
        type: "text/plain",
      }),
    );
    const formDataFile = result.get("file_attachment") as File;
    expect(formDataFile).toBeInstanceOf(File);
    expect(formDataFile.name).toEqual("test.txt");
    expect(formDataFile.type).toEqual("text/plain");
  });
});
