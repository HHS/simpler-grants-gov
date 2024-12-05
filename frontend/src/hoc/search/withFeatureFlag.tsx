import { FeatureFlagsManager } from "src/services/FeatureFlagManager";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { cookies } from "next/headers";
import React, { ComponentType } from "react";

const withFeatureFlag = <P extends WithFeatureFlagProps, R>(
  WrappedComponent: ComponentType<P>,
  featureFlagName: string,
  onEnabled: () => R,
) => {
  const ComponentWithFeatureFlag = (props: P) => {
    const featureFlagsManager = new FeatureFlagsManager(cookies());
    const { searchParams } = props;

    if (featureFlagsManager.isFeatureEnabled(featureFlagName, searchParams)) {
      return onEnabled();
    }

    return <WrappedComponent {...props} />;
  };

  return ComponentWithFeatureFlag;
};

export default withFeatureFlag;
