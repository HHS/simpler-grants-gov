// import Cookies from "js-cookie";
import Cookies from "js-cookie";
import { identity } from "lodash";
import withFeatureFlag from "src/hoc/withFeatureFlag";
import { render } from "tests/react-utils";

let enableFeature = false;

jest.mock("src/services/featureFlags/FeatureFlagManager", () => {
  class FakeFeatureFlagManager {
    isFeatureEnabled() {
      return enableFeature;
    }
  }

  return {
    featureFlagsManager: new FakeFeatureFlagManager(),
  };
});

jest.mock("next/headers", () => ({
  cookies: () => Cookies,
}));

describe("WithFeatureFlag", () => {
  afterEach(() => {
    enableFeature = false;
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });
  it("adds search params as prop to wrapped component", () => {
    const OriginalComponent = jest.fn();
    const searchParams = { any: "param" };
    const WrappedComponent = withFeatureFlag(
      OriginalComponent,
      "searchOff",
      identity,
    );
    render(<WrappedComponent searchParams={searchParams} />);
    expect(OriginalComponent).toHaveBeenCalledTimes(1);

    // not sure what the second arg represents here but let's forget about it for now
    expect(OriginalComponent).toHaveBeenCalledWith({ searchParams }, {});
  });
  it("calls onEnabled during wrapped component render when feature flag is enabled", () => {
    enableFeature = true;
    const OriginalComponent = jest.fn();
    const onEnabled = jest.fn();
    const searchParams = { any: "param" };
    const WrappedComponent = withFeatureFlag(
      OriginalComponent,
      "searchOff",
      onEnabled,
    );
    render(<WrappedComponent searchParams={searchParams} />);
    expect(onEnabled).toHaveBeenCalledTimes(1);
  });
  it("does not call onEnabled during wrapped component render when feature flag is not enabled", () => {
    const OriginalComponent = jest.fn();
    const onEnabled = jest.fn();
    const searchParams = { any: "param" };
    const WrappedComponent = withFeatureFlag(
      OriginalComponent,
      "searchOff",
      onEnabled,
    );
    render(<WrappedComponent searchParams={searchParams} />);
    expect(onEnabled).toHaveBeenCalledTimes(0);
  });
});
