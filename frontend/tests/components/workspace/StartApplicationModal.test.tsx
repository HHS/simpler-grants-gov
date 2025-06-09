import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import StartApplicationModal from "src/components/workspace/StartApplicationModal";

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
        competitionTitle="new competition"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
      />,
    );

    expect(rerender).toMatchSnapshot();
  });
  it("displays a working modal toggle button", async () => {
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
      />,
    );

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
      />,
    );

    expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
  });
  it("modal can be closed as expected", async () => {
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
      />,
    );

    const closeButton = await screen.findByText(
      "startAppplicationModal.cancelButtonText",
    );
    act(() => closeButton.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
      />,
    );

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");
  });
  it("displays validation error if submitted without a name", async () => {
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
      />,
    );

    const saveButton = await screen.findByTestId(
      "competition-start-individual-save",
    );
    act(() => saveButton.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
      />,
    );

    const validationError = await screen.findByText(
      "startAppplicationModal.validationError",
    );

    expect(validationError).toBeInTheDocument();
  });
  it("displays an API error if API returns an error", async () => {
    fetchMock.mockRejectedValue(new Error());
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
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
        competitionTitle="new competition"
      />,
    );

    const error = await screen.findByText("startAppplicationModal.error");

    expect(error).toBeInTheDocument();
  });
  it("re-routes on successful save", async () => {
    fetchMock.mockResolvedValue({ applicationId: "999" });
    const { rerender } = render(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
      />,
    );

    const toggle = await screen.findByTestId(
      "open-start-application-modal-button",
    );
    act(() => toggle.click());

    rerender(
      <StartApplicationModal
        competitionId="1"
        competitionTitle="new competition"
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
        competitionTitle="new competition"
      />,
    );
    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith(
        `/workspace/applications/application/999`,
      );
    });
  });
});
