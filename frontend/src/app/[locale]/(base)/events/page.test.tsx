import type { LocalizedPageProps } from "src/types/intl";
import { generateMetadata } from "./page";

jest.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => key,
}));

describe("Events page metadata", () => {
  it("sets the browser title and description correctly", async () => {
    const props: LocalizedPageProps = {
      params: Promise.resolve({ locale: "en" }),
    };

    const metadata = await generateMetadata(props);

    expect(metadata.title).toBe("Events.pageTitle");
    expect(metadata.description).toBe("Index.metaDescription");
  });
});