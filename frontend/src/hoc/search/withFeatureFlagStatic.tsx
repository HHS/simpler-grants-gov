import { FeatureFlagsManager } from "src/services/FeatureFlagManager";
import { ServerSideSearchParams } from "src/types/searchRequestURLTypes";

import React, { ComponentType } from "react";

export const withFeatureFlagStatic = <P extends ServerSideSearchParams, R>(
  WrappedComponent: ComponentType<P>,
  featureFlagName: string,
  onEnabled: () => R,
) => {
  const ComponentWithFeatureFlag = (props: P) => {
    const featureFlagsManager = new FeatureFlagsManager();

    if (featureFlagsManager.isFeatureEnabled(featureFlagName)) {
      return onEnabled();
    }

    return <WrappedComponent {...props} />;
  };

  return ComponentWithFeatureFlag;
};

export default withFeatureFlagStatic;
