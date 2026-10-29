import { fireEvent, render, screen } from "@testing-library/react";
import { identity } from "lodash";

import AwardRecommendationEditForm from "./AwardRecommendationEditForm";
import AwardRecommendationSaveButton from "./AwardRecommendationSaveButton";

const mockSave = jest.fn();

jest.mock(
  "src/app/[locale]/(base)/grantor/award-recommendation/[id]/actions",
  () => ({
    saveAwardRecommendation: (...args: unknown[]): Promise<unknown> =>
      mockSave(...args) as Promise<unknown>,
  }),
);

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

describe("AwardRecommendationEditForm", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows a success alert after a successful save", async () => {
    mockSave.mockResolvedValue({ success: true });

    render(
      <AwardRecommendationEditForm
        awardRecommendationId="ar-id-123"
        hero={null}
      >
        <AwardRecommendationSaveButton label="Save" />
      </AwardRecommendationEditForm>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("save.success")).toBeInTheDocument();
    expect(mockSave).toHaveBeenCalled();
  });

  it("shows an error alert when the save fails", async () => {
    mockSave.mockResolvedValue({ errorMessage: "Boom" });

    render(
      <AwardRecommendationEditForm
        awardRecommendationId="ar-id-123"
        hero={null}
      >
        <AwardRecommendationSaveButton label="Save" />
      </AwardRecommendationEditForm>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Boom")).toBeInTheDocument();
  });
});
