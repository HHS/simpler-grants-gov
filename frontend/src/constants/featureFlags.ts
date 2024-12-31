import { FeatureFlags } from "src/services/FeatureFlagManager";

// Feature flags should default to false
export const featureFlags: FeatureFlags = {
  // Kill switches for search and opportunity pages, will show maintenance page when turned on
  searchOff: false,
  opportunityOff: false,
  authOff: false,
};
