import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#forms/shared/usda-workplace-address.tsp";
import "#questions/types/yes-no.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/name.tsp";
import "#questions/person/title.tsp";
using SimplerForms;
namespace Forms.USDAAD1049;

// Family composition shares source-qualified bank parts; no new question identity.
model WorkplaceAddress extends Forms.USDA.USDAWorkplaceAddress {}

/** Cover-sheet representative context; not a second signing/attestation answer. */
model AuthorizedRepresentative {
  @doc("Pre-populated from the Application cover sheet. First and last name are required.")
  @UI.label("Name")
  name: Questions.People.PersonName;

  @doc("Pre-populated from the Application cover sheet. This field is required.")
  @UI.label("Title")
  title: Questions.People.PersonTitle;
}

/** Submission-service values; authentic production and signing are integration obligations. */
model Submission {
  @doc("Completed by Grants.gov upon submission. This field is required.")
  @UI.label("SIGNATURE(S)")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(144)
  signature: string;

  @doc("Completed by Grants.gov upon submission. This field is required.")
  @UI.label("DATE")
  @UI.widget(Rendering.Widget.Text)
  dateSigned: plainDate;
}

@Meta.form(#{ id: "usda-ad-1049", formName: "USDA AD-1049" })
@GrantsGov.form(#{
  legacyFormId: 695,
  shortFormName: "AD_1049_2_0",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "0505-0027",
  expirationDate: "2025-09-30",
})
@example(
  #{
    projectName: "Cedar Valley Workplaces 2027",
    organizationName: "Illustrative Research Organization",
    authorizedRepresentative: #{
      name: #{ firstName: "Jordan", lastName: "Lee" },
      title: "Executive Director",
    },
    submission: #{
      signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
      dateSigned: plainDate.fromISO("2026-10-25"),
    },
  },
  #{
    title: "Minimum complete contract with illustrative producer context",
    description: "The applicant enters the project answer. Cover and submission values are illustrative test context, not authentic prefill, attestation or signing. No workplace or on-file answer is inferred.",
  }
)
@example(
  #{
    workplaces: #[
      #{
        street1: "101 Research Way",
        street2: "Suite 202",
        city: "Charlottesville",
        county: "Albemarle",
        country: Questions.Types.CountryCode.USA,
        state: Questions.Types.StateCode.VA,
        zipCode: "22903-1234",
      },
      #{
        street1: "27 King Street",
        city: "Toronto",
        country: Questions.Types.CountryCode.CAN,
        province: "Ontario",
        zipCode: "M5H 1A1",
      }
    ],
    otherWorkplacesOnFile: Questions.Types.YesNo.yes,
    projectName: "Cedar Valley Workplaces 2027",
    organizationName: "Illustrative Research Organization",
    authorizedRepresentative: #{
      name: #{
        prefix: "Dr.",
        firstName: "Morgan",
        middleName: "Alex",
        lastName: "Patel",
        suffix: "Jr.",
      },
      title: "Authorized Representative",
    },
    submission: #{
      signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
      dateSigned: plainDate.fromISO("2026-10-25"),
    },
  },
  #{
    title: "Two workplaces and independently identified on-file workplaces",
    description: "Illustrative applicant answers and explicitly illustrative cover/submission test context. No actual organization or person has certified, signed or submitted.",
  }
)
model Certification {
  @doc("The grantee may identify up to ten places of performance. The source instructions also permit workplaces to remain on file; no location is inferred when none is entered.")
  @UI.label("Place of Performance")
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  @Meta.role(ResponseRole.applicantInput)
  @maxItems(10)
  workplaces?: WorkplaceAddress[];

  @doc("Check to select.")
  @UI.label("Check if there are workplaces on file that are not identified here.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  otherWorkplacesOnFile?: Questions.Types.YesNo;

  @doc("Pre-populated from the Application cover sheet. This field is required.")
  @UI.label("ORGANIZATION NAME")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  organizationName: Questions.Organizations.OrgName;

  @doc("Enter the PR/Award Number or Project Name. This field is required.")
  @UI.label("PR/AWARD NUMBER OR PROJECT NAME")
  @UI.widget(Rendering.Widget.Text)
  @Meta.role(ResponseRole.applicantInput)
  @minLength(1)
  @maxLength(60)
  projectName: string;

  @doc("Pre-populated from the Application cover sheet. First name, last name and title are required.")
  @UI.label("Authorized Representative")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  authorizedRepresentative: AuthorizedRepresentative;

  @doc("Completed by Grants.gov upon submission. Examples are illustrative context, not an actual signature or submitted application.")
  @UI.label("Submission")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  submission: Submission;
}
