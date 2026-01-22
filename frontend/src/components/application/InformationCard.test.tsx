import { fireEvent, render, screen } from "@testing-library/react";
import {
  Status,
  type ApplicationDetail,
} from "src/types/applicationResponseTypes";
import applicationMock from "stories/components/application/application.mock.json";

import React from "react";

import { InformationCard } from "src/components/application/InformationCard";

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const translationFunction = ((key: string) => key) as ((
      key: string,
    ) => string) & {
      rich: (
        key: string,
        values: Record<string, (chunks: string) => React.ReactNode>,
      ) => React.ReactNode;
    };

    translationFunction.rich = (key, values) => {
      if (key === "unassociatedApplicationAlert.body") {
        // clickable element in tests:
        return (
          <>
            You can continue working…{" "}
            {values.link("Click here to transfer application ownership")}.
          </>
        );
      }

      // fallback: just render the key
      return key;
    };

    return translationFunction;
  },
}));

jest.mock("@trussworks/react-uswds", () => ({
  Alert: ({
    heading,
    children,
  }: {
    heading?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="alert">
      {heading ? <div>{heading}</div> : null}
      <div>{children}</div>
    </div>
  ),
  Button: ({
    children,
    onClick,
    disabled,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }) => (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GridContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("src/components/USWDSIcon", () => ({
  USWDSIcon: () => <span aria-hidden="true" />,
}));

jest.mock(
  "src/components/application/editAppFilingName/EditAppFilingName",
  () => ({
    EditAppFilingName: () => <button type="button">buttonText</button>,
  }),
);

jest.mock("src/components/InlineActionLink", () => ({
  InlineActionLink: ({
    onClick,
    children,
  }: {
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock(
  "src/components/application/transferOwnership/TransferOwnershipModal",
  () => ({
    TransferOwnershipModal: ({
      onAfterClose,
    }: {
      onAfterClose: () => void;
    }) => (
      <div data-testid="transfer-ownership-modal">
        <div>modal</div>
        <button type="button" onClick={onAfterClose}>
          Close modal
        </button>
      </div>
    ),
  }),
);

jest.mock(
  "src/components/application/transferOwnership/TransferOwnershipButton",
  () => ({
    TransferOwnershipButton: ({ onClick }: { onClick: () => void }) => (
      <button type="button" onClick={onClick}>
        Transfer button
      </button>
    ),
  }),
);

const mockApplicationDetails = applicationMock as unknown as ApplicationDetail;

const makeBaseProps = () => ({
  applicationDetails: mockApplicationDetails,
  applicationSubmitHandler: jest.fn(),
  applicationSubmitted: false,
  opportunityName: "Test Opportunity",
  submissionLoading: false,
  instructionsDownloadPath: "http://path-to-instructions.com",
  opportunityApplicantTypes: ["individuals"], // default: allows individuals
});

describe("InformationCard - Edit filing name button visibility", () => {
  it("shows Edit filing name button when application status is in_progress", () => {
    const props = makeBaseProps();
    const inProgressApplication: ApplicationDetail = {
      ...props.applicationDetails,
      application_status: Status.IN_PROGRESS,
    };

    render(
      <InformationCard {...props} applicationDetails={inProgressApplication} />,
    );

    expect(screen.getByText("buttonText")).toBeInTheDocument();
  });

  it("hides Edit filing name button when application status is submitted", () => {
    const props = makeBaseProps();
    const submittedApplication: ApplicationDetail = {
      ...props.applicationDetails,
      application_status: Status.SUBMITTED,
    };

    render(
      <InformationCard {...props} applicationDetails={submittedApplication} />,
    );

    expect(screen.queryByText("buttonText")).not.toBeInTheDocument();
  });

  it("hides Edit filing name button when application status is accepted", () => {
    const props = makeBaseProps();
    const acceptedApplication: ApplicationDetail = {
      ...props.applicationDetails,
      application_status: Status.ACCEPTED,
    };

    render(
      <InformationCard {...props} applicationDetails={acceptedApplication} />,
    );

    expect(screen.queryByText("buttonText")).not.toBeInTheDocument();
  });
});

describe("InformationCard - No longer accepting applications message", () => {
  it("shows the message when the competition is CLOSED (is_open=false)", () => {
    const props = makeBaseProps();
    const closedApplication: ApplicationDetail = {
      ...props.applicationDetails,
      competition: {
        ...props.applicationDetails.competition,
        is_open: false,
      },
    };

    render(
      <InformationCard {...props} applicationDetails={closedApplication} />,
    );

    expect(screen.getByText("specialInstructions")).toBeInTheDocument();
  });

  it("hides the message when the competition is OPEN (is_open=true)", () => {
    const props = makeBaseProps();
    const openApplication: ApplicationDetail = {
      ...props.applicationDetails,
      competition: {
        ...props.applicationDetails.competition,
        is_open: true,
      },
    };

    render(<InformationCard {...props} applicationDetails={openApplication} />);

    expect(screen.queryByText("specialInstructions")).not.toBeInTheDocument();
  });
});

describe("InformationCard - Submit button visibility and disabled state", () => {
  it("shows the Submit button when is_open=true and application not submitted", () => {
    const props = makeBaseProps();
    const openApplication: ApplicationDetail = {
      ...props.applicationDetails,
      competition: { ...props.applicationDetails.competition, is_open: true },
    };

    render(<InformationCard {...props} applicationDetails={openApplication} />);

    expect(screen.getByRole("button", { name: "submit" })).toBeInTheDocument();
  });

  it("hides the Submit button when competition is CLOSED (is_open=false)", () => {
    const props = makeBaseProps();
    const closed: ApplicationDetail = {
      ...props.applicationDetails,
      competition: { ...props.applicationDetails.competition, is_open: false },
    };

    render(<InformationCard {...props} applicationDetails={closed} />);

    expect(
      screen.queryByRole("button", { name: "submit" }),
    ).not.toBeInTheDocument();
  });

  it("hides the Submit button when application has already been submitted", () => {
    const props = makeBaseProps();
    const open: ApplicationDetail = {
      ...props.applicationDetails,
      competition: { ...props.applicationDetails.competition, is_open: true },
    };

    render(
      <InformationCard
        {...props}
        applicationSubmitted={true}
        applicationDetails={open}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "submit" }),
    ).not.toBeInTheDocument();
  });

  it("disables the Submit button while submissionLoading=true", () => {
    const props = makeBaseProps();
    const open: ApplicationDetail = {
      ...props.applicationDetails,
      competition: { ...props.applicationDetails.competition, is_open: true },
    };

    render(
      <InformationCard
        {...props}
        submissionLoading={true}
        applicationDetails={open}
      />,
    );

    // When submitting, the button label becomes "Loading... "
    const button = screen.getByRole("button", { name: /Loading/i });
    expect(button).toBeDisabled();
  });
});

describe("InformationCard - Org-only + unassociated application warning and modal entry points", () => {
  it("shows the warning alert and disables submit when opportunity is org-only and application has no org", () => {
    const props = makeBaseProps();

    // Make the opportunity org-only by removing "individuals"/"unrestricted"
    const orgOnlyProps = {
      ...props,
      opportunityApplicantTypes: [
        "for_profit_organizations_other_than_small_businesses",
      ],
    };

    // Ensure app has no organization
    const applicationWithNoOrg: ApplicationDetail = {
      ...orgOnlyProps.applicationDetails,
      organization: null,
      competition: {
        ...orgOnlyProps.applicationDetails.competition,
        is_open: true,
      },
    };

    render(
      <InformationCard
        {...orgOnlyProps}
        applicationDetails={applicationWithNoOrg}
      />,
    );

    // Alert title comes from translation key
    expect(
      screen.getByText("unassociatedApplicationAlert.title"),
    ).toBeInTheDocument();

    // Submit is still rendered, but disabled
    expect(screen.getByRole("button", { name: "submit" })).toBeDisabled();
  });

  it("opens the transfer ownership modal when clicking the inline alert link", () => {
    const props = makeBaseProps();

    const orgOnlyProps = {
      ...props,
      opportunityApplicantTypes: ["some_org_type_only"],
    };

    const applicationWithNoOrg: ApplicationDetail = {
      ...orgOnlyProps.applicationDetails,
      organization: null,
      competition: {
        ...orgOnlyProps.applicationDetails.competition,
        is_open: true,
      },
    };

    render(
      <InformationCard
        {...orgOnlyProps}
        applicationDetails={applicationWithNoOrg}
      />,
    );

    // The rich body includes link text inside InlineActionLink button.
    // useTranslationsMock returns keys, but the body still contains the <link> chunk.
    // Easiest: click the first button inside the alert (InlineActionLink mock).
    const buttons = screen.getAllByRole("button");
    const inlineLinkButton = buttons.find(
      (button) =>
        button.textContent?.includes("unassociatedApplicationAlert.body") ||
        button.textContent?.includes("Click here") ||
        button.textContent?.includes("transfer"),
    );

    if (!inlineLinkButton) {
      throw new Error("Could not find inline alert link button");
    }

    fireEvent.click(inlineLinkButton);

    expect(screen.getByTestId("transfer-ownership-modal")).toBeInTheDocument();
  });

  it("opens the transfer ownership modal when clicking the TransferOwnershipButton", () => {
    const props = makeBaseProps();

    const applicationWithNoOrg: ApplicationDetail = {
      ...props.applicationDetails,
      organization: null,
      competition: { ...props.applicationDetails.competition, is_open: true },
    };

    render(
      <InformationCard {...props} applicationDetails={applicationWithNoOrg} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Transfer button" }));
    expect(screen.getByTestId("transfer-ownership-modal")).toBeInTheDocument();
  });
});
