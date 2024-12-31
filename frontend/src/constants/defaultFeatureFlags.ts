export type FeatureFlags = { [name: string]: boolean };

// Feature flags should default to false
export const defaultFeatureFlags: FeatureFlags = {
  // Kill switches for search and opportunity pages, will show maintenance page when turned on
  searchOff: false,
  opportunityOff: false,
  authOff: false,
};
