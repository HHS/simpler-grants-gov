export type FeatureFlags = { [name: string]: boolean };

export const defaultFeatureFlags: FeatureFlags = {
  applyFormPrototypeOff: false,
  opportunitiesListOff: true,
  manageUsersOff: false,
};
