export type FeatureFlags = { [name: string]: boolean };

export const defaultFeatureFlags: FeatureFlags = {
  applyFormPrototypeOff: false,
  awardRecommendationOff: true,
  maintenanceMode: false,
};
