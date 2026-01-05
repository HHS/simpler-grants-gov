import { generateMetadata } from "./page";
import { makeLocalizedPageProps } from "tests/utils/page-utils";
import { messages } from "src/i18n/messages/en";
import { getMessage } from "tests/utils/intl";


jest.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => getMessage(messages, key),
  setRequestLocale: jest.fn(),
}));

describe("Events page metadata", () => {
  it("sets the browser title and description", async () => {
    const metadata = await generateMetadata(makeLocalizedPageProps("en"));

    expect(metadata.title).toBe(getMessage(messages, "Events.pageTitle"));
    expect(metadata.description).toBe(getMessage(messages, "Index.metaDescription"));
  });
});
