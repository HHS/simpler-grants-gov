import { render } from "@testing-library/react";

import { competitionFormAction } from "../actions";
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

// let originalWindow: typeof global.window;
let originalScrollTo: typeof global.window.scrollTo;

describe("CompetitionForm", () => {
  beforeEach(() => {
    // originalWindow = global.window;
    originalScrollTo = global.window.scrollTo;
    global.window.scrollTo = mockScrollTo;
  });
  afterEach(() => {
    global.window.scrollTo = originalScrollTo;
  });
  it("scrolls to the top on validation errors", () => {
    render(<CompetitionForm opportunityId="1" competition={} forms={} />);
    expect(competitionFormAction).toHaveBeenCalledTimes(1);
  });
});
