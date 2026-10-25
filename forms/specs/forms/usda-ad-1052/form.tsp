import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/award/index.tsp";
import "#questions/submission/index.tsp";
import "#forms/shared/usda-workplace-address.tsp";
import "#questions/types/address.tsp";
import "#questions/types/yes-no.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/name.tsp";
import "#questions/person/title.tsp";
using SimplerForms;
namespace Forms.USDAAD1052;

// Same source-qualified activity/address body as AD1049. The only narrower source
// use is DAT O40's postal maximum10, versus the original GlobalLibrary XSD maximum30.
model AD1052WorkplaceAddress extends Forms.USDA.USDAWorkplaceAddress {
  @doc("Enter the Postal Code (e.g., ZIP code). This field is required if the Country is United States.")
  @UI.label("Zip / Postal Code")
  @Validation.requiredWhen(
    AD1052WorkplaceAddress.country,
    Questions.Types.CountryCode.USA
  )
  @Validation.constraints(#{ maxLength: 10 })
  zipCode?: Questions.Types.AddressParts.ZipCode;
}

// DAT row7 requires exactly four YEAR characters. XSD xs:gYear permits additional
// signed, extended-year and timezone lexical forms, recorded separately in source evidence.
// This declared DAT/XSD intersection preserves leading zeros and excludes XSD1.0 year0000.
@minLength(4)
@maxLength(4)
@pattern("^(?!0000)[0-9]{4}$")
scalar FederalFiscalYear extends string;

enum CertificationScope {
  allStateAgencies: "State (All State Agencies)",
  singleStateAgency: "Single State Agency",
}

/** Cover-sheet representative context; not a second signing/attestation answer. */
model AD1052AuthorizedRepresentative {
  @doc("Pre-populated from the Application cover sheet. First and last name are required.")
  @UI.label("Name")
  name: Questions.People.PersonName;

  @doc("Pre-populated from the Application cover sheet. This field is required.")
  @UI.label("Title")
  title: Questions.People.PersonTitle;
}

/** Submission-service values; authentic production and signing are integration obligations. */
model AD1052Submission {
  @doc("Completed by Grants.gov upon submission. This field is required.")
  @UI.label("SIGNATURE(S)")
  signature: Questions.Submission.SubmissionSignature;

  @doc("Completed by Grants.gov upon submission. This field is required.")
  @UI.label("DATE")
  @UI.widget(Rendering.Widget.Text)
  dateSigned: plainDate;
}

@Meta.form(#{ id: "usda-ad-1052", formName: "USDA AD-1052" })
@GrantsGov.form(#{
  legacyFormId: 696,
  shortFormName: "AD_1052_2_0",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "0505-0027",
  expirationDate: "2025-09-30",
})
@example(
  #{
    fiscalYear: "2027",
    certificationType: CertificationScope.singleStateAgency,
    agencyName: "Illustrative State Conservation Agency",
    projectName: "State Workplace Program 2027",
    authorizedRepresentative: #{
      name: #{ firstName: "Jordan", lastName: "Lee" },
      title: "Agency Director",
    },
    submission: #{
      signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
      dateSigned: plainDate.fromISO("2026-10-25"),
    },
  },
  #{
    title: "Single-agency minimum with illustrative producer context",
    description: "Fiscal year, scope, agency and project are entered answers. Representative and submission values are illustrative test context, not authentic prefill, certification or signing.",
  }
)
@example(
  #{
    fiscalYear: "2027",
    certificationType: CertificationScope.allStateAgencies,
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
    agencyName: "Illustrative State Government",
    projectName: "State Workplace Program 2027",
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
    title: "All State agencies with two independently identified workplaces",
    description: "Illustrative entered answers and explicitly illustrative cover/submission context. The on-file answer is independent of location count; no actual person has certified, signed or submitted.",
  }
)
model AD1052Certification {
  @doc("Enter the Federal Fiscal Year. This field is required.")
  @UI.label("Federal Fiscal Year")
  @UI.widget(Rendering.Widget.Text)
  @Meta.role(ResponseRole.applicantInput)
  fiscalYear: FederalFiscalYear;

  @doc("One selection is required.")
  @UI.label("This certification is for a (check one)")
  @UI.widget(Rendering.Widget.Radio)
  @Meta.role(ResponseRole.applicantInput)
  certificationType: CertificationScope;

  @doc("The grantee may identify up to ten places of performance. The source instructions also permit workplaces to remain on file; no location is inferred when none is entered.")
  @UI.label("Place of Performance")
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  @Meta.role(ResponseRole.applicantInput)
  @maxItems(10)
  workplaces?: AD1052WorkplaceAddress[];

  @doc("Check to select.")
  @UI.label("Check if there are workplaces on file that are not identified here.")
  @UI.widget(Rendering.Widget.Checkbox)
  @Meta.role(ResponseRole.applicantInput)
  otherWorkplacesOnFile?: Questions.Types.YesNo;

  @doc("Enter the Organization Name. This field is required.")
  @UI.label("ORGANIZATION NAME")
  @UI.widget(Rendering.Widget.Text)
  @Meta.role(ResponseRole.applicantInput)
  agencyName: Questions.Organizations.OrgName;

  @Meta.role(ResponseRole.applicantInput)
  projectName: Questions.Awards.ProjectReference;

  @doc("Pre-populated from the Application cover sheet. First name, last name and title are required.")
  @UI.label("Authorized Representative")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  authorizedRepresentative: AD1052AuthorizedRepresentative;

  @doc("Completed by Grants.gov upon submission. Examples are illustrative context, not an actual signature or submitted application.")
  @UI.label("Submission")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  submission: AD1052Submission;
}
