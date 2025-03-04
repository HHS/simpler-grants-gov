export type FeatureFlags = { [name: string]: boolean };

export const defaultFeatureFlags: FeatureFlags = {
  // Kill switches for search and opportunity pages, will show maintenance page when turned on
  searchOff: false,
  opportunityOff: false,
  // should we show a sign in button in the header?
  authOn: false,
  savedOpportunitiesOn: false,
};
