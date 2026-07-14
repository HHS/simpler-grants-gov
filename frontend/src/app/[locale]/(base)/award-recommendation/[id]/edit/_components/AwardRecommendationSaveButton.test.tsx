import { fireEvent, render, screen } from "@testing-library/react";
import { identity } from "lodash";

import AwardRecommendationSaveButton from "./AwardRecommendationSaveButton";

const mockSave = jest.fn();

jest.mock("src/app/[locale]/(base)/award-recommendation/[id]/actions", () => ({
  saveAwardRecommendation: (...args: unknown[]): Promise<unknown> =>
    mockSave(...args) as Promise<unknown>,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

describe("AwardRecommendationSaveButton", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the save button with the provided label", () => {
    render(
      <form>
        <AwardRecommendationSaveButton label="Save" />
      </form>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("shows a success message after a successful save", async () => {
    mockSave.mockResolvedValue({ success: true });

    render(
      <form>
        <AwardRecommendationSaveButton label="Save" />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("save.success")).toBeInTheDocument();
    expect(mockSave).toHaveBeenCalled();
  });

  it("shows an error message when the save fails", async () => {
    mockSave.mockResolvedValue({ errorMessage: "Boom" });

    render(
      <form>
        <AwardRecommendationSaveButton label="Save" />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("save.error")).toBeInTheDocument();
  });
});
