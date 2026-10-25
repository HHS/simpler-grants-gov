import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/submission/index.tsp";
import "#questions/organization/index.tsp";
using SimplerForms;
namespace Forms.NEHLaborStandards;
@Meta.form(#{
  id: "assurances-as-to-labor-standards",
  formName: "ASSURANCES AS TO LABOR STANDARDS",
})
@GrantsGov.form(#{
  legacyFormId: 700,
  shortFormName: "NEH_Labor_Standards",
  formVersion: "1.0",
  agencyCode: "SGG",
  ombNumber: "3136-0134",
  expirationDate: "2027-10-31",
})
@example(
  #{
    applicantOrganizationName: "Example Performing Arts Organization",
    representativeName: "Jordan Lee",
    submittedDate: plainDate.fromISO("2026-10-24"),
  },
  #{
    title: "Illustrative completed labor assurance",
    description: "Synthetic cover and submission context, not an actual signed or submitted application.",
  }
)
@example(
  #{
    applicantOrganizationName: "Example Humanities Institution",
    representativeName: "Morgan Patel",
    submittedDate: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Second completed context",
    description: "Distinct values exercise each source binding.",
  }
)
model LaborAssurances {
  @UI.label("(Institution name)")
  @doc("This is the Applicant Information Legal Name from the SF-424.")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  applicantOrganizationName: Questions.Organizations.OrgName;

  @UI.label("(Signature of Institutional Grants Administrator or AOR)")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  representativeName: Questions.Submission.SubmissionSignature;

  @UI.label("(Date)")
  @doc("Completed on submission to Grants.gov.")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  submittedDate: plainDate;
}
