import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/submission/index.tsp";
import "#questions/person/title.tsp";

using SimplerForms;

namespace Forms.SF424BIndividual;

/** Individual applicant name; the legacy XML name does not make this an organization identity. */
@minLength(1)
@maxLength(60)
scalar ApplicantName extends string;

/** The representative whose signature placeholder is populated by submission. */
model SF424BIndividualRepresentative {
  @UI.readOnly
  signature: Questions.Submission.SubmissionSignature;

  @doc("Enter the title of the official certifying that the applicant will comply with the requirements set forth in this assurance form. This field is required.")
  @UI.label("TITLE")
  @UI.widget(Rendering.Widget.Text)
  title: Questions.People.PersonTitle;
}

/** Completion values include explicit synthetic application/submission context in the examples. */
@Meta.form(#{
  id: "assurances-for-non-construction-programs-sf-424b-individual",
  formName: "ASSURANCES - NON-CONSTRUCTION PROGRAMS",
})
@GrantsGov.form(#{
  legacyFormId: 521,
  shortFormName: "Individual_SF424B",
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
    applicantOrganizationName: "Jordan Lee",
    submittedDate: plainDate.fromISO("2026-10-24"),
  },
  #{
    title: "Completed context example",
    description: "Synthetic individual applicant and submission values; not a submitted or signed application.",
  }
)
@example(
  #{
    authorizedRepresentative: #{
      signature: "Morgan Patel",
      title: "Authorized Certifying Official",
    },
    applicantOrganizationName: "Morgan Patel",
    submittedDate: plainDate.fromISO("2026-10-25"),
  },
  #{
    title: "Second completed context example",
    description: "Distinct values exercise every answer-to-XML binding.",
  }
)
model SF424BIndividual {
  @doc("The certifying official's signature placeholder and title. Signature is populated on submission; title follows this edition's source ownership rules.")
  @UI.label("Authorized Representative")
  authorizedRepresentative: SF424BIndividualRepresentative;

  @doc("Enter the name of the applicant. This field is required.")
  @UI.label("APPLICANT NAME")
  @UI.widget(Rendering.Widget.Text)
  applicantOrganizationName: ApplicantName;

  @doc("Completed on submission to Grants.gov.")
  @UI.label("DATE SUBMITTED")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  submittedDate: plainDate;
}
