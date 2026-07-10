export type SavedOpportunitiesScope =
  | { scope: "all" }
  | { scope: "individual" }
  | {
      scope: "organization";
      organizationIds: string[];
    };
