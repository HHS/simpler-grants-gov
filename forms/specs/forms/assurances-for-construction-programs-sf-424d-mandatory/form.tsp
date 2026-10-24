import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/person/title.tsp";

using SimplerForms;

namespace Forms.SF424DMandatory;

/** The representative whose signature placeholder is populated by submission. */
model SF424DMandatoryRepresentative {
  @doc("Completed on submission to Grants.gov.")
  @UI.label("SIGNATURE OF AUTHORIZED CERTIFYING OFFICIAL")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  @minLength(1)
  @maxLength(144)
  signature: string;

  @doc("Enter the title of the Certifying Official. This field is required.")
  @UI.label("TITLE")
  @UI.widget(Rendering.Widget.Text)
  @UI.readOnly
  title: Questions.People.PersonTitle;
}

/** Completion values include explicit synthetic application/submission context in the examples. */
@Meta.form(#{
  id: "assurances-for-construction-programs-sf-424d-mandatory",
  formName: "ASSURANCES - CONSTRUCTION PROGRAMS",
})
@GrantsGov.form(#{
  legacyFormId: 329,
  shortFormName: "Mandatory_SF424D",
  formVersion: "1.1",
  agencyCode: "SGG",
  ombNumber: "4040-0009",
  expirationDate: "2028-06-30",
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
model SF424DMandatory {
  @doc("The certifying official's signature placeholder and title. Signature is populated on submission; title follows this edition's source ownership rules.")
  @UI.label("Authorized Representative")
  authorizedRepresentative: SF424DMandatoryRepresentative;

  @doc("Enter the Applicant Organization. This field is required.")
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
