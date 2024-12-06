import { environment } from "src/constants/environments";
import { FeatureFlagsManager } from "src/services/FeatureFlagManager";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { cookies } from "next/headers";
import React, { ComponentType } from "react";

// since this relies on search params coming in as a prop, this can only be used on a top level page component
// for other components we'll need a different implementation
const withFeatureFlag = <P, R>(
  WrappedComponent: ComponentType<P>,
  featureFlagName: string,
  onEnabled: () => R,
) => {
  // if we're in the middle of a build, that means this is an ssg rendering pass.
  // in that case we can skip this whole feature flag business and move on with our lives
  if (environment.NEXT_BUILD === "true") {
    return WrappedComponent;
  }

  // top level component to grab search params from the top level page props
  return (props: P & WithFeatureFlagProps) => {
    const searchParams = props.searchParams || {};
    // wrap the flagged component to close over search params and accept other props as normal
    const ComponentWithFeatureFlag = (props: P & WithFeatureFlagProps) => {
      const searchParams = props.searchParams || {};
      const featureFlagsManager = new FeatureFlagsManager(cookies());

      if (featureFlagsManager.isFeatureEnabled(featureFlagName, searchParams)) {
        return onEnabled();
      }

      return <WrappedComponent {...props} />;
    };
    return <ComponentWithFeatureFlag {...props} searchParams={searchParams} />;
  };
};

export default withFeatureFlag;
