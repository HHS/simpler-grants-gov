import "simpler-forms";
import "#questions/research/index.tsp";
import "#questions/types/attachment.tsp";
using SimplerForms;

// Matched document purposes in PHS398 Research Plan 797 and Training Program Plan 798 (both 5.0).
// UUID transport is shared; application context and PDF validation belong to application services.
namespace Questions.Research.Documents;

/** Attach PDF formatted file. Required for Resubmission or Revision applications. Follow funding opportunity and agency instructions for page limits. */
@Meta.question(#{ id: "research/introduction-to-application" })
@UI.label("Introduction to Application")
scalar IntroductionToApplication extends Questions.Types.Attachment;

/** Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance. */
@Meta.question(#{ id: "research/multiple-pd-pi-leadership-plan" })
@UI.label("Multiple PD/PI Leadership Plan")
scalar MultiplePdPiLeadershipPlan extends Questions.Types.Attachment;

/** Attach PDF formatted file. Required when vertebrate animals are used, as declared on R&R Other Project Information. Follow funding opportunity and agency instructions. */
@Meta.question(#{ id: "research/vertebrate-animals" })
@UI.label("Vertebrate Animals")
scalar VertebrateAnimals extends Questions.Types.Attachment;

/** Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance. */
@Meta.question(#{ id: "research/select-agent-research" })
@UI.label("Select Agent Research")
scalar SelectAgentResearch extends Questions.Types.Attachment;

/** Attach PDF formatted file. See funding opportunity announcement and agency-specific instructions for additional guidance. */
@Meta.question(#{ id: "research/consortium-contractual-arrangements" })
@UI.label("Consortium/Contractual Arrangements")
scalar ConsortiumContractualArrangements extends Questions.Types.Attachment;

/** Attach PDF formatted file containing the letters of support. See funding opportunity announcement and agency-specific instructions for additional guidance. */
@Meta.question(#{ id: "research/letters-of-support" })
@UI.label("Letters of Support")
scalar LettersOfSupport extends Questions.Types.Attachment;

/** Attach PDF formatted file containing other plans requested by the funding opportunity and agency-specific instructions. */
@Meta.question(#{ id: "research/other-plans" })
@UI.label("Other Plans")
scalar OtherPlans extends Questions.Types.Attachment;
