import { fireEvent, render, screen } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import OpportunityDownload from "src/components/opportunity/OpportunityDownload";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("OpportunityDownload Component", () => {
  const nofoPath = "http://example.com/nofo.pdf";

  it("renders if nofoPath is present", () => {
    render(<OpportunityDownload opportunityId={1} nofoPath={nofoPath} />);

    expect(
      screen.getByRole("button", { name: "nofo_download" }),
    ).toBeInTheDocument();
  });

  it("does not render if nofoPath is not present", () => {
    render(<OpportunityDownload opportunityId={1} nofoPath="" />);

    expect(
      screen.queryByRole("button", { name: "nofo_download" }),
    ).not.toBeInTheDocument();
  });

  it("opens a new tab when download button is clicked", () => {
    window.open = jest.fn();

    render(<OpportunityDownload opportunityId={1} nofoPath={nofoPath} />);

    const downloadButton = screen.getByRole("button", {
      name: "nofo_download",
    });

    fireEvent.click(downloadButton);

    expect(window.open).toHaveBeenCalledWith(nofoPath, "_blank");
  });
});
