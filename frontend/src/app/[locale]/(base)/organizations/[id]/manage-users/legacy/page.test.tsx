import { render } from "@testing-library/react";
import {
  buildSessionUser,
  type GetSession,
} from "src/test/fixtures/sessionUser";
import { expectFeatureFlagWiring } from "src/test/harness/featureFlagHarness";
import { loadPageWithFeatureFlagHarness } from "src/test/helpers/loadPageWithFeatureFlagHarness";

const LEGACY_MANAGE_USERS_PAGE_MODULE_PATH =
  "src/app/[locale]/(base)/organizations/[id]/manage-users/legacy/page";

describe("InviteLegacyUsersPage page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to maintenance if manageUsersOff is enabled", async () => {
    const redirectMock = jest.fn<void, [string]>();

    const sessionUser = buildSessionUser();
    const authenticationMock: jest.MockedFunction<GetSession> = jest
      .fn()
      .mockResolvedValue(sessionUser);

    jest.doMock("next-intl/server", () => ({
      setRequestLocale: (_locale: string) => undefined,
    }));

    jest.doMock("next-intl", () => ({
      useTranslations: () => (key: string) => key,
    }));

    jest.doMock("src/services/auth/session", () => ({
      getSession: () => authenticationMock(),
    }));

    jest.doMock("next/navigation", () => ({
      redirect: (location: string) => redirectMock(location),
    }));

    type Params = { locale: string; id: string };

    const { pageModule, featureFlagHarness } =
      loadPageWithFeatureFlagHarness<Params>(
        LEGACY_MANAGE_USERS_PAGE_MODULE_PATH,
        "flagEnabled",
      );

    const component = await pageModule.default({
      params: Promise.resolve({ locale: "en", id: "org-123" }),
    });

    render(component);

    expectFeatureFlagWiring(featureFlagHarness, "manageUsersOff");

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/maintenance");
  });
});
