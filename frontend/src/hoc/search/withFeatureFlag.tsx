import { FeatureFlagsManager } from "src/services/FeatureFlagManager";
import { ServerSideSearchParams } from "src/types/searchRequestURLTypes";

import { cookies } from "next/headers";
import React, { ComponentType } from "react";

type WithFeatureFlagProps = {
  searchParams: ServerSideSearchParams;
};

const withFeatureFlag = <P extends WithFeatureFlagProps, R>(
  WrappedComponent: ComponentType<P>,
  featureFlagName: string,
  onEnabled: () => R,
) => {
  const ComponentWithFeatureFlag = (props: P) => {
    const ffManager = new FeatureFlagsManager(cookies());
    const { searchParams } = props;

    if (ffManager.isFeatureEnabled(featureFlagName, searchParams)) {
      return onEnabled();
    }

    return <WrappedComponent {...props} />;
  };

  return ComponentWithFeatureFlag;
};

export default withFeatureFlag;
