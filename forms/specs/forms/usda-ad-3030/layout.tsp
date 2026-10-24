import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.USDAAD3030;
@UI.layout(Representations)
model USDAAD3030Layout {
  @UI.label("Part A — Applicant")
  @doc("Representations Regarding Felony Conviction\nand Tax Delinquent Status for Corporate Applicants\n\nNote: You only need to complete this form if you are a corporation. A corporation includes, but is not limited to, any entity that has filed articles of incorporation in one of the 50 States, the District of Columbia, or the various territories of the United States including American Samoa, Federated States of Micronesia, Guam, Midway Islands, Northern Mariana Islands, Puerto Rico, Republic of Palau, Republic of the Marshall Islands, or the U.S. Virgin Islands. Corporations include both for profit and non-profit entities.\n\nThe following statement is made in accordance with the Privacy Act of 1974 (5 U.S.C. § 552a, as amended). The authority for requesting the following information for U.S. Department of Agriculture (USDA) agencies and staff offices is in Division E, Title VII, §§ 744, 745 of the Consolidated Appropriations Act, 2022, Public Law 117-103 as amended and/or subsequently enacted. The information will be used to confirm applicant status concerning entity conviction of a felony criminal violation, and/or unpaid Federal tax liability status.\n\nAccording to the Paperwork Reduction Act of 1995, an agency may not conduct or sponsor, and a person is not required to respond to a collection of information unless it displays a valid OMB control number. The valid OMB control number for this information collection is 0505-0025. The time required to complete this information collection is estimated to average 15 minutes per response, including the time for reviewing instructions, searching existing data sources, gathering and maintaining the data needed, and completing and reviewing the collection of information.")
  applicant: {
    applicantName: Representations.applicantName;
    applicantAddress: Representations.applicantAddress;
    taxIdNumber: Representations.taxIdNumber;
    applicantFelony: Representations.applicantFelony;
    unpaidFederalTax: Representations.unpaidFederalTax;
  };

  @UI.label("Part B — Signature")
  @doc("Providing the requested information is voluntary. However, failure to furnish the information will make the applicant ineligible to enter into a contract, memorandum of understanding, grant, loan, loan guarantee, or cooperative agreement with USDA.")
  submission: {
    aorSignature: Representations.aorSignature;
    title: Representations.title;
    dateSigned: Representations.dateSigned;
  };

  @UI.label("USDA Civil Rights Statement")
  @doc("In accordance with Federal civil rights law and U.S. Department of Agriculture (USDA) civil rights regulations and policies, the USDA, its Agencies, offices, and employees, and institutions participating in or administering USDA programs are prohibited from discriminating based on race, color, national origin, religion, sex, gender identity (including gender expression), sexual orientation, disability, age, marital status, family/parental status, income derived from a public assistance program, political beliefs, or reprisal or retaliation for prior civil rights activity, in any program or activity conducted or funded by USDA (not all bases apply to all programs). Remedies and complaint filing deadlines vary by program or incident.\n\nPersons with disabilities who require alternative means of communication for program information (e.g., Braille, large print, audiotape, American Sign Language, etc.) should contact the responsible Agency or USDA's TARGET Center at (202) 720-2600 (voice and TTY) or contact USDA through the Federal Relay Service at (800) 877-8339. Additionally, program information may be made available in languages other than English.\n\nTo file a program discrimination complaint, complete the USDA Program Discrimination Complaint Form, AD-3027, found online at How to File a Program Discrimination Complaint and at any USDA office or write a letter addressed to USDA and provide in the letter all of the information requested in the form. To request a copy of the complaint form, call (866) 632-9992. Submit your completed form or letter to USDA by: (1) mail: U.S. Department of Agriculture, Office of the Assistant Secretary for Civil Rights, 1400 Independence Avenue, SW, Washington, D.C. 20250-9410; (2) fax: (202) 690-7442; or (3) email: program.intake@usda.gov.\n\nUSDA is an equal opportunity provider, employer, and lender.\n\nSource complaint-page address: https://www.usda.gov/oascr/how-to-file-a-program-discrimination-complaint\nSource email link target: mailto:program.intake@usda.gov. The current preview shows these destinations as text; clickable links remain an integration presentation gap.")
  civilRights: {};
}
