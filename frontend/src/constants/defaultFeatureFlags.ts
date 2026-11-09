export type FeatureFlags = { [name: string]: boolean };

export const defaultFeatureFlags: FeatureFlags = {
  applyFormPrototypeOff: false,
  enableExternalCollaborators: false,
  featureFlagAdminOff: false,
  maintenanceBannerEnabled: false,
  maintenanceMode: false,
};
