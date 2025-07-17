import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import StartApplicationModal from "src/components/workspace/StartApplicationModal/StartApplicationModal";

const mockUseUser = jest.fn(() => ({
  user: {
    token: "faketoken",
  },
}));

const fetchMock = jest.fn();
const routerPush = jest.fn(() => Promise.resolve(true));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/test") as jest.Mock<string>,
  useRouter: () => ({
    push: routerPush,
  }),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => mockUseUser(),
}));

jest.mock("src/services/fetch/fetchers/clientApplicationFetcher", () => ({
  startApplication: () => fetchMock() as unknown,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.useFakeTimers();

describe("StartApplicationModal", () => {
  afterEach(() => {
    fetchMock.mockReset();
    jest.clearAllTimers();
  });

  it("matches snapshot", async () => {
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    expect(rerender).toMatchSnapshot();
  });
  it("displays a working modal toggle button", async () => {
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");
    expect(screen.queryAllByTestId("opportunity-title")[0]).toHaveTextContent(
      "blessed opportunity",
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
  });
  it("modal can be closed as expected", async () => {
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const closeButton = await screen.findByText(
      "startApplicationModal.cancelButtonText",
    );
    act(() => closeButton.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");
  });
  it("displays validation error if submitted without a name", async () => {
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const saveButton = await screen.findByTestId(
      "competition-start-individual-save",
    );
    act(() => saveButton.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const validationError = await screen.findByText(
      "startApplicationModal.validationError",
    );

    expect(validationError).toBeInTheDocument();
  });
  it("displays an API error if API returns an error", async () => {
    fetchMock.mockRejectedValue(new Error());
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const saveButton = await screen.findByTestId(
      "competition-start-individual-save",
    );
    const input = await screen.findByTestId("textInput");
    fireEvent.change(input, { target: { value: "new application" } });
    act(() => saveButton.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const error = await screen.findByText("startApplicationModal.error");

    expect(error).toBeInTheDocument();
  });
  it("displays an login error if API 401", async () => {
    fetchMock.mockRejectedValue(new Error("401 error", { cause: "401" }));
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const saveButton = await screen.findByTestId(
      "competition-start-individual-save",
    );
    const input = await screen.findByTestId("textInput");
    fireEvent.change(input, { target: { value: "new application" } });
    act(() => saveButton.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const error = await screen.findByText("startApplicationModal.loggedOut");

    expect(error).toBeInTheDocument();
  });
  it("re-routes on successful save", async () => {
    fetchMock.mockResolvedValue({ applicationId: "999" });
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    const saveButton = await screen.findByTestId(
      "competition-start-individual-save",
    );
    const input = await screen.findByTestId("textInput");
    fireEvent.change(input, { target: { value: "new application" } });
    act(() => saveButton.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );
    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith(
        `/workspace/applications/application/999`,
      );
    });
  });
  it("displays login message if user not logged in", () => {
    mockUseUser.mockImplementation(() => ({}) as { user: { token: string } });
    render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
      />,
    );

    expect(screen.queryAllByTestId("modalWindow")[0]).toHaveTextContent(
      "startApplicationModal.login",
    );
  });
});
