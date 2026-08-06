import { render, screen } from "@testing-library/react";
import { RequiredForms } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/RequiredForms";

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

describe("RequiredForms", () => {
  const alwaysRequiredFormId = "1623b310-85be-496a-b84b-34bdee22a68a";

  const mockFormDetails = [
    {
      form_id: alwaysRequiredFormId,
      short_name: "SF424_V1",
      name: "Application for Federal Assistance (SF-424)",
      current_version: {
        major_version: 1,
        minor_version: 0,
      },
    },
    {
      form_id: "conditional-form-id",
      short_name: "CD511_V2",
      name: "Certification Form (CD-511)",
      current_version: {
        major_version: 2,
        minor_version: 1,
      },
    },
  ] as any;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("required form status", () => {
    it("renders required status when is_required is true", () => {
      render(
        <RequiredForms
          competitionForms={[
            {
              form_id: alwaysRequiredFormId,
              is_required: true,
            },
          ]}
          formDetails={mockFormDetails}
        />,
      );

      expect(screen.getByText("requiredStates.required")).toBeInTheDocument();
    });

    it("renders conditional status when is_required is false", () => {
      render(
        <RequiredForms
          competitionForms={[
            {
              form_id: "conditional-form-id",
              is_required: false,
            },
          ]}
          formDetails={mockFormDetails}
        />,
      );

      expect(
        screen.getByText("requiredStates.conditional"),
      ).toBeInTheDocument();
    });
  });

  describe("always required forms", () => {
    it("renders the always label for forms in the always required list", () => {
      render(
        <RequiredForms
          competitionForms={[
            {
              form_id: alwaysRequiredFormId,
              is_required: true,
            },
          ]}
          formDetails={mockFormDetails}
        />,
      );

      expect(screen.getByText("requiredStates.always")).toBeInTheDocument();
    });

    it("automatically adds the always required form when competitionForms is empty", () => {
      render(
        <RequiredForms competitionForms={[]} formDetails={mockFormDetails} />,
      );

      expect(screen.getByText("requiredStates.always")).toBeInTheDocument();

      expect(screen.getByText("requiredStates.required")).toBeInTheDocument();
    });
  });

  describe("form details", () => {
    it("renders the form short name and version", () => {
      render(
        <RequiredForms
          competitionForms={[
            {
              form_id: alwaysRequiredFormId,
              is_required: true,
            },
          ]}
          formDetails={mockFormDetails}
        />,
      );

      expect(screen.getByText("SF424")).toBeInTheDocument();
      expect(screen.getByText("v1.0")).toBeInTheDocument();
    });

    it("renders form name without the parenthetical suffix", () => {
      render(
        <RequiredForms
          competitionForms={[
            {
              form_id: alwaysRequiredFormId,
              is_required: true,
            },
          ]}
          formDetails={mockFormDetails}
        />,
      );

      expect(
        screen.getByText("Application for Federal Assistance"),
      ).toBeInTheDocument();
    });

    it("does not render a requirement label when matching form details are not found", () => {
      render(
        <RequiredForms
          competitionForms={[
            {
              form_id: "missing-form",
              is_required: true,
            },
          ]}
          formDetails={[]}
        />,
      );

      expect(
        screen.queryByText("requiredStates.required"),
      ).not.toBeInTheDocument();
    });
  });
});
