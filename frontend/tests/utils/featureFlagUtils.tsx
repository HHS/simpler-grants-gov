import { JSX } from "react";

import "@testing-library/jest-dom";

type Params = { locale: string };
type PageFn = (args: { params: Promise<Params> }) => Promise<JSX.Element>;
type WithFeatureFlagArgs = [unknown, string, () => void];
type ModuleWithDefault = { default: PageFn };

// mock the feature flag module
jest.mock("src/services/featureFlags/withFeatureFlag");

// Capture redirect calls so we can assert on the disabled handler.
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

export const checkFeatureFlagRedirect = async (
  pageLocation: string,
  featureFlagName: string,
  redirectDestination: string,
) => {
  // Configure the mocked withFeatureFlag as a passthrough and
  // capture how it is called by the page module.
  const withFeatureFlagModule = await import(
    "src/services/featureFlags/withFeatureFlag"
  );
  const withFeatureFlagMock =
    withFeatureFlagModule.default as unknown as jest.Mock<
      unknown,
      WithFeatureFlagArgs
    >;

  withFeatureFlagMock.mockImplementation(
    (wrappedComponent: unknown, _flagName: string, _onDisabled: () => void) =>
      wrappedComponent,
  );

  const navigationModule = await import("next/navigation");
  const redirectMock = navigationModule.redirect;

  // Importing the page calls the withFeatureFlag(...)
  const pageModule = await (import(pageLocation) as Promise<ModuleWithDefault>);
  const Page = pageModule.default as unknown as PageFn;

  expect(typeof Page).toBe("function");
  expect(withFeatureFlagMock).toHaveBeenCalledTimes(1);

  const [wrappedComponent, flagName, onDisabled] =
    withFeatureFlagMock.mock.calls[0];

  expect(flagName).toBe(featureFlagName);
  expect(typeof wrappedComponent).toBe("function");

  // our redirect
  (onDisabled as () => void)();
  expect(redirectMock).toHaveBeenCalledTimes(1);
  expect(redirectMock).toHaveBeenCalledWith(redirectDestination);
  return true;
};
