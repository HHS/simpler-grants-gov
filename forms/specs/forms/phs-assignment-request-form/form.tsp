import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
using SimplerForms;
namespace Forms.PHSAssignmentRequest;

// Local purpose-specific types, not new shared-bank question identities.
/** Enter suggestion for awarding component (e.g., NCI). All requests will be considered; however, assignment requests cannot always be honored. */
@Meta.role(ResponseRole.applicantInput)
@minLength(0)
@maxLength(7)
@UI.widget(Rendering.Widget.Text)
scalar AwardingComponentSuggestion extends string;

/** Enter suggested study section (e.g., AIRT). All suggestions will be considered; however, study section requests cannot always be honored. Entry limited to 20 characters. */
@Meta.role(ResponseRole.applicantInput)
@minLength(0)
@maxLength(20)
// DAT A-3-0 / PDF instructions: remove only spaces, hyphens and parentheses.
@pattern("^[^\\x20()\\-]*$")
@UI.widget(Rendering.Widget.Text)
scalar StudySectionSuggestion extends string;

/** Enter scientific area of expertise needed to review your application. */
@Meta.role(ResponseRole.applicantInput)
@minLength(0)
@maxLength(40)
@UI.widget(Rendering.Widget.Text)
scalar ScientificExpertise extends string;

@Meta.form(#{
  id: "phs-assignment-request-form",
  formName: "PHS Assignment Request Form",
})
@GrantsGov.form(#{
  legacyFormId: 833,
  shortFormName: "PHS_AssignmentRequestForm",
  formVersion: "4.0",
  agencyCode: "SGG",
  ombNumber: "0925-0001",
  expirationDate: "2027-12-31",
})
@example(#{}, #{ title: "No assignment suggestions" })
@example(
  #{
    suggestedAwardingComponent1: "NCI",
    suggestedAwardingComponent3: "NHLBI",
    expertise5: "Biostatistics",
  },
  #{ title: "Sparse fixed slots" }
)
@example(
  #{
    suggestedAwardingComponent1: "NCI",
    suggestedAwardingComponent2: "NIAID",
    suggestedAwardingComponent3: "NHLBI",
    suggestedStudySection1: "AIRT",
    suggestedStudySection2: "BP10",
    suggestedStudySection3: "B10",
    rationaleSuggestions: "The suggested awarding components and study sections match the proposed research. NIH staff consulted: Dr. Example.",
    expertise1: "Immunology",
    expertise2: "Genomics",
    expertise3: "Clinical epidemiology",
    expertise4: "Biostatistics",
    expertise5: "Health services research",
    notReview: "Dr. Example should not review this application because of a recent collaboration.",
  },
  #{ title: "All assignment suggestions" }
)
model PHSAssignmentRequest {
  @UI.label("Suggested awarding component 1")
  suggestedAwardingComponent1?: AwardingComponentSuggestion;

  @UI.label("Suggested awarding component 2")
  suggestedAwardingComponent2?: AwardingComponentSuggestion;

  @UI.label("Suggested awarding component 3")
  suggestedAwardingComponent3?: AwardingComponentSuggestion;

  @UI.label("Suggested study section 1")
  suggestedStudySection1?: StudySectionSuggestion;

  @UI.label("Suggested study section 2")
  suggestedStudySection2?: StudySectionSuggestion;

  @UI.label("Suggested study section 3")
  suggestedStudySection3?: StudySectionSuggestion;

  @UI.label("Rationale for assignment suggestions")
  @Meta.role(ResponseRole.applicantInput)
  @doc("Entry is limited to 1000 characters.")
  @minLength(0)
  @maxLength(1000)
  @UI.widget(Rendering.Widget.TextArea)
  rationaleSuggestions?: string;

  @UI.label("Scientific expertise 1")
  expertise1?: ScientificExpertise;

  @UI.label("Scientific expertise 2")
  expertise2?: ScientificExpertise;

  @UI.label("Scientific expertise 3")
  expertise3?: ScientificExpertise;

  @UI.label("Scientific expertise 4")
  expertise4?: ScientificExpertise;

  @UI.label("Scientific expertise 5")
  expertise5?: ScientificExpertise;

  @UI.label("Individuals who should not review and why")
  @Meta.role(ResponseRole.applicantInput)
  @doc("Entry is limited to 1000 characters.")
  @minLength(0)
  @maxLength(1000)
  @UI.widget(Rendering.Widget.TextArea)
  notReview?: string;
}
