import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  fakeCompetition,
  fakeUserOrganization,
} from "src/utils/testing/fixtures";

import { StartApplicationModalControl } from "./StartApplicationModalControl";

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

  it("sends a click_start_application user event beacon when opened", async () => {
    const sendBeaconMock = jest.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeaconMock,
      writable: true,
    });

    render(
      <StartApplicationModalControl
        competitionId="1"
        opportunityId="opp-1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    await userEvent.click(toggle);

    // Clicking the opener both fires click_start_application directly and
    // opens the modal, which separately fires view_start_application_modal
    // (see StartApplicationModal.test.tsx) - so at least one beacon here
    // carries the click event.
    await waitFor(() => {
      expect(sendBeaconMock).toHaveBeenCalled();
    });
    const readBlobAsText = (blob: Blob) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("failed to read blob"));
        reader.readAsText(blob);
      });
    const events = await Promise.all(
      sendBeaconMock.mock.calls.map(async ([url, blob]: [string, Blob]) => {
        expect(url).toBe("/api/events");
        return JSON.parse(await readBlobAsText(blob)) as unknown;
      }),
    );
    expect(events).toContainEqual({
      name: "click_start_application",
      properties: { competitionId: "1", opportunityId: "opp-1" },
    });
  });

  it("modal can be opened and closed as expected", async () => {
    const { rerender } = render(
      <StartApplicationModalControl
        competitionId="1"
        opportunityId="opp-1"
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
        opportunityId="opp-1"
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
        opportunityId="opp-1"
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
        opportunityId="opp-1"
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
        opportunityId="opp-1"
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
        opportunityId="opp-1"
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
        opportunityId="opp-1"
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
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("calls fetch functions correctly", async () => {
    const spy = jest.spyOn(mocks, "clientFetchMock");

    render(
      <StartApplicationModalControl
        competitionId="1"
        opportunityId="opp-1"
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
