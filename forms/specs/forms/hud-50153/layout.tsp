import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.HUD50153;
@UI.layout(HUD50153Certification)
model HUD50153CertificationLayout {
  @UI.label("Applicant and proposed community")
  @doc("View Burden Statement\n\nCertification of Consistency with Promise Zone Goals and Implementation\n\nU.S. Department of Housing and Urban Development \n\nOMB Number: 2501-0044\nExpiration Date: 02/28/2027\n\nI/We, the undersigned, certify under penalty of perjury that the information provided below is true, correct, and accurate. Warning: Anyone who knowingly submits a false claim or makes a false statement is subject to criminal and/or civil penalties, including confinement for up to 5 years, fines, and civil and administrative penalties (18 U.S.C §§ 287, 1001, 1010, 1012, 1014; 31 U.S.C. § 3729, 3802; 24 CFR § 28.10(b)(1)(iii)).\n\nI/We, the undersigned, certify that the proposed activities/projects in the application are consistent with the goals of the Promise Zones and the revitalization strategies detailed in my Promise Zone application. (Complete the fields below.)\n")
  section0: {
    applicantName: HUD50153Certification.applicantName;
    federalProgramNumber: HUD50153Certification.federalProgramNumber;
    federalProgramTitle: HUD50153Certification.federalProgramTitle;
    designatedCommunity: HUD50153Certification.designatedCommunity;
  };

  @UI.label("Geographic criteria")
  @doc("Please note that projects which substantially and directly benefit Promise Zone residents but which are not within the boundaries of the Promise Zone may be considered. Agencies will make clear the acceptable definition of substantially and directly beneficial in the program’s award and funding announcement.\n\nI further certify that:\n\n(1) The applicant is engaged in activities, that in consultation with the Promise Zone designee, further the purposes of the Promise Zones initiative; and\n(2) The applicant’s proposed activities either directly reflect the goals of the Promise Zone or will result in the delivery of services that are consistent with the goals of the Promise Zones initiative; and\n(3) The applicant has committed to maintain an on-going relationship with the Promise Zone designee for the purposes of being part of the implementation processes in the designated area.")
  section1: {
    geographicCriteria: HUD50153Certification.geographicCriteria;
  };

  @UI.label("Promise Zone official and submission")
  @doc("I further certify that:\n\n(1) The applicant is engaged in activities, that in consultation with the Promise Zone designee, further the purposes of the Promise Zones initiative; and\n(2) The applicant’s proposed activities either directly reflect the goals of the Promise Zone or will result in the delivery of services that are consistent with the goals of the Promise Zones initiative; and\n(3) The applicant has committed to maintain an on-going relationship with the Promise Zone designee for the purposes of being part of the implementation processes in the designated area.\n\nPromise Zone Official authorized to certify the project meets the above criteria to receive bonus points:\n\nform HUD 50153 (09/2014)")
  section2: {
    promiseZoneOfficial: HUD50153Certification.promiseZoneOfficial;
    signature: HUD50153Certification.signature;
    signatureDate: HUD50153Certification.signatureDate;
  };
}
