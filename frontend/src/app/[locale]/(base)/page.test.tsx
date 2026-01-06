import { generateMetadata } from "./page";
import { makeLocalizedPageProps } from "tests/utils/page-utils";
import { messages } from "src/i18n/messages/en";
import { getMessage, type MessagesTree } from "tests/utils/intl";

jest.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) =>
    getMessage(messages as MessagesTree, key),
}));

describe("Home page metadata", () => {
  it("sets the browser title and description", async () => {
    const metadata = await generateMetadata(makeLocalizedPageProps("en"));

    expect(metadata.title).toBe(messages.Index.pageTitle);
    expect(metadata.description).toBe(messages.Index.metaDescription);
  });
});