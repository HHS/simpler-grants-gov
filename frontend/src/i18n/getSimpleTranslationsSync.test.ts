import { getSimpleTranslationsSync } from "src/i18n/getMessagesSync";

describe("getSimpleTranslationsSync", () => {
  it("returns original string for string that is not in namespace", () => {
    const result = getSimpleTranslationsSync({
      nameSpace: "Form",
      translateableString: "hello",
    });
    expect(result).toBe("hello");
    expect(typeof result).toBe("string");
  });

  it("returns fallback translations for correct string", () => {
    const result = getSimpleTranslationsSync({
      nameSpace: "Form",
      translateableString: "AL: Alabama",
    });
    expect(result).toBe("Alabama");
    expect(typeof result).toBe("string");
  });
});
