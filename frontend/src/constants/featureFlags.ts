import { FeatureFlags } from "src/services/FeatureFlagManager";

// Feature flags should default to false
export const featureFlags: FeatureFlags = {
  // This is for hiding the search page as it is being developed and user tested
  // This should be removed when the search page goes live, before May 2024
  hideSearchV0: false,
  // Kill switches for search and opportunity pages, will show maintenance page when turned on
  searchOff: false,
  opportunityOff: false,
};

