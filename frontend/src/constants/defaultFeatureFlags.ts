export type FeatureFlags = { [name: string]: boolean };

export const defaultFeatureFlags: FeatureFlags = {
  applyFormPrototypeOff: false,
  featureFlagAdminOff: false,
  maintenanceBannerEnabled: false,
  maintenanceMode: false,
};
