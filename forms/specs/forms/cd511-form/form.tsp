import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/name.tsp";
import "#questions/person/title.tsp";
import "#questions/submission/index.tsp";
using SimplerForms;
namespace Forms.CD511;

/** Existing SGG electronic draft; applicant answers stay distinct from service-owned completion. */
@Meta.form(#{
  id: "cd511-form",
  formName: "CD-511 CERTIFICATION REGARDING LOBBYING",
})
@GrantsGov.form(#{
  legacyFormId: 276,
  shortFormName: "CD511",
  formVersion: "1.1",
  agencyCode: "SGG",
})
@example(
  #{
    applicantName: "Illustrative CD Harbor Research",
    projectName: "Independent Project Reference",
    contactPerson: #{ firstName: "Priya", lastName: "Stone" },
    contactPersonTitle: "Program Director",
  },
  #{
    title: "Project-name applicant draft",
    description: "One reference is enough. Signature/date are absent because the applicant draft has not been submitted.",
  }
)
@example(
  #{
    applicantName: "Illustrative CD Harbor Research",
    awardNumber: "AWARD-CD-2026-001",
    contactPerson: #{ firstName: "Jonah", lastName: "Reed" },
    contactPersonTitle: "Certifying Official",
  },
  #{
    title: "Award-number applicant draft",
    description: "Uses the independent award-number route; no project name or service values are invented.",
  }
)
@example(
  #{
    applicantName: "Illustrative CD River Institute",
    awardNumber: "AWARD-CD-2026-002",
    projectName: "Distinct Project CD-511",
    contactPerson: #{
      prefix: "Ms.",
      firstName: "Avery",
      middleName: "Rae",
      lastName: "Pine",
      suffix: "Jr.",
    },
    contactPersonTitle: "Executive Director",
    signature: "ILLUSTRATIVE CD511 SUBMISSION CONTEXT",
    submittedDate: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Both references and completed illustrative context",
    description: "Both separate references are allowed; synthetic submission values remain readonly context, not a signed or submitted application.",
  }
)
@Validation.atLeastOneOf(CD511.awardNumber, CD511.projectName)
model CD511 {
  @UI.label("NAME OF APPLICANT")
  @Meta.role(ResponseRole.applicantInput)
  applicantName: Questions.Organizations.OrgName;

  // Two distinct answers with different bounds and consumers. Both are allowed.
  @doc("Enter the project award number.")
  @UI.label("AWARD NUMBER")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(25)
  @Meta.role(ResponseRole.applicantInput)
  awardNumber?: string;

  @doc("Enter the name of the project.")
  @UI.label("PROJECT NAME")
  @UI.widget(Rendering.Widget.Text)
  @minLength(1)
  @maxLength(60)
  @Meta.role(ResponseRole.applicantInput)
  projectName?: string;

  @UI.label("Contact Person")
  @Meta.role(ResponseRole.applicantInput)
  contactPerson: Questions.People.PersonName;

  @UI.label("Title")
  @Meta.role(ResponseRole.applicantInput)
  contactPersonTitle: Questions.People.PersonTitle;

  @UI.label("SIGNATURE")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  signature?: Questions.Submission.SubmissionSignature;

  @doc("Completed on submission to Grants.gov.")
  @UI.label("DATE")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  submittedDate?: plainDate;
}
