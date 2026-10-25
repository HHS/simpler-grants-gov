import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "./classifications.tsp";
using SimplerForms;
namespace Forms.AfriProjectType;

// agencyCode SGG follows this library's conventional registration metadata; it is
// not a claim that the source identifies SGG as the awarding agency.
@doc("Who completes this form:  Each project director (PD) applying to the Agriculture and Food Research Initiative (AFRI) Request for Applications (RFA).\nHow this template is completed:\n   •  Select the appropriate Project Type box and Grant Type box(es) (For FASE Grants, select an appropriate sub-category).\nPublic Burden Statement: \n\nAccording to the Paperwork Reduction Act of 1995, an agency may not conduct or sponsor, and a person is not required to respond to a collection of information unless it displays a valid OMB control number. The valid OMB control number for this information collection is 0524-0039. The time required to complete this information collection is estimated to average 10 minutes per response, including the time for reviewing instructions, searching existing data sources, gathering and maintaining the data needed, and completing and reviewing the collection of information.")
@Meta.form(#{ id: "afri-project-type", formName: "AFRI PROJECT TYPE" })
@GrantsGov.form(#{
  legacyFormId: 796,
  shortFormName: "AFRI_Project_Type_2_0",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "0524-0039",
  expirationDate: "2025-08-31",
})
@example(
  #{ projectType: ProjectType.Research, grant: #{ type: GrantType.Standard } },
  #{
    title: "Standard research project",
    description: "The two required classifications; inactive grant details are absent.",
  }
)
@example(
  #{
    projectType: ProjectType.Integrated,
    grant: #{
      type: GrantType.FoodandAgricultureScienceEnhancementFASE,
      faseType: FaseType.Strengthening,
      strengtheningType: StrengtheningType.Equipment,
    },
  },
  #{
    title: "FASE Strengthening Equipment",
    description: "Conditional subtype and further Strengthening type. Integrated guidance requires at least two source components; this answer does not establish eligibility.",
  }
)
@example(
  #{
    projectType: ProjectType.Extension,
    grant: #{
      type: GrantType.Other,
      otherDescription: "Community partnership award",
    },
  },
  #{
    title: "Other grant mechanism",
    description: "The Other mechanism requires its source-defined description; consult the announcement for available options.",
  }
)
@example(
  #{
    projectType: ProjectType.Research,
    grant: #{
      type: GrantType.Standard,
      faseType: FaseType.Strengthening,
      strengtheningType: StrengtheningType.Sabbatical,
      otherDescription: "Retained prior mechanism",
    },
  },
  #{
    title: "Retained inactive details",
    description: "All five fields are represented. Inactive details stay retained; a retained Strengthening subtype still requires its further type. No automatic clearing or active-branch reinterpretation.",
  }
)
model AfriProjectType {
  @doc("One selection is required.")
  @UI.label("Project Type")
  @UI.widget(Rendering.Widget.Radio)
  projectType: ProjectType;

  @UI.label("Grant Type")
  grant: Grant;
}

model Grant {
  @doc("One selection is required.")
  @UI.label("Grant Type")
  @UI.widget(Rendering.Widget.Radio)
  type: GrantType;

  @doc("Select one option. ")
  @UI.label("FASE Type")
  @UI.widget(Rendering.Widget.Radio)
  @Validation.requiredWhen(
    Grant.type,
    "Food and Agriculture Science Enhancement (FASE)"
  )
  @UI.enabledWhen(Grant.type, "Food and Agriculture Science Enhancement (FASE)")
  faseType?: FaseType;

  @doc("Select one option. ")
  @UI.label("Strengthening Type")
  @UI.widget(Rendering.Widget.Radio)
  @Validation.requiredWhen(Grant.faseType, "Strengthening")
  @UI.enabledWhen(Grant.faseType, "Strengthening")
  strengtheningType?: StrengtheningType;

  @doc("Insert the name of the \"Other\" Grant Type. (Refer to the funding opportunity for available options to this field.)")
  @UI.label("Other Description")
  @Validation.requiredWhen(Grant.type, "Other")
  @UI.enabledWhen(Grant.type, "Other")
  @minLength(0)
  @maxLength(60)
  otherDescription?: string;
}
