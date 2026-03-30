import { render, screen } from "@testing-library/react";

import { SavedOpportunityTag } from "./buildSavedOpportunityTags";
import { SavedOpportunityTagPill } from "./SavedOpportunityTagPill";

describe("SavedOpportunityTagPill", () => {
  it("renders the visible label and screen-reader label", () => {
    const tag: SavedOpportunityTag = {
      key: "organization-1",
      kind: "organization",
      label: "Alpha Coalition",
      screenReaderLabel: "Shared with Alpha Coalition",
    };

    render(<SavedOpportunityTagPill tag={tag} />);

    expect(screen.getByText("Alpha Coalition")).toBeInTheDocument();
    expect(screen.getByText("Shared with Alpha Coalition")).toBeInTheDocument();
  });
});
