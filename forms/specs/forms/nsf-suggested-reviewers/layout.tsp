import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.NSFSuggestedReviewers;

@UI.layout(NSFSuggestedReviewers)
model NSFSuggestedReviewersLayout {
  @UI.label("Optional reviewer suggestions")
  @doc("Applicants may include a list of suggested reviewers who they believe are especially well qualified to review the proposal. Applicants also may designate persons they would prefer not review the proposal, indicating why. These suggestions are optional. Grant Proposal Guide Appendix B, Potentially Disqualifying Conflicts of Interest (https://www.nsf.gov/publications/pub_summ.jsp?ods_key=grantsgovguide), contains information on conflicts of interest that may be useful in preparation of this list.")
  reviewers: {
    suggestedReviewers: NSFSuggestedReviewers.suggestedReviewers;
    reviewersNotToInclude: NSFSuggestedReviewers.reviewersNotToInclude;
  };
}
