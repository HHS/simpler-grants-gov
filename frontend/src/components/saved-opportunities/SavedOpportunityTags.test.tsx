import { render, screen } from "@testing-library/react";

import { SavedOpportunityTag } from "./buildSavedOpportunityTags";
import { SavedOpportunityTags } from "./SavedOpportunityTags";

jest.mock("next-intl", () => ({
  useTranslations: () => {
    return (key: string) => {
      if (key === "shareWithYourList") {
        return "Shared with:";
      }

      return key;
    };
  },
}));

describe("SavedOpportunityTags", () => {
  it("renders nothing when no tags are provided", () => {
    const { container } = render(
      <SavedOpportunityTags tags={[]} labelId={"1"} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the label and all provided tags", () => {
    const tags: SavedOpportunityTag[] = [
      {
        key: "individual",
        kind: "individual",
        label: "Individual",
        screenReaderLabel: "Saved to your list",
      },
      {
        key: "organization-1",
        kind: "organization",
        label: "Alpha Coalition",
        screenReaderLabel: "Shared with Alpha Coalition",
      },
    ];

    render(<SavedOpportunityTags tags={tags} labelId={"2"} />);

    expect(screen.getByText("Shared with:")).toBeInTheDocument();
    expect(screen.getByText("Individual")).toBeInTheDocument();
    expect(screen.getByText("Alpha Coalition")).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
