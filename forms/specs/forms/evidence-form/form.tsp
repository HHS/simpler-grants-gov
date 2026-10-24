import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";

using SimplerForms;
namespace Forms.Evidence;

/** The four source values; choosing one does not establish eligibility. */
enum EvidenceLevel {
  rationale: "Demonstrates a Rationale",
  promising: "Promising Evidence",
  moderate: "Moderate Evidence",
  strong: "Strong Evidence",
}

// Mirrors the form XSD's ED_Evidence_2_0_1_4000_DataType, not a shared business question.
@minLength(1)
@maxLength(4000)
scalar CitationText extends string;

/** One study and its relevance to this proposed project. */
model Citation {
  /** Enter text up to 4,000 Characters. */
  @UI.label("A. Research/Citation")
  @UI.widget(Rendering.Widget.TextArea)
  citation: CitationText;

  /** Enter text up to 4,000 Characters. */
  @UI.label("B. Relevant Outcome(s)/Relevant Finding(s)")
  @UI.widget(Rendering.Widget.TextArea)
  relevantFindings: CitationText;

  /** Enter text up to 4,000 Characters. */
  @UI.label("C. Project Component(s)/Overlap of Populations and/or Settings")
  @UI.widget(Rendering.Widget.TextArea)
  overlapOfPopulations: CitationText;
}

@Meta.form(#{ id: "evidence-form", formName: "Evidence Form" })
@GrantsGov.form(#{
  legacyFormId: 759,
  shortFormName: "ED_Evidence",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "1894-0001",
  expirationDate: "2028-08-31",
})
@example(
  #{
    levelOfEvidence: EvidenceLevel.promising,
    citations: #[
      #{
        citation: "Fictional Study A (2026), illustrative only.",
        relevantFindings: "Illustrative favorable finding on a relevant outcome; no scientific validity claim.",
        overlapOfPopulations: "Illustrative comparison of project participants and study settings.",
      },
      #{
        citation: "Fictional Study B (2025), illustrative only.",
        relevantFindings: "A second distinct fictional finding to demonstrate repeated data.",
        overlapOfPopulations: "A second distinct fictional population and setting comparison.",
      }
    ],
  },
  #{ title: "Two illustrative studies" }
)
@example(
  #{
    levelOfEvidence: EvidenceLevel.rationale,
    citations: #[
      #{
        citation: "Fictional research citation for a logic model.",
        relevantFindings: "Illustrative explanation of how the findings suggest a relevant outcome.",
        overlapOfPopulations: "Illustrative explanation of how research informs the project component.",
      }
    ],
  },
  #{ title: "Minimum one-study rationale" }
)
model Evidence {
  /** One selection is required. */
  @UI.label("Select the level of evidence of effectiveness for which you are applying. See the Notice Inviting Applications for the relevant definitions and requirements.")
  @UI.widget(Rendering.Widget.Radio)
  levelOfEvidence: EvidenceLevel;

  @UI.label("Citation and relevance")
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  @minItems(1)
  @maxItems(100)
  citations: Citation[];
}
