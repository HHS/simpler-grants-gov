import { render, screen } from "@testing-library/react";

import { ModalFooterProductSupport } from "./ModalFooterProductSupport";

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const translate = (key: string) => key;

    translate.rich = (key: string, values: Record<string, unknown>) => {
      type RichRenderer = (content: string) => React.ReactNode;

      if (key === "footer.productSupport") {
        const linkRenderer = values.link as RichRenderer;
        const telRenderer = values.tel as RichRenderer;

        return (
          <>
            {linkRenderer("simpler@grants.gov")}
            {telRenderer("1-800-518-4726")}
          </>
        );
      }

      if (key === "footer.alternativeMethodsOfApplying") {
        const linkRenderer = values.link as RichRenderer;
        return <>{linkRenderer("Grants.gov")}</>;
      }

      return translate(key);
    };

    return translate;
  },
}));

describe("ModalFooterProductSupport", () => {
  it("renders mailto, tel, and grants.gov links", () => {
    render(<ModalFooterProductSupport />);

    const emailLink = screen.getByRole("link", { name: "simpler@grants.gov" });
    expect(emailLink).toHaveAttribute("href", "mailto:simpler@grants.gov");

    const phoneLink = screen.getByRole("link", { name: "1-800-518-4726" });
    expect(phoneLink).toHaveAttribute("href", "tel:1-800-518-4726");

    const grantsLink = screen.getByRole("link", { name: "Grants.gov" });
    expect(grantsLink).toHaveAttribute("href", "https://Grants.gov");
  });
});
