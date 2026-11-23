import { environment } from "src/constants/environments";
import {
  isSessionDurationOverrideAllowed,
  parseSessionDurationOverride,
} from "src/services/auth/sessionDurationOverride";

jest.mock("src/constants/environments", () => ({
  environment: { ENVIRONMENT: "staging" },
}));

afterEach(() => jest.restoreAllMocks());

describe("isSessionDurationOverrideAllowed", () => {
  it.each(["local", "dev", "staging"])("is allowed in %s", (env) => {
    jest.replaceProperty(environment, "ENVIRONMENT", env);
    expect(isSessionDurationOverrideAllowed()).toEqual(true);
  });

  it.each(["prod", "training", "infra-training", "grantor1", "", "unknown"])(
    "is not allowed in %s",
    (env) => {
      jest.replaceProperty(environment, "ENVIRONMENT", env);
      expect(isSessionDurationOverrideAllowed()).toEqual(false);
    },
  );
});

describe("parseSessionDurationOverride", () => {
  it.each([
    ["60", 60],
    [60, 60],
    ["30", 30],
    ["900", 900],
  ])("returns seconds for %p", (value, expected) => {
    expect(parseSessionDurationOverride(value)).toEqual(expected);
  });

  it.each([
    [undefined],
    [null],
    [""],
    ["29"],
    ["901"],
    ["-60"],
    ["60.5"],
    [60.5],
    ["1e2"],
    ["sixty"],
    [" 60"],
  ])("returns undefined for %p", (value) => {
    expect(parseSessionDurationOverride(value)).toBeUndefined();
  });

  it("ignores a valid value in prod", () => {
    jest.replaceProperty(environment, "ENVIRONMENT", "prod");
    expect(parseSessionDurationOverride("60")).toBeUndefined();
  });
});
