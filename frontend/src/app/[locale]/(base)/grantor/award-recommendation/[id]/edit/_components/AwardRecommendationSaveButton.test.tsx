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

describe("AwardRecommendationSaveButton", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the save button with the provided label", () => {
    render(
      <AwardRecommendationEditForm
        awardRecommendationId="ar-id-123"
        hero={null}
      >
        <AwardRecommendationSaveButton label="Save" />
      </AwardRecommendationEditForm>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("submits the enclosing form when clicked", () => {
    mockSave.mockResolvedValue({ success: true });

    render(
      <AwardRecommendationEditForm
        awardRecommendationId="ar-id-123"
        hero={null}
      >
        <input name="additional_info" defaultValue="Updated info" />
        <AwardRecommendationSaveButton label="Save" />
      </AwardRecommendationEditForm>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(mockSave).toHaveBeenCalled();
    const [, formData] = mockSave.mock.calls[0] as unknown as [
      unknown,
      FormData,
    ];
    expect(formData.get("additional_info")).toBe("Updated info");
    expect(formData.get("award_recommendation_id")).toBe("ar-id-123");
  });
});
