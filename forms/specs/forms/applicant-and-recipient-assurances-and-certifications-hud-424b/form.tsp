import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/name.tsp";
import "#questions/person/title.tsp";
import "#questions/submission/index.tsp";
using SimplerForms;
namespace Forms.HUD424B;

// Values owned by the application cover remain separate from submission context.
model HUD424BRepresentative {
  @UI.label("Authorized Representative Name")
  name: Questions.People.PersonName;

  @UI.label("Title")
  title: Questions.People.PersonTitle;
}

model HUD424BSubmission {
  @UI.label("Signature")
  @doc("Completed Upon Submission to Grants.gov.")
  signature: Questions.Submission.SubmissionSignature;

  @UI.label("Date")
  @doc("Completed Upon Submission to Grants.gov.")
  @UI.widget(Rendering.Widget.Text)
  dateSigned: plainDate;
}

@Meta.form(#{
  id: "applicant-and-recipient-assurances-and-certifications-hud-424b",
  formName: "Applicant and Recipient Assurances and Certifications (HUD-424B)",
})
@GrantsGov.form(#{
  legacyFormId: 808,
  shortFormName: "HUD_424B",
  formVersion: "1.0",
  agencyCode: "SGG",
  ombNumber: "2501-0044",
  expirationDate: "2027-02-28",
})
@example(
  #{
    authorizedRepresentative: #{
      name: #{ firstName: "Jordan", lastName: "Lee" },
      title: "Executive Director",
    },
    organizationName: "Illustrative Housing Services",
    submission: #{
      signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
      dateSigned: plainDate.fromISO("2026-10-25"),
    },
  },
  #{
    title: "Required illustrative cover and submission context",
    description: "Synthetic review context. This preview does not populate, certify, sign or submit an application.",
  }
)
@example(
  #{
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
    organizationName: "Illustrative Community Housing",
    submission: #{
      signature: "ILLUSTRATIVE SUBMISSION CONTEXT",
      dateSigned: plainDate.fromISO("2026-10-25"),
    },
  },
  #{
    title: "All optional name parts supplied",
    description: "Entirely illustrative supplied context, including optional name parts. No additional consent answer is invented.",
  }
)
model HUD424BAssurances {
  @doc("Pre-populated from the SF-424. Review this supplied context; it is read-only.")
  @UI.label("Authorized Representative")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  authorizedRepresentative: HUD424BRepresentative;

  @doc("Pre-populated from the SF-424.")
  @UI.label("Applicant Organization")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  organizationName: Questions.Organizations.OrgName;

  @doc("Completed Upon Submission to Grants.gov. Preview values are illustrative, not an actual signature or submission.")
  @UI.label("Submission")
  @UI.readOnly
  @Meta.role(ResponseRole.systemValue)
  submission: HUD424BSubmission;
}
