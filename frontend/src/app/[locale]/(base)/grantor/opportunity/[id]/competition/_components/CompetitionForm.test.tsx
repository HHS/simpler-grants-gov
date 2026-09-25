import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Competition } from "src/types/competitionsResponseTypes";

import { CompetitionForm } from "./CompetitionForm";

const mockSubmissionSetUp = jest.fn();
const mockSubmissionWindow = jest.fn();
const mockAgencyContact = jest.fn();
const mockApplicationInstructions = jest.fn();
const mockRequiredForms = jest.fn();
const mockCompetitionFormAction = jest.fn();

const buildCompetition = (
  overrides: Partial<Competition> = {},
): Competition => ({
  competition_id: "comp-123",
  competition_title: "Test Competition",
  competition_info: "",
  competition_instructions: [],
  competition_forms: [],
  contact_info: null,
  expected_application_count: null,
  grace_period: null,
  is_open: true,
  open_to_applicants: ["organization"],
  opening_date: "2026-06-01",
  closing_date: "2026-07-01",
  opportunity_assistance_listings: [],
  opportunity_id: 1,
  opportunity: {} as Competition["opportunity"],
  public_competition_id: null,
  ...overrides,
});

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/actions",
  () => ({
    competitionFormAction: Object.assign(jest.fn(), {
      bind: (...args: unknown[]) => {
        mockCompetitionFormAction(...args);
        return (_formData: FormData) => Promise.resolve({});
      },
    }),
  }),
);

jest.mock("./FormSelectModal", () => ({
  FormSelectModal: () => <div data-testid="form-select-modal" />,
}));

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/SubmissionSetUp",
  () => ({
    SubmissionSetUp: (props: Record<string, unknown>) => {
      mockSubmissionSetUp(props);
      return <div data-testid="submission-set-up">SubmissionSetUp</div>;
    },
  }),
);

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/SubmissionWindow",
  () => ({
    SubmissionWindow: (props: Record<string, unknown>) => {
      mockSubmissionWindow(props);
      return <div data-testid="submission-window">SubmissionWindow</div>;
    },
  }),
);

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/AgencyContact",
  () => ({
    AgencyContact: (props: Record<string, unknown>) => {
      mockAgencyContact(props);
      return <div data-testid="agency-contact">AgencyContact</div>;
    },
  }),
);

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/ApplicationInstructions",
  () => ({
    ApplicationInstructions: (props: Record<string, unknown>) => {
      mockApplicationInstructions(props);
      return (
        <div data-testid="application-instructions">
          ApplicationInstructions
        </div>
      );
    },
  }),
);

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/RequiredForms",
  () => ({
    RequiredForms: (props: Record<string, unknown>) => {
      mockRequiredForms(props);
      return <div data-testid="required-forms">RequiredForms</div>;
    },
  }),
);

describe("CompetitionForm", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the application requirements header and subheader", () => {
      render(
        <CompetitionForm
          opportunityId="opp-123"
          forms={[]}
          competition={buildCompetition({
            public_competition_id: "pub-123",
            open_to_applicants: ["organization", "individual"],
            opening_date: "2026-06-01",
            closing_date: "2026-07-01",
            grace_period: 30,
            contact_info: "Jane Doe | Manager | jane@example.com | 555-0100",
          })}
        />,
      );

      expect(
        screen.getByRole("heading", { name: "applicationRequirements" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("applicationRequirementsSubheader"),
      ).toBeInTheDocument();
    });

    it("renders the form action buttons", () => {
      render(<CompetitionForm opportunityId="opp-123" forms={[]} />);

      expect(
        screen.getByRole("button", { name: "button.back" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "button.saveAndContinue" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "sectionRequiredForms.selectFormsButton",
        }),
      ).toBeInTheDocument();
    });

    it("passes readOnly to all child sections and action buttons", () => {
      render(<CompetitionForm opportunityId="opp-123" forms={[]} readOnly />);

      expect(mockSubmissionSetUp).toHaveBeenCalledWith(
        expect.objectContaining({ readOnly: true }),
      );
      expect(mockSubmissionWindow).toHaveBeenCalledWith(
        expect.objectContaining({ readOnly: true }),
      );
      expect(mockAgencyContact).toHaveBeenCalledWith(
        expect.objectContaining({ readOnly: true }),
      );
      expect(mockApplicationInstructions).toHaveBeenCalledWith(
        expect.objectContaining({ readOnly: true }),
      );
      expect(
        screen.getByRole("button", { name: "button.back" }),
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "button.saveAndContinue" }),
      ).toBeDisabled();
      expect(
        screen.getByRole("button", {
          name: "sectionRequiredForms.selectFormsButton",
        }),
      ).toBeDisabled();
    });

    it("includes the competition data when provided", () => {
      render(
        <CompetitionForm
          opportunityId="opp-123"
          forms={[]}
          competition={buildCompetition({
            public_competition_id: "PUB-123",
            competition_title: "My Competition",
            open_to_applicants: ["organization"],
            closing_date: "2026-07-01",
            opening_date: "2026-06-01",
            grace_period: 14,
            contact_info: "Alice | Admin | alice@example.com | 555-0000",
          })}
        />,
      );

      expect(mockSubmissionSetUp).toHaveBeenCalledWith(
        expect.objectContaining({
          publicCompetitionId: "PUB-123",
          competitionTitle: "My Competition",
          openToApplicants: ["organization"],
        }),
      );
      expect(mockSubmissionWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          openingDate: "2026-06-01",
          closingDate: "2026-07-01",
          gracePeriod: 14,
        }),
      );
      expect(mockAgencyContact).toHaveBeenCalledWith(
        expect.objectContaining({
          contactInfo: "Alice | Admin | alice@example.com | 555-0000",
        }),
      );
      expect(mockApplicationInstructions).toHaveBeenCalledWith(
        expect.objectContaining({
          existingFiles: [],
        }),
      );
    });
  });

  describe("accessibility", () => {
    it("passes accessibility scan when rendered", async () => {
      const { container } = render(
        <CompetitionForm opportunityId="opp-123" forms={[]} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
