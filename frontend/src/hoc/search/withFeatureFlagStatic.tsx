import { FeatureFlagsManager } from "src/services/FeatureFlagManager";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import React, { ComponentType } from "react";

export const withFeatureFlagStatic = <P extends WithFeatureFlagProps, R>(
  WrappedComponent: ComponentType<P>,
  featureFlagName: string,
  onEnabled: () => R,
) => {
  const ComponentWithFeatureFlag = (props: P) => {
    // try {
    const featureFlagsManager = new FeatureFlagsManager();

    if (featureFlagsManager.isFeatureEnabled(featureFlagName)) {
      return onEnabled();
    }

    return <WrappedComponent {...props} />;
    // } catch (e) {
    //   console.error("^^^ caught in wrapped component", e);
    //   return <div>hi</div>;
    // }
  };

  return ComponentWithFeatureFlag;
};

export default withFeatureFlagStatic;
