import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeOpportunityDocument } from "src/utils/testing/fixtures";

import OpportunityDownload from "./OpportunityDownload";

describe("OpportunityDownload Component", () => {
  it("renders link if at least one attachment is present", () => {
    render(<OpportunityDownload attachments={[fakeOpportunityDocument]} />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#opportunity-documents");
  });

  it("has a single tab stop that lands on the link", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <OpportunityDownload attachments={[fakeOpportunityDocument]} />
        <button type="button">after</button>
      </>,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "before" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "jumpToDocuments" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("does not render link if no attachments are present", () => {
    render(<OpportunityDownload attachments={[]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
