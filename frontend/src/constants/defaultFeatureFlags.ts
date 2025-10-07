export type FeatureFlags = { [name: string]: boolean };

export const defaultFeatureFlags: FeatureFlags = {
  // Kill switches for search and opportunity pages, will show maintenance page when turned on
  searchOff: false,
  opportunityOff: false,
  // Kill switch for developer page, will hide/protect the page when turned on
  developerPageOff: false,
  // should we show a sign in button in the header?
  authOn: true,
  savedOpportunitiesOn: true,
  savedSearchesOn: true,
  applyFormPrototypeOff: false,
  userAdminOff: true,
};
