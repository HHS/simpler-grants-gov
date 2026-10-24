import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
using SimplerForms;
namespace Forms.NSFSuggestedReviewers;

// Local bounded text transport, not one semantic question for both reviewer purposes.
@minLength(1)
@maxLength(4000)
@UI.widget(Rendering.Widget.TextArea)
@Meta.role(ResponseRole.applicantInput)
scalar ReviewerText extends string;

@Meta.form(#{
  id: "nsf-suggested-reviewers",
  formName: "NSF Suggested Reviewers",
})
@GrantsGov.form(#{
  legacyFormId: 308,
  shortFormName: "NSF_SuggestedReviewers",
  formVersion: "1.1",
  agencyCode: "SGG",
  ombNumber: "3145-0058",
  expirationDate: "2026-11-30",
})
@example(#{}, #{ title: "No optional information" })
@example(
  #{
    suggestedReviewers: "Dr. Ada Example, Department of Biology, Example University; expertise: microbial ecology.",
    reviewersNotToInclude: "Dr. Ben Example, Example Institute; recent collaborator with the principal investigator.",
  },
  #{ title: "Illustrative complete response" }
)
model NSFSuggestedReviewers {
  @UI.label("Suggested reviewers")
  @doc("Provide the First, Middle, and Last Name of suggested reviewers that you believe are especially well qualified to review this proposal.")
  suggestedReviewers?: ReviewerText;

  @UI.label("Reviewers not to include")
  @doc("Designate persons you would prefer not review this proposal and indicate why.")
  reviewersNotToInclude?: ReviewerText;
}
