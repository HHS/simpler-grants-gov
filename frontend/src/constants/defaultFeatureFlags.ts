export type FeatureFlags = { [name: string]: boolean };

export const defaultFeatureFlags: FeatureFlags = {
  applyFormPrototypeOff: false,
  awardRecommendationOff: true,
  featureFlagAdminOff: false,
  maintenanceMode: false,
  opportunitiesListOff: false,
  opportunityOff: false,
};
