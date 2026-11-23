import "./examples.tsp";
import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";

using SimplerForms;

namespace Forms.NSFSuggestedReviewers;

// Shared length limits for both reviewer fields. They ask two different questions.
@minLength(1)
@maxLength(4000)
@UI.widget(Rendering.Widget.TextArea)
@Meta.role(ResponseRole.applicantInput)
scalar ReviewerText extends string;

@Sgg.sync(#{ xml: "mapping" })
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
@example(Examples.sample1, #{ title: "No optional information" })
@example(Examples.sample2, #{ title: "Suggested reviewers only" })
@example(Examples.sample3, #{ title: "Reviewers not to include only" })
@example(Examples.sample4, #{ title: "Illustrative complete response" })
model NSFSuggestedReviewers {
  /**
   * Provide the First, Middle, and Last Name of suggested reviewers that you believe are especially well qualified to review this proposal.
   */
  @UI.label("Suggested reviewers")
  suggestedReviewers?: ReviewerText;

  /** Designate persons you would prefer not review this proposal and indicate why. */
  @UI.label("Reviewers not to include")
  reviewersNotToInclude?: ReviewerText;
}
