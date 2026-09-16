import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  fakeCompetitionWithOpportunity,
  fakeFormType,
} from "src/utils/testing/fixtures";

import { CompetitionForm } from "./CompetitionForm";

const mockCompetitionFormAction = jest.fn();
const mockScrollTo = jest.fn();

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/actions",
  () => ({
    competitionFormAction: (formData: unknown) =>
      mockCompetitionFormAction(formData) as unknown,
  }),
);

let originalScrollTo: typeof global.window.scrollTo;

describe("CompetitionForm", () => {
  beforeEach(() => {
    // the bind here is to work around a linting issue, shouldn't effect behavior at all
    originalScrollTo = global.window.scrollTo.bind(global.window);
    global.window.scrollTo = mockScrollTo;
  });
  afterEach(() => {
    global.window.scrollTo = originalScrollTo;
    jest.resetAllMocks();
  });
  it("scrolls to the top on validation errors", async () => {
    mockCompetitionFormAction.mockResolvedValue({
      validationErrors: ["an error string"],
    });
    render(
      <CompetitionForm
        opportunityId="1"
        competition={fakeCompetitionWithOpportunity}
        forms={[fakeFormType]}
      />,
    );
    const submitButton = screen.getByRole("button", {
      name: "button.saveAndContinue",
    });
    await userEvent.click(submitButton);
    expect(mockCompetitionFormAction).toHaveBeenCalledTimes(1);
    expect(mockScrollTo).toHaveBeenCalledTimes(1);
  });
});
