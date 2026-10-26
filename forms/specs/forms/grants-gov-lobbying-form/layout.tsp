import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.GGLobbyingForm;

@UI.layout(GGLobbyingForm)
model GGLobbyingFormLayout {
  @UI.label("CERTIFICATION REGARDING LOBBYING")
  @doc("Certification for Contracts, Grants, Loans, and Cooperative Agreements\n\nThe undersigned certifies, to the best of his or her knowledge and belief, that:\n\n(1) No Federal appropriated funds have been paid or will be paid, by or on behalf of the undersigned, to any person for influencing or attempting to influence an officer or employee of an agency, a Member of Congress, an officer or employee of Congress, or an employee of a Member of Congress in connection with the awarding of any Federal contract, the making of any Federal grant, the making of any Federal loan, the entering into of any cooperative agreement, and the extension, continuation, renewal, amendment, or modification of any Federal contract, grant, loan, or cooperative agreement.\n\n(2) If any funds other than Federal appropriated funds have been paid or will be paid to any person for influencing or attempting to influence an officer or employee of any agency, a Member of Congress, an officer or employee of Congress, or an employee of a Member of Congress in connection with this Federal contract, grant, loan, or cooperative agreement, the undersigned shall complete and submit Standard Form-LLL, ''Disclosure of Lobbying Activities,'' in accordance with its instructions.\n\n(3) The undersigned shall require that the language of this certification be included in the award documents for all subawards at all tiers (including subcontracts, subgrants, and contracts under grants, loans, and cooperative agreements) and that all subrecipients shall certify and disclose accordingly. This certification is a material representation of fact upon which reliance was placed when this transaction was made or entered into. Submission of this certification is a prerequisite for making or entering into this transaction imposed by section 1352, title 31, U.S. Code. Any person who fails to file the required certification shall be subject to a civil penalty of not less than $10,000 and not more than $100,000 for each such failure.\n\nStatement for Loan Guarantees and Loan Insurance\n\nThe undersigned states, to the best of his or her knowledge and belief, that:\n\nIf any funds have been paid or will be paid to any person for influencing or attempting to influence an officer or employee of any agency, a Member of Congress, an officer or employee of Congress, or an employee of a Member of Congress in connection with this commitment providing for the United States to insure or guarantee a loan, the undersigned shall complete and submit Standard Form-LLL, ''Disclosure of Lobbying Activities,'' in accordance with its instructions. Submission of this statement is a prerequisite for making or entering into this transaction imposed by section 1352, title 31, U.S. Code. Any person who fails to file the required statement shall be subject to a civil penalty of not less than $10,000 and not more than $100,000 for each such failure.")
  certification: {};

  @UI.label("Applicant and authorized representative")
  @doc("Enter the editable draft answers. Cover-form copying is not performed in this preview. Signature and date are supplied by submission; this preview does not sign or submit.")
  applicant: {
    organizationName: GGLobbyingForm.organizationName;
    authorizedRepresentativeName: GGLobbyingForm.authorizedRepresentativeName;
    authorizedRepresentativeTitle: GGLobbyingForm.authorizedRepresentativeTitle;
  };

  @UI.label("Submission values")
  @doc("Signature and date may be absent in an unsigned draft. Any displayed values are synthetic service context, not a signed certification or submission.")
  submission: {
    authorizedRepresentativeSignature: GGLobbyingForm.authorizedRepresentativeSignature;
    submittedDate: GGLobbyingForm.submittedDate;
  };
}
