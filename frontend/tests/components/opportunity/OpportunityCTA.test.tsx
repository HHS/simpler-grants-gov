import { render, screen } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import OpportunityCTA, {
  OpportunityContentBox,
} from "src/components/opportunity/OpportunityCTA";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("OpportunityCTA", () => {
  it("renders the expected content based on posted status", () => {
    render(<OpportunityCTA status={"posted"} id={1} />);

    expect(screen.getByText("apply_title")).toBeInTheDocument();
    expect(screen.getByText("apply_content")).toBeInTheDocument();
  });

  it("renders the expected content based on closed / non-posted status", () => {
    const { rerender } = render(<OpportunityCTA status={"closed"} id={1} />);

    expect(screen.getByText("closed_title")).toBeInTheDocument();
    expect(screen.getByText("closed_content")).toBeInTheDocument();

    rerender(<OpportunityCTA status={"archived"} id={1} />);

    expect(screen.getByText("closed_title")).toBeInTheDocument();
    expect(screen.getByText("closed_content")).toBeInTheDocument();

    rerender(<OpportunityCTA status={"forecasted"} id={1} />);

    expect(screen.getByText("closed_title")).toBeInTheDocument();
    expect(screen.getByText("closed_content")).toBeInTheDocument();
  });

  it("renders a link that links out to the opportunity detail on grants.gov", () => {
    render(<OpportunityCTA status={"posted"} id={1} />);

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://grants.gov/search-results-detail/1",
    );
  });
});

describe("OpportunityContentBox", () => {
  it("displays title if one is provided", () => {
    render(<OpportunityContentBox title="fun title" content="fun content" />);
    expect(screen.getByText("fun title")).toBeInTheDocument();
  });
  it("does not displays title if one is not provided", () => {
    render(<OpportunityContentBox content="fun content" />);
    expect(screen.getAllByRole("paragraph")).toHaveLength(1);
  });
  it("displays content as string or React children", () => {
    const { rerender } = render(
      <OpportunityContentBox title="fun title" content="fun content" />,
    );
    expect(screen.getByText("fun content")).toBeInTheDocument();

    rerender(
      <OpportunityContentBox
        title="fun title"
        content={
          <>
            <span>Some Stuff</span>
            <button>A button</button>
          </>
        }
      />,
    );

    expect(screen.getByText("Some Stuff")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
