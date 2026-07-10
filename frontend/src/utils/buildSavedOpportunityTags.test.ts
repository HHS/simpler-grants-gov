import { createMockOpportunity } from "src/utils/testing/fixtures";

import {
  buildSavedOpportunityTags,
  SavedOpportunityTag,
} from "./buildSavedOpportunityTags";

describe("buildSavedOpportunityTags", () => {
  it("returns Individual when the opportunity is saved by the user and there are no matching organizations", () => {
    const opportunity = createMockOpportunity({
      saved_to_organizations: [],
    });

    const tags = buildSavedOpportunityTags(
      opportunity,
      new Set<string>(),
      true,
    );

    expect(tags).toEqual<SavedOpportunityTag[]>([
      {
        key: "individual",
        label: "Individual",
        screenReaderLabel: "Saved by you",
        kind: "individual",
      },
    ]);
  });

  it("does not return Individual when the opportunity is not saved by the user", () => {
    const opportunity = createMockOpportunity({
      saved_to_organizations: [],
    });

    const tags = buildSavedOpportunityTags(
      opportunity,
      new Set<string>(),
      false,
    );

    expect(tags).toEqual<SavedOpportunityTag[]>([]);
  });

  it("returns only organization tags when the opportunity is saved only by organizations", () => {
    const opportunity = createMockOpportunity({
      saved_to_organizations: [
        {
          organization_id: "2",
          organization_name: "Bravo Org",
        },
        {
          organization_id: "1",
          organization_name: "Alpha Org",
        },
      ],
    });

    const tags = buildSavedOpportunityTags(
      opportunity,
      new Set<string>(["1", "2"]),
      false,
    );

    expect(tags).toEqual<SavedOpportunityTag[]>([
      {
        key: "organization-1",
        label: "Alpha Org",
        screenReaderLabel: "Saved by Alpha Org",
        kind: "organization",
      },
      {
        key: "organization-2",
        label: "Bravo Org",
        screenReaderLabel: "Saved by Bravo Org",
        kind: "organization",
      },
    ]);
  });

  it("returns Individual first and sorted organization tags after it when both apply", () => {
    const opportunity = createMockOpportunity({
      saved_to_organizations: [
        {
          organization_id: "2",
          organization_name: "Bravo Org",
        },
        {
          organization_id: "1",
          organization_name: "Alpha Org",
        },
      ],
    });

    const tags = buildSavedOpportunityTags(
      opportunity,
      new Set<string>(["1", "2"]),
      true,
    );

    expect(tags).toEqual<SavedOpportunityTag[]>([
      {
        key: "individual",
        label: "Individual",
        screenReaderLabel: "Saved by you",
        kind: "individual",
      },
      {
        key: "organization-1",
        label: "Alpha Org",
        screenReaderLabel: "Saved by Alpha Org",
        kind: "organization",
      },
      {
        key: "organization-2",
        label: "Bravo Org",
        screenReaderLabel: "Saved by Bravo Org",
        kind: "organization",
      },
    ]);
  });

  it("filters out organizations the user does not belong to", () => {
    const opportunity = createMockOpportunity({
      saved_to_organizations: [
        {
          organization_id: "1",
          organization_name: "Alpha Org",
        },
        {
          organization_id: "2",
          organization_name: "Bravo Org",
        },
      ],
    });

    const tags = buildSavedOpportunityTags(
      opportunity,
      new Set<string>(["2"]),
      false,
    );

    expect(tags).toEqual<SavedOpportunityTag[]>([
      {
        key: "organization-2",
        label: "Bravo Org",
        screenReaderLabel: "Saved by Bravo Org",
        kind: "organization",
      },
    ]);
  });

  it("filters out organizations with empty or whitespace-only names", () => {
    const opportunity = createMockOpportunity({
      saved_to_organizations: [
        {
          organization_id: "1",
          organization_name: "   ",
        },
        {
          organization_id: "2",
          organization_name: "Bravo Org",
        },
      ],
    });

    const tags = buildSavedOpportunityTags(
      opportunity,
      new Set<string>(["1", "2"]),
      false,
    );

    expect(tags).toEqual<SavedOpportunityTag[]>([
      {
        key: "organization-2",
        label: "Bravo Org",
        screenReaderLabel: "Saved by Bravo Org",
        kind: "organization",
      },
    ]);
  });

  it("returns an empty array when there are no visible tags", () => {
    const opportunity = createMockOpportunity({
      saved_to_organizations: undefined,
    });

    const tags = buildSavedOpportunityTags(
      opportunity,
      new Set<string>(),
      false,
    );

    expect(tags).toEqual<SavedOpportunityTag[]>([]);
  });
});
