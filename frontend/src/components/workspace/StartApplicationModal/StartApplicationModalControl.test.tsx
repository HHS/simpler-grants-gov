import userEvent from "@testing-library/user-event";
import {
  fakeCompetition,
  fakeUserOrganization,
} from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import { render, screen, waitFor } from "tests/react-utils";

import React, { JSX } from "react";

import { StartApplicationModalControl } from "src/components/workspace/StartApplicationModal/StartApplicationModalControl";

jest.mock("next-intl", () => ({
  ...jest.requireActual("next-intl"),
  useTranslations: () => useTranslationsMock(),
}));

const mockUseUser = jest.fn(() => ({ user: { token: "a token" } }));
jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser(),
}));

// Mock leaf UI components to avoid USWDS modal complexity
jest.mock("src/components/Spinner", () => ({
  __esModule: true,
  default: (props: { className?: string }) => (
    <span data-testid="spinner" className={props.className} />
  ),
}));

jest.mock("src/components/USWDSIcon", () => ({
  USWDSIcon: (_props: unknown) => <span data-testid="icon" />,
}));

// Mock the two possible modal branches so we can assert gating
const StartApplicationModalMock = jest.fn<JSX.Element, [unknown]>(() => (
  <div data-testid="start-application-modal" />
));
jest.mock(
  "src/components/workspace/StartApplicationModal/StartApplicationModal",
  () => ({
    StartApplicationModal: (props: unknown) => StartApplicationModalMock(props),
  }),
);

const LoginModalMock = jest.fn<JSX.Element, [unknown]>(() => (
  <div data-testid="login-modal" />
));
jest.mock("src/components/LoginModal", () => ({
  LoginModal: (props: unknown) => LoginModalMock(props),
}));

type ClientFetch = (url: string, options?: RequestInit) => Promise<unknown>;
const clientFetchMock: jest.MockedFunction<ClientFetch> = jest.fn();

// useClientFetch is called twice; return the same stable mock fn both times
jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: Parameters<ClientFetch>) => clientFetchMock(...args),
  }),
}));

describe("StartApplicationModalControl", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseUser.mockReturnValue({ user: { token: "a token" } });

    clientFetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/competitions/")) {
        return Promise.resolve(fakeCompetition);
      }
      if (url === "/api/user/organizations") {
        return Promise.resolve([fakeUserOrganization]);
      }
      return Promise.resolve(undefined);
    });
  });

  it("renders StartApplicationModal when user has a token", async () => {
    render(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    await waitFor(() => {
      expect(clientFetchMock).toHaveBeenCalledWith("/api/competitions/1");
    });

    await waitFor(() => {
      expect(clientFetchMock).toHaveBeenCalledWith("/api/user/organizations", {
        cache: "no-store",
      });
    });

    expect(
      await screen.findByTestId("start-application-modal"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("login-modal")).not.toBeInTheDocument();
  });

  it("renders LoginModal when user is not logged in", async () => {
    mockUseUser.mockReturnValue({ user: { token: "" } });

    render(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    await waitFor(() => {
      expect(clientFetchMock).toHaveBeenCalledWith("/api/competitions/1");
    });

    // org fetch should NOT happen without a token
    expect(clientFetchMock).not.toHaveBeenCalledWith(
      "/api/user/organizations",
      expect.anything(),
    );

    expect(await screen.findByTestId("login-modal")).toBeInTheDocument();
    expect(
      screen.queryByTestId("start-application-modal"),
    ).not.toBeInTheDocument();
  });

  it("disables the open button while data is loading and shows Loading UI", async () => {
    let resolveCompetition: (value: unknown) => void = () => undefined;
    const competitionPromise = new Promise((res) => {
      resolveCompetition = res;
    });

    clientFetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/competitions/")) return competitionPromise;
      if (url === "/api/user/organizations") {
        return Promise.resolve([fakeUserOrganization]);
      }
      return Promise.resolve(undefined);
    });

    render(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const button = screen.getByTestId("open-start-application-modal-button");
    expect(button).toBeDisabled();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();

    resolveCompetition(fakeCompetition);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it("opens the modal content when the toggle is clicked (smoke)", async () => {
    const user = userEvent.setup();

    render(
      <StartApplicationModalControl
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const button = screen.getByTestId("open-start-application-modal-button");
    await waitFor(() => expect(button).not.toBeDisabled());

    await user.click(button);

    // just assert correct branch exists
    expect(screen.getByTestId("start-application-modal")).toBeInTheDocument();
  });
});
