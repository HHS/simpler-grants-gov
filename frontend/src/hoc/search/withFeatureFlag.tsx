import React, { ComponentType } from "react";

import { FeatureFlagsManager } from "../../services/FeatureFlagManager";
import { ServerSideSearchParams } from "../../types/searchRequestURLTypes";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

type WithFeatureFlagProps = {
  searchParams: ServerSideSearchParams;
};

const withFeatureFlag = <P extends object>(
  WrappedComponent: ComponentType<P>,
  featureFlagName: string,
) => {
  const ComponentWithFeatureFlag: React.FC<P & WithFeatureFlagProps> = (
    props,
  ) => {
    const ffManager = new FeatureFlagsManager(cookies());
    const { searchParams } = props;

    if (ffManager.isFeatureDisabled(featureFlagName, searchParams)) {
      return notFound();
    }

    return <WrappedComponent {...(props as P)} />;
  };

  return ComponentWithFeatureFlag;
};

export default withFeatureFlag;
