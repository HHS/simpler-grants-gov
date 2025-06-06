import { render, screen } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import OpportunityCTA, {
  OpportunityContentBox,
} from "src/components/opportunity/OpportunityCTA";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("OpportunityCTA", () => {
  it("renders the expected content and title", () => {
    render(<OpportunityCTA id={1} />);

    expect(screen.getByText("applyTitle")).toBeInTheDocument();
    expect(screen.getByText("applyContent")).toBeInTheDocument();
  });

  it("renders a link that links out to the opportunity detail on grants.gov", () => {
    render(<OpportunityCTA id={1} />);

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://test.grants.gov/search-results-detail/1",
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
