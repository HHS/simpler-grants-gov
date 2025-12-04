import { environment } from "src/constants/environments";
import { featureFlagsManager } from "src/services/featureFlags/FeatureFlagManager";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { cookies } from "next/headers";
import React, { FunctionComponent, ReactNode } from "react";

// since this relies on search params coming in as a prop, it can only be used reliably on a top level page component
// for other components we'll need a different implementation, likely one that delivers particular props to the wrapped component
// that method is not easily implemented with top level page components, as their props are laregely dictated by the Next system
const withFeatureFlag = <P, R extends ReactNode>(
  WrappedComponent: FunctionComponent<P>,
  featureFlagName: string,
  onEnabled: (props: P) => R,
) => {
  // if we're in the middle of a build, that means this is an ssg rendering pass.
  // in that case we can skip this whole feature flag business and move on with our lives
  if (environment.NEXT_BUILD === "true") {
    return WrappedComponent;
  }

  // top level component to grab search params from the top level page props
  const ComponentWithFeatureFlagAndSearchParams = async (
    props: P & WithFeatureFlagProps,
  ) => {
    // note that it's not necessary to pass search params (as when wrapping a non page level component)
    // but if middleware doesn't run you will potentially miss out on any flags set via params
    const searchParams = props.searchParams
      ? (await props.searchParams) || {}
      : {};
    const resolvedCookies = await cookies();
    const ComponentWithFeatureFlag = (props: P & WithFeatureFlagProps) => {
      if (
        featureFlagsManager.isFeatureEnabled(
          featureFlagName,
          resolvedCookies,
          searchParams,
        )
      ) {
        return onEnabled(props);
      }

      return <WrappedComponent {...props} />;
    };
    return (
      <ComponentWithFeatureFlag {...props} searchParams={props.searchParams} />
    );
  };

  return ComponentWithFeatureFlagAndSearchParams;
};

export default withFeatureFlag;
