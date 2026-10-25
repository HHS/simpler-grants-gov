import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.NEHLaborStandards;
@UI.layout(LaborAssurances)
model NEHLaborStandardsLayout {
  @UI.label("Assurances as to Labor Standards")
  @doc("ASSURANCES AS TO LABOR STANDARDS\nUNDER SECTION 5(i) AND SECTION 7(g) OF \nTHE NATIONAL FOUNDATION ON THE ARTS AND THE HUMANITIES ACT OF 1965, AS AMENDED\n\nIn consideration of a grant made under section 5 or 7 of the National Foundation on the Arts and the Humanities Act of 1965, as amended, and in order to satisfy the conditions expressed in section 5(i) or section 7(g) of that act so as to be eligible to receive the grant funds,\n\nThe institution named below does hereby make this contractually binding promise to the Secretary of Labor that:\n\n(1) all professional performers and related or supporting professional personnel (other than laborers or mechanics with respect to whom labor standards are prescribed in subsections 5(n) and 7(j) of the act) employed on projects or productions which are financed in whole or in part under such sections will be paid, without subsequent deduction or rebate on any account, not less than the minimum compensation as determined in accordance with 29 CFR 505.3 to be the prevailing minimum compensation for persons employed on similar activities; and\n\n(2) no part of any project or production which is financed in whole or in part under section 5 or section 7 of the National Foundation on the Arts and the Humanities Act of 1965, as amended, will be performed or engaged in under working conditions which are unsanitary or hazardous or dangerous to the health and safety of the employee engaged in such project or production, including particularly, no work which is prohibited for safety or sanitary reasons by any of the contracts with labor organizations listed in 29 CFR 505.3(a).  The recipient further promises to keep the records and permit the inspections provided by 29 CFR 505.5(b).  Receipt of a copy of 29 CFR Part 505 is hereby acknowledged. This promise may be enforced by the Secretary through any appropriate action at law or in equity in any court of competent jurisdiction.")
  assurance: {
    applicantOrganizationName: LaborAssurances.applicantOrganizationName;
    representativeName: LaborAssurances.representativeName;
    submittedDate: LaborAssurances.submittedDate;
  };

  @UI.label("Paperwork Burden Statement")
  @doc("The Office of Management and Budget (OMB) requires federal agencies to supply information on the time needed to complete forms and also to invite comments on the paperwork burden.\nNEH estimates that on average it takes 15 minutes to complete this form. This estimate includes time for reviewing instructions; researching, gathering, and maintaining the information needed; and completing and reviewing the form.\nYou may send any comments regarding the estimated completion time or any other aspect of this application, including suggestions for reducing the completion time, to the PRA Officer at pra@neh.gov. According to the Paperwork Reduction Act of 1995, no persons are required to respond to a collection of information unless it displays a valid OMB number.")
  burden: {};

  @UI.label("Agency information")
  @doc("NATIONAL ENDOWMENT FOR THE HUMANITIES\n\nOFFICE OF GRANT MANAGEMENT\n\n400 SEVENTH STREET SW\n\nWASHINGTON, D.C. 20506\n\nGRANTMANAGEMENT@NEH.GOV \n(202) 606-8494\n\nWWW.NEH.GOV\n\nU.S. Department of Labor ESA-38\n\nRev. June 1988")
  agency: {};
}
