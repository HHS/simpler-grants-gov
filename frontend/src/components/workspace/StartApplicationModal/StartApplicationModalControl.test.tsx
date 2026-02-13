import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  fakeCompetition,
  fakeUserOrganization,
} from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { StartApplicationModalControl } from "src/components/workspace/StartApplicationModal/StartApplicationModalControl";

const mockUseUser = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
}));

const mockRouterPush = jest.fn();
const mocks = {
  clientFetchMock: (url: string) => {
    if (url.match("competitions")) {
      return Promise.resolve(fakeCompetition);
    }
    return Promise.resolve([fakeUserOrganization]);
  },
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (url: string) => mocks.clientFetchMock(url),
  }),
}));

describe("StartApplicationModalControl", () => {
  beforeEach(() => {
    mockRouterPush.mockResolvedValue(true);
    mockUseUser.mockReturnValue({ user: { token: "a token" } });
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("modal can be opened and closed as expected", async () => {
    const { rerender } = render(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");
    });

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );

    await userEvent.click(toggle);

    rerender(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toHaveClass("is-hidden");
    });

    const closeButton = await screen.findByText("cancelButtonText");

    await userEvent.click(closeButton);

    rerender(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");
    });
  });
  it("displays login modal on click if user is not logged in", async () => {
    mockUseUser.mockReturnValue({ user: { token: "" } });
    const { rerender } = render(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    await userEvent.click(toggle);

    rerender(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
    });
    expect(screen.getByText("help")).toBeInTheDocument();
  });
  it("displays start application modal on click if user is logged in", async () => {
    const { rerender } = render(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );

    await userEvent.click(toggle);

    rerender(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
  });
  // as currently written this causes the useEffect to loops to run infinitely,
  // as the fetch function in the dependency gets constantly overwritten as part of the
  // implementation of the spy / mock. If we remove the fetch fn from the dependency
  // array, tests pass, but I'd rather have that in place and skip this test for now.
  // In the future we could make this more testable by encapsulating the onMount
  // fetch functionality into its own hook - DWS
  it.skip("calls fetch functions correctly", async () => {
    const spy = jest.spyOn(mocks, "clientFetchMock");

    render(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
    expect(spy).toHaveBeenCalledWith("/api/competitions/1");
    expect(spy).toHaveBeenCalledWith("/api/user/organizations", {
      cache: "no-store",
    });
  });
});
