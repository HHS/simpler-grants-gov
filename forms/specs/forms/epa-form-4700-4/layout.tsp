import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.EPA47004;
@UI.layout(EPA47004)
model EPA47004Layout {
  @UI.label("Read instructions before completing this form")
  @doc("Instructions for EPA FORM 4700-4 (Rev. 04/2021) \n\nGeneral. Recipients of Federal financial assistance from the U.S. Environmental Protection Agency must comply with the following statutes and regulations.\nTitle VI of the Civil Rights Acts of 1964 provides that no person in the United States shall, on the grounds of race, color, or national origin, be excluded from participation in, be denied the benefits of, or be subjected to discrimination under any program or activity receiving Federal financial assistance. The Act goes on to explain that the statute shall not be construed to authorize action with respect to any employment practice of any employer, employment agency, or labor organization (except where the primary objective of the Federal financial assistance is to provide employment). Section 13 of the 1972 Amendments to the Federal Water Pollution Control Act provides that no person in the United States shall on the ground of sex, be excluded from participation in, be denied the benefits of, or be subjected to discrimination under the Federal Water Pollution Control Act, as amended. Employment discrimination on the basis of sex is prohibited in all such programs or activities. Section 504 of the Rehabilitation Act of 1973 provides that no otherwise qualified individual with a disability in the United States shall solely by reason of disability be excluded from participation in, be denied the benefits of, or be subjected to discrimination under any program or activity receiving Federal financial assistance. Employment discrimination on the basis of disability is prohibited in all such programs or activities. The Age Discrimination Act of 1975 provides that no person on the basis of age shall be excluded from participation under any program or activity receiving Federal financial assistance. Employment discrimination is not covered. Age discrimination in employment is prohibited by the Age Discrimination in Employment Act administered by the Equal Employment Opportunity Commission. Title IX of the Education Amendments of 1972 provides that no person in the United States on the basis of sex shall be excluded from participation in, be denied the benefits of, or be subjected to discrimination under any education program or activity receiving Federal financial assistance. Employment discrimination on the basis of sex is prohibited in all such education programs or activities. Note: an education program or activity is not limited to only those conducted by a formal institution. 40 C.F.R. Part 5 implements Title IX of the Education Amendments of 1972. 40 C.F.R. Part 7 implements Title VI of the Civil Rights Act of 1964, Section 13 of the 1972 Amendments to the Federal Water Pollution Control Act, and Section 504 of The Rehabilitation Act of 1973. \n\nItems \"Applicant\" means any entity that files an application or unsolicited proposal or otherwise requests EPA assistance. 40 C.F.R. §§ 5.105, 7.25. \"Recipient\" means any State or its political subdivision, any instrumentality of a State or its political subdivision, any public or private agency, institution, organizations, or other entity, or any person to which Federal financial assistance is extended directly or through another recipient, including any successor, assignee, or transferee of a recipient, but excluding the ultimate beneficiary of the assistance. 40 C.F.R. §§ 5.105, 7.25. \"Civil rights lawsuits and administrative complaints\" means any lawsuit or administrative complaint alleging discrimination on the basis of race, color, national origin, sex, age, or disability pending or decided against the applicant and/or entity which actually benefits from the grant, but excluding employment complaints not covered by 40 C.F.R. Parts 5 and 7. For example, if a city is the named applicant but the grant will actually benefit the Department of Sewage, civil rights lawsuits involving both the city and the Department of Sewage should be listed. \"Civil rights compliance review\" means: any federal agency-initiated investigation of a particular aspect of the applicant's and/or recipient's programs or activities to determine compliance with the federal non-discrimination laws. Submit this form with the original and required copies of applications, requests for extensions, requests for increase of funds, etc. Updates of information are all that are required after the initial application submission. If any item is not relevant to the project for which assistance is requested, write \"NA\" for \"Not Applicable.\" In the event applicant is uncertain about how to answer any questions, EPA program officials should be contacted for clarification.")
  instructions: {};

  @UI.label("Public burden statement from the DAT")
  @doc("Clicking displays: \nPublic Burden Statement: \n\nThis collection of information is approved by OMB under the Paperwork Reduction Act, 44 U.S.C. 3501 et seq. (OMB Control No. 2030-0020). Responses to this collection of information are required to obtain an assistance agreement (40 CFR Part 30, 40 CFR Part 31, and 40 CFR Part 33 for awards made prior to December 26, 2014, and 2 CFR 200, 2 CFR 1500, and 40 CFR Part 33 for awards made after December 26, 2014). An agency may not conduct or sponsor, and a person is not required to respond to, a collection of information unless it displays a currently valid OMB control number. The public reporting and recordkeeping burden for this collection of information is estimated to be 0.5 hours per response. Send comments on the Agency’s need for this information, the accuracy of the provided burden estimates and any suggested methods for minimizing respondent burden to the Regulatory Support Division Director, U.S. Environmental Protection Agency (2821T), 1200 Pennsylvania Ave., NW, Washington, D.C. 20460. Include the OMB control number in any correspondence. Do not send the completed form to this address.\n\nSource DAT Help Tip (separate wording):\n\nView Burden Statement\n\nEPA estimates public reporting burden for the preparation of this form to average 30 minutes per response. This estimate includes the time for reviewing instructions, gathering and maintaining the data needed and completing and reviewing the form. Send comments regarding the burden estimate, including suggestions for reducing this burden, to U.S. EPA, Attn: Collection Strategies Division (MC 2822T), Office of Information Collection, 1200 Pennsylvania Ave., NW, Washington, D.C. 20460; and to the Office of Information and Regulatory Affairs, Office of Management and Budget, Washington, D.C. 20503.\nThe information on this form is required to enable the U.S. Environmental Protection Agency to determine whether applicants and prospective recipients are developing projects, programs and activities on a nondiscriminatory basis as required by the above statutes and regulations.")
  burden: {};

  @UI.label("I. A. Applicant/Recipient (Name, Address, City, State, Zip Code)")
  section0: {
    applicantName: EPA47004.applicantName;

    @UI.label("Applicant address")
    @UI.field(EPA47004.applicantAddress)
    applicantAddress: {
      address: EPA47004.applicantAddress::type.address;
      city: EPA47004.applicantAddress::type.city;
      state: EPA47004.applicantAddress::type.state;
      zipCode: EPA47004.applicantAddress::type.zipCode;
    };
  };

  @UI.label("I. B. Unique Entity Identifier (UEI)")
  section1: {
    samUei: EPA47004.samUei;
  };

  @UI.label("I. C. Applicant/Recipient Point of Contact")
  section2: {
    pointOfContactName: EPA47004.pointOfContactName;
    pointOfContactPhoneNumber: EPA47004.pointOfContactPhoneNumber;
    pointOfContactEmail: EPA47004.pointOfContactEmail;
    pointOfContactTitle: EPA47004.pointOfContactTitle;
  };

  @UI.label("II")
  section3: {
    federalFinancialAssistance: EPA47004.federalFinancialAssistance;
  };

  @UI.label("III")
  section4: {
    civilRightsLawsuitQuestion1: EPA47004.civilRightsLawsuitQuestion1;
  };

  @UI.label("IV")
  section5: {
    civilRightsLawsuitQuestion2: EPA47004.civilRightsLawsuitQuestion2;
  };

  @UI.label("V")
  section6: {
    civilRightsLawsuitQuestion3: EPA47004.civilRightsLawsuitQuestion3;
  };

  @UI.label("VI")
  section7: {
    constructionFederalAssistance: EPA47004.constructionFederalAssistance;
    constructionNewFacilities: EPA47004.constructionNewFacilities;
    constructionNewFacilitiesExplanation: EPA47004.constructionNewFacilitiesExplanation;
  };

  @UI.label("VII")
  section8: {
    notice1: EPA47004.notice1;
    notice2: EPA47004.notice2;
    notice3: EPA47004.notice3;
    notice4: EPA47004.notice4;
  };

  @UI.label("VIII")
  section9: {
    demographicData: EPA47004.demographicData;
  };

  @UI.label("IX")
  section10: {
    policy: EPA47004.policy;
  };

  @UI.label("X")
  section11: {
    policyExplanation: EPA47004.policyExplanation;
  };

  @UI.label("XI")
  section12: {
    programExplanation: EPA47004.programExplanation;
  };

  @UI.label("For the Applicant/Recipient")
  @doc("I certify that the statements I have made on this form and all attachments thereto are true, accurate and complete.  I acknowledge that any knowingly false or misleading statement may be punishable by fine or imprisonment or both under applicable law.  I assure that I will fully comply with all applicable civil rights statutes and EPA regulations.")
  @UI.field(EPA47004.applicantSignature)
  applicantSignature: {
    aorSignature: EPA47004.applicantSignature::type.aorSignature;
    aorTitle: EPA47004.applicantSignature::type.aorTitle;
    submittedDate: EPA47004.applicantSignature::type.submittedDate;
  };

  @UI.label("For the U.S. Environmental Protection Agency - agency-use source section")
  @doc("The following source section is completed by EPA, not by the applicant. It has no applicant JSON/XSD answers.\n\nFor the U.S. Environmental Protection Agency\n\nI have reviewed the information provided by the applicant/recipient and hereby certify that the applicant/recipient has submitted all preaward compliance information required by 40 C.F.R. Parts 5 and 7; that based on the information submitted, this application satisfies the preaward provisions of 40 C.F.R. Parts 5 and 7; and that the applicant has given assurance that it will fully comply with all applicable civil rights statures and EPA regulations.\n\nA. Signature of Authorized EPA Official\n\nB. Title of Authorized Official\n\nC. Date")
  agencyReview: {};
}
