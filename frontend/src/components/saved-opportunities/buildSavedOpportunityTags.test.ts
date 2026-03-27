import { createMockOpportunity } from "src/utils/testing/fixtures";

import {
  buildSavedOpportunityTags,
  SavedOpportunityTag,
} from "./buildSavedOpportunityTags";

describe("buildSavedOpportunityTags", () => {
  it("returns Individual first when there are no organizations", () => {
    const opportunity = createMockOpportunity();

    const tags = buildSavedOpportunityTags(opportunity);

    expect(tags).toEqual<SavedOpportunityTag[]>([
      {
        key: "individual",
        kind: "individual",
        label: "Individual",
        screenReaderLabel: "Saved to your list",
      },
    ]);
  });

  it("sorts organization tags alphabetically after Individual", () => {
    const opportunity = createMockOpportunity({
      saved_to_organizations: [
        {
          organization_id: "organization-2",
          organization_name: "Zebra Foundation",
        },
        {
          organization_id: "organization-1",
          organization_name: "Alpha Coalition",
        },
      ],
    });

    const tags = buildSavedOpportunityTags(opportunity);

    expect(tags).toEqual<SavedOpportunityTag[]>([
      {
        key: "individual",
        kind: "individual",
        label: "Individual",
        screenReaderLabel: "Saved to your list",
      },
      {
        key: "organization-organization-1",
        kind: "organization",
        label: "Alpha Coalition",
        screenReaderLabel: "Shared with Alpha Coalition",
      },
      {
        key: "organization-organization-2",
        kind: "organization",
        label: "Zebra Foundation",
        screenReaderLabel: "Shared with Zebra Foundation",
      },
    ]);
  });

  it("trims organization names before rendering labels", () => {
    const opportunity = createMockOpportunity({
      saved_to_organizations: [
        {
          organization_id: "organization-1",
          organization_name: "  Alpha Coalition  ",
        },
      ],
    });

    const tags = buildSavedOpportunityTags(opportunity);

    expect(tags[1]).toEqual<SavedOpportunityTag>({
      key: "organization-organization-1",
      kind: "organization",
      label: "Alpha Coalition",
      screenReaderLabel: "Shared with Alpha Coalition",
    });
  });

  it("filters out null and blank organization names", () => {
    const opportunity = createMockOpportunity({
      saved_to_organizations: [
        {
          organization_id: "organization-1",
          organization_name: null,
        },
        {
          organization_id: "organization-2",
          organization_name: "   ",
        },
        {
          organization_id: "organization-3",
          organization_name: "Valid Organization",
        },
      ],
    });

    const tags = buildSavedOpportunityTags(opportunity);

    expect(tags).toEqual<SavedOpportunityTag[]>([
      {
        key: "individual",
        kind: "individual",
        label: "Individual",
        screenReaderLabel: "Saved to your list",
      },
      {
        key: "organization-organization-3",
        kind: "organization",
        label: "Valid Organization",
        screenReaderLabel: "Shared with Valid Organization",
      },
    ]);
  });
});
