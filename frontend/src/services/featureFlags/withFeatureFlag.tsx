import { environment } from "src/constants/environments";
import { featureFlagsManager } from "src/services/featureFlags/FeatureFlagManager";
import { OptionalStringDict } from "src/types/generalTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { FunctionComponent, ReactNode } from "react";

const ComponentWithFeatureFlag = <P, R>({
  originalProps,
  featureFlagName,
  WrappedComponent,
  onEnabled,
  resolvedCookies,
  searchParams,
}: {
  originalProps: P & WithFeatureFlagProps;
  WrappedComponent: FunctionComponent<P>;
  featureFlagName: string;
  onEnabled: (props: P) => R;
  resolvedCookies: ReadonlyRequestCookies;
  searchParams: OptionalStringDict;
}) => {
  if (
    featureFlagsManager.isFeatureEnabled(
      featureFlagName,
      resolvedCookies,
      searchParams,
    )
  ) {
    return onEnabled(originalProps);
  }

  return <WrappedComponent {...originalProps} />;
};

// wraps a passed in base component with search params and cookies that will be available only at render time
const WrapComponentWithFeatureFlagAndSearchParams =
  <P, R>({
    WrappedComponent,
    featureFlagName,
    onEnabled,
  }: {
    WrappedComponent: FunctionComponent<P>;
    featureFlagName: string;
    onEnabled: (props: P) => R;
  }) =>
  async (props: P & WithFeatureFlagProps) => {
    // note that it's not necessary to pass search params (as when wrapping a non page level component)
    // but if middleware doesn't run you will potentially miss out on any flags set via params
    const searchParams = props.searchParams
      ? (await props.searchParams) || {}
      : {};
    const resolvedCookies = await cookies();
    return ComponentWithFeatureFlag<P, R>({
      originalProps: props,
      searchParams: searchParams,
      resolvedCookies: resolvedCookies,
      WrappedComponent: WrappedComponent,
      featureFlagName: featureFlagName,
      onEnabled: onEnabled,
    });
  };

// since this relies on search params coming in as a prop, it can only be used reliably on a top level page component
// for other components we'll need a different implementation, likely one that delivers particular props to the wrapped component
// that method is not easily implemented with top level page components, as their props are laregely dictated by the Next system

// P = type of wrapped component props
// R = type of return value for onEnabled function

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

  return WrapComponentWithFeatureFlagAndSearchParams<P, R>({
    WrappedComponent,
    onEnabled,
    featureFlagName,
  });
};

export default withFeatureFlag;
