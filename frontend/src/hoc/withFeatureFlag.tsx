import { environment } from "src/constants/environments";
import { featureFlagsManager } from "src/services/FeatureFlagManager";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { cookies } from "next/headers";
import React, { ComponentType } from "react";

// since this relies on search params coming in as a prop, it can only be used reliably on a top level page component
// for other components we'll need a different implementation, likely one that delivers particular props to the wrapped component
// that method is not easily implemented with top level page components, as their props are laregely dictated by the Next system
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
  const ComponentWithFeatureFlagAndSearchParams = (
    props: P & WithFeatureFlagProps,
  ) => {
    const searchParams = props.searchParams || {};
    const ComponentWithFeatureFlag = (props: P & WithFeatureFlagProps) => {
      if (
        featureFlagsManager.isFeatureEnabled(
          featureFlagName,
          cookies(),
          props.searchParams,
        )
      ) {
        onEnabled();
        return;
      }

      return <WrappedComponent {...props} />;
    };
    return <ComponentWithFeatureFlag {...props} searchParams={searchParams} />;
  };

  return ComponentWithFeatureFlagAndSearchParams;
};

export default withFeatureFlag;
