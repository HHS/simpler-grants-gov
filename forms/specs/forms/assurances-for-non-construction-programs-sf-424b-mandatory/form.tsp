import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/submission/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/title.tsp";

using SimplerForms;

namespace Forms.SF424BMandatory;

/** The representative whose signature placeholder is populated by submission. */
model SF424BMandatoryRepresentative {
  @UI.readOnly
  signature: Questions.Submission.SubmissionSignature;

  @doc("Enter the title of the official certifying that the applicant organization will comply with the requirements set forth in this assurance form. This field is required.")
  @UI.label("TITLE")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  title: Questions.People.PersonTitle;
}

/** Completion values include explicit synthetic application/submission context in the examples. */
@Meta.form(#{
  id: "assurances-for-non-construction-programs-sf-424b-mandatory",
  formName: "ASSURANCES - NON-CONSTRUCTION PROGRAMS",
})
@GrantsGov.form(#{
  legacyFormId: 328,
  shortFormName: "Mandatory_SF424B",
  formVersion: "1.1",
  agencyCode: "SGG",
  ombNumber: "4040-0007",
  expirationDate: "2028-07-31",
})
@example(
  #{
    authorizedRepresentative: #{
      signature: "Jordan Lee",
      title: "Executive Director",
    },
    applicantOrganizationName: "Example Research Institute",
    submittedDate: plainDate.fromISO("2026-10-24"),
  },
  #{
    title: "Completed context example",
    description: "Synthetic cover-form and submission values; not a submitted or signed application.",
  }
)
@example(
  #{
    authorizedRepresentative: #{
      signature: "Morgan Patel",
      title: "Authorized Certifying Official",
    },
    applicantOrganizationName: "Example Community Organization",
    submittedDate: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Second completed context example",
    description: "Distinct values exercise every answer-to-XML binding.",
  }
)
model SF424BMandatory {
  @doc("The certifying official's signature placeholder and title. Signature is populated on submission; title follows this edition's source ownership rules.")
  @UI.label("Authorized Representative")
  authorizedRepresentative: SF424BMandatoryRepresentative;

  @doc("Enter the name of the applicant organization. This field is required.")
  @UI.label("APPLICANT ORGANIZATION")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  applicantOrganizationName: Questions.Organizations.OrgName;

  @doc("Completed on submission to Grants.gov.")
  @UI.label("DATE SUBMITTED")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  submittedDate: plainDate;
}
